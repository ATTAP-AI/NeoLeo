/* ══════════════════════════════════════════════════════════
   ENGINE INIT — Wiring + resetToBlank + palette change + init call
   Extracted from NeoLeo monolith (lines ~2968, 4434, 4596-4707)
   Depends on window globals: cv, ctx, lv, lctx, dv, dctx, av, actx,
     uv, uctx, uploadedImg, sz, setI, setPr, setTool, buildP, randP,
     drawSw, generate, gpal, ENAMES, PALS, rp, seed,
     undoSt, redoSt, genUndoPush, updateGlobalUndoBtns,
     polyPts, polySnap, snap, pts, isDown, _lastStroke, _canvasBg
   ══════════════════════════════════════════════════════════ */

/* ── Shared blank-canvas reset ── */
function resetToBlank(){
  sz();
  var W=cv.width,H=cv.height;
  ctx.fillStyle=_canvasBg;ctx.fillRect(0,0,W,H);
  lctx.clearRect(0,0,W,H);
  dctx.clearRect(0,0,W,H);
  actx.clearRect(0,0,W,H);
  uctx.clearRect(0,0,W,H);
  lv.style.filter='';
  document.getElementById('cvwrap').style.filter='none';
  uploadedImg=null;window.uploadedImg=null;
  cv.style.opacity='1';lv.style.opacity='1';uv.style.zIndex='0';cv.style.zIndex='1';dv.style.zIndex='3';av.style.zIndex='4';
  document.getElementById('u-preview').style.display='none';
  var _isS=document.getElementById('is-sec');if(_isS){_isS.style.display='none';if(window._IS)window._IS.deactivate();}
  if(window._TOPO&&window._TOPO.deactivateObj)window._TOPO.deactivateObj();
  if(window._adjReset)window._adjReset();
  document.getElementById('u-controls').style.display='none';
  try{document.getElementById('u-engine-sec').style.display='none';}catch(e){}
  try{document.getElementById('u-bake-sec').style.display='none';}catch(e){}
  document.getElementById('u-clear-row').style.display='none';
  var ufile=document.getElementById('u-file');if(ufile)ufile.value='';
  var placement=document.getElementById('placement');
  if(placement)placement.classList.remove('active');
  /* Clear ALL undo/redo stacks */
  undoSt.length=0;redoSt.length=0;
  if(window._clearGenUndoStacks)window._clearGenUndoStacks();
  /* Clear snap state so drawing doesn't restore old content */
  polyPts=[];polySnap=null;snap=null;pts=[];isDown=false;
  window._snapLayer=null;window._snapLayerCtx=null;
  window._strokePreSnap=null;window._strokePreCtx=null;
  _lastStroke=null;
  /* Reset the layers system */
  if(window._layersReset)window._layersReset();
  setTool('');
  setI('ready');
  setPr(0);
  document.getElementById('se').textContent='\u2014';
  if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
}
window.resetToBlank=resetToBlank;

/* ── Engine button click handlers ── */
document.querySelectorAll('.eng').forEach(function(b){
  b.onclick=function(){
    document.querySelectorAll('.eng').forEach(function(x){x.classList.remove('on');});
    b.classList.add('on');
    eng=b.dataset.e;
    _engineSelected=true;
    buildP(eng);randP(eng);generate();
    var lbl=document.getElementById('eng-current-label'),nm=document.getElementById('eng-current-name');
    if(lbl&&nm){var inMore=b.closest('#more-engines-list');lbl.style.display=inMore?'block':'none';if(inMore)nm.textContent=b.textContent.replace(/^\d+\s*[\u2014\-]\s*/,'');}
  };
});

/* ── Reset canvas button ── */
document.getElementById('rstcvbtn').onclick=function(){
  resetToBlank();
  setI('canvas reset');
};

/* ── Random button ── */
document.getElementById('ranbtn').onclick=function(){
  locked=false;lseed=null;
  var lb=document.getElementById('lbtn');lb.classList.remove('on');lb.textContent='LOCK';
  document.getElementById('si2').value='';
  seed(Date.now());
  var ne=rp(Object.keys(ENAMES));
  document.querySelectorAll('.eng').forEach(function(b){b.classList.toggle('on',b.dataset.e===ne);});
  eng=ne;_engineSelected=true;
  buildP(eng);randP(eng);
  document.getElementById('pal').value=rp(Object.keys(PALS));
  drawSw();generate();
};

