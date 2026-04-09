/* ══════════════════════════════════════════════════════════
   LAYERS SYSTEM — extracted from NeoLeo monolith
   Depends on globals: dv, dctx, cv, ctx, lv, lctx, av, actx,
     setI, positionPanel, saveU, undoSt, redoSt, curTool,
     renderLighting, renderAtmosphere, ENAMES, eng, generate
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── Each layer: { id, name, canvas, ctx, visible, opacity, blend, locked } ── */
var layers = [];
var activeLayerIdx = 0;
var layerCounter = 1;

var BLENDS = ['source-over','multiply','screen','overlay','soft-light',
                'color-dodge','color-burn','hard-light','difference','exclusion',
                'lighten','darken','hue','saturation','color','luminosity'];

/* ── Create an off-screen canvas the same size as dv ── */
function makeLayerCanvas(){
  var c = document.createElement('canvas');
  c.width = dv.width || 800;
  c.height = dv.height || 800;
  return c;
}

/* ── Make a new layer ── */
function makeLayer(name, srcCanvas){
  var c = makeLayerCanvas();
  var ctx2 = c.getContext('2d');
  if(srcCanvas){
    ctx2.drawImage(srcCanvas, 0, 0);
  }
  return {
    id: Date.now() + Math.random(),
    name: name || 'Layer ' + layerCounter++,
    canvas: c, ctx: ctx2,
    visible: true, opacity: 1, blend: 'source-over', locked: false
  };
}

/* ── Composite all layers onto dv ── */
function compositeLayers(){
  dctx.clearRect(0, 0, dv.width, dv.height);
  layers.forEach(function(l){
    if(!l.visible) return;
    dctx.save();
    dctx.globalAlpha = l.opacity;
    dctx.globalCompositeOperation = l.blend;
    dctx.drawImage(l.canvas, 0, 0);
    dctx.restore();
  });
}

/* ── Expose active layer context so drawing tools write to the right layer ── */
function syncActiveLayer(){
  if(layers.length === 0) return;
  var al = layers[activeLayerIdx];
  if(!al) return;
  /* Override dctx to point at the active layer's canvas context */
  window._activeLayerCtx = al.ctx;
}

/* ── Thumbnail for layer row ── */
function updateThumb(layer){
  var th = layer._thumbEl;
  if(!th) return;
  var tc = th.getContext('2d');
  tc.clearRect(0,0,36,28);
  /* Checker background */
  for(var cy=0;cy<28;cy+=7)for(var cx=0;cx<36;cx+=7){
    tc.fillStyle=(cx/7+cy/7)%2===0?'#333':'#222';
    tc.fillRect(cx,cy,7,7);
  }
  tc.drawImage(layer.canvas, 0, 0, 36, 28);
}

