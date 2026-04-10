/* ══════════════════════════════════════════════════════════
   FULL FEATURES SHOWCASE — Interactive gallery of all NeoLeo capabilities
   Uses the real render pipeline at full canvas size (750×750), then
   downscales to thumbnails. Completely self-contained — does NOT modify
   any other module's state permanently.

   Depends on (all via window.*): ENGINES, ENAMES, eng, gp, gpal, seed,
     ctx, cv, lv, av, dv, uv, LS, AS, renderLighting, renderAtmosphere,
     buildP, drawSw, setI, PD, PALS, genUndoPush, promptSaveName
   ══════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── Gallery localStorage ── */
var GALLERY_KEY = 'neoleo_showcase_gallery';
var MAX_GALLERY = 24;

function galleryGet(){ try{ var r=localStorage.getItem(GALLERY_KEY); return r?JSON.parse(r):[]; }catch(e){ return []; } }
function gallerySave(items){ try{ localStorage.setItem(GALLERY_KEY,JSON.stringify(items)); }catch(e){ console.warn('Gallery save failed',e); } }

/* ── Render mode: replace (clear canvas) or additive (composite on top) ── */
var _renderMode = 'replace'; /* 'replace' | 'additive' */

/* ══════════════════════════════════════════════════════════
   SHOWCASE SECTIONS & ITEMS — recipes for each example
   ══════════════════════════════════════════════════════════ */
var SECTIONS = [
  { id:'engines',    name:'Generative Engines',       color:'#40c8a0' },
  { id:'lighting',   name:'Lighting Effects',          color:'#ffee88' },
  { id:'atmosphere', name:'Atmosphere & Post-Process', color:'#c060ff' },
  { id:'humanize',   name:'Humanize',                  color:'#ff9742' },
  { id:'naturalize', name:'Naturalize',                color:'#70d0a0' },
  { id:'hh',         name:'Happy Hallucinations',      color:'#E8F50A' },
  { id:'multipass',  name:'Multi-Pass Blend',          color:'#ff44cc' },
  { id:'experimental',name:'Experimental Tools',       color:'#c060ff' }
];

