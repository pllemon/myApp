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

const files=[
  'd:/Lpl/myApp/miniprogram/pages/health/weight/edit.wxml',
];

files.forEach(f=>{
  const c=fs.readFileSync(f,'utf8');
  console.log('文件:',f.split('miniprogram/')[1]);
  
  // 找所有 m-form-item 开始
  let pos=0;
  while(true){
    const idx=c.indexOf('class="m-form-item"',pos);
    if(idx<0) break;
    
    // 往前找 <view
    const viewStart=c.lastIndexOf('<view',idx);
    const lineNum=c.slice(0,viewStart).split('\n').length;
    const closePos=findMatchingClose(c,viewStart);
    
    console.log('  L'+lineNum+': viewStart='+viewStart+' closePos='+closePos);
    if(closePos>=0){
      console.log('    闭合附近:',JSON.stringify(c.slice(closePos-20,closePos+30)));
    }
    pos=idx+20;
  }
});