/* ── Build the layer list UI ── */
function renderLayerUI(){
  var list = document.getElementById('lyr-list');
  if(!list) return;
  list.innerHTML = '';

  /* Render in reverse so top layer is at top of list (PS convention) */
  for(var i = layers.length - 1; i >= 0; i--){
    (function(i){
    var layer = layers[i];
    var row = document.createElement('div');
    row.className = 'lyr-row' + (i === activeLayerIdx ? ' active' : '');
    row.dataset.idx = i;

    /* Visibility eye */
    var vis = document.createElement('div');
    vis.className = 'lyr-vis';
    vis.textContent = layer.visible ? '\u{1F441}' : '\u25CB';
    vis.title = layer.visible ? 'Hide' : 'Show';
    vis.addEventListener('click', function(e){
      e.stopPropagation();
      layer.visible = !layer.visible;
      vis.textContent = layer.visible ? '\u{1F441}' : '\u25CB';
      compositeLayers();
    });

    /* Thumbnail */
    var thumbWrap = document.createElement('div');
    thumbWrap.className = 'lyr-thumb';
    var thumb = document.createElement('canvas');
    thumb.width = 36; thumb.height = 28;
    layer._thumbEl = thumb;
    updateThumb(layer);
    thumbWrap.appendChild(thumb);

    /* Name */
    var name = document.createElement('div');
    name.className = 'lyr-name';
    name.textContent = layer.name;
    name.title = 'Double-click to rename';
    name.addEventListener('dblclick', function(){
      name.contentEditable = 'true';
      name.focus();
      document.execCommand('selectAll', false, null);
    });
    name.addEventListener('blur', function(){
      name.contentEditable = 'false';
      layer.name = name.textContent.trim() || layer.name;
    });
    name.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); name.blur(); }
    });

    /* Blend select */
    var blend = document.createElement('select');
    blend.className = 'lyr-blend';
    BLENDS.forEach(function(b){
      var opt = document.createElement('option');
      opt.value = b; opt.textContent = b.replace(/-/g,' ');
      if(b === layer.blend) opt.selected = true;
      blend.appendChild(opt);
    });
    blend.draggable = false;
    blend.addEventListener('mousedown', function(e){ e.stopPropagation(); row.draggable = false; });
    blend.addEventListener('mouseup', function(){ row.draggable = true; });
    blend.addEventListener('change', function(e){
      e.stopPropagation();
      layer.blend = blend.value;
      compositeLayers();
    });

    /* Delete */
    var del = document.createElement('button');
    del.className = 'lyr-del'; del.innerHTML = '\u00D7'; del.title = 'Delete layer';
    del.addEventListener('click', function(e){
      e.stopPropagation();
      if(layers.length <= 1){ setI('Cannot delete the last layer'); return; }
      layers.splice(i, 1);
      if(activeLayerIdx >= layers.length) activeLayerIdx = layers.length - 1;
      syncActiveLayer();
      compositeLayers();
      renderLayerUI();
      updateOpacitySlider();
    });

    /* Row click selects layer */
    row.addEventListener('click', function(){
      activeLayerIdx = i;
      syncActiveLayer();
      renderLayerUI();
      updateOpacitySlider();
      setI('Layer: ' + layer.name);
    });

    /* Drag to reorder (skip for interactive controls) */
    row.draggable = true;
    row.addEventListener('dragstart', function(e){
      if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'){e.preventDefault();return;}
      e.dataTransfer.setData('text/plain', i);
    });
    row.addEventListener('dragover', function(e){ e.preventDefault(); row.style.borderTop='1px solid var(--acc)'; });
    row.addEventListener('dragleave', function(){ row.style.borderTop=''; });
    row.addEventListener('drop', function(e){
      e.preventDefault(); row.style.borderTop='';
      var fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      var toIdx = i;
      if(fromIdx === toIdx) return;
      var moved = layers.splice(fromIdx, 1)[0];
      layers.splice(toIdx, 0, moved);
      activeLayerIdx = toIdx;
      syncActiveLayer();
      compositeLayers();
      renderLayerUI();
    });

    row.appendChild(vis);
    row.appendChild(thumbWrap);
    row.appendChild(name);
    row.appendChild(blend);
    row.appendChild(del);
    list.appendChild(row);
    })(i);
  }
}

function updateOpacitySlider(){
  var sl = document.getElementById('lyr-op-sl');
  var vl = document.getElementById('lyr-op-val');
  if(!sl || !vl || !layers[activeLayerIdx]) return;
  var op = Math.round(layers[activeLayerIdx].opacity * 100);
  sl.value = op;
  vl.textContent = op + '%';
}

/* ── Wire opacity slider ── */
var opSlider = document.getElementById('lyr-op-sl');
if(opSlider) opSlider.addEventListener('input', function(){
  if(!layers[activeLayerIdx]) return;
  layers[activeLayerIdx].opacity = parseInt(opSlider.value) / 100;
  document.getElementById('lyr-op-val').textContent = opSlider.value + '%';
  compositeLayers();
});

/* ── Action buttons ── */
document.getElementById('lyr-add').addEventListener('click', function(){
  var l = makeLayer();
  layers.splice(activeLayerIdx + 1, 0, l);
  activeLayerIdx = activeLayerIdx + 1;
  syncActiveLayer();
  renderLayerUI();
  updateOpacitySlider();
  setI('New layer: ' + l.name);
});

document.getElementById('lyr-dup').addEventListener('click', function(){
  if(!layers[activeLayerIdx]) return;
  var src = layers[activeLayerIdx];
  var l = makeLayer(src.name + ' copy', src.canvas);
  l.opacity = src.opacity; l.blend = src.blend;
  layers.splice(activeLayerIdx + 1, 0, l);
  activeLayerIdx = activeLayerIdx + 1;
  syncActiveLayer();
  compositeLayers();
  renderLayerUI();
  updateOpacitySlider();
});

