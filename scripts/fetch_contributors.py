"""Which organizations contribute to each open-source tool, month by month (src/data/contributors.json).

For every open-source tool with `github_orgs` in src/data/tools.json, reads all public, non-fork repositories of
those GitHub organizations and counts, per person and month:
  prs      pull requests merged (reviewed contributions, whatever a person's commit habits)
  commits  commits on the default branch (GitHub's contributor statistics: the top 100 authors per repository)
  reviews  reviews of other people's pull requests
  issues   issues opened
Each person is attributed to the organization in the public `company` field of their GitHub profile. The app sums
the chosen activity over a time window the reader picks.

Companies are normalized with data/contributor_orgs.json: {"Name": {"aliases": [...], "url": "https://..."}}. The
entry "" lists names that mean "no organization" (e.g. the tool's own GitHub organization). A company written as a
GitHub handle ("@open-energy-transition") links to that GitHub organization when no url is listed. People without a
company are kept as "unaffiliated". No GitHub user names are written to the output.

Run occasionally (a few thousand API calls, about an hour):  GITHUB_TOKEN=... python3 scripts/fetch_contributors.py
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


def request(path, body=None):
    req = urllib.request.Request(f"https://api.github.com{path}", data=json.dumps(body).encode() if body else None, headers={
        "Accept": "application/vnd.github+json", "User-Agent": "gridlens-contributors",
        **({"Authorization": f"Bearer {TOKEN}"} if TOKEN else {})})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.status, json.loads(r.read() or b"null")


def get(path, retries=6):
    for attempt in range(retries):
        try:
            status, data = request(path)
            if status == 202:  # statistics are being computed: ask again shortly
                time.sleep(10)
                continue
            return data
        except urllib.error.HTTPError as e:
            if e.code in (403, 429, 502) and attempt < retries - 1:
                time.sleep(60)
                continue
            if e.code in (404, 409, 422):  # missing, empty or too large to list
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


REVIEWS = """query($owner: String!, $name: String!, $after: String) {
  repository(owner: $owner, name: $name) {
    pullRequests(first: 50, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { author { login } reviews(first: 30) { nodes { author { login } submittedAt } } }
    }
  }
}"""


def reviews(owner, name):
    """(login, month) of every review of someone else's pull request."""
    out, after = [], None
    while True:
        for attempt in range(4):
            try:
                _, data = request("/graphql", {"query": REVIEWS, "variables": {"owner": owner, "name": name, "after": after}})
                break
            except urllib.error.HTTPError:
                time.sleep(60)
        else:
            return out
        prs = ((data or {}).get("data") or {}).get("repository") or {}
        prs = prs.get("pullRequests") or {"nodes": [], "pageInfo": {}}
        for pr in prs["nodes"]:
            author = (pr.get("author") or {}).get("login")
            for rv in (pr.get("reviews") or {}).get("nodes") or []:
                login = (rv.get("author") or {}).get("login")
                if login and login != author and rv.get("submittedAt"):
                    out.append((login, rv["submittedAt"][:7]))
        if not prs["pageInfo"].get("hasNextPage"):
            return out
        after = prs["pageInfo"]["endCursor"]


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
        activity = defaultdict(lambda: defaultdict(Counter))  # login -> metric -> {"2025-03": n}

        def add(login, metric, month, n=1):
            if login and not BOTS.search(login) and n:
                activity[login][metric][month] += n

        for owner, name in repos:
            for pr in paged(f"/repos/{owner}/{name}/pulls?state=closed"):
                if pr.get("merged_at"):
                    add((pr.get("user") or {}).get("login"), "prs", pr["merged_at"][:7])
            for issue in paged(f"/repos/{owner}/{name}/issues?state=all"):
                if "pull_request" not in issue:
                    add((issue.get("user") or {}).get("login"), "issues", issue["created_at"][:7])
            for c in get(f"/repos/{owner}/{name}/stats/contributors") or []:
                for w in c.get("weeks") or []:
                    add((c.get("author") or {}).get("login"), "commits", datetime.datetime.fromtimestamp(w["w"], datetime.UTC).strftime("%Y-%m"), w["c"])
            for login, month in reviews(owner, name):
                add(login, "reviews", month)
        for login in activity:
            if login not in profiles:
                profiles[login] = normalize((get(f"/users/{login}") or {}).get("company"))
        orgs = {}
        for login, metrics in activity.items():
            name, url = profiles[login]
            o = orgs.setdefault(name or UNAFFILIATED, {"name": name or UNAFFILIATED, "url": url, "people": []})
            o["url"] = o["url"] or url
            o["people"].append({m: dict(sorted(c.items())) for m, c in sorted(metrics.items())})
        total = lambda o: sum(sum(p.get("prs", {}).values()) for p in o["people"])  # noqa: E731
        ranked = sorted(orgs.values(), key=lambda o: (-total(o), o["name"]))
        out["tools"][tool["name"]] = {
            "githubOrgs": tool["github_orgs"], "repositories": len(repos), "contributors": len(activity),
            "affiliated": sum(1 for login in activity if profiles[login][0]), "organizations": ranked,
        }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
