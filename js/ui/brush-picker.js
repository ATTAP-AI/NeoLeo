/* ══════════════════════════════════════════════════════════
   BRUSH PICKER MODAL
   ══════════════════════════════════════════════════════════ */
(function(){

const BRUSHES=[
  {name:'Soft Round',  sz:20,hd:0.08,op:0.9,  type:'round_soft'},
  {name:'Hard Round',  sz:15,hd:1.00,op:0.95, type:'round_hard'},
  {name:'Airbrush',    sz:40,hd:0.02,op:0.45, type:'airbrush'},
  {name:'Pencil',      sz:4, hd:0.95,op:0.90, type:'pencil'},
  {name:'Chalk',       sz:20,hd:0.60,op:0.75, type:'chalk'},
  {name:'Dry Brush',   sz:22,hd:0.70,op:0.65, type:'dry'},
  {name:'Soft Flat',   sz:28,hd:0.15,op:0.85, type:'flat_soft'},
  {name:'Hard Flat',   sz:24,hd:0.95,op:0.90, type:'flat_hard'},
  {name:'Spatter',     sz:3, hd:1.00,op:0.80, type:'spatter'},
  {name:'Ink Pen',     sz:3, hd:1.00,op:1.0,  type:'ink'},
  /* ── Chinese Brushes 毛笔 ── */
  {name:'毛笔 Máo Bǐ',       sz:18,hd:0.40,op:0.92, type:'maobi'},
  {name:'写意 Xiě Yì',        sz:28,hd:0.20,op:0.85, type:'xieyi'},
  {name:'工笔 Gōng Bǐ',      sz:4, hd:0.90,op:0.95, type:'gongbi'},
  {name:'竹笔 Zhú Bǐ',       sz:16,hd:0.65,op:0.80, type:'zhubi'},
  {name:'泼墨 Pō Mò',         sz:40,hd:0.05,op:0.70, type:'pomo'},
  {name:'枯笔 Kū Bǐ',        sz:22,hd:0.75,op:0.55, type:'kubi'},
  {name:'瘦金 Shòu Jīn (Huizong)', sz:5,hd:0.95,op:0.98, type:'shoujin'},
  /* ── Winsor & Newton Sable ── */
  {name:'W&N Series 7 Mini',   sz:2, hd:0.95,op:0.95, type:'wn_s7mini'},
  {name:'W&N Series 7 Round',  sz:10,hd:0.30,op:0.90, type:'wn_s7round'},
  {name:'W&N Sceptre Gold',    sz:14,hd:0.45,op:0.85, type:'wn_sceptre'},
  {name:'W&N Sable Flat Wash', sz:30,hd:0.12,op:0.65, type:'wn_flatwash'},
  {name:'W&N Cotman Round',    sz:12,hd:0.55,op:0.88, type:'wn_cotman'},
  {name:'W&N Sable Rigger',    sz:3, hd:0.80,op:0.92, type:'wn_rigger'},
];
const TIPS=[
  {hd:0.05,sz:24},{hd:0.50,sz:20},{hd:1.00,sz:18},{hd:0.05,sz:4},
  {hd:0.05,sz:40},{hd:1.00,sz:4},{hd:0.10,sz:12},{hd:0.80,sz:12},
];

let activeBrush=1,activeTip=2;

const modal  =document.getElementById('bp-modal');
const bpBox  =document.getElementById('bp-box');
const prevCv =document.getElementById('bp-preview');
const pCtx   =prevCv.getContext('2d');
const colIn  =document.getElementById('bp-col-in');
const colPrev=document.getElementById('bp-col-preview').getContext('2d');
const szSlider=document.getElementById('bp-sz');
const hdSlider=document.getElementById('bp-hd');
const opSlider=document.getElementById('bp-op');
const szVal  =document.getElementById('bp-sz-val');
const hdVal  =document.getElementById('bp-hd-val');
const opVal  =document.getElementById('bp-op-val');
const tipRow =document.getElementById('bp-tips');
const bpList =document.getElementById('bp-list');
const searchIn=document.getElementById('bp-search');

function getCol(){return window.drawCol||'#ff4040';}

function drawPreview(){
  const W=80,H=80;
  const sz=parseInt(szSlider.value),hd=parseInt(hdSlider.value)/100;
  pCtx.clearRect(0,0,W,H);
  pCtx.fillStyle='#111';pCtx.fillRect(0,0,W,H);
  const r=Math.min(sz/2,34),cx=W/2,cy=H/2;
  const g=pCtx.createRadialGradient(cx,cy,r*hd*0.8,cx,cy,r);
  const col=getCol();
  const [rv,gv,bv]=window._h2r?window._h2r(col):[255,64,64];
  g.addColorStop(0,'rgba('+rv+','+gv+','+bv+',1)');
  g.addColorStop(1,'rgba('+rv+','+gv+','+bv+','+Math.max(0,(1-hd)*0.04).toFixed(3)+')');
  pCtx.fillStyle=g;
  pCtx.beginPath();pCtx.arc(cx,cy,r,0,Math.PI*2);pCtx.fill();
  pCtx.strokeStyle='rgba(255,255,255,0.3)';pCtx.lineWidth=0.7;
  pCtx.beginPath();pCtx.moveTo(cx-r-6,cy);pCtx.lineTo(cx+r+6,cy);pCtx.stroke();
  pCtx.beginPath();pCtx.moveTo(cx,cy-r-6);pCtx.lineTo(cx,cy+r+6);pCtx.stroke();
  pCtx.beginPath();pCtx.arc(cx,cy,r,0,Math.PI*2);pCtx.stroke();
  [[cx+r*.7,cy+r*.7],[cx-r*.7,cy-r*.7]].forEach(function(p){
    pCtx.fillStyle='rgba(255,255,255,0.6)';
    pCtx.beginPath();pCtx.arc(p[0],p[1],3,0,Math.PI*2);pCtx.fill();
  });
  pCtx.fillStyle='rgba(255,255,255,0.5)';
  pCtx.beginPath();
  var ax=cx+r+2;
  pCtx.moveTo(ax,cy-4);pCtx.lineTo(ax+6,cy);pCtx.lineTo(ax,cy+4);pCtx.closePath();pCtx.fill();
}

function drawStroke(canvas,hd,sz,col,type){
  const W=canvas.width,H=canvas.height;
  const sc=canvas.getContext('2d');
  sc.clearRect(0,0,W,H);sc.fillStyle='#111';sc.fillRect(0,0,W,H);
  const t=type||'round_soft';
  /* Parse hex color to r,g,b integers */
  function hex2rgb(h){
    h=h||'#ff4040';
    var r=parseInt(h.slice(1,3),16)||255;
    var g=parseInt(h.slice(3,5),16)||64;
    var b=parseInt(h.slice(5,7),16)||64;
    return [r,g,b];
  }
  /* S-curve path shared by most types */
  const pts=[[8,H/2],[W*.28,H/2-H*.28],[W*.45,H/2+H*.28],[W*.55,H/2],[W*.82,H/2-H*.1],[W-8,H/2]];

  if(t==='round_soft'){
    sc.lineWidth=sz;sc.lineCap='round';sc.lineJoin='round';
    sc.shadowBlur=sz*2.2;sc.shadowColor=col;sc.strokeStyle=col;sc.globalAlpha=0.85;
    sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]);
    sc.bezierCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1],pts[3][0],pts[3][1]);
    sc.bezierCurveTo(pts[4][0],pts[4][1],pts[5][0],pts[5][1],W-8,H/2);
    sc.stroke();sc.shadowBlur=0;

  } else if(t==='round_hard'){
    sc.lineWidth=sz;sc.lineCap='round';sc.lineJoin='round';
    sc.shadowBlur=0;sc.strokeStyle=col;sc.globalAlpha=1;
    sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]);
    sc.bezierCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1],pts[3][0],pts[3][1]);
    sc.bezierCurveTo(pts[4][0],pts[4][1],pts[5][0],pts[5][1],W-8,H/2);
    sc.stroke();

  } else if(t==='airbrush'){
    /* Radial dots spray along the path */
    const rgb=hex2rgb(col);
    const px=sc.createLinearGradient(8,0,W-8,0);
    px.addColorStop(0,'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.5)');
    px.addColorStop(0.5,'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.35)');
    px.addColorStop(1,'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.5)');
    for(let i=0;i<180;i++){
      const tx=8+Math.random()*(W-16);
      const curve_y=H/2+Math.sin(tx/W*Math.PI*2)*H*.2;
      const r=sz*0.6;
      const dx=(Math.random()-.5)*r*2;
      const dy=(Math.random()-.5)*r*2;
      if(dx*dx+dy*dy>r*r)continue;
      sc.fillStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(Math.random()*.22+.04)+')';
      sc.beginPath();sc.arc(tx+dx,curve_y+dy,1+Math.random()*2,0,Math.PI*2);sc.fill();
    }

  } else if(t==='pencil'){
    /* Thin textured line with slight grain */
    const rgb=hex2rgb(col);
    for(let i=0;i<3;i++){
      sc.strokeStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(0.5+i*0.18)+')';
      sc.lineWidth=0.8+i*0.4;sc.lineCap='round';
      sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]+i*.4);
      sc.bezierCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1],pts[3][0],pts[3][1]);
      sc.bezierCurveTo(pts[4][0],pts[4][1],pts[5][0],pts[5][1],W-8,H/2+i*.4);
      sc.stroke();
    }
    /* Add pencil texture dots */
    const rgb2=hex2rgb(col);
    for(let i=0;i<60;i++){
      const tx=8+Math.random()*(W-16);
      const cy=H/2+Math.sin(tx/W*Math.PI*2)*H*.2;
      sc.fillStyle='rgba('+rgb2[0]+','+rgb2[1]+','+rgb2[2]+','+(Math.random()*.3+.1)+')';
      sc.fillRect(tx+(Math.random()-.5)*3,cy+(Math.random()-.5)*3,1,1);
    }

  } else if(t==='chalk'){
    /* Rough semi-opaque strokes with texture gaps */
    const rgb=hex2rgb(col);
    for(let pass=0;pass<4;pass++){
      sc.strokeStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(0.3+pass*0.12)+')';
      sc.lineWidth=sz*(0.5+pass*0.18);sc.lineCap='round';
      const oy=(Math.random()-.5)*4;
      sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]+oy);
      sc.bezierCurveTo(pts[1][0],pts[1][1]+oy,pts[2][0],pts[2][1]+oy,pts[3][0],pts[3][1]+oy);
      sc.bezierCurveTo(pts[4][0],pts[4][1]+oy,pts[5][0],pts[5][1]+oy,W-8,H/2+oy);
      sc.stroke();
    }
    /* Rough gaps (white rectangles cut into stroke) */
    sc.globalCompositeOperation='destination-out';
    for(let i=0;i<30;i++){
      const tx=8+Math.random()*(W-16);
      const cy=H/2+Math.sin(tx/W*Math.PI*2)*H*.2;
      sc.fillStyle='rgba(0,0,0,'+(Math.random()*.5)+')';
      sc.fillRect(tx,cy+(Math.random()-.5)*sz,1+Math.random()*4,1+Math.random()*6);
    }
    sc.globalCompositeOperation='source-over';

  } else if(t==='dry'){
    /* Multiple thin offset strokes — dry bristle look */
    const rgb=hex2rgb(col);
    const bristles=8;
    for(let b=0;b<bristles;b++){
      const spread=(b/(bristles-1)-.5)*sz*.8;
      const alpha=0.2+Math.random()*.5;
      sc.strokeStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+alpha.toFixed(2)+')';
      sc.lineWidth=1+Math.random()*2;sc.lineCap='round';
      sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]+spread);
      sc.bezierCurveTo(pts[1][0],pts[1][1]+spread,pts[2][0],pts[2][1]+spread,pts[3][0],pts[3][1]+spread);
      sc.bezierCurveTo(pts[4][0],pts[4][1]+spread,pts[5][0],pts[5][1]+spread,W-8,H/2+spread);
      sc.stroke();
    }

  } else if(t==='flat_soft'||t==='flat_hard'){
    /* Wide flat rectangular stroke */
    const rgb=hex2rgb(col);
    const blur=t==='flat_soft'?sz*1.5:0;
    sc.shadowBlur=blur;sc.shadowColor=col;
    sc.strokeStyle=col;
    sc.lineWidth=sz*1.6;
    sc.lineCap='butt'; /* flat ends */
    sc.lineJoin='miter';
    sc.globalAlpha=t==='flat_soft'?0.7:1;
    sc.beginPath();
    /* Nearly straight with slight curve */
    sc.moveTo(8,H/2);sc.bezierCurveTo(W*.3,H/2-4,W*.7,H/2+4,W-8,H/2);
    sc.stroke();sc.shadowBlur=0;

  } else if(t==='spatter'){
    /* Random scatter dots */
    const rgb=hex2rgb(col);
    for(let i=0;i<200;i++){
      const tx=8+Math.random()*(W-16);
      const curve_y=H/2+Math.sin(tx/W*Math.PI*1.5)*H*.22;
      const spread=sz*2;
      const dx=(Math.random()-.5)*spread;
      const dy=(Math.random()-.5)*spread*.6;
      const r=0.5+Math.random()*2.5;
      sc.fillStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(Math.random()*.8+.2).toFixed(2)+')';
      sc.beginPath();sc.arc(tx+dx,curve_y+dy,r,0,Math.PI*2);sc.fill();
    }

  } else if(t==='ink'){
    /* Variable-width calligraphic line */
    const rgb=hex2rgb(col);
    sc.fillStyle=col;sc.globalAlpha=1;
    /* Draw as filled shape with varying width */
    const steps=60;
    const upper=[],lower=[];
    for(let i=0;i<=steps;i++){
      const t2=i/steps;
      /* Bézier eval */
      const bx=cubicBez(8,W*.28,W*.65,W-8,t2);
      const by=cubicBez(H/2,H/2-H*.28,H/2-H*.1,H/2,t2);
      const speed=Math.abs(Math.cos(t2*Math.PI*1.5));
      const w=(1+speed*2.5);
      upper.push([bx,by-w]);lower.push([bx,by+w]);
    }
    sc.beginPath();sc.moveTo(upper[0][0],upper[0][1]);
    upper.forEach(p=>sc.lineTo(p[0],p[1]));
    for(let i=lower.length-1;i>=0;i--)sc.lineTo(lower[i][0],lower[i][1]);
    sc.closePath();sc.fill();

  /* ── Chinese Brushes 毛笔 ── */

  } else if(t==='maobi'){
    /* 毛笔 Standard calligraphy brush — tapered entry/exit, full body mid-stroke */
    const rgb=hex2rgb(col);
    sc.fillStyle=col;sc.globalAlpha=0.92;
    const steps=80;const upper2=[],lower2=[];
    for(let i=0;i<=steps;i++){
      const t2=i/steps;
      const bx=cubicBez(8,W*.3,W*.7,W-8,t2);
      const by=cubicBez(H/2,H/2-H*.22,H/2+H*.15,H/2,t2);
      /* Pressure envelope: thin→thick→thin with slight asymmetry */
      const press=Math.sin(t2*Math.PI)*0.85+Math.sin(t2*Math.PI*2.5)*0.15;
      const w=1+press*sz*0.45;
      /* Slight wobble for organic feel */
      const wb=Math.sin(t2*42)*0.6;
      upper2.push([bx,by-w+wb]);lower2.push([bx,by+w*1.1+wb]);
    }
    sc.beginPath();sc.moveTo(upper2[0][0],upper2[0][1]);
    upper2.forEach(p=>sc.lineTo(p[0],p[1]));
    for(let i=lower2.length-1;i>=0;i--)sc.lineTo(lower2[i][0],lower2[i][1]);
    sc.closePath();sc.fill();
    /* Ink texture: tiny semi-transparent dots for paper bleed */
    for(let i=0;i<40;i++){
      const tx=12+Math.random()*(W-24);
      const cy=H/2+Math.sin(tx/W*Math.PI*2)*H*.15;
      sc.fillStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(Math.random()*.15)+')';
      sc.beginPath();sc.arc(tx+(Math.random()-.5)*sz*.3,cy+(Math.random()-.5)*sz*.3,Math.random()*2,0,Math.PI*2);sc.fill();
    }

  } else if(t==='xieyi'){
    /* 写意 Freehand/expressionistic — dramatic thick-thin with splashes */
    const rgb=hex2rgb(col);
    sc.globalAlpha=0.85;
    const steps=70;
    for(let pass=0;pass<3;pass++){
      const oy=(pass-1)*2;
      sc.strokeStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(0.3+pass*0.2)+')';
      const upper3=[],lower3=[];
      for(let i=0;i<=steps;i++){
        const t2=i/steps;
        const bx=cubicBez(6,W*.2,W*.6,W-6,t2);
        const by=cubicBez(H/2+oy,H/2-H*.3+oy,H/2+H*.2+oy,H/2+oy,t2);
        const press=Math.pow(Math.sin(t2*Math.PI),0.6);
        const w=0.5+press*sz*0.6+Math.sin(t2*18)*1.2;
        upper3.push([bx,by-w]);lower3.push([bx,by+w]);
      }
      sc.beginPath();sc.moveTo(upper3[0][0],upper3[0][1]);
      upper3.forEach(p=>sc.lineTo(p[0],p[1]));
      for(let i=lower3.length-1;i>=0;i--)sc.lineTo(lower3[i][0],lower3[i][1]);
      sc.closePath();sc.fillStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(0.3+pass*0.25)+')';sc.fill();
    }
    /* Splash dots — ink flung from brush */
    for(let i=0;i<25;i++){
      const tx=W*.15+Math.random()*W*.7;
      const cy=H/2+(Math.random()-.5)*H*.6;
      sc.fillStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(Math.random()*.5+.1)+')';
      sc.beginPath();sc.arc(tx,cy,0.5+Math.random()*3,0,Math.PI*2);sc.fill();
    }

  } else if(t==='gongbi'){
    /* 工笔 Fine detail — thin even hairline with slight taper at ends */
    const rgb=hex2rgb(col);
    sc.globalAlpha=0.95;
    /* Primary fine line */
    sc.strokeStyle=col;sc.lineWidth=1.5;sc.lineCap='round';
    sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]);
    sc.bezierCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1],pts[3][0],pts[3][1]);
    sc.bezierCurveTo(pts[4][0],pts[4][1],pts[5][0],pts[5][1],W-8,H/2);
    sc.stroke();
    /* Ghost parallel line for silk-thread effect */
    sc.strokeStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.25)';sc.lineWidth=0.5;
    sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]+3);
    sc.bezierCurveTo(pts[1][0],pts[1][1]+3,pts[2][0],pts[2][1]+3,pts[3][0],pts[3][1]+3);
    sc.bezierCurveTo(pts[4][0],pts[4][1]+3,pts[5][0],pts[5][1]+3,W-8,H/2+3);
    sc.stroke();

  } else if(t==='zhubi'){
    /* 竹笔 Bamboo brush — stiff splayed bristles, streaky with dry gaps */
    const rgb=hex2rgb(col);
    const bristles=12;
    for(let b=0;b<bristles;b++){
      const spread=(b/(bristles-1)-.5)*sz*.9;
      /* Bristles fan out from entry, converge at exit */
      const entrySpread=spread*1.6;
      const exitSpread=spread*0.3;
      const alpha=0.15+Math.random()*.55;
      sc.strokeStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+alpha.toFixed(2)+')';
      sc.lineWidth=0.6+Math.random()*1.4;sc.lineCap='round';
      sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]+entrySpread);
      sc.bezierCurveTo(pts[1][0],pts[1][1]+spread,pts[2][0],pts[2][1]+spread*0.7,pts[3][0],pts[3][1]+exitSpread);
      sc.bezierCurveTo(pts[4][0],pts[4][1]+exitSpread*0.5,pts[5][0],pts[5][1]+exitSpread*0.3,W-8,H/2+exitSpread*0.2);
      sc.stroke();
    }

  } else if(t==='pomo'){
    /* 泼墨 Splash ink — wet broad wash, blended at all sizes */
    const rgb=hex2rgb(col);
    sc.lineCap='round';sc.lineJoin='round';sc.strokeStyle=col;
    const pomoPath=()=>{sc.beginPath();sc.moveTo(12,H/2+4);
      sc.bezierCurveTo(W*.25,H/2-H*.15,W*.5,H/2+H*.1,W*.75,H/2-2);
      sc.bezierCurveTo(W*.85,H/2+6,W*.95,H/2,W-12,H/2+2);};
    /* Outer halo */
    sc.globalAlpha=0.32;sc.shadowBlur=sz*1.6;sc.shadowColor='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.45)';
    sc.lineWidth=sz*1.9;pomoPath();sc.stroke();sc.shadowBlur=0;
    /* Mid wash */
    sc.globalAlpha=0.45;sc.lineWidth=sz*1.45;pomoPath();sc.stroke();
    /* Inner body */
    sc.globalAlpha=0.55;sc.lineWidth=sz*1.05;pomoPath();sc.stroke();
    /* Pooled core (no longer nested-looking) */
    sc.globalAlpha=0.38;sc.strokeStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.85)';
    sc.lineWidth=sz*0.7;pomoPath();sc.stroke();
    /* Wet scatter */
    for(let i=0;i<50;i++){
      const tx=10+Math.random()*(W-20);
      const cy=H/2+(Math.random()-.5)*sz*1.2;
      sc.fillStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(Math.random()*.25+.05)+')';
      sc.beginPath();sc.arc(tx,cy,1+Math.random()*4,0,Math.PI*2);sc.fill();
    }

  } else if(t==='kubi'){
    /* 枯笔 Dry ink — sparse streaky strokes with heavy texture gaps */
    const rgb=hex2rgb(col);
    const bristles=10;
    for(let b=0;b<bristles;b++){
      const spread=(b/(bristles-1)-.5)*sz*.7;
      const alpha=0.2+Math.random()*.45;
      sc.strokeStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+alpha.toFixed(2)+')';
      sc.lineWidth=0.5+Math.random()*1.8;sc.lineCap='round';
      sc.setLineDash([2+Math.random()*6,1+Math.random()*4]);
      sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]+spread);
      sc.bezierCurveTo(pts[1][0],pts[1][1]+spread,pts[2][0],pts[2][1]+spread,pts[3][0],pts[3][1]+spread);
      sc.bezierCurveTo(pts[4][0],pts[4][1]+spread,pts[5][0],pts[5][1]+spread,W-8,H/2+spread);
      sc.stroke();
    }
    sc.setLineDash([]);
    /* Dry flecks */
    sc.globalCompositeOperation='destination-out';
    for(let i=0;i<45;i++){
      const tx=8+Math.random()*(W-16);
      const cy=H/2+Math.sin(tx/W*Math.PI*2)*H*.18;
      sc.fillStyle='rgba(0,0,0,'+(Math.random()*.6)+')';
      sc.fillRect(tx,cy+(Math.random()-.5)*sz*.4,1+Math.random()*5,1+Math.random()*3);
    }
    sc.globalCompositeOperation='source-over';

  } else if(t==='shoujin'){
    /* 瘦金 Huizong Slender Gold — sharp angular, nail-head entry, crane-beak exit */
    const rgb=hex2rgb(col);
    sc.fillStyle=col;sc.globalAlpha=0.98;
    const steps=80;const upper=[],lower=[];
    const sjK=Math.max(0.1,sz/5); /* size scaling: default sz=5 -> 1.0 */
    for(let i=0;i<=steps;i++){
      const t2=i/steps;
      const bx=cubicBez(8,W*.25,W*.7,W-8,t2);
      const by=cubicBez(H/2,H/2-H*.22,H/2+H*.12,H/2-2,t2);
      /* Slender Gold signature, scaled by brush size */
      let w;
      if(t2<0.08) w=(2.5+t2/0.08*1.5)*sjK; /* nail-head entrance */
      else if(t2<0.15) w=(4-((t2-0.08)/0.07)*2.8)*sjK; /* rapid thin-down */
      else if(t2>0.88) w=(1.2+((t2-0.88)/0.12)*2.0)*sjK; /* crane-beak flare */
      else w=(1.0+Math.sin((t2-0.15)*Math.PI*0.8)*0.4)*sjK; /* thin body with slight swell */
      upper.push([bx,by-w]);lower.push([bx,by+w]);
    }
    sc.beginPath();sc.moveTo(upper[0][0],upper[0][1]);
    upper.forEach(p=>sc.lineTo(p[0],p[1]));
    for(let i=lower.length-1;i>=0;i--)sc.lineTo(lower[i][0],lower[i][1]);
    sc.closePath();sc.fill();
    /* Sharp angular accent marks */
    sc.strokeStyle=col;sc.lineWidth=1;sc.globalAlpha=0.5;
    sc.beginPath();sc.moveTo(12,H/2-5);sc.lineTo(16,H/2+1);sc.stroke();
    sc.beginPath();sc.moveTo(W-14,H/2-3);sc.lineTo(W-10,H/2+2);sc.stroke();

  /* ── Winsor & Newton Sable Brushes ── */

  } else if(t==='wn_s7mini'){
    /* Series 7 Miniature — ultra-fine detail, precise hairline with spring */
    sc.globalAlpha=0.95;sc.strokeStyle=col;sc.lineWidth=1;sc.lineCap='round';
    sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]);
    sc.bezierCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1],pts[3][0],pts[3][1]);
    sc.bezierCurveTo(pts[4][0],pts[4][1],pts[5][0],pts[5][1],W-8,H/2);
    sc.stroke();
    /* Tiny tip flick at end */
    sc.lineWidth=0.4;sc.globalAlpha=0.5;
    sc.beginPath();sc.moveTo(W-10,H/2);sc.lineTo(W-4,H/2-3);sc.stroke();

  } else if(t==='wn_s7round'){
    /* Series 7 Round — kolinsky sable, excellent spring, smooth pressure taper */
    const rgb=hex2rgb(col);
    sc.fillStyle=col;sc.globalAlpha=0.9;
    const steps=70;const upper=[],lower=[];
    for(let i=0;i<=steps;i++){
      const t2=i/steps;
      const bx=cubicBez(8,W*.3,W*.65,W-8,t2);
      const by=cubicBez(H/2,H/2-H*.24,H/2+H*.18,H/2,t2);
      /* Smooth spring taper — sable belly holds paint, tapers beautifully */
      const press=Math.sin(t2*Math.PI);
      const w=0.6+press*sz*0.38;
      upper.push([bx,by-w]);lower.push([bx,by+w]);
    }
    sc.beginPath();sc.moveTo(upper[0][0],upper[0][1]);
    upper.forEach(p=>sc.lineTo(p[0],p[1]));
    for(let i=lower.length-1;i>=0;i--)sc.lineTo(lower[i][0],lower[i][1]);
    sc.closePath();sc.fill();
    /* Smooth wet edge glow */
    sc.globalAlpha=0.08;sc.shadowBlur=sz*0.8;sc.shadowColor=col;
    sc.fill();sc.shadowBlur=0;

  } else if(t==='wn_sceptre'){
    /* Sceptre Gold — sable/synthetic blend, versatile springy feel */
    const rgb=hex2rgb(col);
    sc.globalAlpha=0.85;
    /* Main stroke with medium softness */
    sc.lineWidth=sz;sc.lineCap='round';sc.lineJoin='round';
    sc.strokeStyle=col;
    sc.shadowBlur=sz*0.5;sc.shadowColor='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.2)';
    sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]);
    sc.bezierCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1],pts[3][0],pts[3][1]);
    sc.bezierCurveTo(pts[4][0],pts[4][1],pts[5][0],pts[5][1],W-8,H/2);
    sc.stroke();sc.shadowBlur=0;
    /* Slight secondary tone for depth */
    sc.globalAlpha=0.15;sc.lineWidth=sz*0.4;
    sc.stroke();

  } else if(t==='wn_flatwash'){
    /* Sable Flat Wash — wide even wash with soft wet edges */
    const rgb=hex2rgb(col);
    sc.globalAlpha=0.6;
    sc.lineWidth=sz*2;sc.lineCap='butt';sc.lineJoin='miter';
    sc.strokeStyle=col;
    sc.shadowBlur=sz*2.5;sc.shadowColor='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.3)';
    sc.beginPath();sc.moveTo(8,H/2);sc.bezierCurveTo(W*.35,H/2-3,W*.65,H/2+3,W-8,H/2);
    sc.stroke();sc.shadowBlur=0;
    /* Watercolour edge buildup */
    sc.globalAlpha=0.18;sc.lineWidth=sz*2+2;
    sc.strokeStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.25)';
    sc.beginPath();sc.moveTo(8,H/2);sc.bezierCurveTo(W*.35,H/2-3,W*.65,H/2+3,W-8,H/2);
    sc.stroke();

  } else if(t==='wn_cotman'){
    /* Cotman Round — springy student brush, clean consistent stroke */
    sc.globalAlpha=0.88;sc.lineWidth=sz;sc.lineCap='round';sc.lineJoin='round';
    sc.strokeStyle=col;sc.shadowBlur=sz*0.3;sc.shadowColor=col;
    sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]);
    sc.bezierCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1],pts[3][0],pts[3][1]);
    sc.bezierCurveTo(pts[4][0],pts[4][1],pts[5][0],pts[5][1],W-8,H/2);
    sc.stroke();sc.shadowBlur=0;

  } else if(t==='wn_rigger'){
    /* Sable Rigger — long thin liner for continuous flowing lines */
    const rgb=hex2rgb(col);
    sc.globalAlpha=0.92;
    /* Primary rigger line — thin and even with slight flex */
    sc.strokeStyle=col;sc.lineWidth=1.8;sc.lineCap='round';
    sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]);
    sc.bezierCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1],pts[3][0],pts[3][1]);
    sc.bezierCurveTo(pts[4][0],pts[4][1],pts[5][0],pts[5][1],W-8,H/2);
    sc.stroke();
    /* Ink loading — slightly thicker at start, thinning toward end */
    sc.globalAlpha=0.35;sc.lineWidth=3;
    sc.beginPath();sc.moveTo(pts[0][0],pts[0][1]);
    sc.bezierCurveTo(pts[1][0],pts[1][1],W*.35,H/2,W*.4,H/2);
    sc.stroke();
  }
  sc.globalAlpha=1;sc.shadowBlur=0;
}

