/* ══════════════════════════════════════════════════════════
   LIGHTING SYSTEM — extracted from NeoLeo monolith
   Depends on globals: lv, lctx, cv, ctx, h2r, LS, setI,
     renderLighting, openPanel, closePanel, positionPanel, setTool,
     genUndoPush, updateGlobalUndoBtns
   ══════════════════════════════════════════════════════════ */

/* ── Lighting state ── */
var LS={on:false,lights:[{on:true,type:'point',col:'#ffee88',int:60,px:30,py:25,rad:220},{on:false,type:'point',col:'#88ccff',int:40,px:70,py:70,rad:160}],bloom:0,ambCol:'#001122',ambInt:0};
window.LS=LS;

/* ── Render lighting onto lv ── */
function renderLighting(){var W=lv.width,H=lv.height;lctx.clearRect(0,0,W,H);lv.style.filter='';if(!LS.on)return;if(LS.ambInt>0){var _c=h2r(LS.ambCol);var ar=_c[0],ag=_c[1],ab=_c[2];lctx.fillStyle='rgba('+ar+','+ag+','+ab+','+(LS.ambInt/100*0.45)+')';lctx.fillRect(0,0,W,H);}LS.lights.forEach(function(lt){if(!lt.on)return;var x=lt.px/100*W,y=lt.py/100*H,r=lt.rad;var _lc=h2r(lt.col);var lr=_lc[0],lg=_lc[1],lb=_lc[2];var a=lt.int/100;if(lt.type==='point'){var g=lctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+lr+','+lg+','+lb+','+a+')');g.addColorStop(.45,'rgba('+lr+','+lg+','+lb+','+(a*.18).toFixed(3)+')');g.addColorStop(1,'rgba('+lr+','+lg+','+lb+',0)');lctx.fillStyle=g;lctx.beginPath();lctx.arc(x,y,r,0,Math.PI*2);lctx.fill();}else if(lt.type==='spot'){lctx.save();var g2=lctx.createRadialGradient(x,y,0,x,y,r*.7);g2.addColorStop(0,'rgba('+lr+','+lg+','+lb+','+a+')');g2.addColorStop(1,'rgba('+lr+','+lg+','+lb+',0)');lctx.fillStyle=g2;lctx.scale(1,1.7);lctx.beginPath();lctx.arc(x,y/1.7,r*.45,0,Math.PI*2);lctx.fill();lctx.restore();}else{var g3=lctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.22,W/2,H/2,Math.min(W,H)*.78);g3.addColorStop(0,'rgba('+lr+','+lg+','+lb+',0)');g3.addColorStop(1,'rgba('+lr+','+lg+','+lb+','+(a*.85).toFixed(3)+')');lctx.fillStyle=g3;lctx.fillRect(0,0,W,H);}});if(LS.bloom>0)lv.style.filter='blur('+(LS.bloom*.55).toFixed(1)+'px)';}

/* ── Lighting panel wiring ── */
document.getElementById('ltool').onclick=function(){var p=document.getElementById('light-panel');if(p.classList.contains('open')){closePanel('light-panel');setTool('');}else{openPanel('light-panel');document.querySelectorAll('.tbtn').forEach(function(b){b.classList.toggle('on',b.dataset.t==='lighting');});}};
document.getElementById('lp-cls').onclick=function(){closePanel('light-panel');setTool('');};

