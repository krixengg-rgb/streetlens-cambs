#!/usr/bin/env python3
"""Build a compact Cambridgeshire & Peterborough STATS19 collision layer (OGL)."""
import csv, io, json, os, sys, time, urllib.error, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "data", "collisions.json")
RAW = os.path.join(ROOT, "raw", "stats19")
os.makedirs(RAW, exist_ok=True)

# Latest two final calendar years published by DfT (OGL).
YEARS = (2024, 2025)
# Mid-year provisional (unvalidated) file. DfT names it ...-collision-provisional-<year>.csv; the older
# "provisional-mid-year-unvalidated" name is tried as a fallback. The page and release describe it as January to June,
# though the CSV can also carry later months with incomplete reporting; only months <= PROV_MAX_MONTH are used.
PROV_URLS = [
    "https://data.dft.gov.uk/road-accidents-safety-data/dft-road-casualty-statistics-collision-provisional-{year}.csv",
    "https://data.dft.gov.uk/road-accidents-safety-data/dft-road-casualty-statistics-collision-provisional-mid-year-unvalidated-{year}.csv",
]
PROV_MAX_MONTH = 6
URL = "https://data.dft.gov.uk/road-accidents-safety-data/dft-road-casualty-statistics-collision-{year}.csv"
UA = {"User-Agent": "StreetLens-cambs/1.0 (+https://github.com/krixengg-rgb/streetlens-cambs)"}

DIST = {
    "E07000008": "Cambridge",
    "E07000009": "East Cambridgeshire",
    "E07000010": "Fenland",
    "E07000011": "Huntingdonshire",
    "E07000012": "South Cambridgeshire",
    "E06000031": "Peterborough",
}
DIST_I = {c: i for i, c in enumerate(DIST)}
# collision_severity: 1 fatal, 2 serious, 3 slight
SEV_NAME = {1: "Fatal", 2: "Serious", 3: "Slight"}


def get(url, dest, tries=5, optional=False):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=180) as r, open(dest, "wb") as f:
                while True:
                    chunk = r.read(1024 * 256)
                    if not chunk:
                        break
                    f.write(chunk)
            if os.path.getsize(dest) < 10000:
                raise RuntimeError(f"file too small: {os.path.getsize(dest)}")
            return True
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 404:
                print("not published yet", url)
                if optional:
                    return False
                break
            print(f"retry {i+1}/{tries}", url, e)
            time.sleep(2 * (i + 1))
        except Exception as e:
            last = e
            print(f"retry {i+1}/{tries}", url, e)
            time.sleep(2 * (i + 1))
    if optional:
        print("optional download skipped", url, last)
        return False
    raise SystemExit(f"failed to download {url}: {last}")


def download_year(year, dest, optional=False, provisional=False):
    if os.path.exists(dest) and os.path.getsize(dest) >= 10000:
        print("using cached", dest, os.path.getsize(dest))
        return "cached"
    urls = [u.format(year=year) for u in PROV_URLS] if provisional else [URL.format(year=year)]
    for url in urls:
        print("downloading", year, url)
        if get(url, dest, optional=optional):
            return url
        if os.path.exists(dest) and os.path.getsize(dest) < 10000:
            try:
                os.remove(dest)
            except OSError:
                pass
    return None


def parse_rows(path, year, max_month=None):
    """Yield [lat, lon, severity, year, casualties, districtIdx, month] for the six districts."""
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        for rec in csv.DictReader(f):
            la = rec.get("local_authority_ons_district") or rec.get("local_authority_ons") or ""
            if la not in DIST:
                continue
            try:
                lat = float(rec.get("latitude") or "")
                lon = float(rec.get("longitude") or "")
                sev = int(float(rec.get("collision_severity") or rec.get("accident_severity") or 0))
                cas = int(float(rec.get("number_of_casualties") or 1))
                d = (rec.get("date") or "").split("/")
                month = int(d[1]) if len(d) == 3 else 0
                if len(d) == 3 and int(d[2]) != year:
                    continue
            except (TypeError, ValueError, IndexError):
                continue
            if not (-0.8 <= lon <= 0.6 and 51.9 <= lat <= 52.9):
                continue
            if sev not in (1, 2, 3):
                continue
            if max_month and not (1 <= month <= max_month):
                continue
            yield [round(lat, 5), round(lon, 5), sev, year, cas, DIST_I[la], month]


def tally(rows):
    by = {c: {"n": 0, "fatal": 0, "serious": 0, "slight": 0, "cas": 0} for c in DIST}
    for r in rows:
        c = list(DIST)[r[5]]
        d = by[c]
        d["n"] += 1
        d["cas"] += r[4]
        d[{1: "fatal", 2: "serious", 3: "slight"}[r[2]]] += 1
    return by