function cubicBez(p0,p1,p2,p3,t){
  return Math.pow(1-t,3)*p0+3*Math.pow(1-t,2)*t*p1+3*(1-t)*t*t*p2+Math.pow(t,3)*p3;
}

function drawTip(canvas,hd,sz){
  const W=canvas.width,H=canvas.height;
  const sc=canvas.getContext('2d');
  sc.clearRect(0,0,W,H);sc.fillStyle='#111';sc.fillRect(0,0,W,H);
  const r=Math.min(sz/2*0.8,13),cx=W/2,cy=H/2;
  const blur=Math.max(0,(1-hd)*r*2.5);
  const g=sc.createRadialGradient(cx,cy,r*hd*0.6,cx,cy,r);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(1,'rgba(255,255,255,'+Math.max(0,(1-hd)*0.03).toFixed(3)+')');
  sc.fillStyle=g;sc.shadowBlur=blur;sc.shadowColor='rgba(255,255,255,0.8)';
  sc.beginPath();sc.arc(cx,cy,r,0,Math.PI*2);sc.fill();sc.shadowBlur=0;
}

function syncToApp(sz,hd,op,tp){
  window.brushSz=sz;window.brushHd=hd;window.brushOp=op;if(tp)window.brushType=tp;
  /* Ensure brush tool is active when selecting from picker */
  if(typeof setTool==='function'&&!window.curTool) setTool('brush');
  var szr=document.getElementById('szr');if(szr){szr.value=sz;document.getElementById('szv').textContent=sz;}
  var hdr=document.getElementById('hdr');if(hdr){hdr.value=Math.round(hd*100);document.getElementById('hdv').textContent=Math.round(hd*100)+'%';}
  var opr=document.getElementById('opr');if(opr){opr.value=Math.round(op*100);document.getElementById('opv').textContent=Math.round(op*100)+'%';}
}

