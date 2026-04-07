/* ══════════════════════════════════════════════════════   CUSTOM PALETTE SYSTEM + INLINE COLOR WHEEL */
(function(){

const STORE='neoleo_palettes';
const MAX_COLORS=7;
let cpeColors=['#ff6200','#e8c060','#40c8a0','#60a0ff','#ff4040','#c090ff','#ffffff'];
let cpeBg='#080403';
let cpeActive=0;
let cpeH=0,cpeS=1,cpeL=0.5;
let cpeDragging=false;

PALS['custom']={bg:cpeBg,c:[...cpeColors.slice(0,6)]};

const cpBtn   =document.getElementById('custom-pal-btn');
const cpEditor=document.getElementById('custom-pal-editor');
const slotsEl =document.getElementById('cpe-slots');
const wheelCv =document.getElementById('cpe-wheel');
const wheelCtx=wheelCv.getContext('2d');
const cursorEl=document.getElementById('cpe-cursor');
const lightSl =document.getElementById('cpe-lightness');
const prevEl  =document.getElementById('cpe-preview');
const hexIn   =document.getElementById('cpe-hex');
const addBtn  =document.getElementById('cpe-add-slot');
const remBtn  =document.getElementById('cpe-rem-slot');
const applyBtn=document.getElementById('cpe-apply');
const nameIn  =document.getElementById('cpe-name');
const saveBtn =document.getElementById('cpe-save');
const savedList=document.getElementById('cpe-saved-list');

function hslToRgb(h,s,l){const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;return l-a*Math.max(Math.min(k-3,9-k,1),-1);};return[Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)];}
function hslToHex(h,s,l){const[r,g,b]=hslToRgb(h,s,l);return'#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0');}
function hexToHsl(hex){let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;if(max===min)return[0,0,l];const d=max-min,s=l>0.5?d/(2-max-min):d/(max+min);let h;if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;return[h*60,s,l];}

function drawWheel(){
  const W=200,R=100,cx=100,cy=100;
  const img=wheelCtx.createImageData(W,W);
  for(let y=0;y<W;y++){for(let x=0;x<W;x++){
    const dx=x-cx,dy=y-cy,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>R){img.data[(y*W+x)*4+3]=0;continue;}
    const h=(Math.atan2(dy,dx)*180/Math.PI+360)%360,s=dist/R;
    const[r,g,b]=hslToRgb(h,s,cpeL);
    const i=(y*W+x)*4;img.data[i]=r;img.data[i+1]=g;img.data[i+2]=b;img.data[i+3]=255;
  }}
  wheelCtx.putImageData(img,0,0);
}

function placeCursor(h,s){
  const R=100,rad=h*Math.PI/180;
  cursorEl.style.left=(100+Math.cos(rad)*s*R)+'px';
  cursorEl.style.top=(100+Math.sin(rad)*s*R)+'px';
}

function getActiveHex(){return cpeActive<0?cpeBg:(cpeColors[cpeActive]||'#888888');}
function setActiveHex(hex){if(cpeActive<0)cpeBg=hex;else cpeColors[cpeActive]=hex;renderSlots();prevEl.style.background=hex;hexIn.value=hex.toUpperCase();}

