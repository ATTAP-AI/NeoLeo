/* ══════════════════════════════════════════════════════════════════════
   MOTION — Kinetic Energy & Movement in Still Images
   Five systems that generate the feeling of motion and dynamic energy.
   Zero images. Zero corpus. Pure first principles.
   ══════════════════════════════════════════════════════════════════════ */
(function(){

/* ── System definitions ── */
var SYSTEMS=[
  {id:'flow', name:'Flow Field',
   nature:'Wind currents, smoke trails, river currents, hair strands, magnetic field lines, Van Gogh skies, visible wind',
   desc:'Streamlines traced through a 2D noise vector field via Euler integration. Each line follows the local flow direction, creating visible currents.',
   labels:['Density','Curl','Length','Turbulence','Thickness'],
   min:[5,5,5,0,5], max:[100,100,100,100,100],
   def:[55,40,60,30,25],
   fmt:[function(v){return Math.round(50+v*19.5);},function(v){return (v/20).toFixed(1);},
        function(v){return Math.round(10+v*1.9);},function(v){return Math.round(v)+'%';},
        function(v){return (0.5+v*0.035).toFixed(1)+'px';}]},
  {id:'blur', name:'Motion Blur',
   nature:'Long-exposure photography, manga speed lines, zoom lens bursts, car light trails at night, falling rain, comet tails',
   desc:'Directional, radial, or zoom-burst particle streaks with velocity-based length and gradient alpha. Three modes in one system.',
   labels:['Particles','Speed','Direction','Spread','Intensity'],
   min:[5,5,0,0,5], max:[100,100,100,100,100],
   def:[50,60,50,40,45],
   fmt:[function(v){return Math.round(100+v*29);},function(v){return Math.round(v)+'%';},
        function(v){return v<34?'Linear':v<67?'Radial':'Zoom';},
        function(v){return Math.round(v)+'\u00b0';},
        function(v){return Math.round(v)+'%';}]},
  {id:'vortex', name:'Vortex',
   nature:'Whirlpools, galaxies, hurricanes, stirred paint, spiral energy, nautilus growth, tornado funnels',
   desc:'Logarithmic spiral particle paths: r(\u03b8) = a\u00b7e^(b\u03b8). Arms radiate from center with turbulent displacement and comet-like particle trails.',
   labels:['Arms','Tightness','Particles','Turbulence','Trails'],
   min:[1,5,10,0,5], max:[8,100,100,100,100],
   def:[3,50,55,35,45],
   fmt:[function(v){return Math.round(v);},function(v){return (v/100).toFixed(2);},
        function(v){return Math.round(200+v*38);},function(v){return Math.round(v)+'%';},
        function(v){return Math.round(v)+'%';}]},
  {id:'strobe', name:'Stroboscopic',
   nature:'Chronophotography, Duchamp multi-exposure, stop-motion trails, bouncing ball studies, dance movement notation',
   desc:'Repeated geometric forms along a B\u00e9zier trajectory with progressive scale, rotation, and opacity shifts \u2014 capturing time frozen in space.',
   labels:['Copies','Shape','Arc','Scale shift','Fade'],
   min:[3,0,0,0,0], max:[20,100,100,100,100],
   def:[8,30,55,40,60],
   fmt:[function(v){return Math.round(v);},
        function(v){return v<21?'Circle':v<41?'Rectangle':v<61?'Triangle':v<81?'Star':'Figure';},
        function(v){return Math.round(v)+'%';},function(v){return Math.round(v)+'%';},
        function(v){return Math.round(v)+'%';}]},
  {id:'shock', name:'Shockwave',
   nature:'Impact ripples, sonic booms, seismic waves, pebble in still water, supernova remnants, explosion rings',
   desc:'Expanding concentric rings with noise displacement, inter-ring debris particles, and radial energy decay from epicenter.',
   labels:['Rings','Energy','Distortion','Debris','Decay'],
   min:[2,5,0,0,5], max:[12,100,100,100,100],
   def:[6,55,40,35,50],
   fmt:[function(v){return Math.round(v);},function(v){return Math.round(v)+'%';},
        function(v){return Math.round(v)+'%';},function(v){return Math.round(v*5);},
        function(v){return Math.round(v)+'%';}]}
];

var M={sysIdx:0, cycleIdx:-1};

/* ── PRNG ── */
function prng(s){
  s=s>>>0;
  return function(){
    s+=0x6D2B79F5;var t=s;
    t=(t^(t>>>15))*((t|1)>>>0);
    t^=t+(t^(t>>>7))*(t|61);
    return((t^(t>>>14))>>>0)/4294967296;
  };
}

/* ── Shared hex-to-RGB helper ── */
function hRGB(h){
  if(!h||h.length<7)return[224,96,64];
  return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
}

/* ── Get palette colours ── */
function palCols(){
  var p=typeof gpal==='function'?gpal():null;
  return p&&p.c&&p.c.length?p.c:['#e06040','#f0a060','#c04030','#ff8060','#e0c080','#d06050'];
}

/* ── Param helpers ── */
function getSys(){return SYSTEMS[M.sysIdx];}
function pv(i){
  var el=document.getElementById('motn-p'+(i+1));
  return el?parseInt(el.value):getSys().def[i];
}

/* ── Simple value noise (inline for independence) ── */
function vnLocal(x,y,seed){
  if(typeof vn==='function') return vn(x,y,seed);
  /* Fallback: hash-based noise */
  var n=Math.sin(x*127.1+y*311.7+seed*113.5)*43758.5453;
  return n-Math.floor(n);
}

function fbmLocal(x,y,seed,octaves){
  octaves=octaves||5;
  var val=0,amp=0.5,freq=1;
  for(var i=0;i<octaves;i++){
    val+=amp*vnLocal(x*freq,y*freq,seed+i*17);
    amp*=0.5;freq*=2;
  }
  return val;
}

/* ── Slider wiring ── */
function wireSliders(){
  var sys=getSys();
  var _t=null;
  function schedRender(){clearTimeout(_t);_t=setTimeout(doRender,120);}
  for(var i=0;i<5;i++){
    (function(idx){
      var sl=document.getElementById('motn-p'+(idx+1));
      var lb=document.getElementById('motn-l'+(idx+1));
      var vl=document.getElementById('motn-v'+(idx+1));
      if(!sl)return;
      sl.min=sys.min[idx];sl.max=sys.max[idx];sl.value=sys.def[idx];
      if(lb)lb.textContent=sys.labels[idx];
      if(vl)vl.textContent=sys.fmt[idx](sys.def[idx]);
      sl.oninput=function(){
        var v=parseInt(this.value);
        if(vl)vl.textContent=sys.fmt[idx](v);
        schedRender();
      };
    })(i);
  }
  var desc=document.getElementById('motn-desc');
  if(desc)desc.textContent=sys.desc;
}

/* ════ RENDERERS ════ */

/* ── 1. Flow Field ── */
function renderFlow(ctx,W,H,cols){
  ctx.clearRect(0,0,W,H);
  var density=Math.round(50+pv(0)*19.5);
  var curl=pv(1)/20;
  var length=Math.round(10+pv(2)*1.9);
  var turb=pv(3)/100;
  var thick=0.5+pv(4)*0.035;
  var rng=prng(0xF10F1ED);
  var sd=Math.floor(rng()*99999);

  /* Build streamline start points */
  var pts=[];
  for(var i=0;i<density;i++){
    var px=rng()*W,py=rng()*H;
    /* IS density bias */
    if(window._IS&&window._IS.active){
      var d=window._IS.getDens(px/W,py/H);
      if(rng()>d+0.2){i--;continue;}
    }
    pts.push([px,py]);
  }

  /* Trace streamlines */
  var stepSize=Math.min(W,H)*0.008;
  for(var si=0;si<pts.length;si++){
    var x=pts[si][0],y=pts[si][1];
    var col=cols[si%cols.length];
    var c=hRGB(col);
    ctx.beginPath();
    ctx.moveTo(x,y);
    for(var step=0;step<length;step++){
      /* Vector field angle from noise */
      var nx=x/W*curl*4, ny=y/H*curl*4;
      var angle=fbmLocal(nx,ny,sd,3+Math.floor(turb*4))*Math.PI*2;
      /* IS gradient bias */
      if(window._IS&&window._IS.active){
        var gd=window._IS.getGradDir(x/W,y/H);
        if(gd)angle+=Math.atan2(gd[1],gd[0])*0.3;
      }
      x+=Math.cos(angle)*stepSize;
      y+=Math.sin(angle)*stepSize;
      /* Boundary wrap */
      if(x<0)x+=W; if(x>W)x-=W;
      if(y<0)y+=H; if(y>H)y-=H;
      ctx.lineTo(x,y);
    }
    /* Tapered stroke */
    var t=si/pts.length;
    var alpha=0.3+t*0.5;
    var lw=thick*(0.5+rng()*1.0);
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+alpha.toFixed(2)+')';
    ctx.lineWidth=lw;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.stroke();
  }
}

/* ── 2. Motion Blur ── */
function renderBlur(ctx,W,H,cols){
  ctx.clearRect(0,0,W,H);
  var count=Math.round(100+pv(0)*29);
  var speed=pv(1)/100;
  var dirVal=pv(2);
  var spread=pv(3)/100*Math.PI*0.5;
  var intensity=pv(4)/100;
  var rng=prng(0xB1A7E0);
  var cx=W/2,cy=H/2;

  /* Determine mode */
  var mode=dirVal<34?'linear':dirVal<67?'radial':'zoom';

  /* Base angle for linear mode */
  var baseAngle=rng()*Math.PI*2;
  if(window._IS&&window._IS.active){
    var gd=window._IS.getGradDir(0.5,0.5);
    if(gd)baseAngle=Math.atan2(gd[1],gd[0]);
  }

  for(var i=0;i<count;i++){
    var px=rng()*W, py=rng()*H;
    var angle,streakLen;

    if(mode==='linear'){
      angle=baseAngle+(rng()-0.5)*spread*2;
      streakLen=speed*Math.min(W,H)*0.15*(0.5+rng()*0.5);
    } else if(mode==='radial'){
      angle=Math.atan2(py-cy,px-cx)+(rng()-0.5)*spread;
      streakLen=speed*Math.min(W,H)*0.12*(0.5+rng()*0.5);
    } else {
      /* Zoom: radial from center, length proportional to distance */
      var dx=px-cx, dy=py-cy;
      var dist=Math.sqrt(dx*dx+dy*dy);
      angle=Math.atan2(dy,dx)+(rng()-0.5)*spread*0.3;
      streakLen=speed*dist*0.25*(0.5+rng()*0.5);
    }

    var ex=px+Math.cos(angle)*streakLen;
    var ey=py+Math.sin(angle)*streakLen;

    /* Draw streak with gradient */
    var col=cols[i%cols.length];
    var c=hRGB(col);
    var lw=0.5+rng()*2.5;

    /* Gradient line — draw as multiple small segments with fading alpha */
    var segs=Math.max(4,Math.floor(streakLen/3));
    for(var s=0;s<segs;s++){
      var t=s/segs;
      var t2=(s+1)/segs;
      var sx=px+(ex-px)*t, sy=py+(ey-py)*t;
      var sx2=px+(ex-px)*t2, sy2=py+(ey-py)*t2;
      var alpha=intensity*(1-t*0.8);
      ctx.beginPath();
      ctx.moveTo(sx,sy);
      ctx.lineTo(sx2,sy2);
      ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+alpha.toFixed(2)+')';
      ctx.lineWidth=lw*(1-t*0.6);
      ctx.lineCap='round';
      ctx.stroke();
    }
  }
}

/* ── 3. Vortex ── */
function renderVortex(ctx,W,H,cols){
  ctx.clearRect(0,0,W,H);
  var arms=pv(0);
  var tightness=pv(1)/100;
  var particleCount=Math.round(200+pv(2)*38);
  var turb=pv(3)/100;
  var trailLen=pv(4)/100;
  var rng=prng(0xA0A7E4);

  var cx=W/2, cy=H/2;
  /* IS bias for center */
  if(window._IS&&window._IS.active){
    cx+=((window._IS.getDens(0.6,0.5)-window._IS.getDens(0.4,0.5))*W*0.2);
    cy+=((window._IS.getDens(0.5,0.6)-window._IS.getDens(0.5,0.4))*H*0.2);
  }

  var maxR=Math.min(W,H)*0.45;

  /* Core glow */
  var gc=hRGB(cols[0]||'#e06040');
  var grad=ctx.createRadialGradient(cx,cy,0,cx,cy,maxR*0.3);
  grad.addColorStop(0,'rgba('+gc[0]+','+gc[1]+','+gc[2]+',0.3)');
  grad.addColorStop(1,'rgba('+gc[0]+','+gc[1]+','+gc[2]+',0)');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);

  /* Spiral particles */
  var b=0.15+tightness*0.4; /* spiral growth rate */
  for(var i=0;i<particleCount;i++){
    var arm=Math.floor(rng()*arms);
    var armOffset=arm*(Math.PI*2/arms);
    var theta=(rng()*6+0.5)*Math.PI; /* angle along spiral */
    var r=4*Math.exp(b*theta/Math.PI);
    if(r>maxR)r=maxR*rng();

    /* Noise displacement */
    var nx=vnLocal(theta*2,arm*10,0x5EED1)*turb*maxR*0.15;
    var ny=vnLocal(theta*2+100,arm*10,0x5EED1)*turb*maxR*0.15;

    var px=cx+Math.cos(theta+armOffset)*r+nx;
    var py=cy+Math.sin(theta+armOffset)*r+ny;

    /* Tangent direction for trail */
    var tangent=theta+armOffset+Math.PI/2;

    /* Trail */
    var tLen=(3+trailLen*15)*(0.5+rng()*0.5);
    var tx=px-Math.cos(tangent)*tLen;
    var ty=py-Math.sin(tangent)*tLen;

    var t=r/maxR;
    var col=cols[Math.floor(t*cols.length)%cols.length];
    var c=hRGB(col);
    var alpha=0.4+0.5*(1-t);
    var lw=0.8+rng()*2*(1-t*0.5);

    ctx.beginPath();
    ctx.moveTo(px,py);
    ctx.lineTo(tx,ty);
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+alpha.toFixed(2)+')';
    ctx.lineWidth=lw;
    ctx.lineCap='round';
    ctx.stroke();

    /* Head dot */
    if(rng()>0.5){
      ctx.beginPath();
      ctx.arc(px,py,lw*0.6,0,Math.PI*2);
      ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+Math.min(1,alpha+0.2).toFixed(2)+')';
      ctx.fill();
    }
  }
}

/* ── 4. Stroboscopic ── */
function renderStrobe(ctx,W,H,cols){
  ctx.clearRect(0,0,W,H);
  var copies=pv(0);
  var shapeVal=pv(1);
  var arc=pv(2)/100;
  var scaleShift=pv(3)/100;
  var fade=pv(4)/100;
  var rng=prng(0x57AB0E);

  /* Trajectory: quadratic Bezier */
  var margin=Math.min(W,H)*0.15;
  var p0=[margin+rng()*W*0.2, H*0.3+rng()*H*0.4];
  var p2=[W-margin-rng()*W*0.2, H*0.3+rng()*H*0.4];

  /* IS bias */
  if(window._IS&&window._IS.active){
    var d1=window._IS.getDens(0.3,0.5), d2=window._IS.getDens(0.7,0.5);
    p0[1]=H*(0.2+d1*0.6); p2[1]=H*(0.2+d2*0.6);
  }

  /* Control point — arc determines curvature */
  var midX=(p0[0]+p2[0])/2, midY=(p0[1]+p2[1])/2;
  var cpY=midY-arc*Math.min(W,H)*0.8*(rng()>0.5?1:-1);
  var p1=[midX+(rng()-0.5)*W*0.2, cpY];

  /* Determine shape */
  var shapeType=shapeVal<21?'circle':shapeVal<41?'rect':shapeVal<61?'tri':shapeVal<81?'star':'figure';
  var baseSize=Math.min(W,H)*0.06;

  /* Draw connecting trajectory line */
  ctx.beginPath();
  ctx.moveTo(p0[0],p0[1]);
  ctx.quadraticCurveTo(p1[0],p1[1],p2[0],p2[1]);
  var tc=hRGB(cols[0]||'#e06040');
  ctx.strokeStyle='rgba('+tc[0]+','+tc[1]+','+tc[2]+',0.08)';
  ctx.lineWidth=1;ctx.setLineDash([4,6]);ctx.stroke();ctx.setLineDash([]);

  /* Sample positions along Bezier */
  for(var i=0;i<copies;i++){
    var t=i/(copies-1);
    var u=1-t;
    var bx=u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0];
    var by=u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1];

    /* Scale */
    var sz=baseSize*(1+scaleShift*(t-0.5)*2);

    /* Rotation — follow tangent + spin */
    var tanX=2*u*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]);
    var tanY=2*u*(p1[1]-p0[1])+2*t*(p2[1]-p1[1]);
    var rot=Math.atan2(tanY,tanX)+t*Math.PI*0.5;

    /* Alpha — newest (last) is brightest */
    var alpha=fade>0? (0.15+(1-fade)*0.85)+(fade*0.85)*(t) : 1;
    alpha=Math.min(1,Math.max(0.08,alpha));

    var col=cols[i%cols.length];
    var c=hRGB(col);

    ctx.save();
    ctx.translate(bx,by);
    ctx.rotate(rot);
    ctx.globalAlpha=alpha;

    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.85)';
    ctx.strokeStyle='rgba('+Math.min(255,c[0]+40)+','+Math.min(255,c[1]+40)+','+Math.min(255,c[2]+40)+',0.6)';
    ctx.lineWidth=1.5;

    if(shapeType==='circle'){
      ctx.beginPath();ctx.arc(0,0,sz,0,Math.PI*2);ctx.fill();ctx.stroke();
    } else if(shapeType==='rect'){
      ctx.fillRect(-sz,-sz*0.7,sz*2,sz*1.4);
      ctx.strokeRect(-sz,-sz*0.7,sz*2,sz*1.4);
    } else if(shapeType==='tri'){
      ctx.beginPath();
      ctx.moveTo(0,-sz);ctx.lineTo(sz*0.87,sz*0.5);ctx.lineTo(-sz*0.87,sz*0.5);ctx.closePath();
      ctx.fill();ctx.stroke();
    } else if(shapeType==='star'){
      ctx.beginPath();
      for(var s=0;s<10;s++){
        var sa=s*Math.PI/5-Math.PI/2;
        var sr=s%2===0?sz:sz*0.4;
        if(s===0)ctx.moveTo(Math.cos(sa)*sr,Math.sin(sa)*sr);
        else ctx.lineTo(Math.cos(sa)*sr,Math.sin(sa)*sr);
      }
      ctx.closePath();ctx.fill();ctx.stroke();
    } else {
      /* Stick figure */
      ctx.lineWidth=2;ctx.lineCap='round';
      ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+alpha.toFixed(2)+')';
      /* Head */
      ctx.beginPath();ctx.arc(0,-sz*0.6,sz*0.25,0,Math.PI*2);ctx.stroke();
      /* Body */
      ctx.beginPath();ctx.moveTo(0,-sz*0.35);ctx.lineTo(0,sz*0.3);ctx.stroke();
      /* Arms */
      var armSwing=t*Math.PI*0.6;
      ctx.beginPath();ctx.moveTo(-sz*0.5,-sz*0.1+Math.sin(armSwing)*sz*0.2);ctx.lineTo(0,-sz*0.15);
      ctx.lineTo(sz*0.5,-sz*0.1-Math.sin(armSwing)*sz*0.2);ctx.stroke();
      /* Legs */
      ctx.beginPath();ctx.moveTo(-sz*0.35,sz*0.8+Math.cos(armSwing)*sz*0.15);ctx.lineTo(0,sz*0.3);
      ctx.lineTo(sz*0.35,sz*0.8-Math.cos(armSwing)*sz*0.15);ctx.stroke();
    }

    ctx.restore();
  }
  ctx.globalAlpha=1;
}