function buildTips(){
  tipRow.innerHTML='';
  TIPS.forEach(function(tp,i){
    var div=document.createElement('div');div.className='bp-tip'+(i===activeTip?' active':'');
    var cv=document.createElement('canvas');cv.width=32;cv.height=32;
    drawTip(cv,tp.hd,tp.sz);div.appendChild(cv);
    div.addEventListener('click',function(){
      activeTip=i;
      document.querySelectorAll('.bp-tip').forEach(function(d,j){d.classList.toggle('active',j===i);});
      szSlider.value=tp.sz;szVal.textContent=tp.sz+' px';
      hdSlider.value=Math.round(tp.hd*100);hdVal.textContent=Math.round(tp.hd*100)+'%';
      syncToApp(tp.sz,tp.hd,window.brushOp||0.9);drawPreview();
    });
    tipRow.appendChild(div);
  });
}

function buildList(filter){
  bpList.innerHTML='';
  var q=(filter||'').toLowerCase();
  var col=getCol();
  BRUSHES.forEach(function(b,i){
    if(q&&b.name.toLowerCase().indexOf(q)<0)return;
    var div=document.createElement('div');div.className='bp-brush'+(i===activeBrush?' active':'');
    var cv=document.createElement('canvas');cv.className='bp-stroke-preview';cv.width=260;cv.height=32;
    drawStroke(cv,b.hd,b.sz,col,b.type);
    var nm=document.createElement('div');nm.className='bp-brush-name';nm.textContent=b.name;
    div.appendChild(cv);div.appendChild(nm);
    div.addEventListener('click',function(){
      activeBrush=i;
      document.querySelectorAll('.bp-brush').forEach(function(d,j){d.classList.toggle('active',j===i);});
      szSlider.value=b.sz;szVal.textContent=b.sz+' px';
      hdSlider.value=Math.round(b.hd*100);hdVal.textContent=Math.round(b.hd*100)+'%';
      opSlider.value=Math.round(b.op*100);opVal.textContent=Math.round(b.op*100)+'%';
      syncToApp(b.sz,b.hd,b.op,b.type);drawPreview();
    });
    bpList.appendChild(div);
  });
}

