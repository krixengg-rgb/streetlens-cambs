#!/usr/bin/env python3
"""Add type-level YoY to summary.json from a previous-12-month police.uk pull.

Does not rewrite points or latest-12-month totals. Stages the updated summary
and refuses to write if previous-window totals disagree with monthsAll.
"""
import json, os, sys, time, urllib.request, urllib.parse, concurrent.futures as cf

# Reuse force/boundary helpers from refresh_data
sys.path.insert(0, os.path.dirname(__file__))
import refresh_data as rd

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "data")
RAW = os.path.join(ROOT, "raw")
STAGE = os.path.join(RAW, "_stage_type_yoy")
MIN_BASE = 20  # don't quote a % when previous count is below this


def type_yoy(cur, prev):
    row = {"cur": int(cur), "prev": int(prev), "delta": int(cur) - int(prev)}
    if prev >= MIN_BASE:
        row["yoy"] = round((cur - prev) / prev * 100, 1)
        row["thin"] = False
    else:
        row["yoy"] = None
        row["thin"] = True
    return row


def main():
    summary_path = os.path.join(OUT, "summary.json")
    S = json.load(open(summary_path))
    months = S["months"]
    months_all = S.get("monthsAll") or months
    prev_months = [m for m in months_all if m not in months]
    if len(prev_months) < 12:
        rd.die(f"need 12 previous months, got {prev_months}")
    prev_months = sorted(prev_months)[-12:]

    # Expected previous totals from monthly counts already on the site
    expect = {S["overview"]["name"]: sum(S["overview"]["monthly"].get(m, 0) for m in prev_months)}
    for d in S["districts"]:
        expect[d["code"]] = sum(d["monthly"].get(m, 0) for m in prev_months)
    print("expected prev totals", expect)
    print("prev window", prev_months[0], "→", prev_months[-1])

    cats = [c["id"] for c in S["categories"]]
    nb2d = {n: c for c, (_, ns) in rd.DIST.items() for n in ns}
    polys = {}
    for n in nb2d:
        b = json.loads(rd.get(f"{rd.API}/cambridgeshire/{n}/boundary"))
        if len(b) < 3:
            rd.die(f"boundary too small for neighbourhood {n}")
        polys[n] = ":".join(f"{p['latitude']},{p['longitude']}" for p in b)
    print("boundaries", len(polys))

    def fetch(job):
        n, m = job
        d = json.loads(rd.get(rd.API + "/crimes-street/all-crime", urllib.parse.urlencode({"poly": polys[n], "date": m}).encode()))
        if len(d) >= 10000:
            print("WARNING cap hit", n, m)
        return n, m, d

    jobs = [(n, m) for n in nb2d for m in prev_months]
    print("jobs", len(jobs))
    prev = {c: {k: 0 for k in cats} for c in rd.DIST}
    prev_all = {k: 0 for k in cats}
    seen = set()
    with cf.ThreadPoolExecutor(6) as ex:
        done = 0
        for n, m, rows in ex.map(fetch, jobs):
            done += 1
            if done % 24 == 0 or done == len(jobs):
                print(f"fetched {done}/{len(jobs)}")
            code = nb2d[n]
            for c in rows:
                key = c["id"] or c["persistent_id"]
                if key in seen:
                    continue
                seen.add(key)
                cat = c.get("category")
                if cat not in prev_all:
                    # keep only categories already on the site
                    continue
                prev[code][cat] += 1
                prev_all[cat] += 1

    got_all = sum(prev_all.values())
    exp_all = expect[S["overview"]["name"]]
    print("prev crimes unique", len(seen), "categorised", got_all, "expected", exp_all)
    # Allow small drift (category remap / late updates) but not a half-empty pull
    if got_all < exp_all * 0.9 or got_all > exp_all * 1.1:
        rd.die(f"prev-window total {got_all} vs monthly sum {exp_all} — refusing to write")
    for code, exp in expect.items():
        if code == S["overview"]["name"]:
            continue
        got = sum(prev[code].values())
        if got < exp * 0.9 or got > exp * 1.1:
            rd.die(f"district {code} prev total {got} vs monthly sum {exp}")

    def attach(agg, cur_by, prev_by):
        agg["byTypePrev"] = {k: int(prev_by.get(k, 0)) for k in cats}
        agg["typeYoy"] = {k: type_yoy(cur_by.get(k, 0), prev_by.get(k, 0)) for k in cats}

    attach(S["overview"], S["overview"]["byType"], prev_all)
    for d in S["districts"]:
        attach(d, d["byType"], prev[d["code"]])

    os.makedirs(STAGE, exist_ok=True)
    staged = os.path.join(STAGE, "summary.json")
    with open(staged, "w") as f:
        json.dump(S, f, separators=(",", ":"))
    if os.path.getsize(staged) < 2000:
        rd.die("staged summary too small")
    os.replace(staged, summary_path)
    print("wrote typeYoy; county examples:")
    for k, v in sorted(S["overview"]["typeYoy"].items(), key=lambda kv: -(kv[1]["yoy"] if kv[1]["yoy"] is not None else -9999)):
        print(f"  {k}: {v['prev']} → {v['cur']}  {v['delta']:+d}  yoy={v['yoy']} thin={v['thin']}")
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)
