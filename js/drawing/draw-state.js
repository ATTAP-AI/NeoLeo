/* ══════════════════════════════════════════════════════════════
   DRAW-STATE  --  Drawing state variables, undo/redo, snap system
   Extracted from NeoLeo monolith (lines ~1966-2110)
   Plain JS, window.* globals, NO ES modules
   ══════════════════════════════════════════════════════════════ */

let curTool='',drawCol='#ff4040',brushSz=10,brushOp=.9,brushHd=.7,tol=30,fillMd='stroke';
/* Expose brush state globally so brush picker IIFE can access it */
let brushType='round_hard';
Object.defineProperty(window,'brushSz',{get:()=>brushSz,set:v=>{brushSz=v;}});
Object.defineProperty(window,'brushHd',{get:()=>brushHd,set:v=>{brushHd=v;}});
Object.defineProperty(window,'brushOp',{get:()=>brushOp,set:v=>{brushOp=v;}});
Object.defineProperty(window,'drawCol',{get:()=>drawCol,set:v=>{drawCol=v;}});
Object.defineProperty(window,'brushType',{get:()=>brushType,set:v=>{brushType=v;}});
Object.defineProperty(window,'curTool',{get:()=>curTool,set:v=>{curTool=v;}});
Object.defineProperty(window,'tol',{get:()=>tol,set:v=>{tol=v;}});
Object.defineProperty(window,'fillMd',{get:()=>fillMd,set:v=>{fillMd=v;}});
window._h2r=h=>h2r(h);
let isDown=false,pts=[],polyPts=[],polySnap=null,undoSt=[],redoSt=[],snap=null,lastX=0,lastY=0;
Object.defineProperty(window,'isDown',{get:()=>isDown,set:v=>{isDown=v;}});
Object.defineProperty(window,'pts',{get:()=>pts,set:v=>{pts=v;}});
Object.defineProperty(window,'polyPts',{get:()=>polyPts,set:v=>{polyPts=v;}});
Object.defineProperty(window,'polySnap',{get:()=>polySnap,set:v=>{polySnap=v;}});
Object.defineProperty(window,'undoSt',{get:()=>undoSt,set:v=>{undoSt=v;}});
Object.defineProperty(window,'redoSt',{get:()=>redoSt,set:v=>{redoSt=v;}});
Object.defineProperty(window,'snap',{get:()=>snap,set:v=>{snap=v;}});
Object.defineProperty(window,'lastX',{get:()=>lastX,set:v=>{lastX=v;}});
Object.defineProperty(window,'lastY',{get:()=>lastY,set:v=>{lastY=v;}});
/* Canvas-level undo (engine output on cv + dv composite) */
let genUndoSt=[];let genRedoSt=[];
const MAX_GEN_UNDO=20;
function genUndoPush(){
  /* Capture full state: cv, dv, and uv (uploaded image) separately for accurate restore */
  try{
    var snap={t:Date.now()};
    /* Engine canvas */
    var tc1=document.createElement('canvas');tc1.width=cv.width;tc1.height=cv.height;
    tc1.getContext('2d').drawImage(cv,0,0);
    snap.cv=tc1.getContext('2d').getImageData(0,0,cv.width,cv.height);
    /* Drawing layer */
    snap.dv=dctx.getImageData(0,0,dv.width,dv.height);
    /* Image layer (uv) */
    snap.uv=uctx.getImageData(0,0,uv.width,uv.height);
    snap.w=cv.width;snap.h=cv.height;
    snap.freeformClip=window._freeformClip||null;
    snap.canvasRatio=window._canvasRatio||'square';
    genUndoSt.push(snap);
    if(genUndoSt.length>MAX_GEN_UNDO)genUndoSt.shift();
    genRedoSt=[];
    updateGenUndoBtns();
  }catch(e){}
}
function genUndo(){
  if(!genUndoSt.length)return;
  try{
    /* Push current state to redo stack */
    var cur={};
    cur.cv=ctx.getImageData(0,0,cv.width,cv.height);
    cur.dv=dctx.getImageData(0,0,dv.width,dv.height);
    cur.uv=uctx.getImageData(0,0,uv.width,uv.height);
    cur.w=cv.width;cur.h=cv.height;
    cur.freeformClip=window._freeformClip||null;
    cur.canvasRatio=window._canvasRatio||'square';
    genRedoSt.push(cur);
    /* Restore previous */
    var prev=genUndoSt.pop();
    ctx.putImageData(prev.cv,0,0);
    dctx.putImageData(prev.dv,0,0);
    uctx.putImageData(prev.uv,0,0);
    /* Restore freeform clip state */
    window._freeformClip=prev.freeformClip||null;
    window._canvasRatio=prev.canvasRatio||'square';
    var wrap=document.getElementById('cvwrap');
    wrap.style.clipPath=window._freeformClip||'';
    wrap.classList.toggle('circle-clip',window._canvasRatio==='circle');
    renderLighting();renderAtmosphere();
    updateGenUndoBtns();
  }catch(e){}
}
function genRedo(){
  if(!genRedoSt.length)return;
  try{
    var cur={};
    cur.cv=ctx.getImageData(0,0,cv.width,cv.height);
    cur.dv=dctx.getImageData(0,0,dv.width,dv.height);
    cur.uv=uctx.getImageData(0,0,uv.width,uv.height);
    cur.w=cv.width;cur.h=cv.height;
    cur.freeformClip=window._freeformClip||null;
    cur.canvasRatio=window._canvasRatio||'square';
    genUndoSt.push(cur);
    var next=genRedoSt.pop();
    ctx.putImageData(next.cv,0,0);
    dctx.putImageData(next.dv,0,0);
    uctx.putImageData(next.uv,0,0);
    /* Restore freeform clip state */
    window._freeformClip=next.freeformClip||null;
    window._canvasRatio=next.canvasRatio||'square';
    var wrap=document.getElementById('cvwrap');
    wrap.style.clipPath=window._freeformClip||'';
    wrap.classList.toggle('circle-clip',window._canvasRatio==='circle');
    renderLighting();renderAtmosphere();
    updateGenUndoBtns();
  }catch(e){}
}
function updateGenUndoBtns(){
  if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
}
let _lastStroke=null; /* {pts,type,col,sz,hd,op,preSnap,ctx} -- for live slider redraw */
const saveU=()=>{
  try{
    var lctxA=window._getActiveLayerCtx?window._getActiveLayerCtx():null;
    var entry={
      dv:dctx.getImageData(0,0,dv.width,dv.height),
      layer:(lctxA&&lctxA!==dctx)?lctxA.getImageData(0,0,lctxA.canvas.width,lctxA.canvas.height):null,
      lctx:lctxA,
      t:Date.now()
    };
    undoSt.push(entry);
    if(undoSt.length>20)undoSt.shift();
    redoSt=[];
    if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
  }catch(e){}
};
const doUndo=()=>{
  if(!undoSt.length)return;
  try{
    var lctxA=window._getActiveLayerCtx?window._getActiveLayerCtx():null;
    var cur={
      dv:dctx.getImageData(0,0,dv.width,dv.height),
      layer:(lctxA&&lctxA!==dctx)?lctxA.getImageData(0,0,lctxA.canvas.width,lctxA.canvas.height):null,
      lctx:lctxA,
      t:Date.now()
    };
    redoSt.push(cur);
    var prev=undoSt.pop();
    dctx.putImageData(prev.dv,0,0);
    if(prev.layer&&prev.lctx)prev.lctx.putImageData(prev.layer,0,0);
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
  }catch(e){}
};
const doRedo=()=>{
  if(!redoSt.length)return;
  try{
    var lctxA=window._getActiveLayerCtx?window._getActiveLayerCtx():null;
    var cur={
      dv:dctx.getImageData(0,0,dv.width,dv.height),
      layer:(lctxA&&lctxA!==dctx)?lctxA.getImageData(0,0,lctxA.canvas.width,lctxA.canvas.height):null,
      lctx:lctxA,
      t:Date.now()
    };
    undoSt.push(cur);
    var next=redoSt.pop();
    dctx.putImageData(next.dv,0,0);
    if(next.layer&&next.lctx)next.lctx.putImageData(next.layer,0,0);
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
  }catch(e){}
};
const saveSnap=()=>{
  try{
    snap=dctx.getImageData(0,0,dv.width,dv.height);
    var _sc=window._getActiveLayerCtx?window._getActiveLayerCtx():null;
    if(_sc&&_sc!==dctx){
      window._snapLayerCtx=_sc;
      window._snapLayer=_sc.getImageData(0,0,_sc.canvas.width,_sc.canvas.height);
    }else{window._snapLayerCtx=null;window._snapLayer=null;}
  }catch(e){}
};
const restSnap=()=>{
  try{
    if(window._snapLayer&&window._snapLayerCtx){
      window._snapLayerCtx.putImageData(window._snapLayer,0,0);
    }
    if(snap){dctx.clearRect(0,0,dv.width,dv.height);dctx.putImageData(snap,0,0);}
  }catch(e){}
};
window._restSnap=restSnap;
window._saveSnap=saveSnap;
window._saveU=saveU;
window._dctx=dctx;
const getPos=e=>{const r=dv.getBoundingClientRect();if(!r.width||!r.height)return[0,0];const sx=dv.width/r.width,sy=dv.height/r.height;const src=e.touches?e.touches[0]:e.changedTouches?e.changedTouches[0]:e;return[(src.clientX-r.left)*sx,(src.clientY-r.top)*sy];};
const h2a=(col,a)=>{const[r,g,b]=h2r(col);return`rgba(${r},${g},${b},${a})`;};
function setDs(ctx2){const c=ctx2||dctx;c.globalAlpha=1;c.globalCompositeOperation='source-over';c.strokeStyle=h2a(drawCol,brushOp);c.fillStyle=h2a(drawCol,brushOp);c.lineWidth=brushSz;c.lineCap='round';c.lineJoin='round';if(!ctx2){if(curTool==='brush'){c.shadowBlur=Math.max(0,(1-brushHd)*brushSz*2.5);c.shadowColor=h2a(drawCol,brushOp*.7);}else{c.shadowBlur=0;c.shadowColor='transparent';}}}

