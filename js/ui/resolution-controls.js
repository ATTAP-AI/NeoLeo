/* ── CANVAS RESOLUTION CONTROLS ── */
(function(){
  const sel     = document.getElementById('res-sel');
  const custRow = document.getElementById('res-custom-row');
  const wIn     = document.getElementById('res-cw');
  const hIn     = document.getElementById('res-ch');
  const dispEl  = document.getElementById('res-disp');
  const preBox  = document.getElementById('res-preview-inner');
  const preLbl  = document.getElementById('res-preview-label');
  const thumbRow= document.getElementById('ratio-thumbs');

  const RATIOS = {
    'square': [1,1],
    '9:16':   [9,16],
    '16:9':   [16,9],
    'circle': [1,1],
    'golden': [1.618,1],
    'custom': [16,9],
    'freeform': [1,1]
  };
  const LABELS = {
    'square':'1:1', '9:16':'9:16', '16:9':'16:9',
    'circle':'Circle', 'golden':'\u03C6:1', 'custom':'Custom', 'freeform':'Free Form'
  };
  const THUMB_DEFS=[
    {val:'square', label:'1:1',    w:24,h:24, radius:'2px'},
    {val:'9:16',   label:'9:16',   w:14,h:24, radius:'2px'},
    {val:'16:9',   label:'16:9',   w:28,h:16, radius:'2px'},
    {val:'circle', label:'Circle', w:24,h:24, radius:'50%'},
    {val:'golden', label:'\u03C6:1',    w:28,h:17, radius:'2px'},
    {val:'custom', label:'Custom', w:20,h:20, radius:'2px', dashed:true},
    {val:'freeform', label:'Free', w:22,h:22, radius:'2px', freeform:true},
  ];

  /* Build thumbnails */
  THUMB_DEFS.forEach(function(td){
    var div=document.createElement('div');
    div.className='ratio-thumb'+(td.val==='square'?' active':'');
    div.dataset.ratio=td.val;
    div.title=LABELS[td.val]||td.val;
    var shape=document.createElement('div');
    shape.className='rt-shape';
    shape.style.width=td.w+'px';shape.style.height=td.h+'px';
    shape.style.borderRadius=td.radius;
    if(td.freeform){shape.style.background='none';shape.style.border='none';shape.style.clipPath='polygon(50% 5%,85% 20%,95% 55%,75% 85%,40% 95%,10% 70%,5% 35%,25% 10%)';shape.style.outline='1.5px solid #e8c060';shape.style.outlineOffset='-1px';}
    else if(td.dashed){shape.style.background='none';shape.style.border='1px dashed #555';}
    var lbl=document.createElement('div');
    lbl.className='rt-label';lbl.textContent=td.label;
    div.appendChild(shape);div.appendChild(lbl);
    div.addEventListener('click',function(){
      sel.value=td.val;
      thumbRow.querySelectorAll('.ratio-thumb').forEach(function(t){t.classList.remove('active');});
      div.classList.add('active');
      updatePreview(td.val);
      applyRatio();
      syncThumbColor();
    });
    thumbRow.appendChild(div);
  });

  /* Sync active ratio thumbnail shape to current canvas background color */
  function syncThumbColor(){
    var col=_canvasBg||'#000000';
    /* Clear all non-active thumb inline backgrounds */
    thumbRow.querySelectorAll('.ratio-thumb .rt-shape').forEach(function(s){
      if(!s.closest('.ratio-thumb.active')){
        if(!s.style.border||s.style.border.indexOf('dashed')<0) s.style.background='';
      }
    });
    /* Set active thumb to canvas bg color */
    var activeShape=thumbRow.querySelector('.ratio-thumb.active .rt-shape');
    if(!activeShape)return;
    if(activeShape.style.border&&activeShape.style.border.indexOf('dashed')>=0)return; /* skip custom dashed */
    if(col==='transparent'){
      activeShape.style.background='repeating-conic-gradient(#555 0% 25%,#333 0% 50%) 0 0/6px 6px';
    } else {
      activeShape.style.background=col;
    }
    document.documentElement.style.setProperty('--canvas-bg',col==='transparent'?'#000':col);
  }
  window._syncThumbColor=syncThumbColor;
  /* Init sync */
  setTimeout(syncThumbColor,200);

  function updatePreview(val){
    const [rw,rh] = RATIOS[val]||[1,1];
    const ratio = rw/rh;
    const BOX = 50;
    let pw, ph;
    if(ratio >= 1){ pw = BOX; ph = Math.round(BOX/ratio); }
    else{ ph = BOX; pw = Math.round(BOX*ratio); }
    preBox.style.width  = pw + 'px';
    preBox.style.height = ph + 'px';
    preBox.style.borderRadius = (val === 'circle') ? '50%' : '0';
    /* Reflect current background colour in the thumbnail */
    preBox.style.background = (_canvasBg && _canvasBg !== 'transparent') ? _canvasBg : 'transparent';
    if(_canvasBg === 'transparent') {
      /* Checkerboard pattern for transparent */
      preBox.style.background = 'repeating-conic-gradient(#222 0% 25%, #333 0% 50%) 0 0 / 8px 8px';
    }
    preLbl.textContent = LABELS[val]||val;
    const pxLbl = document.getElementById('res-px-label');
    if(pxLbl){
      let W2,H2;
      if(val==='square'){W2=750;H2=750;}
      else if(val==='custom'){W2=parseInt(wIn.value)||750;H2=parseInt(hIn.value)||750;}
      else{const mx=1920;if(ratio>=1){W2=mx;H2=Math.round(mx/ratio);}else{H2=mx;W2=Math.round(mx*ratio);}}
      pxLbl.textContent=W2+' \u00D7 '+H2;
    }
  }

  function applyRatio(){
    const val = sel.value;
    _canvasRatio = val;
    custRow.classList.toggle('show', val==='custom');
    if(val === 'freeform'){
      /* Activate freeform drawing mode */
      if(window._startFreeformDraw) window._startFreeformDraw();
      updatePreview(val);
      return;
    }
    if(val === 'custom'){
      _customW = Math.max(100, Math.min(4096, parseInt(wIn.value)||1000));
      _customH = Math.max(100, Math.min(4096, parseInt(hIn.value)||1000));
      wIn.value = _customW; hIn.value = _customH;
      RATIOS.custom = [_customW, _customH];
      LABELS.custom = _customW + '\u00D7' + _customH;
    }

    /* Snapshot layers */
    function snap(c){ const s=document.createElement('canvas');s.width=c.width;s.height=c.height;try{s.getContext('2d').drawImage(c,0,0);}catch(e){}return s; }
    const sCV=snap(cv), sDV=snap(dv), sUV=snap(uv);
    const oldDvW=dv.width;

    dv.width=0; /* prevent sz() internal dv save */
    sz();
    const W=cv.width, H=cv.height;

    dv.width=W; dv.height=H; dv.style.width=W+'px'; dv.style.height=H+'px';
    if(oldDvW>0) dctx.drawImage(sDV,0,0,W,H);
    ctx.fillStyle=_canvasBg; ctx.fillRect(0,0,W,H);
    if(sCV.width>0) ctx.drawImage(sCV,0,0,W,H);
    if(sUV.width>0){ uctx.clearRect(0,0,W,H); uctx.drawImage(sUV,0,0,W,H); }

    renderLighting(); renderAtmosphere();
    if(dispEl) dispEl.textContent = W + ' \u00D7 ' + H + ' px';
    setI('Resolution: '+W+'\u00D7'+H);
    updatePreview(val);
    /* Re-render active tool mode on the new canvas size */
    var _expOpen=document.getElementById('exp-body')&&document.getElementById('exp-body').classList.contains('open');
    if(_expOpen){
      var _intentOpen=document.getElementById('intent-sculpt-body')&&document.getElementById('intent-sculpt-body').style.display!=='none';
      var _temporalOpen=document.getElementById('temporal-body')&&document.getElementById('temporal-body').style.display!=='none';
      /* Intent Sculpting does not auto-regen on bg/resize — user controls it */
      if(_temporalOpen&&typeof regenFull==='function')setTimeout(regenFull,50);
    } else {
      setTimeout(generate,50);
    }
  }

  sel.addEventListener('change',()=>{
    updatePreview(sel.value);
    applyRatio();
    /* Sync thumbnail active state */
    thumbRow.querySelectorAll('.ratio-thumb').forEach(function(t){
      t.classList.toggle('active',t.dataset.ratio===sel.value);
    });
  });

  /* Custom size inputs apply on blur/enter */
  [wIn,hIn].forEach(inp=>{
    inp.addEventListener('change', applyRatio);
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter') applyRatio(); });
  });

  /* Init — sync so canvas is sized before first generate */
  updatePreview(sel.value);
  applyRatio();
  thumbRow.querySelectorAll('.ratio-thumb').forEach(function(t){
    t.classList.toggle('active',t.dataset.ratio===sel.value);
  });

  /* ── Background colour wiring ── */
  const bgPicker = document.getElementById('bg-col-picker');
  const bgSwatch = document.getElementById('bg-col-swatch');
  const bgHex    = document.getElementById('bg-col-hex');
  const bgTrans  = document.getElementById('bg-col-transparent');

  var _bgTimer=null;
  function applyBgColor(col){
    _canvasBg = col;
    var isTransp = (col === 'transparent');
    /* Update swatch UI immediately */
    if(isTransp){
      if(bgSwatch) bgSwatch.style.background = 'repeating-conic-gradient(#555 0% 25%,#333 0% 50%) 0 0/8px 8px';
      if(bgHex) bgHex.textContent = 'transparent';
    } else {
      if(bgSwatch) bgSwatch.style.background = col;
      if(bgHex) bgHex.textContent = col;
      if(bgPicker) bgPicker.value = col;
    }
    /* Update thumbnail immediately */
    updatePreview(sel.value);
    if(window._syncThumbColor)window._syncThumbColor();
    /* Fill cv with new bg color */
    if(!isTransp){ctx.fillStyle=col;ctx.fillRect(0,0,cv.width,cv.height);}
    else{ctx.clearRect(0,0,cv.width,cv.height);}
    /* Clear ALL drawing/experimental layer content so only bg shows */
    dctx.clearRect(0,0,dv.width,dv.height);
    if(typeof layers!=='undefined'&&layers&&layers.length)
      layers.forEach(function(l){try{l.ctx.clearRect(0,0,l.canvas.width,l.canvas.height);}catch(e){}});
    /* Recomposite */
    if(window._layersCompositeFn) window._layersCompositeFn();
    /* Debounced full re-render for engine/experimental modes */
    clearTimeout(_bgTimer);
    _bgTimer = setTimeout(function(){
      var expOpen = document.getElementById('exp-body') &&
                    document.getElementById('exp-body').classList.contains('open');
      if(expOpen){
        /* Experimental tools — re-emit current field / re-render temporal */
        var intentOpen = document.getElementById('intent-sculpt-body') &&
                         document.getElementById('intent-sculpt-body').style.display !== 'none';
        var temporalOpen = document.getElementById('temporal-body') &&
                           document.getElementById('temporal-body').style.display !== 'none';
        if(intentOpen && typeof _regenIntent === 'function') _regenIntent();
        if(temporalOpen && typeof regenFull === 'function') regenFull();
      } else {
        /* Engine / drawing tool mode */
        if(typeof generate === 'function') generate();
      }
    }, 40);
  }

  if(bgPicker) bgPicker.addEventListener('input', function(){ applyBgColor(bgPicker.value); });
  if(bgTrans)  bgTrans.addEventListener('click', function(){ applyBgColor('transparent'); });
  /* Re-wire in case elements were not found on first pass (moved in DOM) */
  setTimeout(function(){
    var p2=document.getElementById('bg-col-picker');
    var t2=document.getElementById('bg-col-transparent');
    if(p2&&!p2._wired){p2._wired=true;p2.addEventListener('input',function(){applyBgColor(p2.value);});}
    if(t2&&!t2._wired){t2._wired=true;t2.addEventListener('click',function(){applyBgColor('transparent');});}
  }, 300);
})();