document.getElementById('l-on').onchange=function(e){LS.on=e.target.checked;renderLighting();};
document.getElementById('l1-on').onchange=function(e){LS.lights[0].on=e.target.checked;renderLighting();};
document.getElementById('l2-on').onchange=function(e){LS.lights[1].on=e.target.checked;renderLighting();};
document.getElementById('l1-type').onchange=function(e){LS.lights[0].type=e.target.value;if(!LS.on){LS.on=true;document.getElementById('l-on').checked=true;}renderLighting();};
document.getElementById('l2-type').onchange=function(e){LS.lights[1].type=e.target.value;if(!LS.on){LS.on=true;document.getElementById('l-on').checked=true;}renderLighting();};
var lsl=function(id,vId,sfx,fn){var el=document.getElementById(id),vl=document.getElementById(vId);el.oninput=function(){vl.textContent=el.value+(sfx||'');fn(+el.value);if(!LS.on){LS.on=true;document.getElementById('l-on').checked=true;}renderLighting();};};
lsl('l1-int','l1-intv','',function(v){LS.lights[0].int=v;});lsl('l1-rad','l1-radv','',function(v){LS.lights[0].rad=v;});lsl('l1-px','l1-pxv','%',function(v){LS.lights[0].px=v;});lsl('l1-py','l1-pyv','%',function(v){LS.lights[0].py=v;});lsl('l2-int','l2-intv','',function(v){LS.lights[1].int=v;});lsl('l2-rad','l2-radv','',function(v){LS.lights[1].rad=v;});lsl('l2-px','l2-pxv','%',function(v){LS.lights[1].px=v;});lsl('l2-py','l2-pyv','%',function(v){LS.lights[1].py=v;});lsl('l-blm','l-blmv','',function(v){LS.bloom=v;});lsl('l-amb','l-ambv','',function(v){LS.ambInt=v;});
var lCol=function(iId,swId,txId,fn){var inp=document.getElementById(iId),sw=document.getElementById(swId),tx=document.getElementById(txId);sw.style.background=inp.value;inp.oninput=function(){sw.style.background=inp.value;if(tx)tx.textContent=inp.value;fn(inp.value);if(!LS.on){LS.on=true;document.getElementById('l-on').checked=true;}renderLighting();};};
lCol('l1-col','l1csw','l1-coltxt',function(v){LS.lights[0].col=v;});lCol('l2-col','l2csw','l2-coltxt',function(v){LS.lights[1].col=v;});lCol('l-ambc','lambcsw','l-ambctxt',function(v){LS.ambCol=v;});
document.getElementById('l1csw').style.background='#ffee88';document.getElementById('l2csw').style.background='#88ccff';document.getElementById('lambcsw').style.background='#001122';
document.getElementById('l-rst').onclick=function(){LS.on=false;LS.bloom=0;LS.ambInt=0;LS.lights[0]={on:true,type:'point',col:'#ffee88',int:60,px:30,py:25,rad:220};LS.lights[1]={on:false,type:'point',col:'#88ccff',int:40,px:70,py:70,rad:160};document.getElementById('l-on').checked=false;document.getElementById('l1-on').checked=true;document.getElementById('l2-on').checked=false;renderLighting();};

/* ── Apply Lighting: bake lv onto cv, then reset lighting ── */
document.getElementById('l-apply').onclick=function(){
  if(!LS.on){setI('Lighting is off — enable it first');return;}
  if(window.genUndoPush)window.genUndoPush();
  /* Composite lighting layer onto engine canvas */
  var W=cv.width,H=cv.height;
  ctx.save();
  ctx.globalCompositeOperation='screen';
  ctx.drawImage(lv,0,0,W,H);
  ctx.restore();
  /* Clear the lighting canvas */
  lctx.clearRect(0,0,W,H);
  lv.style.filter='';
  /* Reset lighting state and UI */
  LS.on=false;LS.bloom=0;LS.ambInt=0;
  LS.lights[0]={on:true,type:'point',col:'#ffee88',int:60,px:30,py:25,rad:220};
  LS.lights[1]={on:false,type:'point',col:'#88ccff',int:40,px:70,py:70,rad:160};
  document.getElementById('l-on').checked=false;
  document.getElementById('l1-on').checked=true;
  document.getElementById('l2-on').checked=false;
  renderLighting();
  if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
  setI('Lighting baked into canvas');
};
window.renderLighting=renderLighting;