/* ── Commit polygon shape ── */
function commitPoly(){
  if(!polySnap||polyPts.length<3)return;
  /* Draw onto the active layer canvas (persistent), not dctx (which gets wiped by compositeLayers) */
  var _pctx=window._getActiveLayerCtx?window._getActiveLayerCtx():dctx;
  /* Restore layer canvas to pre-poly state using polySnap content via a temp read */
  /* polySnap captured dctx before any poly points -- use it to restore dctx for setDs state */
  try{dctx.clearRect(0,0,dv.width,dv.height);dctx.putImageData(polySnap,0,0);}catch(ex){}
  setDs();dctx.shadowBlur=0;
  /* Draw the closed poly shape onto the layer canvas */
  _pctx.save();
  clipToCanvas(_pctx);
  _pctx.strokeStyle=drawCol;_pctx.fillStyle=drawCol;
  _pctx.lineWidth=brushSz;_pctx.lineCap='round';_pctx.lineJoin='round';
  _pctx.globalAlpha=brushOp;
  _pctx.beginPath();
  polyPts.forEach((p,i)=>i?_pctx.lineTo(p[0],p[1]):_pctx.moveTo(p[0],p[1]));
  _pctx.closePath();
  if(fillMd!=='stroke')_pctx.fill();
  if(fillMd!=='fill')_pctx.stroke();
  _pctx.restore();
  if(window._OM&&window._OM.isOn()&&polyPts.length>=3){
    var _xs2=polyPts.map(function(p){return p[0];});
    var _ys2=polyPts.map(function(p){return p[1];});
    var _p2=(brushSz||3)+6;
    var _bx2=Math.min.apply(null,_xs2),_by2=Math.min.apply(null,_ys2);
    var _bw2=Math.max.apply(null,_xs2)-_bx2,_bh2=Math.max.apply(null,_ys2)-_by2;
    window._OM.add({type:'polygon',pts:polyPts.slice(),col:drawCol,sz:brushSz,op:brushOp,fill:fillMd,
      bbox:{x:_bx2-_p2,y:_by2-_p2,w:_bw2+_p2*2,h:_bh2+_p2*2}});
  }
  polyPts=[];polySnap=null;
  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
}