/* ── 5. Shockwave ── */
function renderShock(ctx,W,H,cols){
  ctx.clearRect(0,0,W,H);
  var rings=pv(0);
  var energy=pv(1)/100;
  var distortion=pv(2)/100;
  var debrisCount=Math.round(pv(3)*5);
  var decay=pv(4)/100;
  var rng=prng(0x5888CF);

  var cx=W/2, cy=H/2;
  /* IS epicenter bias */
  if(window._IS&&window._IS.active){
    var bestD=0,bx=0.5,by=0.5;
    for(var sx=0.1;sx<1;sx+=0.1)for(var sy=0.1;sy<1;sy+=0.1){
      var d=window._IS.getDens(sx,sy);
      if(d>bestD){bestD=d;bx=sx;by=sy;}
    }
    cx=bx*W;cy=by*H;
  }

  var maxR=Math.sqrt(W*W+H*H)*0.45;
  var spacing=maxR/(rings+1);

  /* Center flash */
  var fc=hRGB(cols[0]||'#e06040');
  var flashGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,spacing*1.5);
  flashGrad.addColorStop(0,'rgba(255,255,255,'+((0.3+energy*0.5).toFixed(2))+')');
  flashGrad.addColorStop(0.3,'rgba('+fc[0]+','+fc[1]+','+fc[2]+','+(0.2+energy*0.3).toFixed(2)+')');
  flashGrad.addColorStop(1,'rgba('+fc[0]+','+fc[1]+','+fc[2]+',0)');
  ctx.fillStyle=flashGrad;
  ctx.fillRect(0,0,W,H);

  /* Draw rings */
  var samples=120;
  for(var ri=0;ri<rings;ri++){
    var radius=spacing*(ri+1);
    var t=ri/(rings-1||1);
    var ringAlpha=Math.max(0.05,1-t*decay);
    var ringWidth=Math.max(1,(3+energy*8)*(1-t*decay*0.7));

    var col=cols[ri%cols.length];
    var c=hRGB(col);

    /* Draw noise-displaced ring */
    ctx.beginPath();
    for(var s=0;s<=samples;s++){
      var angle=s/samples*Math.PI*2;
      var nDisp=distortion>0?vnLocal(angle*3+ri*5,ri*7,0xA7C0D3)*distortion*maxR*0.1:0;
      var r=radius+nDisp;
      var rx=cx+Math.cos(angle)*r;
      var ry=cy+Math.sin(angle)*r;
      if(s===0)ctx.moveTo(rx,ry);
      else ctx.lineTo(rx,ry);
    }
    ctx.closePath();
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+ringAlpha.toFixed(2)+')';
    ctx.lineWidth=ringWidth;
    ctx.stroke();

    /* Inner glow on ring */
    if(energy>0.3){
      ctx.strokeStyle='rgba(255,255,255,'+(ringAlpha*0.2).toFixed(2)+')';
      ctx.lineWidth=ringWidth*0.3;
      ctx.stroke();
    }
  }

  /* Radial crack lines */
  var crackCount=Math.floor(3+energy*8);
  for(var ci=0;ci<crackCount;ci++){
    var cAngle=rng()*Math.PI*2;
    var cLen=maxR*(0.3+rng()*0.6);
    var cc=hRGB(cols[ci%cols.length]);
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    var cpx=cx+Math.cos(cAngle)*cLen;
    var cpy=cy+Math.sin(cAngle)*cLen;
    /* Slight curve */
    var ccpx=cx+Math.cos(cAngle+0.1)*cLen*0.5;
    var ccpy=cy+Math.sin(cAngle-0.1)*cLen*0.5;
    ctx.quadraticCurveTo(ccpx,ccpy,cpx,cpy);
    ctx.strokeStyle='rgba('+cc[0]+','+cc[1]+','+cc[2]+',0.12)';
    ctx.lineWidth=0.5+rng()*1.5;
    ctx.stroke();
  }

  /* Debris particles */
  for(var di=0;di<debrisCount;di++){
    var dAngle=rng()*Math.PI*2;
    var dR=spacing*(0.5+rng()*rings);
    var dx=cx+Math.cos(dAngle)*dR;
    var dy=cy+Math.sin(dAngle)*dR;
    var dT=dR/maxR;
    var dAlpha=Math.max(0.05,0.6-dT*decay);
    var dc=hRGB(cols[di%cols.length]);
    var dSize=1+rng()*3*(1-dT*0.5);

    ctx.save();
    ctx.translate(dx,dy);
    ctx.rotate(dAngle);

    if(rng()>0.6){
      /* Dash pointing outward */
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(dSize*2,0);
      ctx.strokeStyle='rgba('+dc[0]+','+dc[1]+','+dc[2]+','+dAlpha.toFixed(2)+')';
      ctx.lineWidth=dSize*0.5;
      ctx.lineCap='round';
      ctx.stroke();
    } else if(rng()>0.3){
      /* Small triangle */
      ctx.beginPath();
      ctx.moveTo(dSize,0);ctx.lineTo(-dSize*0.5,dSize*0.5);ctx.lineTo(-dSize*0.5,-dSize*0.5);ctx.closePath();
      ctx.fillStyle='rgba('+dc[0]+','+dc[1]+','+dc[2]+','+dAlpha.toFixed(2)+')';
      ctx.fill();
    } else {
      /* Dot */
      ctx.beginPath();
      ctx.arc(0,0,dSize*0.5,0,Math.PI*2);
      ctx.fillStyle='rgba('+dc[0]+','+dc[1]+','+dc[2]+','+dAlpha.toFixed(2)+')';
      ctx.fill();
    }
    ctx.restore();
  }
}