def main():
    rows = []
    by_year = {}
    years = list(YEARS)
    got = {}
    for y in years:
        path = os.path.join(RAW, f"collision-{y}.csv")
        download_year(y, path, optional=False)
        got[y] = path
    for y in years:
        rs = list(parse_rows(got[y], y))
        rows.extend(rs)
        by_year[str(y)] = len(rs)
        print("year", y, "in area", len(rs))
    if len(rows) < 500:
        raise SystemExit(f"too few collisions: {len(rows)}")
    by_dist = tally(rows)

    # Provisional mid-year file for the year after the last final year (optional).
    pyear = max(YEARS) + 1
    prov = None
    ppath = os.path.join(RAW, f"collision-provisional-{pyear}.csv")
    kind = download_year(pyear, ppath, optional=True, provisional=True)
    if kind:
        prs = list(parse_rows(ppath, pyear, PROV_MAX_MONTH))
        # same months of the previous final year, for a like-for-like comparison
        prev = [r for r in rows if r[3] == pyear - 1 and 1 <= r[6] <= PROV_MAX_MONTH]
        if len(prs) >= 100:
            pd = tally(prs)
            vd = tally(prev)
            def row(c):
                return {**pd[c], "prevN": vd[c]["n"], "prevFatal": vd[c]["fatal"], "prevSerious": vd[c]["serious"], "prevCas": vd[c]["cas"]}
            def tot(key):
                return sum(row(c)[key] for c in DIST)
            keys = ("n", "fatal", "serious", "slight", "cas", "prevN", "prevFatal", "prevSerious", "prevCas")
            prov = {
                "meta": {
                    "year": pyear,
                    "months": [1, PROV_MAX_MONTH],
                    "label": f"January to {['','January','February','March','April','May','June'][PROV_MAX_MONTH]} {pyear}",
                    "status": "provisional, unvalidated",
                    "compareYear": pyear - 1,
                    "note": "Provisional mid-year STATS19 collisions from the Department for Transport. Not validated; police can still add or amend records, so counts can change. Only January to June is used because later months in the file are incomplete.",
                },
                "overview": {k: tot(k) for k in keys},
                "districts": [{"code": c, "name": DIST[c], **row(c)} for c in DIST],
                # [lat, lon, severity, casualties, districtIndex, month]
                "points": [[r[0], r[1], r[2], r[4], r[5], r[6]] for r in prs],
            }
            print("provisional", pyear, "n", len(prs), "prev same months", len(prev))
        else:
            print("provisional file had too few area rows", len(prs), "- ignoring")
    else:
        print(f"{pyear} provisional STATS19 not published yet; leaving refresh ready")

    overview = {
        "n": len(rows),
        "fatal": sum(d["fatal"] for d in by_dist.values()),
        "serious": sum(d["serious"] for d in by_dist.values()),
        "slight": sum(d["slight"] for d in by_dist.values()),
        "cas": sum(d["cas"] for d in by_dist.values()),
    }
    out = {
        "meta": {
            "source": "Department for Transport Road Safety Data (STATS19), OGL v3.0",
            "guide": "https://www.gov.uk/government/statistical-data-sets/road-safety-open-data",
            "years": years,
            "provisionalYears": [pyear] if prov else [],
            "note": "Personal-injury collisions on public roads that were reported to the police and recorded on STATS19. Damage-only incidents are not included. Locations are as reported, not police-anonymised crime snap points. Calendar years, not the StreetLens crime month window. Severity is as recorded; reporting practice can affect the serious/slight split."
            + (f" Provisional January to June {pyear} figures are shown separately; they are unvalidated and may be revised." if prov else " A mid-year provisional file for the next calendar year is used when the Department for Transport publishes it."),
            "severity": SEV_NAME,
            "generated": time.strftime("%Y-%m-%d"),
        },
        "overview": overview,
        "byYear": by_year,
        "districts": [{"code": c, "name": DIST[c], **by_dist[c]} for c in DIST],
        # [lat, lon, severity, year, casualties, districtIndex, month]
        "points": rows,
    }
    if prov:
        out["prov"] = prov
    tmp = OUT + ".tmp"
    with open(tmp, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    os.replace(tmp, OUT)
    print("wrote", OUT, "points", len(rows), "bytes", os.path.getsize(OUT), "overview", overview)
    return 0


if __name__ == "__main__":
    sys.exit(main())
