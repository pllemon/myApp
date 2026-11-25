const fs=require('fs'),path=require('path');

function findMatchingClose(str,start){
  let depth=1;
  let i=start+1;
  while(i<str.length && depth>0){
    const openView=str.indexOf('<view',i);
    const closeView=str.indexOf('</view>',i);
    const openField=str.indexOf('<m-field',i);
    const closeField=str.indexOf('</m-field>',i);
    const openPicker=str.indexOf('<picker',i);
    const closePicker=str.indexOf('</picker>',i);
    const openTextarea=str.indexOf('<textarea',i);
    const closeTextarea=str.indexOf('</textarea>',i);
    
    const all=[
      {p:openView,delta:1},
      {p:closeView,delta:-1},
      {p:openField,delta:1},
      {p:closeField,delta:-1},
      {p:openPicker,delta:1},
      {p:closePicker,delta:-1},
      {p:openTextarea,delta:1},
      {p:closeTextarea,delta:-1},
    ].filter(x=>x.p>=0);
    
    if(all.length===0) break;
    all.sort((a,b)=>a.p-b.p);
    const first=all[0];
    depth+=first.delta;
    i=first.p+1;
    
    if(depth===0){
      return first.p;
    }
  }
  return -1;
}

function convertWxml(c){
  c=c.replace(/<view class="m-save-btn" bindtap="save">(.*?)<\/view>/gs,(m,inner)=>{
    const text=inner.match(/\{\{isEdit \? '([^']+)' : '([^']+)'\}\}/);
    if(text){
      return '<m-save-bar save-text="{{isEdit ? \''+text[1]+'\' : \''+text[2]+'\'}}" bind:save="save" />';
    }
    const plain=inner.trim();
    if(plain) return '<m-save-bar save-text="'+plain+'" bind:save="save" />';
    return '<m-save-bar bind:save="save" />';
  });

  let result='';
  let idx=0;
  
  while(idx<c.length){
    const patterns=[
      /<view([^>]*)class="m-form-item-full"([^>]*)>/,
      /<view([^>]*)class="m-form-item"([^>]*)>/,
    ];
    
    let found=null;
    for(let oi=0;oi<patterns.length;oi++){
      const m=c.slice(idx).match(patterns[oi]);
      if(m){
        if(!found || m.index<found.match.index){
          found={match:m,offset:oi===0?1:0};
        }
      }
    }
    
    if(found){
      const absIdx=idx+found.match.index;
      const openTag=c.slice(absIdx, absIdx+found.match[0].length);
      const before=c.slice(idx,absIdx);
      
      const closePos=findMatchingClose(c, absIdx);
      if(closePos<0){
        result+=c.slice(idx);
        break;
      }
      
      const inner=c.slice(absIdx+openTag.length, closePos);
      const closeTagEnd=c.indexOf('</view>',closePos)+7;
      const rest=c.slice(closeTagEnd);
      
      let label='';
      const textKeyMatch=inner.match(/<text class="m-form-key">([^<]+)<\/text>/);
      const viewKeyMatch=inner.match(/<view class="m-form-key">([^<]+)<\/view>/);
      if(textKeyMatch){label=textKeyMatch[1].trim();}
      else if(viewKeyMatch){label=viewKeyMatch[1].trim();}
      
      let attrs='';
      let click=false;
      let bindtap='';
      let block=found.offset===1;
      
      const wxMatch=openTag.match(/\s(wx:[a-z]+="[^"]*")/g);
      if(wxMatch) attrs=wxMatch.join(' ').trim();
      
      if(openTag.includes('click')){click=true;}
      const tapMatch=openTag.match(/bindtap="(\w+)"/);
      if(tapMatch){bindtap=tapMatch[1];}
      
      let newOpen='<m-field';
      if(attrs) newOpen+=' '+attrs;
      if(label) newOpen+=' label="'+label+'"';
      if(click) newOpen+=' click';
      if(block) newOpen+=' block';
      if(bindtap) newOpen+=' bind:tap="'+bindtap+'"';
      newOpen+='>';
      
      let newInner=inner
        .replace(/\s*<text class="m-form-key">[^<]+<\/text>/,'')
        .replace(/\s*<view class="m-form-key">[^<]+<\/view>/,'');
      
      result+=before+newOpen+newInner+'</m-field>';
      c=rest;
      idx=0;
    } else {
      result+=c.slice(idx);
      break;
    }
  }
  
  return result;
}

const root='d:/Lpl/myApp/miniprogram/pages';
const results=[];
function walk(d){fs.readdirSync(d).forEach(f=>{const p=path.join(d,f);const s=fs.statSync(p);if(s.isDirectory())walk(p);else if(f.endsWith('.wxml')){const c=fs.readFileSync(p,'utf8');if(c.includes('m-form-item')||c.includes('m-save-btn')){results.push(p);}}});}
walk(root);

console.log('要转换的文件数:',results.length);

let converted=0;
let errors=0;
results.forEach(f=>{
  try{
    const original=fs.readFileSync(f,'utf8');
    const converted_text=convertWxml(original);
    
    // 验证标签平衡
    const vO=(converted_text.match(/<view[\s>]/g)||[]).length;
    const vC=(converted_text.match(/<\/view>/g)||[]).length;
    const fO=(converted_text.match(/<m-field[\s>]/g)||[]).length;
    const fC=(converted_text.match(/<\/m-field>/g)||[]).length;
    
    const hasItem=converted_text.includes('class="m-form-item"');
    const hasSaveBtn=converted_text.includes('class="m-save-btn"');
    
    if(vO!==vC){
      console.log('ERROR '+path.basename(path.dirname(f))+': view '+(vO)+'/'+vC);
      errors++;
      return;
    }
    if(fO!==fC){
      console.log('ERROR '+path.basename(path.dirname(f))+': m-field '+(fO)+'/'+fC);
      errors++;
      return;
    }
    
    fs.writeFileSync(f,converted_text,'utf8');
    const name=path.basename(path.dirname(f));
    console.log('OK '+name+' m-field:'+fO+' 残留m-form-item:'+hasItem+' 残留m-save-btn:'+hasSaveBtn);
    converted++;
  }catch(e){
    console.log('EXCEPTION '+f+': '+e.message);
    errors++;
  }
});

console.log('\n完成: '+converted+' 成功 '+errors+' 失败');