var ITEMS = [
  /* ── Engines (16 representative) ── */
  {id:'sc-flowfield',     sec:'engines', name:'Flow Field',          engine:'flowfield',          pal:'ember',   seed:42},
  {id:'sc-attractor',     sec:'engines', name:'Strange Attractor',   engine:'attractor',          pal:'neon',    seed:1234},
  {id:'sc-voronoi',       sec:'engines', name:'Voronoi Diagram',     engine:'voronoi',            pal:'ocean',   seed:5678},
  {id:'sc-curl',          sec:'engines', name:'Curl Noise',          engine:'curl_noise',         pal:'aurora',  seed:9012},
  {id:'sc-physarum',      sec:'engines', name:'Physarum',            engine:'physarum',           pal:'botanic', seed:3456},
  {id:'sc-julia',         sec:'engines', name:'Julia / Mandelbrot',  engine:'julia_set',          pal:'neon',    seed:7890},
  {id:'sc-truchet',       sec:'engines', name:'Truchet Tiles',       engine:'truchet',            pal:'ink',     seed:2345},
  {id:'sc-lsystem',       sec:'engines', name:'L-System Plants',     engine:'lsystem',            pal:'botanic', seed:6789},
  {id:'sc-domainwarp',    sec:'engines', name:'Domain Warp',         engine:'domain_warp',        pal:'ember',   seed:4321},
  {id:'sc-chladni',       sec:'engines', name:'Chladni Figures',     engine:'chladni',            pal:'ghost',   seed:8765},
  {id:'sc-watercolor',    sec:'engines', name:'Watercolor',          engine:'watercolor',         pal:'earth',   seed:1111},
  {id:'sc-flame',         sec:'engines', name:'Flame Fractal',       engine:'flame_fractal',      pal:'ember',   seed:2222},
  {id:'sc-spirograph',    sec:'engines', name:'Spirograph',          engine:'spirograph',         pal:'neon',    seed:3333},
  {id:'sc-delaunay',      sec:'engines', name:'Delaunay',            engine:'delaunay',           pal:'ocean',   seed:4444},
  {id:'sc-fungal',        sec:'engines', name:'Fungal Network',      engine:'fungal_network',     pal:'earth',   seed:5555},
  {id:'sc-reaction',      sec:'engines', name:'Reaction-Diffusion',  engine:'reaction_diffusion', pal:'void',    seed:6666},

  /* ── Lighting (4) ── */
  {id:'sc-light-warm',  sec:'lighting', name:'Warm Golden Light',   engine:'curl_noise',  pal:'ember',  seed:777,
   ls:{on:true,lights:[{on:true,type:'point',col:'#ffee88',int:80,px:30,py:25,rad:280},{on:false,type:'point',col:'#88ccff',int:40,px:70,py:70,rad:160}],bloom:5,ambCol:'#001122',ambInt:0}},
  {id:'sc-light-cool',  sec:'lighting', name:'Cool Rim Light',      engine:'voronoi',     pal:'ocean',  seed:888,
   ls:{on:true,lights:[{on:true,type:'rim',col:'#44aaff',int:70,px:50,py:50,rad:300},{on:false,type:'point',col:'#88ccff',int:40,px:70,py:70,rad:160}],bloom:8,ambCol:'#001122',ambInt:0}},
  {id:'sc-light-dual',  sec:'lighting', name:'Dual Warm + Cool',    engine:'flowfield',   pal:'aurora',  seed:999,
   ls:{on:true,lights:[{on:true,type:'point',col:'#ffaa44',int:65,px:25,py:30,rad:240},{on:true,type:'point',col:'#4488ff',int:55,px:75,py:70,rad:200}],bloom:3,ambCol:'#001122',ambInt:0}},
  {id:'sc-light-bloom', sec:'lighting', name:'High Bloom Glow',     engine:'physarum',    pal:'neon',   seed:1010,
   ls:{on:true,lights:[{on:true,type:'point',col:'#ff66cc',int:90,px:50,py:40,rad:350},{on:false,type:'point',col:'#88ccff',int:40,px:70,py:70,rad:160}],bloom:20,ambCol:'#220044',ambInt:15}},

  /* ── Atmosphere (4) ── */
  {id:'sc-atmo-vig',   sec:'atmosphere', name:'Deep Vignette',       engine:'attractor',    pal:'ember',  seed:1100,
   as:{on:true,vig:{str:70,soft:40,col:'#000000'},fog:{type:'none',col:'#b0c8d8',den:0},grain:0,grade:{temp:0,sat:0,con:0,bri:0},aber:0}},
  {id:'sc-atmo-fog',   sec:'atmosphere', name:'Ground Fog',          engine:'lsystem',      pal:'ghost',  seed:1200,
   as:{on:true,vig:{str:20,soft:60,col:'#000000'},fog:{type:'bottom',col:'#c8d8e8',den:55},grain:0,grade:{temp:0,sat:0,con:0,bri:0},aber:0}},
  {id:'sc-atmo-grade', sec:'atmosphere', name:'Warm Color Grade',    engine:'domain_warp',  pal:'earth',  seed:1300,
   as:{on:true,vig:{str:30,soft:50,col:'#1a0a00'},fog:{type:'none',col:'#b0c8d8',den:0},grain:12,grade:{temp:40,sat:20,con:15,bri:5},aber:0}},
  {id:'sc-atmo-aber',  sec:'atmosphere', name:'Chromatic Aberration', engine:'reaction_diffusion', pal:'neon', seed:1400,
   as:{on:true,vig:{str:15,soft:50,col:'#000000'},fog:{type:'none',col:'#b0c8d8',den:0},grain:8,grade:{temp:0,sat:30,con:10,bri:0},aber:35}},

  /* ── Humanize (3) ── */
  {id:'sc-human-wobble', sec:'humanize', name:'Wobble + Ink Pool',   engine:'voronoi',  pal:'ink',    seed:1500, humanize:{wobble:60}},
  {id:'sc-human-rough',  sec:'humanize', name:'Edge Roughen',        engine:'truchet',  pal:'ember',  seed:1600, humanize:{wobble:30}},
  {id:'sc-human-dry',    sec:'humanize', name:'Dry Brush Effect',    engine:'lsystem',  pal:'earth',  seed:1700, humanize:{wobble:45}},

  /* ── Naturalize (4) ── */
  {id:'sc-nat-grain',  sec:'naturalize', name:'Film Grain',          engine:'curl_noise',  pal:'ember',   seed:1800, naturalize:'grain'},
  {id:'sc-nat-jitter', sec:'naturalize', name:'Jitter Displacement', engine:'flowfield',   pal:'aurora',  seed:1900, naturalize:'jitter'},
  {id:'sc-nat-paper',  sec:'naturalize', name:'Paper Texture',       engine:'watercolor',  pal:'earth',   seed:2000, naturalize:'paper'},
  {id:'sc-nat-multi',  sec:'naturalize', name:'Multi-Pass Organic',  engine:'spirograph',  pal:'ocean',   seed:2100, naturalize:'multi'},

  /* ── Happy Hallucinations (4) ── */
  {id:'sc-hh-ember',   sec:'hh', name:'Ember Storm',     engine:'flowfield',   pal:'ember',  seed:2200, hh:{strategy:'scatter',  tools:['brush','line']}},
  {id:'sc-hh-neon',    sec:'hh', name:'Neon Pulse',       engine:'julia_set',   pal:'neon',   seed:2300, hh:{strategy:'radial',   tools:['ellipse','brush']}},
  {id:'sc-hh-aurora',  sec:'hh', name:'Aurora Drift',     engine:'curl_noise',  pal:'aurora', seed:2400, hh:{strategy:'flow',     tools:['pencil','line']}},
  {id:'sc-hh-crystal', sec:'hh', name:'Crystal Weave',    engine:'delaunay',    pal:'void',   seed:2500, hh:{strategy:'constellation', tools:['line','triangle']}},

  /* ── Multi-Pass Blend (4) ── */
  {id:'sc-mp-screen5',  sec:'multipass', name:'5-Pass Screen',    engine:'curl_noise',          pal:'ember',   seed:2600, multipass:{passes:5,  blend:'screen',  decay:0.7}},
  {id:'sc-mp-overlay8', sec:'multipass', name:'8-Pass Overlay',   engine:'flowfield',           pal:'aurora',  seed:2700, multipass:{passes:8,  blend:'overlay', decay:0.8}},
  {id:'sc-mp-screen6',  sec:'multipass', name:'6-Pass Luminous',  engine:'reaction_diffusion_b',pal:'ocean',   seed:2800, multipass:{passes:6,  blend:'screen',  decay:0.75}},
  {id:'sc-mp-over10',   sec:'multipass', name:'10-Pass Deep',     engine:'physarum',            pal:'neon',    seed:2900, multipass:{passes:10, blend:'overlay', decay:0.85}},

  /* ── Experimental (4) ── */
  {id:'sc-exp-morph',  sec:'experimental', name:'Morphogenesis',    engine:'reaction_diffusion', pal:'botanic', seed:3000, experimental:'morphogenesis'},
  {id:'sc-exp-orgf',   sec:'experimental', name:'Organic Forms',    engine:'domain_warp',        pal:'aurora',  seed:3100, experimental:'organic-forms'},
  {id:'sc-exp-topo',   sec:'experimental', name:'Topology 3D',      engine:'mobius_torus',       pal:'neon',    seed:3200, experimental:'topology'},
  {id:'sc-exp-prob',   sec:'experimental', name:'Probability Paint', engine:'flowfield',          pal:'ember',   seed:3300, experimental:'probability'}
];

/* ── State ── */
var THUMB_SZ   = 150;
var _thumbCache = {};   // id -> dataURL
var _isOpen = false;
var _rendering = false;
var _renderQueue = [];
var _savedState = null; // snapshot of app state before batch render

/* ══════════════════════════════════════════════════════════
   SAVE / RESTORE APP STATE  — so thumbnail generation is invisible
   ══════════════════════════════════════════════════════════ */