/* ── Main render ── */
function doRender(){
  if(window.genUndoPush)window.genUndoPush();
  var dv=document.getElementById('dv');
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx||!dv)return;
  var W=dv.width,H=dv.height;
  var cols=palCols();
  /* Respect connect/disconnect */
  if(!window._ENG_CONNECT)lctx.clearRect(0,0,W,H);
  var sys=getSys();
  var st=document.getElementById('motn-status');
  if(st)st.textContent='Generating '+sys.name+'...';
  /* Use setTimeout so status message renders before heavy compute */
  setTimeout(function(){
    if(sys.id==='flow')       renderFlow(lctx,W,H,cols);
    else if(sys.id==='blur')  renderBlur(lctx,W,H,cols);
    else if(sys.id==='vortex')renderVortex(lctx,W,H,cols);
    else if(sys.id==='strobe')renderStrobe(lctx,W,H,cols);
    else                      renderShock(lctx,W,H,cols);
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
    if(st)st.textContent=sys.name+' \u2014 seed: 0x'+Math.floor(Math.random()*0xFFFFFF).toString(16).toUpperCase().padStart(6,'0');
  },16);
}

/* ── Randomise sliders ── */
function randomise(){
  var sys=getSys();
  for(var i=0;i<5;i++){
    var sl=document.getElementById('motn-p'+(i+1));
    var vl=document.getElementById('motn-v'+(i+1));
    if(!sl)continue;
    var v=Math.floor(sys.min[i]+Math.random()*(sys.max[i]-sys.min[i]));
    sl.value=v;
    if(vl)vl.textContent=sys.fmt[i](v);
  }
  doRender();
}

