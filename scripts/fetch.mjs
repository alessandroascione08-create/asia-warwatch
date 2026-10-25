import {writeFileSync} from "node:fs";
const FEEDS=[["BBC Asia","https://feeds.bbci.co.uk/news/world/asia/rss.xml"],["Al Jazeera","https://www.aljazeera.com/xml/rss/all.xml"],["ONU Asia-Pacifico","https://news.un.org/feed/subscribe/en/news/region/asia-pacific/feed/rss.xml"],["BBC Mondo","https://feeds.bbci.co.uk/news/world/rss.xml"],["Guardian Asia","https://www.theguardian.com/world/asia-pacific/rss"],["ANSA Mondo","https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml",true]];
const KW={nk:/north korea|pyongyang|kim jong|dprk|corea del nord/i,myanmar:/myanmar|rakhine|arakan|rohingya|birmania/i,afghanistan:/afghan|taliban|talebani|panjshir/i,afpak:/(pakistan[\s\S]*afghan|afghan[\s\S]*pakistan)/i,pakistan:/pakistan|balochistan|beluchistan|khyber|\bTTP\b/i,kashmir:/kashmir|line of control|(india[\s\S]*pakistan|pakistan[\s\S]*india)/i,thai:/(thailand|thailandia)[\s\S]*cambodia|cambodia[\s\S]*(thailand|thailandia)|cambogia/i,taiwan:/taiwan/i,scs:/south china sea|mar cinese meridionale|scarborough|spratly|second thomas|west philippine|(philippine|filippine)[\s\S]*(china|cina)/i,gaza:/gaza|west bank|cisgiordania|hamas/i,iran:/\biran\b|iranian|iraniano|tehran|teheran/i};
const WAR=/\bwar\b|warfare|attack|strike|airstrike|military|troops|\barmy\b|soldier|killed|death toll|\bdead\b|missile|drone|bomb|shell(?:ing|ed)|ceasefire|truce|clash|fighting|rebel|militant|insurg|offensive|invasion|\bnavy\b|naval|coast guard|warship|blockade|nuclear|hostage|massacre|genocide|refugee|displaced|humanitarian|border|escalat|defen[cs]e|weapon|conflict|terror|junta|sanction|talks|peace|guerra|attacc|raid|bombard|missil|soldat|esercito|truppe|militar|uccis|\bmort[io]\b|cessate il fuoco|tregua|scontri|combattiment|ribelli|miliziani|offensiva|invasione|nucleare|ostagg|massacro|rifugiat|sfollat|umanitari|confine|escalation|difesa|armi|conflitto|terrorism|sanzion|negoziat|pace|vittime|esplosion/i;
const NOT=/cricket|football|soccer|tennis|olympic|\bfilm\b|movie|actor|festival|recipe|fashion|tourism|concert|k-pop|box office|oscar|stocks?\b|shares\b|earnings|\bgolf\b|baseball|calcio|cinema|ricett|\bmoda\b|turismo|concerto|borsa\b|olimpi/i;
const MAXAGE=10*864e5,UA={"user-agent":"Mozilla/5.0 (compatible; ConflittiInAsia/1.0)"};
const tag=(x,t)=>{const m=x.match(new RegExp("<"+t+"[^>]*>([\\s\\S]*?)</"+t+">","i"));return m?m[1].replace(/<!\[CDATA\[|\]\]>/g,"").trim():""};
const attr=(x,re)=>{const m=x.match(re);return m?m[1].replace(/&amp;/g,"&"):""};
const dec=s=>s.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
const [OW,RP]=(process.env.GITHUB_REPOSITORY||"/").split("/");const BASE=OW?`https://${OW}.github.io/${RP}/`:"";
const get=async u=>{const r=await fetch(u+"?"+Date.now(),{signal:AbortSignal.timeout(15000)});if(!r.ok)throw 0;return r.json()};
let prev={};try{for(const a of (await get(BASE+"news.json")).items||[])if(a.it)prev[a.u]=a}catch(e){}
const items=[];
for(const [src,url,ita] of FEEDS){try{const r=await fetch(url,{headers:UA,signal:AbortSignal.timeout(15000)});const x=await r.text();let n=0;
 for(const it of x.split(/<item[ >]/).slice(1)){const title=dec(tag(it,"title")),d=dec(tag(it,"description")).slice(0,320);const txt=(title+" "+d).replace(/https?:\/\/\S+/g," ");
  if(!WAR.test(txt)||NOT.test(title))continue;const k=Object.keys(KW).filter(q=>KW[q].test(txt));if(!k.length)continue;
  const pub=new Date(tag(it,"pubDate"));if(!isNaN(pub)&&Date.now()-pub>MAXAGE)continue;const t=(isNaN(pub)?new Date():pub).toISOString();
  let img=attr(it,/<media:thumbnail[^>]*url="([^"]+)"/i)||attr(it,/<media:content[^>]*url="([^"]+)"/i)||attr(it,/<enclosure[^>]*type="image[^>]*url="([^"]+)"/i)||attr(it,/<enclosure[^>]*url="([^"]+\.(?:jpe?g|png|webp)[^"]*)"/i)||attr(it,/<img[^>]*src="([^"]+)"/i);
  items.push({u:dec(tag(it,"link")),title,d,img,t,fonte:src,k,it:!!ita});n++}
 console.log(src,"->",n)}catch(e){console.error(src,"ERRORE",e.message)}}
const seen=new Set();
let out=items.sort((a,b)=>b.t.localeCompare(a.t)).filter(a=>a.u&&!seen.has(a.u)&&seen.add(a.u)).slice(0,60);
const tr=async t=>{if(!t)return t;const r=await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=it&dt=t&q="+encodeURIComponent(t),{headers:UA,signal:AbortSignal.timeout(10000)});const j=await r.json();return j[0].map(x=>x[0]).join("")||t};
let tn=0;
for(let i=0;i<out.length;i+=5)await Promise.all(out.slice(i,i+5).map(async a=>{if(a.it)return;const p=prev[a.u];if(p){a.title=p.title;a.d=p.d;a.it=true;return}
 try{const ti=await tr(a.title);const de=await tr(a.d.slice(0,220));if(ti){a.title=ti;a.d=de;a.it=true;tn++}}catch(e){}}));
await Promise.all(out.filter(a=>!a.img).map(async a=>{try{const r=await fetch(a.u,{headers:UA,signal:AbortSignal.timeout(8000)});const h=(await r.text()).slice(0,200000);
 a.img=attr(h,/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)||attr(h,/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image/i)||attr(h,/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i)}catch(e){}}));
const counts={};for(const a of out)for(const k of a.k)counts[k]=(counts[k]||0)+1;
writeFileSync("site/news.json",JSON.stringify({updated:new Date().toISOString(),counts,items:out}));
console.log("Articoli:",out.length,"tradotti ora:",tn,"con immagine:",out.filter(a=>a.img).length);
// Mappa: Natural Earth (pubblico dominio)
const GU=["https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson","https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"];
let g=null;for(const u of GU){try{g=await (await fetch(u,{signal:AbortSignal.timeout(30000)})).json();if(g.features)break}catch(e){}}
if(g&&g.features){const rd=c=>Array.isArray(c[0])?c.map(rd):[Math.round(c[0]*100)/100,Math.round(c[1]*100)/100];const keep=[];
 for(const f of g.features){const fl=JSON.stringify(f.geometry.coordinates).match(/-?\d+\.?\d*/g).map(Number);let lo=1e9,hi=-1e9,la=1e9,lb=-1e9;for(let i=0;i<fl.length;i+=2){lo=Math.min(lo,fl[i]);hi=Math.max(hi,fl[i]);la=Math.min(la,fl[i+1]);lb=Math.max(lb,fl[i+1])}
 if(hi<25||lo>150||lb<-12||la>62)continue;keep.push({type:"Feature",properties:{n:f.properties.NAME||""},geometry:{type:f.geometry.type,coordinates:rd(f.geometry.coordinates)}})}
 writeFileSync("site/asia.geojson",JSON.stringify({type:"FeatureCollection",features:keep}));console.log("Mappa:",keep.length,"paesi")}
else{try{const o=await get(BASE+"asia.geojson");if(o.features){writeFileSync("site/asia.geojson",JSON.stringify(o));console.log("Mappa: riusata la precedente")}}catch(e){console.error("Mappa: dati non disponibili")}}
