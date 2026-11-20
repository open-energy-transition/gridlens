"""Which organizations contribute to each open-source tool's code, month by month (src/data/contributors.json).

For every open-source tool with `github_orgs` in src/data/tools.json, reads all public, non-fork repositories of
those GitHub organizations, every merged pull request with its author and month, and each author's public `company`
profile field. Merged pull requests count reviewed contributions the same way whatever a person's commit habits.
The app sums them over a time window the reader picks.

Companies are normalized with data/contributor_orgs.json: {"Name": {"aliases": [...], "url": "https://..."}}. The
entry "" lists names that mean "no organization" (e.g. the tool's own GitHub organization). A company written as a
GitHub handle ("@open-energy-transition") links to that GitHub organization when no url is listed. Authors without a
company are kept as "unaffiliated". No GitHub user names are written to the output.

Run occasionally (a few hundred API calls):  GITHUB_TOKEN=... python3 scripts/fetch_contributors.py
Without GITHUB_TOKEN it tries `gh auth token`. The token is only sent to api.github.com, never printed.
"""
import datetime
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from os import environ
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = json.loads((ROOT / "src/data/tools.json").read_text(encoding="utf-8"))
ORGS = json.loads((ROOT / "data/contributor_orgs.json").read_text(encoding="utf-8"))
OUT = ROOT / "src/data/contributors.json"
# Bots and AI coding agents are not people from an organization.
BOTS = re.compile(r"\[bot\]$|^dependabot|^pre-commit-ci|^github-actions|^claude$|^copilot|^codex", re.I)
UNAFFILIATED = "unaffiliated"


def token():
    if environ.get("GITHUB_TOKEN"):
        return environ["GITHUB_TOKEN"]
    try:
        return subprocess.run(["gh", "auth", "token"], capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return ""


TOKEN = token()


def get(path, retries=6):
    req = urllib.request.Request(f"https://api.github.com{path}", headers={
        "Accept": "application/vnd.github+json", "User-Agent": "gridlens-contributors",
        **({"Authorization": f"Bearer {TOKEN}"} if TOKEN else {})})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read() or b"null")
        except urllib.error.HTTPError as e:
            if e.code in (403, 429) and attempt < retries - 1:
                time.sleep(60)
                continue
            if e.code in (404, 409):  # missing or empty repository
                return None
            raise
    return None


def paged(path):
    items, page = [], 1
    while True:
        batch = get(f"{path}{'&' if '?' in path else '?'}per_page=100&page={page}") or []
        items += batch
        if len(batch) < 100:
            return items
        page += 1


def normalize(company):
    """Profile company text → (organization name, link). ('', '') when not set or not an organization."""
    text = re.sub(r"\s+", " ", (company or "").strip()).rstrip(".")
    handle = text[1:].split()[0] if text.startswith("@") and len(text) > 1 else ""
    raw = text.lstrip("@").strip()
    if not raw:
        return "", ""
    key = raw.lower()
    for name, entry in ORGS.items():
        if (name and key == name.lower()) or key in (a.lower() for a in entry.get("aliases", [])):
            return name, entry.get("url", "")
    return raw, f"https://github.com/{handle}" if handle else ""


def main():
    profiles = {}
    out = {"generated": datetime.date.today().isoformat(), "tools": {}}
    for tool in (t for t in TOOLS if t.get("github_orgs") and t["license"] == "open_source"):
        repos = [(o, r["name"]) for o in tool["github_orgs"] for r in paged(f"/orgs/{o}/repos?type=public") if not r["fork"]]
        print(f"{tool['name']}: {len(repos)} repositories in {', '.join(tool['github_orgs'])}", flush=True)
        months = defaultdict(Counter)  # login -> {"2025-03": merged pull requests}
        for owner, name in repos:
            for pr in paged(f"/repos/{owner}/{name}/pulls?state=closed"):
                login = (pr.get("user") or {}).get("login")
                if pr.get("merged_at") and login and not BOTS.search(login):
                    months[login][pr["merged_at"][:7]] += 1
        for login in months:
            if login not in profiles:
                profiles[login] = normalize((get(f"/users/{login}") or {}).get("company"))
        orgs = {}
        for login, m in months.items():
            name, url = profiles[login]
            o = orgs.setdefault(name or UNAFFILIATED, {"name": name or UNAFFILIATED, "url": url, "people": []})
            o["url"] = o["url"] or url
            o["people"].append(dict(sorted(m.items())))
        ranked = sorted(orgs.values(), key=lambda o: (-sum(sum(p.values()) for p in o["people"]), o["name"]))
        out["tools"][tool["name"]] = {
            "githubOrgs": tool["github_orgs"], "repositories": len(repos), "contributors": len(months),
            "affiliated": sum(1 for login in months if profiles[login][0]), "organizations": ranked,
        }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