/* ── Set all sliders to max ── */
function setMax(){
  var sys=getSys();
  for(var i=0;i<5;i++){
    var sl=document.getElementById('motn-p'+(i+1));
    var vl=document.getElementById('motn-v'+(i+1));
    if(!sl)continue;
    sl.value=sys.max[i];
    if(vl)vl.textContent=sys.fmt[i](sys.max[i]);
  }
}

/* ── System list ── */
function buildSysList(){
  var list=document.getElementById('motn-sys-list');
  if(!list)return;
  list.innerHTML='';
  SYSTEMS.forEach(function(sys,i){
    var row=document.createElement('div');
    row.id='motn-sr-'+sys.id;
    row.style.cssText='cursor:pointer;padding:5px 8px;border:1px solid #2a0a0a;margin-bottom:3px;border-radius:2px;transition:border-color .1s,background .1s;';
    row.innerHTML=
      '<div style="font-size:9px;font-weight:600;color:#e06040;letter-spacing:.06em;">'+(i+1)+'. '+sys.name+'</div>'+
      '<div style="font-size:8px;color:#c08060;margin-top:2px;line-height:1.4;">'+sys.nature+'</div>';
    row.addEventListener('mouseenter',function(){if(M.sysIdx!==i)this.style.borderColor='rgba(224,96,64,0.3)';});
    row.addEventListener('mouseleave',function(){if(M.sysIdx!==i)this.style.borderColor='#2a0a0a';});
    row.addEventListener('click',function(){selectSystem(i);});
    list.appendChild(row);
  });
  highlightSys(M.sysIdx);
}

