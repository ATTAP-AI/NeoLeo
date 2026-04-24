/* ══════════════════════════════════════════════════════════════════
   VIEWPORT — pinch-to-zoom + two-finger pan for the canvas area
   ══════════════════════════════════════════════════════════════════
   Applies a CSS transform to #cvwrap so the whole canvas stack
   (uv/cv/lv/dv/av + overlays + grips) scales and pans together.

   WHY this works without touching every coord routine:
     getBoundingClientRect() reflects CSS transforms. The existing
     getCanvasPos() does (clientX - rect.left) * (canvas.width / rect.width)
     — the numerator and denominator both scale with the transform, so
     canvas-pixel coordinates stay correct at any zoom level.
     (Verified in preview with translate(0,0) scale(2).)

   GESTURES:
     1-finger touch or pen → passthrough to drawing/tools (existing)
     2-finger touch       → pinch-zoom + pan the viewport only
                            (drawing is suppressed via
                             window._viewportGestureActive)
     Mouse wheel          → zoom around cursor (Cmd/Ctrl+wheel only,
                            so plain scrolling still reaches the page)

   STATE:
     window._viewport = { tx, ty, scale, apply(), reset(), fit() }
     window._viewportGestureActive = bool
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var MIN_SCALE = 0.2;
  var MAX_SCALE = 8;

  var V = {
    tx: 0,
    ty: 0,
    scale: 1
  };

  /* Update CSS transform on #cvwrap. Uses transform-origin: 0 0 so
     all pan/zoom math is straightforward screen-space algebra. */
  function apply(){
    var wrap = document.getElementById('cvwrap');
    if(!wrap) return;
    wrap.style.transformOrigin = '0 0';
    wrap.style.transform = 'translate('+V.tx+'px,'+V.ty+'px) scale('+V.scale+')';
    updateHUD();
    /* Keep status bar anchored below canvas at current display rect */
    if(window._repositionBar) window._repositionBar();
  }

  function reset(){
    V.tx = 0; V.ty = 0; V.scale = 1;
    apply();
  }

  /* Fit: scale so canvas fits stage with a small margin, centered. */
  function fit(){
    var stage = document.getElementById('stage');
    var wrap  = document.getElementById('cvwrap');
    if(!stage || !wrap) return;
    /* Read the untransformed size by temporarily clearing transform */
    var prev = wrap.style.transform;
    wrap.style.transform = '';
    var wr = wrap.getBoundingClientRect();
    var sr = stage.getBoundingClientRect();
    wrap.style.transform = prev;
    if(!wr.width || !wr.height) return;
    var pad = 40;
    var sx = (sr.width  - pad*2) / wr.width;
    var sy = (sr.height - pad*2) / wr.height;
    V.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(sx, sy, 1)));
    /* Re-center */
    V.tx = 0; V.ty = 0;
    apply();
  }

  /* Zoom around a screen-space point (cx, cy) by a given factor.
     Math: keep the canvas-logical point under (cx, cy) fixed.
     With transform-origin 0 0, the screen position of logical pt p
     is (baseLeft + tx + p*scale). We want the point under (cx, cy)
     to stay under (cx, cy) after the scale change.
        dx = cx - rect.left   (distance from current top-left to cursor)
        tx_new = tx + dx * (1 - scaleNew/scaleOld)
     rect already reflects the current transform, so we don't need
     to track baseLeft separately. */
  function zoomAround(cx, cy, factor){
    var wrap = document.getElementById('cvwrap');
    if(!wrap) return;
    var r = wrap.getBoundingClientRect();
    var newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, V.scale * factor));
    var ratio = newScale / V.scale;
    V.tx += (cx - r.left) * (1 - ratio);
    V.ty += (cy - r.top)  * (1 - ratio);
    V.scale = newScale;
    apply();
  }

  /* ─────────── Two-finger pinch/pan recognizer ─────────── */
  /* We track active touch pointers (mouse/pen ignored) on cvwrap.
     When a 2nd touch lands, enter gesture mode:
       - Set window._viewportGestureActive = true so draw-tools/ps-tools
         stop processing pointer events.
       - Dispatch a synthetic pointercancel so any in-progress
         single-finger stroke is rolled back cleanly.
       - Capture initial midpoint + distance + tx/ty/scale.
     On pointermove with two tracked touches, compute new midpoint +
     distance, derive scale ratio + pan delta, update V, apply().
     On pointerup/cancel when <2 touches remain, exit gesture mode. */
  var touches = {};        // pointerId -> {x, y}
  var gesture = null;      // start snapshot while in 2-finger mode

  function activeTouchIds(){
    var ids = [];
    for(var k in touches) ids.push(+k);
    return ids;
  }

  function startGesture(){
    var ids = activeTouchIds();
    if(ids.length < 2) return;
    var a = touches[ids[0]], b = touches[ids[1]];
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx*dx + dy*dy) || 1;
    var wrap = document.getElementById('cvwrap');
    var r = wrap.getBoundingClientRect();
    gesture = {
      startMx: mx, startMy: my,
      startDist: dist,
      startTx: V.tx, startTy: V.ty,
      startScale: V.scale,
      startRectLeft: r.left,
      startRectTop:  r.top
    };
    window._viewportGestureActive = true;
    /* Cancel any in-flight stroke so the first finger's marks
       don't stay on the canvas when the user meant to zoom. */
    try{
      document.dispatchEvent(new PointerEvent('pointercancel', {bubbles:true}));
    }catch(_){}
  }

  function updateGesture(){
    if(!gesture) return;
    var ids = activeTouchIds();
    if(ids.length < 2) return;
    var a = touches[ids[0]], b = touches[ids[1]];
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx*dx + dy*dy) || 1;
    var newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
      gesture.startScale * (dist / gesture.startDist)));
    /* Derive tx/ty so the point under startMx,startMy stays under mx,my.
       screenPos = rectLeft_start + tx_new + (startMx - rectLeft_start - txStart) * (scaleNew/scaleStart) ... simplified:
       tx_new = mx - rectLeft_start + txStart - (startMx - rectLeft_start) * (scaleNew/scaleStart) */
    var sRatio = newScale / gesture.startScale;
    V.tx = mx - gesture.startRectLeft + gesture.startTx -
           (gesture.startMx - gesture.startRectLeft) * sRatio;
    V.ty = my - gesture.startRectTop  + gesture.startTy -
           (gesture.startMy - gesture.startRectTop)  * sRatio;
    V.scale = newScale;
    apply();
  }

  function endGesture(){
    gesture = null;
    window._viewportGestureActive = false;
  }

  /* Register on cvwrap (capture phase) so we see the pointer before
     draw-tools' document-level listeners. */
  function wireGestures(){
    var wrap = document.getElementById('cvwrap');
    if(!wrap) return;
    /* touch-action:none already set on cvwrap in stage.css */

    wrap.addEventListener('pointerdown', function(e){
      if(e.pointerType !== 'touch') return;  // mouse / pen = drawing
      touches[e.pointerId] = {x:e.clientX, y:e.clientY};
      if(activeTouchIds().length === 2){
        startGesture();
        e.preventDefault();
      }
    }, true);

    wrap.addEventListener('pointermove', function(e){
      if(e.pointerType !== 'touch') return;
      if(!(e.pointerId in touches)) return;
      touches[e.pointerId].x = e.clientX;
      touches[e.pointerId].y = e.clientY;
      if(gesture){
        updateGesture();
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    function drop(e){
      if(e.pointerType !== 'touch') return;
      delete touches[e.pointerId];
      if(activeTouchIds().length < 2){
        endGesture();
      }
    }
    wrap.addEventListener('pointerup',     drop, true);
    wrap.addEventListener('pointercancel', drop, true);
    wrap.addEventListener('pointerleave',  drop, true);
  }

  /* ─────────── Mouse-wheel zoom (desktop) ─────────── */
  /* Require Cmd/Ctrl so plain-wheel page scrolling still works. */
  function wireWheel(){
    var stage = document.getElementById('stage');
    if(!stage) return;
    stage.addEventListener('wheel', function(e){
      if(!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      var factor = Math.exp(-e.deltaY * 0.0015);
      zoomAround(e.clientX, e.clientY, factor);
    }, {passive:false});
  }

  /* ─────────── Zoom HUD (bottom-left of stage) ─────────── */
  var hud = null;
  function buildHUD(){
    if(hud) return;
    var stage = document.getElementById('stage');
    if(!stage) return;
    hud = document.createElement('div');
    hud.id = 'zoom-hud';
    hud.innerHTML =
      '<button id="zoom-out" title="Zoom out (Cmd+Scroll)">−</button>'+
      '<span id="zoom-level">100%</span>'+
      '<button id="zoom-in"  title="Zoom in (Cmd+Scroll)">+</button>'+
      '<button id="zoom-fit" title="Fit to stage">Fit</button>'+
      '<button id="zoom-100" title="Reset to 100%">1:1</button>';
    hud.style.cssText =
      'position:absolute;left:10px;bottom:10px;z-index:20;'+
      'display:flex;gap:4px;align-items:center;'+
      'background:rgba(8,12,16,0.85);border:1px solid rgba(151,195,176,0.25);'+
      'padding:4px 6px;border-radius:3px;'+
      'font-family:inherit;font-size:10px;color:#97c3b0;'+
      'letter-spacing:.08em;user-select:none;touch-action:manipulation;';
    stage.appendChild(hud);
    var btnCSS = 'min-width:28px;height:28px;background:none;border:1px solid rgba(151,195,176,0.3);color:#97c3b0;font-family:inherit;font-size:13px;cursor:pointer;border-radius:2px;padding:0 6px;';
    hud.querySelectorAll('button').forEach(function(b){ b.style.cssText = btnCSS; });
    document.getElementById('zoom-in') .addEventListener('click', function(){
      var w = document.getElementById('cvwrap').getBoundingClientRect();
      zoomAround(w.left + w.width/2, w.top + w.height/2, 1.25);
    });
    document.getElementById('zoom-out').addEventListener('click', function(){
      var w = document.getElementById('cvwrap').getBoundingClientRect();
      zoomAround(w.left + w.width/2, w.top + w.height/2, 1/1.25);
    });
    document.getElementById('zoom-fit').addEventListener('click', fit);
    document.getElementById('zoom-100').addEventListener('click', reset);
  }
  function updateHUD(){
    var lbl = document.getElementById('zoom-level');
    if(lbl) lbl.textContent = Math.round(V.scale * 100) + '%';
  }

  /* ─────────── Init ─────────── */
  function init(){
    buildHUD();
    wireGestures();
    wireWheel();
    apply();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    /* main.js loads us after DOM is ready, but cvwrap may still be
       mid-setup. Defer one frame so stage.css has applied. */
    requestAnimationFrame(init);
  }

  /* Expose for debugging, tests, and keyboard shortcuts */
  window._viewport = {
    get tx(){ return V.tx; }, set tx(v){ V.tx = v; apply(); },
    get ty(){ return V.ty; }, set ty(v){ V.ty = v; apply(); },
    get scale(){ return V.scale; }, set scale(v){ V.scale = v; apply(); },
    apply: apply, reset: reset, fit: fit, zoomAround: zoomAround
  };
  window._viewportGestureActive = false;
})();
