/* ══════════════════════════════════════════════════════════════
   DRAW-TOOLS  --  Main drawing event handlers on document
   Extracted from NeoLeo monolith (lines ~2557-2966)
   mousedown/mousemove/mouseup/click/dblclick for all tools:
   brush, pencil, line, rectangle, ellipse, triangle, polygon,
   free shape, flood fill, color replace
   Plus: setTool, replayLastStroke, slider wiring, keyboard shortcuts,
   global undo/redo
   Plain JS, window.* globals, NO ES modules
   ══════════════════════════════════════════════════════════════ */

const POLY=['triangle','polygon'],CLICK=['fill','creplace'];
const PS_TOOLS=['eraser','eyedropper','clone','heal','dodge','burn','blur','sharpen','smudge','sponge','gradient','texturemap','humanize','curves'];

/* ── Drawing events on document so pointer-events on dv never block us ──
   Uses Pointer Events (unified mouse / touch / pen). Apple Pencil pressure
   and tilt are available on PointerEvent as e.pressure (0..1), e.tiltX/Y.
   e.pointerType is 'mouse' | 'touch' | 'pen'. Legacy e.touches fallbacks
   are kept so helpers still work if called from a synthetic MouseEvent. */

/* Map PointerEvent to a stroke-width multiplier (0.35..1.0) for pens,
   or a flat 1.0 for mouse/touch. This way mouse users keep full brush size
   (mice report pressure=0.5 when button-down, which would otherwise halve
   the brush). Apple Pencil e.pressure is real and scaled to feel good
   without letting light taps produce invisible hairlines. */
function pressureMul(e){
  if(!e||e.pointerType!=='pen')return 1;
  var p=typeof e.pressure==='number'?e.pressure:0.5;
  return 0.35+0.65*Math.max(0,Math.min(1,p));
}

/* ── Palm rejection ──
   When Apple Pencil is actively drawing (or lifted within the last 500ms),
   ignore simultaneous finger/palm touches on the canvas. Exposes a shared
   global so ps-tools and other canvas listeners can enforce the same rule.
   Touch is never rejected on touch-only devices (no pen ever seen). */
window._penActive = false;
window._penEverSeen = false;     // has a pen event ever fired in this session?
window._penLastSeen = 0;
function shouldRejectTouch(e){
  if(!e||e.pointerType!=='touch')return false;
  if(window._penActive)return true;
  /* 500ms grace window after pen lift for resting palm. Gated on
     _penEverSeen so pure-touch devices (iPhone, finger-only iPad,
     touchscreen laptop without pen) NEVER reject touch. Otherwise
     page-load time (<500ms) would spuriously reject the first tap. */
  if(window._penEverSeen && (performance.now()-window._penLastSeen)<500)return true;
  return false;
}
window._shouldRejectTouch = shouldRejectTouch;
document.addEventListener('pointerdown',function(e){
  if(e.pointerType==='pen'){window._penActive=true;window._penEverSeen=true;window._penLastSeen=performance.now();}
},true);
document.addEventListener('pointerup',function(e){
  if(e.pointerType==='pen'){window._penActive=false;window._penEverSeen=true;window._penLastSeen=performance.now();}
},true);
document.addEventListener('pointercancel',function(e){
  if(e.pointerType==='pen'){window._penActive=false;window._penEverSeen=true;window._penLastSeen=performance.now();}
},true);
function getCanvasPos(e){
  const r=dv.getBoundingClientRect();
  if(!r.width||!r.height)return null;
  const src=e.touches?e.touches[0]:e.changedTouches?e.changedTouches[0]:e;
  const x=Math.max(0,Math.min(dv.width-1, (src.clientX-r.left)*(dv.width/r.width)));
  const y=Math.max(0,Math.min(dv.height-1,(src.clientY-r.top)*(dv.height/r.height)));
  return[x,y];
}
function onCanvas(e){
  /* Returns true only if pointer is over dv */
  const r=dv.getBoundingClientRect();
  const src=e.touches?e.touches[0]:e;
  return src.clientX>=r.left&&src.clientX<=r.right&&src.clientY>=r.top&&src.clientY<=r.bottom;
}