function syncToHex(hex){
  if(!/^#[0-9a-fA-F]{6}$/.test(hex))return;
  const[h,s,l]=hexToHsl(hex);cpeH=h;cpeS=s;cpeL=l;
  lightSl.value=Math.round(l*100);drawWheel();placeCursor(h,s);
  prevEl.style.background=hex;hexIn.value=hex.toUpperCase();
}

function renderSlots(){
  slotsEl.innerHTML='';
  const bgS=document.createElement('div');bgS.className='cpe-slot-bg'+(cpeActive===-1?' active':'');
  bgS.style.background=cpeBg;bgS.title='Background';
  bgS.addEventListener('click',()=>{cpeActive=-1;renderSlots();syncToHex(cpeBg);});
  slotsEl.appendChild(bgS);
  cpeColors.forEach((col,i)=>{
    const s=document.createElement('div');
    s.className='cpe-slot'+(i===cpeActive?' active':'');
    s.style.background=col;s.style.borderColor=i===cpeActive?'#fff':'transparent';
    s.title='Color '+(i+1);
    s.addEventListener('click',()=>{cpeActive=i;renderSlots();syncToHex(col);});
    slotsEl.appendChild(s);
  });
  if(cpeColors.length<MAX_COLORS){
    const add=document.createElement('div');add.className='cpe-slot-add';add.textContent='+';add.title='Add color';
    add.addEventListener('click',()=>{if(cpeColors.length>=MAX_COLORS)return;cpeColors.push('#888888');cpeActive=cpeColors.length-1;renderSlots();syncToHex('#888888');});
    slotsEl.appendChild(add);
  }
}

function wheelPick(e){
  const rect=wheelCv.getBoundingClientRect();
  const src=e.touches?e.touches[0]:e;
  const x=(src.clientX-rect.left)*(200/rect.width),y=(src.clientY-rect.top)*(200/rect.height);
  const dx=x-100,dy=y-100,dist=Math.sqrt(dx*dx+dy*dy);
  const h=(Math.atan2(dy,dx)*180/Math.PI+360)%360,s=Math.min(dist/100,1);
  cpeH=h;cpeS=s;placeCursor(h,s);
  const hex=hslToHex(h,s,cpeL);setActiveHex(hex);hexIn.value=hex.toUpperCase();
}

wheelCv.addEventListener('mousedown',e=>{cpeDragging=true;wheelPick(e);e.preventDefault();});
wheelCv.addEventListener('touchstart',e=>{e.preventDefault();cpeDragging=true;wheelPick(e);},{passive:false});
document.addEventListener('mousemove',e=>{if(cpeDragging)wheelPick(e);});
document.addEventListener('mouseup',()=>{cpeDragging=false;});
document.addEventListener('touchmove',e=>{if(cpeDragging&&e.target===wheelCv){e.preventDefault();wheelPick(e);}},{passive:false});
document.addEventListener('touchend',()=>{cpeDragging=false;});

lightSl.addEventListener('input',()=>{cpeL=parseInt(lightSl.value)/100;drawWheel();const hex=hslToHex(cpeH,cpeS,cpeL);setActiveHex(hex);});
hexIn.addEventListener('change',()=>{let v=hexIn.value.trim();if(!v.startsWith('#'))v='#'+v;if(/^#[0-9a-fA-F]{6}$/i.test(v)){syncToHex(v);setActiveHex(v);}});

addBtn.addEventListener('click',()=>{if(cpeColors.length>=MAX_COLORS)return;cpeColors.push('#888888');cpeActive=cpeColors.length-1;renderSlots();syncToHex('#888888');});
remBtn.addEventListener('click',()=>{if(cpeColors.length<=2)return;cpeColors.splice(Math.max(0,cpeActive),1);cpeActive=Math.min(cpeActive,cpeColors.length-1);renderSlots();syncToHex(getActiveHex());});

applyBtn.addEventListener('click',()=>{
  PALS['custom']={bg:cpeBg,c:[...cpeColors]};
  const sel=document.getElementById('pal');sel.value='custom';
  if(typeof drawSw==='function')drawSw();
  /* Fire the full palette onchange logic to update all experimental tools */
  var palEl=document.getElementById('pal');
  if(palEl&&palEl.onchange)palEl.onchange();
  else if(typeof generate==='function')generate();
  const orig=cpBtn.textContent;cpBtn.textContent='\u2746 Applied \u2713';setTimeout(()=>{cpBtn.textContent=orig;},2000);
});

function getSaved(){try{return JSON.parse(localStorage.getItem(STORE)||'[]');}catch(e){return[];}}
function putSaved(a){try{localStorage.setItem(STORE,JSON.stringify(a));}catch(e){}}

function renderSaved(){
  savedList.innerHTML='';
  const saved=getSaved();
  if(!saved.length){const em=document.createElement('div');em.style.cssText='font-size:9px;color:var(--dim);font-style:italic;padding:4px 0;';em.textContent='No saved palettes yet.';savedList.appendChild(em);return;}
  saved.forEach((entry,i)=>{
    const row=document.createElement('div');row.className='cpe-saved-row';
    const bg=document.createElement('div');bg.className='cpe-saved-bg-dot';bg.style.background=entry.pal.bg;
    const sw=document.createElement('div');sw.className='cpe-saved-swatches';
    entry.pal.c.forEach(col=>{const s2=document.createElement('div');s2.className='cpe-saved-swatch';s2.style.background=col;sw.appendChild(s2);});
    const nm=document.createElement('div');nm.className='cpe-saved-name';nm.textContent=entry.name;
    const del=document.createElement('button');del.className='cpe-saved-del';del.innerHTML='&times;';del.title='Delete';
    function loadIt(){cpeColors=[...entry.pal.c];cpeBg=entry.pal.bg;cpeActive=0;renderSlots();syncToHex(cpeColors[0]);nameIn.value=entry.name;}
    row.addEventListener('click',loadIt);
    del.addEventListener('click',e=>{e.stopPropagation();const all=getSaved();all.splice(i,1);putSaved(all);renderSaved();});
    row.appendChild(bg);row.appendChild(sw);row.appendChild(nm);row.appendChild(del);
    savedList.appendChild(row);
  });
}

saveBtn.addEventListener('click',()=>{
  const name=nameIn.value.trim()||'Palette '+new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  const entry={name,pal:{bg:cpeBg,c:[...cpeColors]},ts:Date.now()};
  const all=getSaved();const idx=all.findIndex(e=>e.name===name);
  if(idx>=0)all[idx]=entry;else all.unshift(entry);
  if(all.length>20)all.splice(20);putSaved(all);
  const key='custom_'+name.toLowerCase().replace(/[^a-z0-9]/g,'_');
  PALS[key]={bg:cpeBg,c:[...cpeColors]};
  const sel=document.getElementById('pal');
  let opt=sel.querySelector('option[value="'+key+'"]');
  if(!opt){opt=document.createElement('option');opt.value=key;const c=sel.querySelector('option[value="custom"]');sel.insertBefore(opt,c);}
  opt.textContent='\u2746 '+name;
  renderSaved();nameIn.value='';
  if(typeof setI==='function')setI('Saved: "'+name+'"');
});

cpBtn.addEventListener('click',()=>{
  const open=cpEditor.classList.toggle('open');
  cpBtn.classList.toggle('active',open);
  if(open){renderSlots();drawWheel();syncToHex(getActiveHex());renderSaved();}
});

/* Palette change now handled by onchange above - remove duplicate */
/* document.getElementById('pal').addEventListener... removed */

getSaved().forEach(entry=>{
  const key='custom_'+entry.name.toLowerCase().replace(/[^a-z0-9]/g,'_');
  PALS[key]=entry.pal;
  const sel=document.getElementById('pal');
  if(!sel.querySelector('option[value="'+key+'"]')){
    const opt=document.createElement('option');opt.value=key;opt.textContent='\u2746 '+entry.name;
    const c=sel.querySelector('option[value="custom"]');sel.insertBefore(opt,c);
  }
});

})();
