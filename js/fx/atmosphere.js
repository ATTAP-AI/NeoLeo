/* ══════════════════════════════════════════════════════════
   ATMOSPHERE SYSTEM — extracted from NeoLeo monolith
   Depends on globals: av, actx, cv, ctx, h2r, AS, setI,
     renderAtmosphere, openPanel, closePanel, setTool,
     genUndoPush, updateGlobalUndoBtns
   ══════════════════════════════════════════════════════════ */

/* ── Atmosphere state ── */
var AS={on:false,vig:{str:0,soft:50,col:'#000000'},fog:{type:'none',col:'#b0c8d8',den:0},grain:0,grade:{temp:0,sat:0,con:0,bri:0},aber:0};
window.AS=AS;

/* ── Render atmosphere onto av ── */
function renderAtmosphere(){var W=av.width,H=av.height;actx.clearRect(0,0,W,H);document.getElementById('cvwrap').style.filter='none';if(!AS.on)return;if(AS.vig.str>0){var _vc=h2r(AS.vig.col);var vr=_vc[0],vg=_vc[1],vb=_vc[2];var soft=AS.vig.soft/100,innerR=Math.min(W,H)*(.12+soft*.42),outerR=Math.min(W,H)*(.42+soft*.38);var g=actx.createRadialGradient(W/2,H/2,innerR,W/2,H/2,outerR);g.addColorStop(0,'rgba('+vr+','+vg+','+vb+',0)');g.addColorStop(1,'rgba('+vr+','+vg+','+vb+','+(AS.vig.str/100)+')');actx.fillStyle=g;actx.fillRect(0,0,W,H);}if(AS.fog.type!=='none'&&AS.fog.den>0){var _fc=h2r(AS.fog.col);var fr=_fc[0],fg=_fc[1],fb=_fc[2];var d=AS.fog.den/100;if(AS.fog.type==='flat'){actx.fillStyle='rgba('+fr+','+fg+','+fb+','+(d*.75)+')';actx.fillRect(0,0,W,H);}else if(AS.fog.type==='radial'){var g2=actx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.55);g2.addColorStop(0,'rgba('+fr+','+fg+','+fb+','+(d*.65)+')');g2.addColorStop(1,'rgba('+fr+','+fg+','+fb+',0)');actx.fillStyle=g2;actx.fillRect(0,0,W,H);}else if(AS.fog.type==='bottom'){var g3=actx.createLinearGradient(0,0,0,H);g3.addColorStop(0,'rgba('+fr+','+fg+','+fb+',0)');g3.addColorStop(.55,'rgba('+fr+','+fg+','+fb+','+(d*.35)+')');g3.addColorStop(1,'rgba('+fr+','+fg+','+fb+','+(d*.9)+')');actx.fillStyle=g3;actx.fillRect(0,0,W,H);}else{var g4=actx.createLinearGradient(0,0,0,H);g4.addColorStop(0,'rgba('+fr+','+fg+','+fb+','+(d*.9)+')');g4.addColorStop(.45,'rgba('+fr+','+fg+','+fb+','+(d*.35)+')');g4.addColorStop(1,'rgba('+fr+','+fg+','+fb+',0)');actx.fillStyle=g4;actx.fillRect(0,0,W,H);}}if(AS.grain>0){var cnt=Math.floor(av.width*av.height*(AS.grain/100)*0.06);for(var i=0;i<cnt;i++){var gx=Math.random()*W|0,gy=Math.random()*H|0,v=Math.random()*255|0;actx.fillStyle='rgba('+v+','+v+','+v+','+((0.2+Math.random()*.8)*(AS.grain/100)).toFixed(3)+')';actx.fillRect(gx,gy,1,1);}}if(AS.aber>0){var edge=AS.aber/100*W*.14;var rg=actx.createLinearGradient(0,0,edge,0);rg.addColorStop(0,'rgba(255,40,40,'+(AS.aber/100*.28).toFixed(3)+')');rg.addColorStop(1,'rgba(255,40,40,0)');actx.fillStyle=rg;actx.fillRect(0,0,edge,H);var cg=actx.createLinearGradient(W-edge,0,W,0);cg.addColorStop(0,'rgba(0,210,255,0)');cg.addColorStop(1,'rgba(0,210,255,'+(AS.aber/100*.28).toFixed(3)+')');actx.fillStyle=cg;actx.fillRect(W-edge,0,edge,H);}var gr=AS.grade;document.getElementById('cvwrap').style.filter='brightness('+(1+gr.bri/200).toFixed(3)+') contrast('+Math.max(.01,1+gr.con/200).toFixed(3)+') saturate('+Math.max(0,1+gr.sat/100).toFixed(3)+') hue-rotate('+(gr.temp*.45).toFixed(1)+'deg)'+(gr.temp>0?' sepia('+(gr.temp/200).toFixed(3)+')':'');
}

