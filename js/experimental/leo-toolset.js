/* ══════════════════════════════════════════════════════════════════════
   LEO TOOLSET — Renaissance ink-and-vellum drawing primitives
   Extracted from analysis of Leonardo da Vinci's Vitruvian Man:
     • Aged vellum with foxing and edge burn
     • Iron-gall brown line with subtle hand-tremor
     • Sanguine red-chalk accents
     • Diagonal hatching and cross-hatching for chiaroscuro
     • Light geometric construction underdrawing
     • Mirror-written marginalia (right-to-left tildes)
     • Italic monogram signature
   Public API: window._LEO
   ══════════════════════════════════════════════════════════════════════ */
(function(){

/* ── LeoPalette — restricted earthy ink-and-chalk colours ── */
var LeoPalette={
  parchment:  'rgba(218,180,118,0.45)',
  paperShade: 'rgba(70,40,12,0.18)',
  paperBurn:  'rgba(20,8,0,0.55)',
  inkDk:      'rgba(45,22,6,0.94)',
  inkMid:     'rgba(55,28,10,0.72)',
  inkLt:      'rgba(70,38,14,0.42)',
  inkVL:      'rgba(80,45,18,0.25)',
  sanguine:   'rgba(155,55,28,0.38)',
  sanguineDk: 'rgba(120,42,18,0.62)',
  hilight:    'rgba(255,235,195,0.55)'
};

/* ── LeoPaper — washes target ctx with parchment, foxing, edge burn ── */
function LeoPaper(ctx,W,H,opts){
  opts=opts||{};
  var foxCount=opts.foxing!=null?opts.foxing:60;
  var burn=Math.min(0.95, opts.burn!=null?opts.burn:0.55);
  ctx.fillStyle=LeoPalette.parchment;
  ctx.fillRect(0,0,W,H);
  for(var i=0;i<foxCount;i++){
    var fx=Math.random()*W, fy=Math.random()*H, fr=3+Math.random()*14;
    var g=ctx.createRadialGradient(fx,fy,0,fx,fy,fr);
    // Stronger, browner stain so foxing slider is unmistakable
    g.addColorStop(0,'rgba(80,40,10,0.55)');
    g.addColorStop(0.5,'rgba(70,38,12,0.25)');
    g.addColorStop(1,'rgba(70,40,12,0)');
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(fx,fy,fr,0,Math.PI*2);ctx.fill();
  }
  var vg=ctx.createRadialGradient(W*0.5,H*0.45,W*0.10,W/2,H/2,W*0.78);
  vg.addColorStop(0,'rgba(40,20,5,0)');
  vg.addColorStop(1,'rgba(15,5,0,'+burn+')');
  ctx.fillStyle=vg;
  ctx.fillRect(0,0,W,H);
}

/* Module-level current-render params reference (set by renderCore) */
var _RENDER_P=null;

/* ── LeoLine — quill stroke with subtle hand-tremor ── */
function LeoLine(ctx,pts,opts){
  opts=opts||{};
  var w=(opts.w||1.4)*(_RENDER_P?_RENDER_P.contourW:1), col=opts.color||LeoPalette.inkDk, tr=opts.tremor||0.6;
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=col;ctx.lineWidth=w;
  ctx.beginPath();
  for(var i=0;i<pts.length;i++){
    var px=pts[i][0]+(Math.random()-0.5)*tr;
    var py=pts[i][1]+(Math.random()-0.5)*tr;
    if(i===0){ctx.moveTo(px,py);continue;}
    if(i===pts.length-1){ctx.lineTo(px,py);continue;}
    var nx=(px+pts[i+1][0])/2;
    var ny=(py+pts[i+1][1])/2;
    ctx.quadraticCurveTo(px,py,nx,ny);
  }
  ctx.stroke();
}

/* ── LeoContour — confident bezier outline ── */
function LeoContour(ctx,beziers,opts){
  opts=opts||{};
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=opts.color||LeoPalette.inkDk;
  ctx.lineWidth=(opts.w||2.2)*(_RENDER_P?_RENDER_P.contourW:1);
  var tr=_RENDER_P?_RENDER_P.tremor*0.6:0;
  function j(){return (Math.random()-0.5)*tr;}
  ctx.beginPath();
  ctx.moveTo(beziers[0][0]+j(),beziers[0][1]+j());
  for(var i=1;i<beziers.length;i++){
    var b=beziers[i];
    ctx.bezierCurveTo(b[0]+j(),b[1]+j(),b[2]+j(),b[3]+j(),b[4]+j(),b[5]+j());
  }
  ctx.stroke();
}

/* ── LeoHatch — parallel diagonal hatch fill ── */
function LeoHatch(ctx,bbox,dir,density,len,opts){
  opts=opts||{};
  ctx.strokeStyle=opts.color||LeoPalette.inkLt;
  ctx.lineWidth=(opts.w||0.85)*(_RENDER_P?Math.max(0.4,_RENDER_P.contourW*0.7):1);
  ctx.lineCap='round';
  // crossAng slider rotates the base hatch direction by (crossAng - default 78deg)
  var rot=_RENDER_P?(_RENDER_P.crossAng - 78*Math.PI/180):0;
  var dxRot=dir+rot;
  var dx=Math.cos(dxRot),dy=Math.sin(dxRot);
  var lenScale=_RENDER_P?_RENDER_P.hatchLen:1;
  for(var i=0;i<density;i++){
    var px=bbox[0]+Math.random()*bbox[2];
    var py=bbox[1]+Math.random()*bbox[3];
    var L=(len+Math.random()*len*0.4)*lenScale;
    ctx.beginPath();ctx.moveTo(px,py);
    ctx.lineTo(px+dx*L,py+dy*L);
    ctx.stroke();
  }
}

/* ── LeoCrossHatch — two perpendicular hatch passes for deep shadow ── */
function LeoCrossHatch(ctx,bbox,baseDir,density,len,opts){
  opts=opts||{};
  var ang2=opts.crossAng!=null?opts.crossAng:(_RENDER_P?_RENDER_P.crossAng:(Math.PI/2.3));
  LeoHatch(ctx,bbox,baseDir,density,len,opts);
  LeoHatch(ctx,bbox,baseDir+ang2,Math.floor(density*0.6),len*0.8,opts);
}

/* ── LeoConstruct — light geometric proportional underdrawing ── */
function LeoConstruct(ctx,W,H,opts){
  opts=opts||{};
  var vis=opts.visibility!=null?opts.visibility:1;
  if(vis<=0)return;
  var s=W/750;
  // Slider makes line both wider and darker for unmistakable effect
  ctx.lineWidth=Math.max(0.4, 0.8*s*Math.max(0.6,vis));
  var alpha=Math.min(0.9, 0.18*vis*1.4);
  ctx.strokeStyle=opts.color||('rgba(80,45,18,'+alpha+')');
  ctx.beginPath();ctx.moveTo(W*0.50,H*0.05);ctx.lineTo(W*0.50,H*0.95);ctx.stroke();
  [0.20,0.32,0.44,0.56,0.68,0.80].forEach(function(p){
    ctx.beginPath();ctx.moveTo(W*0.06,H*p);ctx.lineTo(W*0.94,H*p);ctx.stroke();
  });
  // Diagonal proportion lines also scale with visibility
  if(vis>0.4){
    ctx.beginPath();ctx.moveTo(W*0.06,H*0.06);ctx.lineTo(W*0.94,H*0.94);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W*0.94,H*0.06);ctx.lineTo(W*0.06,H*0.94);ctx.stroke();
  }
  ctx.lineWidth=Math.max(0.6, 1.0*s*Math.max(0.6,vis));
  ctx.strokeRect(W*0.06,H*0.06,W*0.88,H*0.88);
  ctx.beginPath();
  ctx.arc(W*0.50,H*0.50,W*0.41,0,Math.PI*2);
  ctx.stroke();
}

/* ── LeoMirrorText — wavy tilde glyph margins suggesting mirror writing ── */
function LeoMirrorText(ctx,tx,ty,lines,charsPerLine,opts){
  opts=opts||{};
  var s=(opts.scale||1);
  ctx.fillStyle=opts.color||LeoPalette.inkMid;
  ctx.font='italic '+(11*s)+'px serif';
  for(var ln=0;ln<lines;ln++){
    var t='~ '+'\u223c'.repeat(charsPerLine+Math.floor(Math.random()*4));
    ctx.fillText(t, tx, ty+ln*15*s);
  }
}

/* ── LeoSign — italic Renaissance signature ── */
function LeoSign(ctx,W,H,name,subtitle,opts){
  opts=opts||{};
  var a=opts.alpha!=null?opts.alpha:1;
  if(a<=0)return;
  ctx.font='italic bold 17px serif';
  ctx.fillStyle='rgba(60,30,10,'+(0.94*a)+')';
  ctx.fillText(name||'Leonardo da Vinci', W*0.04, H*0.94);
  if(subtitle){
    ctx.font='italic 11px serif';
    ctx.fillStyle='rgba(55,28,10,'+(0.72*a)+')';
    ctx.fillText(subtitle, W*0.04, H*0.97);
  }
}

/* ══════════════════════════════════════════════════════════════════════
   SYSTEMS — five Da Vinci notebook subjects
   ══════════════════════════════════════════════════════════════════════ */
var SYSTEMS=[
  {id:'portrait', name:'Portrait Study',
   nature:'Sitter portrait — head, hair, brow, eyes, nose, mouth, chiaroscuro shadow.',
   subtitle:'(ritratto di studio)'},
  {id:'vitruvian', name:'Vitruvian Figure',
   nature:'Proportional standing figure inscribed in circle and square.',
   subtitle:'(uomo vitruviano — proporzioni)'},
  {id:'botanical', name:'Botanical Study',
   nature:'Plant stem with leaves and a single open flower.',
   subtitle:'(studio botanico)'},
  {id:'mechanical', name:'Mechanical Sketch',
   nature:'Gear train and lever — a fragment from his engineering codices.',
   subtitle:'(macchina — codice)'},
  {id:'anatomical', name:'Anatomical Hand',
   nature:'Skeletal hand study with tendons and joint articulation.',
   subtitle:'(studio anatomico — mano)'}
];
var M={sysIdx:0, cycleIdx:-1};

function getSys(){return SYSTEMS[M.sysIdx];}

function getParams(){
  function v(id,def){var el=document.getElementById(id);return el?+el.value:def;}
  return {
    tremor:    Math.pow(v('leo-p1',60)/100, 1.4)*8,        // 0..8 px wobble
    hatch:     v('leo-p2',60)/100*3.5,                      // 0..3.5 density multiplier
    foxing:    Math.round(v('leo-p3',60)/100*450),          // 0..450 spots
    sanguine:  v('leo-p4',50)/100*2.4,                      // 0..2.4 chalk intensity
    mirror:    v('leo-p5',7),                               // 0..20 lines
    burn:      v('leo-p6',55)/100*1.6,                      // 0..1.6 vignette darkness
    grid:      v('leo-p7',100)/100*2.2,                     // 0..2.2 construction line strength
    contourW:  Math.pow(v('leo-p8',100)/100, 1.5),          // 0.04..3 weight multiplier
    hatchLen:  Math.pow(v('leo-p9',100)/100, 1.3),          // 0.13..3 length multiplier
    crossAng:  v('leo-p10',78)*Math.PI/180,                 // radians (also rotates base hatch)
    inkA:      Math.pow(v('leo-p11',94)/100, 1.3),          // ~0.07..1 ink alpha
    mirrorChars: v('leo-p12',14),                           // 2..40
    signA:     v('leo-p13',100)/100                         // 0..1 signature opacity
  };
}

/* Build a per-render ink palette using inkA */
function inkPal(P){
  var a=P.inkA;
  return {
    parchment:  'rgba(218,180,118,0.45)',
    paperShade: 'rgba(70,40,12,0.18)',
    inkDk:      'rgba(45,22,6,'+Math.min(1,0.94*a)+')',
    inkMid:     'rgba(55,28,10,'+Math.min(1,0.72*a)+')',
    inkLt:      'rgba(70,38,14,'+Math.min(1,0.42*a)+')',
    inkVL:      'rgba(80,45,18,'+Math.min(1,0.25*a)+')',
    sanguine:   'rgba(170,50,25,'+Math.min(1,0.38*P.sanguine)+')',
    hilight:    'rgba(255,235,195,0.55)'
  };
}

/* Sanguine wash overlay — scattered red-chalk strokes for visible effect */
function LeoSanguineWash(ctx,W,H,intensity){
  if(intensity<=0)return;
  var n=Math.round(intensity*120);
  for(var i=0;i<n;i++){
    var x=W*(0.15+Math.random()*0.7);
    var y=H*(0.20+Math.random()*0.65);
    var L=8+Math.random()*22;
    var a=-Math.PI/3+(Math.random()-0.5)*0.6;
    ctx.strokeStyle='rgba(170,55,28,'+(0.10+Math.random()*0.20*Math.min(1,intensity))+')';
    ctx.lineWidth=1+Math.random()*1.6;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L);
    ctx.stroke();
  }
}

