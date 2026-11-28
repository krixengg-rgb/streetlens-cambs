#!/usr/bin/env python3
"""Build imd.json, flood.json, broadband.json for one force (see forces.py).
Downloads are large; cache under raw/. Safe to skip in weekly crime refresh if files exist
unless --force. Sources: MHCLG IoD2025, EA RoFRS postcodes, Ofcom Connected Nations.
"""
import csv, json, os, sys, urllib.request, zipfile, io
from collections import defaultdict
from datetime import date

ROOT=os.path.join(os.path.dirname(__file__), '..')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import forces
RAW=forces.RAW_NAT; OUT=forces.OUT
os.makedirs(RAW, exist_ok=True); os.makedirs(OUT, exist_ok=True)
UA={'User-Agent':'StreetLens-cambs/1.0 (+https://github.com/krixengg-rgb/streetlens-cambs)'}
DIST_CODES=set(forces.DIST)
DIST_NAMES={v[0] for v in forces.DIST.values()}

def get(url, dest):
    if os.path.exists(dest) and ('--force' not in sys.argv or os.path.getmtime(dest)>__import__('time').time()-12*3600) and os.path.getsize(dest)>1000:
        print('cache', dest); return dest
    print('download', url[:90])
    req=urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=300) as r, open(dest,'wb') as f: f.write(r.read())
    return dest

def main():
    force='--force' in sys.argv
    # Skip rebuild if outputs exist and < 40 days old (area datasets update rarely)
    outs=[os.path.join(OUT,n) for n in ('imd.json','flood.json','broadband.json')]
    if not force and all(os.path.exists(f) for f in outs):
        age=min(date.today().toordinal()-date.fromtimestamp(os.path.getmtime(f)).toordinal() for f in outs)
        if age < 40:
            print(f'SKIP_IF_FRESH: area extras are {age} days old; pass --force to rebuild')
            return
    # IMD 2025 File 1
    imd_path=get('https://assets.publishing.service.gov.uk/media/691dece32c6b98ecdbc500d5/File_1_IoD2025_Index_of_Multiple_Deprivation.xlsx', os.path.join(RAW,'imd2025.xlsx'))
    import openpyxl
    wb=openpyxl.load_workbook(imd_path, read_only=True, data_only=True)
    ws=wb['IMD25'] if 'IMD25' in wb.sheetnames else wb[wb.sheetnames[-1]]
    imd={}; rows=ws.iter_rows(values_only=True); next(rows)
    for r in rows:
        if not r or not r[0]: continue
        if r[2] in DIST_CODES or r[3] in DIST_NAMES:
            imd[r[0]]={'d':int(r[5]),'r':int(r[4])}
    json.dump({'meta':{'source':'English Indices of Deprivation 2025 (MHCLG)','year':2025,'note':'Decile 1 = most deprived 10% of LSOAs in England. LSOA 2021 codes.','generated':date.today().isoformat()},'lsoa':imd}, open(os.path.join(OUT,'imd.json'),'w'), separators=(',',':'))
    print('imd', len(imd))

    # Flood
    flood_zip=get('https://environment.data.gov.uk/api/file/download?fileDataSetId=97781741-2982-4802-af2e-313fe3fd8f7e&fileName=RoFRS_Postcodes_in_Areas_at_Risk.zip', os.path.join(RAW,'flood.zip'))
    with zipfile.ZipFile(flood_zip) as z:
        name=next(n for n in z.namelist() if n.endswith('RoFRS_PostcodesAtRisk.csv'))
        areas=tuple(forces.CFG['pc_areas'])
        with z.open(name) as fh:
            rows=[r for r in csv.DictReader(io.TextIOWrapper(fh, encoding='utf-8-sig')) if (r['PC'] or '').strip().upper().startswith(areas)]
        keep=forces.postcode_filter({(r['PC'] or '').strip().upper().replace(' ','')[:-3] for r in rows})
        if True:
            flood={}
            for row in rows:
                pc=(row['PC'] or '').strip().upper().replace(' ','')
                if not keep(pc): continue
                def gi(k):
                    try: return int(float(row.get(k) or 0))
                    except: return 0
                h,m,l,v=gi('TOT_CNT_High'),gi('TOT_CNT_Medium'),gi('TOT_CNT_Low'),gi('TOT_CNT_VeryLow')
                band='H' if h else 'M' if m else 'L' if l else 'V' if v else None
                if band: flood[pc]={'b':band,'h':h,'m':m,'l':l,'v':v}
    json.dump({'meta':{'source':'Environment Agency Risk of Flooding from Rivers and Sea — Postcodes in Areas at Risk','note':'Rivers and sea only. Absent postcode ≈ no property in a mapped flood area.','attribution':'© Environment Agency copyright and/or database right 2026.','generated':date.today().isoformat()},'pc':flood}, open(os.path.join(OUT,'flood.json'),'w'), separators=(',',':'))
    print('flood', len(flood))

    # Ofcom — Spring 2025 postcode zip (cached)
    ofcom_zip=get('https://www.ofcom.org.uk/siteassets/resources/documents/research-and-data/multi-sector/infrastructure-research/connect-nations-spring-2025/data-downloads/fixed-coverage-postcodes.zip?v=396499', os.path.join(RAW,'ofcom-pc.zip'))
    bb={}; sector=defaultdict(list)
    with zipfile.ZipFile(ofcom_zip) as outer:
        with outer.open('postcode_res_files.zip') as inner_bytes:
            with zipfile.ZipFile(inner_bytes) as inner:
                orows=[]
                for area in forces.CFG['pc_areas']:
                    fn=f'202501_fixed_pc_coverage_res_r01_{area}.csv'
                    with inner.open(fn) as fh:
                        orows+=list(csv.DictReader(io.TextIOWrapper(fh, encoding='utf-8')))
                keep=forces.postcode_filter({r['postcode'].strip().upper().replace(' ','')[:-3] for r in orows})
                if True:
                    if True:
                        for row in orows:
                            raw=row['postcode'].strip().upper().replace(' ','')
                            if not keep(raw): continue
                            try:
                                g=float(row['Gigabit availability (% premises)'] or 0)
                                s=float(row['SFBB availability (% premises)'] or 0)
                            except: continue
                            bb[raw]=[round(g),round(s)]
                            if len(raw)>=5: sector[raw[:-2]].append((g,s))
    sec_agg={k:[round(sum(x[0] for x in v)/len(v)), round(sum(x[1] for x in v)/len(v))] for k,v in sector.items()}
    json.dump({'meta':{'source':'Ofcom Connected Nations Spring 2025 fixed coverage (residential)','fields':['gigabit_pct','sfbb_pct'],'generated':date.today().isoformat()},'pc':bb,'sector':sec_agg}, open(os.path.join(OUT,'broadband.json'),'w'), separators=(',',':'))
    print('broadband', len(bb), 'sectors', len(sec_agg))
    print('OK')

if __name__=='__main__':
    main()
