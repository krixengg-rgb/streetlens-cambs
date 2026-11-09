#!/usr/bin/env python3
"""Rebuild point tiles + LSOA rate estimates after points.json changes."""
import json, os, math, csv, urllib.request, urllib.parse
from collections import defaultdict, Counter
from datetime import date

ROOT=os.path.join(os.path.dirname(__file__), '..')
OUT=os.path.join(ROOT,'public','data')
RAW=os.path.join(ROOT,'raw')

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
    base='https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LSOA_PopCentroids_EW_2021_V4/FeatureServer/0/query'
    cents={}
    for i in range(0,len(lsoas),50):
        chunk=lsoas[i:i+50]
        where="LSOA21CD IN ("+",".join(f"'{c}'" for c in chunk)+")"
        qs=urllib.parse.urlencode({'where':where,'outFields':'LSOA21CD','returnGeometry':'true','outSR':'4326','f':'json'})
        data=json.load(urllib.request.urlopen(urllib.request.Request(base+'?'+qs,headers=UA), timeout=60))
        for f in data.get('features',[]):
            g=f.get('geometry') or {}
            cents[f['attributes']['LSOA21CD']]=(g.get('y'), g.get('x'))
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
    json.dump({'meta':{'source':'Nearest LSOA21 centroid assignment + IoD2025 mid-2022 population','note':'Approximate; not an official police LSOA count. Band = tertile within Cambridgeshire & Peterborough.','generated':date.today().isoformat()},'lsoa':rates},
              open(os.path.join(OUT,'lsoa_rates.json'),'w'), separators=(',',':'))
    print('lsoa_rates', len(rates))

if __name__=='__main__':
    build_tiles(); build_lsoa()
