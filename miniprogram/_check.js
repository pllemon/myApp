const fs=require("fs");
const path=require("path");
const root="d:/Lpl/myApp/miniprogram/pages";
let ok=0;
let errs=[];
function walk(d){
  const items=fs.readdirSync(d);
  for(const f of items){
    const p=path.join(d,f);
    const s=fs.statSync(p);
    if(s.isDirectory()){
      walk(p);
    } else if(f.endsWith(".wxml")){
      const c=fs.readFileSync(p,"utf8");
      const vO=(c.match(/<view[\s>]/g)||[]).length;
      const vC=(c.match(/<\/view>/g)||[]).length;
      const fO=(c.match(/<m-field[\s>]/g)||[]).length;
      const fC=(c.match(/<\/m-field>/g)||[]).length;
      const hasBad=c.indexOf('class="m-form-item"')>=0;
      if(vO===vC && fO===fC){
        ok++;
      } else {
        errs.push(path.relative(root,p)+" view "+vO+"/"+vC+" m-field "+fO+"/"+fC);
      }
      if(hasBad){
        errs.push(path.relative(root,p)+" 残留m-form-item");
      }
    }
  }
}
walk(root);
console.log("OK:",ok);
console.log("Errors:",errs.length);
errs.forEach(function(e){console.log("  - "+e);});