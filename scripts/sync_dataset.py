#!/usr/bin/env python3
"""
Regenerate the app's merged dataset from data/raw/catalogue.jsonl.

This is THE pipeline step between "research found a new organization" and
"the app shows it". Run this after editing data/raw/catalogue.jsonl (by
hand, by a script, or by an LLM agent), then review the diff, then rebuild
the app.

Input:
  data/raw/catalogue.jsonl           One JSON object per line -- the single
                                      source of truth for every organization
                                      in the dataset, across every tool. See
                                      data/DATA_SCHEMA.md / data/schema.json
                                      for the field contract.

Outputs:
  data/catalogue_merged.csv          Human-readable merged dataset in the
                                      app's display schema -- generated,
                                      never hand-edited.
  src/data/catalogue.json            What App.tsx actually imports (a JSON
                                      mirror of catalogue_merged.csv, kept in
                                      sync by this script).

Usage:
  python3 scripts/sync_dataset.py
  npm run sync-data   # same thing, via the package.json script alias

Always run scripts/validate_dataset.py BEFORE this, so malformed rows don't
make it into the merged/app dataset.
"""
import csv
import datetime
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
CATALOGUE_RAW = ROOT / "data" / "raw" / "catalogue.jsonl"
MERGED_CSV_OUT = ROOT / "data" / "catalogue_merged.csv"
APP_JSON_OUT = ROOT / "src" / "data" / "catalogue.json"

# The app only ever reads these fields (src/types.ts's CatalogueRecord) --
# everything else in catalogue.jsonl (id, tool_explicitly_named, status,
# historical_or_current, batch_id) is research/provenance metadata.
APP_SCHEMA = [
    "country_label", "institution_name", "institution_category", "role", "official_website", "tool_name",
    "tool_category", "use_case", "summary", "evidence_strength", "source_type", "source_group",
    "source_title", "source_date", "source_link", "exact_snippet_or_quote",
    "why_it_supports_the_claim", "notes", "dataset_origin",
    "decision_type", "decision_basis",
    "project_id", "project_title", "organizations", "countries", "geo_scope", "region_label", "sources", "year", "date",
]

# The dashboard tracks only the tools listed in src/data/tools.json; rows for
# other tools stay in catalogue.jsonl but are not published.
TRACKED_TOOLS = {t["name"] for t in json.loads((ROOT / "src" / "data" / "tools.json").read_text(encoding="utf-8"))}

# Academic & research vs industry & government sources, from the source type
# and the publishing site.
ACADEMIC_HOSTS = re.compile(
    r"(^|\.)(doi\.org|arxiv\.org|mdpi\.com|sciencedirect\.com|researchgate\.net|springer\.com|"
    r"link\.springer\.com|ieee\.org|ieeexplore\.ieee\.org|wiley\.com|tandfonline\.com|iop\.org|"
    r"zenodo\.org|ssrn\.com|osti\.gov|lbl\.gov|nrel\.gov|hal\.science|semanticscholar\.org|"
    r"frontiersin\.org|nature\.com|cell\.com|elsevier\.com|openreview\.net|scholar\.google\.com)$"
    r"|\.edu$|\.edu\.[a-z]{2}$|\.ac\.[a-z]{2}$"
)


def source_group(row) -> str:
    if (row.get("source_type") or "").strip() == "academic_paper":
        return "academic"
    host = urlparse((row.get("source_url") or "").split(";")[0].strip()).netloc.lower().split(":")[0]
    host = host[4:] if host.startswith("www.") else host
    return "academic" if host and ACADEMIC_HOSTS.search(host) else "industry"

# --- Grid decision classification -------------------------------------
#
# "decision_type" answers "what grid decision is this tool used for?" --
# a different axis from tool_category (the kind of modelling, e.g.
# production_cost) or role (the organization's relationship to the
# tool, e.g. direct_user/commissioner). See data/DATA_SCHEMA.md for the
# full taxonomy and rationale.
#
# A contributor can set decision_type directly in catalogue.jsonl when
# they have real evidence for it (leave decision_basis blank -- this
# script fills it in as "documented"). If decision_type is left blank,
# this script infers one automatically and marks decision_basis
# "inferred" -- from the real use_case text when it's genuinely
# descriptive, otherwise (a generic role-based sentence, no institution
# category) from the organization's sector as a last-resort proxy.
#
# Keep this honest distinction visible in the UI -- don't present
# "inferred" the same way as "documented".