document.getElementById('lyr-merge').addEventListener('click', function(){
  if(activeLayerIdx <= 0 || layers.length < 2) return;
  var top = layers[activeLayerIdx];
  var below = layers[activeLayerIdx - 1];
  below.ctx.save();
  below.ctx.globalAlpha = top.opacity;
  below.ctx.globalCompositeOperation = top.blend;
  below.ctx.drawImage(top.canvas, 0, 0);
  below.ctx.restore();
  below.name = below.name + '+' + top.name;
  layers.splice(activeLayerIdx, 1);
  activeLayerIdx = activeLayerIdx - 1;
  syncActiveLayer();
  compositeLayers();
  renderLayerUI();
  updateOpacitySlider();
  setI('Merged layers');
});

document.getElementById('lyr-flat').addEventListener('click', function(){
  if(!confirm('Flatten all layers into one? This cannot be undone.')) return;
  var flat = makeLayer('Background');
  flat.ctx.clearRect(0, 0, flat.canvas.width, flat.canvas.height);
  layers.forEach(function(l){
    if(!l.visible) return;
    flat.ctx.save();
    flat.ctx.globalAlpha = l.opacity;
    flat.ctx.globalCompositeOperation = l.blend;
    flat.ctx.drawImage(l.canvas, 0, 0);
    flat.ctx.restore();
  });
  /* Mutate in place so window.layers reference stays valid for undo system */
  layers.length = 0; layers.push(flat);
  activeLayerIdx = 0;
  layerCounter = 2;
  syncActiveLayer();
  compositeLayers();
  renderLayerUI();
  updateOpacitySlider();
  setI('Flattened to one layer');
});

/* ── Layers panel open/close ── */
var layTool = document.getElementById('laytool');
var layPanel = document.getElementById('layers-panel');

function openLayersPanel(){
  ['light-panel','atmo-panel','upload-panel','prompt-panel'].forEach(function(id){
    document.getElementById(id).classList.remove('open');
  });
  positionPanel('layers-panel');
  layPanel.classList.add('open');
  document.querySelectorAll('.tbtn').forEach(function(b){
    b.classList.toggle('on', b.dataset.t === 'layers');
  });
  renderLayerUI();
  updateOpacitySlider();
}
function closeLayersPanel(){
  layPanel.classList.remove('open');
  document.querySelectorAll('.tbtn').forEach(function(b){
    if(b.id === 'laytool') b.classList.remove('on');
  });
}

if(layTool){
  layTool.addEventListener('click', function(){
    if(layPanel.classList.contains('open')) closeLayersPanel();
    else openLayersPanel();
  });
}
document.getElementById('lyr-cls').addEventListener('click', closeLayersPanel);

/* ── Patch drawing to use active layer ctx ── */
/* Override dctx to write to active layer, then composite to dv */
var origSaveU = saveU;
window._lyrsaveU = function(){
  if(!layers.length) return;
  var al = layers[activeLayerIdx];
  try{
    undoSt.push({
      layerIdx: activeLayerIdx,
      imgData: al.ctx.getImageData(0, 0, al.canvas.width, al.canvas.height)
    });
    if(undoSt.length > 20) undoSt.shift();
    redoSt = [];
  }catch(e){}
};

/* Resize all layer canvases when canvas is resized */
var _origSz = window._origSz;
window._layersResizeTo = function(W, H){
  layers.forEach(function(l){
    if(l.canvas.width === W && l.canvas.height === H) return;
    var tmp = document.createElement('canvas');
    tmp.width = l.canvas.width; tmp.height = l.canvas.height;
    tmp.getContext('2d').drawImage(l.canvas, 0, 0);
    l.canvas.width = W; l.canvas.height = H;
    l.ctx.drawImage(tmp, 0, 0, W, H);
  });
};

/* Keyboard: Shift+Y toggle */
document.addEventListener('keydown', function(e){
  if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if(e.shiftKey && e.key === 'Y'){
    e.preventDefault();
    if(layPanel.classList.contains('open')) closeLayersPanel();
    else openLayersPanel();
  }
});

/* ── Initialise with one default layer ── */
function initLayers(){
  var bg = makeLayer('Layer 1');
  /* Copy current dv content into the first layer */
  try{ bg.ctx.drawImage(dv, 0, 0); }catch(e){}
  /* Mutate in place so window.layers reference stays valid for undo system */
  layers.length = 0; layers.push(bg);
  activeLayerIdx = 0;
  layerCounter = 2;
  syncActiveLayer();
}

