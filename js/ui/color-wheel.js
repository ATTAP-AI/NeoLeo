/* ── Color wheel renderer ── */
const cwCanvas = document.getElementById('cw-canvas');
const cwCtx    = cwCanvas.getContext('2d');
const cwCursor = document.getElementById('cw-cursor');
const cwLight  = document.getElementById('cw-lightness');
const cwPreview= document.getElementById('cw-preview');
const cwHexIn  = document.getElementById('cw-hex-in');
const cwModal  = document.getElementById('cw-modal');

let cwH=0, cwS=1, cwL=0.5;
let cwCallback = null;  // called with hex when user clicks Select
let cwActiveEl = null;  // the swatch element being edited

function drawWheel(lightness){
  const W=220,r=W/2;
  const img = cwCtx.createImageData(W,W);
  for(let y=0;y<W;y++){
    for(let x=0;x<W;x++){
      const dx=x-r, dy=y-r, d=Math.sqrt(dx*dx+dy*dy);
      if(d>r){const pi=(y*W+x)*4;img.data[pi+3]=0;continue;}
      const hue=(Math.atan2(dy,dx)/(Math.PI*2)+1)%1*360;
      const sat=d/r;
      const [rr,gg,bb]=hslToRgb(hue/360,sat,lightness/100);
      const pi=(y*W+x)*4;
      img.data[pi]=rr;img.data[pi+1]=gg;img.data[pi+2]=bb;img.data[pi+3]=255;
    }
  }
  cwCtx.putImageData(img,0,0);
}

function hslToRgb(h,s,l){
  let r,g,b;
  if(s===0){r=g=b=l;}
  else{
    const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
    r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);
  }
  return[Math.round(r*255),Math.round(g*255),Math.round(b*255)];
}

function rgbToHsl(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){h=s=0;}
  else{
    const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}
    h/=6;
  }
  return[h*360,s,l];
}

function hexToRgb(hex){
  hex=hex.replace('#','');
  if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
  const n=parseInt(hex,16);
  return[(n>>16)&255,(n>>8)&255,n&255];
}

function rgbToHex(r,g,b){
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function hslToHex(h,s,l){const[r,g,b]=hslToRgb(h/360,s,l);return rgbToHex(r,g,b);}

function updateCwPreview(){
  const hex=hslToHex(cwH,cwS,cwL);
  cwPreview.style.background=hex;
  cwHexIn.value=hex;
}

function placeCursor(h,s){
  const r=110; // wheel radius
  const ang=(h/360)*Math.PI*2;
  const x=110+Math.cos(ang)*s*r;
  const y=110+Math.sin(ang)*s*r;
  cwCursor.style.left=x+'px';
  cwCursor.style.top=y+'px';
  cwCursor.style.background=hslToHex(h,s,cwL);
}

function openColorWheel(currentHex, callback, targetEl){
  cwCallback=callback;
  cwActiveEl=targetEl;
  const [r,g,b]=hexToRgb(currentHex||'#ff4040');
  const [h,s,l]=rgbToHsl(r,g,b);
  cwH=h;cwS=s;cwL=l;
  cwLight.value=Math.round(l*100);
  drawWheel(Math.round(l*100));
  updateCwPreview();
  placeCursor(h,s);
  cwModal.classList.add('open');
}

/* Wheel click/drag */
let cwDragging=false;
function handleWheelPointer(e){
  const rect=cwCanvas.getBoundingClientRect();
  const x=(e.clientX-rect.left)-110, y=(e.clientY-rect.top)-110;
  const d=Math.sqrt(x*x+y*y);
  const r=110;
  cwH=((Math.atan2(y,x)/(Math.PI*2))+1)%1*360;
  cwS=Math.min(1,d/r);
  placeCursor(cwH,cwS);
  updateCwPreview();
}
cwCanvas.addEventListener('mousedown',e=>{cwDragging=true;handleWheelPointer(e);});
document.addEventListener('mousemove',e=>{if(cwDragging)handleWheelPointer(e);});
document.addEventListener('mouseup',()=>{cwDragging=false;});

cwLight.addEventListener('input',function(){
  cwL=this.value/100;
  drawWheel(+this.value);
  placeCursor(cwH,cwS);
  updateCwPreview();
});

cwHexIn.addEventListener('input',function(){
  const h=this.value.trim();
  if(/^#[0-9a-fA-F]{6}$/.test(h)){
    const[r,g,b]=hexToRgb(h);
    const[hh,s,l]=rgbToHsl(r,g,b);
    cwH=hh;cwS=s;cwL=l;
    cwLight.value=Math.round(l*100);
    drawWheel(Math.round(l*100));
    placeCursor(hh,s);
    cwPreview.style.background=h;
  }
});

document.getElementById('cw-ok').addEventListener('click',()=>{
  const hex=hslToHex(cwH,cwS,cwL);
  cwModal.classList.remove('open');
  if(cwCallback)cwCallback(hex);
});
document.getElementById('cw-cancel').addEventListener('click',()=>{
  cwModal.classList.remove('open');
});
cwModal.addEventListener('click',e=>{if(e.target===cwModal)cwModal.classList.remove('open');});