# Keyword rules for rows without a decision_type; first match wins, in the tie-break order of
# data/DATA_SCHEMA.md. Reviewed rows carry decision_type and decision_basis from the evidence.
DECISION_TYPE_TEXT_RULES = [
    ("Grid Connection & Stability", [
        "electromagnetic transient", " emt ", "emt stud", "emt model", "stability", "grid-code", "grid code",
        "connection stud", "grid connection", "compliance", "protection", "short circuit", "short-circuit",
        "harmonic", "dynamic model", "rms ", "sub-synchronous", "subsynchronous",
    ]),
    ("Resource Adequacy & Security of Supply", [
        "resource adequacy", "adequacy", "loss of load", "loss-of-load", "lole", "elcc", "capacity credit",
        "reserve margin", "security of supply", "reliability assessment",
    ]),
    ("Transmission & Distribution Planning", [
        "transmission", "network planning", "interconnect", "distribution planning", "distribution grid",
        "distribution network", "grid planning", "grid expansion", "network development", "hosting capacity",
        "grid reinforcement", "load flow", "power flow",
    ]),
    ("Generation & Storage Investment", [
        "capacity expansion", "integrated resource plan", " irp", "generation expansion", "expansion planning",
        "investment planning", "generation planning", "capacity planning", "least-cost", "least cost",
        "storage sizing", "prodesen", "igcep",
    ]),
    ("Long-term Pathways & Climate Targets", [
        "net zero", "net-zero", "decarbon", "climate neutral", "carbon neutral", "pathway", "ndc",
        "nationally determined", "energy transition", "long-term scenario", "energy outlook", "energy plan",
        "100% renewable", "emission reduction", "low-carbon", "low carbon",
    ]),
    ("Markets & Prices", [
        "price", "market simulation", "market design", "market modelling", "market modeling", "electricity market",
        "auction", "bidding", "trading", "revenue",
    ]),
    ("System Operation & Flexibility", [
        "unit commitment", "dispatch", "scheduling", "operation planning", "operational planning", "day-ahead",
        "production cost", "flexibility", "curtailment", "balancing", "reserves", "hydro-thermal",
    ]),
    ("Policy & Regulation", ["regulat", "policy", "tariff", "subsid", "carbon tax", "carbon price"]),
]

DECISION_TYPE_FALLBACK = "Not specified"

# Role-based use_case sentences only kick in when a contributor hasn't
# written a specific one -- same fallback text PLEXOS-catalogue rows have
# always used, now generalized to apply regardless of tool_name.
ROLE_USE_CASE_FALLBACK = {
    "direct_user": "Uses the tool directly for its own grid/market planning or operations.",
    "commissioner": "Commissioned a tool-based study or engagement (did not model it directly).",
    "consultant_modeler": "Built or ran the model as a consultant/vendor for another organization.",
    "research_user": "Uses the tool in an academic/research capacity (co-equal with the commissioning org).",
    "subject_of_study": "Passively modeled as the subject of someone else's study, not a user itself.",
    "qa_reviewer": "Reviewed or quality-assured a tool-based study for another organization.",
}

# A use_case string that's just the generic fallback sentence (for ANY
# role) carries no real information to classify from -- fall back to
# sector-based inference instead of keyword-matching generic phrasing.
GENERIC_USE_CASE_TEXTS = set(ROLE_USE_CASE_FALLBACK.values())


def classify_decision_from_text(use_case):
    t = (use_case or "").lower()
    for label, keywords in DECISION_TYPE_TEXT_RULES:
        if any(kw in t for kw in keywords):
            return label
    return None


