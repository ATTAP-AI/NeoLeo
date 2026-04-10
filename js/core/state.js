/*  js/core/state.js  — Shared application state (canvas refs, palettes, upload state)
 *  Loaded via <script> tag. Everything exposed on window.* for
 *  backward-compat with the monolith.
 */

/* ── Canvas element references ──
   Use `var` (not const) so these live on `window.*` and can be
   temporarily swapped to offscreen canvases by the Showcase
   thumbnail renderer without affecting the visible canvas.       */
var uv=document.getElementById('uv'),uctx=uv.getContext('2d');
var cv=document.getElementById('cv'),ctx=cv.getContext('2d');
var lv=document.getElementById('lv'),lctx=lv.getContext('2d');
var dv=document.getElementById('dv'),dctx=dv.getContext('2d');
var av=document.getElementById('av'),actx=av.getContext('2d');

/* ── Upload state ── */
let uploadedImg=null,uploadedOp=1,uploadedMode='under',uploadedFit='contain',uploadedBlend='source-over',uploadedEngBlend='source-over',uploadedEngOp=0.8,uploadedEngOn=true;

/* ── Aspect-ratio state ── */
let _canvasRatio='square';
let _customW=750,_customH=750;

/* ── Canvas background ── */
let _canvasBg='#000000';

/* ── Palette definitions ── */
const PALS={ember:{bg:'#080403',c:['#ff6200','#e8130a','#ffa500','#ff3a00','#c0320a','#ffd04c']},ink:{bg:'#f4efe4',c:['#0d0a06','#2a1f0a','#503c14','#8c6c28','#c49840','#e4c880']},ocean:{bg:'#010810',c:['#0a4f6e','#1280a0','#00b8d9','#40d8f0','#a0eef8','#d8f8ff']},neon:{bg:'#04000c',c:['#ff00e0','#00ffff','#8800ff','#ff0066','#00ff88','#ffee00']},earth:{bg:'#100c08',c:['#3a2010','#6a4020','#9c6830','#c89048','#dbb870','#e8d8a0']},ghost:{bg:'#f0f0f0',c:['#d8d8d8','#b0b0b0','#888','#505050','#282828','#101010']},aurora:{bg:'#010a0e',c:['#003d30','#00c88a','#00e8ff','#8833ff','#ff22aa','#ffdd44']},void:{bg:'#000000',c:['#ffffff','#c0c0c0','#808080','#404040','#202020','#101010']},rust:{bg:'#0c0806',c:['#6b2400','#a03a10','#cc6020','#e09040','#cca060','#e8d0a0']},botanic:{bg:'#060d06',c:['#0a3a14','#1a6a28','#40a040','#80c048','#c0e048','#f0f4c0']}};

/* ── Palette helper ── */
const gpal=()=>{const p=JSON.parse(JSON.stringify(PALS[document.getElementById('pal').value]||PALS.ember));p.bg=_canvasBg;return p;};

/* ── Swatch renderer ── */
const drawSw=()=>{const p=gpal(),row=document.getElementById('swrow');row.innerHTML='';const bg=document.createElement('div');bg.className='sw';bg.style.cssText=`background:${p.bg};border:1px solid #444`;row.appendChild(bg);p.c.forEach(col=>{const s=document.createElement('div');s.className='sw';s.style.background=col;row.appendChild(s);});};

/* ── Expose on window ── */
window.uv=uv;  window.uctx=uctx;
window.cv=cv;  window.ctx=ctx;
window.lv=lv;  window.lctx=lctx;
window.dv=dv;  window.dctx=dctx;
window.av=av;  window.actx=actx;

window.uploadedImg=uploadedImg;
window.uploadedOp=uploadedOp;
window.uploadedMode=uploadedMode;
window.uploadedFit=uploadedFit;
window.uploadedBlend=uploadedBlend;
window.uploadedEngBlend=uploadedEngBlend;
window.uploadedEngOp=uploadedEngOp;
window.uploadedEngOn=uploadedEngOn;

/* Expose getters/setters for mutable upload state so other modules can
   read and write through window.* and the local lets stay in sync. */
Object.defineProperties(window, {
  uploadedImg:    { get(){ return uploadedImg; },    set(v){ uploadedImg=v; },    configurable:true },
  uploadedOp:     { get(){ return uploadedOp; },     set(v){ uploadedOp=v; },     configurable:true },
  uploadedMode:   { get(){ return uploadedMode; },   set(v){ uploadedMode=v; },   configurable:true },
  uploadedFit:    { get(){ return uploadedFit; },    set(v){ uploadedFit=v; },    configurable:true },
  uploadedBlend:  { get(){ return uploadedBlend; },  set(v){ uploadedBlend=v; },  configurable:true },
  uploadedEngBlend:{ get(){ return uploadedEngBlend;},set(v){ uploadedEngBlend=v;},configurable:true },
  uploadedEngOp:  { get(){ return uploadedEngOp; },  set(v){ uploadedEngOp=v; },  configurable:true },
  uploadedEngOn:  { get(){ return uploadedEngOn; },  set(v){ uploadedEngOn=v; },  configurable:true },
  _canvasRatio:   { get(){ return _canvasRatio; },   set(v){ _canvasRatio=v; },   configurable:true },
  _customW:       { get(){ return _customW; },       set(v){ _customW=v; },       configurable:true },
  _customH:       { get(){ return _customH; },       set(v){ _customH=v; },       configurable:true },
  _canvasBg:      { get(){ return _canvasBg; },      set(v){ _canvasBg=v; },      configurable:true },
});

window.PALS=PALS;
window.gpal=gpal;
window.drawSw=drawSw;
