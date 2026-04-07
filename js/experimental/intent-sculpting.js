/* ══════════════════════════════════════════════════════════
   INTENT SCULPTING — Force Field Aesthetics
   Eight forces: tension, decay, symmetry, fragility,
   desire, resistance, emergence, dissolution
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── Safe helpers for out-of-closure access ── */
function _si(msg){var el=document.getElementById('si');if(el)el.textContent=msg;}
function _saveU(){if(window._saveU)window._saveU();}
function _getActx(){return window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);}

/* ── Forces ── */
var FORCES=[
  {id:'tension',    label:'Tension',    val:0.5, color:'#ff6040'},
  {id:'decay',      label:'Decay',      val:0.3, color:'#80a060'},
  {id:'symmetry',   label:'Symmetry',   val:0.2, color:'#60c0ff'},
  {id:'fragility',  label:'Fragility',  val:0.4, color:'#ffd080'},
  {id:'desire',     label:'Desire',     val:0.6, color:'#ff40a0'},
  {id:'resistance', label:'Resistance', val:0.35,color:'#4080ff'},
  {id:'emergence',  label:'Emergence',  val:0.5, color:'#40ffc0'},
  {id:'dissolution',label:'Dissolution',val:0.25,color:'#c080ff'},
];

/* ── State ── */
var active=false, fieldNodes=[], markCount=0;
window._intentState={get fieldNodes(){return fieldNodes;},set fieldNodes(v){fieldNodes=v;},get markCount(){return markCount;},set markCount(v){markCount=v;},spawnMark:null,rseed:null};

/* ── Build force sliders ── */
var sliderContainer=document.getElementById('force-sliders');
if(sliderContainer){
  FORCES.forEach(function(f){
    var wrap=document.createElement('div');
    wrap.className='fx-pm';
    wrap.style.borderLeft='2px solid '+f.color;
    wrap.style.paddingLeft='6px';
    wrap.style.marginBottom='4px';
    wrap.innerHTML='<div class="fx-pr" title="'+f.label+'"><span class="fx-pn" style="color:'+f.color+'">'+f.label+'</span><span class="fx-pv" id="force-v-'+f.id+'">'+Math.round(f.val*100)+'</span></div>'
      +'<input type="range" id="force-'+f.id+'" min="0" max="100" value="'+Math.round(f.val*100)+'">';
    sliderContainer.appendChild(wrap);
    var sl=wrap.querySelector('input'),vl=wrap.querySelector('.fx-pv');
    sl.addEventListener('input',function(){f.val=parseInt(sl.value)/100;vl.textContent=sl.value;
      /* Realtime: re-emit from existing nodes with updated forces */
      _regenIntent();
    });
  });
}

function getF(id){var f=FORCES.find(function(x){return x.id===id;});return f?f.val:0.5;}

/* ── Activate ── */
var sculBtn=document.getElementById('intent-sculpt-btn');
var emitBtn=document.getElementById('intent-emit-btn');
var clrBtn=document.getElementById('intent-clear-btn');
var rstBtn=document.getElementById('intent-reset-btn');
var randBtn=document.getElementById('intent-rand-btn');

if(sculBtn)sculBtn.addEventListener('click',function(){
  active=!active;
  sculBtn.style.background=active?'rgba(192,96,255,0.18)':'none';
  sculBtn.textContent=active?'◼ Deactivate':'◈ Activate';
  _si(active?'Intent Sculpting — click canvas to place force nodes':'Intent Sculpting off');
});

if(clrBtn)clrBtn.addEventListener('click',function(){
  _saveU();
  var actx=_getActx();
  if(actx){if(!window._ENG_CONNECT)actx.clearRect(0,0,actx.canvas.width,actx.canvas.height);}
  if(window._dctx)window._dctx.clearRect(0,0,window._dv.width,window._dv.height);
  fieldNodes=[];markCount=0;
  if(window._layersCompositeFn)window._layersCompositeFn();
  _si('Marks cleared');
});

if(rstBtn)rstBtn.addEventListener('click',function(){
  FORCES.forEach(function(f){
    f.val=0.5;
    var sl=document.getElementById('force-'+f.id),vl=document.getElementById('force-v-'+f.id);
    if(sl)sl.value=50;if(vl)vl.textContent='50';
  });
  fieldNodes=[];markCount=0;
  _si('Forces reset');
});