def resolve_decision(row):
    """Return (decision_type, decision_basis) for one raw record: the reviewed decision when the row has one,
    else keyword rules on a specific use_case ("documented" text, possibly "Not specified")."""
    decision_type = (row.get("decision_type") or "").strip()
    if decision_type:
        return decision_type, (row.get("decision_basis") or "documented").strip()
    use_case = (row.get("use_case") or "").strip()
    if use_case and use_case not in GENERIC_USE_CASE_TEXTS:
        return (classify_decision_from_text(use_case) or DECISION_TYPE_FALLBACK), "documented"
    return DECISION_TYPE_FALLBACK, "inferred"


def load_jsonl(path):
    rows = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def map_record(row):
    use_case = (row.get("use_case") or "").strip()
    if not use_case:
        use_case = ROLE_USE_CASE_FALLBACK.get((row.get("role") or "").strip(), "")
    decision_type, decision_basis = resolve_decision(row)
    return {
        "country_label": row.get("country_label", "").strip(),
        "institution_name": row.get("institution_name", "").strip(),
        "institution_category": row.get("institution_category", "").strip(),
        "role": row.get("role", "").strip(),
        "official_website": row.get("official_website", "").strip(),
        "tool_name": row.get("tool_name", "").strip(),
        "tool_category": row.get("tool_category", "").strip(),
        "use_case": use_case,
        "summary": (row.get("summary") or "").strip(),
        "evidence_strength": row.get("evidence_strength", "").strip() or "MEDIUM",
        "source_type": row.get("source_type", "").strip(),
        "source_group": source_group(row),
        "source_title": row.get("source_title", "").strip(),
        "source_date": row.get("source_date", "").strip(),
        "source_link": row.get("source_url", "").strip(),
        "exact_snippet_or_quote": row.get("exact_snippet_or_quote", "").strip(),
        "why_it_supports_the_claim": row.get("why_it_supports_the_claim", "").strip(),
        "notes": row.get("notes", "").strip(),
        "dataset_origin": row.get("batch_id", "").strip(),
        "decision_type": decision_type,
        "decision_basis": decision_basis,
    }


# --- Projects ---------------------------------------------------------
#
# Raw rows are (organization, project) evidence; the app shows one record
# per project. Rows sharing project_id and tool_name are one project; a row
# without project_id is a project of its own. The flat fields of a project
# come from its lead row (highest impact, then strongest evidence), so a
# project reads like a record but also lists every organization, country
# and source.

GLOBAL_LABEL = re.compile(r"^(global|international|world)", re.I)
REGION_LABEL = re.compile(r"^(european union|europe|pan-european|multi-country|africa|asia|latin america|middle east)"
                          r"|[/;]", re.I)
DECISION_MAKERS = {"utility_tso", "utility_iso_rto", "utility_distribution", "utility_generation",
                   "energy_company_diversified", "project_developer", "government_regulator", "government_agency"}
RESEARCH = {"academic_research", "think_tank"}
EVIDENCE_RANK = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
CATEGORY_ORDER = ["capacity_expansion", "production_cost", "power_flow_dynamics", "other", "unspecified"]


COUNTRY_NAME = re.compile(r"^[A-Z][\w .'’-]{1,40}$")


def label_scope(label):
    if GLOBAL_LABEL.search(label):
        return "global"
    return "national" if COUNTRY_NAME.match(label) and not REGION_LABEL.search(label) else "multi_country"


def label_countries(label):
    """Countries named in a label: "Spain" -> [Spain]; "Albania, Serbia (regional model)" -> [Albania, Serbia]."""
    bare = re.sub(r"\([^)]*\)", "", label)
    if label_scope(label) == "national":
        return [label]
    parts = [p.strip() for p in re.split(r"[,/;]", bare)]
    return [p for p in parts if p in KNOWN_COUNTRIES]


# Country names used as a national label anywhere in the data (set in main()).
KNOWN_COUNTRIES = set()


def impact_rank(row):
    """Mirrors src/lib/impact.ts: decision-makers, then advisers, then research and subjects of study."""
    cat = (row.get("institution_category") or "").strip()
    if (row.get("role") or "").strip() == "subject_of_study":
        return 2
    return 0 if cat in DECISION_MAKERS else 2 if cat in RESEARCH else 1


