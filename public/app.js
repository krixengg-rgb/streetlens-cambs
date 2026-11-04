let S,P,chart,map;const $=s=>document.querySelector(s),fmt=n=>n.toLocaleString('en-GB');
const slug=s=>s.toLowerCase().replace(/[^a-z]+/g,'-');
const mname=m=>new Date(m+'-01').toLocaleDateString('en-GB',{month:'short',year:'2-digit'});
const cn=id=>(S.categories.find(c=>c.id==id)||{name:id}).name;
function csv(name,rows){const b=new Blob([rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click()}
function typeTable(byType,total,id){const rows=Object.entries(byType).filter(e=>e[1]).sort((a,b)=>b[1]-a[1]);const max=rows[0]?rows[0][1]:1;
 window['_'+id]=[['Crime type','Count','Share %'],...rows.map(([k,v])=>[cn(k),v,(v/total*100).toFixed(1)])];
 return `<div class="row"><h2>By crime type</h2><span class="ctl"><button class="btn" data-tip="Download this crime-type table as a CSV file for Excel or Sheets." onclick="csv('${id}.csv',_${id})">Download CSV</button>${tipI('Each row is a police crime category; share is its percentage of all crimes shown here.')}</span></div><table><tr><th>Type</th><th class="n">Count</th><th class="n">Share</th><th style="width:30%"></th></tr>${rows.map(([k,v])=>`<tr><td>${cn(k)}</td><td class="n">${fmt(v)}</td><td class="n">${(v/total*100).toFixed(1)}%</td><td><div class="bar"><i style="width:${v/max*100}%"></i></div></td></tr>`).join('')}</table>`}
function trend(monthly){if(chart)chart.destroy();chart=new Chart($('#trend'),{type:'line',data:{labels:S.months.map(mname),datasets:[{data:S.months.map(m=>monthly[m]),borderColor:'#0f766e',backgroundColor:'#0f766e22',fill:true,tension:.3}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}})}
function areaView(a,isAll){const period=`${mname(S.months[0])} – ${mname(S.months.at(-1))}`;
 $('#htitle').textContent=isAll?'Crime in Cambridgeshire, made clear':`Crime in ${a.name}`;
 let html=`<div class="cards"><div class="card"><div class="muted">Recorded crimes, ${period}</div><div class="big">${fmt(a.total)}</div></div>
 <div class="card"><div class="muted">Per 1,000 residents (12 months)</div><div class="big">${a.rate}</div>${isAll?'':`<div class="muted">County average ${S.overview.rate}</div>`}</div>
 <div class="card"><div class="muted">Residents (ONS mid-${S.popYear})</div><div class="big">${fmt(a.population)}</div></div>
 <div class="card"><div class="row" style="margin:0"><div class="muted">Solve rate</div>${tipI('Share of crimes (excluding anti-social behaviour) where a suspect was charged/summonsed or given an out-of-court resolution, by latest recorded outcome.')}</div><div class="big">${a.solve}%</div></div>
 <div class="card"><div class="muted">Median house price</div><div class="big">${PRc&&(isAll?'':'£'+fmt(PRc.districts[a.code][0]))||'–'}</div><div class="muted">${isAll?'See district comparison below':fmt(PRc?PRc.districts[a.code][1]:0)+' sales, HM Land Registry'}</div></div></div>
 <div class="grid2"><div class="card">${typeTable(a.byType,a.total,'types')}</div><div class="card"><div class="row"><h2>Month by month</h2><button class="btn" onclick="csv('monthly.csv',[['Month','Crimes'],...S.months.map(m=>[m,${JSON.stringify(a.monthly)}[m]])])" data-tip="Download the monthly crime counts as a CSV file.">Download CSV</button></div><canvas id="trend" height="220"></canvas></div></div>`;
 html+=`<div class="grid2" style="margin-top:20px"><div class="card">${outTable(a.outcomes,'out')}</div><div class="card"><div class="row"><h2>House prices</h2>${tipI('Median price of standard residential sales recorded by HM Land Registry in the last 12 months of available data.')}</div>${priceBlock(a,isAll)}</div></div>`;
 if(isAll){window._d=[['District','Crimes','Population','Per 1,000'],...S.districts.map(d=>[d.name,d.total,d.population,d.rate])];
 html+=`<div class="card dist" style="margin-top:16px"><div class="row"><h2>Districts compared</h2><span class="ctl"><button class="btn" data-tip="Download the district comparison as a CSV file." onclick="csv('districts.csv',_d)">Download CSV</button>${tipI('Districts ranked by crimes per 1,000 residents. Click a name to open that district.')}</span></div><table><tr><th>District</th><th class="n">Crimes</th><th class="n">Residents</th><th class="n">Per 1,000</th></tr>${[...S.districts].sort((a,b)=>b.rate-a.rate).map(d=>`<tr><td><a href="#/${slug(d.name)}" data-tip="Open the ${d.name} page with its full breakdown and trend.">${d.name}</a></td><td class="n">${fmt(d.total)}</td><td class="n">${fmt(d.population)}</td><td class="n">${d.rate}</td></tr>`).join('')}</table></div>`}
 $('#app').innerHTML=html;trend(a.monthly);if(isAll)scatter()}
function hav(a,b,c,d){const R=3958.8,r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
async function postcodeView(pc){$('#pcerr').textContent='';$('#app').innerHTML='Looking up postcode…';
 const r=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pc)).then(r=>r.json()).catch(()=>null);
 if(!r||r.status!=200){$('#pcerr').textContent='Postcode not found.';return route()}
 const {latitude:la,longitude:lo,postcode,admin_district}=r.result;$('#htitle').textContent=`Within 1 mile of ${postcode}`;
 if(!P)P=await fetch('data/points.json').then(r=>r.json());
 const near=P.filter(p=>Math.abs(p[0]-la)<.02&&Math.abs(p[1]-lo)<.03&&hav(la,lo,p[0],p[1])<=1);
 const cats=S.categories.map(c=>c.id),by={},mon={};S.months.forEach(m=>mon[m]=0);near.forEach(p=>{by[cats[p[2]]]=(by[cats[p[2]]]||0)+1;mon[S.months[p[3]]]++});
 if(!near.length&&!S.districts.some(d=>d.name==admin_district)){$('#app').innerHTML=`<div class="card">${postcode} is in ${admin_district}, outside Cambridgeshire. This prototype only covers Cambridgeshire & Peterborough for now.</div>`;return}
 const busiest=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
 const [GP,DE,SC,ST,RA,SS,PR]=await Promise.all(['gp','dentists','schools','stops','rail','stopsearch','prices'].map(lj));
 const oc=[0,0,0,0,0,0,0];near.forEach(p=>oc[p[4]]++);const nonAsb=near.length-oc[6],pos=oc[0]+oc[1],solve=nonAsb?(pos/nonAsb*100).toFixed(1):'–';
 const ssN=SS.filter(p=>hav(la,lo,p[0],p[1])<=1).length;
 const sector=postcode.slice(0,-2).trim(),sp=PR.sectors[sector];
 const st500=ST.filter(p=>Math.abs(p[0]-la)<.01&&hav(la,lo,p[0],p[1])<=0.3107).length,rail=nearest(RA,la,lo,1)[0];
 const nlist=(arr,f)=>`<ol class="near">${nearest(arr,la,lo,3).map(x=>`<li><b>${esc(x[2])}</b>${f?` <span class="muted">${f(x)}</span>`:''}<span class="dist-m">${x.d.toFixed(1)} mi</span></li>`).join('')}</ol>`;
 window._oc=[['Outcome','Crimes','Share %'],...S.outcomeBuckets.map((b,i)=>[b,oc[i],(oc[i]/(near.length||1)*100).toFixed(1)])];
 $('#app').innerHTML=`<div class="cards"><div class="card"><div class="muted">Crimes within 1 mile, last 12 months</div><div class="big">${fmt(near.length)}</div></div>
 <div class="card"><div class="row" style="margin:0"><div class="muted">Solve rate near you</div>${tipI('Share of crimes (excluding anti-social behaviour, which has no outcomes) where a suspect was charged or summonsed, or got an out-of-court resolution such as a caution or community resolution. Latest recorded outcome; recent crimes may still be under investigation.')}</div><div class="big">${solve}%</div><div class="muted">${fmt(pos)} of ${fmt(nonAsb)} crimes · county ${S.overview.solve}%</div></div>
 <div class="card"><div class="row" style="margin:0"><div class="muted">Stop and searches within 1 mile</div>${tipI('Police stop and searches recorded with a location within 1 mile, last 12 months.')}</div><div class="big">${fmt(ssN)}</div></div>
 <div class="card"><div class="row" style="margin:0"><div class="muted">Median house price, ${sector}</div>${tipI('Median price of standard residential sales in this postcode sector, from HM Land Registry Price Paid Data, last 12 months available.')}</div><div class="big">${sp?'£'+fmt(sp[0]):'–'}</div><div class="muted">${sp?fmt(sp[1])+' sales':'No sales recorded'} · ${PR.from.slice(0,7)} to ${PR.to.slice(0,7)}</div></div>
 <div class="card"><div class="row" style="margin:0"><div class="muted">Bus stops within 500m</div>${tipI('Active bus stops from the NaPTAN national stop register within 500 metres.')}</div><div class="big">${st500}</div><div class="muted">Nearest rail: ${rail?esc(rail[2])+' ('+rail.d.toFixed(1)+' mi)':'–'}</div></div>
 <div class="card"><div class="muted">District</div><div class="big" style="font-size:20px">${admin_district}</div><div class="muted">Most common crime: ${busiest?cn(busiest[0]):'–'}</div></div></div>
 <div class="card" style="margin-bottom:20px"><div class="row"><h2>Map</h2>${tipI('Turn layers on or off with the switches below. Numbers in circles group nearby points; zoom in to split them.')}</div><div class="layers" id="layers"></div><div id="map"></div><div class="muted" style="margin-top:6px">Crime points are anonymised police map points, not exact addresses.</div></div>
 <div class="grid3"><div class="card"><div class="row"><h2>Nearest GPs</h2>${tipI('Active GP practices from the NHS Organisation Data Service, by straight-line distance.')}</div>${nlist(GP,x=>x[3])}</div>
 <div class="card"><div class="row"><h2>Nearest dentists</h2>${tipI('Active dental practices from the NHS Organisation Data Service. Check directly whether they take new NHS patients.')}</div>${nlist(DE,x=>x[3])}</div>
 <div class="card"><div class="row"><h2>Nearest schools</h2>${tipI('Open schools from DfE Get Information about Schools. Rating is the latest Ofsted graded overall effectiveness where one exists (single-word grades stopped in Sept 2024).')}</div>${nlist(SC,x=>esc(x[3])+(x[5]?' · Ofsted: '+x[5]:''))}</div></div>
 <div class="grid2" style="margin-top:20px"><div class="card">${typeTable(by,near.length||1,'near')}</div><div class="card">${outTable(oc,'nearout')}</div></div>
 <div class="card" style="margin-top:20px"><div class="row"><h2>Month by month</h2>${tipI('Crimes recorded each month within 1 mile of this postcode.')}</div><canvas id="trend" height="160"></canvas></div>`;
 trend(mon);if(map)map.remove();map=L.map('map').setView([la,lo],14);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
 L.circle([la,lo],{radius:1609,color:'#0f766e',fill:false}).addTo(map);L.marker([la,lo]).addTo(map).bindPopup(postcode);
 const cl=L.markerClusterGroup();near.forEach(p=>cl.addLayer(L.circleMarker([p[0],p[1]],{radius:5,color:'#f59e0b'}).bindPopup(`${cn(cats[p[2]])}<br>${mname(S.months[p[3]])}<br><i>${S.outcomeBuckets[p[4]]}</i>`)));
 const pin=(c,t)=>L.divIcon({className:'pin',html:`<span style="background:${c}">${t}</span>`,iconSize:[26,26]});
 const lay=(arr,c,t,pop)=>L.layerGroup(arr.filter(p=>hav(la,lo,p[0],p[1])<=5).map(p=>L.marker([p[0],p[1]],{icon:pin(c,t)}).bindPopup(pop(p))));
 const busCl=L.markerClusterGroup({disableClusteringAtZoom:17});ST.filter(p=>hav(la,lo,p[0],p[1])<=3).forEach(p=>busCl.addLayer(L.circleMarker([p[0],p[1]],{radius:4,color:'#2563eb'}).bindPopup('Bus stop: '+esc(p[2]))));
 const L_={crimes:[cl,'Crimes','Crime points within 1 mile, grouped into clusters.',1],gp:[lay(GP,'#be123c','GP',p=>`<b>${esc(p[2])}</b><br>GP practice · ${p[3]}`),'GPs','GP surgeries within 5 miles (NHS ODS).',0],
  dent:[lay(DE,'#7c3aed','D',p=>`<b>${esc(p[2])}</b><br>Dental practice · ${p[3]}`),'Dentists','Dental practices within 5 miles (NHS ODS).',0],
  sch:[lay(SC,'#15803d','S',p=>`<b>${esc(p[2])}</b><br>${esc(p[3])} · ${esc(p[4])}${p[5]?'<br>Ofsted: '+p[5]+' ('+p[6]+')':''}`),'Schools','Open schools within 5 miles with phase, type and latest Ofsted grade (DfE GIAS, Ofsted).',0],
  bus:[busCl,'Bus stops','Bus stops within 3 miles (NaPTAN), clustered.',0],rail:[lay(RA,'#0f172a','R',p=>esc(p[2])),'Rail','Railway stations (NaPTAN).',0]};
 $('#layers').innerHTML=Object.entries(L_).map(([k,v])=>`<label class="lt" data-tip="${v[2]}"><input type="checkbox" data-l="${k}" ${v[3]?'checked':''}> ${v[1]}</label>`).join('');
 Object.values(L_).forEach(v=>v[3]&&map.addLayer(v[0]));
 $('#layers').onchange=e=>{const v=L_[e.target.dataset.l];e.target.checked?map.addLayer(v[0]):map.removeLayer(v[0])}}
function route(){const h=decodeURIComponent(location.hash.slice(2));
 $('#nav').innerHTML=`<a href="#/" data-tip="County-wide summary for Cambridgeshire &amp; Peterborough." class="${!h?'on':''}">Overview</a>`+S.districts.map(d=>`<a href="#/${slug(d.name)}" data-tip="Crime figures for ${d.name} district." class="${h==slug(d.name)?'on':''}">${d.name}</a>`).join('');
 if(h.startsWith('postcode/'))return postcodeView(h.slice(9));const d=S.districts.find(d=>slug(d.name)==h);areaView(d||S.overview,!d)}
$('#pcform').onsubmit=e=>{e.preventDefault();const v=$('#pc').value.trim();if(v)location.hash='#/postcode/'+v.replace(/\s+/g,'')};
Promise.all([fetch('data/summary.json').then(r=>r.json()),lj('prices')]).then(([s,pr])=>{S=s;PRc=pr;const so=a=>{const t=a.outcomes.reduce((x,y)=>x+y,0)-a.outcomes[6];a.solve=(t?(a.outcomes[0]+a.outcomes[1])/t*100:0).toFixed(1)};so(s.overview);s.districts.forEach(so);$('#gen').textContent=`Data ${s.months[0]} to ${s.months.at(-1)}, built ${s.generated}.`;addEventListener('hashchange',route);route()});

function tipI(t){return `<button type="button" class="tip-i" aria-label="Help" data-tip="${t}"></button>`}
const tip=document.getElementById('tip');let tipEl=null;
function showTip(el){const t=el.getAttribute('data-tip');if(!t)return;tipEl=el;tip.textContent=t;tip.classList.add('show');
 const r=el.getBoundingClientRect(),w=tip.offsetWidth,hh=tip.offsetHeight;let x=Math.min(Math.max(8,r.left+r.width/2-w/2),innerWidth-w-8),y=r.bottom+8;if(y+hh>innerHeight-8)y=r.top-hh-8;
 tip.style.left=x+'px';tip.style.top=y+'px';el.setAttribute('aria-describedby','tip');if(el.classList.contains('tip-i'))el.setAttribute('aria-expanded','true')}
function hideTip(){if(tipEl){tipEl.removeAttribute('aria-describedby');tipEl.removeAttribute('aria-expanded')}tipEl=null;tip.classList.remove('show')}
const touch=matchMedia('(hover:none)').matches;
document.addEventListener('mouseover',e=>{if(touch)return;const el=e.target.closest('[data-tip]');if(el)showTip(el);else if(tipEl&&!tipEl.classList.contains('tip-i'))hideTip()});
document.addEventListener('focusin',e=>{const el=e.target.closest('[data-tip]');if(el){showTip(el);tipT=Date.now()}else hideTip()});let tipT=0;
document.addEventListener('focusout',()=>hideTip());
document.addEventListener('click',e=>{const el=e.target.closest('.tip-i');if(el){e.preventDefault();tipEl===el&&tip.classList.contains('show')&&Date.now()-tipT>400?hideTip():showTip(el)}else if(!e.target.closest('[data-tip]'))hideTip()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip()});addEventListener('scroll',()=>{if(touch)hideTip()},{passive:true});

var _lj;function lj(n){_lj=_lj||{};return _lj[n]||(_lj[n]=fetch('data/'+n+'.json').then(r=>r.json()))}
var PRc=null;
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function nearest(arr,la,lo,n){return arr.map(p=>Object.assign([...p],{d:hav(la,lo,p[0],p[1])})).sort((a,b)=>a.d-b.d).slice(0,n)}
function outTable(oc,id){const t=oc.reduce((a,b)=>a+b,0)||1;window['_'+id]=[['Outcome','Crimes','Share %'],...S.outcomeBuckets.map((b,i)=>[b,oc[i],(oc[i]/t*100).toFixed(1)])];
 return `<div class="row"><h2>Outcomes</h2><span class="ctl"><button class="btn" data-tip="Download the outcome breakdown as a CSV file." onclick="csv('${id}.csv',_${id})">Download CSV</button>${tipI('Latest police outcome for each crime, grouped. Charged/summonsed and out-of-court resolutions count towards the solve rate.')}</span></div><table><tr><th>Outcome</th><th class="n">Crimes</th><th class="n">Share</th></tr>${S.outcomeBuckets.map((b,i)=>`<tr><td>${b}</td><td class="n">${fmt(oc[i])}</td><td class="n">${(oc[i]/t*100).toFixed(1)}%</td></tr>`).join('')}</table>`}
function priceBlock(a,isAll){if(!PRc)return '–';const rows=isAll?S.districts:[a];
 return `<table><tr><th>Area</th><th class="n">Median</th><th class="n">Sales</th></tr>${rows.map(d=>`<tr><td>${d.name}</td><td class="n">£${fmt(PRc.districts[d.code][0])}</td><td class="n">${fmt(PRc.districts[d.code][1])}</td></tr>`).join('')}</table><p class="muted">${PRc.from.slice(0,7)} to ${PRc.to.slice(0,7)}.</p>${isAll?`<div class="row" style="margin-top:12px"><h2 style="font-size:17px">Crime rate vs median price</h2>${tipI('Each dot is a district: crimes per 1,000 residents against median house price.')}</div><canvas id="scatter" height="200"></canvas>`:''}`}
var sc;function scatter(){if(!PRc||!$('#scatter'))return;if(sc)sc.destroy();sc=new Chart($('#scatter'),{type:'scatter',data:{datasets:[{data:S.districts.map(d=>({x:PRc.districts[d.code][0],y:d.rate,n:d.name})),backgroundColor:'#0f766e',pointRadius:7}]},options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw.n}: £${fmt(c.raw.x)}, ${c.raw.y} per 1,000`}}},scales:{x:{title:{display:true,text:'Median house price (£)'}},y:{beginAtZero:true,title:{display:true,text:'Crimes per 1,000'}}}}})}