if(emitBtn)emitBtn.addEventListener('click',function(){
  if(!fieldNodes.length){_si('Activate and click canvas to place force nodes first');return;}
  _saveU();
  var actx=_getActx();if(!actx)return;
  var col=document.getElementById('intent-color');
  var baseCol=col?col.value:'#c060ff';
  var density=parseInt(document.getElementById('intent-density').value)||60;
  var maxLen=parseInt(document.getElementById('intent-length').value)||80;
  var opacity=(parseInt(document.getElementById('intent-op').value)||70)/100;
  var r0=parseInt(baseCol.slice(1,3),16),g0=parseInt(baseCol.slice(3,5),16),b0=parseInt(baseCol.slice(5,7),16);
  rseed(Date.now()&0xfffff);
  var W=actx.canvas.width,H=actx.canvas.height;
  fieldNodes.forEach(function(node){
    for(var m=0;m<density;m++)spawnMark(actx,node,W,H,r0,g0,b0,opacity,maxLen);
    markCount+=density;
  });
  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  _si('Field emitted — '+markCount+' marks');
});

/* ── Random button ── */
if(randBtn)randBtn.addEventListener('click',function(){
  var _rs=Date.now()&0xfffff;
  function _rng(){_rs=Math.imul(_rs^(_rs>>>16),0x45d9f3b);_rs^=(_rs>>>16);return(_rs>>>0)/0xffffffff;}
  FORCES.forEach(function(f){
    var v=Math.round(_rng()*100);f.val=v/100;
    var sl=document.getElementById('force-'+f.id),vl=document.getElementById('force-v-'+f.id);
    if(sl)sl.value=v;if(vl)vl.textContent=v;
  });
  var dEl=document.getElementById('intent-density'),lEl=document.getElementById('intent-length');
  if(dEl){var d=20+Math.round(_rng()*180);dEl.value=d;var dv=document.getElementById('intent-density-v');if(dv)dv.textContent=d;}
  if(lEl){var l=30+Math.round(_rng()*270);lEl.value=l;var lv=document.getElementById('intent-length-v');if(lv)lv.textContent=l;}
  /* Random colour */
  var h2=Math.round(_rng()*360),s2=60+Math.round(_rng()*40),li=50+Math.round(_rng()*20);
  function hsl2hex(h,s,l){h/=360;s/=100;l/=100;var a=s*Math.min(l,1-l);var f=function(n){var k=(n+h/30*12)%12;return l-a*Math.max(Math.min(k-3,9-k,1),-1);};return'#'+[f(0),f(8),f(4)].map(function(v){return Math.round(v*255).toString(16).padStart(2,'0');}).join('');}
  var col=hsl2hex(h2,s2,li);
  var colEl=document.getElementById('intent-color');if(colEl)colEl.value=col;
  /* Clear and emit fresh */
  _saveU();
  var actx=_getActx();if(!actx)return;
  if(!window._ENG_CONNECT)actx.clearRect(0,0,actx.canvas.width,actx.canvas.height);
  if(window._dctx)window._dctx.clearRect(0,0,window._dv.width,window._dv.height);
  fieldNodes=[];markCount=0;
  var W=actx.canvas.width,H=actx.canvas.height;
  var r0=parseInt(col.slice(1,3),16),g0=parseInt(col.slice(3,5),16),b0=parseInt(col.slice(5,7),16);
  var density=parseInt(dEl?dEl.value:60)||60;
  var maxLen=parseInt(lEl?lEl.value:100)||100;
  var opacity=(parseInt(document.getElementById('intent-op')?document.getElementById('intent-op').value:70)||70)/100;
  var nodeCount=3+Math.round(_rng()*3);
  rseed(Date.now()&0xfffff);
  for(var i=0;i<nodeCount;i++){
    var nx,ny;
    if(window._canvasRatio==='circle'){
      var ang=_rng()*Math.PI*2,rad=_rng()*Math.min(W,H)*0.38;
      nx=W/2+Math.cos(ang)*rad;ny=H/2+Math.sin(ang)*rad;
    } else {nx=W*0.1+_rng()*W*0.8;ny=H*0.1+_rng()*H*0.8;}
    var node={x:nx,y:ny};fieldNodes.push(node);
    spawnMark(actx,node,W,H,r0,g0,b0,opacity,maxLen);
    r0=Math.max(0,Math.min(255,r0+Math.round((_rng()-0.5)*60)));
    g0=Math.max(0,Math.min(255,g0+Math.round((_rng()-0.5)*40)));
    b0=Math.max(0,Math.min(255,b0+Math.round((_rng()-0.5)*50)));
    markCount+=Math.round(density*0.5);
  }
  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  _si('Random field: '+nodeCount+' nodes');
});

