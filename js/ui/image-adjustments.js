(function(){

/* Current values */
var V={bri:0,con:0,sat:0,exp:0,hil:0,shd:0,tmp:0,tnt:0};

/* ── Build combined CSS filter string ── */
function buildFilter(){
  /* Brightness: base level shift */
  var brightness = 1 + V.bri/100 + V.exp/100;
  /* Highlights raise: add to brightness when > 0, reduce contrast when < 0 */
  brightness += V.hil > 0 ? (V.hil/100)*0.6 : 0;
  /* Shadows lift: when > 0 raise black point by reducing contrast slightly */
  brightness += V.shd > 0 ? (V.shd/100)*0.25 : 0;

  /* Contrast: base + shadows/highlights effects */
  var contrast = 1 + V.con/100;
  contrast += V.hil < 0 ? (V.hil/100)*0.5 : 0;  /* negative highlights crush */
  contrast += V.shd < 0 ? (V.shd/100)*0.3 : 0;  /* negative shadows crush */
  contrast = Math.max(0.1, contrast);

  /* Saturation */
  var saturate = Math.max(0, 1 + V.sat/100);

  /* Temperature: sepia at low values, hue rotation for full effect */
  var sepia    = V.tmp > 0 ? (V.tmp/100)*0.35 : 0;
  var hueShift = V.tmp*0.6 + V.tnt*0.4;

  var parts = [];
  if(Math.abs(brightness-1)>0.005) parts.push('brightness('+brightness.toFixed(3)+')');
  if(Math.abs(contrast-1)>0.005)   parts.push('contrast('+contrast.toFixed(3)+')');
  if(Math.abs(saturate-1)>0.005)   parts.push('saturate('+saturate.toFixed(3)+')');
  if(sepia > 0.005)                 parts.push('sepia('+sepia.toFixed(3)+')');
  if(Math.abs(hueShift)>0.5)       parts.push('hue-rotate('+hueShift.toFixed(1)+'deg)');

  return parts.length ? parts.join(' ') : 'none';
}

/* ── Apply to #stage — affects everything visible ── */
function applyAll(){
  var stage = document.getElementById('stage');
  if(stage) stage.style.filter = buildFilter();
}

/* ── Reset all ── */
function resetAll(){
  V = {bri:0,con:0,sat:0,exp:0,hil:0,shd:0,tmp:0,tnt:0};
  var PAIRS = [
    ['u-bri','u-briv'],['u-con','u-conv'],['u-sat','u-satv'],['u-exp','u-expv'],
    ['u-hil','u-hilv'],['u-shd','u-shdv'],['u-tmp','u-tmpv'],['u-tnt','u-tntv']
  ];
  PAIRS.forEach(function(p){
    var el=document.getElementById(p[0]);if(el)el.value=0;
    var vl=document.getElementById(p[1]);if(vl)vl.textContent='0';
  });
  var stage=document.getElementById('stage');
  if(stage) stage.style.filter='none';
}

/* ── Wire all sliders ── */
function wireAdj(){
  var SLIDERS=[
    {id:'u-bri',vl:'u-briv',key:'bri'},
    {id:'u-con',vl:'u-conv',key:'con'},
    {id:'u-sat',vl:'u-satv',key:'sat'},
    {id:'u-exp',vl:'u-expv',key:'exp'},
    {id:'u-hil',vl:'u-hilv',key:'hil'},
    {id:'u-shd',vl:'u-shdv',key:'shd'},
    {id:'u-tmp',vl:'u-tmpv',key:'tmp'},
    {id:'u-tnt',vl:'u-tntv',key:'tnt'},
  ];
  SLIDERS.forEach(function(s){
    var el=document.getElementById(s.id);
    if(!el)return;
    /* Remove any previous listener by replacing element */
    var fresh=el.cloneNode(true);
    el.parentNode.replaceChild(fresh,el);
    var vl=document.getElementById(s.vl);
    fresh.addEventListener('input',function(){
      V[s.key]=parseInt(this.value);
      if(vl)vl.textContent=(V[s.key]>0?'+':'')+V[s.key];
      applyAll();
    });
  });
  var rst=document.getElementById('u-adj-reset');
  if(rst){
    var freshR=rst.cloneNode(true);
    rst.parentNode.replaceChild(freshR,rst);
    freshR.addEventListener('click',resetAll);
  }
}

/* Wire on DOMContentLoaded or immediately if DOM already ready */
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',wireAdj);
} else {
  setTimeout(wireAdj,100);
}

window._adjReset=resetAll;
window._adjApply=applyAll;
window._adjGetFilter=buildFilter;

})();