function saveAppState(){
  var W = cv.width, H = cv.height;
  return {
    eng: window.eng,
    engineSelected: window._engineSelected,
    pal: document.getElementById('pal').value,
    canvasBg: window._canvasBg,
    locked: window.locked,
    lseed: window.lseed,
    seed_si2: document.getElementById('si2').value,
    LS: JSON.parse(JSON.stringify(window.LS)),
    AS: JSON.parse(JSON.stringify(window.AS)),
    cvData: ctx.getImageData(0,0,W,H),
    lvData: lctx.getImageData(0,0,W,H),
    dvData: dctx.getImageData(0,0,W,H),
    avData: actx.getImageData(0,0,W,H),
    cvwrapFilter: document.getElementById('cvwrap').style.filter,
    seText: document.getElementById('se').textContent,
    ssText: document.getElementById('ss').textContent
  };
}

function restoreAppState(s){
  if(!s) return;
  var W = cv.width, H = cv.height;

  /* Restore canvas pixels */
  ctx.putImageData(s.cvData,0,0);
  lctx.putImageData(s.lvData,0,0);
  dctx.putImageData(s.dvData,0,0);
  actx.putImageData(s.avData,0,0);

  /* Restore app vars */
  window.eng = s.eng;
  window._engineSelected = s.engineSelected;
  window._canvasBg = s.canvasBg;
  window.locked = s.locked;
  window.lseed = s.lseed;

  /* Restore UI */
  document.getElementById('pal').value = s.pal;
  document.getElementById('si2').value = s.seed_si2;
  document.getElementById('se').textContent = s.seText;
  document.getElementById('ss').textContent = s.ssText;
  document.getElementById('cvwrap').style.filter = s.cvwrapFilter || 'none';

  /* Restore LS/AS */
  Object.assign(window.LS, s.LS);
  Object.assign(window.AS, s.AS);

  /* Re-highlight engine button */
  document.querySelectorAll('.eng').forEach(function(b){
    b.classList.toggle('on', b.dataset.e === s.eng);
  });

  if(window.drawSw) window.drawSw();
  if(window.setI) window.setI('ready');
}

/* ══════════════════════════════════════════════════════════
   THUMBNAIL RENDERER — uses the real 750×750 canvas
   Renders one item at a time, snapshots, then moves on.
   ══════════════════════════════════════════════════════════ */
function startBatchRender(){
  if(_rendering) return;
  _renderQueue = ITEMS.filter(function(it){ return !_thumbCache[it.id]; });
  if(_renderQueue.length === 0){ updateProgress(1); return; }

  _rendering = true;
  _savedState = saveAppState();

  /* Override bg to white for clear thumbnails */
  window._canvasBg = '#ffffff';

  renderNextItem();
}

function renderNextItem(){
  if(_renderQueue.length === 0 || !_isOpen){
    /* Done — restore original state */
    restoreAppState(_savedState);
    _savedState = null;
    _rendering = false;
    updateProgress(1);
    return;
  }

  var item = _renderQueue.shift();
  var total = ITEMS.length;
  var done = total - _renderQueue.length;
  updateProgress(done / total);

  /* Mark card as rendering */
  var card = document.getElementById('sc-card-' + item.id);
  if(card) card.classList.add('rendering');

  /* Render this item at full canvas size */
  renderSingleItem(item, function(thumbDataUrl){
    _thumbCache[item.id] = thumbDataUrl;

    /* Paint thumbnail onto card canvas */
    if(card){
      var cardCv = card.querySelector('canvas');
      if(cardCv){
        var img = new Image();
        img.onload = function(){
          cardCv.getContext('2d').drawImage(img, 0, 0, cardCv.width, cardCv.height);
          card.classList.add('rendered');
          card.classList.remove('rendering');
        };
        img.src = thumbDataUrl;
      }
    }

    /* Yield, then next */
    setTimeout(renderNextItem, 20);
  });
}