function updateColSwatch(){
  var col=getCol();colIn.value=col;
  colPrev.fillStyle=col;colPrev.fillRect(0,0,22,22);
}

var _bpPos=null; /* saved drag position */

function openBrushPicker(){
  if(_bpPos){
    bpBox.style.left=_bpPos.left+'px';
    bpBox.style.top=_bpPos.top+'px';
  } else {
    var tb=document.getElementById('tb');
    if(tb){var r=tb.getBoundingClientRect();bpBox.style.left=Math.max(4,r.left-298)+'px';bpBox.style.top='10px';}
    else{bpBox.style.left='50px';bpBox.style.top='40px';}
  }
  var sz=window.brushSz||10,hd=window.brushHd||0.7,op=window.brushOp||0.9;
  szSlider.value=sz;szVal.textContent=sz+' px';
  hdSlider.value=Math.round(hd*100);hdVal.textContent=Math.round(hd*100)+'%';
  opSlider.value=Math.round(op*100);opVal.textContent=Math.round(op*100)+'%';
  updateColSwatch();buildTips();buildList();drawPreview();
  modal.classList.add('open');
  if(window.bringToFront) window.bringToFront('bp-box');
}

function closeBrushPicker(){
  modal.classList.remove('open');
  /* Ensure brush tool is active after closing picker */
  if(typeof setTool==='function'&&!window.curTool) setTool('brush');
}

