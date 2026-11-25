// node render.js <scenes.json> <outdir> [ids...]  -> outdir/<id>-<side>.png
const {chromium}=require('playwright');const fs=require('fs');
const [,,src,out,...only]=process.argv;
(async()=>{const data=JSON.parse(fs.readFileSync(src,'utf8'));const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1200,height:750},deviceScaleFactor:1});
for(const sc of data){ if(only.length&&!only.includes(sc.id)) continue;
 for(const side of 'ABCD'){ await p.setContent(`<!doctype html><html><body style="margin:0;background:#000">${sc.svgs[side]}</body></html>`);
  await p.waitForTimeout(150); await p.screenshot({path:`${out}/${sc.id}-${side}.png`,clip:{x:0,y:0,width:1200,height:750}}); } }
await b.close();})();
