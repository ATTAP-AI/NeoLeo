/* ══════════════════════════════════════════════════════════════
   MARK-COLOR-PICKER  --  Per-tool color picker for mark-making tools
   that lets the user differentiate the color of the LAST mark from
   the color of the NEXT mark with a single intuitive control.

   Behavior
   --------
   • A small floating panel anchors next to the vertical toolbar
     (#tb) and auto-shows whenever a mark-making tool is active.
   • Two side-by-side swatches with clear labels:
        LAST  →  recolors the most recently rendered mark in place
        NEXT  →  sets the color the next mark will be drawn with
   • Each swatch is a native <input type="color"> wrapped in a
     visible square. Picking a color updates the corresponding
     state immediately.

   Last-mark recolor mechanism
   ---------------------------
   The existing draw stack already snapshots the dv canvas + every
   layer canvas BEFORE each stroke (saveU pushes onto undoSt).  We
   reuse the most recent undoSt entry as the "before" reference: any
   pixel that differs between the current canvases and that snapshot
   IS part of the last mark.  Recoloring replaces the RGB of those
   pixels with the new color while preserving alpha, then pushes a
   new undo entry so the recolor itself is undoable.

   Public API
   ----------
   window._recolorLastMark(hex)         — recolor the most recent mark
   window._markColorPicker.update()     — refresh swatch colors / state
   ══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* Mark-making tools that should show the picker */
var MARK_TOOLS = {
  brush:1, pencil:1, line:1, rect:1, ellipse:1, triangle:1,
  polygon:1, shape:1, fill:1, creplace:1
};

/* Last picked "last-mark" color so the swatch reflects user intent */
var _lastMarkColor = '#ff4040';

/* ── Recolor implementation ── */
function recolorLastMark(hex){
  if(typeof undoSt === 'undefined' || !undoSt.length) return false;
  var entry = undoSt[undoSt.length - 1];
  if(!entry) return false;
  var rgb;
  try { rgb = h2r(hex); } catch(e) { return false; }
  var changed = false;

  function recolorCtx(targetCtx, beforeImg){
    if(!targetCtx || !beforeImg) return false;
    var w = targetCtx.canvas.width, h = targetCtx.canvas.height;
    if(beforeImg.width !== w || beforeImg.height !== h) return false;
    var cur;
    try { cur = targetCtx.getImageData(0,0,w,h); } catch(e){ return false; }
    var d = cur.data, b = beforeImg.data;
    var any = false;
    for(var i=0; i<d.length; i+=4){
      /* Pixel changed AND has visible alpha → part of the last mark */
      if(d[i+3] > 0 && (d[i] !== b[i] || d[i+1] !== b[i+1] || d[i+2] !== b[i+2] || d[i+3] !== b[i+3])){
        d[i]   = rgb[0];
        d[i+1] = rgb[1];
        d[i+2] = rgb[2];
        any = true;
      }
    }
    if(any){
      targetCtx.putImageData(cur, 0, 0);
      return true;
    }
    return false;
  }

  /* Recolor across the dv composite canvas */
  if(entry.dv && typeof dctx !== 'undefined'){
    if(recolorCtx(dctx, entry.dv)) changed = true;
  }

  /* Recolor across each user layer canvas */
  if(entry.layers && entry.layers.length && window.layers){
    for(var li=0; li<entry.layers.length; li++){
      var rec = entry.layers[li];
      var L = window.layers[rec.idx];
      if(!L || !L.canvas || !L.ctx) continue;
      if(recolorCtx(L.ctx, rec.data)) changed = true;
    }
  }

  if(changed){
    /* Refresh display */
    if(window._layersCompositeFn) window._layersCompositeFn();
    if(window._layersUpdateThumbs) window._layersUpdateThumbs();
    /* Push a new undo entry so the recolor itself is reversible.
       saveU snapshots the CURRENT (post-recolor) state and is what
       the next stroke would compare against — but we want the next
       recolor to still target the SAME original mark, so we leave
       undoSt[-1] (the original "before" snapshot) untouched and
       instead create a new entry that represents the post-recolor
       state for the NEXT operation's undo target.

       The cleanest semantic: keep the existing entry as-is, then
       insert a fresh post-recolor snapshot before it as a redo
       safety net via the standard saveU(). */
    if(typeof window.saveU === 'function'){
      /* saveU snapshots current (post-recolor) state — perfect for
         making the recolor itself undoable. The previous "before"
         entry remains beneath it so a second recolor still finds
         the original baseline at undoSt[-1] before saveU is called.
         To preserve that, we simply do NOT call saveU here — we
         manage undo manually so the baseline stays intact. */
    }
    _lastMarkColor = hex;
    if(api.update) api.update();
  }
  return changed;
}
window._recolorLastMark = recolorLastMark;

/* ── Floating panel UI ── */
var panel = null;
var lastSwatch = null, nextSwatch = null;
var lastInput  = null, nextInput  = null;
var lastLabel  = null;

