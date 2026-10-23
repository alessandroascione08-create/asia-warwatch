import {writeFileSync} from "node:fs";
const FEEDS=[["BBC Asia","https://feeds.bbci.co.uk/news/world/asia/rss.xml"],["Al Jazeera","https://www.aljazeera.com/xml/rss/all.xml"],["ONU Asia-Pacifico","https://news.un.org/feed/subscribe/en/news/region/asia-pacific/feed/rss.xml"],["BBC Mondo","https://feeds.bbci.co.uk/news/world/rss.xml"]];
const KW=/north korea|pyongyang|myanmar|rakhine|arakan|rohingya|afghan|taliban|pakistan|baloch|kashmir|thailand|cambodia|taiwan|south china sea|scarborough|philippines|gaza|west bank|hamas|iran|tehran/i;
const tag=(x,t)=>{const m=x.match(new RegExp("<"+t+"[^>]*>([\\s\\S]*?)</"+t+">","i"));return m?m[1].replace(/<!\[CDATA\[|\]\]>/g,"").trim():""};
const attr=(x,re)=>{const m=x.match(re);return m?m[1].replace(/&amp;/g,"&"):""};
const dec=s=>s.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
const items=[];
for(const [src,url] of FEEDS){
  try{
    const r=await fetch(url,{headers:{"user-agent":"Mozilla/5.0 AsiaWarwatch"}});
    const x=await r.text();let n=0;
    for(const it of x.split(/<item[ >]/).slice(1)){
      const title=dec(tag(it,"title")),d=dec(tag(it,"description")).slice(0,300);
      if(!KW.test(title+" "+d))continue;
      const pub=new Date(tag(it,"pubDate"));const ok=!isNaN(pub);
      items.push({u:dec(tag(it,"link")),title,d,
        img:attr(it,/<media:thumbnail[^>]*url="([^"]+)"/i)||attr(it,/<media:content[^>]*url="([^"]+)"/i)||attr(it,/<enclosure[^>]*url="([^"]+)"/i),
        t:(ok?pub:new Date()).toISOString(),
        body:src+" · "+(ok?pub:new Date()).toLocaleString("it-IT",{timeZone:"Europe/Rome"})});n++;
    }
    console.log(src,"->",n,"articoli pertinenti");
  }catch(e){console.error(src,"ERRORE",e.message)}
}
const seen=new Set();
const out=items.sort((a,b)=>b.t.localeCompare(a.t)).filter(a=>a.u&&!seen.has(a.u)&&seen.add(a.u)).slice(0,40);
writeFileSync("site/news.json",JSON.stringify({updated:new Date().toISOString(),items:out}));
console.log("Totale:",out.length);