/* Drag header */
(function(){
  var head=document.getElementById('bp-box-head');
  if(!head)return;
  head.style.touchAction='none';
  head.addEventListener('pointerdown',function(e){
    if(e.target.id==='bp-close'||e.target.closest('#bp-close'))return;
    e.preventDefault();head.style.cursor='grabbing';
    var r=bpBox.getBoundingClientRect();
    var drag={sx:e.clientX,sy:e.clientY,ol:r.left,ot:r.top};
    try{head.setPointerCapture(e.pointerId);}catch(_){}
    function mv(ev){
      var nl=Math.max(0,Math.min(window.innerWidth-60,drag.ol+(ev.clientX-drag.sx)));
      var nt=Math.max(0,Math.min(window.innerHeight-40,drag.ot+(ev.clientY-drag.sy)));
      bpBox.style.left=nl+'px';bpBox.style.top=nt+'px';
      _bpPos={left:nl,top:nt};
    }
    function up(){head.style.cursor='grab';document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);}
    document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
  });
})();

/* Save / Reset brush settings */
var _bpSaved=null;
document.getElementById('bp-save-settings').addEventListener('click',function(){
  _bpSaved={sz:parseInt(szSlider.value),hd:parseInt(hdSlider.value),op:parseInt(opSlider.value),col:colIn.value,type:window.brushType||'round_hard'};
  var st=document.getElementById('bp-settings-status');
  if(st){st.textContent='Settings saved';setTimeout(function(){st.textContent='';},2000);}
});
document.getElementById('bp-reset-settings').addEventListener('click',function(){
  szSlider.value=10;szVal.textContent='10 px';window.brushSz=10;
  hdSlider.value=70;hdVal.textContent='70%';window.brushHd=0.7;
  opSlider.value=90;opVal.textContent='90%';window.brushOp=0.9;
  syncToApp(10,0.7,0.9,'round_hard');window.brushType='round_hard';
  drawPreview();buildList(searchIn.value);
  var st=document.getElementById('bp-settings-status');
  if(st){st.textContent='Reset to defaults';setTimeout(function(){st.textContent='';},2000);}
});