/* ── Render one showcase item to a thumbnail dataURL ── */
function renderSingleItem(item, callback){
  var W = cv.width, H = cv.height;

  /* Clear all layers */
  lctx.clearRect(0,0,W,H);
  dctx.clearRect(0,0,W,H);
  actx.clearRect(0,0,W,H);
  window.LS.on = false;
  window.AS.on = false;
  document.getElementById('cvwrap').style.filter = 'none';

  /* Set engine + palette + seed */
  window.eng = item.engine;
  window._engineSelected = true;
  document.getElementById('pal').value = item.pal;
  if(window.buildP) window.buildP(item.engine);
  if(window.seed) window.seed(item.seed);

  /* Get palette (reads #pal dropdown + _canvasBg) */
  var p = window.gpal ? window.gpal() : {bg:'#ffffff',c:['#ff4040']};

  /* Fill bg and render engine */
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,W,H);

  try {
    if(window.ENGINES && window.ENGINES[item.engine]){
      window.ENGINES[item.engine](W, H, p);
    }
  } catch(e){
    console.warn('Showcase: engine ' + item.engine + ' failed:', e.message);
  }

  /* ── Apply post-processing effects ── */

  /* Lighting */
  if(item.ls){
    Object.assign(window.LS, JSON.parse(JSON.stringify(item.ls)));
    if(window.renderLighting) window.renderLighting();
  }

  /* Atmosphere */
  if(item.as){
    Object.assign(window.AS, JSON.parse(JSON.stringify(item.as)));
    if(window.renderAtmosphere) window.renderAtmosphere();
  }

  /* Humanize — simple wobble displacement */
  if(item.humanize){
    applySimpleHumanize(W, H, item.humanize.wobble || 30);
  }

  /* Naturalize */
  if(item.naturalize){
    applySimpleNaturalize(W, H, item.naturalize);
  }

  /* Multi-pass blend */
  if(item.multipass){
    var mp = item.multipass;
    for(var pi=1; pi<mp.passes; pi++){
      if(window.seed) window.seed(item.seed + pi*137);
      ctx.globalCompositeOperation = mp.blend;
      ctx.globalAlpha = Math.pow(mp.decay, pi);
      try { window.ENGINES[item.engine](W, H, p); } catch(e){}
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /* HH drawing overlay */
  if(item.hh){
    drawHHOverlay(W, H, p, item.hh);
  }

  /* Experimental — just use the base engine render (the tool itself
     would need interactive activation which we can't batch) */

  /* ── Snapshot composite → thumbnail ── */
  var thumb = document.createElement('canvas');
  thumb.width = THUMB_SZ; thumb.height = THUMB_SZ;
  var tc = thumb.getContext('2d');
  tc.drawImage(cv, 0, 0, THUMB_SZ, THUMB_SZ);
  /* Composite FX layers */
  tc.globalCompositeOperation = 'screen';
  tc.drawImage(lv, 0, 0, THUMB_SZ, THUMB_SZ);
  tc.globalCompositeOperation = 'source-over';
  tc.drawImage(dv, 0, 0, THUMB_SZ, THUMB_SZ);
  tc.drawImage(av, 0, 0, THUMB_SZ, THUMB_SZ);

  callback(thumb.toDataURL('image/jpeg', 0.85));
}

/* ── Humanize: simple wobble displacement on ctx ── */
function applySimpleHumanize(W, H, wobbleAmt){
  var amt = wobbleAmt / 100;
  var srcData = ctx.getImageData(0,0,W,H);
  var src = srcData.data;
  var outData = ctx.createImageData(W,H);
  var out = outData.data;
  for(var y=0; y<H; y++){
    for(var x=0; x<W; x++){
      var dx = Math.sin(y*0.08 + x*0.04) * amt * 5;
      var dy = Math.cos(x*0.08 + y*0.04) * amt * 5;
      var sx = Math.min(W-1, Math.max(0, Math.round(x+dx)));
      var sy = Math.min(H-1, Math.max(0, Math.round(y+dy)));
      var si = (sy*W+sx)*4, di = (y*W+x)*4;
      out[di]=src[si]; out[di+1]=src[si+1]; out[di+2]=src[si+2]; out[di+3]=src[si+3];
    }
  }
  ctx.putImageData(outData,0,0);
}

/* ── Naturalize: grain overlay on ctx ── */
function applySimpleNaturalize(W, H, type){
  if(window._natApplyEffects){
    try { window._natApplyEffects(); return; } catch(e){}
  }
  var count = Math.floor(W*H*0.04);
  for(var i=0; i<count; i++){
    var gx=Math.random()*W|0, gy=Math.random()*H|0;
    var v=Math.random()*255|0;
    ctx.fillStyle='rgba('+v+','+v+','+v+','+(0.1+Math.random()*0.15).toFixed(3)+')';
    ctx.fillRect(gx,gy,1,1);
  }
}

/* ── HH-style drawing overlay on dv canvas ── */
function drawHHOverlay(W, H, pal, hh){
  var cols = pal.c || ['#ff4040','#40ff40','#4040ff'];
  var count = 30 + Math.floor(Math.random()*20);
  var dc = window.dctx || dv.getContext('2d');

  for(var i=0; i<count; i++){
    dc.globalAlpha = 0.4 + Math.random()*0.4;
    dc.strokeStyle = cols[i % cols.length];
    dc.fillStyle = cols[i % cols.length];
    dc.lineWidth = 1 + Math.random()*3;

    var x = Math.random()*W, y = Math.random()*H;

    /* Position by strategy */
    if(hh.strategy === 'radial'){
      var ang = (i/count)*Math.PI*2;
      var r = W*0.12 + Math.random()*W*0.28;
      x = W/2 + Math.cos(ang)*r;
      y = H/2 + Math.sin(ang)*r;
    } else if(hh.strategy === 'flow'){
      x = (i/count)*W;
      y = H/2 + Math.sin(i*0.6)*H*0.3;
    } else if(hh.strategy === 'constellation'){
      dc.beginPath();
      dc.moveTo(Math.random()*W, Math.random()*H);
      dc.lineTo(Math.random()*W, Math.random()*H);
      dc.stroke();
      continue;
    }
    /* scatter = default random position — already set */

    var tool = hh.tools[i % hh.tools.length];
    if(tool === 'brush' || tool === 'pencil'){
      dc.beginPath();
      dc.arc(x, y, 3+Math.random()*8, 0, Math.PI*2);
      dc.fill();
    } else if(tool === 'line'){
      dc.beginPath();
      dc.moveTo(x, y);
      dc.lineTo(x+Math.random()*80-40, y+Math.random()*80-40);
      dc.stroke();
    } else if(tool === 'rect'){
      dc.strokeRect(x, y, 10+Math.random()*30, 10+Math.random()*30);
    } else if(tool === 'ellipse'){
      dc.beginPath();
      try { dc.ellipse(x, y, 5+Math.random()*15, 5+Math.random()*15, 0, 0, Math.PI*2); } catch(e){ dc.arc(x,y,8,0,Math.PI*2); }
      dc.stroke();
    } else if(tool === 'triangle'){
      var s = 10+Math.random()*18;
      dc.beginPath();
      dc.moveTo(x, y-s);
      dc.lineTo(x-s, y+s);
      dc.lineTo(x+s, y+s);
      dc.closePath();
      dc.stroke();
    }
  }
  dc.globalAlpha = 1;
}

function updateProgress(pct){
  var bar = document.getElementById('sc-render-bar');
  if(bar) bar.style.width = Math.round(pct*100)+'%';
  var status = document.getElementById('showcase-status');
  if(status){
    if(pct >= 1) status.textContent = ITEMS.length + ' showcase items ready \u2014 click any to render at full size';
    else status.textContent = 'Generating previews\u2026 ' + Math.round(pct*100) + '%';
  }
}

/* ══════════════════════════════════════════════════════════
   BUILD PANEL DOM
   ══════════════════════════════════════════════════════════ */
function buildShowcasePanel(){
  if(document.getElementById('showcase-panel')) return;

  var panel = document.createElement('div');
  panel.id = 'showcase-panel';
  panel.style.resize = 'both';
  panel.style.minWidth = '320px';
  panel.style.minHeight = '280px';
  panel.innerHTML = [
    '<div id="showcase-hdr" style="background:#813749;">',
    '  <div><div id="showcase-title">&#9733; Showcase</div>',
    '  <div id="showcase-subtitle">Click any item to render on canvas</div></div>',
    '  <div class="sc-hdr-btns">',
    '    <button class="sc-hdr-btn" id="showcase-close" title="Close">&times;</button>',
    '  </div>',
    '</div>',
    '<div id="showcase-tabs">',
    '  <button class="showcase-tab active" data-tab="catalog">&#9733; Showcase</button>',
    '  <button class="showcase-tab" data-tab="gallery">&#9632; My Gallery</button>',
    '</div>',
    '<div id="sc-mode-bar" style="display:flex;align-items:center;gap:6px;padding:5px 12px;background:rgba(0,0,0,0.25);border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;">',
    '  <span style="font-size:7px;color:rgba(255,255,255,0.4);letter-spacing:.1em;text-transform:uppercase;">Render Mode:</span>',
    '  <button class="sc-mode-btn active" data-mode="replace" style="padding:2px 8px;font-size:8px;font-family:inherit;cursor:pointer;border-radius:2px;letter-spacing:.08em;text-transform:uppercase;border:1px solid rgba(64,200,160,0.4);background:rgba(64,200,160,0.15);color:#40c8a0;">Replace</button>',
    '  <button class="sc-mode-btn" data-mode="additive" style="padding:2px 8px;font-size:8px;font-family:inherit;cursor:pointer;border-radius:2px;letter-spacing:.08em;text-transform:uppercase;border:1px solid rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.4);">Additive</button>',
    '</div>',
    '<div id="sc-render-progress"><div id="sc-render-bar"></div></div>',
    '<div id="showcase-content">',
    '  <div id="showcase-catalog"></div>',
    '  <div id="showcase-gallery"></div>',
    '</div>',
    '<div id="showcase-status">Click any item to render it on your canvas</div>'
  ].join('\n');

  document.body.appendChild(panel);

  /* Position panel left of toolbar */
  positionShowcasePanel();

  /* Build the catalog grid */
  var catalog = document.getElementById('showcase-catalog');
  SECTIONS.forEach(function(sec){
    var sectionItems = ITEMS.filter(function(it){ return it.sec === sec.id; });
    if(sectionItems.length === 0) return;

    var title = document.createElement('div');
    title.className = 'sc-section-title';
    title.style.color = sec.color;
    title.style.borderBottomColor = sec.color + '30';
    title.textContent = sec.name + ' (' + sectionItems.length + ')';
    catalog.appendChild(title);

    var grid = document.createElement('div');
    grid.className = 'sc-grid';
    sectionItems.forEach(function(item){
      grid.appendChild(createCard(item, sec));
    });
    catalog.appendChild(grid);
  });

  /* Save to Gallery button */
  var saveWrap = document.createElement('div');
  saveWrap.id = 'sc-save-gallery-btn';
  saveWrap.innerHTML = '<button id="sc-save-to-gallery">&#9632; Save Current Canvas to My Gallery</button>';
  catalog.appendChild(saveWrap);

  /* Wire events */
  document.getElementById('showcase-close').onclick = closeShowcase;

  /* Make header draggable */
  makePanelDraggable(panel);

  /* Render mode toggle */
  var modeBtns = panel.querySelectorAll('.sc-mode-btn');
  modeBtns.forEach(function(btn){
    btn.onclick = function(){
      modeBtns.forEach(function(b){
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.borderColor = 'rgba(255,255,255,0.15)';
        b.style.color = 'rgba(255,255,255,0.4)';
      });
      btn.classList.add('active');
      btn.style.background = 'rgba(64,200,160,0.15)';
      btn.style.borderColor = 'rgba(64,200,160,0.4)';
      btn.style.color = '#40c8a0';
      _renderMode = btn.getAttribute('data-mode');
    };
  });

  /* Tab switching */
  var tabs = panel.querySelectorAll('.showcase-tab');
  tabs.forEach(function(tab){
    tab.onclick = function(){
      tabs.forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.getAttribute('data-tab');
      document.getElementById('showcase-catalog').style.display = (target==='catalog') ? 'block' : 'none';
      document.getElementById('showcase-gallery').style.display = (target==='gallery') ? 'block' : 'none';
      if(target === 'gallery') buildGalleryView();
    };
  });

  /* Save to gallery */
  document.getElementById('sc-save-to-gallery').onclick = function(){ saveCurrentToGallery(); };

  /* Escape key */
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && _isOpen) closeShowcase();
  });
}

