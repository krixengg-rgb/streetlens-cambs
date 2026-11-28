#!/usr/bin/env python3
"""Rebuild point tiles + LSOA rate estimates after points.json changes."""
import json, os, sys, math, csv, urllib.request, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import forces
from collections import defaultdict, Counter
from datetime import date

ROOT=os.path.join(os.path.dirname(__file__), '..')
OUT=forces.OUT
RAW=forces.RAW_NAT

def build_tiles():
    pts=json.load(open(os.path.join(OUT,'points.json')))
    CELL=0.05; tiles=defaultdict(list)
    for p in pts:
        tiles[(math.floor(p[0]/CELL), math.floor(p[1]/CELL))].append(p)
    tdir=os.path.join(OUT,'tiles'); os.makedirs(tdir, exist_ok=True)
    for f in os.listdir(tdir): os.remove(os.path.join(tdir,f))
    index=[]
    for (i,j),arr in tiles.items():
        with open(os.path.join(tdir,f'{i}_{j}.json'),'w') as f: json.dump(arr,f,separators=(',',':'))
        index.append([i,j,len(arr)])
    meta={'cell':CELL,'tiles':index,'total':len(pts),'generated':date.today().isoformat()}
    json.dump(meta, open(os.path.join(tdir,'meta.json'),'w'), separators=(',',':'))
    json.dump({'tiled':True,'cell':CELL}, open(os.path.join(OUT,'points_meta.json'),'w'))
    print('tiles', len(index), 'points', len(pts))

def build_lsoa():
    imd_path=os.path.join(OUT,'imd.json')
    if not os.path.exists(imd_path):
        print('skip lsoa rates: no imd.json'); return
    IMD=json.load(open(imd_path))['lsoa']; lsoas=list(IMD)
    UA={'User-Agent':'StreetLens-cambs/1.0'}
    # ONS 2021 LSOA population-weighted centroids (OGL). The older services1 ...LSOA_PopCentroids_EW_2021_V4
    # layer now needs a token, so use the same open layer as enrich_lsoa_and_feeds.py.
    base='https://services-eu1.arcgis.com/6BsumkdKnml1ntNV/arcgis/rest/services/2021_LSOA_Population_Weighted_Centroid/FeatureServer/0/query'
    cents={}
    for i in range(0,len(lsoas),50):
        chunk=lsoas[i:i+50]
        where="CODE IN ("+",".join(f"'{c}'" for c in chunk)+")"
        qs=urllib.parse.urlencode({'where':where,'outFields':'CODE','returnGeometry':'true','outSR':'4326','f':'json'})
        data=json.load(urllib.request.urlopen(urllib.request.Request(base+'?'+qs,headers=UA), timeout=60))
        if data.get('error'): raise SystemExit(f"centroid query failed: {data['error']}")
        for f in data.get('features',[]):
            g=f.get('geometry') or {}
            cents[f['attributes']['CODE']]=(g.get('y'), g.get('x'))
    if len(cents) < 0.95*len(lsoas):
        raise SystemExit(f'too few LSOA centroids: {len(cents)}/{len(lsoas)}; leaving lsoa_rates.json unchanged')
    pop={}
    f7=os.path.join(RAW,'iod2025_file7.csv')
    if os.path.exists(f7):
        with open(f7, newline='', encoding='utf-8-sig') as fh:
            for row in csv.DictReader(fh):
                code=row['LSOA code (2021)']
                if code in IMD: pop[code]=int(float(row['Total population: mid 2022']))
    pts=json.load(open(os.path.join(OUT,'points.json')))
    cell=0.02; grid={}
    for code,(la,lo) in cents.items():
        if la is None: continue
        grid.setdefault((int(la/cell),int(lo/cell)),[]).append((la,lo,code))
    def nearest(la,lo):
        i,j=int(la/cell),int(lo/cell); bd,bc=1e9,None
        for di in (-1,0,1):
            for dj in (-1,0,1):
                for cla,clo,code in grid.get((i+di,j+dj),()):
                    d=(cla-la)**2+(clo-lo)**2
                    if d<bd: bd=d; bc=code
        return bc if bd<=0.001 else None
    cnt=Counter()
    for p in pts:
        c=nearest(p[0],p[1])
        if c: cnt[c]+=1
    rates={}; vals=[]
    for code in IMD:
        n=cnt.get(code,0); po=pop.get(code,0)
        rate=round(n/po*1000,1) if po else None
        if rate is not None: vals.append(rate)
        rates[code]={'n':n,'pop':po,'rate':rate}
    vals.sort()
    import bisect
    for code,v in rates.items():
        if v['rate'] is None or len(vals)<2: v['band']=None; continue
        p=bisect.bisect_left(vals,v['rate'])/(len(vals)-1)
        v['band']='Low' if p<0.33 else 'Medium' if p<0.66 else 'High'
    json.dump({'meta':{'source':'Nearest LSOA21 centroid assignment + IoD2025 mid-2022 population','note':'Approximate; not an official police LSOA count. Band = tertile within '+forces.NAME+'.','generated':date.today().isoformat()},'lsoa':rates},
              open(os.path.join(OUT,'lsoa_rates.json'),'w'), separators=(',',':'))
    print('lsoa_rates', len(rates))

if __name__=='__main__':
    build_tiles(); build_lsoa()
