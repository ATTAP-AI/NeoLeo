/* ══════════════════════════════════════════════════════════
   DRAG-TO-CANVAS PLACEMENT SYSTEM — extracted from NeoLeo monolith
   Depends on globals: cv, ctx, uv, uctx, lv, dv, uploadedImg,
     curTool, setI, renderLighting, renderAtmosphere
   ══════════════════════════════════════════════════════════ */
(function(){
  var cvwrap  = document.getElementById('cvwrap');
  var thumbWrap = document.getElementById('u-thumb-wrap');
  var placement = document.getElementById('placement');
  var pImg    = document.getElementById('placement-img');
  var pbInfo  = document.getElementById('pb-info');
  var pbCommit= document.getElementById('pb-commit');
  var pbCancel= document.getElementById('pb-cancel');

  // placement state
  var pState = {x:0,y:0,w:0,h:0,active:false};
  var dragOp = null; // {type:'move'|handle, sx,sy, ox,oy,ow,oh}
  var aspectRatio = 1;

  function cvRect(){ return cv.getBoundingClientRect(); }
  function cvScale(){ var r=cvRect(); return {sx:cv.width/r.width, sy:cv.height/r.height}; }

  function applyPlacement(){
    placement.style.left  = pState.x+'px';
    placement.style.top   = pState.y+'px';
    placement.style.width = pState.w+'px';
    placement.style.height= pState.h+'px';
    pbInfo.textContent = Math.round(pState.w*cvScale().sx)+'\u00D7'+Math.round(pState.h*cvScale().sy);
  }

  function showPlacement(imgSrc, dropX, dropY){
    pImg.src = imgSrc;
    var r = cvRect();
    // Default size: 40% of canvas display width, keep aspect
    var defW = r.width * 0.40;
    var defH = defW / aspectRatio;
    // Center on drop point (drop coords are relative to cvwrap)
    pState = {
      x: Math.max(0, Math.min(r.width  - defW, dropX - defW/2)),
      y: Math.max(0, Math.min(r.height - defH, dropY - defH/2)),
      w: defW, h: defH, active: true
    };
    placement.classList.add('active');
    applyPlacement();
    // Disable draw layer while placing
    dv.style.pointerEvents='none';
  }

  function hidePlacement(){
    pState.active=false;
    placement.classList.remove('active');
    pImg.src='';
    /* Restore draw layer interactivity */
    var isDraw=curTool&&curTool!=='lighting'&&curTool!=='atmo'&&curTool!=='upload'&&curTool!=='ai';
    dv.style.pointerEvents=isDraw?'auto':'none';
  }

  // ── DRAG FROM THUMBNAIL ──────────────────────────────────
  var dragImgSrc = null;

  thumbWrap.addEventListener('dragstart', function(e){
    if(!uploadedImg) return;
    aspectRatio = uploadedImg.naturalWidth / uploadedImg.naturalHeight;
    // Use the thumb canvas as drag image
    var thumb = document.getElementById('u-thumb');
    e.dataTransfer.setDragImage(thumb, thumb.width/2, thumb.height/2);
    e.dataTransfer.effectAllowed = 'copy';
    dragImgSrc = uploadedImg.src;
    cvwrap.classList.add('drop-target');
  });

  thumbWrap.addEventListener('dragend', function(){
    cvwrap.classList.remove('drop-target');
  });

  // ── DROP ONTO CANVAS ─────────────────────────────────────
  cvwrap.addEventListener('dragover', function(e){
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  cvwrap.addEventListener('dragleave', function(){
    cvwrap.classList.remove('drop-target');
  });

  cvwrap.addEventListener('drop', function(e){
    e.preventDefault();
    cvwrap.classList.remove('drop-target');
    if(!dragImgSrc) return;
    var r = cvwrap.getBoundingClientRect();
    var dropX = e.clientX - r.left;
    var dropY = e.clientY - r.top;
    showPlacement(dragImgSrc, dropX, dropY);
    dragImgSrc = null;
  });

  // ── MOVE & RESIZE HANDLES ────────────────────────────────
  placement.addEventListener('mousedown', function(e){
    if(!pState.active) return;
    var handle = e.target.dataset.handle;
    var r = cvwrap.getBoundingClientRect();
    var mx = e.clientX - r.left;
    var my = e.clientY - r.top;

    if(handle){
      // resize
      dragOp={type:'resize',handle:handle,sx:mx,sy:my,ox:pState.x,oy:pState.y,ow:pState.w,oh:pState.h};
    } else if(e.target===placement||e.target===pImg){
      // move
      dragOp={type:'move',sx:mx,sy:my,ox:pState.x,oy:pState.y};
    }
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e){
    if(!dragOp||!pState.active) return;
    var r = cvwrap.getBoundingClientRect();
    var mx = e.clientX - r.left;
    var my = e.clientY - r.top;
    var dx = mx - dragOp.sx;
    var dy = my - dragOp.sy;

    if(dragOp.type==='move'){
      pState.x = dragOp.ox + dx;
      pState.y = dragOp.oy + dy;
    } else {
      var h = dragOp.handle;
      var MIN=20;
      var ox=dragOp.ox,oy=dragOp.oy,ow=dragOp.ow,oh=dragOp.oh;
      // Shift = lock aspect ratio
      var lock = e.shiftKey;

      if(h.indexOf('e')!==-1){ pState.w=Math.max(MIN,ow+dx); if(lock)pState.h=pState.w/aspectRatio; }
      if(h.indexOf('w')!==-1){ pState.w=Math.max(MIN,ow-dx); pState.x=ox+ow-pState.w; if(lock)pState.h=pState.w/aspectRatio; }
      if(h.indexOf('s')!==-1){ pState.h=Math.max(MIN,oh+dy); if(lock)pState.w=pState.h*aspectRatio; }
      if(h.indexOf('n')!==-1){ pState.h=Math.max(MIN,oh-dy); pState.y=oy+oh-pState.h; if(lock)pState.w=pState.h*aspectRatio; }
    }
    applyPlacement();
  });

  document.addEventListener('mouseup', function(){ dragOp=null; });

  // ── COMMIT: bake placed image to cv ──────────────────────
  pbCommit.addEventListener('click', function(){
    if(!uploadedImg||!pState.active) return;
    var r = cvwrap.getBoundingClientRect();
    var sc = cvScale();
    // Convert display coords → canvas pixel coords
    var cx = pState.x * sc.sx;
    var cy = pState.y * sc.sy;
    var cw = pState.w * sc.sx;
    var ch = pState.h * sc.sy;
    ctx.drawImage(uploadedImg, cx, cy, cw, ch);
    hidePlacement();
    // Re-enable draw tool if one was active
    var isDraw = curTool && !['lighting','atmo','upload','ai'].indexOf(curTool)===-1;
    dv.style.pointerEvents = isDraw?'auto':'none';
    // Clear the uv layer too since image is now baked
    uctx.clearRect(0,0,uv.width,uv.height);
    uploadedImg=null;window.uploadedImg=null;
    cv.style.opacity='1';lv.style.opacity='1';
    document.getElementById('u-preview').style.display='none';
    var _isS2=document.getElementById('is-sec');if(_isS2){_isS2.style.display='none';if(window._IS)window._IS.deactivate();}
    document.getElementById('u-controls').style.display='none';
    document.getElementById('u-engine-sec').style.display='none';
    document.getElementById('u-bake-sec').style.display='none';
    document.getElementById('u-clear-row').style.display='none';
    var inp=document.getElementById('u-file');if(inp)inp.value='';
    setI('Image placed on canvas');
    renderLighting();renderAtmosphere();
  });

  // ── CANCEL ───────────────────────────────────────────────
  pbCancel.addEventListener('click', function(){
    hidePlacement();
    var isDraw = curTool && ['lighting','atmo','upload','ai'].indexOf(curTool)===-1;
    dv.style.pointerEvents = isDraw?'auto':'none';
  });

  // ESC cancels placement
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'&&pState.active){ hidePlacement(); }
  });

  // Double-click to commit
  placement.addEventListener('dblclick', function(){ pbCommit.click(); });

})();