document.addEventListener('pointerdown',e=>{
  /* Skip if click is inside a UI overlay (brush picker, modals, panel) */
  if(e.target.closest&&(e.target.closest('#bp-modal')||e.target.closest('#panel')||e.target.closest('.modal')))return;
  if(!curTool||!onCanvas(e))return;
  /* Viewport gesture in progress (2-finger pinch/pan) — suppress drawing */
  if(window._viewportGestureActive)return;
  /* Palm rejection: ignore finger touches while Apple Pencil is in use */
  if(shouldRejectTouch(e))return;
  if(window._OM&&window._OM.isOn()){
    if(window._OM_cooldown)return;
    /* If clicking on an existing object, let OM handle it -- don't start a new mark */
    var _omPos=getCanvasPos(e);
    if(_omPos&&window._OM.hitTest(_omPos[0],_omPos[1]))return;
  }
  if(CLICK.includes(curTool)||POLY.includes(curTool))return;
  if(PS_TOOLS.includes(curTool))return; /* Handled by PS tools handler */
  e.preventDefault();
  const pos=getCanvasPos(e);if(!pos)return;
  const[x,y]=pos;
  saveU();setDs();
  isDown=true;lastX=x;lastY=y;pts=[[x,y,pressureMul(e)]];
  _lastStroke=null; /* new stroke begins, clear live-edit target */
  saveSnap(); /* always save snap so we can redraw full path each frame */
  /* Capture layer pre-stroke state NOW (before any drawing touches the layer) */
  if(curTool==='brush'||curTool==='pencil'){
    try{
      var _layerCtxNow=window._getActiveLayerCtx?window._getActiveLayerCtx():dctx;
      window._strokePreSnap=_layerCtxNow.getImageData(0,0,_layerCtxNow.canvas.width,_layerCtxNow.canvas.height);
      window._strokePreCtx=_layerCtxNow;
    }catch(e){window._strokePreSnap=null;window._strokePreCtx=null;}
  }
  setI(curTool+' active');
},{passive:false});

