/* ══════════════════════════════════════════════════════════
   INTENT SCULPTING — Modality Cycler
   8 named force-field modalities, each emphasising a
   different aesthetic principle. Cycle button steps through
   them sequentially, sets all forces to modality values,
   emits a full canvas display.
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── 8 Named Modalities ── */
/* Each modality defines force values (0–100) and a dominant colour */
var MODALITIES=[
  {
    name:'Tension Web',
    desc:'High tension pulls all paths toward every node — dense crossed filaments',
    color:'#ff4040',
    forces:{tension:100,decay:20,symmetry:30,fragility:10,desire:80,resistance:20,emergence:40,dissolution:10},
    density:100,length:160,opacity:80
  },
  {
    name:'Fragile Emergence',
    desc:'High fragility + emergence — trembling branching structures appear and dissolve',
    color:'#ffd040',
    forces:{tension:30,decay:40,symmetry:20,fragility:100,desire:50,resistance:30,emergence:100,dissolution:50},
    density:80,length:120,opacity:70
  },
  {
    name:'Pure Symmetry',
    desc:'Bilateral reflection dominates — mirrored organic forms crystallise',
    color:'#40c0ff',
    forces:{tension:40,decay:20,symmetry:100,fragility:30,desire:60,resistance:20,emergence:50,dissolution:20},
    density:90,length:140,opacity:75
  },
  {
    name:'Dissolution Field',
    desc:'High dissolution + decay — marks fade rapidly into ghostly memory',
    color:'#8040ff',
    forces:{tension:20,decay:100,symmetry:20,fragility:60,desire:30,resistance:10,emergence:30,dissolution:100},
    density:120,length:100,opacity:60
  },
  {
    name:'Desire Lines',
    desc:'Maximum desire bends every path back toward its origin — tight loops and spirals',
    color:'#ff40a0',
    forces:{tension:50,decay:30,symmetry:40,fragility:20,desire:100,resistance:40,emergence:30,dissolution:20},
    density:90,length:180,opacity:80
  },
  {
    name:'Resistance Storm',
    desc:'Maximum resistance scatters marks across the full canvas — turbulent field',
    color:'#40ffc0',
    forces:{tension:60,decay:50,symmetry:10,fragility:80,desire:20,resistance:100,emergence:60,dissolution:40},
    density:100,length:80,opacity:70
  },
  {
    name:'Full Force',
    desc:'All forces at maximum — maximal complexity and contradiction',
    color:'#ffffff',
    forces:{tension:100,decay:100,symmetry:100,fragility:100,desire:100,resistance:100,emergence:100,dissolution:100},
    density:120,length:200,opacity:85
  },
  {
    name:'Calm Tension',
    desc:'Low chaos forces with high tension — long ordered strands across the field',
    color:'#e0c080',
    forces:{tension:100,decay:10,symmetry:60,fragility:5,desire:70,resistance:10,emergence:20,dissolution:5},
    density:70,length:220,opacity:90
  },
];

var _intentIdx = -1; /* starts at -1 so first click = modality 0 */

function applyModality(m){
  /* ── ALL sliders always set to MAXIMUM on every cycle click ── */
  var FORCE_IDS=['tension','decay','symmetry','fragility','desire','resistance','emergence','dissolution'];
  FORCE_IDS.forEach(function(id){
    var sl=document.getElementById('force-'+id);
    var vl=document.getElementById('force-v-'+id);
    if(sl)sl.value=100;
    if(vl)vl.textContent='100';
    /* Dispatch input so FORCES array in the Intent IIFE also updates */
    if(sl)sl.dispatchEvent(new Event('input'));
  });

  /* Density, length, opacity → their HTML max values */
  var dEl=document.getElementById('intent-density'),lEl=document.getElementById('intent-length'),oEl=document.getElementById('intent-op');
  if(dEl){dEl.value=200;var dv=document.getElementById('intent-density-v');if(dv)dv.textContent='200';}
  if(lEl){lEl.value=300;var lv=document.getElementById('intent-length-v');if(lv)lv.textContent='300';}
  if(oEl){oEl.value=100;var ov=document.getElementById('intent-op-v');if(ov)ov.textContent='100%';}

  /* Colour from modality */
  var colEl=document.getElementById('intent-color');
  if(colEl)colEl.value=m.color;

  /* Ensure body is open */
  var body=document.getElementById('intent-sculpt-body');
  var tog=document.getElementById('intent-sculpt-toggle');
  if(body&&body.style.display==='none'){
    body.style.display='block';
    if(tog){
      tog.style.background='rgba(192,96,255,0.12)';
      tog.style.borderColor='#7030b0';
      var chev=tog.querySelector('.tc-chev');
      if(chev)chev.style.transform='rotate(180deg)';
    }
  }

  /* Clear, save undo, paint dark bg, emit field */
  if(window._saveU)window._saveU();
  var ax=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!ax)return;
  ax.clearRect(0,0,ax.canvas.width,ax.canvas.height);
  if(window._dctx&&window._dv)window._dctx.clearRect(0,0,window._dv.width,window._dv.height);
  if(typeof layers!=='undefined'&&layers&&layers.length)
    layers.forEach(function(l){try{l.ctx.clearRect(0,0,l.canvas.width,l.canvas.height);}catch(e){}});

  ax.save();ax.fillStyle='#040208';ax.fillRect(0,0,ax.canvas.width,ax.canvas.height);ax.restore();

  var W=ax.canvas.width,H=ax.canvas.height;
  var col=m.color;
  var r0=parseInt(col.slice(1,3),16),g0=parseInt(col.slice(3,5),16),b0=parseInt(col.slice(5,7),16);

  /* 5 compositional nodes, 200 marks each at max length/opacity */
  var nodePositions=[[0.5,0.82],[0.22,0.55],[0.78,0.55],[0.35,0.25],[0.65,0.25]];
  var _is=window._intentState||{};
  if(typeof _is.fieldNodes!=='undefined')_is.fieldNodes=[];
  if(typeof _is.markCount!=='undefined')_is.markCount=0;
  if(typeof _is.rseed==='function')_is.rseed(Date.now()&0xffff);
  nodePositions.forEach(function(np){
    var node={x:np[0]*W,y:np[1]*H};
    if(typeof _is.fieldNodes!=='undefined')_is.fieldNodes=(_is.fieldNodes||[]).concat([node]);
    if(typeof _is.spawnMark==='function'){
      for(var i=0;i<200;i++)_is.spawnMark(ax,node,W,H,r0,g0,b0,1.0,300);
    }
  });

  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
}

/* ── Wire Cycle button ── */
setTimeout(function(){
  var cycleBtn=document.getElementById('intent-cycle-btn');
  if(!cycleBtn)return;

  cycleBtn.addEventListener('click',function(){
    _intentIdx=(_intentIdx+1)%MODALITIES.length;
    var m=MODALITIES[_intentIdx];

    /* Update label strip */
    var lbl=document.getElementById('intent-cycle-label');
    var nm=document.getElementById('intent-cycle-name');
    if(lbl)lbl.style.display='block';
    if(nm)nm.textContent='('+(_intentIdx+1)+'/'+MODALITIES.length+') '+m.name+' — '+m.desc;

    applyModality(m);

    var si=document.getElementById('si');
    if(si)si.textContent='Intent: '+m.name+' ('+(_intentIdx+1)+'/'+MODALITIES.length+')';
  });
}, 500);

})();