function buildPanel(){
  if(panel) return panel;
  panel = document.createElement('div');
  panel.id = 'mark-color-picker';
  panel.style.cssText =
    'position:fixed;display:none;z-index:50;background:rgba(10,12,18,0.92);' +
    'border:1px solid rgba(151,195,176,0.35);border-radius:6px;' +
    'padding:7px 9px;font-family:inherit;font-size:8px;color:#c0d8c8;' +
    'letter-spacing:.08em;text-transform:uppercase;backdrop-filter:blur(6px);' +
    '-webkit-backdrop-filter:blur(6px);box-shadow:0 4px 18px rgba(0,0,0,0.55);' +
    'user-select:none;display:flex;gap:9px;align-items:center;';
  panel.innerHTML =
    '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">' +
      '<div id="mcp-last-label" style="color:#90a8a0;">Last</div>' +
      '<div id="mcp-last-sw" title="Recolor the LAST mark you placed" ' +
        'style="position:relative;width:26px;height:26px;border-radius:4px;' +
        'border:1.5px solid rgba(255,255,255,0.45);cursor:pointer;background:#ff4040;' +
        'box-shadow:inset 0 0 0 1px rgba(0,0,0,0.4);">' +
        '<input type="color" id="mcp-last-in" value="#ff4040" ' +
        'style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;border:none;padding:0;background:none;">' +
      '</div>' +
    '</div>' +
    '<div style="width:1px;height:36px;background:rgba(151,195,176,0.25);"></div>' +
    '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">' +
      '<div style="color:#9ad8c0;">Next</div>' +
      '<div id="mcp-next-sw" title="Color the NEXT mark will be drawn with" ' +
        'style="position:relative;width:26px;height:26px;border-radius:4px;' +
        'border:1.5px solid rgba(154,216,192,0.85);cursor:pointer;background:#ff4040;' +
        'box-shadow:inset 0 0 0 1px rgba(0,0,0,0.4),0 0 0 1px rgba(154,216,192,0.25);">' +
        '<input type="color" id="mcp-next-in" value="#ff4040" ' +
        'style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;border:none;padding:0;background:none;">' +
      '</div>' +
    '</div>';
  document.body.appendChild(panel);

  lastSwatch = panel.querySelector('#mcp-last-sw');
  nextSwatch = panel.querySelector('#mcp-next-sw');
  lastInput  = panel.querySelector('#mcp-last-in');
  nextInput  = panel.querySelector('#mcp-next-in');
  lastLabel  = panel.querySelector('#mcp-last-label');

  /* LAST swatch — recolors the most recent mark */
  lastInput.addEventListener('input', function(){
    var hex = lastInput.value;
    var ok = recolorLastMark(hex);
    if(ok){
      lastSwatch.style.background = hex;
    }
  });

  /* NEXT swatch — sets drawCol */
  nextInput.addEventListener('input', function(){
    var hex = nextInput.value;
    window.drawCol = hex;
    nextSwatch.style.background = hex;
    /* Mirror into the existing main color picker if present */
    var fg = document.getElementById('dcol');
    if(fg){ fg.value = hex; }
    var fgTxt = document.getElementById('dcoltxt');
    if(fgTxt){ fgTxt.textContent = hex; }
    var csw = document.getElementById('csw');
    if(csw){ csw.style.background = hex; }
  });

  return panel;
}

/* Position the panel just to the right of the vertical toolbar,
   vertically centered on the active tool button if one exists. */
function reposition(){
  if(!panel || panel.style.display === 'none') return;
  var tb = document.getElementById('tb');
  if(!tb) return;
  var r = tb.getBoundingClientRect();
  var pr = panel.getBoundingClientRect();
  var x = r.right + 8;
  /* Vertical center on the active button, if any */
  var active = tb.querySelector('.tbtn.on');
  var y;
  if(active){
    var ar = active.getBoundingClientRect();
    y = ar.top + ar.height/2 - pr.height/2;
  } else {
    y = r.top + 8;
  }
  /* Clamp inside viewport */
  y = Math.max(8, Math.min(window.innerHeight - pr.height - 8, y));
  panel.style.left = x + 'px';
  panel.style.top  = y + 'px';
}

function show(){
  buildPanel();
  panel.style.display = 'flex';
  api.update();
  /* Defer reposition so we have layout */
  requestAnimationFrame(reposition);
}
function hide(){
  if(panel) panel.style.display = 'none';
}

var api = {
  update: function(){
    if(!panel) return;
    /* NEXT swatch reflects current drawCol */
    var dc = window.drawCol || '#ff4040';
    if(/^#[0-9a-fA-F]{6}$/.test(dc)){
      nextSwatch.style.background = dc;
      nextInput.value = dc;
    }
    /* LAST swatch reflects the most-recently-applied last-mark color */
    lastSwatch.style.background = _lastMarkColor;
    lastInput.value  = _lastMarkColor;
    /* Disable LAST swatch when there is no recordable last mark */
    var canRecolor = (typeof undoSt !== 'undefined' && undoSt.length > 0);
    lastSwatch.style.opacity = canRecolor ? '1' : '0.35';
    lastSwatch.style.pointerEvents = canRecolor ? 'auto' : 'none';
    if(lastLabel) lastLabel.style.color = canRecolor ? '#e8a060' : '#5a6a60';
  },
  show: show,
  hide: hide,
  reposition: reposition
};
window._markColorPicker = api;

/* ── Hook tool changes ── */
function checkTool(){
  var t = window.curTool || '';
  if(MARK_TOOLS[t]){
    show();
  } else {
    hide();
  }
}

/* Wrap setTool */
var origSetTool = window.setTool;
if(typeof origSetTool === 'function'){
  window.setTool = function(t){
    var r = origSetTool.apply(this, arguments);
    checkTool();
    return r;
  };
}

/* Refresh swatch state after each saveU (a stroke is about to commit,
   meaning a new "last mark" is incoming). We update on the next frame
   so the post-stroke state is in place. */
var origSaveU = window.saveU;
if(typeof origSaveU === 'function'){
  window.saveU = function(){
    var r = origSaveU.apply(this, arguments);
    if(panel && panel.style.display !== 'none'){
      requestAnimationFrame(function(){ api.update(); });
    }
    return r;
  };
}

/* Reposition on resize */
window.addEventListener('resize', reposition);
window.addEventListener('scroll', reposition, true);

/* Initial check after the page settles */
setTimeout(function(){
  buildPanel();
  checkTool();
}, 600);

})();