/* ── Reset layers to fresh empty state ── */
function resetLayersToBlank(){
  /* Clear all existing layer canvases */
  layers.forEach(function(l){ l.ctx.clearRect(0, 0, l.canvas.width, l.canvas.height); });
  /* Replace with a single empty layer */
  var W = dv.width || 800, H = dv.height || 800;
  var fresh = makeLayer('Layer 1');
  fresh.canvas.width = W; fresh.canvas.height = H;
  /* Mutate in place so window.layers reference stays valid for undo system */
  layers.length = 0; layers.push(fresh);
  activeLayerIdx = 0;
  layerCounter = 2;
  syncActiveLayer();
  compositeLayers();
  renderLayerUI();
}
window._layersReset = resetLayersToBlank;

/* Defer init until after sz() has run */
requestAnimationFrame(function(){
  requestAnimationFrame(initLayers);
});

/* ── Patch applyBrushStroke to target active layer then composite ── */
window._layersCompositeFn = compositeLayers;
window.compositeLayers = compositeLayers;
window.layers = layers;
window._layersRenderUI = renderLayerUI;
window._layersUpdateThumbs = function(){
  if(layers[activeLayerIdx]) updateThumb(layers[activeLayerIdx]);
};
window._getActiveLayerCtx = function(){
  return layers[activeLayerIdx] ? layers[activeLayerIdx].ctx : dctx;
};

})();


/* ══════════════════════════════════════════════════════════
   ENGINE LAYERS SYSTEM
   Engine outputs stacked and composited onto cv
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── Engine layer store ── */
/* Each entry: { id, name, canvas, visible, opacity, blend } */
var engineLayers = [];
var activeELayerIdx = -1; /* -1 = no active engine layer */

/* ── Auto-Layer: opt-in toggle ── */
var autoLayerOn = false;
var AUTO_LAYER_MAX = 20;

function _onCvRender(label){
  if(!autoLayerOn) return;
  if(engineLayers.length >= AUTO_LAYER_MAX) engineLayers.shift();
  requestAnimationFrame(function(){
    captureEngineLayer(label);
    compositeEngineLayers();
  });
}

var EBLENDS = ['source-over','multiply','screen','overlay','soft-light',
                 'color-dodge','difference','lighten','darken','luminosity'];

/* ── Composite all engine layers onto cv ── */
function compositeEngineLayers(){
  var W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  /* First: draw any engine layer marked as base (bottom) */
  engineLayers.forEach(function(el){
    if(!el.visible) return;
    ctx.save();
    ctx.globalAlpha = el.opacity;
    ctx.globalCompositeOperation = el.blend;
    ctx.drawImage(el.canvas, 0, 0, W, H);
    ctx.restore();
  });
  renderLighting();
  renderAtmosphere();
}

/* ── Capture the current cv content into a new engine layer ── */
function captureEngineLayer(labelOverride){
  var W = cv.width, H = cv.height;
  var snap = document.createElement('canvas');
  snap.width = W; snap.height = H;
  snap.getContext('2d').drawImage(cv, 0, 0);
  var layerName = labelOverride || ((ENAMES[eng]||eng) + ' #' + (engineLayers.length + 1));
  var el = {
    id: Date.now() + Math.random(),
    name: layerName,
    canvas: snap,
    visible: true,
    opacity: 1,
    blend: 'source-over'
  };
  engineLayers.push(el);
  activeELayerIdx = engineLayers.length - 1;
  renderEngineLayerUI();
  setI('Engine layer: ' + layerName);
  return el;
}

/* ── Thumbnail ── */
function updateEThumb(el){
  if(!el._thumbEl) return;
  var tc = el._thumbEl.getContext('2d');
  tc.clearRect(0,0,32,24);
  for(var cy=0;cy<24;cy+=6)for(var cx=0;cx<32;cx+=6){
    tc.fillStyle=(cx/6+cy/6)%2===0?'#333':'#222';tc.fillRect(cx,cy,6,6);
  }
  tc.drawImage(el.canvas, 0, 0, 32, 24);
}

