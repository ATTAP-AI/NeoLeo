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
  { id:'experimental',name:'Experimental Tools',       color:'#c060ff' },
  { id:'chrp',        name:'Chromatic Physics',        color:'#6a8ccc' },
  { id:'td3d',        name:'3D Objects',               color:'#ffa03c' }
];

var ITEMS = [
  /* ── Engines (all 48) ── */
  {id:'sc-flowfield',     sec:'engines', name:'Flow Field',            engine:'flowfield',            pal:'ember',   seed:42},
  {id:'sc-attractor',     sec:'engines', name:'Strange Attractor',     engine:'attractor',            pal:'neon',    seed:1234},
  {id:'sc-subdivision',   sec:'engines', name:'Recursive Subdivision', engine:'subdivision',          pal:'ocean',   seed:101},
  {id:'sc-interference',  sec:'engines', name:'Wave Interference',     engine:'interference',         pal:'aurora',  seed:202},
  {id:'sc-growth',        sec:'engines', name:'Differential Growth',   engine:'growth',               pal:'botanic', seed:303},
  {id:'sc-lissajous',     sec:'engines', name:'Lissajous Mesh',        engine:'lissajous',            pal:'neon',    seed:404},
  {id:'sc-gravitywells',  sec:'engines', name:'Gravity Wells',         engine:'gravity_wells',        pal:'ember',   seed:505},
  {id:'sc-boidflocking',  sec:'engines', name:'Boid Flocking',         engine:'boid_flocking',        pal:'ocean',   seed:606},
  {id:'sc-magneticfield', sec:'engines', name:'Magnetic Field Lines',  engine:'magnetic_field',       pal:'aurora',  seed:707},
  {id:'sc-reaction',      sec:'engines', name:'Reaction-Diffusion',    engine:'reaction_diffusion',   pal:'void',    seed:6666},
  {id:'sc-sanddrift',     sec:'engines', name:'Sand Drift',            engine:'sand_drift',           pal:'earth',   seed:808},
  {id:'sc-voronoi',       sec:'engines', name:'Voronoi Diagram',       engine:'voronoi',              pal:'ocean',   seed:5678},
  {id:'sc-truchet',       sec:'engines', name:'Truchet Tiles',         engine:'truchet',              pal:'ink',     seed:2345},
  {id:'sc-penrose',       sec:'engines', name:'Penrose Tiling',        engine:'penrose',              pal:'ghost',   seed:909},
  {id:'sc-spirograph',    sec:'engines', name:'Spirograph',            engine:'spirograph',           pal:'neon',    seed:3333},
  {id:'sc-apollonian',    sec:'engines', name:'Apollonian Gasket',     engine:'apollonian',           pal:'void',    seed:1010},
  {id:'sc-spacefilling',  sec:'engines', name:'Space-Filling Curve',   engine:'space_filling',        pal:'ember',   seed:1110},
  {id:'sc-lsystem',       sec:'engines', name:'L-System Plants',       engine:'lsystem',              pal:'botanic', seed:6789},
  {id:'sc-domainwarp',    sec:'engines', name:'Domain Warp',           engine:'domain_warp',          pal:'ember',   seed:4321},
  {id:'sc-curl',          sec:'engines', name:'Curl Noise',            engine:'curl_noise',           pal:'aurora',  seed:9012},
  {id:'sc-ridgedfractal', sec:'engines', name:'Ridged Multifractal',   engine:'ridged_fractal',       pal:'rust',    seed:1210},
  {id:'sc-marblewood',    sec:'engines', name:'Marble / Wood',         engine:'marble_wood',          pal:'earth',   seed:1310},
  {id:'sc-gameoflife',    sec:'engines', name:'Game of Life',          engine:'game_of_life',         pal:'botanic', seed:1410},
  {id:'sc-langtonsant',   sec:'engines', name:"Langton's Ant",         engine:'langtons_ant',         pal:'neon',    seed:1510},
  {id:'sc-cavemap',       sec:'engines', name:'Cave / Dungeon Map',    engine:'cave_map',             pal:'earth',   seed:1610},
  {id:'sc-crystalgrowth', sec:'engines', name:'Crystal Growth (DLA)',  engine:'crystal_growth',       pal:'aurora',  seed:1710},
  {id:'sc-forcegraph',    sec:'engines', name:'Force-Directed Graph',  engine:'force_graph',          pal:'ocean',   seed:1810},
  {id:'sc-mst',           sec:'engines', name:'Minimum Spanning Tree', engine:'mst',                  pal:'botanic', seed:1910},
  {id:'sc-delaunay',      sec:'engines', name:'Delaunay Triangulation',engine:'delaunay',             pal:'ocean',   seed:4444},
  {id:'sc-julia',         sec:'engines', name:'Julia / Mandelbrot',    engine:'julia_set',            pal:'neon',    seed:7890},
  {id:'sc-newtonfractal', sec:'engines', name:"Newton's Fractal",      engine:'newton_fractal',       pal:'aurora',  seed:2010},
  {id:'sc-ifs',           sec:'engines', name:'IFS / Barnsley',        engine:'ifs',                  pal:'botanic', seed:2020},
  {id:'sc-flame',         sec:'engines', name:'Flame Fractal',         engine:'flame_fractal',        pal:'ember',   seed:2222},
  {id:'sc-contourmap',    sec:'engines', name:'Contour / Isoline Map', engine:'contour_map',          pal:'ocean',   seed:2030},
  {id:'sc-chladni',       sec:'engines', name:'Chladni Figures',       engine:'chladni',              pal:'ghost',   seed:8765},
  {id:'sc-weaveknot',     sec:'engines', name:'Weave / Knot Diagram',  engine:'weave_knot',           pal:'ember',   seed:2040},
  {id:'sc-mobiustorus',   sec:'engines', name:'Möbius / Torus',        engine:'mobius_torus',         pal:'neon',    seed:2050, experimental:'topology-hires'},
  {id:'sc-oscilloscope',  sec:'engines', name:'Oscilloscope',          engine:'oscilloscope',         pal:'aurora',  seed:2060},
  {id:'sc-asciidensity',  sec:'engines', name:'ASCII Density Map',     engine:'ascii_density',        pal:'void',    seed:2070},
  {id:'sc-wfc',           sec:'engines', name:'Waveform Collapse',     engine:'wfc',                  pal:'earth',   seed:2080},
  {id:'sc-physarum',      sec:'engines', name:'Physarum / Slime Mold', engine:'physarum',             pal:'botanic', seed:3456},
  {id:'sc-spacecolonize', sec:'engines', name:'Space Colonization',    engine:'space_colonization',   pal:'botanic', seed:2090},
  {id:'sc-reactionb',     sec:'engines', name:'Reaction-Diff (Organic)',engine:'reaction_diffusion_b',pal:'ocean',   seed:2095},
  {id:'sc-hydraulic',     sec:'engines', name:'Hydraulic Erosion',     engine:'hydraulic_erosion',    pal:'earth',   seed:2098},
  {id:'sc-cellgrowth',    sec:'engines', name:'Cell / Tissue Growth',  engine:'cell_growth',          pal:'aurora',  seed:2099},
  {id:'sc-watercolor',    sec:'engines', name:'Watercolor',            engine:'watercolor',           pal:'earth',   seed:1111},
  {id:'sc-diatom',        sec:'engines', name:'Diatom / Biomorph',     engine:'diatom',               pal:'ocean',   seed:2085},
  {id:'sc-fungal',        sec:'engines', name:'Fungal Network',        engine:'fungal_network',       pal:'earth',   seed:5555},

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

  /* ── Happy Hallucinations (8) ── */
  {id:'sc-hh-ember',    sec:'hh', name:'Ember Storm',       engine:'flowfield',          pal:'ember',  seed:2200, hh:{strategy:'scatter',       tools:['brush','line','rect'],        count:60, alpha:0.6}},
  {id:'sc-hh-neon',     sec:'hh', name:'Neon Pulse',        engine:'julia_set',          pal:'neon',   seed:2300, hh:{strategy:'radial',        tools:['ellipse','brush','triangle'], count:50, alpha:0.55}},
  {id:'sc-hh-aurora',   sec:'hh', name:'Aurora Drift',      engine:'curl_noise',         pal:'aurora', seed:2400, hh:{strategy:'flow',          tools:['pencil','line','brush'],      count:70, alpha:0.5}},
  {id:'sc-hh-crystal',  sec:'hh', name:'Crystal Weave',     engine:'delaunay',           pal:'void',   seed:2500, hh:{strategy:'constellation', tools:['line','triangle'],            count:55, alpha:0.65}},
  {id:'sc-hh-ocean',    sec:'hh', name:'Ocean Dream',       engine:'interference',       pal:'ocean',  seed:2510, hh:{strategy:'flow',          tools:['ellipse','brush','pencil'],   count:45, alpha:0.5}},
  {id:'sc-hh-grid',     sec:'hh', name:'Grid Construct',    engine:'truchet',            pal:'ink',    seed:2520, hh:{strategy:'grid',          tools:['rect','line','triangle'],     count:65, alpha:0.55}},
  {id:'sc-hh-burst',    sec:'hh', name:'Cosmic Burst',      engine:'attractor',          pal:'neon',   seed:2530, hh:{strategy:'burst',         tools:['brush','line','ellipse'],     count:80, alpha:0.5}},
  {id:'sc-hh-crosshatch',sec:'hh',name:'Crosshatch Growth', engine:'growth',             pal:'earth',  seed:2540, hh:{strategy:'crosshatch',    tools:['pencil','line'],              count:90, alpha:0.45}},

  /* ── Multi-Pass Blend (6) ── */
  {id:'sc-mp-screen5',   sec:'multipass', name:'5-Pass Screen',       engine:'curl_noise',          pal:'ember',   seed:2600, multipass:{passes:5,  blend:'screen',     decay:0.7}},
  {id:'sc-mp-overlay8',  sec:'multipass', name:'8-Pass Overlay',      engine:'flowfield',           pal:'aurora',  seed:2700, multipass:{passes:8,  blend:'overlay',    decay:0.8}},
  {id:'sc-mp-screen6',   sec:'multipass', name:'6-Pass Luminous',     engine:'reaction_diffusion_b',pal:'ocean',   seed:2800, multipass:{passes:6,  blend:'screen',     decay:0.75}},
  {id:'sc-mp-over10',    sec:'multipass', name:'10-Pass Deep',        engine:'physarum',            pal:'neon',    seed:2900, multipass:{passes:10, blend:'overlay',    decay:0.85}},
  {id:'sc-mp-softlight', sec:'multipass', name:'Soft Light Layers',   engine:'watercolor',          pal:'earth',   seed:2910, multipass:{passes:4,  blend:'soft-light', decay:0.6}},
  {id:'sc-mp-multiply',  sec:'multipass', name:'Multiply Fractal',    engine:'flame_fractal',       pal:'rust',    seed:2920, multipass:{passes:6,  blend:'multiply',   decay:0.65}},

  /* ── Experimental Tools (10) ── */
  {id:'sc-exp-morph',    sec:'experimental', name:'Morphogenesis',       engine:'reaction_diffusion', pal:'botanic', seed:3000, experimental:'morphogenesis'},
  {id:'sc-exp-morph2',   sec:'experimental', name:'Phyllotaxis Spirals', engine:'spirograph',         pal:'aurora',  seed:3010, experimental:'morphogenesis-phyllotaxis'},
  {id:'sc-exp-orgf',     sec:'experimental', name:'Organic Metaballs',   engine:'domain_warp',        pal:'aurora',  seed:3100, experimental:'organic-forms'},
  {id:'sc-exp-orgf2',    sec:'experimental', name:'Organic Radiolaria',  engine:'diatom',             pal:'ocean',   seed:3110, experimental:'organic-forms-radiolaria'},
  {id:'sc-exp-topo',     sec:'experimental', name:'Topology Torus',      engine:'mobius_torus',       pal:'neon',    seed:3200, experimental:'topology'},
  {id:'sc-exp-topo2',    sec:'experimental', name:'Topology Klein',      engine:'lissajous',          pal:'aurora',  seed:3210, experimental:'topology-klein'},
  {id:'sc-exp-prob',     sec:'experimental', name:'Probability Paint',   engine:'flowfield',          pal:'ember',   seed:3300, experimental:'probability'},
  {id:'sc-exp-memory',   sec:'experimental', name:'Memory Drawing',      engine:'watercolor',         pal:'earth',   seed:3400, experimental:'memory'},
  {id:'sc-exp-leo',      sec:'experimental', name:'LEO da Vinci',        engine:'lsystem',            pal:'ink',     seed:3500, experimental:'leo'},
  {id:'sc-exp-leo2',     sec:'experimental', name:'LEO Mechanical',      engine:'spirograph',         pal:'ghost',   seed:3510, experimental:'leo-mechanical'},

  /* ── Chromatic Physics (5) — own section ── */
  {id:'sc-chrp-film',    sec:'chrp', name:'Thin-Film Interference', engine:'domain_warp',    pal:'aurora',  seed:4001, experimental:'chrp-film'},
  {id:'sc-chrp-scatter', sec:'chrp', name:'Light Scattering',       engine:'flowfield',      pal:'ember',   seed:4002, experimental:'chrp-scatter'},
  {id:'sc-chrp-mix',     sec:'chrp', name:'Subtractive Pigment',    engine:'watercolor',     pal:'earth',   seed:4003, experimental:'chrp-mix'},
  {id:'sc-chrp-field',   sec:'chrp', name:'Chromatic Fields',       engine:'curl_noise',     pal:'neon',    seed:4004, experimental:'chrp-field'},
  {id:'sc-chrp-prism',   sec:'chrp', name:'Spectral Dispersion',    engine:'interference',   pal:'aurora',  seed:4005, experimental:'chrp-prism'},

  /* ── 3D Objects (6) — own section ── */
  {id:'sc-td-torus',     sec:'td3d', name:'Torus',              engine:'flowfield',   pal:'ember',   seed:5001, experimental:'td3d-torus'},
  {id:'sc-td-torusknot', sec:'td3d', name:'Torus Knot',         engine:'curl_noise',  pal:'neon',    seed:5002, experimental:'td3d-torusknot'},
  {id:'sc-td-icosa',     sec:'td3d', name:'Icosahedron',        engine:'voronoi',     pal:'aurora',  seed:5003, experimental:'td3d-icosa'},
  {id:'sc-td-sphere',    sec:'td3d', name:'Sphere',             engine:'domain_warp', pal:'ocean',   seed:5004, experimental:'td3d-sphere'},
  {id:'sc-td-mobius',    sec:'td3d', name:'Möbius Strip',       engine:'interference',pal:'ghost',   seed:5005, experimental:'td3d-mobius'},
  {id:'sc-td-superell',  sec:'td3d', name:'Superellipsoid',     engine:'attractor',   pal:'ember',   seed:5006, experimental:'td3d-superell'}
];

