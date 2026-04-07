/* ══════════════════════════════════════════════════════════
   IMAGE COMPOSITE TOOLS — extracted from NeoLeo monolith
   Depends on globals: uploadedImg, uctx, uv, cv, ctx, dv, dctx,
     lv, lctx, av, actx, setI, saveU, renderUpload,
     genUndoPush
   ══════════════════════════════════════════════════════════ */
(function(){
  var drawBlendSel = document.getElementById('draw-blend-sel');
  var mergeOpSl    = document.getElementById('draw-merge-op');
  var mergeOpV     = document.getElementById('draw-merge-opv');
  if(mergeOpSl) mergeOpSl.addEventListener('input',function(){
    mergeOpV.textContent=mergeOpSl.value+'%';
  });

  function getMergeOp(){ return mergeOpSl ? parseInt(mergeOpSl.value)/100 : 1; }
  function getBlend(){ return drawBlendSel ? drawBlendSel.value : 'source-over'; }

  /* Merge drawing layer (dv) onto image (uv) */
  var _imgMergeDraw = document.getElementById('img-merge-draw');
  if(_imgMergeDraw) _imgMergeDraw.addEventListener('click',function(){
    if(!uploadedImg){ setI('No image loaded'); return; }
    if(window.genUndoPush)window.genUndoPush();
    uctx.save();
    uctx.globalAlpha = getMergeOp();
    uctx.globalCompositeOperation = getBlend();
    uctx.drawImage(dv, 0, 0);
    uctx.restore();
    /* Clear drawing layer after merge */
    dctx.clearRect(0, 0, dv.width, dv.height);
    if(window._layersCompositeFn) window._layersCompositeFn();
    setI('Drawing merged onto image (' + getBlend() + ')');
  });

  /* Merge engine output (cv) onto image (uv) */
  var _btn_img_merge_engine = document.getElementById('img-merge-engine');
  if(_btn_img_merge_engine) _btn_img_merge_engine.addEventListener('click',function(){
    if(!uploadedImg){ setI('No image loaded'); return; }
    if(window.genUndoPush)window.genUndoPush();
    uctx.save();
    uctx.globalAlpha = getMergeOp();
    uctx.globalCompositeOperation = getBlend();
    uctx.drawImage(cv, 0, 0);
    uctx.restore();
    renderUpload();
    setI('Engine merged onto image (' + getBlend() + ')');
  });

  /* Flatten all layers onto image */
  var _btn_img_flatten_all = document.getElementById('img-flatten-all');
  if(_btn_img_flatten_all) _btn_img_flatten_all.addEventListener('click',function(){
    if(!uploadedImg){ setI('No image loaded'); return; }
    if(window.genUndoPush)window.genUndoPush();
    uctx.save();
    uctx.globalCompositeOperation = 'source-over';
    /* Draw engine */
    uctx.globalAlpha = 1;
    uctx.drawImage(cv, 0, 0);
    /* Draw lighting at screen blend */
    uctx.globalCompositeOperation = 'screen';
    uctx.drawImage(lv, 0, 0);
    uctx.globalCompositeOperation = 'source-over';
    /* Draw drawing layer */
    uctx.drawImage(dv, 0, 0);
    /* Draw atmosphere */
    uctx.drawImage(av, 0, 0);
    uctx.restore();
    /* Clear all other layers */
    ctx.clearRect(0, 0, cv.width, cv.height);
    dctx.clearRect(0, 0, dv.width, dv.height);
    lctx.clearRect(0, 0, lv.width, lv.height);
    actx.clearRect(0, 0, av.width, av.height);
    setI('All layers flattened onto image');
  });

  /* Clear just the drawing layer */
  var _btn_img_clear_draw = document.getElementById('img-clear-draw');
  if(_btn_img_clear_draw) _btn_img_clear_draw.addEventListener('click',function(){
    saveU();
    dctx.clearRect(0, 0, dv.width, dv.height);
    if(window._layersCompositeFn) window._layersCompositeFn();
    setI('Drawing layer cleared');
  });

  /* Show composite tools whenever an image is loaded */
  window._showImgComposite = function(show){
    var sec = document.getElementById('img-composite-sec');
    if(sec) sec.style.display = show ? 'block' : 'none';
  };
  /* Hide by default until image is loaded */
  window._showImgComposite(false);
})();