function createCard(item, sec){
  var card = document.createElement('div');
  card.className = 'sc-card';
  card.id = 'sc-card-' + item.id;
  card.title = item.name + ' \u2014 Click to render';

  /* Thumbnail canvas */
  var tc = document.createElement('canvas');
  tc.width = THUMB_SZ; tc.height = THUMB_SZ;
  var tctx = tc.getContext('2d');

  /* If cached, draw immediately */
  if(_thumbCache[item.id]){
    var img = new Image();
    img.onload = function(){ tctx.drawImage(img, 0, 0, THUMB_SZ, THUMB_SZ); card.classList.add('rendered'); };
    img.src = _thumbCache[item.id];
  } else {
    /* Placeholder with section color hint */
    tctx.fillStyle = '#1a1e24';
    tctx.fillRect(0,0,THUMB_SZ,THUMB_SZ);
    var pg = tctx.createRadialGradient(THUMB_SZ/2,THUMB_SZ/2,10,THUMB_SZ/2,THUMB_SZ/2,THUMB_SZ/2);
    pg.addColorStop(0, sec.color + '18');
    pg.addColorStop(1, 'transparent');
    tctx.fillStyle = pg;
    tctx.fillRect(0,0,THUMB_SZ,THUMB_SZ);
  }
  card.appendChild(tc);

  /* Placeholder icon */
  var ph = document.createElement('div');
  ph.className = 'sc-card-placeholder';
  ph.innerHTML = '&#9670;';
  card.appendChild(ph);

  /* Label */
  var lbl = document.createElement('div');
  lbl.className = 'sc-card-label';
  lbl.innerHTML = item.name + '<span class="sc-card-section-tag">' + sec.name + '</span>';
  card.appendChild(lbl);

  /* Click → render at full size */
  card.addEventListener('click', function(){ applyShowcaseItem(item); });

  return card;
}

/* ══════════════════════════════════════════════════════════
   APPLY SHOWCASE ITEM — render to the main canvas for the user
   ══════════════════════════════════════════════════════════ */
