(function(){

/* ── State ── */
var NAT = {
  /* Grain */
  grainOn: false, grainType: 'film', grainAmt: 25, grainSize: 1,
  grainBlend: 'overlay', grainMono: true,
  /* Jitter */
  jitterOn: false, jitterAmt: 2, jitterColor: 3, jitterWidth: 10,
  /* Multi-pass */
  multiOn: false, multiPasses: 3, multiBlend: 'screen', multiOpacity: 40,
  multiSeedDrift: 5, multiScaleDrift: 2, multiRotDrift: 1
};

/* ── Build floating panel ── */
var panel = document.createElement('div');
panel.id = 'nat-panel';
panel.innerHTML =
  '<div class="nat-hdr" id="nat-hdr">' +
    '<div><div style="font-size:10px;letter-spacing:.2em;color:#ffffff;text-transform:uppercase;font-weight:700;">\u2618 Naturalize</div>' +
    '<div style="font-size:8px;color:#40c8a0;margin-top:2px;letter-spacing:.06em;">Grain \u00B7 Jitter \u00B7 Multi-Pass</div></div>' +
    '<button id="nat-close" style="background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);font-size:9px;padding:4px 10px;cursor:pointer;border-radius:3px;font-family:inherit;">Close</button>' +
  '</div>' +

  /* ── GRAIN ── */
  '<div class="nat-sec">' +
    '<div class="nat-sec-title">\u25C8 Grain Overlay</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:8px;">' +
      '<button id="nat-grain-btn" class="nat-btn" style="flex:1;">Enable</button>' +
    '</div>' +
    '<div class="nat-row"><span class="nat-lbl">Type</span></div>' +
    '<select id="nat-grain-type">' +
      '<option value="film">Film Grain</option>' +
      '<option value="paper">Paper Fiber</option>' +
      '<option value="canvas">Canvas Weave</option>' +
      '<option value="sand">Sandstone</option>' +
      '<option value="linen">Linen Texture</option>' +
    '</select>' +
    '<div class="nat-row"><span class="nat-lbl">Intensity</span><span class="nat-val" id="nat-grain-v">25%</span></div>' +
    '<input type="range" id="nat-grain-amt" min="1" max="100" value="25">' +
    '<div class="nat-row"><span class="nat-lbl">Scale</span><span class="nat-val" id="nat-grain-sz-v">1\u00D7</span></div>' +
    '<input type="range" id="nat-grain-sz" min="1" max="4" value="1">' +
    '<div class="nat-row"><span class="nat-lbl">Blend</span></div>' +
    '<select id="nat-grain-blend">' +
      '<option value="overlay">Overlay</option>' +
      '<option value="soft-light">Soft Light</option>' +
      '<option value="multiply">Multiply</option>' +
      '<option value="screen">Screen</option>' +
      '<option value="color-dodge">Color Dodge</option>' +
    '</select>' +
    '<label style="display:flex;align-items:center;gap:6px;font-size:9px;color:rgba(255,255,255,0.6);margin-top:2px;cursor:pointer;">' +
      '<input type="checkbox" id="nat-grain-mono" checked> Monochrome' +
    '</label>' +
  '</div>' +

  /* ── JITTER ── */
  '<div class="nat-sec">' +
    '<div class="nat-sec-title">\u25C8 Jitter &amp; Wobble</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:8px;">' +
      '<button id="nat-jitter-btn" class="nat-btn" style="flex:1;">Enable</button>' +
    '</div>' +
    '<div class="nat-row"><span class="nat-lbl">Position Jitter</span><span class="nat-val" id="nat-jit-v">2 px</span></div>' +
    '<input type="range" id="nat-jit-amt" min="0" max="15" value="2">' +
    '<div class="nat-row"><span class="nat-lbl">Color Drift</span><span class="nat-val" id="nat-jit-col-v">3%</span></div>' +
    '<input type="range" id="nat-jit-col" min="0" max="20" value="3">' +
    '<div class="nat-row"><span class="nat-lbl">Width Variation</span><span class="nat-val" id="nat-jit-wid-v">10%</span></div>' +
    '<input type="range" id="nat-jit-wid" min="0" max="40" value="10">' +
  '</div>' +

  /* ── MULTI-PASS ── */
  '<div class="nat-sec">' +
    '<div class="nat-sec-title">\u25C8 Multi-Pass Accumulation</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:8px;">' +
      '<button id="nat-multi-btn" class="nat-btn" style="flex:1;">Enable</button>' +
    '</div>' +
    '<div class="nat-row"><span class="nat-lbl">Passes</span><span class="nat-val" id="nat-mp-v">3</span></div>' +
    '<input type="range" id="nat-mp-n" min="2" max="8" value="3">' +
    '<div class="nat-row"><span class="nat-lbl">Layer Opacity</span><span class="nat-val" id="nat-mp-op-v">40%</span></div>' +
    '<input type="range" id="nat-mp-op" min="5" max="80" value="40">' +
    '<div class="nat-row"><span class="nat-lbl">Blend</span></div>' +
    '<select id="nat-mp-blend">' +
      '<option value="screen">Screen</option>' +
      '<option value="overlay">Overlay</option>' +
      '<option value="soft-light">Soft Light</option>' +
      '<option value="multiply">Multiply</option>' +
      '<option value="lighten">Lighten</option>' +
      '<option value="source-over">Normal</option>' +
    '</select>' +
    '<div class="nat-row"><span class="nat-lbl">Seed Drift</span><span class="nat-val" id="nat-mp-sd-v">5</span></div>' +
    '<input type="range" id="nat-mp-sd" min="1" max="50" value="5">' +
    '<div class="nat-row"><span class="nat-lbl">Scale Drift</span><span class="nat-val" id="nat-mp-sc-v">2%</span></div>' +
    '<input type="range" id="nat-mp-sc" min="0" max="15" value="2">' +
    '<div class="nat-row"><span class="nat-lbl">Rotation Drift</span><span class="nat-val" id="nat-mp-rot-v">1\u00B0</span></div>' +
    '<input type="range" id="nat-mp-rot" min="0" max="10" value="1">' +
  '</div>' +

  /* ── APPLY / SAVE / RESET ── */
  '<div style="padding:8px 12px;border-top:1px solid rgba(255,255,255,0.08);display:flex;gap:6px;">' +
    '<button id="nat-apply" class="nat-btn" style="flex:1;background:rgba(64,200,160,0.18);border-color:#40c8a0;color:#ffffff;font-weight:700;">\u2713 Apply</button>' +
    '<button id="nat-save" class="nat-btn" style="flex:0.7;background:rgba(64,200,160,0.08);border-color:rgba(64,200,160,0.3);">\u25A0 Save</button>' +
    '<button id="nat-reset" class="nat-btn" style="flex:0.6;">\u21BA Reset</button>' +
  '</div>' +
  '<div id="nat-status" style="font-size:7px;color:rgba(255,255,255,0.3);text-align:center;min-height:10px;padding:0 12px 6px;"></div>';

document.body.appendChild(panel);

/* ── Panel open/close & drag ── */
var _natOpen = false, _natPos = null;
function openNat(){
  if(_natPos){panel.style.left=_natPos.left+'px';panel.style.top=_natPos.top+'px';}
  else{var tb=document.getElementById('tb');if(tb){var r=tb.getBoundingClientRect();panel.style.left=Math.max(4,r.left-298)+'px';panel.style.top='10px';}else{panel.style.left='50px';panel.style.top='40px';}}
  panel.classList.add('open');_natOpen=true;
}
function closeNat(){panel.classList.remove('open');_natOpen=false;}

var natToggle=document.getElementById('nat-toggle');
if(natToggle)natToggle.addEventListener('click',function(){if(_natOpen)closeNat();else openNat();});
document.getElementById('nat-close').addEventListener('click',closeNat);

/* Drag header */
var hdr=document.getElementById('nat-hdr');
hdr.addEventListener('mousedown',function(e){
  if(e.target.id==='nat-close'||e.target.closest('#nat-close'))return;
  e.preventDefault();hdr.style.cursor='grabbing';
  var r=panel.getBoundingClientRect();
  var drag={sx:e.clientX,sy:e.clientY,ol:r.left,ot:r.top};
  function mv(ev){var nl=Math.max(0,drag.ol+(ev.clientX-drag.sx)),nt=Math.max(0,drag.ot+(ev.clientY-drag.sy));panel.style.left=nl+'px';panel.style.top=nt+'px';_natPos={left:nl,top:nt};}
  function up(){hdr.style.cursor='grab';document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
  document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
});


/* ── Snapshot for realtime preview ── */
var _natSnap = null;
var _natDebounce = null;

function captureSnap(){
  var cvEl = document.getElementById('cv');
  if(!cvEl) return;
  _natSnap = cvEl.getContext('2d').getImageData(0, 0, cvEl.width, cvEl.height);
}
function restoreSnap(){
  if(!_natSnap) return;
  var cvEl = document.getElementById('cv');
  if(cvEl) cvEl.getContext('2d').putImageData(_natSnap, 0, 0);
}
function ensureSnap(){
  if(!_natSnap) captureSnap();
}

/* ── Wire slider controls with live preview ── */
function ws(id, vId, suffix, key){
  var sl = document.getElementById(id), vl = document.getElementById(vId);
  if(!sl) return;
  sl.addEventListener('input', function(){
    NAT[key] = parseFloat(sl.value);
    vl.textContent = sl.value + suffix;
    ensureSnap(); livePreview();
  });
}
ws('nat-grain-amt','nat-grain-v','%','grainAmt');
ws('nat-grain-sz','nat-grain-sz-v','\u00D7','grainSize');
ws('nat-jit-amt','nat-jit-v',' px','jitterAmt');
ws('nat-jit-col','nat-jit-col-v','%','jitterColor');
ws('nat-jit-wid','nat-jit-wid-v','%','jitterWidth');
ws('nat-mp-n','nat-mp-v','','multiPasses');
ws('nat-mp-op','nat-mp-op-v','%','multiOpacity');
ws('nat-mp-sd','nat-mp-sd-v','','multiSeedDrift');
ws('nat-mp-sc','nat-mp-sc-v','%','multiScaleDrift');
ws('nat-mp-rot','nat-mp-rot-v','\u00B0','multiRotDrift');

document.getElementById('nat-grain-type').addEventListener('change',function(){NAT.grainType=this.value;ensureSnap();livePreview();});
document.getElementById('nat-grain-blend').addEventListener('change',function(){NAT.grainBlend=this.value;ensureSnap();livePreview();});
document.getElementById('nat-grain-mono').addEventListener('change',function(){NAT.grainMono=this.checked;ensureSnap();livePreview();});
document.getElementById('nat-mp-blend').addEventListener('change',function(){NAT.multiBlend=this.value;ensureSnap();livePreview();});

/* Toggle buttons */
function wireToggle(btnId, key, label){
  var btn = document.getElementById(btnId);
  btn.addEventListener('click', function(){
    NAT[key] = !NAT[key];
    btn.textContent = NAT[key] ? '\u2713 '+label+' ON' : 'Enable';
    btn.style.background = NAT[key] ? 'rgba(64,200,160,0.15)' : 'none';
    btn.style.borderColor = NAT[key] ? '#40c8a0' : 'rgba(255,255,255,0.2)';
    ensureSnap(); livePreview();
  });
}
wireToggle('nat-grain-btn','grainOn','Grain');
wireToggle('nat-jitter-btn','jitterOn','Jitter');
wireToggle('nat-multi-btn','multiOn','Multi-Pass');

/* ══════════════════════════════════════════════════════
   LIVE PREVIEW — restore snapshot, apply all effects
   ══════════════════════════════════════════════════════ */
function livePreview(){
  if(_natDebounce) clearTimeout(_natDebounce);
  _natDebounce = setTimeout(applyAllEffects, 40);
}

function applyAllEffects(){
  if(!_natSnap) return;
  var cvEl = document.getElementById('cv');
  if(!cvEl) return;
  var cx = cvEl.getContext('2d');
  var W = cvEl.width, H = cvEl.height;
  cx.putImageData(_natSnap, 0, 0);
  if(NAT.multiOn) applyMultiPass(cx, W, H);
  if(NAT.jitterOn) applyJitter(cx, W, H);
  if(NAT.grainOn) applyGrain(cx, W, H);
  var si = document.getElementById('si');
  if(si){
    var parts = [];
    if(NAT.grainOn) parts.push('Grain '+NAT.grainAmt+'%');
    if(NAT.jitterOn) parts.push('Jitter '+NAT.jitterAmt+'px');
    if(NAT.multiOn) parts.push(Math.round(NAT.multiPasses)+'\u00D7 Pass');
    si.textContent = parts.length ? 'Naturalize: '+parts.join(' \u00B7 ') : '';
  }
}

/* ══════════════════════════════════════════════════════
   1. GRAIN OVERLAY
   ══════════════════════════════════════════════════════ */
function applyGrain(tgtCtx, W, H){
  var amt = NAT.grainAmt / 100;
  var sz = Math.round(NAT.grainSize);
  var tw = Math.ceil(W/sz), th = Math.ceil(H/sz);
  var tc = document.createElement('canvas');
  tc.width = tw; tc.height = th;
  var gx = tc.getContext('2d');
  var id = gx.createImageData(tw, th);
  var d = id.data;
  var type = NAT.grainType, mono = NAT.grainMono;
  for(var y=0;y<th;y++){for(var x=0;x<tw;x++){
    var i=(y*tw+x)*4, v,r,g,b,a;
    if(type==='film'){
      v=((Math.random()+Math.random()+Math.random())/3-0.5)*255+128|0;
      if(mono){r=g=b=v;}else{r=v+((Math.random()-0.5)*20|0);g=v+((Math.random()-0.5)*20|0);b=v+((Math.random()-0.5)*20|0);}
      a=80+(Math.random()*175|0);
    }else if(type==='paper'){
      var fb=Math.sin(x*0.3+y*0.05+Math.random()*2)*0.5+0.5;
      v=110+fb*90+((Math.random()-0.5)*60)|0;r=g=b=v;a=40+(Math.random()*120|0);
    }else if(type==='canvas'){
      v=128+(Math.sin(x*Math.PI/2)*0.4+Math.sin(y*Math.PI/2)*0.4)*80+((Math.random()-0.5)*50)|0;
      r=g=b=v;a=60+(Math.random()*140|0);
    }else if(type==='sand'){
      v=140+((Math.random()-0.3)*100|0);v=Math.max(0,Math.min(255,v+(Math.sin(x*0.15)*Math.cos(y*0.12)*40|0)));
      r=v;g=Math.max(0,v-8);b=Math.max(0,v-20);a=50+(Math.random()*150|0);
    }else{
      v=130+((x%3===0)?20:0)+((y%2===0)?15:0)+((Math.random()-0.5)*40|0);
      r=g=b=v|0;a=50+(Math.random()*130|0);
    }
    d[i]=Math.max(0,Math.min(255,r));d[i+1]=Math.max(0,Math.min(255,g));d[i+2]=Math.max(0,Math.min(255,b));d[i+3]=Math.max(0,Math.min(255,a));
  }}
  gx.putImageData(id,0,0);
  tgtCtx.save();tgtCtx.globalAlpha=amt;tgtCtx.globalCompositeOperation=NAT.grainBlend;
  if(sz>1){tgtCtx.imageSmoothingEnabled=false;tgtCtx.drawImage(tc,0,0,W,H);}else{tgtCtx.drawImage(tc,0,0);}
  tgtCtx.restore();
}

/* ══════════════════════════════════════════════════════
   2. JITTER — pixel displacement post-process
   ══════════════════════════════════════════════════════ */
function applyJitter(cx, W, H){
  var amt=NAT.jitterAmt, colDrift=NAT.jitterColor, widVar=NAT.jitterWidth/100;
  if(amt<=0&&colDrift<=0)return;
  var src=cx.getImageData(0,0,W,H),dst=cx.createImageData(W,H);
  var sd=src.data,dd=dst.data;
  for(var y=0;y<H;y++){for(var x=0;x<W;x++){
    var dx2=Math.max(0,Math.min(W-1,x+((Math.random()-0.5)*amt*2|0)));
    var dy2=Math.max(0,Math.min(H-1,y+((Math.random()-0.5)*amt*2|0)));
    var si2=(dy2*W+dx2)*4,di=(y*W+x)*4;
    var cr=colDrift>0?((Math.random()-0.5)*colDrift*5|0):0;
    dd[di]=Math.max(0,Math.min(255,sd[si2]+cr));dd[di+1]=Math.max(0,Math.min(255,sd[si2+1]+cr));
    dd[di+2]=Math.max(0,Math.min(255,sd[si2+2]+cr));dd[di+3]=sd[si2+3];
    if(widVar>0&&Math.random()<widVar){var nx=Math.max(0,Math.min(W-1,x+((Math.random()>0.5)?1:-1)));var ni=(y*W+nx)*4;dd[di]=(dd[di]+sd[ni])>>1;dd[di+1]=(dd[di+1]+sd[ni+1])>>1;dd[di+2]=(dd[di+2]+sd[ni+2])>>1;}
  }}
  cx.putImageData(dst,0,0);
}

/* ══════════════════════════════════════════════════════
   3. MULTI-PASS — duplicate + transform + blend
   ══════════════════════════════════════════════════════ */
function applyMultiPass(cx, W, H){
  var passes=Math.round(NAT.multiPasses),blendMode=NAT.multiBlend,passOp=NAT.multiOpacity/100;
  var scaleDrift=NAT.multiScaleDrift/100,rotDrift=NAT.multiRotDrift*Math.PI/180,seedDrift=NAT.multiSeedDrift;
  if(passes<2)return;
  var base=document.createElement('canvas');base.width=W;base.height=H;
  base.getContext('2d').drawImage(cx.canvas,0,0);
  var rng=(function(s){return function(){s=(s*16807+0)%2147483647;return(s&0x7fffffff)/0x7fffffff;};})(seedDrift*7919+13);
  for(var p=1;p<passes;p++){
    cx.save();cx.globalAlpha=passOp;cx.globalCompositeOperation=blendMode;
    cx.translate(W/2+(rng()-0.5)*seedDrift*0.8,H/2+(rng()-0.5)*seedDrift*0.8);
    cx.rotate((rng()-0.5)*rotDrift*2);var sc=1+(rng()-0.5)*scaleDrift*2;cx.scale(sc,sc);
    cx.translate(-W/2,-H/2);cx.drawImage(base,0,0);cx.restore();
  }
}

/* ── Recapture after generate ── */
function recaptureSnap(){
  _natSnap=null;captureSnap();
  if(NAT.grainOn||NAT.jitterOn||NAT.multiOn)livePreview();
}
var _origGenBtn=document.getElementById('gbtn');
if(_origGenBtn){var _ogc=_origGenBtn.onclick;_origGenBtn.onclick=function(){if(_ogc)_ogc();setTimeout(recaptureSnap,600);};}
var _origRanBtn=document.getElementById('ranbtn');
if(_origRanBtn){var _orc=_origRanBtn.onclick;_origRanBtn.onclick=function(){if(_orc)_orc();setTimeout(recaptureSnap,600);};}

/* Recapture button in panel */
var recapBtn=document.createElement('button');
recapBtn.className='nat-btn';recapBtn.style.cssText='width:calc(100% - 24px);margin:0 12px 6px;padding:5px;background:rgba(64,200,160,0.08);';
recapBtn.textContent='\u27F3 Recapture Current Image';recapBtn.title='Take a fresh snapshot of the current canvas';
recapBtn.addEventListener('click',function(){recaptureSnap();var st=document.getElementById('nat-status');if(st){st.textContent='Canvas recaptured';setTimeout(function(){st.textContent='';},2000);}});
var footer=panel.querySelector('div[style*="border-top"]');if(footer)panel.insertBefore(recapBtn,footer);

/* ── Apply: commit effects to cv, push undo ── */
document.getElementById('nat-apply').addEventListener('click',function(){
  if(!_natSnap){var st=document.getElementById('nat-status');if(st){st.textContent='Nothing to apply — adjust a slider first';setTimeout(function(){st.textContent='';},2500);}return;}
  if(!(NAT.grainOn||NAT.jitterOn||NAT.multiOn)){var st2=document.getElementById('nat-status');if(st2){st2.textContent='Enable at least one effect first';setTimeout(function(){st2.textContent='';},2500);}return;}
  /* Effects are already rendered on cv from livePreview — just commit */
  if(window.genUndoPush)window.genUndoPush();
  /* Clear snapshot so next interaction captures the committed state */
  _natSnap=null;
  var st3=document.getElementById('nat-status');if(st3){st3.textContent='Applied — effects committed to canvas';setTimeout(function(){st3.textContent='';},2500);}
  var si=document.getElementById('si');if(si)si.textContent='Naturalize applied';
  if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
});

/* ── Save / Reset ── */
var _natSaved=null;
document.getElementById('nat-save').addEventListener('click',function(){
  _natSaved=JSON.parse(JSON.stringify(NAT));
  var st=document.getElementById('nat-status');if(st){st.textContent='Settings saved';setTimeout(function(){st.textContent='';},2000);}
});
document.getElementById('nat-reset').addEventListener('click',function(){
  NAT.grainOn=false;NAT.grainType='film';NAT.grainAmt=25;NAT.grainSize=1;NAT.grainBlend='overlay';NAT.grainMono=true;
  NAT.jitterOn=false;NAT.jitterAmt=2;NAT.jitterColor=3;NAT.jitterWidth=10;
  NAT.multiOn=false;NAT.multiPasses=3;NAT.multiBlend='screen';NAT.multiOpacity=40;NAT.multiSeedDrift=5;NAT.multiScaleDrift=2;NAT.multiRotDrift=1;
  document.getElementById('nat-grain-amt').value=25;document.getElementById('nat-grain-v').textContent='25%';
  document.getElementById('nat-grain-sz').value=1;document.getElementById('nat-grain-sz-v').textContent='1\u00D7';
  document.getElementById('nat-grain-type').value='film';document.getElementById('nat-grain-blend').value='overlay';
  document.getElementById('nat-grain-mono').checked=true;
  document.getElementById('nat-jit-amt').value=2;document.getElementById('nat-jit-v').textContent='2 px';
  document.getElementById('nat-jit-col').value=3;document.getElementById('nat-jit-col-v').textContent='3%';
  document.getElementById('nat-jit-wid').value=10;document.getElementById('nat-jit-wid-v').textContent='10%';
  document.getElementById('nat-mp-n').value=3;document.getElementById('nat-mp-v').textContent='3';
  document.getElementById('nat-mp-op').value=40;document.getElementById('nat-mp-op-v').textContent='40%';
  document.getElementById('nat-mp-blend').value='screen';
  document.getElementById('nat-mp-sd').value=5;document.getElementById('nat-mp-sd-v').textContent='5';
  document.getElementById('nat-mp-sc').value=2;document.getElementById('nat-mp-sc-v').textContent='2%';
  document.getElementById('nat-mp-rot').value=1;document.getElementById('nat-mp-rot-v').textContent='1\u00B0';
  ['nat-grain-btn','nat-jitter-btn','nat-multi-btn'].forEach(function(id){var b=document.getElementById(id);b.textContent='Enable';b.style.background='none';b.style.borderColor='rgba(255,255,255,0.2)';});
  restoreSnap();
  var st=document.getElementById('nat-status');if(st){st.textContent='Reset to defaults';setTimeout(function(){st.textContent='';},2000);}
});

window._NAT=NAT;window._natGrain=applyGrain;window._natRecapture=recaptureSnap;
window._natIsActive=function(){return NAT.grainOn||NAT.jitterOn||NAT.multiOn;};
window._natApplyEffects=applyAllEffects;
window._natClearSnap=function(){_natSnap=null;};

})();