/* ══════════════════════════════════════════════════════════════════════
   SUBJECT RENDERERS
   ══════════════════════════════════════════════════════════════════════ */

function renderPortrait(ctx,W,H,P){
  var cx=W*0.50, cy=H*0.46, s=W/750;
  // Head
  LeoContour(ctx,[
    [cx-95*s,cy-180*s],
    [cx-50*s,cy-220*s, cx+60*s,cy-225*s, cx+125*s,cy-185*s],
    [cx+160*s,cy-140*s, cx+170*s,cy-60*s, cx+165*s,cy+10*s],
    [cx+155*s,cy+60*s, cx+135*s,cy+105*s, cx+110*s,cy+135*s],
    [cx+85*s,cy+165*s, cx+45*s,cy+200*s, cx+5*s,cy+215*s],
    [cx-35*s,cy+220*s, cx-75*s,cy+200*s, cx-100*s,cy+170*s],
    [cx-130*s,cy+125*s, cx-150*s,cy+70*s, cx-155*s,cy+10*s],
    [cx-160*s,cy-50*s, cx-150*s,cy-120*s, cx-120*s,cy-165*s],
    [cx-110*s,cy-175*s, cx-100*s,cy-180*s, cx-95*s,cy-180*s]
  ],{w:2.3*s});
  // Hair mass
  ctx.fillStyle='rgba(50,28,10,0.42)';
  ctx.beginPath();
  ctx.moveTo(cx-110*s,cy-180*s);
  ctx.bezierCurveTo(cx-130*s,cy-220*s, cx-50*s,cy-245*s, cx,cy-225*s);
  ctx.bezierCurveTo(cx+60*s,cy-245*s, cx+135*s,cy-220*s, cx+135*s,cy-185*s);
  ctx.bezierCurveTo(cx+100*s,cy-200*s, cx+50*s,cy-205*s, cx,cy-200*s);
  ctx.bezierCurveTo(cx-50*s,cy-205*s, cx-90*s,cy-200*s, cx-110*s,cy-180*s);
  ctx.fill();
  // Brows
  LeoContour(ctx,[[cx-78*s,cy-50*s],[cx-58*s,cy-66*s,cx-25*s,cy-66*s,cx-8*s,cy-55*s]],{w:2.6*s});
  LeoContour(ctx,[[cx+8*s,cy-55*s],[cx+25*s,cy-66*s,cx+58*s,cy-66*s,cx+78*s,cy-50*s]],{w:2.6*s});
  // Eyes
  LeoContour(ctx,[[cx-72*s,cy-25*s],[cx-55*s,cy-37*s,cx-22*s,cy-37*s,cx-8*s,cy-25*s]],{w:1.6*s});
  LeoContour(ctx,[[cx-72*s,cy-25*s],[cx-55*s,cy-18*s,cx-22*s,cy-18*s,cx-8*s,cy-25*s]],{w:1.4*s});
  LeoContour(ctx,[[cx+8*s,cy-25*s],[cx+22*s,cy-37*s,cx+55*s,cy-37*s,cx+72*s,cy-25*s]],{w:1.6*s});
  LeoContour(ctx,[[cx+8*s,cy-25*s],[cx+22*s,cy-18*s,cx+55*s,cy-18*s,cx+72*s,cy-25*s]],{w:1.4*s});
  ctx.fillStyle='rgba(35,18,5,0.85)';
  ctx.beginPath();ctx.arc(cx-38*s,cy-27*s,5*s,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+38*s,cy-27*s,5*s,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=LeoPalette.hilight;
  ctx.beginPath();ctx.arc(cx-39*s,cy-29*s,1.5*s,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+37*s,cy-29*s,1.5*s,0,Math.PI*2);ctx.fill();
  // Nose
  LeoContour(ctx,[
    [cx-8*s,cy-45*s],
    [cx-15*s,cy-5*s, cx-18*s,cy+30*s, cx-12*s,cy+55*s],
    [cx-5*s,cy+68*s, cx+8*s,cy+68*s, cx+18*s,cy+58*s],
    [cx+25*s,cy+45*s, cx+22*s,cy+10*s, cx+15*s,cy-30*s]
  ],{w:1.7*s});
  LeoLine(ctx,[[cx+2*s,cy-40*s],[cx+1*s,cy+30*s]],{w:0.9*s,color:LeoPalette.hilight,tremor:P.tremor*0.3});
  // Mouth
  LeoContour(ctx,[[cx-32*s,cy+108*s],[cx-15*s,cy+115*s,cx+15*s,cy+115*s,cx+32*s,cy+108*s]],{w:1.6*s});
  LeoContour(ctx,[[cx-32*s,cy+115*s],[cx-15*s,cy+128*s,cx+15*s,cy+128*s,cx+32*s,cy+115*s]],{w:1.4*s,color:LeoPalette.inkMid});
  // Chiaroscuro shadow on right cheek
  var hd=Math.round(80*P.hatch);
  LeoCrossHatch(ctx,[cx+50*s,cy-30*s,110*s,170*s], Math.PI*0.30, hd, 14*s, {color:LeoPalette.inkLt});
  LeoHatch(ctx,[cx-70*s,cy+170*s,140*s,40*s], -Math.PI/3, Math.round(40*P.hatch), 12*s, {color:LeoPalette.inkLt});
  // Sanguine cheeks
  if(P.sanguine>0){
    ctx.fillStyle='rgba(155,55,28,'+(0.38*P.sanguine)+')';
    ctx.beginPath();ctx.arc(cx-95*s,cy+55*s,28*s,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(cx+95*s,cy+55*s,28*s,0,Math.PI*2);ctx.fill();
  }
}

function renderVitruvian(ctx,W,H,P){
  var cx=W*0.50, cy=H*0.50, s=W/750;
  // Inscribed circle and square
  ctx.lineWidth=1.0*s;ctx.strokeStyle=LeoPalette.inkMid;
  ctx.beginPath();ctx.arc(cx,cy+10*s,W*0.40,0,Math.PI*2);ctx.stroke();
  ctx.strokeRect(cx-W*0.39,cy-W*0.39+10*s,W*0.78,W*0.78);
  // Standing figure outline (simple silhouette)
  // Head
  LeoContour(ctx,[
    [cx-22*s,cy-200*s],
    [cx-22*s,cy-240*s, cx+22*s,cy-240*s, cx+22*s,cy-200*s],
    [cx+22*s,cy-170*s, cx-22*s,cy-170*s, cx-22*s,cy-200*s]
  ],{w:1.6*s});
  // Hair
  ctx.fillStyle='rgba(50,28,10,0.35)';
  ctx.beginPath();
  ctx.arc(cx,cy-220*s,32*s,Math.PI,Math.PI*2);
  ctx.fill();
  // Neck + torso
  LeoContour(ctx,[
    [cx-10*s,cy-170*s],[cx-10*s,cy-160*s, cx-50*s,cy-150*s, cx-90*s,cy-100*s]
  ],{w:1.5*s});
  LeoContour(ctx,[
    [cx+10*s,cy-170*s],[cx+10*s,cy-160*s, cx+50*s,cy-150*s, cx+90*s,cy-100*s]
  ],{w:1.5*s});
  // Arms — both straight out (square arms) and angled up (circle arms)
  LeoLine(ctx,[[cx-90*s,cy-100*s],[cx-W*0.39,cy-100*s]],{w:1.6*s,tremor:P.tremor});
  LeoLine(ctx,[[cx+90*s,cy-100*s],[cx+W*0.39,cy-100*s]],{w:1.6*s,tremor:P.tremor});
  LeoLine(ctx,[[cx-90*s,cy-100*s],[cx-W*0.34,cy-W*0.30]],{w:1.4*s,color:LeoPalette.inkMid,tremor:P.tremor});
  LeoLine(ctx,[[cx+90*s,cy-100*s],[cx+W*0.34,cy-W*0.30]],{w:1.4*s,color:LeoPalette.inkMid,tremor:P.tremor});
  // Torso outline
  LeoContour(ctx,[
    [cx-90*s,cy-100*s],
    [cx-100*s,cy-50*s, cx-90*s,cy+30*s, cx-50*s,cy+90*s]
  ],{w:1.6*s});
  LeoContour(ctx,[
    [cx+90*s,cy-100*s],
    [cx+100*s,cy-50*s, cx+90*s,cy+30*s, cx+50*s,cy+90*s]
  ],{w:1.6*s});
  // Hip
  LeoLine(ctx,[[cx-50*s,cy+90*s],[cx+50*s,cy+90*s]],{w:1.4*s,tremor:P.tremor*0.5});
  // Legs — feet together (circle pose) + apart (square pose)
  LeoContour(ctx,[
    [cx-30*s,cy+90*s],[cx-50*s,cy+200*s, cx-40*s,cy+280*s, cx-20*s,cy+340*s]
  ],{w:1.6*s});
  LeoContour(ctx,[
    [cx+30*s,cy+90*s],[cx+50*s,cy+200*s, cx+40*s,cy+280*s, cx+20*s,cy+340*s]
  ],{w:1.6*s});
  // Spread legs (square pose)
  LeoLine(ctx,[[cx-40*s,cy+90*s],[cx-W*0.30,cy+W*0.39]],{w:1.4*s,color:LeoPalette.inkMid,tremor:P.tremor});
  LeoLine(ctx,[[cx+40*s,cy+90*s],[cx+W*0.30,cy+W*0.39]],{w:1.4*s,color:LeoPalette.inkMid,tremor:P.tremor});
  // Shading hatching
  var hd=Math.round(60*P.hatch);
  LeoHatch(ctx,[cx+10*s,cy-100*s,90*s,180*s], -Math.PI/3, hd, 12*s, {color:LeoPalette.inkLt});
  LeoHatch(ctx,[cx+30*s,cy+90*s,80*s,250*s], -Math.PI/3, hd, 12*s, {color:LeoPalette.inkLt});
}

function renderBotanical(ctx,W,H,P){
  var cx=W*0.50, cy=H*0.55, s=W/750;
  // Stem
  LeoLine(ctx,[
    [cx,cy+250*s],[cx-5*s,cy+150*s],[cx+5*s,cy+50*s],[cx,cy-50*s],[cx-3*s,cy-150*s]
  ],{w:2.0*s,tremor:P.tremor});
  // Leaves
  function leaf(ax,ay,dir){
    var dx=dir*40*s, dy=-30*s;
    ctx.fillStyle='rgba(70,40,12,0.15)';
    ctx.beginPath();
    ctx.moveTo(ax,ay);
    ctx.bezierCurveTo(ax+dx*0.5,ay+dy*1.4, ax+dx*1.5,ay+dy*0.4, ax+dx*1.8,ay+dy*0.6);
    ctx.bezierCurveTo(ax+dx*1.5,ay-dy*0.4, ax+dx*0.5,ay-dy*0.2, ax,ay);
    ctx.fill();
    LeoContour(ctx,[
      [ax,ay],
      [ax+dx*0.5,ay+dy*1.4, ax+dx*1.5,ay+dy*0.4, ax+dx*1.8,ay+dy*0.6],
      [ax+dx*1.5,ay-dy*0.4, ax+dx*0.5,ay-dy*0.2, ax,ay]
    ],{w:1.4*s});
    // central vein
    LeoLine(ctx,[[ax,ay],[ax+dx*1.0,ay+dy*0.4],[ax+dx*1.7,ay+dy*0.6]],{w:0.9*s,color:LeoPalette.inkMid,tremor:P.tremor*0.3});
    // side veins
    for(var v=0;v<4;v++){
      var t=0.2+v*0.18;
      LeoLine(ctx,[
        [ax+dx*t*1.0,ay+dy*t*0.3],
        [ax+dx*t*1.0+dir*15*s,ay+dy*t*0.3-15*s*Math.sign(dy)]
      ],{w:0.7*s,color:LeoPalette.inkLt,tremor:P.tremor*0.3});
    }
  }
  leaf(cx-3*s,cy+150*s,-1);
  leaf(cx+5*s,cy+50*s, 1);
  leaf(cx-1*s,cy-50*s,-1);
  leaf(cx-3*s,cy-150*s, 1);
  // Flower head at top
  var fx=cx-10*s, fy=cy-200*s;
  // petals
  for(var p=0;p<8;p++){
    var ang=p/8*Math.PI*2;
    var px=fx+Math.cos(ang)*30*s;
    var py=fy+Math.sin(ang)*30*s;
    if(P.sanguine>0){
      ctx.fillStyle='rgba(155,55,28,'+(0.35*P.sanguine)+')';
      ctx.beginPath();ctx.arc(px,py,18*s,0,Math.PI*2);ctx.fill();
    }
    LeoContour(ctx,[
      [fx,fy],
      [fx+Math.cos(ang-0.2)*20*s,fy+Math.sin(ang-0.2)*20*s,
       fx+Math.cos(ang)*45*s,fy+Math.sin(ang)*45*s,
       fx+Math.cos(ang+0.2)*20*s,fy+Math.sin(ang+0.2)*20*s]
    ],{w:1.2*s});
  }
  // center
  ctx.fillStyle='rgba(60,30,10,0.7)';
  ctx.beginPath();ctx.arc(fx,fy,10*s,0,Math.PI*2);ctx.fill();
  // Background hatching
  var hd=Math.round(50*P.hatch);
  LeoHatch(ctx,[cx+30*s,cy-100*s,180*s,300*s], -Math.PI/3, hd, 12*s, {color:LeoPalette.inkVL});
}

function renderMechanical(ctx,W,H,P){
  var cx=W*0.50, cy=H*0.50, s=W/750;
  // Two interlocking gears
  function gear(gx,gy,r,teeth){
    ctx.lineWidth=1.6*s;ctx.strokeStyle=LeoPalette.inkDk;
    ctx.beginPath();
    for(var i=0;i<teeth*2;i++){
      var ang=i/(teeth*2)*Math.PI*2;
      var rr=(i%2===0)?r*1.10:r*0.92;
      var px=gx+Math.cos(ang)*rr;
      var py=gy+Math.sin(ang)*rr;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.stroke();
    // hub
    ctx.beginPath();ctx.arc(gx,gy,r*0.18,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(gx,gy,r*0.55,0,Math.PI*2);ctx.stroke();
    // spokes
    for(var sp=0;sp<6;sp++){
      var sa=sp/6*Math.PI*2;
      LeoLine(ctx,[
        [gx+Math.cos(sa)*r*0.18,gy+Math.sin(sa)*r*0.18],
        [gx+Math.cos(sa)*r*0.55,gy+Math.sin(sa)*r*0.55]
      ],{w:1.2*s,color:LeoPalette.inkMid,tremor:P.tremor});
    }
  }
  gear(cx-90*s,cy,110*s,12);
  gear(cx+110*s,cy-30*s,80*s,10);
  // Lever arm
  LeoLine(ctx,[[cx-200*s,cy+150*s],[cx-50*s,cy+80*s],[cx+150*s,cy+150*s]],{w:2.2*s,tremor:P.tremor});
  // Pivot
  ctx.fillStyle=LeoPalette.inkDk;
  ctx.beginPath();ctx.arc(cx-50*s,cy+80*s,5*s,0,Math.PI*2);ctx.fill();
  // Connecting rod
  LeoLine(ctx,[[cx-90*s,cy],[cx-180*s,cy+200*s]],{w:1.8*s,tremor:P.tremor*0.5});
  // Hatching shadow under mechanism
  var hd=Math.round(60*P.hatch);
  LeoHatch(ctx,[cx-220*s,cy+180*s,440*s,80*s], -Math.PI/4, hd, 14*s, {color:LeoPalette.inkLt});
  // Annotation arrows
  LeoLine(ctx,[[cx-90*s,cy-130*s],[cx-90*s,cy-160*s],[cx-30*s,cy-180*s]],{w:0.9*s,color:LeoPalette.inkMid,tremor:P.tremor*0.3});
  LeoLine(ctx,[[cx+110*s,cy-120*s],[cx+110*s,cy-160*s],[cx+170*s,cy-180*s]],{w:0.9*s,color:LeoPalette.inkMid,tremor:P.tremor*0.3});
}

function renderAnatomical(ctx,W,H,P){
  var cx=W*0.50, cy=H*0.50, s=W/750;
  // Wrist
  LeoContour(ctx,[
    [cx-60*s,cy+220*s],[cx-65*s,cy+150*s, cx-50*s,cy+100*s, cx-30*s,cy+50*s]
  ],{w:1.8*s});
  LeoContour(ctx,[
    [cx+60*s,cy+220*s],[cx+65*s,cy+150*s, cx+50*s,cy+100*s, cx+30*s,cy+50*s]
  ],{w:1.8*s});
  // Palm
  LeoContour(ctx,[
    [cx-30*s,cy+50*s],[cx-50*s,cy-20*s, cx-70*s,cy-80*s, cx-60*s,cy-130*s]
  ],{w:1.8*s});
  LeoContour(ctx,[
    [cx+30*s,cy+50*s],[cx+50*s,cy-20*s, cx+70*s,cy-80*s, cx+60*s,cy-130*s]
  ],{w:1.8*s});
  // Knuckle line
  LeoLine(ctx,[[cx-60*s,cy-130*s],[cx,cy-150*s],[cx+60*s,cy-130*s]],{w:1.4*s,tremor:P.tremor*0.4});
  // Fingers — 4 fingers + thumb
  function finger(fx,fy,len,ang,seg){
    var px=fx,py=fy;
    for(var k=0;k<seg;k++){
      var nx=px+Math.cos(ang)*len*0.33;
      var ny=py+Math.sin(ang)*len*0.33;
      LeoContour(ctx,[
        [px-5*s,py],[px-7*s,(py+ny)/2, nx-7*s,(py+ny)/2, nx-3*s,ny]
      ],{w:1.4*s});
      LeoContour(ctx,[
        [px+5*s,py],[px+7*s,(py+ny)/2, nx+7*s,(py+ny)/2, nx+3*s,ny]
      ],{w:1.4*s});
      // joint line
      LeoLine(ctx,[[nx-6*s,ny],[nx+6*s,ny]],{w:0.9*s,color:LeoPalette.inkMid,tremor:P.tremor*0.3});
      px=nx;py=ny;
    }
    // fingertip
    LeoContour(ctx,[
      [px-5*s,py],[px-7*s,py-12*s, px+7*s,py-12*s, px+5*s,py]
    ],{w:1.3*s});
  }
  finger(cx-50*s,cy-130*s, 130*s, -Math.PI/2-0.10, 3);
  finger(cx-18*s,cy-145*s, 145*s, -Math.PI/2-0.03, 3);
  finger(cx+15*s,cy-145*s, 140*s, -Math.PI/2+0.03, 3);
  finger(cx+45*s,cy-130*s, 120*s, -Math.PI/2+0.10, 3);
  // Thumb
  finger(cx-72*s,cy-50*s, 110*s, -Math.PI/2-0.7, 2);
  // Skeletal/tendon hatching inside palm
  var hd=Math.round(70*P.hatch);
  LeoHatch(ctx,[cx-60*s,cy-130*s,120*s,180*s], -Math.PI/2.5, hd, 10*s, {color:LeoPalette.inkLt});
  LeoCrossHatch(ctx,[cx-50*s,cy+50*s,100*s,160*s], -Math.PI/3, Math.round(hd*0.6), 12*s, {color:LeoPalette.inkLt});
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN RENDER PIPELINE
   ══════════════════════════════════════════════════════════════════════ */
function renderCore(pushUndo){
  if(pushUndo&&window.genUndoPush)window.genUndoPush();
  var dv=document.getElementById('dv');
  var ctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||(dv&&dv.getContext('2d')));
  if(!ctx||!dv)return;
  var W=dv.width,H=dv.height;
  if(!window._ENG_CONNECT)ctx.clearRect(0,0,W,H);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';

  var sys=getSys();
  var P=getParams();
  _RENDER_P=P;
  // Update palette refs to per-render alpha-tinted versions
  var live=inkPal(P);
  for(var k in live)LeoPalette[k]=live[k];

  LeoPaper(ctx,W,H,{foxing:P.foxing,burn:P.burn});
  LeoConstruct(ctx,W,H,{visibility:P.grid});

  if(sys.id==='portrait')        renderPortrait(ctx,W,H,P);
  else if(sys.id==='vitruvian')  renderVitruvian(ctx,W,H,P);
  else if(sys.id==='botanical')  renderBotanical(ctx,W,H,P);
  else if(sys.id==='mechanical') renderMechanical(ctx,W,H,P);
  else                           renderAnatomical(ctx,W,H,P);

  if(P.sanguine>0.05)LeoSanguineWash(ctx,W,H,P.sanguine);
  if(P.mirror>0)LeoMirrorText(ctx, W*0.04, H*0.06, P.mirror, P.mirrorChars);
  LeoSign(ctx, W, H, 'Leonardo da Vinci', sys.subtitle, {alpha:P.signA});

  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  var st=document.getElementById('leo-status');
  if(st)st.textContent=sys.name+' \u2014 '+(P.foxing)+' fox / '+Math.round(P.hatch*100)+'% hatch';
}

function doRender(){
  // Generate button: full render with undo push
  renderCore(true);
}

/* ── Realtime live render via rAF coalescing ── */
var _liveRAF=0;
function liveRender(){
  if(_liveRAF)return;
  _liveRAF=requestAnimationFrame(function(){
    _liveRAF=0;
    renderCore(false);
  });
}

/* ── Slider metadata: id, range, value-label formatter ── */
var SLIDERS=[
  {id:1, rmin:0,  rmax:100, fmt:function(v){return v+'%';}},
  {id:2, rmin:20, rmax:100, fmt:function(v){return v+'%';}},
  {id:3, rmin:20, rmax:100, fmt:function(v){return v+'%';}},
  {id:4, rmin:0,  rmax:100, fmt:function(v){return v+'%';}},
  {id:5, rmin:0,  rmax:15,  fmt:function(v){return ''+v;}},
  {id:6, rmin:0,  rmax:100, fmt:function(v){return v+'%';}},
  {id:7, rmin:0,  rmax:100, fmt:function(v){return v+'%';}},
  {id:8, rmin:40, rmax:200, fmt:function(v){return v+'%';}},
  {id:9, rmin:50, rmax:200, fmt:function(v){return v+'%';}},
  {id:10,rmin:30, rmax:150, fmt:function(v){return v+'\u00b0';}},
  {id:11,rmin:30, rmax:100, fmt:function(v){return v+'%';}},
  {id:12,rmin:4,  rmax:30,  fmt:function(v){return ''+v;}},
  {id:13,rmin:0,  rmax:100, fmt:function(v){return v+'%';}}
];

/* ── Randomise sliders ── */
function randomise(){
  SLIDERS.forEach(function(s){
    var sl=document.getElementById('leo-p'+s.id);
    var vl=document.getElementById('leo-v'+s.id);
    if(!sl)return;
    var v=Math.floor(s.rmin+Math.random()*(s.rmax-s.rmin));
    sl.value=v;
    if(vl)vl.textContent=s.fmt(v);
  });
  doRender();
}

/* ── System list UI ── */
function buildSysList(){
  var list=document.getElementById('leo-sys-list');
  if(!list)return;
  list.innerHTML='';
  SYSTEMS.forEach(function(sys,i){
    var row=document.createElement('div');
    row.id='leo-sr-'+sys.id;
    row.style.cssText='cursor:pointer;padding:5px 8px;border:1px solid #2a1a0a;margin-bottom:3px;border-radius:2px;transition:border-color .1s,background .1s;';
    row.innerHTML=
      '<div style="font-size:9px;font-weight:600;color:#c0a040;letter-spacing:.06em;">'+(i+1)+'. '+sys.name+'</div>'+
      '<div style="font-size:8px;color:#b09060;margin-top:2px;line-height:1.4;">'+sys.nature+'</div>';
    row.addEventListener('mouseenter',function(){if(M.sysIdx!==i)this.style.borderColor='rgba(192,160,64,0.3)';});
    row.addEventListener('mouseleave',function(){if(M.sysIdx!==i)this.style.borderColor='#2a1a0a';});
    row.addEventListener('click',function(){selectSystem(i);});
    list.appendChild(row);
  });
  highlightSys(M.sysIdx);
}

function highlightSys(idx){
  SYSTEMS.forEach(function(sys,i){
    var row=document.getElementById('leo-sr-'+sys.id);
    if(!row)return;
    if(i===idx){row.style.borderColor='#c0a040';row.style.background='rgba(192,160,64,0.07)';}
    else{row.style.borderColor='#2a1a0a';row.style.background='';}
  });
}

function selectSystem(idx){
  M.sysIdx=idx;
  highlightSys(idx);
  doRender();
}

/* ── Wire all sliders: live-value labels + realtime render ── */
function wireSliders(){
  SLIDERS.forEach(function(s){
    var sl=document.getElementById('leo-p'+s.id);
    var vl=document.getElementById('leo-v'+s.id);
    if(!sl)return;
    sl.addEventListener('input',function(){
      if(vl)vl.textContent=s.fmt(sl.value);
      liveRender();
    });
  });
}

/* ══════════════════════════════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════════════════════════════ */
window._LEO={
  /* Palette */
  palette: LeoPalette,
  /* Primitives — pass your own ctx */
  paper:      LeoPaper,
  line:       LeoLine,
  contour:    LeoContour,
  hatch:      LeoHatch,
  crossHatch: LeoCrossHatch,
  construct:  LeoConstruct,
  mirrorText: LeoMirrorText,
  sign:       LeoSign,
  /* Panel */
  render:     doRender,
  randomise:  randomise,
  cycle: function(){
    M.cycleIdx=(M.cycleIdx+1)%SYSTEMS.length;
    M.sysIdx=M.cycleIdx;
    highlightSys(M.sysIdx);
    var cl=document.getElementById('leo-cycle-label'),cn=document.getElementById('leo-cycle-name');
    if(cl)cl.style.display='block';
    if(cn)cn.textContent='('+(M.cycleIdx+1)+'/'+SYSTEMS.length+') '+SYSTEMS[M.cycleIdx].name;
    var b=document.getElementById('leo-body'),t=document.getElementById('leo-toggle');
    if(b&&b.style.display==='none'){
      b.style.display='block';
      if(t){t.style.background='rgba(192,160,64,0.07)';t.style.borderColor='#c0a040';}
      var chev=t?t.querySelector('.tc-chev'):null;if(chev)chev.style.transform='rotate(180deg)';
    }
    doRender();
  }
};

/* ── Init ── */
setTimeout(function(){
  buildSysList();
  wireSliders();
},500);

})();