function applyShowcaseItem(item){
  /* Panel stays open — do NOT close */
  var W = cv.width, H = cv.height;
  var isReplace = (_renderMode === 'replace');

  /* Push undo state */
  if(window.genUndoPush) window.genUndoPush();

  /* Set engine */
  window.eng = item.engine;
  window._engineSelected = true;
  document.querySelectorAll('.eng').forEach(function(b){
    b.classList.toggle('on', b.dataset.e === item.engine);
  });

  /* Set palette */
  document.getElementById('pal').value = item.pal;
  if(window.drawSw) window.drawSw();

  /* Build params */
  if(window.buildP) window.buildP(item.engine);

  /* Set seed & lock */
  document.getElementById('si2').value = item.seed;
  window.lseed = item.seed;
  window.locked = true;
  if(window.seed) window.seed(item.seed);
  var lb = document.getElementById('lbtn');
  if(lb){ lb.classList.add('on'); lb.textContent = 'LOCKED'; }

  /* ── Clear canvases based on render mode ── */
  if(isReplace){
    ctx.clearRect(0,0,W,H);
    uctx.clearRect(0,0,W,H);
    lctx.clearRect(0,0,W,H);
    dctx.clearRect(0,0,W,H);
    actx.clearRect(0,0,W,H);
    document.getElementById('cvwrap').style.filter = 'none';

    /* Reset LS/AS to defaults */
    window.LS.on = false;
    window.LS.bloom = 0; window.LS.ambInt = 0;
    window.LS.lights[0] = {on:true,type:'point',col:'#ffee88',int:60,px:30,py:25,rad:220};
    window.LS.lights[1] = {on:false,type:'point',col:'#88ccff',int:40,px:70,py:70,rad:160};
    window.AS.on = false;
    window.AS.grain = 0; window.AS.aber = 0;
    window.AS.vig = {str:0,soft:50,col:'#000000'};
    window.AS.fog = {type:'none',col:'#b0c8d8',den:0};
    window.AS.grade = {temp:0,sat:0,con:0,bri:0};
  }
  /* Clear FX layers regardless */
  lctx.clearRect(0,0,W,H);
  actx.clearRect(0,0,W,H);

  /* Apply item-specific LS */
  if(item.ls){
    Object.assign(window.LS, JSON.parse(JSON.stringify(item.ls)));
    syncLightingUI();
  } else if(isReplace){
    var lOn = document.getElementById('l-on'); if(lOn) lOn.checked = false;
  }

  /* Apply item-specific AS */
  if(item.as){
    Object.assign(window.AS, JSON.parse(JSON.stringify(item.as)));
    syncAtmosphereUI();
  } else if(isReplace){
    var aOn = document.getElementById('a-on'); if(aOn) aOn.checked = false;
  }

  if(window.setI) window.setI('Showcase: rendering ' + item.name + ' (' + _renderMode + ')\u2026');

  /* ── Direct engine render — bypass generate() to avoid export popup ── */
  setTimeout(function(){
    var p = window.gpal ? window.gpal() : {bg:'#000000',c:['#ff4040']};

    /* In replace mode, fill bg first */
    if(isReplace){
      ctx.fillStyle = p.bg;
      ctx.fillRect(0,0,W,H);
    }

    /* Update engine/seed display for ALL paths */
    document.getElementById('se').textContent = window.ENAMES[item.engine] || item.engine;
    document.getElementById('ss').textContent = item.seed;

    if(item.multipass){
      doMultiPassRender(item, p, isReplace);
    } else if(item.hh){
      doDirectRender(item, p);
      setTimeout(function(){
        drawHHOverlay(W, H, p, item.hh);
        if(typeof window._histPush === 'function') window._histPush();
        finishApply(item);
      }, 100);
      return;
    } else if(item.humanize){
      doDirectRender(item, p);
      setTimeout(function(){ applySimpleHumanize(W, H, item.humanize.wobble||30); if(typeof window._histPush === 'function') window._histPush(); finishApply(item); }, 100);
      return;
    } else if(item.naturalize){
      doDirectRender(item, p);
      setTimeout(function(){ applySimpleNaturalize(W, H, item.naturalize); if(typeof window._histPush === 'function') window._histPush(); finishApply(item); }, 100);
      return;
    } else if(item.experimental){
      doDirectRender(item, p);
      setTimeout(function(){ triggerExperimental(item.experimental); if(typeof window._histPush === 'function') window._histPush(); finishApply(item); }, 300);
      return;
    } else {
      doDirectRender(item, p);
    }

    /* Apply lighting & atmosphere */
    if(window.renderLighting) window.renderLighting();
    if(window.renderAtmosphere) window.renderAtmosphere();

    if(typeof window._histPush === 'function') window._histPush();

    setTimeout(function(){ finishApply(item); }, 100);
  }, 50);
}

/* ── Direct engine render (bypasses generate() popup/undo) ── */
function doDirectRender(item, p){
  var W = cv.width, H = cv.height;
  try {
    if(window.ENGINES && window.ENGINES[item.engine]){
      window.ENGINES[item.engine](W, H, p);
    }
  } catch(e){
    console.warn('Showcase render failed for ' + item.engine + ':', e.message);
  }
}

function finishApply(item){
  if(window.setI) window.setI('Showcase: ' + item.name + ' rendered \u2014 modify freely!');
  if(typeof window.updateGlobalUndoBtns === 'function') window.updateGlobalUndoBtns();
}