szSlider.addEventListener('input',function(){
  var sz=parseInt(szSlider.value);szVal.textContent=sz+' px';
  window.brushSz=sz;
  var el=document.getElementById('szr');if(el){el.value=sz;document.getElementById('szv').textContent=sz;}
  drawPreview();
  if(typeof replayLastStroke==='function'&&window._lastStroke)replayLastStroke();
});
hdSlider.addEventListener('input',function(){
  var hd=parseInt(hdSlider.value)/100;hdVal.textContent=hdSlider.value+'%';
  window.brushHd=hd;
  var el=document.getElementById('hdr');if(el){el.value=hdSlider.value;document.getElementById('hdv').textContent=hdSlider.value+'%';}
  drawPreview();
  if(typeof replayLastStroke==='function'&&window._lastStroke)replayLastStroke();
});
opSlider.addEventListener('input',function(){
  var op=parseInt(opSlider.value)/100;opVal.textContent=opSlider.value+'%';
  window.brushOp=op;
  var el=document.getElementById('opr');if(el){el.value=opSlider.value;document.getElementById('opv').textContent=opSlider.value+'%';}
  if(typeof replayLastStroke==='function'&&window._lastStroke)replayLastStroke();
});
colIn.addEventListener('input',function(){
  window.drawCol=colIn.value;
  var el=document.getElementById('dcol');if(el)el.value=colIn.value;
  var sw=document.getElementById('csw');if(sw)sw.style.background=colIn.value;
  var tx=document.getElementById('dcoltxt');if(tx)tx.textContent=colIn.value;
  colPrev.fillStyle=colIn.value;colPrev.fillRect(0,0,22,22);
  buildList(searchIn.value);drawPreview();
  if(typeof replayLastStroke==='function'&&window._lastStroke)replayLastStroke();
});
searchIn.addEventListener('input',function(){buildList(searchIn.value);});
document.getElementById('bp-close').addEventListener('click',closeBrushPicker);
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.key==='Escape'&&modal.classList.contains('open'))closeBrushPicker();
});

