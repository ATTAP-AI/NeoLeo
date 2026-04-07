/* ── Global undo/redo: covers both drawing (undoSt) and canvas-level (genUndoSt) ── */
function globalUndo(){
  /* Deactivate Topology Object Mode so undo restores underlying canvas */
  if(window._TOPO&&window._TOPO.deactivateObj)window._TOPO.deactivateObj();
  /* If no undo available at all, bail */
  if(!undoSt.length && !genUndoSt.length){ updateGlobalUndoBtns(); return; }
  var tDraw = undoSt.length>0 ? (undoSt[undoSt.length-1].t || 1) : 0;
  var tGen  = genUndoSt.length>0 ? (genUndoSt[genUndoSt.length-1].t || 1) : 0;
  if(tDraw >= tGen && undoSt.length>0){
    doUndo();
    if(window._layersCompositeFn) window._layersCompositeFn();
  } else if(genUndoSt.length>0){
    genUndo();
  } else if(undoSt.length>0){
    doUndo();
    if(window._layersCompositeFn) window._layersCompositeFn();
  }
  updateGlobalUndoBtns();
}
window.globalUndo = globalUndo;
window.genUndoPush = genUndoPush;
function globalRedo(){
  /* Deactivate Topology Object Mode so redo restores correct state */
  if(window._TOPO&&window._TOPO.deactivateObj)window._TOPO.deactivateObj();
  /* If no redo available at all, bail */
  if(!redoSt.length && !genRedoSt.length){ updateGlobalUndoBtns(); return; }
  var tDraw = redoSt.length>0 ? (redoSt[redoSt.length-1].t || 1) : 0;
  var tGen  = genRedoSt.length>0 ? (genRedoSt[genRedoSt.length-1].t || 1) : 0;
  if(tDraw >= tGen && redoSt.length>0){
    doRedo();
    if(window._layersCompositeFn) window._layersCompositeFn();
  } else if(genRedoSt.length>0){
    genRedo();
  } else if(redoSt.length>0){
    doRedo();
    if(window._layersCompositeFn) window._layersCompositeFn();
  }
  updateGlobalUndoBtns();
}
window.globalRedo = globalRedo;
function updateGlobalUndoBtns(){
  var hasUndo=undoSt.length>0||genUndoSt.length>0;
  var hasRedo=redoSt.length>0||genRedoSt.length>0;
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
updateGenUndoBtns();document.getElementById('redobtn').onclick=doRedo;
document.getElementById('clrbtn').onclick=()=>{if(window._TOPO&&window._TOPO.deactivateObj)window._TOPO.deactivateObj();saveU();genUndoPush();dctx.clearRect(0,0,dv.width,dv.height);ctx.fillStyle=_canvasBg;ctx.fillRect(0,0,cv.width,cv.height);snap=null;window._snapLayer=null;window._snapLayerCtx=null;window._strokePreSnap=null;window._strokePreCtx=null;_lastStroke=null;if(window._layersReset)window._layersReset();if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();};
