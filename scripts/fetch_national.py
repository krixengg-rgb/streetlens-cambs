#!/usr/bin/env python3
"""Download national (all-England) raw inputs that the build scripts expect, if missing.

CI checkouts have no raw/ folder, so without this step enrich_lsoa_and_feeds.py and
build_area_context.py would fail on a fresh runner. Files are only fetched when absent.
All sources are OGL and keyless.
"""
import os, sys, urllib.request, zipfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW = os.path.join(ROOT, "raw")
UA = {"User-Agent": "StreetLens/1.0 (+https://github.com/krixengg-rgb/streetlens-cambs)"}
FILES = {
    "iod2025_file7.csv": "https://assets.publishing.service.gov.uk/media/691ded56d140bbbaa59a2a7d/File_7_IoD2025_All_Ranks_Scores_Deciles_Population_Denominators.csv",
    "census/census2021-ts054.zip": "https://www.nomisweb.co.uk/output/census/2021/census2021-ts054.zip",
    "census/census2021-ts007a.zip": "https://www.nomisweb.co.uk/output/census/2021/census2021-ts007a.zip",
    "ctsop/CTSOP_1_1_2026.zip": "https://assets.publishing.service.gov.uk/media/6ab25147a9c3d267bcccecc1/CTSOP_1_1.zip",
}
GREEN = ["sp", "tl", "tf"]  # OS grid squares covering the forces in forces.py


def fetch(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print("download", url[:100], flush=True)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=600) as r, open(dest + ".tmp", "wb") as f:
        f.write(r.read())
    if os.path.getsize(dest + ".tmp") < 1000:
        raise SystemExit(f"too small: {url}")
    os.replace(dest + ".tmp", dest)


def main():
    for rel, url in FILES.items():
        dest = os.path.join(RAW, rel)
        if not os.path.exists(dest) or os.path.getsize(dest) < 1000:
            fetch(url, dest)
    gdir = os.path.join(RAW, "greenspace")
    # greenspace.json is rebuilt by hand (build_greenspace.py needs pyshp); fetch its tiles only on request
    for t in (GREEN if "--greenspace" in sys.argv else []):
        z = os.path.join(gdir, f"opgrsp_essh_{t}.zip")
        if not os.path.exists(z):
            fetch(f"https://api.os.uk/downloads/v1/products/OpenGreenspace/downloads?area={t.upper()}&format=ESRI%C2%AE+Shapefile&redirect", z)
        unp = os.path.join(gdir, "unpacked")
        if not any(t.upper() in d for d in (os.listdir(unp) if os.path.isdir(unp) else [])):
            zipfile.ZipFile(z).extractall(unp)
    print("national inputs OK")


if __name__ == "__main__":
    main()