/* Hook brush toolbar button — toggle open/close */
var brushBtn=document.querySelector('.tbtn[data-t="brush"]');
if(brushBtn){
  brushBtn.addEventListener('click',function(){
    if(modal.classList.contains('open')){closeBrushPicker();}
    else{setTimeout(openBrushPicker,0);}
  });
}
window._openBrushPicker=openBrushPicker;

/* ── Brush Palette Selector (inside brush picker IIFE) ── */
var bpPalSel=document.getElementById('bp-pal-sel');
var bpSwatchWrap=document.getElementById('bp-pal-swatches');

function bpPopulatePalOptions(){
  if(!bpPalSel)return;
  bpPalSel.innerHTML='';
  var pals=window.PALS||{};
  Object.keys(pals).forEach(function(k){
    var opt=document.createElement('option');
    opt.value=k;
    opt.textContent=k.charAt(0).toUpperCase()+k.slice(1);
    bpPalSel.appendChild(opt);
  });
  var mainPal=document.getElementById('pal');
  if(mainPal)bpPalSel.value=mainPal.value;
}

function bpSetBrushColor(hex){
  window.drawCol=hex;
  colIn.value=hex;
  var el=document.getElementById('dcol');if(el)el.value=hex;
  var csw=document.getElementById('csw');if(csw)csw.style.background=hex;
  var tx=document.getElementById('dcoltxt');if(tx)tx.textContent=hex;
  colPrev.fillStyle=hex;colPrev.fillRect(0,0,22,22);
  buildList(searchIn.value);drawPreview();
  if(typeof replayLastStroke==='function'&&window._lastStroke)replayLastStroke();
}

function bpRenderSwatches(){
  if(!bpSwatchWrap)return;
  bpSwatchWrap.innerHTML='';
  var pals=window.PALS||{};
  var pal=pals[bpPalSel.value];
  if(!pal||!pal.c)return;
  var allCols=[pal.bg].concat(pal.c);
  var curCol=(window.drawCol||'#ff4040').toLowerCase();
  allCols.forEach(function(hex){
    var sw=document.createElement('div');
    var isActive=hex.toLowerCase()===curCol;
    sw.style.cssText='width:20px;height:20px;background:'+hex+';border:2px solid '+(isActive?'#40c8a0':'rgba(255,255,255,0.1)')+';border-radius:3px;cursor:pointer;flex-shrink:0;transition:border-color .15s;';
    sw.title=hex;
    sw.addEventListener('mouseenter',function(){if(!isActive)sw.style.borderColor='rgba(255,255,255,0.5)';});
    sw.addEventListener('mouseleave',function(){sw.style.borderColor=isActive?'#40c8a0':'rgba(255,255,255,0.1)';});
    sw.addEventListener('click',function(){
      bpSetBrushColor(hex);
      bpRenderSwatches();
    });
    bpSwatchWrap.appendChild(sw);
  });
}

/* ── Recolor canvas pixels: remap old palette → new palette ── */
var _bpCurrentPalKey=null; /* tracks which palette is "current" for recolor */

function _bpHex2rgb(hex){
  hex=hex.replace('#','');
  if(hex.length===3) hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
}

function _bpColorDist(r1,g1,b1,r2,g2,b2){
  var dr=r1-r2,dg=g1-g2,db=b1-b2;
  return dr*dr+dg*dg+db*db;
}