document.addEventListener('pointermove',e=>{
  if(!curTool)return;
  /* Viewport gesture in progress (2-finger pinch/pan) — suppress drawing */
  if(window._viewportGestureActive){isDown=false;return;}
  /* Palm rejection: don't let finger moves interfere while pen is active */
  if(shouldRejectTouch(e))return;
  if(window._OM&&window._OM.isOn()&&window._OM_cooldown){isDown=false;return;}
  const pos=getCanvasPos(e);if(!pos)return;
  const[x,y]=pos;
  /* Polygon/triangle preview */
  if(POLY.includes(curTool)&&polyPts.length>0&&polySnap){
    try{dctx.clearRect(0,0,dv.width,dv.height);dctx.putImageData(polySnap,0,0);}catch(ex){}
    setDs();dctx.shadowBlur=0;
    dctx.beginPath();
    polyPts.forEach((p,i)=>i?dctx.lineTo(p[0],p[1]):dctx.moveTo(p[0],p[1]));
    dctx.lineTo(x,y);dctx.stroke();
    polyPts.forEach(p=>{dctx.beginPath();dctx.arc(p[0],p[1],3,0,Math.PI*2);dctx.fill();});
    if(curTool==='polygon'&&polyPts.length>=2&&Math.hypot(x-polyPts[0][0],y-polyPts[0][1])<16){
      dctx.beginPath();dctx.arc(polyPts[0][0],polyPts[0][1],8,0,Math.PI*2);dctx.stroke();
    }
    return;
  }
  if(!isDown)return;
  if(PS_TOOLS.includes(curTool))return; /* Handled by PS tools handler */
  if(curTool==='brush'||curTool==='pencil'){
    /* Coalesced events: iPadOS delivers Apple Pencil at 120Hz as multiple
       sub-frame points per pointermove. Capturing them all gives far
       smoother curves without costing extra frames. Falls back to the
       single event on browsers that lack the API. */
    var evs=(typeof e.getCoalescedEvents==='function')?e.getCoalescedEvents():null;
    if(!evs||!evs.length)evs=[e];
    for(var ei=0;ei<evs.length;ei++){
      var ce=evs[ei];
      var cpos=getCanvasPos(ce);if(!cpos)continue;
      pts.push([cpos[0],cpos[1],pressureMul(ce)]);
      lastX=cpos[0];lastY=cpos[1];
    }
    restSnap();
    var _actx=window._getActiveLayerCtx?window._getActiveLayerCtx():dctx;
    applyBrushStroke(_actx,pts,window.brushType||'round_hard',window.drawCol||'#ff4040',window.brushSz||10,window.brushHd||0.7,window.brushOp||0.9);
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  } else if(curTool==='shape'){
    pts.push([x,y]);
    restSnap();setDs();
    dctx.beginPath();
    pts.forEach((p,i)=>i?dctx.lineTo(p[0],p[1]):dctx.moveTo(p[0],p[1]));
    dctx.stroke();
    if(pts.length>4&&Math.hypot(x-pts[0][0],y-pts[0][1])<20){
      dctx.shadowBlur=0;dctx.beginPath();dctx.arc(pts[0][0],pts[0][1],8,0,Math.PI*2);dctx.stroke();
    }
  } else {
    restSnap();setDs();
    const[ox,oy]=pts[0];
    /* Rubber-band preview always on dctx -- never the layer canvas.
       Layer canvas only gets the final commit at mouseup. */
    dctx.save();dctx.strokeStyle=drawCol;dctx.fillStyle=drawCol;dctx.lineWidth=brushSz;dctx.lineCap='round';dctx.globalAlpha=brushOp;
    dctx.beginPath();
    if(curTool==='line'){dctx.moveTo(ox,oy);dctx.lineTo(x,y);dctx.stroke();}
    else if(curTool==='rect'){
      dctx.rect(ox,oy,x-ox,y-oy);
      if(fillMd!=='stroke')dctx.fill();if(fillMd!=='fill')dctx.stroke();
    } else if(curTool==='ellipse'){
      const dx=x-ox, dy=y-oy;
      const side=e.shiftKey?Math.min(Math.abs(dx),Math.abs(dy)):null;
      const ex2=side?ox+Math.sign(dx)*side:x, ey2=side?oy+Math.sign(dy)*side:y;
      const rx=Math.abs(ex2-ox)/2,ry=Math.abs(ey2-oy)/2;
      if(rx>0&&ry>0){dctx.ellipse((ox+ex2)/2,(oy+ey2)/2,rx,ry,0,0,Math.PI*2);
        if(fillMd!=='stroke')dctx.fill();if(fillMd!=='fill')dctx.stroke();}
      lastX=ex2;lastY=ey2;
    }
    dctx.restore();
    if(curTool!=='ellipse'){lastX=x;lastY=y;}
  }
});

