const fs=require('fs');

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

let c=fs.readFileSync('d:/Lpl/myApp/miniprogram/pages/health/weight/edit.wxml','utf8');
c=c.replace(/<view class="m-save-btn" bindtap="save">(.*?)<\/view>/gs,'<m-save-bar />');

// 模拟 while 循环
let result='';
let idx=0;
let step=0;

while(idx<c.length){
  step++;
  if(step>10) {console.log('超过10步，退出');break;}
  
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
    
    console.log('Step '+step+': found m-form-item at '+absIdx+' closePos='+closePos);
    console.log('  openTag:',openTag);
    console.log('  found.offset:',found.offset);
    
    if(closePos<0){
      console.log('  closePos=-1, 退出循环');
      result+=c.slice(idx);
      break;
    }
    
    const closeTagEnd=c.indexOf('</view>',closePos)+7;
    const rest=c.slice(closeTagEnd);
    result+=before+'[CONVERTED]';
    c=rest;
    idx=0;
  } else {
    console.log('Step '+step+': 没找到更多 m-form-item');
    result+=c.slice(idx);
    break;
  }
}

console.log('\n转换后有多少 [CONVERTED]:',(result.match(/\[CONVERTED\]/g)||[]).length);
console.log('剩余 m-form-item:',(result.match(/class="m-form-item[^-]/g)||[]).length);
console.log('剩余 m-form-item-full:',(result.match(/class="m-form-item-full/g)||[]).length);