function highlightSys(idx){
  SYSTEMS.forEach(function(sys,i){
    var row=document.getElementById('motn-sr-'+sys.id);
    if(!row)return;
    if(i===idx){row.style.borderColor='#e06040';row.style.background='rgba(224,96,64,0.07)';}
    else{row.style.borderColor='#2a0a0a';row.style.background='';}
  });
}

function selectSystem(idx){
  M.sysIdx=idx;
  wireSliders();
  highlightSys(idx);
  doRender();
}

/* ══════════════════════════════════════════════════════════════════════
   ANIMATE — Time-aware render variants for recording
   Each accepts t = 0.0→1.0 (progress through the animation duration)
   ══════════════════════════════════════════════════════════════════════ */

/* 1. Flow Field — noise phase drifts with time */
function renderFlowAnim(ctx,W,H,cols,t){
  ctx.clearRect(0,0,W,H);
  var density=Math.round(50+pv(0)*19.5);
  var curl=pv(1)/20;
  var length=Math.round(10+pv(2)*1.9);
  var turb=pv(3)/100;
  var thick=0.5+pv(4)*0.035;
  var rng=prng(0xF10F1ED);
  var sd=Math.floor(rng()*99999);
  var phase=t*Math.PI*6;
  var pts=[];
  for(var i=0;i<density;i++){pts.push([rng()*W,rng()*H]);}
  var stepSize=Math.min(W,H)*0.008;
  for(var si=0;si<pts.length;si++){
    var x=pts[si][0],y=pts[si][1];
    var col=cols[si%cols.length],c=hRGB(col);
    ctx.beginPath();ctx.moveTo(x,y);
    for(var step=0;step<length;step++){
      var nx=x/W*curl*4+phase*0.15,ny=y/H*curl*4+phase*0.1;
      var angle=fbmLocal(nx,ny,sd,3+Math.floor(turb*4))*Math.PI*2;
      x+=Math.cos(angle)*stepSize;y+=Math.sin(angle)*stepSize;
      if(x<0)x+=W;if(x>W)x-=W;if(y<0)y+=H;if(y>H)y-=H;
      ctx.lineTo(x,y);
    }
    var tf=si/pts.length,alpha=0.3+tf*0.5,lw=thick*(0.5+rng()*1.0);
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+alpha.toFixed(2)+')';
    ctx.lineWidth=lw;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
  }
}

