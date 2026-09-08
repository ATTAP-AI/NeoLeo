/* ══════════════════════════════════════════════════════════════════
   MY GALLERY — local image library
   ══════════════════════════════════════════════════════════════════
   Persists user-selected canvas captures to localStorage under the
   key `neoleo_gallery_v1`. Each entry is:

     {
       id:    string  (e.g. "g_1734567890_ab3f")
       name:  string  (default: engine name + short seed)
       thumb: string  (data:image/jpeg;base64,... — cap ~800px, q=0.85)
       full:  string  (data:image/png;base64,... — optional; may be
                       dropped later if storage is tight)
       meta:  { engine, seed, palette, width, height, createdAt }
     }

   Storage strategy: try to keep both thumb + full for every entry.
   When we would exceed a soft budget (SOFT_LIMIT bytes) or when
   localStorage.setItem throws QuotaExceededError, evict `full`
   from the oldest entries first (thumbs stay so the grid still
   renders and Restore-from-thumb still works — just at reduced
   resolution). After all fulls are gone, further additions require
   the user to delete entries manually.

   Public API:
     window._gallery.open()      — open the modal
     window._gallery.close()     — close it
     window._gallery.add()       — capture current canvas + open modal
     window._gallery.list()      — return entries (newest first)
     window._gallery.count()     — number of entries
     window._gallery.usageKB()   — approximate localStorage bytes used
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var KEY = 'neoleo_gallery_v1';
  var AUTO_KEY = 'neoleo_gallery_autoCapture';
  var SOFT_LIMIT = 4 * 1024 * 1024;   /* soft cap ~ 4 MB before eviction */
  var THUMB_MAX  = 800;               /* thumb longest edge */
  var THUMB_Q    = 0.85;              /* thumb JPEG quality */
  var MAX_ITEMS  = 60;                /* hard cap on entries */

  /* ---- Storage ---- */

  function read(){
    try{
      var raw = localStorage.getItem(KEY);
      if(!raw) return {version:1, items:[]};
      var d = JSON.parse(raw);
      if(!d || !Array.isArray(d.items)) return {version:1, items:[]};
      return d;
    }catch(e){ return {version:1, items:[]}; }
  }

  function serialize(store){ return JSON.stringify(store); }

  function tryWrite(store){
    /* Returns true on success. On failure, evicts `full` from the
       oldest entries with a full and retries — repeat until success
       or nothing left to drop. */
    var attempts = 0;
    while(attempts++ < 40){
      try{
        localStorage.setItem(KEY, serialize(store));
        return true;
      }catch(e){
        /* Find oldest entry that still has a `full` and drop it. */
        var idx = -1;
        for(var i = store.items.length - 1; i >= 0; i--){
          if(store.items[i].full){ idx = i; break; }
        }
        if(idx === -1) break;
        store.items[idx].full = null;
      }
    }
    return false;
  }

  function currentBytes(){
    try{ return (localStorage.getItem(KEY) || '').length; }catch(e){ return 0; }
  }

  /* ---- Capture ---- */

  function buildIdName(meta){
    var eng = (meta.engine || 'Canvas').replace(/\s+/g, ' ').trim();
    var seedShort = meta.seed ? String(meta.seed).slice(-4) : '';
    var name = seedShort ? (eng + ' · ' + seedShort) : eng;
    var id = 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    return {id: id, name: name};
  }

  function makeThumb(sourceCanvas){
    var w = sourceCanvas.width, h = sourceCanvas.height;
    var scale = Math.min(1, THUMB_MAX / Math.max(w, h));
    var tw = Math.max(1, Math.round(w * scale));
    var th = Math.max(1, Math.round(h * scale));
    var c = document.createElement('canvas');
    c.width = tw; c.height = th;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, tw, th);
    ctx.drawImage(sourceCanvas, 0, 0, tw, th);
    return c.toDataURL('image/jpeg', THUMB_Q);
  }

  function readCurrentMeta(){
    /* Best-effort read of currently active engine/palette/seed. Falls
       back to sensible defaults when a field is missing. */
    var pal = 'ember';
    try{ pal = document.getElementById('pal').value || 'ember'; }catch(e){}
    var seed = null;
    try{
      var si = document.getElementById('si2');
      seed = si && si.value ? si.value : (window._lastSeed || null);
    }catch(e){}
    var engine = 'Canvas';
    try{
      var on = document.querySelector('button.eng.on');
      if(on) engine = on.textContent.replace(/^\d+\s*—\s*/, '').trim();
    }catch(e){}
    var w = 0, h = 0;
    try{
      var cv = document.getElementById('cv');
      if(cv){ w = cv.width; h = cv.height; }
    }catch(e){}
    return {engine: engine, seed: seed, palette: pal, width: w, height: h, createdAt: new Date().toISOString()};
  }

  function captureCurrent(opts){
    opts = opts || {};
    var srcCanvas = null;
    try{
      if(typeof window._buildExportCanvas === 'function'){
        srcCanvas = window._buildExportCanvas();
      }
    }catch(e){}
    if(!srcCanvas){
      /* Fallback: composite from #cvw directly. */
      srcCanvas = document.getElementById('cvw');
    }
    if(!srcCanvas || !srcCanvas.width){
      showToast('Nothing to capture yet — create an image first');
      return null;
    }
    var meta = readCurrentMeta();
    if(!meta.width){ meta.width = srcCanvas.width; meta.height = srcCanvas.height; }
    var thumb = makeThumb(srcCanvas);
    /* Try to include the full-res PNG. If it pushes us near/over the
       soft limit we still write it and let tryWrite() evict older
       fulls as needed. */
    var full = null;
    try{ full = srcCanvas.toDataURL('image/png'); }catch(e){}
    var idn = buildIdName(meta);
    if(opts.name) idn.name = String(opts.name).slice(0, 80);
    var entry = {id: idn.id, name: idn.name, thumb: thumb, full: full, meta: meta};
    var store = read();
    store.items.unshift(entry);
    /* Cap total entries — drop oldest beyond MAX_ITEMS entirely. */
    while(store.items.length > MAX_ITEMS) store.items.pop();
    var ok = tryWrite(store);
    if(!ok){
      showToast('Gallery storage is full — delete some entries first');
      return null;
    }
    if(currentBytes() > SOFT_LIMIT){
      /* Proactively strip fulls from the oldest entries until we drop
         back under the soft limit. Thumbs and metadata are preserved. */
      var strippedStore = read();
      for(var i = strippedStore.items.length - 1; i >= 0; i--){
        if(!strippedStore.items[i].full) continue;
        strippedStore.items[i].full = null;
        localStorage.setItem(KEY, serialize(strippedStore));
        if(currentBytes() <= SOFT_LIMIT) break;
      }
    }
    return entry;
  }

  /* ---- Restore ---- */

  function restoreEntry(entry){
    /* Repaint the active drawing layer from the entry's stored PNG
       (or thumb when the full has been evicted). Uses the same active
       layer context that brush strokes write to, so undo and layer
       management continue to work. */
    var img = new Image();
    img.onload = function(){
      var cv = document.getElementById('cv');
      if(!cv){ showToast('Canvas not ready'); return; }
      var ctx = null;
      try{
        if(typeof window._getActiveLayerCtx === 'function') ctx = window._getActiveLayerCtx();
      }catch(e){}
      if(!ctx){
        /* Fall back to the drawing layer directly. */
        var dv = document.getElementById('dv') || document.getElementById('av');
        ctx = dv ? dv.getContext('2d') : cv.getContext('2d');
      }
      /* Optional palette sync so subsequent engine renders match. */
      if(entry.meta && entry.meta.palette){
        try{
          var palSel = document.getElementById('pal');
          if(palSel && palSel.value !== entry.meta.palette && document.querySelector('#pal option[value="' + entry.meta.palette + '"]')){
            palSel.value = entry.meta.palette;
            palSel.dispatchEvent(new Event('change'));
          }
        }catch(e){}
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      /* Fit the image into the canvas while preserving aspect. */
      var iw = img.naturalWidth, ih = img.naturalHeight;
      var s = Math.min(cv.width / iw, cv.height / ih);
      var dw = Math.round(iw * s), dh = Math.round(ih * s);
      var dx = Math.round((cv.width - dw) / 2), dy = Math.round((cv.height - dh) / 2);
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
      /* Composite active layer back into the visible drawing canvas
         (layers.js paints into offscreen buffers per layer, so a
         paint isn't visible until compositeLayers() runs). Also
         refresh the layer thumbnail. */
      try{ if(typeof window._layersCompositeFn === 'function') window._layersCompositeFn(); }catch(e){}
      try{ if(typeof window._layersUpdateThumbs === 'function') window._layersUpdateThumbs(); }catch(e){}
      close();
      showToast('Restored: ' + entry.name);
    };
    img.onerror = function(){ showToast('Could not restore image'); };
    img.src = entry.full || entry.thumb;
  }

  /* ---- Download ---- */

  function downloadEntry(entry){
    var dataUrl = entry.full || entry.thumb;
    var name = (entry.name || 'gallery').replace(/[^a-z0-9._ -]/gi, '_') + '.png';
    if(typeof window._downloadPNG === 'function'){
      window._downloadPNG(dataUrl, name);
    } else {
      var a = document.createElement('a');
      a.href = dataUrl; a.download = name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  }

  /* ---- Delete / rename ---- */

  function deleteEntry(id){
    var store = read();
    store.items = store.items.filter(function(e){ return e.id !== id; });
    localStorage.setItem(KEY, serialize(store));
    renderGrid();
  }

  function renameEntry(id, name){
    var store = read();
    var item = store.items.find(function(e){ return e.id === id; });
    if(!item) return;
    item.name = String(name).slice(0, 80);
    tryWrite(store);
    renderGrid();
  }

  /* ---- Modal ---- */

  function open(){
    var overlay = document.getElementById('gallery-overlay'),
        modal   = document.getElementById('gallery-modal');
    if(!overlay || !modal) return;
    overlay.style.display = 'block';
    modal.style.display   = 'flex';
    overlay.style.opacity = '0'; modal.style.opacity = '0';
    overlay.style.transition = 'opacity .18s ease';
    modal.style.transition   = 'opacity .18s ease';
    requestAnimationFrame(function(){
      overlay.style.opacity = '1'; modal.style.opacity = '1';
    });
    renderGrid();
  }

  function close(){
    var overlay = document.getElementById('gallery-overlay'),
        modal   = document.getElementById('gallery-modal');
    if(!overlay || !modal) return;
    overlay.style.opacity = '0'; modal.style.opacity = '0';
    setTimeout(function(){
      overlay.style.display = 'none';
      modal.style.display   = 'none';
      /* Close lightbox too if it happens to be open. */
      var lb = document.getElementById('gallery-lightbox');
      if(lb) lb.style.display = 'none';
    }, 180);
  }

  function isOpen(){
    var modal = document.getElementById('gallery-modal');
    return !!(modal && modal.style.display === 'flex');
  }

  function humanTime(iso){
    if(!iso) return '';
    try{
      var d = new Date(iso);
      return d.toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
    }catch(e){ return ''; }
  }

  function renderGrid(){
    var grid = document.getElementById('gallery-grid');
    var empty = document.getElementById('gallery-empty');
    var stats = document.getElementById('gallery-stats');
    if(!grid) return;
    var store = read();
    var items = store.items;
    grid.innerHTML = '';
    if(!items.length){
      empty.style.display = 'block';
      grid.style.display = 'none';
    } else {
      empty.style.display = 'none';
      grid.style.display = 'grid';
      items.forEach(function(entry){
        var card = document.createElement('div');
        card.className = 'g-card';
        card.dataset.id = entry.id;
        card.innerHTML =
          '<div class="g-thumb-wrap">' +
            '<img class="g-thumb" src="' + entry.thumb + '" alt="">' +
            (entry.full ? '' : '<div class="g-lowres" title="Full-res dropped to save storage">thumb only</div>') +
          '</div>' +
          '<div class="g-info">' +
            '<div class="g-name" contenteditable="false" spellcheck="false" title="Double-click to rename">' + escapeHtml(entry.name) + '</div>' +
            '<div class="g-meta">' +
              escapeHtml(entry.meta.engine || 'Canvas') +
              (entry.meta.width ? ' · ' + entry.meta.width + '×' + entry.meta.height : '') +
              ' · ' + humanTime(entry.meta.createdAt) +
            '</div>' +
            '<div class="g-actions">' +
              '<button data-act="view" title="View full-size">&#128065; View</button>' +
              '<button data-act="restore" title="Load back to canvas">&#8630; Restore</button>' +
              '<button data-act="download" title="Download PNG">&#8595; PNG</button>' +
              '<button data-act="delete" title="Remove from gallery" class="g-del">&#10005;</button>' +
            '</div>' +
          '</div>';
        grid.appendChild(card);
      });
      /* Wire card interactions. */
      grid.querySelectorAll('.g-card').forEach(function(card){
        var id = card.dataset.id;
        var entry = items.find(function(e){ return e.id === id; });
        card.querySelector('.g-thumb').addEventListener('click', function(){ openLightbox(entry); });
        card.querySelectorAll('.g-actions button').forEach(function(btn){
          btn.addEventListener('click', function(ev){
            ev.stopPropagation();
            var act = btn.dataset.act;
            if(act === 'view')    openLightbox(entry);
            else if(act === 'restore') restoreEntry(entry);
            else if(act === 'download') downloadEntry(entry);
            else if(act === 'delete'){
              if(confirm('Delete "' + entry.name + '" from the gallery?')) deleteEntry(id);
            }
          });
        });
        var nameEl = card.querySelector('.g-name');
        nameEl.addEventListener('dblclick', function(){
          nameEl.contentEditable = 'true';
          nameEl.focus();
          document.execCommand && document.execCommand('selectAll', false, null);
        });
        function commit(){
          nameEl.contentEditable = 'false';
          var v = nameEl.textContent.trim();
          if(v && v !== entry.name) renameEntry(id, v);
        }
        nameEl.addEventListener('blur', commit);
        nameEl.addEventListener('keydown', function(ev){
          if(ev.key === 'Enter'){ ev.preventDefault(); nameEl.blur(); }
          if(ev.key === 'Escape'){ nameEl.textContent = entry.name; nameEl.blur(); }
        });
      });
    }
    if(stats){
      var kb = Math.round(currentBytes() / 1024);
      stats.textContent = items.length + ' item' + (items.length === 1 ? '' : 's') + ' · ' + kb + ' KB used';
    }
  }

  function openLightbox(entry){
    var lb = document.getElementById('gallery-lightbox');
    if(!lb) return;
    var img = document.getElementById('gallery-lightbox-img');
    var cap = document.getElementById('gallery-lightbox-caption');
    img.src = entry.full || entry.thumb;
    img.alt = entry.name;
    cap.textContent = entry.name + ' · ' + (entry.meta.engine || '') +
      (entry.meta.width ? ' · ' + entry.meta.width + '×' + entry.meta.height : '');
    lb.style.display = 'flex';
    lb.dataset.id = entry.id;
  }

  function closeLightbox(){
    var lb = document.getElementById('gallery-lightbox');
    if(lb) lb.style.display = 'none';
  }

  /* ---- Utility ---- */

  function escapeHtml(s){
    return String(s || '').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function showToast(msg){
    var t = document.getElementById('gallery-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'gallery-toast';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a2e28;color:#40c8a0;border:1px solid #40c8a0;padding:10px 18px;border-radius:4px;font-family:inherit;font-size:12px;letter-spacing:.08em;z-index:11000;box-shadow:0 6px 24px rgba(0,0,0,0.5);';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(function(){ t.style.opacity = '0'; }, 2200);
  }

  /* ---- Auto-capture toggle ---- */

  function autoOn(){
    try{ return localStorage.getItem(AUTO_KEY) === '1'; }catch(e){ return false; }
  }

  function setAuto(on){
    try{ localStorage.setItem(AUTO_KEY, on ? '1' : '0'); }catch(e){}
    var cb = document.getElementById('gallery-auto-cb');
    if(cb) cb.checked = on;
  }

  function wrapGenerateForAutoCapture(){
    /* If `_generate` is defined (the CREATE button target), wrap it so
       every successful render optionally captures to the gallery when
       auto-capture is on. We poll for it since script order isn't
       fully deterministic across the module loader. */
    var tries = 0;
    var iv = setInterval(function(){
      tries++;
      var fn = window._generate;
      if(typeof fn === 'function' && !fn._galleryWrapped){
        var orig = fn;
        window._generate = function(){
          var r = orig.apply(this, arguments);
          if(autoOn()){
            /* Wait a beat so the render has actually painted before we
               capture. Most engines are synchronous but a few schedule
               work via requestAnimationFrame. */
            setTimeout(function(){ try{ captureCurrent({}); }catch(e){} }, 120);
          }
          return r;
        };
        window._generate._galleryWrapped = true;
        clearInterval(iv);
      }
      if(tries > 40) clearInterval(iv);
    }, 200);
  }

  /* ---- Wire up ---- */

  function init(){
    var btn = document.getElementById('gallery-btn');
    if(btn) btn.addEventListener('click', function(){ isOpen() ? close() : open(); });
    var addBtn = document.getElementById('gallery-add-btn');
    if(addBtn) addBtn.addEventListener('click', function(){
      var entry = captureCurrent({});
      if(entry){ open(); showToast('Added to gallery'); }
    });
    var addBtnInside = document.getElementById('gallery-modal-add');
    if(addBtnInside) addBtnInside.addEventListener('click', function(){
      var entry = captureCurrent({});
      if(entry){ renderGrid(); showToast('Added to gallery'); }
    });
    var closeBtn = document.getElementById('gallery-close');
    if(closeBtn) closeBtn.addEventListener('click', close);
    var overlay = document.getElementById('gallery-overlay');
    if(overlay) overlay.addEventListener('click', close);
    var lbClose = document.getElementById('gallery-lightbox-close');
    if(lbClose) lbClose.addEventListener('click', closeLightbox);
    var lb = document.getElementById('gallery-lightbox');
    if(lb) lb.addEventListener('click', function(e){
      if(e.target === lb) closeLightbox();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        if(document.getElementById('gallery-lightbox').style.display === 'flex') closeLightbox();
        else if(isOpen()) close();
      }
    });
    var cb = document.getElementById('gallery-auto-cb');
    if(cb){
      cb.checked = autoOn();
      cb.addEventListener('change', function(){ setAuto(cb.checked); });
    }
    wrapGenerateForAutoCapture();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window._gallery = {
    open: open,
    close: close,
    add: function(opts){ return captureCurrent(opts || {}); },
    list: function(){ return read().items.slice(); },
    count: function(){ return read().items.length; },
    usageKB: function(){ return Math.round(currentBytes() / 1024); },
    render: renderGrid,
    setAuto: setAuto,
    autoOn: autoOn
  };
})();