/* ── Atmosphere panel wiring ── */
document.getElementById('atool').onclick=function(){var p=document.getElementById('atmo-panel');if(p.classList.contains('open')){closePanel('atmo-panel');setTool('');}else{openPanel('atmo-panel');document.querySelectorAll('.tbtn').forEach(function(b){b.classList.toggle('on',b.dataset.t==='atmo');});}};
document.getElementById('ap-cls').onclick=function(){closePanel('atmo-panel');setTool('');};

document.getElementById('a-on').onchange=function(e){AS.on=e.target.checked;renderAtmosphere();};
document.getElementById('a-ftype').onchange=function(e){AS.fog.type=e.target.value;if(!AS.on){AS.on=true;document.getElementById('a-on').checked=true;}renderAtmosphere();};
var asl=function(id,vId,fn){var el=document.getElementById(id),vl=document.getElementById(vId);el.oninput=function(){vl.textContent=el.value;fn(+el.value);if(!AS.on){AS.on=true;document.getElementById('a-on').checked=true;}renderAtmosphere();};};
asl('a-vstr','a-vstrv',function(v){AS.vig.str=v;});asl('a-vsft','a-vsftv',function(v){AS.vig.soft=v;});asl('a-fden','a-fdenv',function(v){AS.fog.den=v;});asl('a-grain','a-grainv',function(v){AS.grain=v;});asl('a-temp','a-tempv',function(v){AS.grade.temp=v;});asl('a-sat','a-satv',function(v){AS.grade.sat=v;});asl('a-con','a-conv',function(v){AS.grade.con=v;});asl('a-bri','a-briv',function(v){AS.grade.bri=v;});asl('a-aber','a-aberv',function(v){AS.aber=v;});
document.getElementById('a-vcol').oninput=function(){document.getElementById('avgcsw').style.background=this.value;AS.vig.col=this.value;if(!AS.on){AS.on=true;document.getElementById('a-on').checked=true;}renderAtmosphere();};
document.getElementById('a-fcol').oninput=function(){document.getElementById('afgsw').style.background=this.value;AS.fog.col=this.value;if(!AS.on){AS.on=true;document.getElementById('a-on').checked=true;}renderAtmosphere();};
document.getElementById('avgcsw').style.background='#000000';document.getElementById('afgsw').style.background='#b0c8d8';
document.getElementById('a-rst').onclick=function(){AS.on=false;AS.grain=0;AS.aber=0;AS.vig={str:0,soft:50,col:'#000000'};AS.fog={type:'none',col:'#b0c8d8',den:0};AS.grade={temp:0,sat:0,con:0,bri:0};document.getElementById('a-on').checked=false;document.getElementById('a-ftype').value='none';['a-vstr','a-vsft','a-fden','a-grain','a-temp','a-sat','a-con','a-bri','a-aber'].forEach(function(id){var el=document.getElementById(id);if(el){el.value=id==='a-vsft'?50:0;var vl=document.getElementById(id+'v');if(vl)vl.textContent=el.value;}});renderAtmosphere();};

/* ── Apply Atmosphere: bake color grade + av onto cv, then reset ── */
document.getElementById('a-apply').onclick=function(){
  if(!AS.on){setI('Atmosphere is off — enable it first');return;}
  if(window.genUndoPush)window.genUndoPush();
  var W=cv.width,H=cv.height;
  /* Step 1: Bake color grade (CSS filter) into cv pixels */
  var gr=AS.grade;
  var hasGrade=(gr.bri!==0||gr.con!==0||gr.sat!==0||gr.temp!==0);
  if(hasGrade){
    var tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;
    var tc=tmp.getContext('2d');
    tc.filter='brightness('+(1+gr.bri/200).toFixed(3)+') contrast('+Math.max(.01,1+gr.con/200).toFixed(3)+') saturate('+Math.max(0,1+gr.sat/100).toFixed(3)+') hue-rotate('+(gr.temp*.45).toFixed(1)+'deg)'+(gr.temp>0?' sepia('+(gr.temp/200).toFixed(3)+')':'');
    tc.drawImage(cv,0,0);
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(tmp,0,0);
  }
  /* Step 2: Composite atmosphere layer onto cv */
  ctx.save();
  ctx.globalCompositeOperation='source-over';
  ctx.drawImage(av,0,0,W,H);
  ctx.restore();
  /* Clear the atmosphere canvas and CSS filter */
  actx.clearRect(0,0,W,H);
  document.getElementById('cvwrap').style.filter='none';
  /* Reset atmosphere state and UI */
  AS.on=false;AS.grain=0;AS.aber=0;
  AS.vig={str:0,soft:50,col:'#000000'};
  AS.fog={type:'none',col:'#b0c8d8',den:0};
  AS.grade={temp:0,sat:0,con:0,bri:0};
  document.getElementById('a-on').checked=false;
  document.getElementById('a-ftype').value='none';
  ['a-vstr','a-vsft','a-fden','a-grain','a-temp','a-sat','a-con','a-bri','a-aber'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){el.value=(id==='a-vsft'?50:0);var vl=document.getElementById(id+'v');if(vl)vl.textContent=el.value;}
  });
  renderAtmosphere();
  if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
  setI('Atmosphere baked into canvas');
};
window.renderAtmosphere=renderAtmosphere;
