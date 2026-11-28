#!/usr/bin/env python3
"""Write crawlable district pages (public/districts/<slug>.html) and sitemap.xml for every force in forces.py."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("SL_FORCE", "cambridgeshire")
import forces

ROOT = forces.ROOT
PUB = os.path.join(ROOT, "public")
BASE = "https://krixengg-rgb.github.io/streetlens-cambs/public/"


def slug(s):
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in s).strip("-").replace("--", "-")


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace('"', "&quot;")


def fmt(n):
    return f"{n:,}"


def page(d, force):
    sl = slug(d["name"])
    yoy = "n/a" if d.get("yoy") is None else f"{d['yoy']:+.1f}%".replace("+", "") if d["yoy"] < 0 else f"+{d['yoy']}%"
    desc = f"{d['name']} ({force['name']}): {d['rate']} crimes per 1,000 residents ({fmt(d['total'])} recorded in 12 months). Year-on-year change: {yoy}. Solve rate, house prices, schools and local services from open UK data."
    url = f"{BASE}?d={sl}"
    t = f"{d['name']} crime and area insights — StreetLens"
    return sl, f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>{esc(t)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(t)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(t)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{BASE}og.png">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=../?d={sl}">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="icon" href="../favicon.ico" sizes="any">
</head><body>
<header><a href="../">StreetLens</a></header>
<main>
<h1>{esc(d['name'])}</h1>
<p>{esc(desc)}</p>
<ul>
<li>Police force area: {esc(force['name'])}</li>
<li>Recorded crimes (12 months): {fmt(d['total'])}</li>
<li>Rate per 1,000 residents: {d['rate']}</li>
<li>Population (ONS): {fmt(d['population'])}</li>
<li>Year-on-year: {yoy}</li>
</ul>
<p><a href="../?d={sl}">Open the interactive {esc(d['name'])} profile</a> · <a href="../method.html">How to read this site</a></p>
</main>
<script>location.replace('../?d={sl}')</script>
</body></html>
"""


def main():
    urls = [(BASE, "weekly", "1.0"), (BASE + "method.html", "monthly", "0.6"), (BASE + "?compare=1", "weekly", "0.5")]
    feeds = []
    os.makedirs(os.path.join(PUB, "districts"), exist_ok=True)
    for fid, cfg in forces.FORCES.items():
        default = fid == forces.DEFAULT
        sp = os.path.join(PUB, "data", "" if default else f"f/{fid}", "summary.json")
        if not os.path.exists(sp):
            print("skip", fid, "(no summary)")
            continue
        s = json.load(open(sp))
        if not default:
            urls.append((f"{BASE}?f={fid}", "weekly", "0.9"))
        for d in s["districts"]:
            sl, html = page(d, cfg)
            open(os.path.join(PUB, "districts", sl + ".html"), "w").write(html)
            urls.append((f"{BASE}?d={sl}", "weekly", "0.8"))
            urls.append((f"{BASE}districts/{sl}.html", "weekly", "0.7"))
        urls.append((f"{BASE}?view=league" + ("" if default else f"&f={fid}"), "weekly", "0.7"))
        fp = "feeds/" + ("" if default else f"{fid}/")
        feeds += [BASE + fp + "index.html", BASE + fp + "county.xml"]
    x = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    x += [f"<url><loc>{esc(u)}</loc><changefreq>{c}</changefreq><priority>{p}</priority></url>" for u, c, p in urls]
    x += [f"<url><loc>{esc(u)}</loc></url>" for u in feeds]
    x.append("</urlset>")
    open(os.path.join(PUB, "sitemap.xml"), "w").write("\n".join(x) + "\n")
    print("static pages + sitemap:", len(urls), "urls")


if __name__ == "__main__":
    main()
