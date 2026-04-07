/* ══════════════════════════════════════════════════════════════════════
   PROBABILITY PAINTING — Stochastic Expression
   ══════════════════════════════════════════════════════════════════════ */
(function(){

/* ── 8 Named Expressions ── */
var EXPRESSIONS=[
  {id:0, name:'Dissolution Storm',   desc:'Maximum of everything — maximum chaos',
   curve:100,frac:100,dis:100,mult:8,vol:100,ghost:60,scatter:80, seed:0xA3F1C2},
  {id:1, name:'Fracture Field',      desc:'Heavy fractures, moderate dissolve',
   curve:20, frac:100,dis:30, mult:6,vol:80, ghost:40,scatter:60, seed:0x7B2E4D},
  {id:2, name:'Phantom Traces',      desc:'High curve + dissolve, many ghost layers',
   curve:80, frac:10, dis:80, mult:8,vol:60, ghost:60,scatter:30, seed:0x2C8FA1},
  {id:3, name:'Turbulent Emergence', desc:'Balanced, high volatility',
   curve:70, frac:60, dis:40, mult:5,vol:100,ghost:45,scatter:80, seed:0xE14B73},
  {id:4, name:'Crystal Silence',     desc:'Fracture-dominant, low volatility — brittle precision',
   curve:30, frac:100,dis:10, mult:4,vol:20, ghost:20,scatter:40, seed:0x5D9E3F},
  {id:5, name:'Pure Probability',    desc:'All weights equal — true maximum entropy',
   curve:100,frac:100,dis:100,mult:8,vol:100,ghost:60,scatter:80, seed:0xF4A812},
  {id:6, name:'Whisper Field',       desc:'Soft curves, heavy dissolve, low scatter',
   curve:90, frac:5,  dis:60, mult:7,vol:30, ghost:55,scatter:20, seed:0x3B6C91},
  {id:7, name:'Shatter Dream',       desc:'Fracture-heavy with high scatter and volatility',
   curve:40, frac:100,dis:50, mult:6,vol:90, ghost:50,scatter:70, seed:0xC72A58},
];

/* ── State ── */
var PP={
  active:false, seed:0xA3F1C2, locked:false,
  curve:0.70, fracture:0.20, dissolve:0.10,
  mult:3, vol:0.40, ghost:0.22, scatter:24,
  selExpr:-1,
  baseSnap:null, allPaths:[], lastCol:'#E8F50A', lastSz:10, lastOp:0.9,
  _inSession:false,
};

/* ── PRNG ── */
function makePRNG(seed){
  var s=seed>>>0;
  return function(){s+=0x6D2B79F5;var t=s;t=(t^(t>>>15))*((t|1)>>>0);t^=t+(t^(t>>>7))*(t|61);return((t^(t>>>14))>>>0)/4294967296;};
}

/* ── Weights ── */
function weights(){
  var c=PP.curve,f=PP.fracture,d=PP.dissolve,tot=c+f+d;
  if(tot<=0)return{c:1,f:0,d:0};
  return{c:c/tot,f:f/tot,d:d/tot};
}

/* ── Stochastic stroke renderer ── */
function renderStochasticStroke(ctx,pts,brushType,col,sz,op,rng,expression){
  if(!pts||pts.length<2)return;
  var w=weights(),ghost=expression>0;
  var alpha=ghost?(PP.ghost*(1-expression/Math.max(PP.mult,1))):op;
  var r=parseInt(col.slice(1,3),16)||200,g2=parseInt(col.slice(3,5),16)||100,b=parseInt(col.slice(5,7),16)||100;
  if(ghost){var sh=expression*40;r=Math.min(255,r+(sh*0.3)|0);g2=Math.min(255,g2+(sh*0.1)|0);b=Math.min(255,b+(sh*0.5)|0);}
  var paintCol='rgb('+r+','+g2+','+b+')';
  ctx.save();
  ctx.strokeStyle=paintCol;ctx.fillStyle=paintCol;
  ctx.lineWidth=sz*(1+PP.vol*0.4*(rng()-0.5));
  ctx.lineCap='round';ctx.lineJoin='round';
  var i=0;
  while(i<pts.length-1){
    var roll=rng(),p0=pts[i],p1=pts[i+1];
    var nx=(rng()-0.5)*PP.scatter*PP.vol,ny=(rng()-0.5)*PP.scatter*PP.vol;
    if(roll<w.d){i++;continue;}
    else if(roll<w.d+w.f){
      ctx.beginPath();ctx.moveTo(p0[0]+nx,p0[1]+ny);
      var brk=Math.floor(rng()*2)+2;
      for(var k=0;k<brk;k++){var t=k/brk;ctx.lineTo(p0[0]+(p1[0]-p0[0])*t+(rng()-0.5)*PP.scatter,p0[1]+(p1[1]-p0[1])*t+(rng()-0.5)*PP.scatter);}
      ctx.lineTo(p1[0]+nx,p1[1]+ny);ctx.globalAlpha=alpha*0.8;ctx.stroke();ctx.globalAlpha=alpha;i++;
    } else {
      ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(p0[0]+nx,p0[1]+ny);
      while(i<pts.length-1&&rng()<w.c){
        var pa=pts[i],pb=pts[i+1],nxa=(rng()-0.5)*sz*PP.vol*2,nya=(rng()-0.5)*sz*PP.vol*2;
        ctx.quadraticCurveTo((pa[0]+pb[0])/2+(rng()-0.5)*sz*3*PP.vol+nxa,(pa[1]+pb[1])/2+(rng()-0.5)*sz*3*PP.vol+nya,pb[0]+nxa,pb[1]+nya);i++;
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ── scheduleRegen: re-render all paths with current slider values ── */
var _regenTimer=null;
function scheduleRegen(){
  clearTimeout(_regenTimer);
  _regenTimer=setTimeout(function(){
    if(!PP.active)return;
    var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
    if(!lctx||!PP.allPaths||PP.allPaths.length===0)return;
    if(PP.baseSnap){try{lctx.putImageData(PP.baseSnap,0,0);}catch(e){}}
    var palObj2=typeof gpal==='function'?gpal():null;
    var palCols2=palObj2&&palObj2.c&&palObj2.c.length?palObj2.c:['#E8F50A','#ff4060','#40c0ff','#c060ff','#40ffc0','#ff8040'];
    PP.allPaths.forEach(function(pts2,pi){
      var pathCol2=palCols2[pi%palCols2.length];
      for(var e=0;e<PP.mult;e++){
        var rng2=makePRNG(PP.seed+pi*997+e*7919);
        renderStochasticStroke(lctx,pts2,'round_hard',pathCol2,PP.lastSz,PP.lastOp,rng2,e);
      }
    });
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  },80);
}

/* ── Build expression list in panel ── */
function buildExprList(){
  var list=document.getElementById('pp-expr-list');
  if(!list)return;
  list.innerHTML='';
  EXPRESSIONS.forEach(function(ex){
    var row=document.createElement('div');
    row.id='pp-ex-'+ex.id;
    row.style.cssText='cursor:pointer;padding:5px 8px;border:1px solid #1a1a00;margin-bottom:3px;border-radius:2px;transition:border-color .1s,background .1s;';
    row.innerHTML='<div style="font-size:9px;font-weight:600;color:#E8F50A;letter-spacing:.06em;">'+(ex.id+1)+'. '+ex.name+'</div>'+
      '<div style="font-size:8px;color:#97c3b0;margin-top:1px;line-height:1.4;">'+ex.desc+'</div>';
    row.addEventListener('mouseenter',function(){if(PP.selExpr!==ex.id){this.style.borderColor='rgba(232,245,10,0.4)';this.style.background='rgba(232,245,10,0.03)';}});
    row.addEventListener('mouseleave',function(){if(PP.selExpr!==ex.id){this.style.borderColor='#1a1a00';this.style.background='';}});
    row.addEventListener('click',function(){selectExpression(ex);});
    list.appendChild(row);
  });
}

/* ── Highlight selected expression row ── */
function highlightExpr(id){
  EXPRESSIONS.forEach(function(ex){
    var row=document.getElementById('pp-ex-'+ex.id);
    if(!row)return;
    if(ex.id===id){
      row.style.borderColor='#E8F50A';row.style.background='rgba(232,245,10,0.08)';
    } else {
      row.style.borderColor='#1a1a00';row.style.background='';
    }
  });
}

/* ── Select an expression: set sliders to max, render on canvas ── */
function selectExpression(ex){
  if(window.genUndoPush)window.genUndoPush();
  PP.selExpr=ex.id;
  PP.seed=ex.seed;

  /* Set ALL sliders to hard maximum */
  PP.curve=1.0;PP.fracture=1.0;PP.dissolve=1.0;
  PP.mult=8;PP.vol=1.0;PP.ghost=0.6;PP.scatter=80;

  /* Update slider UIs */
  var setSl=function(id,val){var el=document.getElementById(id);if(el)el.value=val;};
  var setV=function(id,txt){var el=document.getElementById(id);if(el)el.textContent=txt;};
  setSl('pp-curve',100);setV('pp-curve-v','100%');
  setSl('pp-frac',100);setV('pp-frac-v','100%');
  setSl('pp-dis',100);setV('pp-dis-v','100%');
  setSl('pp-mult',8);setV('pp-mult-v','8');
  setSl('pp-vol',100);setV('pp-vol-v','100%');
  setSl('pp-ghost',60);setV('pp-ghost-v','60%');
  setSl('pp-scatter',80);setV('pp-scatter-v','80');

  /* Seed display */
  var sd=document.getElementById('pp-seed-display');
  if(sd)sd.textContent='0x'+ex.seed.toString(16).toUpperCase().padStart(6,'0');

  highlightExpr(ex.id);

  /* Auto-activate */
  if(!PP.active)window._PP.toggle();

  /* Render on canvas */
  var dv=document.getElementById('dv');
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(lctx&&dv){
    var W=dv.width,H=dv.height;
    if(window._toolPreRender)window._toolPreRender(lctx,W,H);
    try{PP.baseSnap=lctx.getImageData(0,0,W,H);}catch(e){}
    PP.allPaths=[];
    /* Use full palette colours — one per path for visible variety */
    var palObj=typeof gpal==='function'?gpal():null;
    var palCols=palObj&&palObj.c&&palObj.c.length?palObj.c:['#E8F50A','#ff4060','#40c0ff','#c060ff','#40ffc0','#ff8040'];
    PP.lastCol=palCols[0];PP.lastSz=window.brushSz||12;PP.lastOp=0.75;
    var rng0=makePRNG(ex.seed+1);
    for(var p=0;p<6;p++){
      var pts2=[],x=rng0()*W,y=rng0()*H;
      for(var k=0;k<40;k++){
        x+=(rng0()-0.5)*W*0.12;y+=(rng0()-0.5)*H*0.12;
        /* Image Signal: drift path toward high-density regions */
        if(window._IS&&window._IS.active){
          var _d0=window._IS.getDens(x/W,y/H);
          x+=(_d0-0.5)*W*0.06*window._IS.influence;
        }
        x=Math.max(0,Math.min(W,x));y=Math.max(0,Math.min(H,y));
        pts2.push([x,y]);
      }
      PP.allPaths.push(pts2);
      var pathCol=palCols[p%palCols.length];
      for(var e=0;e<PP.mult;e++){
        var rng2=makePRNG(ex.seed+p*997+e*7919);
        renderStochasticStroke(lctx,pts2,'round_hard',pathCol,PP.lastSz,PP.lastOp,rng2,e);
      }
    }
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  }

  var si=document.getElementById('si');
  if(si)si.textContent='PP: '+ex.name+' — all max — adjust sliders to modify';
}

/* ── Wire sliders ── */
function wireSliders(){
  function sl(id,valId,pct,setter){
    var el=document.getElementById(id),vl=document.getElementById(valId);
    if(!el)return;
    el.addEventListener('input',function(){
      var v=parseInt(this.value);setter(v/100);
      if(vl)vl.textContent=pct?v+'%':v;
      checkWarn();scheduleRegen();
    });
  }
  sl('pp-curve','pp-curve-v',true,function(v){PP.curve=v;});
  sl('pp-frac','pp-frac-v',true,function(v){PP.fracture=v;});
  sl('pp-dis','pp-dis-v',true,function(v){PP.dissolve=v;});
  sl('pp-vol','pp-vol-v',true,function(v){PP.vol=v;});
  sl('pp-ghost','pp-ghost-v',true,function(v){PP.ghost=v;});
  var ms=document.getElementById('pp-mult'),mv=document.getElementById('pp-mult-v');
  if(ms)ms.addEventListener('input',function(){PP.mult=parseInt(this.value);if(mv)mv.textContent=this.value;scheduleRegen();});
  var sc=document.getElementById('pp-scatter'),sv=document.getElementById('pp-scatter-v');
  if(sc)sc.addEventListener('input',function(){PP.scatter=parseInt(this.value);if(sv)sv.textContent=this.value;scheduleRegen();});
}

function checkWarn(){
  var w=document.getElementById('pp-weight-warn');
  if(w)w.style.display=(PP.curve+PP.fracture+PP.dissolve)>1.01?'block':'none';
}

/* ── main _PP_paint (called by drawing tools) ── */
/* Expose PP internals for palette reactivity */
window._PP_getState=function(){return PP;};
window._PP_regen=function(ctx,pts,col,pi,e){
  var rng2=makePRNG(PP.seed+pi*997+e*7919);
  renderStochasticStroke(ctx,pts,'round_hard',col||PP.lastCol,PP.lastSz,PP.lastOp,rng2,e);
};
Object.defineProperty(window,'_PP_baseSnap',{get:function(){return PP.baseSnap;},set:function(v){PP.baseSnap=v;}});
Object.defineProperty(window,'_PP_allPaths',{get:function(){return PP.allPaths;},set:function(v){PP.allPaths=v;}});

window._PP_paint=function(ctx,pts,brushType,col,sz,op){
  if(!PP.active)return false;
  if(!PP._inSession){
    try{PP.baseSnap=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);}catch(e){}
    PP.allPaths=[];PP._inSession=true;PP.lastCol=col;PP.lastSz=sz;PP.lastOp=op;
  }
  PP.allPaths.push(pts.slice());PP.lastPts=pts.slice();
  if(!PP.locked){PP.seed=Math.floor(Math.random()*0xFFFFFF);}
  var sd=document.getElementById('pp-seed-display');
  if(sd)sd.textContent='0x'+PP.seed.toString(16).toUpperCase().padStart(6,'0');
  for(var e=0;e<PP.mult;e++){
    var rng2=makePRNG(PP.seed+(PP.allPaths.length-1)*997+e*7919);
    renderStochasticStroke(ctx,pts,brushType,col,sz,op,rng2,e);
  }
  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  PP._inSession=false;
  return true;
};

/* ── Public API ── */
window._PP={
  isActive:function(){return PP.active;},
  toggle:function(){
    PP.active=!PP.active;
    var btn=document.getElementById('pp-activate-btn');
    if(btn){btn.textContent=PP.active?'\u25c9 Active':'\u25c8 Activate';btn.style.background=PP.active?'#E8F50A':'none';btn.style.color=PP.active?'#000':'#E8F50A';btn.style.borderColor=PP.active?'#E8F50A':'#E8F50A';}
    var si=document.getElementById('si');
    if(si)si.textContent=PP.active?'Probability Painting ON — click an expression or draw':'Probability Painting off';
  },
  reseed:function(){
    if(PP.locked)return;
    PP.seed=Math.floor(Math.random()*0xFFFFFF);
    var sd=document.getElementById('pp-seed-display');
    if(sd)sd.textContent='0x'+PP.seed.toString(16).toUpperCase().padStart(6,'0');
    scheduleRegen();
  },
  lockSeed:function(){
    PP.locked=!PP.locked;
    var btn=document.querySelector('[onclick*="lockSeed"]');
    if(btn)btn.textContent=PP.locked?'\u{1F513} Locked':'\u{1F512} Lock';
    var rb=document.getElementById('pp-reseed-btn');if(rb)rb.style.opacity=PP.locked?'0.4':'1';
  },
  cycle:function(){
    var next=(PP.selExpr+1)%EXPRESSIONS.length;
    selectExpression(EXPRESSIONS[next]);
    var cl=document.getElementById('pp-cycle-label'),cn=document.getElementById('pp-cycle-name');
    if(cl)cl.style.display='block';
    if(cn)cn.textContent='('+(next+1)+'/'+EXPRESSIONS.length+') '+EXPRESSIONS[next].name;
  }
};

/* ── Init ── */
setTimeout(function(){
  buildExprList();
  wireSliders();
},400);

})();


(function(){
  var SECTIONS=[{btn:'canvas-toggle2',body:'canvas-body'},{btn:'eng-toggle',body:'eng-body'},{btn:'pal-toggle',body:'pal-body'},{btn:'dt-toggle',body:'dt-body'},{btn:'exp-toggle',body:'exp-body'}];
  function closeOthers(openBodyId){SECTIONS.forEach(function(s){if(s.body===openBodyId)return;var body=document.getElementById(s.body),btn=document.getElementById(s.btn);if(!body||!body.classList.contains('open'))return;body.classList.remove('open');if(btn){var chev=btn.querySelector('.chev');if(chev)chev.style.transform='';}});}
  document.addEventListener('click',function(e){var btn=e.target.closest('.sec-hdr-btn');if(!btn)return;var sec=SECTIONS.find(function(s){return s.btn===btn.id;});if(!sec)return;var body=document.getElementById(sec.body);if(!body)return;if(!body.classList.contains('open'))closeOthers(sec.body);},{capture:true});
})();