def project_record(rows):
    rows = sorted(rows, key=lambda r: (impact_rank(r), EVIDENCE_RANK.get((r.get("evidence_strength") or "").strip(), 1),
                                       r.get("id", "")))
    lead = rows[0]
    labels = [(r.get("country_label") or "").strip() for r in rows]
    # The countries a study models; without them, the countries the rows are filed under.
    studied = [c.strip() for r in rows for c in r.get("study_countries") or [] if c.strip()]
    # A study that names its region but not its countries covers the region, not its partners' home countries.
    regional = any((r.get("study_region") or "").strip() for r in rows)
    countries = list(dict.fromkeys(studied or ([] if regional else [c for l in labels for c in label_countries(l)])))
    regions = [l for l in labels if l and label_scope(l) != "national"]
    if any(GLOBAL_LABEL.search(p.strip()) for l in labels for p in l.split("/")):
        regions.insert(0, "Global")
    scopes = {(r.get("geo_scope") or "").strip() for r in rows} - {""} or {label_scope(l) for l in labels if l}
    if "global" in scopes:
        geo_scope = "global"
    elif "multi_country" in scopes or len(countries) > 1:
        geo_scope = "multi_country"
    else:
        geo_scope = "national"
    named = [(r.get("study_region") or "").strip() for r in rows if (r.get("study_region") or "").strip()]
    region = (named + regions)[0] if (named or regions) and geo_scope != "national" else ""
    orgs, sources = {}, {}
    for r in rows:
        name = (r.get("institution_name") or "").strip()
        orgs.setdefault(name, {"name": name, "role": (r.get("role") or "").strip(),
                               "institution_category": (r.get("institution_category") or "").strip(),
                               "country_label": (r.get("country_label") or "").strip(),
                               "website": (r.get("official_website") or "").strip()})
        link = (r.get("source_url") or "").strip()
        sources.setdefault(link, {"title": (r.get("source_title") or "").strip(), "date": (r.get("source_date") or "").strip(),
                                  "link": link, "quote": (r.get("exact_snippet_or_quote") or "").strip(),
                                  "source_type": (r.get("source_type") or "").strip()})
    cats = {c.strip() for r in rows for c in (r.get("tool_category") or "").split(";") if c.strip()}
    if len(cats) > 1:
        cats.discard("unspecified")
    rec = map_record(lead)
    rec.update(
        country_label=countries[0] if geo_scope == "national" and countries else region or "Multi-country",
        tool_category="; ".join(sorted(cats, key=lambda c: CATEGORY_ORDER.index(c) if c in CATEGORY_ORDER else 99)),
        evidence_strength=min((r.get("evidence_strength") or "MEDIUM" for r in rows), key=lambda e: EVIDENCE_RANK.get(e, 1)),
        project_id=(lead.get("project_id") or lead.get("id") or "").strip(),
        project_title=next(((r.get("project_title") or "").strip() for r in rows if (r.get("project_title") or "").strip()),
                           rec["source_title"]),
        organizations=list(orgs.values()), countries=countries, geo_scope=geo_scope, region_label=region,
        sources=list(sources.values()),
        year=project_year(rows),
    )
    rec["date"] = project_date(rows, rec["year"])
    return rec


YEAR = re.compile(r"(?<!\d)(19[89]\d|20[0-4]\d)(?!\d)")
THIS_YEAR = datetime.date.today().year


def project_year(rows):
    """Year of the study: study_year or study_date if set, else the latest year in a source date or a source URL path
    (".../2024/05/..."), else the first year in the title ("IGCEP 2024-34" -> 2024). Years after this
    year are plan horizons, not study dates, and are ignored. None when the sources do not say."""
    explicit = [int(r["study_year"]) for r in rows if r.get("study_year")]
    explicit += [int(normalize_date(r["study_date"])[:4]) for r in rows if normalize_date(r.get("study_date"))]
    if explicit:
        return max(explicit)
    dated = [int(y) for r in rows for y in YEAR.findall(r.get("source_date") or "")]
    dated += [int(y) for r in rows for y in re.findall(r"/(19[89]\d|20[0-4]\d)/", r.get("source_url") or "")]
    dated = [y for y in dated if y <= THIS_YEAR]
    if dated:
        return max(dated)
    titled = [int(y) for r in rows for y in YEAR.findall(r.get("project_title") or "") if int(y) <= THIS_YEAR]
    return min(titled) if titled else None