function doMultiPassRender(item, p, isReplace){
  var W = cv.width, H = cv.height;
  if(!p) p = window.gpal ? window.gpal() : {bg:'#000',c:['#ff4040']};
  var mp = item.multipass;
  if(window.seed) window.seed(item.seed);
  if(isReplace){ ctx.fillStyle = p.bg; ctx.fillRect(0,0,W,H); }
  try { window.ENGINES[item.engine](W,H,p); } catch(e){}
  for(var i=1; i<mp.passes; i++){
    if(window.seed) window.seed(item.seed + i*137);
    ctx.globalCompositeOperation = mp.blend;
    ctx.globalAlpha = Math.pow(mp.decay, i);
    try { window.ENGINES[item.engine](W,H,p); } catch(e){}
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  if(window.renderLighting) window.renderLighting();
  if(window.renderAtmosphere) window.renderAtmosphere();
  document.getElementById('se').textContent = window.ENAMES[item.engine] || item.engine;
  document.getElementById('ss').textContent = item.seed;
  if(typeof window._histPush === 'function') window._histPush();
  setTimeout(function(){ finishApply(item); }, 100);
}

function triggerExperimental(type){
  if(type==='morphogenesis' && window._MORPH && window._MORPH.render) window._MORPH.render();
  else if(type==='organic-forms' && window._ORGF && window._ORGF.render) window._ORGF.render();
  else if(type==='topology' && window._TOPO && window._TOPO.render) window._TOPO.render();
  else if(type==='probability' && window._PP && window._PP.toggle) window._PP.toggle();
}

/* ── Sync UI helpers ── */
function syncLightingUI(){
  var lOn=document.getElementById('l-on'); if(lOn) lOn.checked=window.LS.on;
  [0,1].forEach(function(i){
    var n=i+1, lt=window.LS.lights[i];
    var ck=document.getElementById('l'+n+'-on'); if(ck) ck.checked=lt.on;
    var tp=document.getElementById('l'+n+'-type'); if(tp) tp.value=lt.type;
    var cl=document.getElementById('l'+n+'-col'); if(cl) cl.value=lt.col;
    ['int','px','py','rad'].forEach(function(k){
      var sl=document.getElementById('l'+n+'-'+k); if(sl) sl.value=lt[k];
      var vl=document.getElementById('l'+n+'-'+k+'v'); if(vl) vl.textContent=lt[k]+(k==='px'||k==='py'?'%':'');
    });
  });
  var blm=document.getElementById('l-blm'); if(blm) blm.value=window.LS.bloom;
  if(window.renderLighting) window.renderLighting();
}

function syncAtmosphereUI(){
  var aOn=document.getElementById('a-on'); if(aOn) aOn.checked=window.AS.on;
  [['a-vstr','a-vstrv',window.AS.vig.str],['a-vsft','a-vsftv',window.AS.vig.soft],
   ['a-fden','a-fdenv',window.AS.fog.den],['a-grain','a-grainv',window.AS.grain],
   ['a-temp','a-tempv',window.AS.grade.temp],['a-sat','a-satv',window.AS.grade.sat],
   ['a-con','a-conv',window.AS.grade.con],['a-bri','a-briv',window.AS.grade.bri],
   ['a-aber','a-aberv',window.AS.aber]].forEach(function(a){
    var s=document.getElementById(a[0]); if(s) s.value=a[2];
    var v=document.getElementById(a[1]); if(v) v.textContent=a[2];
  });
  var ft=document.getElementById('a-ftype'); if(ft) ft.value=window.AS.fog.type;
  if(window.renderAtmosphere) window.renderAtmosphere();
}

/* ══════════════════════════════════════════════════════════
   MY GALLERY
   ══════════════════════════════════════════════════════════ */
function saveCurrentToGallery(){
  var SZ = 200;
  var thumb = document.createElement('canvas');
  thumb.width = SZ; thumb.height = SZ;
  var tc = thumb.getContext('2d');
  tc.drawImage(uv, 0,0, SZ, SZ);
  tc.drawImage(cv, 0,0, SZ, SZ);
  tc.globalCompositeOperation = 'screen';
  tc.drawImage(lv, 0,0, SZ, SZ);
  tc.globalCompositeOperation = 'source-over';
  tc.drawImage(dv, 0,0, SZ, SZ);
  tc.drawImage(av, 0,0, SZ, SZ);
  var thumbData = thumb.toDataURL('image/jpeg', 0.75);

  /* Full composite for restore */
  var full = document.createElement('canvas');
  full.width = cv.width; full.height = cv.height;
  var fc = full.getContext('2d');
  fc.drawImage(uv,0,0); fc.drawImage(cv,0,0);
  fc.globalCompositeOperation='screen'; fc.drawImage(lv,0,0);
  fc.globalCompositeOperation='source-over'; fc.drawImage(dv,0,0); fc.drawImage(av,0,0);
  var fullData = full.toDataURL('image/png');

  var engName = (window.ENAMES && window.eng) ? (window.ENAMES[window.eng] || window.eng) : 'Canvas';
  var defaultName = engName + ' \u2014 ' + new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});

  function doSave(name){
    var entry = {
      id: 'gal-' + Date.now(), name: name, thumb: thumbData, fullImage: fullData,
      engine: window.eng||'', palette: document.getElementById('pal').value,
      seed: window.lseed||'', timestamp: Date.now(), w: cv.width, h: cv.height
    };
    var gallery = galleryGet();
    gallery.unshift(entry);
    if(gallery.length > MAX_GALLERY) gallery.splice(MAX_GALLERY);
    gallerySave(gallery);
    if(window.setI) window.setI('\u2713 Saved to My Gallery: ' + name);
    if(_isOpen) buildGalleryView();
  }

  if(window.promptSaveName) window.promptSaveName(defaultName, doSave);
  else { var n=prompt('Name this gallery entry:', defaultName); if(n) doSave(n); }
}