/* ── Seeded RNG ── */
var _rs2=1;
function rseed(v){_rs2=(v^0xdeadbeef)>>>0;}
function rng(){_rs2=Math.imul(_rs2^(_rs2>>>16),0x45d9f3b);_rs2^=(_rs2>>>16);return(_rs2>>>0)/0xffffffff;}

/* ── Core mark spawner ── */
function spawnMark(actx,node,W,H,r0,g0,b0,baseOp,maxLen){
  var tension=getF('tension'),decay=getF('decay'),symmetry=getF('symmetry'),
      fragility=getF('fragility'),desire=getF('desire'),resistance=getF('resistance'),
      emergence=getF('emergence'),dissolution=getF('dissolution');
  var spread=(0.3+resistance*0.7)*Math.min(W,H)*0.22;
  var a0=rng()*Math.PI*2,r0d=rng()*spread;
  var px=Math.max(2,Math.min(W-2,node.x+Math.cos(a0)*r0d));
  var py=Math.max(2,Math.min(H-2,node.y+Math.sin(a0)*r0d));
  var toNode=Math.atan2(node.y-py,node.x-px);
  var dir=toNode+(rng()-0.5)*Math.PI*(1.6-desire*1.4);
  var len=maxLen*(0.2+rng()*0.8)*(1-fragility*0.55+rng()*fragility*0.35);
  var stepSize=1.5+rng()*1.5,tremor=fragility*0.75,branchProb=emergence*0.014;
  var steps=Math.round(len/stepSize),branches=[];
  actx.save();
  actx.lineWidth=0.3+rng()*(1+fragility*1.5);actx.lineCap='round';
  actx.beginPath();actx.moveTo(px,py);
  for(var s=0;s<steps;s++){
    var tenX=0,tenY=0;
    fieldNodes.forEach(function(other){
      if(other===node)return;
      var dx=other.x-px,dy=other.y-py,dist=Math.sqrt(dx*dx+dy*dy)||1;
      tenX+=(dx/dist)*tension*0.35;tenY+=(dy/dist)*tension*0.35;
    });
    dir+=Math.atan2(tenY,tenX)*tension*0.07;
    var desToNode=Math.atan2(node.y-py,node.x-px);
    var ad=desToNode-dir;while(ad>Math.PI)ad-=Math.PI*2;while(ad<-Math.PI)ad+=Math.PI*2;
    dir+=ad*desire*0.04;
    var mirX=node.x-(px-node.x);
    dir+=(Math.atan2(node.y-py,mirX-px)-dir)*symmetry*0.025;
    if(rng()<decay*0.022*(s/steps))break;
    dir+=(rng()-0.5)*tremor*0.55;
    if(rng()<resistance*0.09)dir+=(rng()-0.5)*Math.PI*resistance*0.45;
    px+=Math.cos(dir)*stepSize;py+=Math.sin(dir)*stepSize;
    if(px<0||px>W||py<0||py>H)break;
    if(window._canvasRatio==='circle'){var cx=W/2,cy=H/2,cr=Math.min(W,H)/2;if((px-cx)*(px-cx)+(py-cy)*(py-cy)>cr*cr)break;}
    actx.lineTo(px,py);
    if(rng()<branchProb&&s>4)branches.push({x:px,y:py,dir:dir+(rng()-0.5)*Math.PI*0.75,steps:Math.round(steps*0.3)});
  }
  var mOp=baseOp*(1-dissolution*0.5*(rng()*0.4+0.3));
  var hr=Math.min(255,r0+Math.round((fragility-0.5)*55));
  var hg=Math.min(255,g0+Math.round((emergence-0.5)*38));
  var hb=Math.min(255,b0+Math.round((desire-0.5)*48));
  actx.strokeStyle='rgba('+hr+','+hg+','+hb+','+mOp.toFixed(3)+')';actx.stroke();
  branches.forEach(function(br){
    actx.beginPath();var bx=br.x,by=br.y,bd=br.dir;actx.moveTo(bx,by);
    for(var s2=0;s2<br.steps;s2++){
      bd+=(rng()-0.5)*tremor*0.35;bx+=Math.cos(bd)*stepSize*0.65;by+=Math.sin(bd)*stepSize*0.65;
      if(bx<0||bx>W||by<0||by>H)break;actx.lineTo(bx,by);
    }
    actx.strokeStyle='rgba('+hr+','+hg+','+hb+','+(mOp*0.35).toFixed(3)+')';
    actx.lineWidth*=0.45;actx.stroke();
  });
  actx.restore();
}
if(window._intentState){window._intentState.spawnMark=spawnMark;window._intentState.rseed=rseed;}

