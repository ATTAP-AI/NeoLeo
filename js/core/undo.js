/* ── undo.js — wires undo/redo buttons to the unified globalUndo/Redo from draw-tools.js ──
   IMPORTANT: do NOT redefine globalUndo, globalRedo, updateGlobalUndoBtns, or genUndoPush here.
   draw-tools.js owns the canonical implementations including the unified action log.
   Redefining them here would strip the saveU/genUndoPush wrappers and break undo. */
(function(){
  function _gu(){ if(window.globalUndo) window.globalUndo(); else if(window.doUndo) window.doUndo(); }
  function _gr(){ if(window.globalRedo) window.globalRedo(); else if(window.doRedo) window.doRedo(); }
  var ids=[['undo-main',_gu,'Undo (global)'],['redo-main',_gr,'Redo (global)'],['ubtn',_gu,null],['redobtn',_gr,null]];
  ids.forEach(function(t){
    var el=document.getElementById(t[0]);
    if(el){el.onclick=t[1];if(t[2])el.title=t[2];}
  });
  if(typeof updateGenUndoBtns==='function') updateGenUndoBtns();
})();
document.getElementById('clrbtn').onclick=()=>{
  if(window._TOPO&&window._TOPO.deactivateObj)window._TOPO.deactivateObj();
  /* Push BOTH stacks so clear can be undone whether followed by gen or draw */
  if(window.saveU)window.saveU();
  if(window.genUndoPush)window.genUndoPush();
  dctx.clearRect(0,0,dv.width,dv.height);
  ctx.fillStyle=_canvasBg;ctx.fillRect(0,0,cv.width,cv.height);
  snap=null;window._snapLayer=null;window._snapLayerCtx=null;
  window._strokePreSnap=null;window._strokePreCtx=null;_lastStroke=null;
  if(window._layersReset)window._layersReset();
  /* Clear freeform clip and reset to square */
  window._freeformClip=null;
  if(window._canvasRatio==='freeform'){
    window._canvasRatio='square';
    var _sel=document.getElementById('res-sel');if(_sel)_sel.value='square';
    var _tr=document.getElementById('ratio-thumbs');
    if(_tr)_tr.querySelectorAll('.ratio-thumb').forEach(function(t){
      t.classList.toggle('active',t.dataset.ratio==='square');
    });
    sz();
  }
  var _w=document.getElementById('cvwrap');if(_w)_w.style.clipPath='';
  var _fov=document.getElementById('freeform-overlay');
  if(_fov&&_fov.parentNode)_fov.parentNode.removeChild(_fov);
  if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
};