document.addEventListener('pointerup',()=>{
  if(!isDown)return;
  if(PS_TOOLS.includes(curTool))return; /* Handled by PS tools handler */
  isDown=false;
  if(curTool==='brush'||curTool==='pencil'){
    if(pts.length>0){
      restSnap(); /* restores both dctx and layer canvas to pre-stroke state */
      var _actx2=window._getActiveLayerCtx?window._getActiveLayerCtx():dctx;
      applyBrushStroke(_actx2,pts,window.brushType||'round_hard',window.drawCol||'#ff4040',window.brushSz||10,window.brushHd||0.7,window.brushOp||0.9);
      if(window._OM&&window._OM.isOn()){(function(){var _bsz=(window.brushSz||10)+4,_xs=pts.map(function(p){return p[0];}),_ys=pts.map(function(p){return p[1];});window._OM.add({type:'stroke',pts:pts.slice(),brushType:window.brushType||'round_hard',col:window.drawCol||'#ff4040',sz:window.brushSz||10,hd:window.brushHd||0.7,op:window.brushOp||0.9,fill:'stroke',bbox:{x:Math.min.apply(null,_xs)-_bsz,y:Math.min.apply(null,_ys)-_bsz,w:Math.max.apply(null,_xs)-Math.min.apply(null,_xs)+_bsz*2,h:Math.max.apply(null,_ys)-Math.min.apply(null,_ys)+_bsz*2}});})();}
      /* Store last stroke for live parameter editing */
      _lastStroke={pts:pts.slice(),type:window.brushType||'round_hard',
        col:window.drawCol||'#ff4040',sz:window.brushSz||10,
        hd:window.brushHd||0.7,op:window.brushOp||0.9,
        preSnap:window._snapLayer||null,ctx:_actx2};
      if(window._layersCompositeFn)window._layersCompositeFn();
      if(window._layersUpdateThumbs)window._layersUpdateThumbs();
    }
    dctx.shadowBlur=0;dctx.globalAlpha=1;dctx.globalCompositeOperation='source-over';
  } else if(curTool==='shape'&&pts.length>2){
    restSnap();
    var _sctx=window._getActiveLayerCtx?window._getActiveLayerCtx():dctx;
    _sctx.save();clipToCanvas(_sctx);setDs();_sctx.shadowBlur=0;
    _sctx.strokeStyle=drawCol;_sctx.fillStyle=drawCol;_sctx.lineWidth=brushSz;_sctx.lineCap='round';_sctx.lineJoin='round';_sctx.globalAlpha=brushOp;
    _sctx.beginPath();
    pts.forEach((p,i)=>i?_sctx.lineTo(p[0],p[1]):_sctx.moveTo(p[0],p[1]));
    _sctx.closePath();
    if(fillMd!=='stroke')_sctx.fill();if(fillMd!=='fill')_sctx.stroke();
    _sctx.restore();
    if(window._OM&&window._OM.isOn()&&pts.length>=3){
      var _sxs=pts.map(function(p){return p[0];}),_sys=pts.map(function(p){return p[1];});
      var _sp=(brushSz||3)+6;
      var _sbx=Math.min.apply(null,_sxs),_sby=Math.min.apply(null,_sys);
      window._OM.add({type:'shape',pts:pts.slice(),col:drawCol,sz:brushSz,op:brushOp,fill:fillMd,
        bbox:{x:_sbx-_sp,y:_sby-_sp,w:Math.max.apply(null,_sxs)-_sbx+_sp*2,h:Math.max.apply(null,_sys)-_sby+_sp*2}});
    }
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  } else if(pts.length>0){
    /* line/rect/ellipse -- preview was on dctx; now commit final shape to layer canvas */
    const[ox2,oy2]=pts[0];
    var _lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():dctx;
    var _ex=lastX,_ey=lastY;
    /* Always commit to _lctx (works whether it's a layer canvas or dctx) */
    _lctx.save();clipToCanvas(_lctx);_lctx.strokeStyle=drawCol;_lctx.fillStyle=drawCol;_lctx.lineWidth=brushSz;_lctx.lineCap='round';_lctx.globalAlpha=brushOp;
    _lctx.beginPath();
    if(curTool==='line'){_lctx.moveTo(ox2,oy2);_lctx.lineTo(_ex,_ey);_lctx.stroke();}
    else if(curTool==='rect'){
      _lctx.rect(ox2,oy2,_ex-ox2,_ey-oy2);
      if(fillMd!=='stroke')_lctx.fill();if(fillMd!=='fill')_lctx.stroke();
    } else if(curTool==='ellipse'){
      const rx2=Math.abs(_ex-ox2)/2,ry2=Math.abs(_ey-oy2)/2;
      if(rx2>0&&ry2>0){_lctx.ellipse((ox2+_ex)/2,(oy2+_ey)/2,rx2,ry2,0,0,Math.PI*2);
        if(fillMd!=='stroke')_lctx.fill();if(fillMd!=='fill')_lctx.stroke();}
    }
    _lctx.restore();
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
    if(window._OM&&window._OM.isOn()){(function(){var _p=(brushSz||3)+6,_bx=Math.min(ox2,_ex),_by=Math.min(oy2,_ey);window._OM.add({type:curTool,pts:null,x0:ox2,y0:oy2,x1:_ex,y1:_ey,col:drawCol,sz:brushSz,op:brushOp,fill:fillMd,bbox:{x:_bx-_p,y:_by-_p,w:Math.abs(_ex-ox2)+_p*2,h:Math.abs(_ey-oy2)+_p*2}});})();}
  }
  snap=null;pts=[];
});