/* ── Canvas click to place node ── */
document.addEventListener('mousedown',function(e){
  if(!active)return;
  var pos=window._getCanvasPos?window._getCanvasPos(e):null;
  if(!pos)return;
  var node={x:pos[0],y:pos[1]};fieldNodes.push(node);
  _saveU();
  var actx=_getActx();if(!actx)return;
  var col=document.getElementById('intent-color');
  var baseCol=col?col.value:'#c060ff';
  var density=Math.round((parseInt(document.getElementById('intent-density').value)||60)*0.45);
  var maxLen=parseInt(document.getElementById('intent-length').value)||80;
  var opacity=(parseInt(document.getElementById('intent-op').value)||70)/100;
  var r0=parseInt(baseCol.slice(1,3),16),g0=parseInt(baseCol.slice(3,5),16),b0=parseInt(baseCol.slice(5,7),16);
  rseed(Date.now()&0xfffff);
  var W=actx.canvas.width,H=actx.canvas.height;
  for(var m=0;m<density;m++)spawnMark(actx,node,W,H,r0,g0,b0,opacity,maxLen);
  markCount+=density;
  if(window._layersCompositeFn)window._layersCompositeFn();
  _si('Node placed ('+fieldNodes.length+') — '+density+' marks');
},true);

/* ── Wire param displays — realtime regen ── */
['intent-density','intent-length','intent-op'].forEach(function(id){
  var sl=document.getElementById(id),vl=document.getElementById(id+'-v');
  if(sl&&vl)sl.addEventListener('input',function(){
    vl.textContent=sl.value+(id==='intent-op'?'%':'');
    _regenIntent();
  });
});
document.getElementById('intent-color')&&document.getElementById('intent-color').addEventListener('input',function(){_regenIntent();});

/* ── Debounced realtime re-emit ── */
var _intentTimer=null;
function _regenIntent(){
  clearTimeout(_intentTimer);
  _intentTimer=setTimeout(function(){
    if(!fieldNodes.length)return;
    if(window.genUndoPush)window.genUndoPush();
    var actx=_getActx();if(!actx)return;
    var W=actx.canvas.width,H=actx.canvas.height;
    actx.save();actx.fillStyle='#050308';actx.fillRect(0,0,W,H);actx.restore();
    if(window._dctx){window._dctx.fillStyle='#050308';window._dctx.fillRect(0,0,W,H);}
    var col=document.getElementById('intent-color');
    var baseCol=col?col.value:'#c060ff';
    var density=Math.max(10,Math.round((parseInt(document.getElementById('intent-density').value)||60)*0.5));
    var maxLen=parseInt(document.getElementById('intent-length').value)||80;
    var opacity=(parseInt(document.getElementById('intent-op').value)||70)/100;
    var r0=parseInt(baseCol.slice(1,3),16),g0=parseInt(baseCol.slice(3,5),16),b0=parseInt(baseCol.slice(5,7),16);
    rseed(Date.now()&0xffff);
    fieldNodes.forEach(function(node){
      for(var m=0;m<density;m++)spawnMark(actx,node,W,H,r0,g0,b0,opacity,maxLen);
    });
    if(window._layersCompositeFn)window._layersCompositeFn();
  }, 80);
}

