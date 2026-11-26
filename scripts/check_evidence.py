#!/usr/bin/env python3
"""Re-check the evidence behind confirmed rows of data/raw/catalogue.jsonl against the live sources.

  python3 scripts/check_evidence.py quotes [--tool PLEXOS] [--limit N]   quote still on the source page? tool named?
  python3 scripts/check_evidence.py links [--apply]                       dead source links; --apply writes archive_url
  python3 scripts/check_evidence.py dates [--limit N]                     date evidence for undated rows (for a reader)

Reports go to --out (JSONL, default research/evidence_<command>.jsonl, not committed) and runs resume from it.
Only `links --apply` edits the dataset. Standard library only; PDFs need `pdftotext` (poppler) on PATH.

Why: every claim in the dataset must stay checkable. An LLM reader (any model) only judges compact excerpts from
`dates`, and its answer must quote a passage a script can find again; `quotes` re-checks that for the whole dataset.
"""
import argparse
import concurrent.futures as cf
import html
import json
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "catalogue.jsonl"
UA = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0 (GridLens evidence check)"

# Names a source may use for a tool. Ambiguous words are matched case-sensitively (LEAP, TIMES, SDDP: the PSR tool
# is spelled in capitals, "sddp" in lower case is usually the algorithm).
ALIASES = {
    "PLEXOS": r"(?i)plexos", "PyPSA": r"(?i)pypsa", "SDDP": r"SDDP", "Bid3": r"(?i)bid ?3",
    "PROMOD": r"(?i)promod", "PSS/E": r"(?i)pss.?e\b", "PowerFactory": r"(?i)power ?factory|digsilent",
    "PSCAD": r"(?i)pscad|emtdc", "LEAP": r"\bLEAP\b|(?i:long.range energy alternatives)", "TIMES": r"\b(TIMES|MARKAL|TIAM)\b",
    "Sienna": r"(?i)\bsienna\b|powersimulations|powersystems\.jl", "Balmorel": r"(?i)balmorel", "Antares": r"(?i)antares",
    "PowSyBl": r"(?i)powsybl", "OSeMOSYS": r"(?i)osemosys|clews|clicsand|momani", "pandapower": r"(?i)panda ?power",
    "Calliope": r"(?i)\bcalliope\b", "SERVM": r"(?i)servm", "OpenDSS": r"(?i)opendss",
}
BOT_WALL = {401, 403, 429}
YEAR = re.compile(r"\b(19[89]\d|20[0-4]\d)\b")


def load_rows():
    return [json.loads(line) for line in RAW.open(encoding="utf-8") if line.strip()]


def fetch(url, timeout=30, limit=30_000_000):
    """(status, content_type, body). Status is an int, or an exception name when there was no HTTP answer."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.headers.get("Content-Type", ""), r.read(limit)
    except urllib.error.HTTPError as e:
        return e.code, "", b""
    except Exception as e:  # noqa: BLE001 - any network failure is a result here
        return type(e).__name__, "", b""


class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts, self.meta, self._skip = [], {}, 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self._skip += 1
        if tag == "meta":
            a = dict(attrs)
            key = (a.get("property") or a.get("name") or a.get("itemprop") or "").lower()
            if key and a.get("content"):
                self.meta.setdefault(key, a["content"])

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def page_text(body, content_type=""):
    """(text, meta) of an HTML page or PDF. PDFs need pdftotext; without it the text is empty."""
    if body[:4] == b"%PDF" or "pdf" in content_type:
        meta = {}
        m = re.search(rb"/CreationDate\s*\(D:(\d{4})(\d{2})?(\d{2})?", body)
        if m:
            meta["pdf_created"] = "-".join(x.decode() for x in m.groups() if x)
        if not shutil.which("pdftotext"):
            return "", meta
        out = subprocess.run(["pdftotext", "-q", "-", "-"], input=body, capture_output=True, timeout=120)
        return out.stdout.decode("utf-8", "replace"), meta
    p = _Text()
    p.feed(body.decode("utf-8", "replace"))
    return html.unescape(" ".join(p.parts)), p.meta


def normalize(s):
    """Lower case words and digits only: drops markdown (links keep their text), symbols, quotes and dashes, which
    differ between a stored quote and the page as fetched."""
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s or "")
    return re.sub(r"[\W_]+", " ", s).lower().strip()


def quote_on_page(quote, text):
    """True when the quote is on the page; long quotes broken by PDF line wraps need 3 of their 4 quarters."""
    q, t = normalize(quote), normalize(text)
    if not q or not t:
        return False
    if q in t:
        return True
    parts = [q[i * len(q) // 4:(i + 1) * len(q) // 4].strip() for i in range(4)]
    return len(q) > 80 and sum(p in t for p in parts if p) >= 3


def names_tool(tool, text):
    return bool(re.search(ALIASES.get(tool, re.escape(tool)), text or ""))


def dates_in(meta, url):
    """Candidate dates from page metadata and the URL; a reader decides which, if any, is the study's date."""
    keys = ("citation_publication_date", "citation_date", "dc.date", "dcterms.issued", "article:published_time",
            "datepublished", "pdf_created", "date")
    found = {k: meta[k][:10] for k in keys if meta.get(k)}
    m = re.search(r"/(20[0-4]\d|19[89]\d)[/-](0[1-9]|1[0-2])(?:[/-]([0-3]\d))?/", url)
    if m:
        found["url"] = "-".join(x for x in m.groups() if x)
    return found


