/*  js/core/canvas.js  — Canvas setup, sizing, and layout
 *  Loaded via <script> tag AFTER state.js.
 *  Reads canvas refs and state from window.* globals.
 */

/* ── Compute pixel dimensions for the current aspect-ratio setting ── */
function getRatioDims(stW,stH){
  const MAX=1400;
  const avW=Math.min(stW-28,MAX),avH=Math.min(stH-28,MAX);
  const golden=1.6180339887;
  const amap={
    'square':  [1000,1000],
    '9:16':    [9,16],
    '16:9':    [16,9],
    'circle':  [1,1],
    'golden':  [golden,1],
    'custom':  [window._customW,window._customH]
  };
  const [rw,rh]=amap[window._canvasRatio]||[1,1];
  if(window._canvasRatio==='square')return[750,750];
  if(window._canvasRatio==='custom'){const cW=Math.max(100,Math.min(1400,window._customW));const cH=Math.max(100,Math.min(1400,window._customH));return[cW,cH];}
  const ratio=rw/rh;
  let W,H;
  if(ratio>=1){W=Math.min(avW,avH*ratio);H=W/ratio;}
  else{H=Math.min(avH,avW/ratio);W=H*ratio;}
  return[Math.round(W),Math.round(H)];
}

/* ── Main canvas size / layout function ── */
function sz(){
  const st=document.getElementById('stage');
  const[W,H]=getRatioDims(st.clientWidth,st.clientHeight);
  const oldW=cv.width,oldH=cv.height;
  const sameSize=(oldW===W&&oldH===H);

  /* Snapshot all canvas content before resize */
  function snap(srcCanvas){
    if(!srcCanvas||srcCanvas.width===0)return null;
    try{
      const t=document.createElement('canvas');
      t.width=srcCanvas.width;t.height=srcCanvas.height;
      t.getContext('2d').drawImage(srcCanvas,0,0);
      return t;
    }catch(e){return null;}
  }
  const snapCV=snap(cv);
  const snapAV=snap(av);
  const layerSnaps=typeof layers!=='undefined'?layers.map(l=>snap(l.canvas)):[];

  /* Resize master canvases */
  uv.width=cv.width=lv.width=dv.width=av.width=W;
  uv.height=cv.height=lv.height=dv.height=av.height=H;

  /* Resize & restore each layer canvas */
  if(typeof layers!=='undefined'){
    layers.forEach(function(l,i){
      l.canvas.width=W;l.canvas.height=H;
      if(layerSnaps[i])l.canvas.getContext('2d').drawImage(layerSnaps[i],0,0,W,H);
    });
  }

  /* Restore engine canvas (cv) scaled */
  if(snapCV)ctx.drawImage(snapCV,0,0,W,H);

  /* Restore atmosphere canvas (av) scaled */
  if(snapAV)actx.drawImage(snapAV,0,0,W,H);

  /* Rebuild composite display */
  if(typeof compositeLayers==='function')compositeLayers();

  /* Restore upload */
  if(window.uploadedImg)renderUpload();

  /* Display size: scale to fit stage */
  const stW=st.clientWidth-4,stH=st.clientHeight-4;
  const ratio=W/H;
  let dispW,dispH;
  if(stW/stH>=ratio){dispH=Math.min(H,stH);dispW=Math.round(dispH*ratio);}
  else{dispW=Math.min(W,stW);dispH=Math.round(dispW/ratio);}
  [uv,cv,lv,dv,av].forEach(c=>{c.style.width=dispW+'px';c.style.height=dispH+'px';});
  const wrap2=document.getElementById('cvwrap');
  if(wrap2){wrap2.style.width=dispW+'px';wrap2.style.height=dispH+'px';}

  /* Circle clip */
  const wrap=document.getElementById('cvwrap');
  wrap.classList.toggle('circle-clip',window._canvasRatio==='circle');

  /* Update info display */
  const disp=document.getElementById('res-disp');
  if(disp)disp.textContent=W+' \u00d7 '+H+' px';

  /* Reposition status bar */
  requestAnimationFrame(function(){if(typeof _repositionBar==='function')_repositionBar();});
  return[W,H];
}

/* ── Reposition status bar below canvas ── */
function _repositionBar(){
  var bar=document.getElementById('bar');
  var wrap=document.getElementById('cvwrap');
  var stage=document.getElementById('stage');
  if(!bar||!wrap||!stage)return;
  var wr=wrap.getBoundingClientRect(),sr=stage.getBoundingClientRect();
  bar.style.position='absolute';
  bar.style.top=(wr.bottom-sr.top+8)+'px';
  bar.style.bottom='auto';
  bar.style.left=(wr.left-sr.left+wr.width/2)+'px';
  bar.style.transform='translateX(-50%)';
}

/* ── Convenience: set arbitrary canvas size ── */
window._setCanvasSize=function(w,h){window._customW=w;window._customH=h;window._canvasRatio='custom';if(typeof RATIOS!=='undefined')RATIOS.custom=[w,h];sz();};

/* ── Expose on window ── */
window.getRatioDims=getRatioDims;
window._sz=sz;
window._repositionBar=_repositionBar;

/* ── Initial calls & event wiring ── */
_repositionBar();
setTimeout(_repositionBar,300);
window.addEventListener('resize',function(){setTimeout(_repositionBar,50);});