/* ── Palette change handler ── */
window._palPrevKey=document.getElementById('pal').value;
document.getElementById('pal').onchange=function(){
  drawSw();

  /* Get new palette colours */
  var p=typeof gpal==='function'?gpal():null;
  var palCols=p&&p.c&&p.c.length?p.c:null;

  /* Probability Painting: update lastCol and regen */
  var ppBody=document.getElementById('pp-body');
  if(ppBody&&ppBody.style.display!=='none'&&window._PP&&window._PP.isActive()&&palCols){
    window._PP_palCol=palCols[0];
    if(window._PP&&window._PP.isActive()){
      var ppLast=window._PP_lastState;
      if(ppLast){ppLast.lastCol=palCols[Math.floor(Math.random()*palCols.length)];}
      setTimeout(function(){
        if(window._PP_paint&&window._PP&&window._PP.isActive()){
          var lctx2=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
          if(lctx2&&window._PP_allPaths&&window._PP_allPaths.length){
            if(window._PP_baseSnap){try{lctx2.putImageData(window._PP_baseSnap,0,0);}catch(e){}}
            window._PP_allPaths.forEach(function(pts2,pi){
              for(var e=0;e<8;e++){
                if(window._PP_regen)window._PP_regen(lctx2,pts2,palCols[pi%palCols.length],pi,e);
              }
            });
            if(window._layersCompositeFn)window._layersCompositeFn();
          }
        }
      },50);
    }
  }

  /* Morphogenesis: re-render with new palette */
  if(window._MORPH)window._MORPH.onPaletteChange();

  /* Memory-Based Drawing: re-render with new palette */
  var mbdBody=document.getElementById('mbd-body');
  if(mbdBody&&mbdBody.style.display!=='none'&&window._MBD){
    setTimeout(function(){window._MBD.onPaletteChange();},80);
  }

  /* Temporal Canvases: apply palette */
  var tcBody=document.getElementById('temporal-body');
  if(tcBody&&tcBody.style.display!=='none'){
    var _tc2=window._tc;
    if(p&&p.c&&p.c.length&&_tc2){
      _tc2.color=p.c[0];
      _tc2.palette=p.c.slice();
      var colEl=document.getElementById('tc-color');
      if(colEl)colEl.value=_tc2.color;
      if(typeof regenPalette==='function')setTimeout(regenPalette,50);
    }
  }

  /* Intent Sculpting: re-emit with new palette */
  var isBody=document.getElementById('intent-sculpt-body');
  if(isBody&&isBody.style.display!=='none'){
    if(palCols&&typeof window._regenIntent==='function'){
      window._intentPalCol=palCols[0];
      setTimeout(window._regenIntent,50);
    }
  }

  /* Topological 3D: re-render with new palette */
  var topoBody=document.getElementById('topo-body');
  if(topoBody&&topoBody.style.display!=='none'&&window._TOPO){
    setTimeout(function(){window._TOPO.onPaletteChange();},80);
  }

  /* Instant recolor of existing canvas content instead of regenerating */
  if(typeof window._bpRecolorCanvas==='function'){
    var newKey=document.getElementById('pal').value;
    if(window._palPrevKey&&window._palPrevKey!==newKey){
      window._bpRecolorCanvas(window._palPrevKey,newKey);
    }
    window._palPrevKey=newKey;
  }
};

/* ── PNG Export button (↓ PNG) — uses delegation to survive DOM replacements ── */
(function(){
  var qaRow=document.getElementById('qa-row');
  if(qaRow) qaRow.addEventListener('click',function(e){
    var btn=e.target.closest('#xbtn');
    if(!btn)return;
    var tmp=window._buildExportCanvas();
    var url=tmp.toDataURL('image/png');
    var modal=document.getElementById('export-modal');
    var img=document.getElementById('export-img');
    img.src=url;
    img.alt='neoleo-'+eng+'-'+Date.now()+'.png';
    modal.classList.add('open');
    setI('Click Save As to download PNG');
  });
})();

/* ── Initial startup ── */
buildP('flowfield');drawSw();resetToBlank();
