import {writeFileSync} from "node:fs";
const FEEDS=[["BBC Asia","https://feeds.bbci.co.uk/news/world/asia/rss.xml"],["Al Jazeera","https://www.aljazeera.com/xml/rss/all.xml"],["ONU Asia-Pacifico","https://news.un.org/feed/subscribe/en/news/region/asia-pacific/feed/rss.xml"],["BBC Mondo","https://feeds.bbci.co.uk/news/world/rss.xml"],["Guardian Asia","https://www.theguardian.com/world/asia-pacific/rss"]];
const KW={nk:/north korea|pyongyang|kim jong|dprk/i,myanmar:/myanmar|rakhine|arakan|rohingya/i,afghanistan:/afghan|taliban|panjshir/i,afpak:/(pakistan[\s\S]*afghan|afghan[\s\S]*pakistan)/i,pakistan:/pakistan|balochistan|khyber|\bTTP\b/i,kashmir:/kashmir|line of control|(india[\s\S]*pakistan|pakistan[\s\S]*india)/i,thai:/thailand[\s\S]*cambodia|cambodia[\s\S]*thailand|thai-cambodia/i,taiwan:/taiwan/i,scs:/south china sea|scarborough|spratly|second thomas|west philippine|(philippine[\s\S]*china|china[\s\S]*philippine)/i,gaza:/gaza|west bank|hamas/i,iran:/\biran\b|iranian|tehran/i};
const WAR=/\bwar\b|warfare|attack|strike|airstrike|military|troops|\barmy\b|soldier|killed|death toll|\bdead\b|missile|drone|bomb|shell(?:ing|ed)|ceasefire|truce|clash|fighting|rebel|militant|insurg|offensive|invasion|\bnavy\b|naval|coast guard|warship|blockade|nuclear|hostage|massacre|genocide|refugee|displaced|humanitarian|border|escalat|defen[cs]e|weapon|conflict|terror|junta|sanction|talks|peace/i;
const NOT=/cricket|football|soccer|tennis|olympic|\bfilm\b|movie|actor|festival|recipe|fashion|tourism|concert|k-pop|box office|oscar|stocks?\b|shares\b|earnings|\bgolf\b|baseball/i;
const MAXAGE=10*864e5;
const tag=(x,t)=>{const m=x.match(new RegExp("<"+t+"[^>]*>([\\s\\S]*?)</"+t+">","i"));return m?m[1].replace(/<!\[CDATA\[|\]\]>/g,"").trim():""};
const attr=(x,re)=>{const m=x.match(re);return m?m[1].replace(/&amp;/g,"&"):""};
const dec=s=>s.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
const UA={"user-agent":"Mozilla/5.0 (compatible; AsiaWarwatch/1.0)"};
const items=[];
for(const [src,url] of FEEDS){try{const r=await fetch(url,{headers:UA,signal:AbortSignal.timeout(15000)});const x=await r.text();let n=0;
 for(const it of x.split(/<item[ >]/).slice(1)){const title=dec(tag(it,"title")),d=dec(tag(it,"description")).slice(0,320);const txt=(title+" "+d).replace(/https?:\/\/\S+/g," ");if(!WAR.test(txt)||NOT.test(title))continue;
  const k=Object.keys(KW).filter(q=>KW[q].test(txt));if(!k.length)continue;
  const pub=new Date(tag(it,"pubDate"));if(!isNaN(pub)&&Date.now()-pub>MAXAGE)continue;const t=(isNaN(pub)?new Date():pub).toISOString();
  let img=attr(it,/<media:thumbnail[^>]*url="([^"]+)"/i)||attr(it,/<media:content[^>]*url="([^"]+)"/i)||attr(it,/<enclosure[^>]*type="image[^>]*url="([^"]+)"/i)||attr(it,/<enclosure[^>]*url="([^"]+\.(?:jpe?g|png|webp)[^"]*)"/i)||attr(it,/<img[^>]*src="([^"]+)"/i);
  items.push({u:dec(tag(it,"link")),title,d,img,t,fonte:src,k});n++}
 console.log(src,"->",n)}catch(e){console.error(src,"ERRORE",e.message)}}
const seen=new Set();
let out=items.sort((a,b)=>b.t.localeCompare(a.t)).filter(a=>a.u&&!seen.has(a.u)&&seen.add(a.u)).slice(0,60);
await Promise.all(out.filter(a=>!a.img).map(async a=>{try{const r=await fetch(a.u,{headers:UA,signal:AbortSignal.timeout(8000)});const h=(await r.text()).slice(0,200000);
 a.img=attr(h,/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)||attr(h,/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image/i)||attr(h,/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i)}catch(e){}}));
const con=out.filter(a=>a.img).length;
const counts={};for(const a of out)for(const k of a.k)counts[k]=(counts[k]||0)+1;
writeFileSync("site/news.json",JSON.stringify({updated:new Date().toISOString(),counts,items:out}));
console.log("Articoli:",out.length,"con immagine:",con);
