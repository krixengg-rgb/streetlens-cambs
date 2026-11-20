#!/usr/bin/env python3
"""Build a compact Cambridgeshire & Peterborough STATS19 collision layer (OGL)."""
import csv, io, json, os, sys, time, urllib.error, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "data", "collisions.json")
RAW = os.path.join(ROOT, "raw", "stats19")
os.makedirs(RAW, exist_ok=True)

# Latest two final calendar years published by DfT (OGL).
YEARS = (2024, 2025)
# Mid-year provisional (unvalidated) is scheduled after the final years; try but do not fail if absent.
PROV_URL = "https://data.dft.gov.uk/road-accidents-safety-data/dft-road-casualty-statistics-collision-provisional-mid-year-unvalidated-{year}.csv"
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


def download_year(year, dest, optional=False):
    if os.path.exists(dest) and os.path.getsize(dest) >= 10000:
        print("using cached", dest, os.path.getsize(dest))
        return "cached"
    urls = [URL.format(year=year)]
    if optional:
        urls = [PROV_URL.format(year=year), URL.format(year=year)]
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


def main():
    rows = []
    by_dist = {c: {"n": 0, "fatal": 0, "serious": 0, "slight": 0, "cas": 0} for c in DIST}
    by_year = {}
    years = list(YEARS)
    provisional = []
    extra = max(YEARS) + 1
    got = {}
    for y in years:
        path = os.path.join(RAW, f"collision-{y}.csv")
        kind = download_year(y, path, optional=False)
        got[y] = path
    extra_path = os.path.join(RAW, f"collision-{extra}.csv")
    kind = download_year(extra, extra_path, optional=True)
    if kind:
        years.append(extra)
        got[extra] = extra_path
        provisional.append(extra)
        print("including provisional/new year", extra, kind)
    else:
        print(f"{extra} provisional STATS19 not published yet; leaving refresh ready")

    for y in years:
        path = got[y]
        n_year = 0
        with open(path, newline="", encoding="utf-8", errors="replace") as f:
            r = csv.DictReader(f)
            # field names have been stable recently; accept a couple of aliases
            for rec in r:
                la = rec.get("local_authority_ons_district") or rec.get("local_authority_ons") or ""
                if la not in DIST:
                    continue
                try:
                    lat = float(rec.get("latitude") or "")
                    lon = float(rec.get("longitude") or "")
                    sev = int(float(rec.get("collision_severity") or rec.get("accident_severity") or 0))
                    cas = int(float(rec.get("number_of_casualties") or 1))
                except (TypeError, ValueError):
                    continue
                if not (-0.8 <= lon <= 0.6 and 51.9 <= lat <= 52.9):
                    continue
                if sev not in (1, 2, 3):
                    continue
                rows.append([round(lat, 5), round(lon, 5), sev, y, cas, DIST_I[la]])
                d = by_dist[la]
                d["n"] += 1
                d["cas"] += cas
                d[{1: "fatal", 2: "serious", 3: "slight"}[sev]] += 1
                n_year += 1
        by_year[str(y)] = n_year
        print("year", y, "in area", n_year)

    if len(rows) < 500:
        raise SystemExit(f"too few collisions: {len(rows)}")

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
            "provisionalYears": provisional,
            "note": "Personal-injury collisions on public roads that were reported to the police and recorded on STATS19. Damage-only incidents are not included. Locations are as reported, not police-anonymised crime snap points. Calendar years, not the StreetLens crime month window. Severity is as recorded; reporting practice can affect the serious/slight split."
            + (" Mid-year provisional figures for " + ", ".join(str(y) for y in provisional) + " are unvalidated and may be revised." if provisional else " A mid-year provisional file for the next calendar year is used when the Department for Transport publishes it."),
            "severity": SEV_NAME,
            "generated": time.strftime("%Y-%m-%d"),
        },
        "overview": overview,
        "byYear": by_year,
        "districts": [
            {"code": c, "name": DIST[c], **by_dist[c]} for c in DIST
        ],
        # [lat, lon, severity, year, casualties, districtIndex]
        "points": rows,
    }
    tmp = OUT + ".tmp"
    with open(tmp, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    os.replace(tmp, OUT)
    print("wrote", OUT, "points", len(rows), "bytes", os.path.getsize(OUT), "overview", overview)
    return 0


if __name__ == "__main__":
    sys.exit(main())