function buildGalleryView(){
  var container = document.getElementById('showcase-gallery');
  var gallery = galleryGet();

  if(gallery.length === 0){
    container.innerHTML = '<div class="sc-gallery-empty">No saved gallery items yet.<br>Render a showcase item, modify it, then click \u201cSave Current Canvas to My Gallery\u201d.</div>';
    return;
  }

  container.innerHTML = '<div class="sc-gallery-toolbar"><span class="sc-gallery-count">' + gallery.length + ' / ' + MAX_GALLERY + ' items saved</span><button class="sc-gallery-clear-btn" id="sc-gallery-clear">&#10005; Clear All</button></div><div class="sc-grid" id="sc-gallery-grid"></div>';

  var grid = document.getElementById('sc-gallery-grid');
  gallery.forEach(function(entry, idx){
    var card = document.createElement('div');
    card.className = 'sc-card sc-gallery-card rendered';
    card.title = entry.name + ' \u2014 Click to restore';

    var tc = document.createElement('canvas');
    tc.width = THUMB_SZ; tc.height = THUMB_SZ;
    if(entry.thumb){
      var img = new Image();
      img.onload = function(){ tc.getContext('2d').drawImage(img,0,0,THUMB_SZ,THUMB_SZ); };
      img.src = entry.thumb;
    }
    card.appendChild(tc);

    var lbl = document.createElement('div');
    lbl.className = 'sc-card-label';
    var date = new Date(entry.timestamp);
    lbl.innerHTML = entry.name + '<span class="sc-card-section-tag">' + date.toLocaleDateString(undefined,{month:'short',day:'numeric'}) + ' ' + date.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}) + '</span>';
    card.appendChild(lbl);

    /* Actions */
    var actions = document.createElement('div');
    actions.className = 'sc-card-actions';

    var delBtn = document.createElement('button');
    delBtn.className = 'sc-card-action-btn';
    delBtn.innerHTML = '&times;'; delBtn.title = 'Delete';
    delBtn.addEventListener('click', function(e){ e.stopPropagation(); var g=galleryGet(); g.splice(idx,1); gallerySave(g); buildGalleryView(); });
    actions.appendChild(delBtn);

    var expBtn = document.createElement('button');
    expBtn.className = 'sc-card-action-btn';
    expBtn.innerHTML = '&#8595;'; expBtn.title = 'Download PNG'; expBtn.style.color = '#40c8a0';
    expBtn.addEventListener('click', function(e){ e.stopPropagation(); if(entry.fullImage){ var a=document.createElement('a'); a.href=entry.fullImage; a.download=(entry.name||'gallery').replace(/[^a-zA-Z0-9\-_ ]/g,'')+'.png'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }});
    actions.appendChild(expBtn);
    card.appendChild(actions);

    card.addEventListener('click', function(){ restoreGalleryItem(entry); });
    grid.appendChild(card);
  });

  document.getElementById('sc-gallery-clear').addEventListener('click', function(){
    if(!confirm('Delete all gallery items?')) return;
    gallerySave([]); buildGalleryView();
  });
}

function restoreGalleryItem(entry){
  /* Panel stays open — do NOT close */
  if(window.genUndoPush) window.genUndoPush();
  if(entry.fullImage){
    var img = new Image();
    img.onload = function(){
      ctx.clearRect(0,0,cv.width,cv.height);
      ctx.drawImage(img,0,0,cv.width,cv.height);
      if(entry.engine && window.ENAMES && window.ENAMES[entry.engine]){
        window.eng = entry.engine; window._engineSelected = true;
        document.querySelectorAll('.eng').forEach(function(b){ b.classList.toggle('on',b.dataset.e===entry.engine); });
        document.getElementById('se').textContent = window.ENAMES[entry.engine];
      }
      if(entry.palette){ document.getElementById('pal').value = entry.palette; if(window.drawSw) window.drawSw(); }
      if(entry.seed){ document.getElementById('ss').textContent=entry.seed; document.getElementById('si2').value=entry.seed; window.lseed=entry.seed; }
      if(window.setI) window.setI('Gallery item restored: '+entry.name+' \u2014 modify freely!');
    };
    img.src = entry.fullImage;
  }
}

/* ══════════════════════════════════════════════════════════
   OPEN / CLOSE
   ══════════════════════════════════════════════════════════ */
function openShowcase(){
  buildShowcasePanel();
  _isOpen = true;
  var panel = document.getElementById('showcase-panel');
  panel.classList.add('open');
  positionShowcasePanel();
  document.getElementById('showcase-catalog').style.display = 'block';
  document.getElementById('showcase-gallery').style.display = 'none';

  /* Reset tabs */
  var tabs = document.querySelectorAll('.showcase-tab');
  tabs.forEach(function(t){ t.classList.remove('active'); });
  if(tabs[0]) tabs[0].classList.add('active');

  /* Start progressive thumbnail generation */
  setTimeout(startBatchRender, 200);
}

function closeShowcase(){
  _isOpen = false;
  var panel = document.getElementById('showcase-panel');
  if(panel) panel.classList.remove('open');
  /* If batch render was running, it will stop at next iteration (checks _isOpen) */
}

/* ══════════════════════════════════════════════════════════
   WIRE MENU BUTTON
   ══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   POSITION & DRAG — floating panel helpers
   ══════════════════════════════════════════════════════════ */
function positionShowcasePanel(){
  var panel = document.getElementById('showcase-panel');
  if(!panel) return;
  /* Position to the left of the toolbar area, top-aligned */
  var tb = document.getElementById('toolbar') || document.querySelector('.toolbar');
  if(tb){
    var r = tb.getBoundingClientRect();
    panel.style.left = Math.max(8, r.left - panel.offsetWidth - 12) + 'px';
    panel.style.top = '40px';
  } else {
    panel.style.right = '20px';
    panel.style.top = '40px';
  }
}

function makePanelDraggable(panel){
  var hdr = document.getElementById('showcase-hdr');
  if(!hdr) return;
  var dragging = false, startX, startY, origX, origY;

  hdr.addEventListener('mousedown', function(e){
    if(e.target.tagName === 'BUTTON') return;
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    var rect = panel.getBoundingClientRect();
    origX = rect.left; origY = rect.top;
    /* Remove right positioning, switch to left */
    panel.style.right = 'auto';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e){
    if(!dragging) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    panel.style.left = Math.max(0, origX + dx) + 'px';
    panel.style.top = Math.max(0, origY + dy) + 'px';
  });

  document.addEventListener('mouseup', function(){
    dragging = false;
  });
}

/* ══════════════════════════════════════════════════════════
   WIRE MENU BUTTON
   ══════════════════════════════════════════════════════════ */
function wireButton(){
  var btn = document.getElementById('showcase-btn');
  if(btn) btn.addEventListener('click', function(){
    var panel = document.getElementById('showcase-panel');
    if(panel && panel.classList.contains('open')){
      closeShowcase();
    } else {
      openShowcase();
    }
  });
}

setTimeout(wireButton, 200);

/* ── Expose on window ── */
window._SHOWCASE = {
  open: openShowcase,
  close: closeShowcase,
  saveToGallery: saveCurrentToGallery
};

})();