MONTH_NAMES = {m: i + 1 for i, m in enumerate(("jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"))}


def normalize_date(text):
    """A date as precise as written: "2024-03-12", "2024-03" or "2024"; None when there is no usable date.
    Reads ISO dates, day/month/year ("12/3/2024"), "March 2024" / "12 March 2024", and a bare year."""
    t = (text or "").strip().lower()
    if m := re.match(r"^(\d{4})-(\d{2})(?:-(\d{2}))?", t):
        y, mo, d = m.groups()
        return f"{y}-{mo}-{d}" if d else f"{y}-{mo}"
    if m := re.match(r"^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$", t):
        d, mo, y = m.groups()
        return f"{y}-{int(mo):02d}-{int(d):02d}" if 1 <= int(mo) <= 12 and 1 <= int(d) <= 31 else y
    if m := re.match(r"^(?:(\d{1,2})\s+)?([a-z]{3})[a-z]*\.?,?\s+(\d{4})$", t):
        d, mon, y = m.groups()
        if mon in MONTH_NAMES:
            return f"{y}-{MONTH_NAMES[mon]:02d}" + (f"-{int(d):02d}" if d else "")
    if m := re.fullmatch(r"(19[89]\d|20[0-4]\d)", t):
        return m.group(1)
    return None


def project_date(rows, year):
    """The most precise date the sources give for the project's year: study_date if set, else source dates."""
    if not year:
        return None
    dates = [normalize_date(r.get("study_date")) for r in rows] + [normalize_date(r.get("source_date")) for r in rows]
    dates = [d for d in dates if d and d[:4] == str(year)]
    return max(dates, key=lambda d: (len(d), d)) if dates else str(year)


def csv_row(rec):
    return {**rec, "organizations": "; ".join(f"{o['name']} ({o['role']})" for o in rec["organizations"]),
            "countries": "; ".join(rec["countries"]), "sources": "; ".join(s["link"] for s in rec["sources"])}


def main():
    if not CATALOGUE_RAW.exists():
        print(f"ERROR: missing {CATALOGUE_RAW}", file=sys.stderr)
        return 1

    raw_rows = load_jsonl(CATALOGUE_RAW)
    confirmed_rows = [r for r in raw_rows if (r.get("status") or "").strip() == "confirmed"
                      and (r.get("tool_name") or "").strip() in TRACKED_TOOLS]
    KNOWN_COUNTRIES.update(l for l in ((r.get("country_label") or "").strip() for r in raw_rows) if label_scope(l) == "national")
    groups = {}
    for r in confirmed_rows:
        key = ((r.get("project_id") or "").strip() or r["id"], r["tool_name"].strip())
        groups.setdefault(key, []).append(r)
    merged = [project_record(rows) for rows in groups.values()]

    MERGED_CSV_OUT.parent.mkdir(parents=True, exist_ok=True)
    with MERGED_CSV_OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=APP_SCHEMA)
        writer.writeheader()
        writer.writerows(csv_row(r) for r in merged)

    APP_JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    APP_JSON_OUT.write_text(json.dumps(merged, ensure_ascii=False, indent=None), encoding="utf-8")

    countries = {r["country_label"] for r in merged if r["country_label"]}
    institutions = {r["institution_name"] for r in merged if r["institution_name"]}
    print(f"Merged {len(merged)} projects (from {len(confirmed_rows)} confirmed rows for the {len(TRACKED_TOOLS)} tracked tools, "
          f"of {len(raw_rows)} total rows in catalogue.jsonl) "
          f"across {len(countries)} countries and {len(institutions)} institutions.")
    print(f"Wrote {MERGED_CSV_OUT.relative_to(ROOT)}")
    print(f"Wrote {APP_JSON_OUT.relative_to(ROOT)}")
    print("Next: npm run build, review the diff, then commit both the catalogue.jsonl "
          "change and the regenerated catalogue_merged.csv/catalogue.json together.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