/* ── State ── */
var THUMB_SZ   = 150;
var PREVIEW_SZ = 400;   // medium-res cached snapshots for instant ICW display
var _thumbCache = {};    // id -> dataURL (150×150 JPEG for panel thumbnails)
var _previewCache = {};  // id -> dataURL (400×400 JPEG for instant ICW preview)
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
  window._showcaseBatchRunning = true;
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
    window._showcaseBatchRunning = false;
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
  renderSingleItem(item, function(thumbDataUrl, previewDataUrl){
    _thumbCache[item.id] = thumbDataUrl;
    _previewCache[item.id] = previewDataUrl;

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

    /* Yield to browser for repaint, then next */
    requestAnimationFrame(function(){ setTimeout(renderNextItem, 60); });
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

  /* Multi-pass blend — cap at 3 passes for thumbnails to avoid UI freeze */
  if(item.multipass){
    var mp = item.multipass;
    var thumbPasses = Math.min(mp.passes, 3);
    for(var pi=1; pi<thumbPasses; pi++){
      if(window.seed) window.seed(item.seed + pi*137);
      ctx.globalCompositeOperation = mp.blend;
      ctx.globalAlpha = Math.pow(mp.decay, pi);
      try { window.ENGINES[item.engine](W, H, p); } catch(e){}
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /* HH drawing overlay — cap at 25 marks for thumbnails */
  if(item.hh){
    var thumbHH = {strategy:item.hh.strategy, tools:item.hh.tools, count:Math.min(item.hh.count||40, 25), alpha:item.hh.alpha||0.5};
    drawHHOverlay(W, H, p, thumbHH);
  }

  /* Experimental — most tools need interactive activation which we
     can't batch, BUT some can be rendered directly and synchronously */

  /* Chromatic Physics */
  if(item.experimental && item.experimental.indexOf('chrp-') === 0 && window._CHRP && window._CHRP.renderDirect){
    var chrpMap = {'chrp-film':0,'chrp-scatter':1,'chrp-mix':2,'chrp-field':3,'chrp-prism':4};
    var chrpIdx = chrpMap[item.experimental];
    if(chrpIdx !== undefined){
      try {
        window._CHRP.renderDirect(chrpIdx, ctx, W, H, p.c);
      } catch(e){
        console.warn('Showcase: Chromatic Physics ' + item.experimental + ' failed:', e.message);
      }
    }
  }

  /* Topology — high-res anti-aliased render (torus shape=1) */
  if(item.experimental && item.experimental.indexOf('topology') === 0 && window._TOPO && window._TOPO.renderDirect){
    var topoSliders = {resolution:200, zoom:55, lighting:85, wireframe:15, deform:0, twist:0, tube:50, rotation:40};
    var topoShape = 1; /* torus */
    if(item.experimental === 'topology-klein'){ topoShape = 3; topoSliders.wireframe = 20; topoSliders.deform = 10; topoSliders.zoom = 50; topoSliders.lighting = 80; }
    else if(item.experimental === 'topology-hires'){ topoShape = 1; /* torus, same hi-res settings */ }
    try {
      window._TOPO.renderDirect(ctx, W, H, topoShape, topoSliders);
    } catch(e){
      console.warn('Showcase: Topology ' + item.experimental + ' failed:', e.message);
    }
  }

  /* 3D Objects */
  if(item.experimental && item.experimental.indexOf('td3d-') === 0 && window._TD && window._TD.renderDirect){
    var td3dMap = {'td3d-sphere':0,'td3d-cube':1,'td3d-cylinder':2,'td3d-cone':3,'td3d-torus':4,
                   'td3d-icosa':5,'td3d-octa':6,'td3d-capsule':7,'td3d-torusknot':8,
                   'td3d-superell':9,'td3d-spring':10,'td3d-mobius':11};
    var td3dIdx = td3dMap[item.experimental];
    if(td3dIdx !== undefined){
      var tdSliders = {resolution:60,zoom:55,rotx:15,roty:12,rotz:0,light:25,specular:50,wireframe:0,ambient:30};
      try {
        window._TD.renderDirect(ctx, W, H, td3dIdx, tdSliders);
      } catch(e){
        console.warn('Showcase: 3D ' + item.experimental + ' failed:', e.message);
      }
    }
  }

  /* ── Snapshot composite → thumbnail + medium-res preview ── */

  /* Helper: composite all layers onto a target canvas at given size */
  function compositeSnapshot(sz){
    var c = document.createElement('canvas');
    c.width = sz; c.height = sz;
    var t = c.getContext('2d');
    t.imageSmoothingEnabled = true;
    t.imageSmoothingQuality = 'high';
    t.drawImage(cv, 0, 0, sz, sz);
    t.globalCompositeOperation = 'screen';
    t.drawImage(lv, 0, 0, sz, sz);
    t.globalCompositeOperation = 'source-over';
    t.drawImage(dv, 0, 0, sz, sz);
    t.drawImage(av, 0, 0, sz, sz);
    return c;
  }

  var thumbCanvas   = compositeSnapshot(THUMB_SZ);
  var previewCanvas = compositeSnapshot(PREVIEW_SZ);

  callback(
    thumbCanvas.toDataURL('image/jpeg', 0.85),
    previewCanvas.toDataURL('image/jpeg', 0.88)
  );
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
  var count = hh.count || (30 + Math.floor(Math.random()*20));
  var baseAlpha = hh.alpha || 0.5;
  var dc = window.dctx || dv.getContext('2d');

  for(var i=0; i<count; i++){
    dc.globalAlpha = baseAlpha * (0.5 + Math.random()*0.5);
    dc.strokeStyle = cols[i % cols.length];
    dc.fillStyle = cols[i % cols.length];
    dc.lineWidth = 1 + Math.random()*4;

    var x = Math.random()*W, y = Math.random()*H;

    /* Position by strategy */
    if(hh.strategy === 'radial'){
      var ang = (i/count)*Math.PI*2 + Math.random()*0.3;
      var r = W*0.08 + Math.random()*W*0.35;
      x = W/2 + Math.cos(ang)*r;
      y = H/2 + Math.sin(ang)*r;
    } else if(hh.strategy === 'flow'){
      x = (i/count)*W + Math.random()*20-10;
      y = H/2 + Math.sin(i*0.4)*H*0.3 + Math.cos(i*0.15)*H*0.1;
    } else if(hh.strategy === 'constellation'){
      dc.lineWidth = 0.5 + Math.random()*2;
      dc.beginPath();
      var cx1=Math.random()*W, cy1=Math.random()*H, cx2=Math.random()*W, cy2=Math.random()*H;
      dc.moveTo(cx1, cy1);
      dc.lineTo(cx2, cy2);
      dc.stroke();
      /* Draw star dots at endpoints */
      dc.globalAlpha = baseAlpha * 0.8;
      dc.beginPath(); dc.arc(cx1,cy1,2+Math.random()*3,0,Math.PI*2); dc.fill();
      dc.beginPath(); dc.arc(cx2,cy2,2+Math.random()*3,0,Math.PI*2); dc.fill();
      continue;
    } else if(hh.strategy === 'grid'){
      var cols_g = 6 + Math.floor(Math.random()*4);
      var rows_g = 6 + Math.floor(Math.random()*4);
      x = (i % cols_g) * (W/cols_g) + W/(cols_g*2) + Math.random()*20-10;
      y = Math.floor(i/cols_g) * (H/rows_g) + H/(rows_g*2) + Math.random()*20-10;
    } else if(hh.strategy === 'burst'){
      var bAng = Math.random()*Math.PI*2;
      var bDist = Math.random()*Math.random()*W*0.45;
      x = W/2 + Math.cos(bAng)*bDist;
      y = H/2 + Math.sin(bAng)*bDist;
    } else if(hh.strategy === 'crosshatch'){
      /* Diagonal hatching pattern */
      var hAng = (i%2===0) ? Math.PI*0.25 : Math.PI*-0.25;
      var hLen = 30 + Math.random()*60;
      dc.lineWidth = 0.5 + Math.random()*1.5;
      dc.beginPath();
      dc.moveTo(x, y);
      dc.lineTo(x+Math.cos(hAng)*hLen, y+Math.sin(hAng)*hLen);
      dc.stroke();
      continue;
    }
    /* scatter = default random position — already set */

    var tool = hh.tools[i % hh.tools.length];
    if(tool === 'brush'){
      dc.beginPath();
      dc.arc(x, y, 4+Math.random()*12, 0, Math.PI*2);
      dc.fill();
      /* Add smaller satellite dots */
      if(Math.random()>0.5){ dc.globalAlpha *= 0.5; dc.beginPath(); dc.arc(x+Math.random()*16-8, y+Math.random()*16-8, 2+Math.random()*4, 0, Math.PI*2); dc.fill(); }
    } else if(tool === 'pencil'){
      dc.lineWidth = 0.5 + Math.random()*1.5;
      dc.beginPath();
      dc.moveTo(x, y);
      for(var p=0; p<4; p++){ x+=Math.random()*30-15; y+=Math.random()*30-15; dc.lineTo(x,y); }
      dc.stroke();
    } else if(tool === 'line'){
      dc.beginPath();
      dc.moveTo(x, y);
      dc.lineTo(x+Math.random()*120-60, y+Math.random()*120-60);
      dc.stroke();
    } else if(tool === 'rect'){
      var rw=10+Math.random()*40, rh=10+Math.random()*40;
      if(Math.random()>0.5) dc.fillRect(x,y,rw,rh);
      else dc.strokeRect(x,y,rw,rh);
    } else if(tool === 'ellipse'){
      dc.beginPath();
      var ex=5+Math.random()*20, ey=5+Math.random()*20;
      try { dc.ellipse(x, y, ex, ey, Math.random()*Math.PI, 0, Math.PI*2); } catch(e){ dc.arc(x,y,ex,0,Math.PI*2); }
      if(Math.random()>0.4) dc.fill(); else dc.stroke();
    } else if(tool === 'triangle'){
      var s = 10+Math.random()*25;
      dc.beginPath();
      dc.moveTo(x, y-s);
      dc.lineTo(x-s*0.87, y+s*0.5);
      dc.lineTo(x+s*0.87, y+s*0.5);
      dc.closePath();
      if(Math.random()>0.5) dc.fill(); else dc.stroke();
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
/* ══════════════════════════════════════════════════════════
   HIGHLIGHT MAIN MENU — show which feature/engine/tool was used
   ══════════════════════════════════════════════════════════ */
function highlightMainMenu(item){
  /* Helper: ensure a section is open */
  function openSection(toggleId, bodyId){
    var btn = document.getElementById(toggleId);
    var body = document.getElementById(bodyId);
    if(btn && body && !body.classList.contains('open')){
      btn.click();
    }
  }

  /* Helper: blink-highlight an element (same style & duration as help system) */
  var _scHlTimer = null;
  var _scHlInterval = null;
  function flashHighlight(el){
    if(!el) return;
    /* Clear any previous showcase highlight */
    if(_scHlTimer) clearTimeout(_scHlTimer);
    if(_scHlInterval) clearInterval(_scHlInterval);
    el.scrollIntoView({behavior:'smooth', block:'nearest'});
    var origOutline = el.style.outline;
    var origShadow = el.style.boxShadow;
    var on = true;
    function setOn(){ el.style.outline = '3px solid #E8F50A'; el.style.boxShadow = '0 0 18px 4px rgba(232,245,10,0.5)'; }
    function setOff(){ el.style.outline = origOutline; el.style.boxShadow = origShadow; }
    setOn();
    _scHlInterval = setInterval(function(){
      on = !on;
      if(on) setOn(); else setOff();
    }, 350);
    _scHlTimer = setTimeout(function(){
      clearInterval(_scHlInterval);
      _scHlInterval = null;
      setOff();
    }, 3000);
  }

  var sec = item.sec;

  /* ── Engines ── */
  if(sec === 'engines' || (!item.experimental && !item.hh && !item.multipass && !item.humanize && !item.naturalize)){
    openSection('eng-toggle', 'eng-body');

    /* Find the engine button */
    var engBtn = document.querySelector('.eng[data-e="' + item.engine + '"]');
    if(engBtn){
      /* If in the "More Engines" collapsed list, expand it */
      var moreList = document.getElementById('more-engines-list');
      var moreBtn = document.getElementById('more-engines-btn');
      if(moreList && engBtn.closest('#more-engines-list') && moreList.style.display !== 'block'){
        if(moreBtn) moreBtn.click();
      }
      /* Show current-engine label for engines in more-list */
      var lbl = document.getElementById('eng-current-label');
      var nm = document.getElementById('eng-current-name');
      if(lbl && nm && engBtn.closest('#more-engines-list')){
        lbl.style.display = 'block';
        nm.textContent = engBtn.textContent.replace(/^\d+\s*[\u2014\-]\s*/, '');
      }
      flashHighlight(engBtn);
    }
  }

  /* ── Lighting ── */
  if(sec === 'lighting' || item.ls){
    var ltool = document.getElementById('ltool');
    if(ltool) flashHighlight(ltool);
  }

  /* ── Atmosphere ── */
  if(sec === 'atmosphere' || item.as){
    var atool = document.getElementById('atool');
    if(atool) flashHighlight(atool);
  }

  /* ── Humanize ── */
  if(sec === 'humanize' || item.humanize){
    /* Humanize is applied via engine, highlight engine + the section concept */
    openSection('eng-toggle', 'eng-body');
    var hEngBtn = document.querySelector('.eng[data-e="' + item.engine + '"]');
    if(hEngBtn) flashHighlight(hEngBtn);
  }

  /* ── Naturalize ── */
  if(sec === 'naturalize' || item.naturalize){
    var natToggle = document.getElementById('nat-toggle');
    if(natToggle) flashHighlight(natToggle);
  }

  /* ── Happy Hallucinations ── */
  if(sec === 'hh' || item.hh){
    var hhBtn = document.getElementById('hh-btn');
    if(hhBtn) flashHighlight(hhBtn);
  }

  /* ── Multi-Pass Blend ── */
  if(sec === 'multipass' || item.multipass){
    var mpBtn = document.getElementById('hh-multi-btn');
    if(mpBtn) flashHighlight(mpBtn);
  }

  /* ── Experimental Tools ── */
  if(sec === 'experimental' || item.experimental){
    openSection('exp-toggle', 'exp-body');

    /* Try to highlight the specific experimental sub-toggle */
    var expType = item.experimental || '';
    var subToggle = null;
    if(expType.indexOf('morpho') !== -1 || expType.indexOf('phyto') !== -1 || expType.indexOf('phyll') !== -1){
      /* Morphogenesis lives under intent sculpting area or has its own section */
    }
    if(expType.indexOf('topology') !== -1){
      subToggle = document.querySelector('[id*="topo"]');
    }
    if(expType.indexOf('organic') !== -1 || expType.indexOf('radiolaria') !== -1){
      subToggle = document.querySelector('[id*="orgf"]') || document.querySelector('[id*="organic"]');
    }
    if(expType.indexOf('probability') !== -1){
      subToggle = document.querySelector('[id*="prob"]') || document.querySelector('[id*="pp"]');
    }
    if(expType.indexOf('memory') !== -1){
      subToggle = document.querySelector('[id*="mbd"]') || document.querySelector('[id*="memory"]');
    }
    if(expType.indexOf('leo') !== -1){
      subToggle = document.querySelector('[id*="leo"]');
    }
    /* Flash the exp-toggle header itself as fallback */
    var expToggle = document.getElementById('exp-toggle');
    if(expToggle) flashHighlight(expToggle);
  }
}

/* ── Rendering notification popup ── */
function showRenderingNotification(name){
  hideRenderingNotification();
  var n = document.createElement('div');
  n.id = 'showcase-render-notify';
  n.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;'
    + 'background:rgba(6,6,6,0.88);border:1px solid rgba(129,55,73,0.6);border-radius:10px;'
    + 'padding:18px 32px;color:#ffffff;font-family:sans-serif;font-size:14px;letter-spacing:.04em;'
    + 'text-align:center;pointer-events:none;box-shadow:0 4px 24px rgba(0,0,0,0.5);'
    + 'animation:sc-notify-in .25s ease-out;';
  n.innerHTML = '<div style="margin-bottom:8px;font-size:18px;">⏳</div>'
    + '<div style="font-weight:600;">Image Rendering\u2026</div>'
    + '<div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:4px;">' + name + '</div>';
  document.body.appendChild(n);

  /* Inject animation keyframes if not already present */
  if(!document.getElementById('sc-notify-style')){
    var s = document.createElement('style');
    s.id = 'sc-notify-style';
    s.textContent = '@keyframes sc-notify-in{from{opacity:0;transform:translate(-50%,-50%) scale(0.9);}to{opacity:1;transform:translate(-50%,-50%) scale(1);}}'
      + '@keyframes sc-notify-out{from{opacity:1;transform:translate(-50%,-50%) scale(1);}to{opacity:0;transform:translate(-50%,-50%) scale(0.95);}}';
    document.head.appendChild(s);
  }
}

function hideRenderingNotification(){
  var n = document.getElementById('showcase-render-notify');
  if(!n) return;
  n.style.animation = 'sc-notify-out .2s ease-in forwards';
  setTimeout(function(){ if(n.parentNode) n.parentNode.removeChild(n); }, 220);
}

function applyShowcaseItem(item){
  /* Panel stays open — do NOT close */
  var W = cv.width, H = cv.height;
  var isReplace = (_renderMode === 'replace');

  /* Push undo state */
  if(window.genUndoPush) window.genUndoPush();

  /* ── Set engine, palette, seed into UI so CREATE works for full-res ── */
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

  /* Update engine/seed display */
  document.getElementById('se').textContent = window.ENAMES[item.engine] || item.engine;
  document.getElementById('ss').textContent = item.seed;

  highlightMainMenu(item);

  /* ══════════════════════════════════════════════════════════
     INSTANT PREVIEW PATH — Use cached 400×400 snapshot if available
     Draws the cached preview onto the ICW immediately (< 5ms).
     The engine/palette/seed are loaded into the UI, so pressing
     CREATE will produce a full-resolution render from scratch.
     ══════════════════════════════════════════════════════════ */
  var cachedPreview = _previewCache[item.id];

  if(cachedPreview){
    /* Instant draw from cache — no engine render needed.
       The cached JPEG already includes all effects (LS, AS, humanize, etc.)
       baked in, so we must NOT re-apply renderLighting/renderAtmosphere
       or the effects will be doubled.  The cache was rendered on white bg,
       so we match that here. */
    var previewImg = new Image();
    previewImg.onload = function(){
      if(isReplace){
        /* Match the white bg used during batch render */
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0,0,W,H);
      }
      /* Draw cached preview onto main canvas, upscaled with smoothing */
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(previewImg, 0, 0, W, H);

      /* Do NOT re-apply renderLighting/renderAtmosphere — effects are
         already baked into the cached JPEG from the batch render.
         LS/AS settings are loaded into the UI (lines 921-934 above)
         so pressing CREATE will produce a correct full-res render. */

      if(typeof window._histPush === 'function') window._histPush();

      /* Show instant feedback */
      if(window.setI) window.setI('Showcase: ' + item.name + ' \u2014 preview loaded instantly. Press CREATE for full resolution.');
      if(typeof window.updateGlobalUndoBtns === 'function') window.updateGlobalUndoBtns();
    };
    previewImg.src = cachedPreview;
    return;
  }

  /* ══════════════════════════════════════════════════════════
     FALLBACK — No cached preview available (e.g. batch render
     didn't finish). Do full engine render as before.
     ══════════════════════════════════════════════════════════ */
  if(window.setI) window.setI('Showcase: rendering ' + item.name + ' (' + _renderMode + ')\u2026');
  showRenderingNotification(item.name);

  setTimeout(function(){
    var p = window.gpal ? window.gpal() : {bg:'#000000',c:['#ff4040']};

    /* In replace mode, fill bg first */
    if(isReplace){
      ctx.fillStyle = p.bg;
      ctx.fillRect(0,0,W,H);
    }

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
  hideRenderingNotification();
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

/* ── Set topology slider value ── */
function setTopoSlider(id, val){
  var el = document.getElementById(id);
  if(el){ el.value = val; el.dispatchEvent(new Event('input')); }
}

function triggerExperimental(type){
  if(type==='morphogenesis' && window._MORPH && window._MORPH.render){
    window._MORPH.render();
  } else if(type==='morphogenesis-phyllotaxis' && window._MORPH){
    /* Select phyllotaxis system (index 1) then render */
    if(window._MORPH.selectSystem) window._MORPH.selectSystem(1);
    else if(window._MORPH.render) window._MORPH.render();
  } else if(type==='organic-forms' && window._ORGF && window._ORGF.render){
    window._ORGF.render();
  } else if(type==='organic-forms-radiolaria' && window._ORGF){
    /* Select radiolaria system (index 4) then render */
    if(window._ORGF.selectSystem) window._ORGF.selectSystem(4);
    else if(window._ORGF.render) window._ORGF.render();
  } else if((type==='topology' || type==='topology-hires') && window._TOPO && window._TOPO.render){
    /* Select Torus (index 1), high-res anti-aliased with max resolution */
    if(window._TOPO.selectShape) window._TOPO.selectShape(1);
    setTopoSlider('topo-resolution', 200);
    setTopoSlider('topo-zoom', 55);
    setTopoSlider('topo-lighting', 85);
    setTopoSlider('topo-wireframe', 15);
    setTopoSlider('topo-deform', 0);
    setTopoSlider('topo-twist', 0);
    setTopoSlider('topo-tube', 50);
    setTopoSlider('topo-rotation', 40);
    window._TOPO.render();
  } else if(type==='topology-klein' && window._TOPO){
    /* Select Klein Bottle (index 3), high-res */
    if(window._TOPO.selectShape) window._TOPO.selectShape(3);
    setTopoSlider('topo-resolution', 200);
    setTopoSlider('topo-zoom', 50);
    setTopoSlider('topo-lighting', 80);
    setTopoSlider('topo-wireframe', 20);
    setTopoSlider('topo-deform', 10);
    window._TOPO.render();
  } else if(type==='probability' && window._PP){
    if(window._PP.reseed) window._PP.reseed();
    else if(window._PP.toggle) window._PP.toggle();
  } else if(type==='memory' && window._MBD && window._MBD.render){
    window._MBD.render();
  } else if(type==='leo' && window._LEO && window._LEO.render){
    window._LEO.render();
  } else if(type==='leo-mechanical' && window._LEO){
    /* Select mechanical mode (index 3) then render */
    if(window._LEO.selectSystem) window._LEO.selectSystem(3);
    else if(window._LEO.render) window._LEO.render();
  /* ── Chromatic Physics ── */
  } else if(type==='chrp-film' && window._CHRP){
    if(window._CHRP.selectSystem) window._CHRP.selectSystem(0);
    else if(window._CHRP.render) window._CHRP.render();
  } else if(type==='chrp-scatter' && window._CHRP){
    if(window._CHRP.selectSystem) window._CHRP.selectSystem(1);
    else if(window._CHRP.render) window._CHRP.render();
  } else if(type==='chrp-mix' && window._CHRP){
    if(window._CHRP.selectSystem) window._CHRP.selectSystem(2);
    else if(window._CHRP.render) window._CHRP.render();
  } else if(type==='chrp-field' && window._CHRP){
    if(window._CHRP.selectSystem) window._CHRP.selectSystem(3);
    else if(window._CHRP.render) window._CHRP.render();
  } else if(type==='chrp-prism' && window._CHRP){
    if(window._CHRP.selectSystem) window._CHRP.selectSystem(4);
    else if(window._CHRP.render) window._CHRP.render();
  /* ── 3D Objects ── */
  } else if(type.indexOf('td3d-') === 0 && window._TD){
    var td3dTrigMap = {'td3d-sphere':0,'td3d-cube':1,'td3d-cylinder':2,'td3d-cone':3,'td3d-torus':4,
                       'td3d-icosa':5,'td3d-octa':6,'td3d-capsule':7,'td3d-torusknot':8,
                       'td3d-superell':9,'td3d-spring':10,'td3d-mobius':11};
    var tdIdx = td3dTrigMap[type];
    if(tdIdx !== undefined && window._TD.selectShape) window._TD.selectShape(tdIdx);
    /* Set high-res sliders for ICW render */
    setTopoSlider('td-resolution', 80);
    setTopoSlider('td-zoom', 55);
    setTopoSlider('td-rotx', 15);
    setTopoSlider('td-roty', 12);
    setTopoSlider('td-light', 25);
    setTopoSlider('td-specular', 50);
    setTopoSlider('td-wireframe', 0);
    setTopoSlider('td-ambient', 30);
    if(window._TD.render) window._TD.render();
  }
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
  if(window.bringToFront) window.bringToFront('showcase-panel');
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