/* ── Build engine layer list ── */
function renderEngineLayerUI(){
  var list = document.getElementById('elyr-list');
  if(!list) return;
  list.innerHTML = '';

  if(engineLayers.length === 0){
    var empty = document.createElement('div');
    empty.style.cssText = 'font-size:9px;color:#97c3b0;font-style:italic;padding:4px 0;';
    empty.textContent = 'No engine layers yet. Generate and click + Capture.';
    list.appendChild(empty);
    return;
  }

  /* Show top-to-bottom (latest first) */
  for(var i = engineLayers.length - 1; i >= 0; i--){
    (function(i){
    var el = engineLayers[i];
    var row = document.createElement('div');
    row.className = 'elyr-row' + (i === activeELayerIdx ? ' active' : '');

    /* ── Top line: vis + thumb + name + del ── */
    var topLine = document.createElement('div');
    topLine.className = 'elyr-top';

    var vis = document.createElement('div');
    vis.className = 'elyr-vis';
    vis.textContent = el.visible ? '\u{1F441}' : '\u25CB';
    vis.title = el.visible ? 'Hide' : 'Show';
    vis.addEventListener('click', function(e){
      e.stopPropagation();
      el.visible = !el.visible;
      vis.textContent = el.visible ? '\u{1F441}' : '\u25CB';
      compositeEngineLayers();
    });

    var thumbWrap = document.createElement('div');
    thumbWrap.className = 'elyr-thumb';
    var tc = document.createElement('canvas');
    tc.width = 32; tc.height = 24;
    el._thumbEl = tc;
    updateEThumb(el);
    thumbWrap.appendChild(tc);

    var nm = document.createElement('div');
    nm.className = 'elyr-name';
    nm.textContent = el.name;
    nm.title = 'Double-click to rename';
    nm.style.cssText = 'flex:1;font-size:9px;color:#aaa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    nm.addEventListener('dblclick', function(){
      nm.contentEditable = 'true'; nm.focus();
      document.execCommand('selectAll', false, null);
    });
    nm.addEventListener('blur', function(){
      nm.contentEditable = 'false';
      el.name = nm.textContent.trim() || el.name;
    });
    nm.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); nm.blur(); }
    });

    var del = document.createElement('button');
    del.className = 'elyr-del'; del.innerHTML = '\u00D7'; del.title = 'Delete';
    del.addEventListener('click', function(e){
      e.stopPropagation();
      engineLayers.splice(i, 1);
      if(activeELayerIdx >= engineLayers.length) activeELayerIdx = engineLayers.length - 1;
      compositeEngineLayers();
      renderEngineLayerUI();
    });

    topLine.appendChild(vis);
    topLine.appendChild(thumbWrap);
    topLine.appendChild(nm);
    topLine.appendChild(del);

    /* ── Bottom line: blend mode + opacity slider ── */
    var ctrlLine = document.createElement('div');
    ctrlLine.className = 'elyr-controls';

    var blendSel = document.createElement('select');
    blendSel.className = 'elyr-blend';
    EBLENDS.forEach(function(b){
      var opt = document.createElement('option');
      opt.value = b; opt.textContent = b.replace(/-/g,' ');
      if(b === el.blend) opt.selected = true;
      blendSel.appendChild(opt);
    });
    blendSel.draggable = false;
    blendSel.addEventListener('mousedown', function(e){ e.stopPropagation(); row.draggable = false; });
    blendSel.addEventListener('mouseup', function(){ row.draggable = true; });
    blendSel.addEventListener('change', function(e){
      e.stopPropagation();
      el.blend = blendSel.value;
      compositeEngineLayers();
    });

    var opSlider2 = document.createElement('input');
    opSlider2.type = 'range';
    opSlider2.className = 'elyr-op-slider';
    opSlider2.min = 1; opSlider2.max = 100;
    opSlider2.value = Math.round(el.opacity * 100);
    opSlider2.draggable = false;
    opSlider2.addEventListener('mousedown', function(e){ e.stopPropagation(); row.draggable = false; });
    opSlider2.addEventListener('mouseup', function(){ row.draggable = true; });
    var opLbl = document.createElement('div');
    opLbl.className = 'elyr-op-lbl';
    opLbl.textContent = Math.round(el.opacity * 100) + '%';
    opSlider2.addEventListener('input', function(e){
      e.stopPropagation();
      el.opacity = parseInt(opSlider2.value) / 100;
      opLbl.textContent = opSlider2.value + '%';
      compositeEngineLayers();
    });

    ctrlLine.appendChild(blendSel);
    ctrlLine.appendChild(opSlider2);
    ctrlLine.appendChild(opLbl);

    row.addEventListener('click', function(e){
      if(e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      activeELayerIdx = i;
      renderEngineLayerUI();
    });

    row.draggable = true;
    row.addEventListener('dragstart', function(e){
      if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'){e.preventDefault();return;}
      e.dataTransfer.setData('text/plain', String(i));
    });
    row.addEventListener('dragover', function(e){ e.preventDefault(); row.style.borderTop = '2px solid var(--acc)'; });
    row.addEventListener('dragleave', function(){ row.style.borderTop = ''; });
    row.addEventListener('drop', function(e){
      e.preventDefault(); row.style.borderTop = '';
      var from = parseInt(e.dataTransfer.getData('text/plain'));
      if(from === i) return;
      var moved = engineLayers.splice(from, 1)[0];
      engineLayers.splice(i, 0, moved);
      activeELayerIdx = i;
      compositeEngineLayers();
      renderEngineLayerUI();
    });

    row.appendChild(topLine);
    row.appendChild(ctrlLine);
    list.appendChild(row);
    })(i);
  }
}