function _bpRecolorCanvas(oldPalKey,newPalKey){
  var pals=window.PALS||{};
  var oldPal=pals[oldPalKey], newPal=pals[newPalKey];
  if(!oldPal||!newPal||!oldPal.c||!newPal.c) return;

  /* Build old→new color map (bg + all palette colors) */
  var oldCols=[oldPal.bg].concat(oldPal.c);
  var newCols=[newPal.bg].concat(newPal.c);
  var mapLen=Math.min(oldCols.length,newCols.length);

  /* Pre-compute RGB arrays for old palette */
  var oldRGB=[];
  for(var i=0;i<mapLen;i++) oldRGB.push(_bpHex2rgb(oldCols[i]));
  var newRGB=[];
  for(var i=0;i<mapLen;i++) newRGB.push(_bpHex2rgb(newCols[i]));

  function recolorImageData(imgData){
    var d=imgData.data, len=d.length, changed=false;
    for(var px=0;px<len;px+=4){
      if(d[px+3]===0) continue; /* skip fully transparent */
      var r=d[px],g=d[px+1],b=d[px+2];

      /* Find TWO nearest old palette colors for weighted blending */
      var best1=-1, dist1=Infinity, best2=-1, dist2=Infinity;
      for(var ci=0;ci<mapLen;ci++){
        var dist=_bpColorDist(r,g,b,oldRGB[ci][0],oldRGB[ci][1],oldRGB[ci][2]);
        if(dist<dist1){best2=best1;dist2=dist1;best1=ci;dist1=dist;}
        else if(dist<dist2){best2=ci;dist2=dist;}
      }
      if(best1<0) continue;

      if(best2<0||dist1===0){
        /* Exact match or only one ref — direct map */
        d[px]=newRGB[best1][0];d[px+1]=newRGB[best1][1];d[px+2]=newRGB[best1][2];
      } else {
        /* Weighted blend between two nearest palette colors.
           This preserves gradients, anti-aliasing and intermediate tones. */
        var s1=Math.sqrt(dist1), s2=Math.sqrt(dist2);
        var total=s1+s2;
        var w1=1-(s1/total), w2=1-w1; /* closer = higher weight */
        var nr=Math.round(w1*newRGB[best1][0]+w2*newRGB[best2][0]);
        var ng=Math.round(w1*newRGB[best1][1]+w2*newRGB[best2][1]);
        var nb=Math.round(w1*newRGB[best1][2]+w2*newRGB[best2][2]);

        /* Preserve luminance ratio: if pixel was darker/brighter than old ref, keep that */
        var oldLum=0.299*r+0.587*g+0.114*b;
        var refLum=0.299*(w1*oldRGB[best1][0]+w2*oldRGB[best2][0])
                  +0.587*(w1*oldRGB[best1][1]+w2*oldRGB[best2][1])
                  +0.114*(w1*oldRGB[best1][2]+w2*oldRGB[best2][2]);
        var lumScale=refLum>0?(oldLum/refLum):1;
        nr=Math.round(nr*lumScale);
        ng=Math.round(ng*lumScale);
        nb=Math.round(nb*lumScale);

        d[px]=Math.max(0,Math.min(255,nr));
        d[px+1]=Math.max(0,Math.min(255,ng));
        d[px+2]=Math.max(0,Math.min(255,nb));
      }
      changed=true;
    }
    return changed;
  }

  /* Recolor all layers if layer system is active */
  if(window.layers&&window.layers.length>0){
    for(var li=0;li<window.layers.length;li++){
      var layer=window.layers[li];
      if(!layer.ctx||!layer.canvas) continue;
      var w=layer.canvas.width,h=layer.canvas.height;
      var img=layer.ctx.getImageData(0,0,w,h);
      if(recolorImageData(img)) layer.ctx.putImageData(img,0,0);
    }
    if(window._layersCompositeFn) window._layersCompositeFn();
    if(window._layersUpdateThumbs) window._layersUpdateThumbs();
  } else {
    /* No layers — recolor dv directly */
    var w2=window.dv.width,h2=window.dv.height;
    var img2=window.dctx.getImageData(0,0,w2,h2);
    if(recolorImageData(img2)) window.dctx.putImageData(img2,0,0);
  }

  /* Also recolor the engine canvas (cv) if it has content */
  if(window.cv&&window.ctx){
    var wc=window.cv.width,hc=window.cv.height;
    var imgC=window.ctx.getImageData(0,0,wc,hc);
    if(recolorImageData(imgC)) window.ctx.putImageData(imgC,0,0);
  }
}

if(bpPalSel){
  bpPalSel.addEventListener('change',function(){
    var newKey=bpPalSel.value;
    var pals=window.PALS||{};
    var pal=pals[newKey];

    /* Recolor existing canvas content from old palette to new */
    if(_bpCurrentPalKey&&_bpCurrentPalKey!==newKey){
      _bpRecolorCanvas(_bpCurrentPalKey,newKey);
    }
    _bpCurrentPalKey=newKey;

    /* Auto-select first palette color */
    if(pal&&pal.c&&pal.c.length){
      bpSetBrushColor(pal.c[0]);
    }
    bpRenderSwatches();

    /* Sync main panel palette selector */
    var mainPal=document.getElementById('pal');
    if(mainPal&&mainPal.value!==newKey){
      mainPal.value=newKey;
      if(typeof drawSw==='function') drawSw();
    }
  });
}

/* Sync when main palette changes */
var _mainPal=document.getElementById('pal');
if(_mainPal){
  var _origPalOnChange=_mainPal.onchange;
  _mainPal.onchange=function(){
    if(_origPalOnChange)_origPalOnChange.apply(this,arguments);
    var newKey=_mainPal.value;
    if(bpPalSel)bpPalSel.value=newKey;
    _bpCurrentPalKey=newKey;
    bpRenderSwatches();
  };
}

/* Patch openBrushPicker to init palette */
var _origOpenBP=openBrushPicker;
openBrushPicker=function(){
  _origOpenBP();
  bpPopulatePalOptions();
  bpRenderSwatches();
  /* Track current palette so recolor knows the "from" palette */
  var mainPal=document.getElementById('pal');
  if(mainPal) _bpCurrentPalKey=mainPal.value;
};
window._openBrushPicker=openBrushPicker;
window._bpRecolorCanvas=_bpRecolorCanvas;

/* Refresh swatches when color changes via native picker */
colIn.addEventListener('input',function(){
  setTimeout(bpRenderSwatches,10);
});

})();