/* 2. Motion Blur — direction rotates over time */
function renderBlurAnim(ctx,W,H,cols,t){
  ctx.clearRect(0,0,W,H);
  var count=Math.round(100+pv(0)*29);
  var speed=pv(1)/100;
  var dirVal=pv(2);
  var spread=pv(3)/100*Math.PI*0.5;
  var intensity=pv(4)/100;
  var rng=prng(0xB1A7E0);
  var cx=W/2,cy=H/2;
  var mode=dirVal<34?'linear':dirVal<67?'radial':'zoom';
  var baseAngle=rng()*Math.PI*2+t*Math.PI*2; /* full rotation over duration */
  for(var i=0;i<count;i++){
    var px=rng()*W,py=rng()*H;
    var angle,streakLen;
    if(mode==='linear'){
      angle=baseAngle+(rng()-0.5)*spread*2;
      streakLen=speed*Math.min(W,H)*0.15*(0.5+rng()*0.5);
    } else if(mode==='radial'){
      angle=Math.atan2(py-cy,px-cx)+(rng()-0.5)*spread+t*Math.PI*0.5;
      streakLen=speed*Math.min(W,H)*0.12*(0.5+rng()*0.5);
    } else {
      var dx=px-cx,dy=py-cy,dist=Math.sqrt(dx*dx+dy*dy);
      angle=Math.atan2(dy,dx)+(rng()-0.5)*spread*0.3;
      streakLen=speed*dist*0.25*(0.5+rng()*0.5)*(0.3+t*0.7+rng()*0.3);
    }
    var ex=px+Math.cos(angle)*streakLen,ey=py+Math.sin(angle)*streakLen;
    var col=cols[i%cols.length],c=hRGB(col);
    var lw=0.5+rng()*2.5;
    var segs=Math.max(4,Math.floor(streakLen/3));
    for(var s=0;s<segs;s++){
      var tt=s/segs,tt2=(s+1)/segs;
      var sx=px+(ex-px)*tt,sy=py+(ey-py)*tt;
      var sx2=px+(ex-px)*tt2,sy2=py+(ey-py)*tt2;
      var al=intensity*(1-tt*0.8);
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx2,sy2);
      ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+al.toFixed(2)+')';
      ctx.lineWidth=lw*(1-tt*0.6);ctx.lineCap='round';ctx.stroke();
    }
  }
}

/* 3. Vortex — arms rotate over time */
function renderVortexAnim(ctx,W,H,cols,t){
  ctx.clearRect(0,0,W,H);
  var arms=pv(0);
  var tightness=pv(1)/100;
  var particleCount=Math.round(200+pv(2)*38);
  var turb=pv(3)/100;
  var trailLen=pv(4)/100;
  var rng=prng(0xA0A7E4);
  var cx=W/2,cy=H/2;
  var maxR=Math.min(W,H)*0.45;
  var rotOff=t*Math.PI*2*1.5; /* 1.5 full rotations over duration */
  var gc=hRGB(cols[0]||'#e06040');
  var grad=ctx.createRadialGradient(cx,cy,0,cx,cy,maxR*0.3);
  grad.addColorStop(0,'rgba('+gc[0]+','+gc[1]+','+gc[2]+',0.3)');
  grad.addColorStop(1,'rgba('+gc[0]+','+gc[1]+','+gc[2]+',0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  var b=0.15+tightness*0.4;
  for(var i=0;i<particleCount;i++){
    var arm=Math.floor(rng()*arms);
    var armOffset=arm*(Math.PI*2/arms);
    var theta=(rng()*6+0.5)*Math.PI;
    var r=4*Math.exp(b*theta/Math.PI);
    if(r>maxR)r=maxR*rng();
    var nx=vnLocal(theta*2,arm*10,0x5EED1)*turb*maxR*0.15;
    var ny=vnLocal(theta*2+100,arm*10,0x5EED1)*turb*maxR*0.15;
    var px=cx+Math.cos(theta+armOffset+rotOff)*r+nx;
    var py=cy+Math.sin(theta+armOffset+rotOff)*r+ny;
    var tangent=theta+armOffset+rotOff+Math.PI/2;
    var tLen=(3+trailLen*15)*(0.5+rng()*0.5);
    var tx=px-Math.cos(tangent)*tLen,ty=py-Math.sin(tangent)*tLen;
    var tf=r/maxR,col=cols[Math.floor(tf*cols.length)%cols.length],c=hRGB(col);
    var alpha=0.4+0.5*(1-tf),lw=0.8+rng()*2*(1-tf*0.5);
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(tx,ty);
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+alpha.toFixed(2)+')';
    ctx.lineWidth=lw;ctx.lineCap='round';ctx.stroke();
    if(rng()>0.5){
      ctx.beginPath();ctx.arc(px,py,lw*0.6,0,Math.PI*2);
      ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+Math.min(1,alpha+0.2).toFixed(2)+')';
      ctx.fill();
    }
  }
}

/* 4. Stroboscopic — spotlight sweeps along trajectory */
function renderStrobeAnim(ctx,W,H,cols,t){
  ctx.clearRect(0,0,W,H);
  var copies=pv(0);
  var shapeVal=pv(1);
  var arc=pv(2)/100;
  var scaleShift=pv(3)/100;
  var fade=pv(4)/100;
  var rng=prng(0x57AB0E);
  var margin=Math.min(W,H)*0.15;
  var p0=[margin+rng()*W*0.2,H*0.3+rng()*H*0.4];
  var p2=[W-margin-rng()*W*0.2,H*0.3+rng()*H*0.4];
  var midX=(p0[0]+p2[0])/2,midY=(p0[1]+p2[1])/2;
  var cpY=midY-arc*Math.min(W,H)*0.8*(rng()>0.5?1:-1);
  var p1=[midX+(rng()-0.5)*W*0.2,cpY];
  var shapeType=shapeVal<21?'circle':shapeVal<41?'rect':shapeVal<61?'tri':shapeVal<81?'star':'figure';
  var baseSize=Math.min(W,H)*0.06;
  ctx.beginPath();ctx.moveTo(p0[0],p0[1]);
  ctx.quadraticCurveTo(p1[0],p1[1],p2[0],p2[1]);
  var tc=hRGB(cols[0]||'#e06040');
  ctx.strokeStyle='rgba('+tc[0]+','+tc[1]+','+tc[2]+',0.08)';
  ctx.lineWidth=1;ctx.setLineDash([4,6]);ctx.stroke();ctx.setLineDash([]);

  function drawShape(bx,by,sz,rot,alpha,c){
    ctx.save();ctx.translate(bx,by);ctx.rotate(rot);ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.85)';
    ctx.strokeStyle='rgba('+Math.min(255,c[0]+40)+','+Math.min(255,c[1]+40)+','+Math.min(255,c[2]+40)+',0.6)';
    ctx.lineWidth=1.5;
    if(shapeType==='circle'){ctx.beginPath();ctx.arc(0,0,sz,0,Math.PI*2);ctx.fill();ctx.stroke();}
    else if(shapeType==='rect'){ctx.fillRect(-sz,-sz*0.7,sz*2,sz*1.4);ctx.strokeRect(-sz,-sz*0.7,sz*2,sz*1.4);}
    else if(shapeType==='tri'){ctx.beginPath();ctx.moveTo(0,-sz);ctx.lineTo(sz*0.87,sz*0.5);ctx.lineTo(-sz*0.87,sz*0.5);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(shapeType==='star'){
      ctx.beginPath();
      for(var s=0;s<10;s++){var sa=s*Math.PI/5-Math.PI/2,sr=s%2===0?sz:sz*0.4;if(s===0)ctx.moveTo(Math.cos(sa)*sr,Math.sin(sa)*sr);else ctx.lineTo(Math.cos(sa)*sr,Math.sin(sa)*sr);}
      ctx.closePath();ctx.fill();ctx.stroke();
    } else {
      ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+alpha.toFixed(2)+')';
      ctx.beginPath();ctx.arc(0,-sz*0.6,sz*0.25,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-sz*0.35);ctx.lineTo(0,sz*0.3);ctx.stroke();
      var armSwing=t*Math.PI*4;
      ctx.beginPath();ctx.moveTo(-sz*0.5,-sz*0.1+Math.sin(armSwing)*sz*0.2);ctx.lineTo(0,-sz*0.15);ctx.lineTo(sz*0.5,-sz*0.1-Math.sin(armSwing)*sz*0.2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-sz*0.35,sz*0.8+Math.cos(armSwing)*sz*0.15);ctx.lineTo(0,sz*0.3);ctx.lineTo(sz*0.35,sz*0.8-Math.cos(armSwing)*sz*0.15);ctx.stroke();
    }
    ctx.restore();
  }

  /* Ghost copies at low alpha */
  for(var i=0;i<copies;i++){
    var tf=i/(copies-1);
    var u=1-tf,bx=u*u*p0[0]+2*u*tf*p1[0]+tf*tf*p2[0],by=u*u*p0[1]+2*u*tf*p1[1]+tf*tf*p2[1];
    var sz=baseSize*(1+scaleShift*(tf-0.5)*2);
    var tanX=2*u*(p1[0]-p0[0])+2*tf*(p2[0]-p1[0]),tanY=2*u*(p1[1]-p0[1])+2*tf*(p2[1]-p1[1]);
    var rot=Math.atan2(tanY,tanX)+tf*Math.PI*0.5;
    var col=cols[i%cols.length],c=hRGB(col);
    var dist=Math.abs(tf-t);
    var alpha=Math.max(0.05,0.15*(1-dist*3));
    drawShape(bx,by,sz,rot,alpha,c);
  }
  /* Animated spotlight — bright shape at position t */
  var tu=1-t,sbx=tu*tu*p0[0]+2*tu*t*p1[0]+t*t*p2[0],sby=tu*tu*p0[1]+2*tu*t*p1[1]+t*t*p2[1];
  var ssz=baseSize*(1+scaleShift*(t-0.5)*2);
  var stanX=2*tu*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]),stanY=2*tu*(p1[1]-p0[1])+2*t*(p2[1]-p1[1]);
  var srot=Math.atan2(stanY,stanX)+t*Math.PI*0.5;
  var sc=hRGB(cols[Math.floor(t*cols.length)%cols.length]);
  drawShape(sbx,sby,ssz,srot,0.95,sc);
  ctx.globalAlpha=1;
}