/* ── Wire Capture button ── */
var captureBtn = document.getElementById('elyr-add-btn');
if(captureBtn){
  captureBtn.addEventListener('click', function(){
    captureEngineLayer();
  });
}

/* ── Patch generate() to auto-composite if engine layers exist ── */
/* Override: after generate completes, add current render to cv composite */
window._engineLayersCaptureAndComposite = function(){
  /* Called from generate() after engine renders */
  /* If user has engine layers active, composite them after render */
  if(engineLayers.length > 0){
    /* Current cv content is the new engine render — composite with existing layers */
    var currentRender = document.createElement('canvas');
    currentRender.width = cv.width; currentRender.height = cv.height;
    currentRender.getContext('2d').drawImage(cv, 0, 0);

    /* Rebuild cv from all engine layers + current render on top */
    ctx.clearRect(0, 0, cv.width, cv.height);
    engineLayers.forEach(function(el){
      if(!el.visible) return;
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.globalCompositeOperation = el.blend;
      ctx.drawImage(el.canvas, 0, 0, cv.width, cv.height);
      ctx.restore();
    });
    /* Draw current render on top with source-over */
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(currentRender, 0, 0);
    ctx.restore();
  }
};

/* Expose compositing fn for layers panel refresh */
window._recompositeEngineLayers = compositeEngineLayers;
window._captureEngineLayer = captureEngineLayer;
window._renderEngineLayerUI = renderEngineLayerUI;
window._onCvRender = _onCvRender;
window._autoLayerOn = function(){ return autoLayerOn; };
window._setAutoLayer = function(v){ autoLayerOn = !!v; };

/* Init UI */
renderEngineLayerUI();

/* ── "Generate to New Engine Layer" button in layers panel ── */
/* Add a small Generate button next to Capture */
var elyrHdr = document.getElementById('elyr-hdr');
if(elyrHdr){
  var genBtn = document.createElement('button');
  genBtn.id = 'elyr-gen-btn';
  genBtn.title = 'Generate engine output and capture it as a new layer, keeping previous engine layers';
  genBtn.style.cssText = 'font-size:8px;padding:2px 7px;background:none;border:1px solid #4a3080;color:#a080ff;font-family:inherit;cursor:pointer;letter-spacing:.06em;text-transform:uppercase;margin-left:4px;';
  genBtn.textContent = '\u25B6 Gen+Layer';
  genBtn.addEventListener('mouseenter', function(){ genBtn.style.borderColor='#a080ff';genBtn.style.color='#c0a0ff'; });
  genBtn.addEventListener('mouseleave', function(){ genBtn.style.borderColor='#4a3080';genBtn.style.color='#a080ff'; });
  genBtn.addEventListener('click', function(){
    if(typeof generate === 'function'){
      var wasAuto = autoLayerOn;
      autoLayerOn = true;
      generate();
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){ autoLayerOn = wasAuto; });
      });
    }
  });
  elyrHdr.appendChild(genBtn);
}

/* ── Auto-Layer toggle button ── */
var autoBtn = document.getElementById('elyr-auto-btn');
if(autoBtn){
  autoBtn.addEventListener('click', function(){
    autoLayerOn = !autoLayerOn;
    autoBtn.classList.toggle('on', autoLayerOn);
    autoBtn.textContent = autoLayerOn ? '\u25CF Auto' : '\u25CB Auto';
    autoBtn.style.borderColor = autoLayerOn ? '#a080ff' : '#4a3080';
    autoBtn.style.color = autoLayerOn ? '#c0a0ff' : '#666';
    setI(autoLayerOn ? 'Auto-layer ON \u2014 renders become layers' : 'Auto-layer OFF');
  });
}

})();
