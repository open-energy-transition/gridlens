#!/usr/bin/env python3
"""Audit the published dataset (src/data/catalogue.json, after sync) for the data errors that recurred while
building it. Prints a count per check; --out DIR writes one TSV per check for review; --strict exits 1 when a
check that must stay at zero has findings (CI runs it this way).

Must stay at zero (--strict): a tool's vendor listed as its user, a tool category the tool does not have, a
study year in the future, a project title that is a URL, file name or placeholder.
For review: evidence that never names the tool, projects whose sources describe different studies in different
countries, organizations typed 'other', grid operators and regulators with a single project (search gaps).
"""
import argparse
import collections
import datetime
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_evidence import ALIASES, names_tool  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
STRICT = ("category_out_of_scope", "future_year", "placeholder_title")
JUNK_TITLE = re.compile(r"^(https?://|www\.)|\.(pdf|docx?|pptx?|xlsx?)\b|^Microsoft (Word|PowerPoint)|^Untitled|^\S+\.\S+/\S+"
                        r"|^(Home|News|Noticias|Slide \d+|PowerPoint Presentation|Presentation|Document)$", re.I)
GRID = {"utility_tso", "utility_iso_rto", "utility_distribution", "government_regulator"}


def load_tools():
    return {t["name"]: t for t in json.loads((ROOT / "src/data/tools.json").read_text(encoding="utf-8"))}


def audit(projects, tools, year_now):
    found = collections.defaultdict(list)
    single = collections.Counter()
    for p in projects:
        tool, pid = p["tool_name"], p["project_id"]
        vendor = (tools.get(tool, {}).get("vendor") or "").lower()
        for o in p["organizations"]:
            # whole words only: the OpenDSS vendor "EPRI" is not "KEPRI"
            if vendor and " community" not in vendor and re.search(rf"\b{re.escape(vendor)}\b", o["name"].lower()) and o["role"] != "subject_of_study":
                found["vendor_as_user"].append((tool, pid, o["name"]))
            if o.get("institution_category") == "other":
                found["type_other"].append((tool, pid, o["name"]))
            if o.get("institution_category") in GRID and o["role"] != "subject_of_study":
                single[o["name"]] += 1
        allowed = set(tools.get(tool, {}).get("categories") or [])
        cats = {c for c in (p.get("tool_category") or "").split("; ") if c and c != "unspecified"}
        if allowed and cats - allowed:
            found["category_out_of_scope"].append((tool, pid, p.get("tool_category")))
        if p.get("year") and int(p["year"]) > year_now:
            found["future_year"].append((tool, pid, p["year"]))
        title = (p.get("project_title") or "").strip()
        if not title or JUNK_TITLE.search(title):
            found["placeholder_title"].append((tool, pid, title[:100]))
        evidence = " ".join((s.get("quote") or "") + " " + (s.get("title") or "") for s in p.get("sources") or [])
        if tool in ALIASES and not names_tool(tool, evidence):
            found["tool_not_in_evidence"].append((tool, pid, evidence[:120]))
        titles = {re.sub(r"\W+", " ", (s.get("title") or "").lower())[:40] for s in p.get("sources") or []}
        if len(titles) > 1 and len(p.get("countries") or []) > 1:
            found["mixed_project"].append((tool, pid, ", ".join(p["countries"][:5])))
    found["single_project_grid_org"] = [("", "", n) for n, c in single.items() if c == 1]
    return found


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", type=Path, help="write one TSV per check to this directory")
    ap.add_argument("--strict", action="store_true", help="exit 1 when a must-be-zero check has findings")
    a = ap.parse_args(argv)
    projects = json.loads((ROOT / "src/data/catalogue.json").read_text(encoding="utf-8"))
    found = audit(projects, load_tools(), datetime.date.today().year)
    names = list(STRICT) + ["tool_not_in_evidence", "mixed_project", "type_other", "single_project_grid_org"]
    for name in names:
        mark = " (must be 0)" if name in STRICT else ""
        print(f"{name}: {len(found[name])}{mark}")
        for row in found[name][:5] if name in STRICT else []:
            print("   ", " | ".join(str(x) for x in row))
    if a.out:
        a.out.mkdir(parents=True, exist_ok=True)
        for name in names:
            (a.out / f"{name}.tsv").write_text("".join("\t".join(str(x) for x in r) + "\n" for r in found[name]), encoding="utf-8")
    if a.strict and any(found[n] for n in STRICT):
        sys.exit(1)


if __name__ == "__main__":
    main()
