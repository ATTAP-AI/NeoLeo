/* ══ Happy Hallucinations v2 — Engine + Drawing Tools Composite ══ */
(function(){
window._hhHist={entries:[],cursor:-1};

/* ── All 49 engines ── */
var MOODS=[
  {name:'Ember Storm',engine:'flowfield',pal:'ember'},
  {name:'Deep Void',engine:'attractor',pal:'void'},
  {name:'Neon Pulse',engine:'interference',pal:'neon'},
  {name:'Ocean Dream',engine:'growth',pal:'ocean'},
  {name:'Aurora Drift',engine:'physarum',pal:'aurora'},
  {name:'Earth Strata',engine:'subdivision',pal:'earth'},
  {name:'Rust Garden',engine:'lsystem',pal:'rust'},
  {name:'Botanic Web',engine:'space_colonization',pal:'botanic'},
  {name:'Ink Tide',engine:'watercolor',pal:'ink'},
  {name:'Crystal Bloom',engine:'crystal_growth',pal:'neon'},
  {name:'Magnetic Rain',engine:'magnetic_field',pal:'ocean'},
  {name:'Void Fractal',engine:'julia_set',pal:'void'},
  {name:'Ember Cells',engine:'cell_growth',pal:'ember'},
  {name:'Neon Lattice',engine:'delaunay',pal:'neon'},
  {name:'Ghost Erosion',engine:'hydraulic_erosion',pal:'ghost'},
  {name:'Aurora Flock',engine:'boid_flocking',pal:'aurora'},
  {name:'Earth Crust',engine:'voronoi',pal:'earth'},
  {name:'Rust Decay',engine:'reaction_diffusion',pal:'rust'},
  {name:'Botanic Spiral',engine:'spirograph',pal:'botanic'},
  {name:'Sand Drift',engine:'sand_drift',pal:'ink'},
  {name:'Ink Fractal',engine:'flame_fractal',pal:'ink'},
  {name:'Ocean Contours',engine:'contour_map',pal:'ocean'},
  {name:'Neon Chladni',engine:'chladni',pal:'neon'},
  {name:'Ghost MST',engine:'mst',pal:'ghost'},
  {name:'Ember Tiles',engine:'truchet',pal:'ember'},
  {name:'Void Warp',engine:'domain_warp',pal:'void'},
  {name:'Aurora Mold',engine:'reaction_diffusion_b',pal:'aurora'},
  {name:'Crystal Weave',engine:'weave_knot',pal:'neon'},
  {name:'Earth Erosion',engine:'ridged_fractal',pal:'earth'},
  {name:'Sacred Geometry',engine:'apollonian',pal:'ghost'},
  {name:'ASCII Abyss',engine:'ascii_density',pal:'void'},
  {name:'Cavern Maze',engine:'cave_map',pal:'earth'},
  {name:'Silk Current',engine:'curl_noise',pal:'aurora'},
  {name:'Micro Fossil',engine:'diatom',pal:'botanic'},
  {name:'Neural Web',engine:'force_graph',pal:'neon'},
  {name:'Mycelium Map',engine:'fungal_network',pal:'rust'},
  {name:'Life Engine',engine:'game_of_life',pal:'ember'},
  {name:'Orbit Trap',engine:'gravity_wells',pal:'ocean'},
  {name:'Fractal Flame',engine:'ifs',pal:'aurora'},
  {name:'Ant Colony',engine:'langtons_ant',pal:'ink'},
  {name:'Harmonic Mesh',engine:'lissajous',pal:'neon'},
  {name:'Grain & Vein',engine:'marble_wood',pal:'rust'},
  {name:'Möbius Loop',engine:'mobius_torus',pal:'ghost'},
  {name:'Newton Basin',engine:'newton_fractal',pal:'void'},
  {name:'Signal Trace',engine:'oscilloscope',pal:'neon'},
  {name:'Penrose Dream',engine:'penrose',pal:'earth'},
  {name:'Hilbert Path',engine:'space_filling',pal:'botanic'},
  {name:'Wave Collapse',engine:'wfc',pal:'ocean'},
];

/* ── Drawing tool primitives (callable) ── */
var DRAW_TOOLS=['brush','pencil','line','rect','ellipse','triangle','shape','texturemap'];

/* ── Composition strategies ── */
var STRATEGIES=['scatter','radial','flow','grid','burst','crosshatch','constellation'];

/* ── Utility ── */
function _rr(a,b){return a+Math.random()*(b-a);}
function _ri(a,b){return Math.floor(_rr(a,b+1));}
function _pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function _palCol(pal,a){
  var p=PALS[pal];
  if(!p||!p.c||!p.c.length)return 'rgba(255,255,255,'+(a||1)+')';
  var hex=_pick(p.c);
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return 'rgba('+r+','+g+','+b+','+(a||1)+')';
}

/* ── Individual drawing operations ── */

function _drawBrush(dc,W,H,pal,op){
  /* Flowing bezier brush stroke */
  var pts=_ri(4,10);
  var sx=_rr(W*.05,W*.95),sy=_rr(H*.05,H*.95);
  var drift=_rr(80,300);
  dc.save();
  dc.globalAlpha=op;
  dc.strokeStyle=_palCol(pal,1);
  dc.lineWidth=_rr(3,30);
  dc.lineCap='round';dc.lineJoin='round';
  dc.shadowBlur=dc.lineWidth*_rr(0.3,1.5);
  dc.shadowColor=_palCol(pal,0.5);
  dc.beginPath();dc.moveTo(sx,sy);
  for(var i=0;i<pts;i++){
    var cx1=sx+_rr(-drift,drift),cy1=sy+_rr(-drift,drift);
    var cx2=sx+_rr(-drift,drift),cy2=sy+_rr(-drift,drift);
    sx+=_rr(-drift,drift);sy+=_rr(-drift,drift);
    sx=Math.max(0,Math.min(W,sx));sy=Math.max(0,Math.min(H,sy));
    dc.bezierCurveTo(cx1,cy1,cx2,cy2,sx,sy);
  }
  dc.stroke();
  dc.restore();
}

function _drawPencil(dc,W,H,pal,op){
  /* Hard-edge jagged freehand line */
  var segs=_ri(8,30);
  var x=_rr(0,W),y=_rr(0,H);
  dc.save();
  dc.globalAlpha=op;
  dc.strokeStyle=_palCol(pal,1);
  dc.lineWidth=_rr(1,5);
  dc.lineCap='round';dc.lineJoin='round';
  dc.shadowBlur=0;
  dc.beginPath();dc.moveTo(x,y);
  for(var i=0;i<segs;i++){
    x+=_rr(-60,60);y+=_rr(-60,60);
    x=Math.max(0,Math.min(W,x));y=Math.max(0,Math.min(H,y));
    dc.lineTo(x,y);
  }
  dc.stroke();
  dc.restore();
}

function _drawLine(dc,W,H,pal,op){
  /* Straight line, sometimes multiple rays */
  var count=_ri(1,5);
  dc.save();
  dc.globalAlpha=op;
  dc.lineCap='round';
  dc.shadowBlur=0;
  for(var i=0;i<count;i++){
    dc.strokeStyle=_palCol(pal,1);
    dc.lineWidth=_rr(1,8);
    dc.beginPath();
    dc.moveTo(_rr(0,W),_rr(0,H));
    dc.lineTo(_rr(0,W),_rr(0,H));
    dc.stroke();
  }
  dc.restore();
}

function _drawRect(dc,W,H,pal,op){
  /* Random rectangles, stroke/fill/both */
  var count=_ri(1,6);
  dc.save();
  dc.globalAlpha=op;
  dc.shadowBlur=0;
  for(var i=0;i<count;i++){
    var rx=_rr(0,W*.8),ry=_rr(0,H*.8);
    var rw=_rr(20,W*.4),rh=_rr(20,H*.4);
    var mode=_pick(['fill','stroke','both']);
    if(mode==='fill'||mode==='both'){
      dc.fillStyle=_palCol(pal,_rr(0.15,0.6));
      dc.fillRect(rx,ry,rw,rh);
    }
    if(mode==='stroke'||mode==='both'){
      dc.strokeStyle=_palCol(pal,1);
      dc.lineWidth=_rr(1,5);
      dc.strokeRect(rx,ry,rw,rh);
    }
  }
  dc.restore();
}

function _drawEllipse(dc,W,H,pal,op){
  /* Random ellipses */
  var count=_ri(1,6);
  dc.save();
  dc.globalAlpha=op;
  dc.shadowBlur=0;
  for(var i=0;i<count;i++){
    var cx=_rr(W*.1,W*.9),cy=_rr(H*.1,H*.9);
    var rx=_rr(10,W*.25),ry=_rr(10,H*.25);
    var mode=_pick(['fill','stroke','both']);
    dc.beginPath();
    dc.ellipse(cx,cy,rx,ry,_rr(0,Math.PI),0,Math.PI*2);
    if(mode==='fill'||mode==='both'){
      dc.fillStyle=_palCol(pal,_rr(0.1,0.5));
      dc.fill();
    }
    if(mode==='stroke'||mode==='both'){
      dc.strokeStyle=_palCol(pal,1);
      dc.lineWidth=_rr(1,5);
      dc.stroke();
    }
  }
  dc.restore();
}

function _drawTriangle(dc,W,H,pal,op){
  /* Random triangles */
  var count=_ri(1,4);
  dc.save();
  dc.globalAlpha=op;
  dc.shadowBlur=0;
  for(var i=0;i<count;i++){
    var cx=_rr(W*.1,W*.9),cy=_rr(H*.1,H*.9);
    var spread=_rr(30,Math.min(W,H)*.3);
    dc.beginPath();
    for(var v=0;v<3;v++){
      var a=(v/3)*Math.PI*2+_rr(-0.3,0.3);
      var px=cx+Math.cos(a)*spread,py=cy+Math.sin(a)*spread;
      v===0?dc.moveTo(px,py):dc.lineTo(px,py);
    }
    dc.closePath();
    var mode=_pick(['fill','stroke','both']);
    if(mode==='fill'||mode==='both'){dc.fillStyle=_palCol(pal,_rr(0.1,0.5));dc.fill();}
    if(mode==='stroke'||mode==='both'){dc.strokeStyle=_palCol(pal,1);dc.lineWidth=_rr(1,5);dc.stroke();}
  }
  dc.restore();
}

function _drawShape(dc,W,H,pal,op){
  /* Freeform closed shape */
  var verts=_ri(5,12);
  var cx=_rr(W*.15,W*.85),cy=_rr(H*.15,H*.85);
  var rad=_rr(30,Math.min(W,H)*.3);
  dc.save();
  dc.globalAlpha=op;
  dc.shadowBlur=0;
  dc.beginPath();
  for(var i=0;i<verts;i++){
    var a=(i/verts)*Math.PI*2;
    var r=rad*_rr(0.4,1.4);
    var px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r;
    i===0?dc.moveTo(px,py):dc.lineTo(px,py);
  }
  dc.closePath();
  var mode=_pick(['fill','stroke','both']);
  if(mode==='fill'||mode==='both'){dc.fillStyle=_palCol(pal,_rr(0.08,0.4));dc.fill();}
  if(mode==='stroke'||mode==='both'){dc.strokeStyle=_palCol(pal,1);dc.lineWidth=_rr(1,4);dc.stroke();}
  dc.restore();
}

function _drawTexturemap(dc,W,H,pal,op){
  /* Scatter 8-24 texture stamps across the canvas */
  var types=window._texTypes||['noise','crosshatch','weave','hexgrid','dotmatrix','woodgrain','brick','wavelines','circuit','lace'];
  var type=_pick(types);
  var stamps=_ri(8,24);
  var p=PALS[pal];
  var col=(p&&p.c&&p.c.length)?_pick(p.c):'#ffffff';
  for(var i=0;i<stamps;i++){
    var sx=_rr(W*.05,W*.95),sy=_rr(H*.05,H*.95);
    var sz=_ri(30,Math.min(W,H)*0.2);
    var r2=Math.round(sz/2);
    var dia=r2*2;
    /* Generate texture tile */
    var tile=window._genTexture?window._genTexture(type,dia,dia,col,_ri(20,80)):null;
    if(!tile)continue;
    /* Soft-edged mask */
    var mask=document.createElement('canvas');mask.width=dia;mask.height=dia;
    var mc=mask.getContext('2d');
    var grad=mc.createRadialGradient(r2,r2,r2*0.3,r2,r2,r2);
    grad.addColorStop(0,'rgba(255,255,255,1)');
    grad.addColorStop(0.7,'rgba(255,255,255,0.6)');
    grad.addColorStop(1,'rgba(255,255,255,0)');
    mc.fillStyle=grad;mc.fillRect(0,0,dia,dia);
    mc.globalCompositeOperation='source-in';
    mc.drawImage(tile,0,0);
    /* Stamp */
    dc.save();
    dc.globalAlpha=op;
    dc.drawImage(mask,Math.round(sx-r2),Math.round(sy-r2));
    dc.restore();
  }
}

var TOOL_FN={brush:_drawBrush,pencil:_drawPencil,line:_drawLine,rect:_drawRect,
             ellipse:_drawEllipse,triangle:_drawTriangle,shape:_drawShape,texturemap:_drawTexturemap};

/* ── Strategy-driven composition ── */
function drawHHOverlay(palKey){
  var dvEl=document.getElementById('dv');
  if(!dvEl)return;
  var dc=dvEl.getContext('2d');
  var W=dvEl.width,H=dvEl.height;
  var strategy=_pick(STRATEGIES);

  /* Clear drawing canvas for fresh overlay */
  dc.clearRect(0,0,W,H);

  /* Pick 2-5 random tools to use */
  var numOps=_ri(2,5);
  var toolsUsed=[];

  if(strategy==='scatter'){
    /* Random tools at random positions */
    for(var i=0;i<numOps;i++){
      var t=_pick(DRAW_TOOLS);toolsUsed.push(t);
      TOOL_FN[t](dc,W,H,palKey,_rr(0.3,0.85));
    }
  }
  else if(strategy==='radial'){
    /* Elements radiating from a focal point */
    var fx=_rr(W*.25,W*.75),fy=_rr(H*.25,H*.75);
    var rays=_ri(4,12);
    dc.save();dc.globalAlpha=_rr(0.3,0.7);
    dc.strokeStyle=_palCol(palKey,1);dc.lineWidth=_rr(1,4);dc.lineCap='round';
    for(var i=0;i<rays;i++){
      var a=(i/rays)*Math.PI*2+_rr(-0.2,0.2);
      var len=_rr(50,Math.min(W,H)*.45);
      dc.beginPath();dc.moveTo(fx,fy);
      dc.lineTo(fx+Math.cos(a)*len,fy+Math.sin(a)*len);dc.stroke();
    }
    dc.restore();
    /* Add shape accents at endpoints */
    for(var i=0;i<Math.min(numOps,3);i++){
      var t=_pick(['ellipse','triangle','shape']);toolsUsed.push(t);
      TOOL_FN[t](dc,W,H,palKey,_rr(0.2,0.55));
    }
    toolsUsed.push('line(radial)');
  }
  else if(strategy==='flow'){
    /* Multiple flowing brush/pencil curves */
    var flowCount=_ri(3,7);
    for(var i=0;i<flowCount;i++){
      var t=_pick(['brush','pencil','brush']);toolsUsed.push(t);
      TOOL_FN[t](dc,W,H,palKey,_rr(0.25,0.7));
    }
    /* Add a couple shapes as accents */
    if(Math.random()>0.4){var t2=_pick(['ellipse','rect']);toolsUsed.push(t2);
      TOOL_FN[t2](dc,W,H,palKey,_rr(0.1,0.35));}
  }
  else if(strategy==='grid'){
    /* Structured grid of shapes */
    var cols=_ri(2,5),rows=_ri(2,5);
    var cellW=W/cols,cellH=H/rows;
    var gTool=_pick(['rect','ellipse','triangle']);toolsUsed.push(gTool+'(grid)');
    dc.save();dc.globalAlpha=_rr(0.2,0.6);dc.shadowBlur=0;
    for(var r=0;r<rows;r++){for(var c=0;c<cols;c++){
      var cx2=c*cellW+cellW/2,cy2=r*cellH+cellH/2;
      var sz=Math.min(cellW,cellH)*_rr(0.3,0.8)/2;
      dc.fillStyle=_palCol(palKey,_rr(0.15,0.5));
      dc.strokeStyle=_palCol(palKey,1);dc.lineWidth=_rr(1,3);
      dc.beginPath();
      if(gTool==='rect'){dc.rect(cx2-sz,cy2-sz,sz*2,sz*2);}
      else if(gTool==='ellipse'){dc.ellipse(cx2,cy2,sz*_rr(0.6,1),sz*_rr(0.6,1),0,0,Math.PI*2);}
      else{for(var v2=0;v2<3;v2++){var a2=(v2/3)*Math.PI*2-Math.PI/2;
        v2===0?dc.moveTo(cx2+Math.cos(a2)*sz,cy2+Math.sin(a2)*sz):dc.lineTo(cx2+Math.cos(a2)*sz,cy2+Math.sin(a2)*sz);}dc.closePath();}
      _pick(['fill','stroke','both'])==='stroke'?dc.stroke():(dc.fill(),dc.stroke());
    }}
    dc.restore();
    /* Add a flowing accent */
    _drawBrush(dc,W,H,palKey,_rr(0.15,0.4));toolsUsed.push('brush');
  }
  else if(strategy==='burst'){
    /* Concentrated activity at 1-2 focal points */
    var foci=_ri(1,2);
    for(var f=0;f<foci;f++){
      var fx2=_rr(W*.2,W*.8),fy2=_rr(H*.2,H*.8);
      var burstN=_ri(5,15);
      dc.save();
      for(var i=0;i<burstN;i++){
        var t=_pick(DRAW_TOOLS);
        /* Bias positions toward focal point */
        dc.save();
        dc.translate(fx2-W/2,fy2-H/2);
        TOOL_FN[t](dc,W,H,palKey,_rr(0.15,0.6));
        dc.restore();
      }
      dc.restore();
      toolsUsed.push('burst('+burstN+')');
    }
  }
  else if(strategy==='crosshatch'){
    /* Overlapping line groups at different angles */
    var groups=_ri(2,4);
    dc.save();dc.lineCap='round';
    for(var g=0;g<groups;g++){
      var angle=_rr(0,Math.PI);
      var spacing=_rr(15,60);
      var lineCount=Math.ceil(Math.max(W,H)/spacing);
      dc.strokeStyle=_palCol(palKey,1);
      dc.lineWidth=_rr(1,4);
      dc.globalAlpha=_rr(0.2,0.5);
      for(var i=0;i<lineCount;i++){
        var offset=i*spacing-Math.max(W,H)*0.5;
        var cos=Math.cos(angle),sin=Math.sin(angle);
        var cx3=W/2+cos*offset,cy3=H/2+sin*offset;
        var halfD=Math.max(W,H);
        dc.beginPath();
        dc.moveTo(cx3-sin*halfD,cy3+cos*halfD);
        dc.lineTo(cx3+sin*halfD,cy3-cos*halfD);
        dc.stroke();
      }
    }
    dc.restore();
    toolsUsed.push('crosshatch('+groups+')');
    /* Shape accents */
    if(Math.random()>0.5){var ta=_pick(['ellipse','shape']);TOOL_FN[ta](dc,W,H,palKey,_rr(0.15,0.4));toolsUsed.push(ta);}
  }
  else if(strategy==='constellation'){
    /* Dots/circles connected by thin lines */
    var starN=_ri(8,30);
    var stars=[];
    for(var i=0;i<starN;i++)stars.push({x:_rr(W*.05,W*.95),y:_rr(H*.05,H*.95),r:_rr(2,10)});
    dc.save();dc.globalAlpha=_rr(0.4,0.8);
    /* Draw connecting lines */
    dc.strokeStyle=_palCol(palKey,0.6);dc.lineWidth=_rr(0.5,2);dc.lineCap='round';
    for(var i=0;i<stars.length;i++){
      for(var j=i+1;j<stars.length;j++){
        var dx=stars[j].x-stars[i].x,dy=stars[j].y-stars[i].y;
        if(Math.sqrt(dx*dx+dy*dy)<_rr(80,250)){
          dc.beginPath();dc.moveTo(stars[i].x,stars[i].y);dc.lineTo(stars[j].x,stars[j].y);dc.stroke();
        }
      }
    }
    /* Draw star dots */
    for(var i=0;i<stars.length;i++){
      dc.fillStyle=_palCol(palKey,1);
      dc.beginPath();dc.arc(stars[i].x,stars[i].y,stars[i].r,0,Math.PI*2);dc.fill();
    }
    dc.restore();
    toolsUsed.push('constellation('+starN+')');
    /* Maybe add a flowing accent */
    if(Math.random()>0.5){_drawBrush(dc,W,H,palKey,_rr(0.15,0.4));toolsUsed.push('brush');}
  }

  return {strategy:strategy,tools:toolsUsed};
}

/* ── History strip (thumbnail row) ── */
function renderHHStrip(){
  var strip=document.getElementById('hh-hist-strip');
  var wrap=document.getElementById('hh-hist-wrap');
  if(!strip||!wrap)return;
  if(window._hhHist.entries.length===0){wrap.style.display='none';return;}
  wrap.style.display='block';
  strip.innerHTML='';
  var entries=window._hhHist.entries.slice(-12);
  var globalOffset=Math.max(0,window._hhHist.entries.length-12);
  entries.forEach(function(entry,localIdx){
    var globalIdx=globalOffset+localIdx;
    var div=document.createElement('div');
    div.style.cssText='position:relative;flex-shrink:0;width:52px;';
    var th=document.createElement('canvas');th.width=52;th.height=52;
    th.style.cssText='display:block;border:1px solid rgba(255,255,255,0.2);border-radius:2px 2px 0 0;cursor:pointer;';
    var thctx=th.getContext('2d');thctx.drawImage(entry.img,0,0,52,52);
    div.appendChild(th);
    th.addEventListener('click',function(){
      /* Restore composite: engine → cv, drawing → dv */
      var cvEl=document.getElementById('cv'),dvEl=document.getElementById('dv');
      if(cvEl&&entry.engImg){var cc=cvEl.getContext('2d');cc.clearRect(0,0,cvEl.width,cvEl.height);cc.drawImage(entry.engImg,0,0,cvEl.width,cvEl.height);}
      if(dvEl&&entry.drawImg){var dd=dvEl.getContext('2d');dd.clearRect(0,0,dvEl.width,dvEl.height);dd.drawImage(entry.drawImg,0,0,dvEl.width,dvEl.height);}
      var lbl=document.getElementById('hh-mood-label');if(lbl)lbl.textContent=entry.mood;
      strip.querySelectorAll('canvas').forEach(function(c){c.style.borderColor='rgba(255,255,255,0.2)';});
      th.style.borderColor='#E8F50A';
    });
    var btnRow=document.createElement('div');
    btnRow.style.cssText='display:flex;gap:1px;';
    var btnBase='flex:1;border:none;font-family:inherit;font-size:8px;padding:2px 0;cursor:pointer;letter-spacing:.04em;';
    var delBtn=document.createElement('button');
    delBtn.textContent='✕ Del';delBtn.title='Delete this result';
    delBtn.style.cssText=btnBase+'background:#5a2020;color:#ff8080;border-radius:0 0 0 2px;';
    delBtn.addEventListener('click',function(e){e.stopPropagation();window._hhHist.entries.splice(globalIdx,1);renderHHStrip();});
    var saveBtn=document.createElement('button');
    saveBtn.textContent='↓ PNG';saveBtn.title='Export composite as PNG';
    saveBtn.style.cssText=btnBase+'background:#1a3a2a;color:#40c8a0;border-radius:0 0 2px 0;';
    saveBtn.addEventListener('click',function(e){
      e.stopPropagation();
      var tmp=document.createElement('canvas');tmp.width=entry.img.width;tmp.height=entry.img.height;
      tmp.getContext('2d').drawImage(entry.img,0,0);
      var fname='neoleo-hh-'+entry.mood.replace(/\s+/g,'-').toLowerCase()+'.png';
      var savedUrl=tmp.toDataURL('image/png');
      var a=document.createElement('a');
      a.download=fname;
      a.href=savedUrl;a.click();
      if(window._showSaveStatus)window._showSaveStatus(fname, savedUrl);
      else setI('\u2713 Image saved: '+fname);
    });
    btnRow.appendChild(delBtn);btnRow.appendChild(saveBtn);
    div.appendChild(btnRow);strip.appendChild(div);
  });
}

/* ── Capture full composite (all visible canvases) ── */
function captureHH(moodName,info){
  var cvEl=document.getElementById('cv'),dvEl=document.getElementById('dv'),
      uvEl=document.getElementById('uv'),lvEl=document.getElementById('lv'),
      avEl=document.getElementById('av');
  if(!cvEl)return;
  var W=cvEl.width,H=cvEl.height;
  /* Full composite thumbnail */
  var comp=document.createElement('canvas');comp.width=W;comp.height=H;
  var cc=comp.getContext('2d');
  if(uvEl)cc.drawImage(uvEl,0,0);
  cc.drawImage(cvEl,0,0);
  if(lvEl)cc.drawImage(lvEl,0,0);
  if(dvEl)cc.drawImage(dvEl,0,0);
  if(avEl)cc.drawImage(avEl,0,0);
  /* Separate engine + draw snapshots for restore */
  var engSnap=document.createElement('canvas');engSnap.width=W;engSnap.height=H;
  engSnap.getContext('2d').drawImage(cvEl,0,0);
  var drawSnap=document.createElement('canvas');drawSnap.width=W;drawSnap.height=H;
  if(dvEl)drawSnap.getContext('2d').drawImage(dvEl,0,0);
  var label=moodName;
  if(info)label+=' ['+info.strategy+': '+info.tools.join(', ')+']';
  window._hhHist.entries.push({img:comp,engImg:engSnap,drawImg:drawSnap,mood:moodName,info:info});
  if(window._hhHist.entries.length>16)window._hhHist.entries.shift();
  renderHHStrip();
}

/* ── Main trigger ── */
/* ── HH Processing Popup ── */
var _hhPopup=(function(){
  var el=null,phaseEl=null,moodEl=null,barEl=null,dotInt=null;
  function _make(){
    if(el)return;
    el=document.createElement('div');
    el.id='hh-popup';
    el.style.cssText=[
      'display:none','position:absolute','top:50%','left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(6,6,14,0.95)',
      'border:1px solid #E8F50A','border-radius:8px',
      'padding:24px 36px 22px',
      'font-family:inherit','pointer-events:none','z-index:55',
      'text-align:center','min-width:260px',
      'box-shadow:0 0 40px rgba(232,245,10,0.15),inset 0 1px 0 rgba(255,255,255,0.04)'
    ].join(';')+';';

    el.innerHTML=[
      /* Title */
      '<div style="font-size:10px;letter-spacing:.24em;color:#E8F50A;',
        'text-transform:uppercase;font-weight:700;',
        'line-height:1.4;margin-bottom:14px;',
        'padding-bottom:12px;border-bottom:1px solid rgba(232,245,10,0.15);">',
        '&#10024; Happy Hallucinations</div>',

      /* Mood name */
      '<div id="hh-pop-mood" style="font-size:14px;color:#ffffff;',
        'font-weight:600;line-height:1.5;',
        'margin-bottom:16px;padding:0 4px;"></div>',

      /* Progress bar */
      '<div style="width:100%;height:4px;background:rgba(255,255,255,0.08);',
        'border-radius:3px;overflow:hidden;margin-bottom:16px;">',
        '<div id="hh-pop-bar" style="height:100%;width:0%;',
          'background:linear-gradient(90deg,#E8F50A,#40c8a0);',
          'border-radius:3px;transition:width 0.4s ease;"></div>',
      '</div>',

      /* Phase label */
      '<div id="hh-pop-phase" style="font-size:10px;letter-spacing:.1em;',
        'color:rgba(255,255,255,0.55);text-transform:uppercase;',
        'line-height:1.6;min-height:1.6em;padding:0 4px;"></div>'
    ].join('');

    var wrap=document.getElementById('cvwrap');
    if(wrap){wrap.style.position='relative';wrap.appendChild(el);}
    phaseEl=document.getElementById('hh-pop-phase');
    moodEl=document.getElementById('hh-pop-mood');
    barEl=document.getElementById('hh-pop-bar');
  }
  return {
    show:function(moodName){
      _make();
      if(moodEl)moodEl.textContent=moodName;
      if(phaseEl)phaseEl.textContent='Initializing\u2026';
      if(barEl)barEl.style.width='5%';
      el.style.display='block';
      var pulse=true;
      if(dotInt)clearInterval(dotInt);
      dotInt=setInterval(function(){
        if(el.style.display==='none'){clearInterval(dotInt);return;}
        pulse=!pulse;
        el.style.borderColor=pulse?'#E8F50A':'rgba(232,245,10,0.35)';
      },500);
    },
    phase:function(text,pct){
      _make();
      if(phaseEl)phaseEl.textContent=text;
      if(barEl)barEl.style.width=pct+'%';
    },
    hide:function(){
      if(dotInt){clearInterval(dotInt);dotInt=null;}
      if(el){
        if(barEl)barEl.style.width='100%';
        if(phaseEl)phaseEl.textContent='Complete \u2713';
        el.style.borderColor='#40c8a0';
        setTimeout(function(){el.style.display='none';el.style.borderColor='#E8F50A';},700);
      }
    }
  };
})();

function doHappyHallucination(){
  var mood=MOODS[Math.floor(Math.random()*MOODS.length)];

  /* Show mood label */
  var lbl=document.getElementById('hh-mood-label');
  if(lbl)lbl.textContent='\u2728 '+mood.name+' \u2026generating';

  /* Show processing popup */
  _hhPopup.show(mood.name);

  /* 0. Close exp-body if open */
  var expBody=document.getElementById('exp-body');
  if(expBody&&expBody.classList.contains('open')){
    expBody.classList.remove('open');
    var expToggle=document.getElementById('exp-toggle');
    if(expToggle){var chev=expToggle.querySelector('.chev');if(chev)chev.style.transform='rotate(180deg)';}
  }

  /* 1. Set palette */
  var palSel=document.getElementById('pal');
  if(palSel){palSel.value=mood.pal;palSel.dispatchEvent(new Event('change'));}

  /* Update popup: engine phase */
  _hhPopup.phase('Rendering engine: '+mood.engine+'\u2026',25);

  /* 2. Click engine button → triggers generate() */
  var engBtn=document.querySelector('.eng[data-e="'+mood.engine+'"]');
  if(engBtn){
    engBtn.click();
  } else {
    var gbtn=document.getElementById('gbtn');
    if(gbtn)gbtn.click();
  }

  /* 3. After engine renders → draw tool overlay → flatten → capture */
  setTimeout(function(){
    _hhPopup.phase('Applying drawing tools\u2026',60);

    setTimeout(function(){
      var info=drawHHOverlay(mood.pal);

      _hhPopup.phase('Flattening composite\u2026',80);

      /* ── Flatten: merge dv overlay into cv so all tools can affect the result ── */
      var cvEl=document.getElementById('cv'),dvEl=document.getElementById('dv');
      if(cvEl&&dvEl){
        var cctx=cvEl.getContext('2d');
        cctx.drawImage(dvEl,0,0);         /* Stamp dv overlay onto cv */
        dvEl.getContext('2d').clearRect(0,0,dvEl.width,dvEl.height); /* Clear dv */
      }
      /* Reset layers so drawing tools start fresh on top of the flattened image */
      if(window._layersReset)window._layersReset();
      /* Push genUndo so this state is undoable */
      if(window.genUndoPush)window.genUndoPush();

      _hhPopup.phase('Compositing: '+(info?info.strategy:'')+'\u2026',90);

      /* Update label with composite info */
      if(lbl){
        var toolStr=info?info.tools.map(function(t){return t.split('(')[0];}).filter(function(v,i,a){return a.indexOf(v)===i;}).join('+'):'';
        lbl.textContent='\u2728 '+mood.name+(info?' \u00B7 '+info.strategy+(toolStr?' \u00B7 '+toolStr:''):'');
      }

      /* Capture and hide popup */
      setTimeout(function(){
        captureHH(mood.name,info);
        _hhPopup.hide();
      },300);
    },100);
  },1200);
}

setTimeout(function(){
  var btn=document.getElementById('hh-btn');
  if(btn)btn.addEventListener('click',doHappyHallucination);

  /* ── Multi-Pass Blend — floating panel with controls ── */
  var multiBtn=document.getElementById('hh-multi-btn');
  var _mpPanel=null,_mpOpen=false,_mpPos=null;

  function buildMPPanel(){
    if(_mpPanel)return;
    var sty=document.createElement('style');
    sty.textContent=[
      '#mp-panel{display:none;position:fixed;z-index:620;',
      '  width:300px;max-height:calc(100vh - 40px);',
      '  background:#1e1a38;',
      '  border:1px solid rgba(255,255,255,0.2);border-radius:8px;',
      '  box-shadow:0 10px 50px rgba(0,0,0,0.85);',
      '  font-family:inherit;overflow:hidden;flex-direction:column;}',
      '#mp-panel.open{display:flex;}',
      '#mp-head{display:flex;align-items:center;justify-content:space-between;',
      '  padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.1);',
      '  background:rgba(0,0,0,0.15);flex-shrink:0;',
      '  cursor:grab;user-select:none;-webkit-user-select:none;',
      '  border-radius:8px 8px 0 0;}',
      '#mp-panel input[type=range]{-webkit-appearance:none;height:3px;',
      '  background:rgba(255,255,255,0.15);outline:none;cursor:pointer;border-radius:2px;}',
      '#mp-panel input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;',
      '  width:12px;height:12px;border-radius:50%;background:#ffffff;cursor:pointer;border:none;}',
      '#mp-panel select{background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);',
      '  color:#ffffff;font-family:inherit;font-size:9px;padding:4px 6px;cursor:pointer;border-radius:3px;}',
    ].join('\n');
    document.head.appendChild(sty);

    _mpPanel=document.createElement('div');
    _mpPanel.id='mp-panel';

    function sldr(id,label,val,min,max,suffix){
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
        +'<span style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.06em;text-transform:uppercase;min-width:70px;line-height:1.5;">'+label+'</span>'
        +'<input type="range" id="'+id+'" min="'+min+'" max="'+max+'" value="'+val+'" style="flex:1;">'
        +'<span id="'+id+'-v" style="font-size:9px;color:rgba(255,255,255,0.6);min-width:30px;text-align:right;">'+val+(suffix||'')+'</span>'
        +'</div>';
    }

    _mpPanel.innerHTML=[
      '<div id="mp-head">',
      '  <div>',
      '    <div style="font-size:10px;letter-spacing:.2em;color:#ffffff;text-transform:uppercase;font-weight:700;line-height:1.6;">\u2728\u2728 Multi-Pass Blend</div>',
      '    <div style="font-size:8px;color:#40c8a0;margin-top:2px;line-height:1.5;">Composite multiple HH passes with blending</div>',
      '  </div>',
      '  <button id="mp-close" style="background:none;border:1px solid rgba(255,255,255,0.15);color:#888;font-size:9px;padding:4px 10px;cursor:pointer;border-radius:3px;font-family:inherit;">Close</button>',
      '</div>',
      '<div style="padding:14px;overflow-y:auto;flex:1;">',

      /* Pass count */
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">',
      '  <span style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.06em;text-transform:uppercase;min-width:70px;line-height:1.5;">Passes</span>',
      '  <input type="number" id="mp-passes" min="1" max="6" value="3" style="width:50px;padding:5px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#ffffff;font-family:inherit;font-size:11px;font-weight:700;text-align:center;cursor:pointer;border-radius:3px;outline:none;-moz-appearance:textfield;">',
      '  <span style="font-size:8px;color:rgba(255,255,255,0.3);line-height:1.5;">1\u20136</span>',
      '</div>',

      '<div style="height:1px;background:rgba(232,245,10,0.08);margin:4px 0 12px;"></div>',
      '<div style="font-size:8px;color:rgba(255,255,255,0.35);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;line-height:1.5;">Blend Controls</div>',

      /* Engine blend */
      sldr('mp-eng-blend','Engine Mix',60,10,100,'%'),

      /* Overlay blend */
      sldr('mp-ovr-blend','Overlay Mix',70,10,100,'%'),

      /* Overall opacity */
      sldr('mp-opacity','Pass Opacity',65,10,100,'%'),

      /* Blend mode */
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">',
      '  <span style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.06em;text-transform:uppercase;min-width:70px;line-height:1.5;">Blend Mode</span>',
      '  <select id="mp-blend-mode" style="flex:1;">',
      '    <option value="random" selected>Random (per pass)</option>',
      '    <option value="source-over">Normal</option>',
      '    <option value="screen">Screen</option>',
      '    <option value="overlay">Overlay</option>',
      '    <option value="multiply">Multiply</option>',
      '    <option value="color-dodge">Color Dodge</option>',
      '    <option value="soft-light">Soft Light</option>',
      '    <option value="hard-light">Hard Light</option>',
      '    <option value="difference">Difference</option>',
      '    <option value="exclusion">Exclusion</option>',
      '    <option value="luminosity">Luminosity</option>',
      '  </select>',
      '</div>',

      /* Decay */
      sldr('mp-decay','Decay',15,0,50,'%'),

      '<div style="font-size:7px;color:rgba(255,255,255,0.25);margin-bottom:12px;line-height:1.6;">Decay reduces opacity each pass for natural depth falloff</div>',

      /* Active palette control — mirrors main panel */
      '<div style="height:1px;background:rgba(232,245,10,0.08);margin:4px 0 12px;"></div>',
      '<div style="font-size:8px;color:rgba(255,255,255,0.35);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;line-height:1.5;">Active Palette</div>',
      '<div id="mp-swrow" style="display:flex;gap:3px;height:13px;margin-bottom:8px;"></div>',
      '<select id="mp-active-pal" style="width:100%;margin-bottom:12px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);color:#ffffff;font-family:inherit;font-size:9px;padding:4px 6px;cursor:pointer;border-radius:3px;">',
      '  <option value="ember">Ember</option>',
      '  <option value="ink">Ink &amp; Paper</option>',
      '  <option value="ocean">Deep Ocean</option>',
      '  <option value="neon">Neon Circuit</option>',
      '  <option value="earth">Earth Strata</option>',
      '  <option value="ghost">Ghost</option>',
      '  <option value="aurora">Aurora</option>',
      '  <option value="void">Void</option>',
      '  <option value="rust">Rust &amp; Salt</option>',
      '  <option value="botanic">Botanic</option>',
      '  <option value="custom">&#10022; Custom</option>',
      '</select>',

      /* Per-pass palette assignment */
      '<div style="height:1px;background:rgba(232,245,10,0.08);margin:4px 0 12px;"></div>',
      '<div style="font-size:8px;color:rgba(255,255,255,0.35);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;line-height:1.5;">Pass Palettes</div>',
      '<div id="mp-pal-list" style="margin-bottom:12px;"></div>',

      /* Image adjustments */
      '<div style="height:1px;background:rgba(232,245,10,0.08);margin:4px 0 12px;"></div>',
      '<div style="font-size:8px;color:rgba(255,255,255,0.35);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;line-height:1.5;">Image Adjustments</div>',

      sldr('mp-brightness','Brightness',100,20,200,'%'),
      sldr('mp-contrast','Contrast',100,20,200,'%'),
      sldr('mp-hue','Hue',0,0,360,'\u00B0'),
      sldr('mp-saturation','Saturation',100,0,200,'%'),
      sldr('mp-exposure','Exposure',0,-100,100,''),
      sldr('mp-curves','Curves',100,20,200,''),

      '<div style="font-size:7px;color:rgba(255,255,255,0.25);margin-bottom:12px;line-height:1.6;">Adjustments apply in real-time via CSS filters</div>',

      /* Progress display */
      '<div id="mp-progress" style="display:none;margin-bottom:10px;padding:8px;background:rgba(232,245,10,0.05);border:1px solid rgba(232,245,10,0.1);border-radius:4px;">',
      '  <div id="mp-status" style="font-size:9px;color:#E8F50A;margin-bottom:4px;line-height:1.5;">Ready</div>',
      '  <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;">',
      '    <div id="mp-bar" style="height:100%;width:0%;background:#E8F50A;border-radius:2px;transition:width .3s;"></div>',
      '  </div>',
      '</div>',

      /* Run button */
      '<button id="mp-run" style="width:100%;padding:10px;background:rgba(232,245,10,0.15);border:1px solid rgba(232,245,10,0.4);color:#E8F50A;font-family:inherit;font-size:11px;cursor:pointer;letter-spacing:.12em;text-transform:uppercase;font-weight:700;border-radius:4px;">\u25B6 Generate Multi-Pass</button>',

      /* Save / Reset row */
      '<div style="display:flex;gap:6px;margin-top:8px;">',
      '  <button id="mp-save-settings" style="flex:1;padding:7px;background:rgba(64,200,160,0.12);border:1px solid rgba(64,200,160,0.4);color:#40c8a0;font-family:inherit;font-size:9px;cursor:pointer;letter-spacing:.1em;text-transform:uppercase;font-weight:600;border-radius:4px;">&#9632; Save Settings</button>',
      '  <button id="mp-reset-settings" style="flex:1;padding:7px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);font-family:inherit;font-size:9px;cursor:pointer;letter-spacing:.1em;text-transform:uppercase;font-weight:600;border-radius:4px;">\u21BA Reset</button>',
      '</div>',
      '<div id="mp-settings-status" style="font-size:7px;color:rgba(255,255,255,0.3);margin-top:4px;text-align:center;min-height:12px;line-height:1.5;"></div>',

      '</div>',
    ].join('\n');
    document.body.appendChild(_mpPanel);

    /* Drag */
    var head=document.getElementById('mp-head');
    head.addEventListener('mousedown',function(e){
      if(e.target.id==='mp-close'||e.target.closest('#mp-close'))return;
      e.preventDefault();head.style.cursor='grabbing';
      var r=_mpPanel.getBoundingClientRect();
      var drag={sx:e.clientX,sy:e.clientY,ol:r.left,ot:r.top};
      function mv(ev){
        var nl=Math.max(0,Math.min(window.innerWidth-60,drag.ol+(ev.clientX-drag.sx)));
        var nt=Math.max(0,Math.min(window.innerHeight-40,drag.ot+(ev.clientY-drag.sy)));
        _mpPanel.style.left=nl+'px';_mpPanel.style.top=nt+'px';_mpPos={left:nl,top:nt};
      }
      function up(){head.style.cursor='grab';document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
      document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
    });

    /* Close */
    document.getElementById('mp-close').addEventListener('click',function(){
      _mpPanel.classList.remove('open');_mpOpen=false;
      /* Clear adjustment filter when closing */
      var cvEl=document.getElementById('cv');
      if(cvEl)cvEl.style.filter='none';
    });

    /* ── Per-pass palette assignment ── */
    var PAL_NAMES=[
      {v:'random',l:'Random (colorful)'},
      {v:'ember',l:'Ember'},{v:'ink',l:'Ink & Paper'},{v:'ocean',l:'Deep Ocean'},
      {v:'neon',l:'Neon Circuit'},{v:'earth',l:'Earth Strata'},{v:'ghost',l:'Ghost'},
      {v:'aurora',l:'Aurora'},{v:'void',l:'Void'},{v:'rust',l:'Rust & Salt'},
      {v:'botanic',l:'Botanic'},{v:'custom',l:'\u2726 Custom'}
    ];

    /* Colorful defaults for each pass position */
    var PAL_DEFAULTS=['ember','neon','aurora','ocean','rust','botanic'];
    /* Colorful-only pool for random selection (excludes ghost, void, ink) */
    var PAL_COLORFUL=['ember','ocean','neon','earth','aurora','rust','botanic'];

    function buildPalList(){
      var wrap=document.getElementById('mp-pal-list');
      if(!wrap)return;
      var count=Math.max(1,Math.min(6,parseInt(document.getElementById('mp-passes').value)||3));
      wrap.innerHTML='';
      for(var i=0;i<count;i++){
        var row=document.createElement('div');
        row.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:5px;';

        var label=document.createElement('span');
        label.style.cssText='font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.06em;text-transform:uppercase;min-width:48px;line-height:1.5;';
        label.textContent='Pass '+(i+1);
        row.appendChild(label);

        /* Color swatch */
        var swatch=document.createElement('span');
        swatch.className='mp-pal-sw';
        swatch.style.cssText='width:14px;height:14px;border-radius:2px;border:1px solid rgba(255,255,255,0.15);flex-shrink:0;';
        row.appendChild(swatch);

        var sel=document.createElement('select');
        sel.id='mp-pal-'+i;
        sel.style.cssText='flex:1;background:rgba(232,245,10,0.08);border:1px solid rgba(232,245,10,0.15);color:#E8F50A;font-family:inherit;font-size:9px;padding:4px 6px;cursor:pointer;border-radius:3px;';
        PAL_NAMES.forEach(function(p){
          var opt=document.createElement('option');
          opt.value=p.v;opt.textContent=p.l;
          sel.appendChild(opt);
        });

        /* Set default palette for this pass */
        var defPal=PAL_DEFAULTS[i]||'ember';
        sel.value=defPal;

        /* Set swatch to default palette colors */
        var defP=PALS[defPal];
        if(defP&&defP.c&&defP.c.length>=3){
          swatch.style.background='linear-gradient(135deg,'+defP.c[0]+','+defP.c[1]+','+defP.c[2]+')';
        }

        /* Update swatch on change */
        (function(sw,s){
          s.addEventListener('change',function(){
            var v=s.value;
            if(v==='random'){
              sw.style.background='linear-gradient(135deg,#E8F50A,#ff6200,#00ffff)';
            } else {
              var pal=PALS[v];
              if(pal&&pal.c&&pal.c.length>=3){
                sw.style.background='linear-gradient(135deg,'+pal.c[0]+','+pal.c[1]+','+pal.c[2]+')';
              } else {
                sw.style.background='#444';
              }
            }
          });
        })(swatch,sel);

        row.appendChild(sel);
        wrap.appendChild(row);
      }
    }

    /* Build initial list */
    buildPalList();

    /* Rebuild when pass count changes */
    var passInput=document.getElementById('mp-passes');
    if(passInput)passInput.addEventListener('input',buildPalList);

    /* ── Active Palette control — sync with main #pal ── */
    var mpActivePal=document.getElementById('mp-active-pal');
    var mpSwRow=document.getElementById('mp-swrow');

    function mpDrawSwatches(){
      if(!mpSwRow)return;
      var key=mpActivePal?mpActivePal.value:'ember';
      var p=PALS[key]||PALS.ember;
      mpSwRow.innerHTML='';
      var bg=document.createElement('div');
      bg.style.cssText='flex:1;border-radius:1px;background:'+(window._canvasBg||p.bg)+';border:1px solid #444;';
      mpSwRow.appendChild(bg);
      p.c.forEach(function(col){
        var s=document.createElement('div');
        s.style.cssText='flex:1;border-radius:1px;background:'+col+';cursor:pointer;';
        s.title=col;
        mpSwRow.appendChild(s);
      });
    }

    /* Sync MP selector to current main palette on panel open */
    if(mpActivePal){
      mpActivePal.value=document.getElementById('pal').value;
      mpDrawSwatches();

      /* When MP palette changes → update main palette + swatches */
      mpActivePal.addEventListener('change',function(){
        var mainPal=document.getElementById('pal');
        if(mainPal){
          mainPal.value=mpActivePal.value;
          mainPal.dispatchEvent(new Event('change'));
        }
        mpDrawSwatches();
      });
    }

    /* Listen for main palette changes to keep MP selector in sync */
    var _origPalChange=document.getElementById('pal').onchange;
    document.getElementById('pal').onchange=function(){
      if(_origPalChange)_origPalChange.call(this);
      if(mpActivePal&&_mpOpen){
        mpActivePal.value=document.getElementById('pal').value;
        mpDrawSwatches();
      }
    };

    /* ── Stored pass data for live re-compositing ── */
    var _mpPasses=[]; /* [{engine:canvas, overlay:canvas, mood:str, blend:str}] */
    var _mpBaseSnap=null; /* canvas state before multi-pass */
    var _mpLive=false; /* true when passes are rendered and sliders are live */
    var _mpRecompDebounce=null;

    var BLEND_MODES=['source-over','screen','overlay','multiply','color-dodge','soft-light','hard-light','difference','exclusion','luminosity'];

    /* ── Re-composite all stored passes with current slider values ── */
    function recomposite(){
      if(!_mpLive||!_mpPasses.length)return;
      var cvEl=document.getElementById('cv');
      if(!cvEl)return;
      var cctx=cvEl.getContext('2d');
      var W=cvEl.width,H=cvEl.height;

      var engBlend=(parseInt(document.getElementById('mp-eng-blend').value)||60)/100;
      var ovrBlend=(parseInt(document.getElementById('mp-ovr-blend').value)||70)/100;
      var passOpacity=(parseInt(document.getElementById('mp-opacity').value)||65)/100;
      var blendMode=document.getElementById('mp-blend-mode').value;
      var decay=(parseInt(document.getElementById('mp-decay').value)||15)/100;

      /* Start from base */
      cctx.clearRect(0,0,W,H);
      if(_mpBaseSnap)cctx.drawImage(_mpBaseSnap,0,0);

      /* Blend each pass */
      for(var p=0;p<_mpPasses.length;p++){
        var pass=_mpPasses[p];
        var thisOpacity=passOpacity*Math.pow(1-decay,p);
        thisOpacity=Math.max(0.05,thisOpacity);
        var thisBlend=(blendMode==='random')?pass.blend:blendMode;

        if(p===0){
          /* First pass: engine at full, overlay at full */
          cctx.save();
          cctx.globalAlpha=1;
          cctx.drawImage(pass.engine,0,0);
          cctx.restore();
          if(pass.overlay){
            cctx.save();
            cctx.globalAlpha=1;
            cctx.drawImage(pass.overlay,0,0);
            cctx.restore();
          }
        } else {
          /* Subsequent passes: blend with controls */
          cctx.save();
          cctx.globalAlpha=engBlend*thisOpacity;
          cctx.globalCompositeOperation=thisBlend;
          cctx.drawImage(pass.engine,0,0);
          cctx.restore();

          if(pass.overlay){
            cctx.save();
            cctx.globalAlpha=ovrBlend*thisOpacity;
            cctx.globalCompositeOperation=thisBlend;
            cctx.drawImage(pass.overlay,0,0);
            cctx.restore();
          }
        }
      }

      /* Update status */
      var statusEl=document.getElementById('mp-status');
      if(statusEl)statusEl.textContent='\u2728 Live \u2014 '+_mpPasses.length+' passes | Opacity '+Math.round(passOpacity*100)+'% | Decay '+Math.round(decay*100)+'%';
      applyAdjustments();
    }

    function liveRecomp(){
      if(_mpRecompDebounce)clearTimeout(_mpRecompDebounce);
      _mpRecompDebounce=setTimeout(recomposite,30);
    }

    /* ── Wire sliders for live recomposite ── */
    ['mp-eng-blend','mp-ovr-blend','mp-opacity','mp-decay'].forEach(function(id){
      var el=document.getElementById(id),vl=document.getElementById(id+'-v');
      if(el)el.addEventListener('input',function(){
        if(vl)vl.textContent=el.value+'%';
        if(_mpLive)liveRecomp();
      });
    });
    var bmSel=document.getElementById('mp-blend-mode');
    if(bmSel)bmSel.addEventListener('change',function(){if(_mpLive)liveRecomp();});

    /* ── Image adjustment CSS filters ── */
    function applyAdjustments(){
      var cvEl=document.getElementById('cv');
      if(!cvEl)return;

      var briEl=document.getElementById('mp-brightness');
      var conEl=document.getElementById('mp-contrast');
      var hueEl=document.getElementById('mp-hue');
      var satEl=document.getElementById('mp-saturation');
      var expEl=document.getElementById('mp-exposure');
      var curEl=document.getElementById('mp-curves');
      if(!briEl||!conEl||!hueEl||!satEl||!expEl||!curEl)return;

      var bri=parseInt(briEl.value);
      var con=parseInt(conEl.value);
      var hue=parseInt(hueEl.value);
      var sat=parseInt(satEl.value);
      var exp2=parseInt(expEl.value);
      var cur=parseInt(curEl.value);

      /* Skip when all defaults */
      if(bri===100&&con===100&&hue===0&&sat===100&&exp2===0&&cur===100){
        cvEl.style.filter='none';
        return;
      }

      var expBri=Math.pow(2,exp2/100);
      var curBri=cur/100;
      var totalBri=((bri/100)*expBri*curBri);
      var totalCon=(con/100);

      var parts=[];
      if(totalBri!==1)parts.push('brightness('+totalBri.toFixed(3)+')');
      if(totalCon!==1)parts.push('contrast('+totalCon.toFixed(3)+')');
      if(hue!==0)parts.push('hue-rotate('+hue+'deg)');
      if(sat!==100)parts.push('saturate('+(sat/100).toFixed(3)+')');
      if(!parts.length){cvEl.style.filter='none';return;}

      cvEl.style.filter=parts.join(' ');
    }

    /* Wire adjustment sliders — always apply, no need for _mpLive */
    var adjSuffixes={'mp-brightness':'%','mp-contrast':'%','mp-hue':'\u00B0','mp-saturation':'%','mp-exposure':'','mp-curves':''};
    ['mp-brightness','mp-contrast','mp-hue','mp-saturation','mp-exposure','mp-curves'].forEach(function(id){
      var el=document.getElementById(id),vl=document.getElementById(id+'-v');
      var sfx=adjSuffixes[id]||'';
      if(el)el.addEventListener('input',function(){
        if(vl)vl.textContent=el.value+sfx;
        applyAdjustments();
        if(_mpLive)liveRecomp();
      });
    });

    /* ── Run multi-pass: render all passes, store, then enable live ── */
    document.getElementById('mp-run').addEventListener('click',function(){
      var totalPasses=Math.max(1,Math.min(6,parseInt(document.getElementById('mp-passes').value)||3));

      var runBtn=document.getElementById('mp-run');
      var progWrap=document.getElementById('mp-progress');
      var statusEl=document.getElementById('mp-status');
      var barEl=document.getElementById('mp-bar');
      runBtn.disabled=true;runBtn.style.opacity='0.4';
      progWrap.style.display='block';
      _mpLive=false;
      _mpPasses=[];

      /* Save current palette so we can restore after rendering */
      var savedPal=document.getElementById('pal').value;

      /* Clear any prior adjustment filter */
      var cvEl2=document.getElementById('cv');
      if(cvEl2)cvEl2.style.filter='none';
      /* Also reset Image Signal adjustments to prevent grayscale */
      if(window._adjReset)window._adjReset();

      /* Save base state */
      var cvEl=document.getElementById('cv');
      _mpBaseSnap=document.createElement('canvas');
      _mpBaseSnap.width=cvEl.width;_mpBaseSnap.height=cvEl.height;
      _mpBaseSnap.getContext('2d').drawImage(cvEl,0,0);

      if(window.genUndoPush)window.genUndoPush();

      var currentPass=0;

      function renderPass(){
        currentPass++;
        if(currentPass>totalPasses){
          /* All passes rendered → enable live mode */
          _mpLive=true;
          recomposite();
          barEl.style.width='100%';
          statusEl.textContent='\u2728 Complete \u2014 drag sliders to adjust blend';
          runBtn.disabled=false;runBtn.style.opacity='1';
          runBtn.textContent='\u25B6 Re-Generate';
          var lbl=document.getElementById('hh-mood-label');
          if(lbl)lbl.textContent='\u2728 Multi-Pass Blend \u2014 '+totalPasses+' layers (live)';
          /* Restore palette to what it was before multi-pass */
          var palSel3=document.getElementById('pal');
          if(palSel3){palSel3.value=savedPal;palSel3.dispatchEvent(new Event('change'));}
          _hhPopup.hide();
          return;
        }

        var pct=Math.round((currentPass-1)/totalPasses*100);
        barEl.style.width=pct+'%';

        var mood=MOODS[Math.floor(Math.random()*MOODS.length)];
        var thisBlend=_pick(BLEND_MODES);

        /* Check per-pass palette assignment */
        var palSel2=document.getElementById('mp-pal-'+(currentPass-1));
        var usePal;
        if(palSel2&&palSel2.value!=='random'){
          usePal=palSel2.value;
        } else {
          /* Random: pick from colorful palettes only (no ghost/void/ink) */
          usePal=PAL_COLORFUL[Math.floor(Math.random()*PAL_COLORFUL.length)];
        }

        statusEl.textContent='Rendering pass '+currentPass+'/'+totalPasses+': '+mood.name+' ['+usePal+']';

        _hhPopup.show(mood.name+' (Pass '+currentPass+'/'+totalPasses+')');
        _hhPopup.phase('Rendering engine with '+usePal+'\u2026',30);

        /* Force palette globally before engine render */
        var palSel=document.getElementById('pal');
        if(palSel){palSel.value=usePal;palSel.dispatchEvent(new Event('change'));}

        /* Render engine */
        var engBtn=document.querySelector('.eng[data-e="'+mood.engine+'"]');
        if(engBtn)engBtn.click();

        setTimeout(function(){
          _hhPopup.phase('Capturing engine\u2026',50);

          /* Capture engine render */
          var W=cvEl.width,H=cvEl.height;
          var engCv=document.createElement('canvas');
          engCv.width=W;engCv.height=H;
          engCv.getContext('2d').drawImage(cvEl,0,0);

          _hhPopup.phase('Drawing overlay\u2026',70);

          setTimeout(function(){
            /* Draw overlay onto dv */
            var info=drawHHOverlay(usePal);

            /* Capture overlay */
            var dvEl=document.getElementById('dv');
            var ovrCv=null;
            if(dvEl){
              ovrCv=document.createElement('canvas');
              ovrCv.width=W;ovrCv.height=H;
              ovrCv.getContext('2d').drawImage(dvEl,0,0);
              dvEl.getContext('2d').clearRect(0,0,W,H);
            }
            if(window._layersReset)window._layersReset();

            /* Store pass */
            _mpPasses.push({engine:engCv,overlay:ovrCv,mood:mood.name,blend:thisBlend,info:info});

            captureHH(mood.name+' (P'+currentPass+')',info);

            _hhPopup.phase('Pass '+currentPass+' captured',90);

            setTimeout(function(){
              _hhPopup.hide();
              renderPass();
            },300);
          },100);
        },900);
      }

      renderPass();
    });

    /* ── Multi-Pass Save / Reset Settings ── */
    var _mpDefaults={
      'mp-passes':3,'mp-eng-blend':60,'mp-ovr-blend':70,'mp-opacity':65,
      'mp-blend-mode':'random','mp-decay':15,
      'mp-brightness':100,'mp-contrast':100,'mp-hue':0,'mp-saturation':100,
      'mp-exposure':0,'mp-curves':100
    };
    var _mpSliderIds=['mp-eng-blend','mp-ovr-blend','mp-opacity','mp-decay',
      'mp-brightness','mp-contrast','mp-hue','mp-saturation','mp-exposure','mp-curves'];
    var _mpSuffixes={'mp-eng-blend':'%','mp-ovr-blend':'%','mp-opacity':'%','mp-decay':'%',
      'mp-brightness':'%','mp-contrast':'%','mp-hue':'\u00B0','mp-saturation':'%','mp-exposure':'','mp-curves':''};
    var _mpSaved=null;

    function mpGetAll(){
      var s={};
      _mpSliderIds.forEach(function(id){var el=document.getElementById(id);if(el)s[id]=parseInt(el.value);});
      var pe=document.getElementById('mp-passes');if(pe)s['mp-passes']=parseInt(pe.value);
      var bm=document.getElementById('mp-blend-mode');if(bm)s['mp-blend-mode']=bm.value;
      return s;
    }
    function mpSetAll(s){
      _mpSliderIds.forEach(function(id){
        var el=document.getElementById(id),vl=document.getElementById(id+'-v');
        if(el&&s[id]!==undefined){el.value=s[id];if(vl)vl.textContent=s[id]+(_mpSuffixes[id]||'');}
      });
      var pe=document.getElementById('mp-passes');if(pe&&s['mp-passes']!==undefined)pe.value=s['mp-passes'];
      var bm=document.getElementById('mp-blend-mode');if(bm&&s['mp-blend-mode']!==undefined)bm.value=s['mp-blend-mode'];
      applyAdjustments();
      if(_mpLive)liveRecomp();
    }

    document.getElementById('mp-save-settings').addEventListener('click',function(){
      _mpSaved=mpGetAll();
      var st=document.getElementById('mp-settings-status');
      if(st)st.textContent='Settings saved';
      setTimeout(function(){if(st)st.textContent='';},2000);
    });
    document.getElementById('mp-reset-settings').addEventListener('click',function(){
      mpSetAll(_mpDefaults);
      var st=document.getElementById('mp-settings-status');
      if(st)st.textContent='Reset to defaults';
      setTimeout(function(){if(st)st.textContent='';},2000);
    });

    /* Expose restore for external use */
    window._mpRestoreSaved=function(){if(_mpSaved)mpSetAll(_mpSaved);};
  }

  if(multiBtn){
    multiBtn.addEventListener('click',function(){
      buildMPPanel();
      if(_mpOpen){_mpPanel.classList.remove('open');_mpOpen=false;return;}
      _mpOpen=true;
      /* Sync active palette selector + swatches on open */
      var mpAP=document.getElementById('mp-active-pal');
      if(mpAP){mpAP.value=document.getElementById('pal').value;}
      var mpSR=document.getElementById('mp-swrow');
      if(mpSR){
        var pk=mpAP?mpAP.value:'ember';var pp=PALS[pk]||PALS.ember;
        mpSR.innerHTML='';
        var bgd=document.createElement('div');bgd.style.cssText='flex:1;border-radius:1px;background:'+(window._canvasBg||pp.bg)+';border:1px solid #444;';mpSR.appendChild(bgd);
        pp.c.forEach(function(c2){var s2=document.createElement('div');s2.style.cssText='flex:1;border-radius:1px;background:'+c2+';cursor:pointer;';s2.title=c2;mpSR.appendChild(s2);});
      }
      if(_mpPos){_mpPanel.style.left=_mpPos.left+'px';_mpPanel.style.top=_mpPos.top+'px';}
      else{var tb=document.getElementById('tb');if(tb){var r=tb.getBoundingClientRect();_mpPanel.style.left=Math.max(4,r.left-308)+'px';_mpPanel.style.top='10px';}else{_mpPanel.style.left='50px';_mpPanel.style.top='40px';}}
      _mpPanel.classList.add('open');
    });
  }
},600);

})();
