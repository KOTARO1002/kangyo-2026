// 問題データの検証: node tools/check.js
const fs=require("fs"),path=require("path");
global.BANK=[];
const dir=path.join(__dirname,"..","data");
const files=fs.readdirSync(dir).filter(f=>/^u\d+\.js$/.test(f)).sort();
let err=0,ox=0,mc=0;const seen=new Map();
const bad=(f,m)=>{err++;console.log("NG",f,m)};
for(const f of files){
  const before=BANK.length;
  try{require(path.join(dir,f))}catch(e){bad(f,"構文エラー "+e.message);continue}
  const u=BANK[before]; if(!u){bad(f,"BANK.pushなし");continue}
  if(u.id!==f.replace(".js",""))bad(f,"id不一致 "+u.id);
  const tp=new Set(u.topics||[]);
  (u.ox||[]).forEach((q,i)=>{
    if(typeof q.q!=="string"||typeof q.a!=="boolean"||!q.e)bad(f,"ox"+i+" 項目不足");
    if(!tp.has(q.t))bad(f,"ox"+i+" topic不一致 "+q.t);
    const k=q.q.replace(/\s/g,""); if(seen.has(k))bad(f,"ox"+i+" 重複 "+seen.get(k)); seen.set(k,f+":ox"+i);
  });
  (u.mc||[]).forEach((q,i)=>{
    if(!Array.isArray(q.c)||q.c.length!==4||!(q.a>=1&&q.a<=4)||!q.e||!q.stem)bad(f,"mc"+i+" 形式不正");
    if(!tp.has(q.t))bad(f,"mc"+i+" topic不一致 "+q.t);
  });
  const t=u.ox.filter(q=>q.a).length;
  const dist=[1,2,3,4].map(n=>u.mc.filter(q=>q.a===n).length).join("/");
  console.log(u.id,u.field,"OX",u.ox.length,"(○"+t+")","MC",u.mc.length,"正解分布",dist,"論点",tp.size);
  ox+=u.ox.length;mc+=u.mc.length;
}
console.log(`合計 ${files.length}単元 OX ${ox} MC ${mc} 計 ${ox+mc}  エラー ${err}`);
process.exit(err?1:0);