def excerpt(text, tool, width=350, limit=3000):
    """Start of the page plus windows around the tool name and year mentions."""
    text = re.sub(r"\s+", " ", text or "")
    spans = [(0, 700)]
    for m in list(re.finditer(ALIASES.get(tool, re.escape(tool)), text))[:2]:
        spans.append((max(0, m.start() - width), m.end() + width))
    for m in list(YEAR.finditer(text))[:6]:
        spans.append((max(0, m.start() - 120), m.end() + 120))
    merged = []
    for s, e in sorted(spans):
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    return " [...] ".join(text[s:e] for s, e in merged)[:limit]


def crossref_date(url):
    m = re.search(r"(10\.\d{4,9}/[^\s?#]+)", urllib.parse.unquote(url))
    if not m:
        return None
    status, _, body = fetch(f"https://api.crossref.org/works/{urllib.parse.quote(m.group(1))}", timeout=20)
    if status != 200:
        return None
    msg = json.loads(body).get("message", {})
    parts = (msg.get("published-print") or msg.get("published-online") or msg.get("issued") or {}).get("date-parts", [[None]])[0]
    return "-".join(f"{p:02d}" if i else str(p) for i, p in enumerate(parts) if p) or None


def archive_copy(url):
    status, _, body = fetch("https://archive.org/wayback/available?url=" + urllib.parse.quote(url, safe=""), timeout=30)
    if status != 200:
        return None
    snap = json.loads(body).get("archived_snapshots", {}).get("closest") or {}
    return snap["url"].replace("http://", "https://", 1) if snap.get("available") else None


# --- commands -------------------------------------------------------------------------------------------------


def check_quote(row):
    url = (row.get("source_url") or "").strip()
    status, ctype, body = fetch(url)
    text, _ = page_text(body, ctype) if body else ("", {})
    quote = row.get("exact_snippet_or_quote") or ""
    # Under ~1,000 characters the page is usually a script shell, cookie wall or redirect stub, not the document.
    res = {"key": row["id"], "tool": row["tool_name"], "url": url, "status": status, "fetched": len(text.strip()) > 1000}
    if res["fetched"]:
        res["quote_on_page"] = quote_on_page(quote, text) if quote else None
        res["tool_on_page"] = names_tool(row["tool_name"], text)
    res["tool_in_quote"] = names_tool(row["tool_name"], quote)
    return res


def check_link(url):
    status, _, _ = fetch(url)
    dead = not isinstance(status, int) or (status >= 400 and status not in BOT_WALL)
    return {"key": url, "status": status, "dead": dead, "archive": archive_copy(url) if dead else None}


def date_evidence(row):
    url = (row.get("source_url") or "").strip()
    status, ctype, body = fetch(url)
    text, meta = page_text(body, ctype) if body else ("", {})
    return {"key": row["id"], "tool": row["tool_name"], "title": (row.get("project_title") or row.get("source_title") or "")[:200],
            "url": url, "crossref": crossref_date(url), "candidates": dates_in(meta, url), "excerpt": excerpt(text, row["tool_name"])}


def run(items, fn, out, workers):
    done = set()
    if out.exists():
        done = {json.loads(line)["key"] for line in out.open(encoding="utf-8") if line.strip()}
    todo = [i for i in items if (i if isinstance(i, str) else i["id"]) not in done]
    print(f"{len(items)} to check, {len(todo)} not yet in {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}", file=sys.stderr)
    with cf.ThreadPoolExecutor(workers) as ex, out.open("a", encoding="utf-8") as f:
        for n, res in enumerate(ex.map(fn, todo), 1):
            f.write(json.dumps(res, ensure_ascii=False) + "\n")
            if n % 200 == 0:
                print(n, file=sys.stderr)
    return [json.loads(line) for line in out.open(encoding="utf-8") if line.strip()]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["quotes", "links", "dates"])
    ap.add_argument("--tool")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--apply", action="store_true", help="links: write archive_url for dead links that have a copy")
    a = ap.parse_args(argv)
    out = a.out or ROOT / "research" / f"evidence_{a.command}.jsonl"
    rows = load_rows()
    live = [r for r in rows if r.get("status") == "confirmed" and (r.get("source_url") or "").startswith("http")
            and (not a.tool or r["tool_name"] == a.tool)]

    if a.command == "quotes":
        res = run(live[:a.limit], check_quote, out, a.workers)
        fetched = [r for r in res if r["fetched"]]
        print(f"fetched {len(fetched)}/{len(res)}; quote not found {sum(r.get('quote_on_page') is False for r in fetched)}; "
              f"tool not named in quote or page {sum(not r['tool_in_quote'] and not r.get('tool_on_page') for r in fetched)}")
    elif a.command == "links":
        urls = sorted({r["source_url"].strip() for r in live})[:a.limit]
        res = run(urls, check_link, out, a.workers)
        dead = {r["key"]: r["archive"] for r in res if r["dead"]}
        print(f"links {len(res)}; dead {len(dead)}, with an archived copy {sum(1 for v in dead.values() if v)}; "
              f"bot walls (not counted as dead) {sum(1 for r in res if r['status'] in BOT_WALL)}")
        if a.apply:
            n = 0
            for r in rows:
                copy = dead.get((r.get("source_url") or "").strip())
                if copy and not r.get("archive_url"):
                    r["archive_url"] = copy
                    n += 1
            RAW.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
            print(f"archive_url written on {n} rows; run npm run sync-data")
    else:
        undated = [r for r in live if not (r.get("study_date") or r.get("study_year") or r.get("source_date"))]
        res = run(undated[:a.limit], date_evidence, out, a.workers)
        print(f"evidence for {len(res)} undated rows in {out}; a reader picks the study date with a verbatim passage "
              "(rules: research/RESEARCH_PLAYBOOK.md, 'Checking evidence at scale')")


if __name__ == "__main__":
    main()
