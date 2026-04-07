/*  js/engines/generate.js  -- Core render pipeline: generate(), lock/seed, render popup
 *  Loaded via <script> tag AFTER engine-registry.js.
 *  Uses window globals: ctx, gpal, ENAMES, ENGINES, eng, _engineSelected, seed,
 *    setI, setPr, renderLighting, renderAtmosphere, uploadedImg, uploadedEngOn,
 *    uploadedMode, uploadedEngOp, drawImageToCtx, sz, rp, rr, drawSw, buildP, randP, genUndoPush
 */

let locked=false,lseed=null;

/* ── Rendering popup ── */
var _renderPopup=(function(){
  var el=null,_timer=null,_hideTimer=null;
  function _make(){
    if(el)return;
    el=document.createElement('div');
    el.id='render-popup';
    el.style.cssText='display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(6,6,14,0.92);border:1px solid var(--acc);padding:10px 22px;font-family:inherit;font-size:10px;letter-spacing:.2em;color:var(--acc);text-transform:uppercase;pointer-events:none;z-index:50;white-space:nowrap;';
    el.innerHTML='<span id="render-dots">&#9632;</span> Rendering<span id="render-ellipsis">...</span>';
    var wrap=document.getElementById('cvwrap');
    if(wrap){wrap.style.position='relative';wrap.appendChild(el);}
    /* Animate ellipsis */
    var dots=['.','..','.','...','.'];var di=0;
    setInterval(function(){if(el.style.display!=='none'){document.getElementById('render-ellipsis').textContent=dots[di++%dots.length];}},300);
  }
  return {
    show:function(){
      _make();
      clearTimeout(_hideTimer);
      /* Only show if render takes >120ms */
      _timer=setTimeout(function(){
        if(el){el.style.display='block';}
      },120);
    },
    hide:function(){
      clearTimeout(_timer);
      if(el){
        _hideTimer=setTimeout(function(){el.style.display='none';},120);
      }
    }
  };
})();

function generate(){
  if(!_engineSelected){setI('Select an engine first');return;}
  if(document.getElementById('exp-body')&&document.getElementById('exp-body').classList.contains('open'))return;
  if(window.genUndoPush)window.genUndoPush();
  const[W,H]=sz(),p=gpal();
  const sv=document.getElementById('si2').value.trim();
  let sd=locked&&lseed!=null?lseed:sv&&!isNaN(+sv)?+sv:Date.now();
  seed(sd);lseed=sd;
  document.getElementById('si2').value=sd;
  document.getElementById('ss').textContent=sd;
  document.getElementById('se').textContent=ENAMES[eng];
  const btn=document.getElementById('gbtn');
  btn.textContent='CREATING\u2026';btn.style.background='#444';btn.style.color='#fff';
  setPr(5);
  _renderPopup.show();
  setTimeout(()=>{
    try{
      /* If image is loaded and engine-on-image is enabled, pre-draw it before engine */
      if(uploadedImg&&uploadedEngOn){
        /* For replace mode: clear cv and draw image as base */
        if(uploadedMode==='replace'){
          ctx.clearRect(0,0,W,H);
          drawImageToCtx(ctx,uploadedOp,'source-over');
          ctx.save();ctx.globalAlpha=uploadedEngOp;ENGINES[eng](W,H,p);ctx.restore();
        } else if(uploadedMode==='under'){
          /* Engine runs first (paints its own bg), then image is overlaid via uv */
          ctx.save();ctx.globalAlpha=uploadedEngOp;ENGINES[eng](W,H,p);ctx.restore();
        } else {
          /* Over: engine runs on blank, image composites over it via uv */
          ENGINES[eng](W,H,p);
        }
      } else {
        ctx.save();ctx.globalAlpha=uploadedEngOp;ENGINES[eng](W,H,p);ctx.restore();
      }
    }catch(er){setI('error: '+er.message);console.error(er);}
    /* Image Signal: apply density modulation to engine output */
    if(window._IS&&window._IS.active)window._IS.applyToEngine(ctx,W,H);
    renderLighting();renderAtmosphere();
    setPr(100);
    if(typeof _histPush==='function')_histPush();
    setTimeout(()=>{
      setPr(0);
      btn.textContent='CREATE';btn.style.background='';btn.style.color='';
      _renderPopup.hide();
    },400);
  },20);
}

/* ── Button wiring ── */
document.getElementById('gbtn').onclick=generate;
document.getElementById('lbtn').onclick=()=>{
  locked=!locked;
  const lb=document.getElementById('lbtn');
  lb.classList.toggle('on',locked);
  lb.textContent=locked?'LOCKED':'LOCK';
  if(locked)lseed=+document.getElementById('si2').value||Date.now();
};

/* ── Expose on window ── */
window.generate=generate;
window._renderPopup=_renderPopup;
window.locked=locked;
window.lseed=lseed;
Object.defineProperty(window,'locked',{get(){return locked;},set(v){locked=v;},configurable:true});
Object.defineProperty(window,'lseed',{get(){return lseed;},set(v){lseed=v;},configurable:true});