document.addEventListener('mouseleave',e=>{
  if(!isDown||e.target!==document.documentElement)return;
  isDown=false;
  if((curTool==='brush'||curTool==='pencil')&&pts.length>0){
    restSnap();setDs();
    dctx.beginPath();dctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)dctx.lineTo(pts[i][0],pts[i][1]);
    dctx.stroke();dctx.shadowBlur=0;
  }
  snap=null;pts=[];
});

/* pointercancel fires when the OS steals the pointer (palm rejection, gesture
   takeover, incoming call on iPad). Commit whatever we have so the stroke
   doesn't dangle -- delegate to the pointerup path via a synthetic dispatch. */
document.addEventListener('pointercancel',()=>{
  if(!isDown)return;
  document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
});

document.addEventListener('click',e=>{
  if(!curTool||!onCanvas(e))return;
  const pos=getCanvasPos(e);if(!pos)return;
  const[x,y]=pos;
  if(curTool==='fill'){saveU();doFill(Math.round(x),Math.round(y),false);if(window._layersCompositeFn)window._layersCompositeFn();if(window._layersUpdateThumbs)window._layersUpdateThumbs();}
  else if(curTool==='creplace'){saveU();doFill(Math.round(x),Math.round(y),true);if(window._layersCompositeFn)window._layersCompositeFn();if(window._layersUpdateThumbs)window._layersUpdateThumbs();}
  else if(POLY.includes(curTool)){
    if(polyPts.length===0){
      if(window._OM&&window._OM.isOn()){
        if(window._OM_cooldown)return;
        var _omPosPoly=typeof getCanvasPos==='function'?getCanvasPos(e):null;
        if(_omPosPoly&&window._OM.hitTest(_omPosPoly[0],_omPosPoly[1]))return;
      }
      saveU();polySnap=null;
      try{polySnap=dctx.getImageData(0,0,dv.width,dv.height);}catch(ex){}
      polyPts=[[x,y]];
    } else {
      const[sx,sy]=polyPts[0],dist=Math.hypot(x-sx,y-sy);
      if(curTool==='triangle'&&polyPts.length>=2){polyPts.push([x,y]);commitPoly();}
      else if(curTool==='polygon'&&polyPts.length>=2&&dist<16){commitPoly();}
      else polyPts.push([x,y]);
    }
  }
});
document.addEventListener('dblclick',e=>{
  if(!curTool||!onCanvas(e))return;
  if(curTool==='polygon'&&polyPts.length>=3){
    /* Set cooldown BEFORE commitPoly so trailing events are blocked immediately */
    if(window._OM&&window._OM.isOn()){window._OM_cooldown=true;setTimeout(function(){window._OM_cooldown=false;},800);}
    commitPoly();
  }
});

function setTool(t){if(t!=='lighting')closePanel('light-panel');if(t!=='atmo')closePanel('atmo-panel');if(t!=='layers'){var lp=document.getElementById('layers-panel');if(lp)lp.classList.remove('open');}if(t!=='upload')closePanel('upload-panel');if(t!=='ai')closePanel('prompt-panel');if(polyPts.length&&polySnap){try{dctx.putImageData(polySnap,0,0);}catch(e){}polyPts=[];polySnap=null;}_lastStroke=null;snap=null;window._snapLayer=null;window._snapLayerCtx=null;if(t!=='texturemap'&&window._texCommit)window._texCommit();document.querySelectorAll('.tbtn').forEach(b=>b.classList.toggle('on',b.dataset.t===t));curTool=t;const isDraw=t&&t!=='lighting'&&t!=='atmo'&&t!=='upload'&&t!=='ai';dv.style.pointerEvents=isDraw?'auto':'none';dv.style.cursor=isDraw?'crosshair':'default';}
window.setTool=setTool;
window.getCanvasPos=getCanvasPos;
window.onCanvas=onCanvas;
window.replayLastStroke=replayLastStroke;
document.querySelectorAll('.tbtn').forEach(b=>{if(b.id==='ltool'||b.id==='atool'||b.id==='aitool'||b.id==='utool'||b.id==='laytool')return;b.onclick=()=>setTool(b.dataset.t);});