/* ── Flood fill ── */
function doFill(sx,sy,global){const W=dv.width,H=dv.height;sx=Math.max(0,Math.min(W-1,sx));sy=Math.max(0,Math.min(H-1,sy));try{const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;const tc=tmp.getContext('2d');tc.drawImage(uv,0,0);tc.drawImage(cv,0,0);tc.drawImage(dv,0,0);const comp=tc.getImageData(0,0,W,H).data;const dimg=dctx.getImageData(0,0,W,H);const dd=dimg.data;const i0=(sy*W+sx)*4;const[tr,tg,tb,ta]=[comp[i0],comp[i0+1],comp[i0+2],comp[i0+3]];const[fr,fg,fb]=h2r(drawCol);const fa=Math.round(brushOp*255);const t4=tol*4;const match=i=>Math.abs(comp[i]-tr)+Math.abs(comp[i+1]-tg)+Math.abs(comp[i+2]-tb)+Math.abs(comp[i+3]-ta)<=t4;if(global){for(let i=0;i<W*H*4;i+=4)if(match(i)){dd[i]=fr;dd[i+1]=fg;dd[i+2]=fb;dd[i+3]=fa;}}else{const vis=new Uint8Array(W*H),stk=[sy*W+sx];vis[sy*W+sx]=1;while(stk.length){const pos=stk.pop(),px2=pos%W,py2=(pos/W)|0,pi=pos*4;dd[pi]=fr;dd[pi+1]=fg;dd[pi+2]=fb;dd[pi+3]=fa;if(px2>0&&!vis[pos-1]&&match((pos-1)*4)){vis[pos-1]=1;stk.push(pos-1);}if(px2<W-1&&!vis[pos+1]&&match((pos+1)*4)){vis[pos+1]=1;stk.push(pos+1);}if(py2>0&&!vis[pos-W]&&match((pos-W)*4)){vis[pos-W]=1;stk.push(pos-W);}if(py2<H-1&&!vis[pos+W]&&match((pos+W)*4)){vis[pos+W]=1;stk.push(pos+W);}}}dctx.putImageData(dimg,0,0);}catch(ex){console.error('fill',ex);}}

/* ══ Expose all drawing state & functions on window ══ */
window.saveU=saveU;
window.doUndo=doUndo;
window.doRedo=doRedo;
window.saveSnap=saveSnap;
window.restSnap=restSnap;
window.setDs=setDs;
window.commitPoly=commitPoly;
window.doFill=doFill;
window.genUndoPush=genUndoPush;
window.genUndo=genUndo;
window.genRedo=genRedo;
window._clearGenUndoStacks=function(){genUndoSt.length=0;genRedoSt.length=0;};
window.getPos=getPos;
window.h2a=h2a;
window._lastStroke=null;
Object.defineProperty(window,'_lastStroke',{get:()=>_lastStroke,set:v=>{_lastStroke=v;}});