/* ── Wire exp-toggle as floating panel ── */
(function(){
  var btn=document.getElementById('exp-toggle');
  var body=document.getElementById('exp-body');
  if(!btn||!body)return;
  var _expPos=null;
  var _expOpen=false;

  /* Inject drag header at top of exp-body */
  var hdr=document.createElement('div');
  hdr.id='exp-drag-hdr';
  hdr.innerHTML='<div><div style="font-size:10px;letter-spacing:.2em;color:#ffffff;text-transform:uppercase;font-weight:700;">◆ Experimental Tools</div>'
    +'<div style="font-size:8px;color:#40c8a0;margin-top:2px;line-height:1.5;letter-spacing:.06em;">Intent · Temporal · Probability · Memory · Morpho</div></div>'
    +'<button id="exp-panel-close" style="background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);font-size:9px;padding:4px 10px;cursor:pointer;border-radius:3px;font-family:inherit;line-height:1.4;flex-shrink:0;">Close</button>';
  body.insertBefore(hdr,body.firstChild);

  /* Inject save/reset buttons at bottom */
  var footer=document.createElement('div');
  footer.style.cssText='padding:8px 10px;border-top:1px solid rgba(255,255,255,0.08);display:flex;gap:6px;flex-shrink:0;';
  footer.innerHTML='<button id="exp-save-settings" style="flex:1;padding:6px;background:rgba(64,200,160,0.12);border:1px solid rgba(64,200,160,0.4);color:#40c8a0;font-family:inherit;font-size:8px;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;font-weight:600;border-radius:3px;">■ Save Settings</button>'
    +'<button id="exp-reset-settings" style="flex:1;padding:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);font-family:inherit;font-size:8px;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;font-weight:600;border-radius:3px;">↺ Reset</button>';
  var statusDiv=document.createElement('div');
  statusDiv.id='exp-settings-status';
  statusDiv.style.cssText='font-size:7px;color:rgba(255,255,255,0.3);text-align:center;min-height:10px;line-height:1.5;padding:0 10px 6px;';
  body.appendChild(footer);
  body.appendChild(statusDiv);

  /* Move exp-body out of #panel to document.body so it floats independently */
  document.body.appendChild(body);

  function openExpPanel(){
    if(_expPos){
      body.style.left=_expPos.left+'px';body.style.top=_expPos.top+'px';
    } else {
      var tb=document.getElementById('tb');
      if(tb){var r=tb.getBoundingClientRect();body.style.left=Math.max(4,r.left-328)+'px';body.style.top='10px';}
      else{body.style.left='50px';body.style.top='40px';}
    }
    body.classList.add('open');
    _expOpen=true;
    btn.querySelector('.chev').style.transform='rotate(180deg)';
  }
  function closeExpPanel(){
    body.classList.remove('open');
    _expOpen=false;
    btn.querySelector('.chev').style.transform='';
  }

  btn.addEventListener('click',function(){
    if(_expOpen)closeExpPanel();else openExpPanel();
  });
  document.getElementById('exp-panel-close').addEventListener('click',closeExpPanel);

  /* Drag header */
  hdr.addEventListener('mousedown',function(e){
    if(e.target.id==='exp-panel-close'||e.target.closest('#exp-panel-close'))return;
    e.preventDefault();hdr.style.cursor='grabbing';
    var r=body.getBoundingClientRect();
    var drag={sx:e.clientX,sy:e.clientY,ol:r.left,ot:r.top};
    function mv(ev){
      var nl=Math.max(0,Math.min(window.innerWidth-60,drag.ol+(ev.clientX-drag.sx)));
      var nt=Math.max(0,Math.min(window.innerHeight-40,drag.ot+(ev.clientY-drag.sy)));
      body.style.left=nl+'px';body.style.top=nt+'px';
      _expPos={left:nl,top:nt};
    }
    function up(){hdr.style.cursor='grab';document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });

  /* Save/Reset — collect all sliders inside exp-body */
  var _expSaved=null;
  function getExpSliders(){
    var ids=[];
    body.querySelectorAll('input[type=range]').forEach(function(inp){if(inp.id)ids.push(inp.id);});
    body.querySelectorAll('select').forEach(function(sel){if(sel.id)ids.push(sel.id);});
    return ids;
  }
  function getExpVals(){
    var s={};
    getExpSliders().forEach(function(id){
      var el=document.getElementById(id);
      if(el)s[id]=el.value;
    });
    return s;
  }
  function setExpVals(vals){
    Object.keys(vals).forEach(function(id){
      var el=document.getElementById(id);
      if(!el)return;
      el.value=vals[id];
      el.dispatchEvent(new Event('input',{bubbles:true}));
    });
  }

  document.getElementById('exp-save-settings').addEventListener('click',function(){
    _expSaved=getExpVals();
    var st=document.getElementById('exp-settings-status');
    if(st){st.textContent='Settings saved';setTimeout(function(){st.textContent='';},2000);}
  });
  document.getElementById('exp-reset-settings').addEventListener('click',function(){
    /* Reset all sliders to their HTML default values */
    body.querySelectorAll('input[type=range]').forEach(function(inp){
      inp.value=inp.defaultValue;
      inp.dispatchEvent(new Event('input',{bubbles:true}));
    });
    body.querySelectorAll('select').forEach(function(sel){
      sel.selectedIndex=0;
      sel.dispatchEvent(new Event('change',{bubbles:true}));
    });
    var st=document.getElementById('exp-settings-status');
    if(st){st.textContent='Reset to defaults';setTimeout(function(){st.textContent='';},2000);}
  });
})();

/* ── Default Intent Sculpting sample — all forces 100, 4 nodes, full emit ── */
function runIntentDefault(){
  /* Set all force sliders to 100 */
  FORCES.forEach(function(f){
    f.val=1.0;
    var sl=document.getElementById('force-'+f.id),vl=document.getElementById('force-v-'+f.id);
    if(sl)sl.value=100;if(vl)vl.textContent='100';
  });
  /* Set density/length/opacity to vivid values */
  var dEl=document.getElementById('intent-density'),lEl=document.getElementById('intent-length'),opEl=document.getElementById('intent-op');
  if(dEl){dEl.value=90;var dv=document.getElementById('intent-density-v');if(dv)dv.textContent='90';}
  if(lEl){lEl.value=120;var lv=document.getElementById('intent-length-v');if(lv)lv.textContent='120';}
  if(opEl){opEl.value=80;var opv=document.getElementById('intent-op-v');if(opv)opv.textContent='80%';}
  /* Vivid default colour */
  var colEl=document.getElementById('intent-color');if(colEl)colEl.value='#c060ff';
  /* Clear canvas, save undo */
  _saveU();
  var actx=_getActx();if(!actx)return;
  var W=actx.canvas.width,H=actx.canvas.height;
  /* Fill with a dark background so marks are always visible */
  actx.save();actx.fillStyle='#050308';actx.fillRect(0,0,W,H);actx.restore();
  if(window._dctx){window._dctx.fillStyle='#050308';window._dctx.fillRect(0,0,W,H);}
  /* Place 5 compositionally arranged nodes */
  fieldNodes=[];markCount=0;
  var nodePositions=[[0.5,0.85],[0.25,0.55],[0.75,0.55],[0.35,0.28],[0.65,0.28]];
  var colours=['#c060ff','#ff4080','#40c0ff','#ffd040','#40ffc0'];
  rseed(42);
  nodePositions.forEach(function(np,i){
    var node={x:np[0]*W,y:np[1]*H};fieldNodes.push(node);
    var col2=colours[i];
    var r2=parseInt(col2.slice(1,3),16),g2=parseInt(col2.slice(3,5),16),b2=parseInt(col2.slice(5,7),16);
    for(var m=0;m<70;m++)spawnMark(actx,node,W,H,r2,g2,b2,0.75,120);
    markCount+=70;
  });
  /* Second pass for cross-node tension effects */
  rseed(99);
  nodePositions.forEach(function(np,i){
    var node=fieldNodes[i];var col2=colours[i];
    var r2=parseInt(col2.slice(1,3),16),g2=parseInt(col2.slice(3,5),16),b2=parseInt(col2.slice(5,7),16);
    for(var m=0;m<30;m++)spawnMark(actx,node,W,H,r2,g2,b2,0.4,80);
  });
  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  _si('Intent Sculpting — all forces 100 — click canvas to add nodes');
}

/* ── Add fx-bb and fx-pm CSS if missing ── */
(function(){
  if(document.getElementById('fx-css'))return;
  var s=document.createElement('style');s.id='fx-css';
  s.textContent='.fx-bb{padding:4px 8px;background:none;border:1px solid var(--brd);color:var(--dim);font-family:inherit;font-size:9px;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;transition:all .1s;}'
    +'.fx-bb:hover{color:var(--txt);border-color:var(--dim);}'
    +'.fx-pm{margin-bottom:5px;}'
    +'.fx-pr{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;}'
    +'.fx-pn{font-size:9px;color:var(--dim);letter-spacing:.06em;}'
    +'.fx-pv{font-size:9px;color:var(--txt);}';
  document.head.appendChild(s);
})();

})();