/* ── Live slider redraw: re-applies last stroke with updated params ── */
function replayLastStroke(){
  if(!_lastStroke||!_lastStroke.preSnap||!_lastStroke.pts.length)return;
  var ls=_lastStroke;
  /* Restore the layer canvas to its pre-stroke state */
  try{ls.ctx.putImageData(ls.preSnap,0,0);}catch(e){return;}
  var rt=window.brushType!=null?window.brushType:ls.type;
  var rc=window.drawCol||ls.col;
  var rsz=window.brushSz!=null?window.brushSz:ls.sz;
  var rhd=window.brushHd!=null?window.brushHd:ls.hd;
  var rop=window.brushOp!=null?window.brushOp:ls.op;
  applyBrushStroke(ls.ctx,ls.pts,rt,rc,rsz,rhd,rop);
  ls.type=rt;ls.col=rc;ls.sz=rsz;ls.hd=rhd;ls.op=rop;
  /* ls.preSnap is intentionally NOT updated so repeated drags keep working */
  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
}
const dcol=document.getElementById('dcol');dcol.oninput=()=>{drawCol=dcol.value;document.getElementById('csw').style.background=drawCol;document.getElementById('dcoltxt').textContent=drawCol;if(_lastStroke){window.drawCol=drawCol;replayLastStroke();}};
document.getElementById('csw').style.background=drawCol;document.getElementById('dcoltxt').textContent=drawCol;
document.getElementById('szr').oninput=function(){document.getElementById('szv').textContent=this.value;brushSz=+this.value;var bp=document.getElementById('bp-sz');if(bp){bp.value=this.value;}var bpv=document.getElementById('bp-sz-val');if(bpv)bpv.textContent=this.value+' px';if(_lastStroke){window.brushSz=brushSz;replayLastStroke();}};
document.getElementById('opr').oninput=function(){document.getElementById('opv').textContent=this.value+'%';brushOp=+this.value/100;var bp=document.getElementById('bp-op');if(bp){bp.value=this.value;}var bpv=document.getElementById('bp-op-val');if(bpv)bpv.textContent=this.value+'%';if(_lastStroke){window.brushOp=brushOp;replayLastStroke();}};
document.getElementById('hdr').oninput=function(){document.getElementById('hdv').textContent=this.value+'%';brushHd=+this.value/100;var bp=document.getElementById('bp-hd');if(bp){bp.value=this.value;}var bpv=document.getElementById('bp-hd-val');if(bpv)bpv.textContent=this.value+'%';if(_lastStroke){window.brushHd=brushHd;replayLastStroke();}};
document.getElementById('tlr').oninput=function(){document.getElementById('tlv').textContent=this.value;tol=+this.value;};
document.getElementById('fmod').onchange=e=>fillMd=e.target.value;
document.getElementById('ubtn').onclick=function(){ if(window.globalUndo) window.globalUndo(); else doUndo(); };
/* ── Unified globalUndo / globalRedo ──
   draw-state.js owns _actionLog and calls _logAction inside saveU/genUndoPush so
   the log is always in sync with the underlying stacks. globalUndo pops the most
   recent action marker and routes to the right do/Undo or genUndo. */