/* 5. Shockwave — rings expand outward over time */
function renderShockAnim(ctx,W,H,cols,t){
  ctx.clearRect(0,0,W,H);
  var rings=pv(0);
  var energy=pv(1)/100;
  var distortion=pv(2)/100;
  var debrisCount=Math.round(pv(3)*5);
  var decay=pv(4)/100;
  var rng=prng(0x5888CF);
  var cx=W/2,cy=H/2;
  var maxR=Math.sqrt(W*W+H*H)*0.45;
  var spacing=maxR/(rings+1);
  /* Expand factor: rings move outward, early rings already fading */
  var expand=0.15+t*1.5;

  var fc=hRGB(cols[0]||'#e06040');
  var flashAlpha=(0.3+energy*0.5)*(1-t*0.9);
  var flashGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,spacing*1.5);
  flashGrad.addColorStop(0,'rgba(255,255,255,'+Math.max(0,flashAlpha).toFixed(2)+')');
  flashGrad.addColorStop(0.3,'rgba('+fc[0]+','+fc[1]+','+fc[2]+','+Math.max(0,(0.2+energy*0.3)*(1-t)).toFixed(2)+')');
  flashGrad.addColorStop(1,'rgba('+fc[0]+','+fc[1]+','+fc[2]+',0)');
  ctx.fillStyle=flashGrad;ctx.fillRect(0,0,W,H);

  var samples=120;
  for(var ri=0;ri<rings;ri++){
    var radius=spacing*(ri+1)*expand;
    if(radius>maxR*1.5)continue;
    var tf=ri/(rings-1||1);
    var ringAlpha=Math.max(0,Math.min(1,(1-t*1.2)*(1-tf*decay)));
    var ringWidth=Math.max(0.5,(3+energy*8)*(1-tf*decay*0.7)*(1-t*0.5));
    var col=cols[ri%cols.length],c=hRGB(col);
    ctx.beginPath();
    for(var s=0;s<=samples;s++){
      var angle=s/samples*Math.PI*2;
      var nDisp=distortion>0?vnLocal(angle*3+ri*5,ri*7,0xA7C0D3)*distortion*maxR*0.1:0;
      var r=radius+nDisp;
      var rx=cx+Math.cos(angle)*r,ry=cy+Math.sin(angle)*r;
      if(s===0)ctx.moveTo(rx,ry);else ctx.lineTo(rx,ry);
    }
    ctx.closePath();
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+ringAlpha.toFixed(2)+')';
    ctx.lineWidth=ringWidth;ctx.stroke();
    if(energy>0.3){
      ctx.strokeStyle='rgba(255,255,255,'+(ringAlpha*0.2).toFixed(2)+')';
      ctx.lineWidth=ringWidth*0.3;ctx.stroke();
    }
  }
  /* Debris — drift outward with time */
  for(var di=0;di<debrisCount;di++){
    var dAngle=rng()*Math.PI*2;
    var dR=spacing*(0.5+rng()*rings)*expand;
    var dx=cx+Math.cos(dAngle)*dR,dy=cy+Math.sin(dAngle)*dR;
    var dT=dR/maxR;
    var dAlpha=Math.max(0,0.6-dT*decay-t*0.4);
    var dc=hRGB(cols[di%cols.length]),dSize=1+rng()*3*(1-dT*0.5);
    ctx.save();ctx.translate(dx,dy);ctx.rotate(dAngle);
    if(rng()>0.6){
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(dSize*2,0);
      ctx.strokeStyle='rgba('+dc[0]+','+dc[1]+','+dc[2]+','+dAlpha.toFixed(2)+')';
      ctx.lineWidth=dSize*0.5;ctx.lineCap='round';ctx.stroke();
    } else {
      ctx.beginPath();ctx.arc(0,0,dSize*0.6,0,Math.PI*2);
      ctx.fillStyle='rgba('+dc[0]+','+dc[1]+','+dc[2]+','+dAlpha.toFixed(2)+')';ctx.fill();
    }
    ctx.restore();
  }
}

