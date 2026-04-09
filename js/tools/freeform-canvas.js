/* ══════════════════════════════════════════════════════════
   FREEFORM CANVAS — Draw a custom shape for the canvas
   Two modes:
     1. Polygon — click to place vertices
     2. Hand-drawn — freehand drawing with mouse
   On activation, background changes to white.
   ══════════════════════════════════════════════════════════ */
(function(){

var overlay = null;
var octx = null;
var points = [];
var cursorOn = true;
var blinkTimer = null;
var active = false;
var mode = 'polygon'; // 'polygon' or 'handdraw'
var isDrawing = false; // for handdraw: mouse is held down
var menuEl = null;     // mode selection menu

/* ── Mode selection menu ── */
function showModeMenu(){
  if(menuEl) removeModeMenu();
  menuEl = document.createElement('div');
  menuEl.id = 'ff-mode-menu';
  menuEl.style.cssText = 'position:absolute;z-index:60;top:50%;left:50%;transform:translate(-50%,-50%);' +
    'background:#1a1a2e;border:1px solid rgba(232,245,10,0.4);border-radius:6px;padding:16px 20px;' +
    'box-shadow:0 8px 30px rgba(0,0,0,0.6);font-family:"Segoe UI",system-ui,sans-serif;text-align:center;';
  menuEl.innerHTML =
    '<div style="font-size:12px;color:#E8F50A;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:14px;">Free Form Shape Mode</div>' +
    '<button id="ff-mode-polygon" style="display:block;width:200px;margin:0 auto 8px;padding:10px 16px;' +
      'background:rgba(232,245,10,0.08);border:1px solid rgba(232,245,10,0.3);color:#E8F50A;' +
      'font-size:12px;font-family:inherit;cursor:pointer;border-radius:4px;letter-spacing:.06em;text-align:left;">' +
      '<strong style="font-size:13px;">\u25B3 Polygon</strong><br>' +
      '<span style="font-size:10px;color:rgba(232,245,10,0.6);">Click to place vertices, connect the dots</span>' +
    '</button>' +
    '<button id="ff-mode-handdraw" style="display:block;width:200px;margin:0 auto 8px;padding:10px 16px;' +
      'background:rgba(40,224,209,0.08);border:1px solid rgba(40,224,209,0.3);color:#28E0D1;' +
      'font-size:12px;font-family:inherit;cursor:pointer;border-radius:4px;letter-spacing:.06em;text-align:left;">' +
      '<strong style="font-size:13px;">\u270E Hand Drawn</strong><br>' +
      '<span style="font-size:10px;color:rgba(40,224,209,0.6);">Draw freely with the mouse</span>' +
    '</button>' +
    '<button id="ff-mode-cancel" style="display:block;width:200px;margin:8px auto 0;padding:6px 16px;' +
      'background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);' +
      'font-size:10px;font-family:inherit;cursor:pointer;border-radius:4px;letter-spacing:.06em;text-transform:uppercase;">Cancel</button>';
  document.getElementById('cvwrap').appendChild(menuEl);

  document.getElementById('ff-mode-polygon').addEventListener('click', function(e){
    e.stopPropagation();
    mode = 'polygon';
    removeModeMenu();
    startDrawMode();
  });
  document.getElementById('ff-mode-handdraw').addEventListener('click', function(e){
    e.stopPropagation();
    mode = 'handdraw';
    removeModeMenu();
    startDrawMode();
  });
  document.getElementById('ff-mode-cancel').addEventListener('click', function(e){
    e.stopPropagation();
    removeModeMenu();
    cancelDrawing();
  });
  /* Prevent clicks from falling through */
  menuEl.addEventListener('mousedown', function(e){ e.stopPropagation(); });
}

function removeModeMenu(){
  if(menuEl && menuEl.parentNode) menuEl.parentNode.removeChild(menuEl);
  menuEl = null;
}

/* ── Create the overlay canvas ── */
function createOverlay(){
  if(overlay) return;
  overlay = document.createElement('canvas');
  overlay.id = 'freeform-overlay';
  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:50;cursor:crosshair;';
  octx = overlay.getContext('2d');
  document.getElementById('cvwrap').appendChild(overlay);
}

function removeOverlay(){
  if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  overlay = null;
  octx = null;
}

/* ── Blink the cursor ── */
function startBlink(){
  stopBlink();
  cursorOn = true;
  blinkTimer = setInterval(function(){
    cursorOn = !cursorOn;
    render();
  }, 500);
}
function stopBlink(){
  if(blinkTimer) clearInterval(blinkTimer);
  blinkTimer = null;
}

/* ── Convert mouse event to normalized coordinates ── */
function getPos(e){
  var rect = overlay.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height
  };
}

/* ── Chaikin corner-cutting: smooth a closed point array ── */
function chaikinSmooth(pts, iterations){
  for(var it = 0; it < iterations; it++){
    var out = [];
    var n = pts.length;
    for(var i = 0; i < n; i++){
      var a = pts[i], b = pts[(i + 1) % n];
      out.push({x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25});
      out.push({x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75});
    }
    pts = out;
  }
  return pts;
}

/* ── Draw a smooth closed curve through points using quadratic beziers ── */
function drawSmoothCurve(ctx2d, pts, w, h){
  if(pts.length < 2) return;
  ctx2d.beginPath();
  var n = pts.length;
  /* Start at midpoint between last and first point */
  var mx = (pts[n - 1].x + pts[0].x) / 2 * w;
  var my = (pts[n - 1].y + pts[0].y) / 2 * h;
  ctx2d.moveTo(mx, my);
  for(var i = 0; i < n; i++){
    var next = (i + 1) % n;
    var cpx = pts[i].x * w;
    var cpy = pts[i].y * h;
    var endx = (pts[i].x + pts[next].x) / 2 * w;
    var endy = (pts[i].y + pts[next].y) / 2 * h;
    ctx2d.quadraticCurveTo(cpx, cpy, endx, endy);
  }
  ctx2d.closePath();
}

/* ── Render the overlay ── */
function render(){
  if(!octx || !overlay) return;
  var wrap = document.getElementById('cvwrap');
  var w = wrap.clientWidth;
  var h = wrap.clientHeight;
  overlay.width = w;
  overlay.height = h;

  octx.clearRect(0, 0, w, h);

  /* Semi-transparent dark overlay */
  octx.fillStyle = 'rgba(0,0,0,0.4)';
  octx.fillRect(0, 0, w, h);

  /* Draw the path */
  if(points.length > 0){
    /* Hand-drawn: while actively drawing show raw line; when idle show smooth preview */
    if(mode === 'handdraw' && !isDrawing && points.length >= 4){
      drawSmoothCurve(octx, points, w, h);
    } else {
      octx.beginPath();
      octx.moveTo(points[0].x * w, points[0].y * h);
      for(var i = 1; i < points.length; i++){
        octx.lineTo(points[i].x * w, points[i].y * h);
      }
    }
    octx.strokeStyle = mode === 'polygon' ? '#E8F50A' : '#28E0D1';
    octx.lineWidth = 2;
    octx.lineJoin = 'round';
    octx.lineCap = 'round';
    octx.stroke();

    /* Polygon mode: draw dots at vertices */
    if(mode === 'polygon'){
      points.forEach(function(p){
        octx.beginPath();
        octx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
        octx.fillStyle = '#E8F50A';
        octx.fill();
      });
    }
  }

  /* Blinking cursor (polygon mode, or handdraw before drawing starts) */
  if(cursorOn && (mode === 'polygon' || points.length === 0)){
    var cx, cy;
    if(points.length > 0){
      var last = points[points.length - 1];
      cx = last.x * w;
      cy = last.y * h;
    } else {
      cx = w / 2;
      cy = h / 2;
    }
    var lineCol = mode === 'polygon' ? '#E8F50A' : '#28E0D1';
    octx.strokeStyle = lineCol;
    octx.lineWidth = 1.5;
    var cs = 12;
    octx.beginPath();
    octx.moveTo(cx - cs, cy); octx.lineTo(cx + cs, cy);
    octx.moveTo(cx, cy - cs); octx.lineTo(cx, cy + cs);
    octx.stroke();
    octx.beginPath();
    octx.arc(cx, cy, cs + 2, 0, Math.PI * 2);
    octx.strokeStyle = lineCol.replace(')', ',0.5)').replace('rgb', 'rgba');
    if(lineCol.charAt(0) === '#') octx.strokeStyle = 'rgba(232,245,10,0.5)';
    octx.lineWidth = 1;
    octx.stroke();
  }

  /* Instruction text */
  octx.font = '12px "Segoe UI", system-ui, sans-serif';
  octx.textAlign = 'center';
  var txtCol = mode === 'polygon' ? 'rgba(232,245,10,0.85)' : 'rgba(40,224,209,0.85)';
  octx.fillStyle = txtCol;

  if(mode === 'polygon'){
    if(points.length === 0){
      octx.fillText('Polygon Mode \u2014 Click to place vertices', w / 2, 24);
    } else if(points.length < 3){
      octx.fillText('Click to add vertices (' + (3 - points.length) + ' more needed)', w / 2, 24);
    } else {
      octx.fillText('Click to add vertices \u2014 Enter or double-click to finish \u2014 Esc to cancel', w / 2, 24);
    }
    /* Close indicator */
    if(points.length >= 3){
      octx.beginPath();
      octx.arc(points[0].x * w, points[0].y * h, 8, 0, Math.PI * 2);
      octx.strokeStyle = 'rgba(232,245,10,0.6)';
      octx.lineWidth = 1;
      octx.setLineDash([3, 3]);
      octx.stroke();
      octx.setLineDash([]);
    }
  } else {
    if(points.length === 0){
      octx.fillText('Hand Drawn Mode \u2014 Click and drag to draw your shape', w / 2, 24);
    } else if(!isDrawing){
      octx.fillText('Release to finish \u2014 Esc to cancel', w / 2, 24);
    }
  }
}

/* ══════════════════════════════════════════════════════════
   POLYGON MODE — click to place vertices
   ══════════════════════════════════════════════════════════ */
function onPolyMouseDown(e){
  if(e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  var p = getPos(e);

  /* Click near first point to close */
  if(points.length >= 3){
    var w = overlay.width, h = overlay.height;
    var dx = (p.x - points[0].x) * w;
    var dy = (p.y - points[0].y) * h;
    if(Math.sqrt(dx * dx + dy * dy) < 12){
      finishDrawing();
      return;
    }
  }

  points.push(p);
  render();
}

function onPolyMouseMove(e){
  if(!active) return;
  render();
  if(points.length > 0){
    var rect = overlay.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var w = overlay.width, h = overlay.height;
    var last = points[points.length - 1];
    octx.beginPath();
    octx.moveTo(last.x * w, last.y * h);
    octx.lineTo(mx, my);
    octx.strokeStyle = 'rgba(232,245,10,0.4)';
    octx.lineWidth = 1;
    octx.setLineDash([4, 4]);
    octx.stroke();
    octx.setLineDash([]);
  }
}

function onPolyDblClick(e){
  e.preventDefault();
  e.stopPropagation();
  if(points.length >= 3) finishDrawing();
}

/* ══════════════════════════════════════════════════════════
   HAND-DRAWN MODE — click and drag to draw freely
   ══════════════════════════════════════════════════════════ */
function onHandMouseDown(e){
  if(e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  isDrawing = true;
  points = [getPos(e)];
  render();
}

function onHandMouseMove(e){
  if(!active || !isDrawing) return;
  var p = getPos(e);
  /* Sample every few pixels to avoid too many points */
  if(points.length > 0){
    var last = points[points.length - 1];
    var rect = overlay.getBoundingClientRect();
    var dx = (p.x - last.x) * rect.width;
    var dy = (p.y - last.y) * rect.height;
    if(Math.sqrt(dx * dx + dy * dy) < 4) return;
  }
  points.push(p);
  render();
}

function onHandMouseUp(e){
  if(!active || !isDrawing) return;
  isDrawing = false;
  /* Need at least some points */
  if(points.length >= 5){
    /* Simplify points: reduce to ~80 points max for a clean clip-path */
    if(points.length > 80){
      var step = points.length / 80;
      var simplified = [];
      for(var i = 0; i < 80; i++){
        simplified.push(points[Math.round(i * step)]);
      }
      points = simplified;
    }
    finishDrawing();
  } else {
    points = [];
    render();
    setI('Draw a larger shape \u2014 click and drag to draw');
  }
}

/* ══════════════════════════════════════════════════════════
   SHARED — keyboard, finish, cancel
   ══════════════════════════════════════════════════════════ */
function onKeyDown(e){
  if(!active) return;
  if(e.key === 'Enter' && mode === 'polygon' && points.length >= 3){
    e.preventDefault();
    finishDrawing();
  }
  if(e.key === 'Escape'){
    e.preventDefault();
    cancelDrawing();
  }
  if(mode === 'polygon' && (e.key === 'Backspace' || e.key === 'Delete')){
    e.preventDefault();
    if(points.length > 0){ points.pop(); render(); }
  }
}

/* ── Finish: apply the freeform shape as clip-path ── */
function finishDrawing(){
  if(points.length < 3) return;
  /* Push undo snapshot before applying freeform */
  if(window.genUndoPush) window.genUndoPush();
  stopBlink();
  active = false;

  /* For hand-drawn mode, smooth the points for an antialiased shape */
  var finalPts = points;
  if(mode === 'handdraw'){
    /* Apply Chaikin corner-cutting (3 iterations for smooth curves) */
    finalPts = chaikinSmooth(points, 3);
    /* Cap at ~200 points to keep clip-path manageable */
    if(finalPts.length > 200){
      var step = finalPts.length / 200;
      var reduced = [];
      for(var i = 0; i < 200; i++){
        reduced.push(finalPts[Math.round(i * step)]);
      }
      finalPts = reduced;
    }
  }

  /* Build clip-path polygon */
  var polyPoints = finalPts.map(function(p){
    return (p.x * 100).toFixed(2) + '% ' + (p.y * 100).toFixed(2) + '%';
  });
  var clipPath = 'polygon(' + polyPoints.join(', ') + ')';

  window._freeformClip = clipPath;

  /* Clean up */
  unwireEvents();
  removeOverlay();

  /* Apply clip to cvwrap */
  var wrap = document.getElementById('cvwrap');
  wrap.style.clipPath = clipPath;

  /* Fill canvas with background color (blank) */
  ctx.fillStyle = window._canvasBg || '#ffffff';
  ctx.fillRect(0, 0, cv.width, cv.height);
  dctx.clearRect(0, 0, dv.width, dv.height);
  if(typeof renderLighting === 'function') renderLighting();
  if(typeof renderAtmosphere === 'function') renderAtmosphere();

  setI('Free Form shape applied');
}

/* ── Cancel ── */
function cancelDrawing(){
  stopBlink();
  active = false;
  isDrawing = false;
  points = [];
  unwireEvents();
  removeOverlay();
  removeModeMenu();

  /* Revert to square */
  window._canvasRatio = 'square';
  window._freeformClip = null;
  var wrap = document.getElementById('cvwrap');
  wrap.style.clipPath = '';

  var sel = document.getElementById('res-sel');
  if(sel) sel.value = 'square';
  var thumbRow = document.getElementById('ratio-thumbs');
  if(thumbRow) thumbRow.querySelectorAll('.ratio-thumb').forEach(function(t){
    t.classList.toggle('active', t.dataset.ratio === 'square');
  });

  setI('Free Form cancelled');
}

/* ── Wire / unwire events per mode ── */
function wireEvents(){
  if(mode === 'polygon'){
    overlay.addEventListener('mousedown', onPolyMouseDown);
    overlay.addEventListener('mousemove', onPolyMouseMove);
    overlay.addEventListener('dblclick', onPolyDblClick);
  } else {
    overlay.addEventListener('mousedown', onHandMouseDown);
    overlay.addEventListener('mousemove', onHandMouseMove);
    overlay.addEventListener('mouseup', onHandMouseUp);
  }
  document.addEventListener('keydown', onKeyDown, true);
}

function unwireEvents(){
  if(overlay){
    overlay.removeEventListener('mousedown', onPolyMouseDown);
    overlay.removeEventListener('mousemove', onPolyMouseMove);
    overlay.removeEventListener('dblclick', onPolyDblClick);
    overlay.removeEventListener('mousedown', onHandMouseDown);
    overlay.removeEventListener('mousemove', onHandMouseMove);
    overlay.removeEventListener('mouseup', onHandMouseUp);
  }
  document.removeEventListener('keydown', onKeyDown, true);
}

/* ── Start drawing after mode is selected ── */
function startDrawMode(){
  points = [];
  isDrawing = false;
  createOverlay();
  startBlink();
  render();
  wireEvents();
  var modeLabel = mode === 'polygon' ? 'Polygon' : 'Hand Drawn';
  setI('Free Form (' + modeLabel + ') \u2014 draw your shape');
}

/* ── Entry point: show mode menu ── */
function startFreeformDraw(){
  if(active) return;
  active = true;

  /* Change background to white */
  window._canvasBg = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cv.width, cv.height);
  /* Update bg UI elements */
  var bgSwatch = document.getElementById('bg-col-swatch');
  var bgHex = document.getElementById('bg-col-hex');
  var bgPicker = document.getElementById('bg-col-picker');
  if(bgSwatch) bgSwatch.style.background = '#ffffff';
  if(bgHex) bgHex.textContent = '#ffffff';
  if(bgPicker) bgPicker.value = '#ffffff';
  if(window._syncThumbColor) window._syncThumbColor();

  /* Show mode selection menu */
  showModeMenu();
  setI('Select Free Form drawing mode');
}

/* ── Expose ── */
window._startFreeformDraw = startFreeformDraw;
window._freeformClip = null;

})();
