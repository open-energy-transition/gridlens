"""Which organizations contribute most to each open-source tool's code (src/data/contributors.json).

For every open-source tool with a `github_org` in src/data/tools.json, reads all public, non-fork repositories of
that GitHub organization, the commits of each contributor (all time, and in the last 24 months) from GitHub's
contributor statistics, and each contributor's public `company` profile field. Companies are normalized with
data/contributor_orgs.json (one name → its aliases; aliases of "" mean "no organization", e.g. the tool's own GitHub
organization). Contributors without a company are counted as "unaffiliated".

Run occasionally (it makes a few hundred API calls):  GITHUB_TOKEN=... python3 scripts/fetch_contributors.py
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
from collections import defaultdict
from os import environ
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = json.loads((ROOT / "src/data/tools.json").read_text(encoding="utf-8"))
ALIASES = json.loads((ROOT / "data/contributor_orgs.json").read_text(encoding="utf-8"))
OUT = ROOT / "src/data/contributors.json"
RECENT_WEEKS = 104
# Bots and AI coding agents are not people from an organization.
BOTS = re.compile(r"\[bot\]$|^dependabot|^pre-commit-ci|^github-actions|^claude$|^copilot|^codex", re.I)


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
                if r.status == 202:  # statistics are being computed; ask again shortly
                    time.sleep(3 + 2 * attempt)
                    continue
                return json.loads(r.read() or b"null")
        except urllib.error.HTTPError as e:
            if e.code in (403, 429) and attempt < retries - 1:
                time.sleep(30)
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
    """Profile company text → organization name, using the alias list; '' when not set."""
    raw = re.sub(r"\s+", " ", (company or "").strip().lstrip("@").strip()).rstrip(".")
    if not raw:
        return ""
    key = raw.lower()
    for name, variants in ALIASES.items():
        if (name and key == name.lower()) or key in (v.lower() for v in variants):
            return name
    return raw


def main():
    profiles = {}
    out = {"generated": datetime.date.today().isoformat(), "tools": {}}
    for tool in (t for t in TOOLS if t.get("github_org") and t["license"] == "open_source"):
        org = tool["github_org"]
        repos = [r for r in paged(f"/orgs/{org}/repos?type=public") if not r["fork"]]
        print(f"{tool['name']}: {len(repos)} repositories in {org}", flush=True)
        people = defaultdict(lambda: {"commits": 0, "recent": 0})
        for repo in repos:
            stats = get(f"/repos/{org}/{repo['name']}/stats/contributors") or []
            for s in stats:
                login = (s.get("author") or {}).get("login")
                if not login or BOTS.search(login):
                    continue
                people[login]["commits"] += s["total"]
                people[login]["recent"] += sum(w["c"] for w in s["weeks"][-RECENT_WEEKS:])
        for login in people:
            if login not in profiles:
                profiles[login] = normalize((get(f"/users/{login}") or {}).get("company"))
        orgs = defaultdict(lambda: {"contributors": 0, "commits": 0, "recentCommits": 0})
        for login, p in people.items():
            o = orgs[profiles[login] or "unaffiliated"]
            o["contributors"] += 1
            o["commits"] += p["commits"]
            o["recentCommits"] += p["recent"]
        ranked = sorted(({"name": k, **v} for k, v in orgs.items()), key=lambda o: (-o["recentCommits"], -o["commits"], o["name"]))
        out["tools"][tool["name"]] = {
            "githubOrg": org, "repositories": len(repos), "contributors": len(people),
            "affiliated": sum(1 for login in people if profiles[login]), "organizations": ranked,
        }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