/* ══════════════════════════════════════════════════════════════════════
   RECORD — Capture animated motion as a downloadable video
   ══════════════════════════════════════════════════════════════════════ */
var REC={active:false,recorder:null,chunks:[],raf:null,startTime:0,duration:5,canvas:null};

function getRecCanvas(){
  if(!REC.canvas){REC.canvas=document.createElement('canvas');}
  var dv=document.getElementById('dv');
  if(dv){REC.canvas.width=dv.width;REC.canvas.height=dv.height;}
  return REC.canvas;
}

function renderFrameAnim(t){
  var ac=getRecCanvas();
  var ctx=ac.getContext('2d');
  var W=ac.width,H=ac.height;
  var cols=palCols();
  var sys=getSys();
  if(sys.id==='flow')        renderFlowAnim(ctx,W,H,cols,t);
  else if(sys.id==='blur')   renderBlurAnim(ctx,W,H,cols,t);
  else if(sys.id==='vortex') renderVortexAnim(ctx,W,H,cols,t);
  else if(sys.id==='strobe') renderStrobeAnim(ctx,W,H,cols,t);
  else                       renderShockAnim(ctx,W,H,cols,t);
  /* Mirror to main canvas for live preview */
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(lctx){lctx.clearRect(0,0,W,H);lctx.drawImage(ac,0,0);}
  if(window._layersCompositeFn)window._layersCompositeFn();
}

function toggleRecord(){
  if(REC.active){stopRecord();}else{startRecord();}
}

function startRecord(){
  var durEl=document.getElementById('motn-dur');
  REC.duration=durEl?parseInt(durEl.value):5;
  var ac=getRecCanvas();
  var btn=document.getElementById('motn-rec-btn');
  var st=document.getElementById('motn-rec-status');
  var bar=document.getElementById('motn-rec-bar');
  var rl=document.getElementById('motn-rec-link');

  if(!window.MediaRecorder){
    if(st)st.textContent='MediaRecorder not supported in this browser.';
    return;
  }
  var stream=ac.captureStream(30);
  var mimeType=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':
               MediaRecorder.isTypeSupported('video/webm')?'video/webm':'';
  REC.chunks=[];
  REC.recorder=new MediaRecorder(stream,mimeType?{mimeType:mimeType}:{});
  REC.recorder.ondataavailable=function(e){if(e.data&&e.data.size>0)REC.chunks.push(e.data);};
  REC.recorder.onstop=function(){
    var blob=new Blob(REC.chunks,{type:mimeType||'video/webm'});
    var url=URL.createObjectURL(blob);
    var dl=document.getElementById('motn-dl-link');
    if(dl){dl.href=url;dl.download='neoleo-motion-'+getSys().id+'.webm';}
    if(rl)rl.style.display='block';
    if(st)st.textContent='Ready \u2014 click to download.';
    if(btn){btn.innerHTML='\u25b6 Re-record';btn.style.color='#60c080';btn.style.borderColor='#60c080';}
    var fill=document.getElementById('motn-rec-fill');
    if(fill)fill.style.width='100%';
  };
  REC.active=true;
  REC.startTime=performance.now();
  REC.recorder.start(100);
  if(btn){btn.innerHTML='\u25a0 Stop';btn.style.color='#ff4040';btn.style.borderColor='#ff4040';}
  if(st)st.textContent='Recording\u2026';
  if(bar)bar.style.display='block';
  if(rl)rl.style.display='none';

  function loop(){
    if(!REC.active)return;
    var elapsed=(performance.now()-REC.startTime)/1000;
    var t=Math.min(1,elapsed/REC.duration);
    var fill=document.getElementById('motn-rec-fill');
    if(fill)fill.style.width=(t*100).toFixed(1)+'%';
    var rem=Math.ceil(REC.duration-elapsed);
    if(st)st.textContent='Recording\u2026 '+rem+'s remaining';
    renderFrameAnim(t);
    if(t>=1){stopRecord();return;}
    REC.raf=requestAnimationFrame(loop);
  }
  REC.raf=requestAnimationFrame(loop);
}

function stopRecord(){
  REC.active=false;
  if(REC.raf){cancelAnimationFrame(REC.raf);REC.raf=null;}
  if(REC.recorder&&REC.recorder.state!=='inactive')REC.recorder.stop();
}

/* ── Public API ── */
window._MOTN={
  render:doRender,
  randomise:randomise,
  toggleRecord:toggleRecord,
  cycle:function(){
    M.cycleIdx=(M.cycleIdx+1)%SYSTEMS.length;
    var sys=SYSTEMS[M.cycleIdx];
    M.sysIdx=M.cycleIdx;
    wireSliders();
    setMax();
    highlightSys(M.sysIdx);
    /* Update cycle label */
    var cl=document.getElementById('motn-cycle-label'),cn=document.getElementById('motn-cycle-name');
    if(cl)cl.style.display='block';
    if(cn)cn.textContent='('+(M.cycleIdx+1)+'/'+SYSTEMS.length+') '+sys.name;
    /* Open body if closed */
    var b=document.getElementById('motn-body'),t=document.getElementById('motn-toggle');
    if(b&&b.style.display==='none'){
      b.style.display='block';
      if(t){t.style.background='rgba(224,96,64,0.07)';t.style.borderColor='#e06040';}
      var chev=t?t.querySelector('.tc-chev'):null;if(chev)chev.style.transform='rotate(180deg)';
    }
    doRender();
  },
  onPaletteChange:function(){
    var b=document.getElementById('motn-body');
    if(b&&b.style.display!=='none')doRender();
  }
};

/* ── Initialize ── */
setTimeout(function(){
  buildSysList();
  wireSliders();
},500);

})();