function globalUndo(){
  /* Deactivate Topology Object Mode so undo restores underlying canvas */
  if(window._TOPO&&window._TOPO.deactivateObj)window._TOPO.deactivateObj();
  if(!undoSt.length && !genUndoSt.length){ updateGlobalUndoBtns(); return; }
  /* Pop the most recent action from the unified log */
  var action = window._actionLog.length ? window._actionLog.pop() : null;
  /* If log is empty (e.g. external code pushed without going through wrappers), fall back to whichever stack has anything */
  if(!action){
    if(genUndoSt.length){ genUndo(); window._redoLog.push({k:'gen',t:Date.now()}); }
    else if(undoSt.length){ doUndo(); window._redoLog.push({k:'draw',t:Date.now()}); }
  } else if(action.k==='draw'){
    if(undoSt.length){ doUndo(); window._redoLog.push(action); }
    else if(genUndoSt.length){ genUndo(); window._redoLog.push({k:'gen',t:action.t}); }
  } else { /* gen */
    if(genUndoSt.length){ genUndo(); window._redoLog.push(action); }
    else if(undoSt.length){ doUndo(); window._redoLog.push({k:'draw',t:action.t}); }
  }
  /* Always recomposite layers so dv reflects restored state */
  if(window._layersCompositeFn) window._layersCompositeFn();
  if(window._layersUpdateThumbs) window._layersUpdateThumbs();
  updateGlobalUndoBtns();
}
window.globalUndo = globalUndo;
function globalRedo(){
  if(window._TOPO&&window._TOPO.deactivateObj)window._TOPO.deactivateObj();
  if(!redoSt.length && !genRedoSt.length){ updateGlobalUndoBtns(); return; }
  var action = window._redoLog.length ? window._redoLog.pop() : null;
  if(!action){
    if(genRedoSt.length){ genRedo(); window._actionLog.push({k:'gen',t:Date.now()}); }
    else if(redoSt.length){ doRedo(); window._actionLog.push({k:'draw',t:Date.now()}); }
  } else if(action.k==='draw'){
    if(redoSt.length){ doRedo(); window._actionLog.push(action); }
    else if(genRedoSt.length){ genRedo(); window._actionLog.push({k:'gen',t:action.t}); }
  } else {
    if(genRedoSt.length){ genRedo(); window._actionLog.push(action); }
    else if(redoSt.length){ doRedo(); window._actionLog.push({k:'draw',t:action.t}); }
  }
  if(window._layersCompositeFn) window._layersCompositeFn();
  if(window._layersUpdateThumbs) window._layersUpdateThumbs();
  updateGlobalUndoBtns();
}
window.globalRedo = globalRedo;
function updateGlobalUndoBtns(){
  var hasUndo=undoSt.length>0||genUndoSt.length>0||(window._actionLog&&window._actionLog.length>0);
  var hasRedo=redoSt.length>0||genRedoSt.length>0||(window._redoLog&&window._redoLog.length>0);
  ['undo-main','undo-persist'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){el.disabled=!hasUndo; el.style.opacity=hasUndo?'1':'0.4';}
  });
  ['redo-main','redo-persist'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){el.disabled=!hasRedo; el.style.opacity=hasRedo?'1':'0.4';}
  });
}
window.updateGlobalUndoBtns = updateGlobalUndoBtns;
const _um=document.getElementById('undo-main');
if(_um){_um.onclick=globalUndo;_um.title='Undo (global)';}
const _rm=document.getElementById('redo-main');
if(_rm){_rm.onclick=globalRedo;_rm.title='Redo (global)';}
updateGenUndoBtns();document.getElementById('redobtn').onclick=function(){ if(window.globalRedo) window.globalRedo(); else doRedo(); };
document.getElementById('clrbtn').onclick=()=>{if(window._TOPO&&window._TOPO.deactivateObj)window._TOPO.deactivateObj();saveU();genUndoPush();dctx.clearRect(0,0,dv.width,dv.height);ctx.fillStyle=_canvasBg;ctx.fillRect(0,0,cv.width,cv.height);snap=null;window._snapLayer=null;window._snapLayerCtx=null;window._strokePreSnap=null;window._strokePreCtx=null;_lastStroke=null;if(window._layersReset)window._layersReset();/* Clear freeform clip and reset to square */window._freeformClip=null;if(window._canvasRatio==='freeform'){window._canvasRatio='square';var _sel=document.getElementById('res-sel');if(_sel)_sel.value='square';var _tr=document.getElementById('ratio-thumbs');if(_tr)_tr.querySelectorAll('.ratio-thumb').forEach(function(t){t.classList.toggle('active',t.dataset.ratio==='square');});sz();}var _w=document.getElementById('cvwrap');if(_w)_w.style.clipPath='';/* Cancel active freeform overlay */var _fov=document.getElementById('freeform-overlay');if(_fov&&_fov.parentNode)_fov.parentNode.removeChild(_fov);if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();};

/* Keyboard shortcuts (tool switching, Cmd/Ctrl+Z undo, Cmd/Ctrl+Y/Shift+Z redo,
   arrow-key tool navigation) live in js/core/events.js — do NOT duplicate them
   here or each keypress fires twice. */
