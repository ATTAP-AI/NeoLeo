/* ══════════════════════════════════════════════════════════
   NEOLEO TEXTURES — Procedural texture synthesis
   16 texture types across 4 families, all from mathematics.
   Generates color textures + bump maps for 3D integration.
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── Palette ── */
function palCols(){
  var p=typeof gpal==='function'?gpal():null;
  if(p&&p.c&&p.c.length) return p.c;
  return['#c09060','#907050','#e0c8a0','#504030','#d0b080'];
}
function hexToRgb(h){
  h=h.replace('#','');
  if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return[parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];
}

/* ── Math ── */
function clamp(v,lo,hi){return v<lo?lo:v>hi?hi:v;}
function lerp(a,b,t){return a+(b-a)*t;}
function lC(a,b,t){t=clamp(t,0,1);return[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];}
var PI=Math.PI,TAU=PI*2,sin=Math.sin,cos=Math.cos,sqrt=Math.sqrt,abs=Math.abs,floor=Math.floor,pow=Math.pow;

/* ── Simplex-style noise (compact 2D + 3D) ── */
var _perm=new Uint8Array(512);
(function(){var p=[];for(var i=0;i<256;i++)p[i]=i;
  for(var i=255;i>0;i--){var j=floor(Math.random()*(i+1));var t=p[i];p[i]=p[j];p[j]=t;}
  for(var i=0;i<512;i++)_perm[i]=p[i&255];
})();

function fade(t){return t*t*t*(t*(t*6-15)+10);}
function grad2(hash,x,y){var h=hash&3;return(h===0?x+y:h===1?-x+y:h===2?x-y:-x-y);}
function grad3(hash,x,y,z){var h=hash&15;var u=h<8?x:y,v=h<4?y:h===12||h===14?x:z;return((h&1)?-u:u)+((h&2)?-v:v);}

function noise2(x,y){
  var X=floor(x)&255,Y=floor(y)&255;
  x-=floor(x);y-=floor(y);
  var u=fade(x),v=fade(y);
  var a=_perm[X]+Y,b=_perm[X+1]+Y;
  return lerp(lerp(grad2(_perm[a],x,y),grad2(_perm[b],x-1,y),u),
              lerp(grad2(_perm[a+1],x,y-1),grad2(_perm[b+1],x-1,y-1),u),v);
}

function noise3(x,y,z){
  var X=floor(x)&255,Y=floor(y)&255,Z=floor(z)&255;
  x-=floor(x);y-=floor(y);z-=floor(z);
  var u=fade(x),v=fade(y),w=fade(z);
  var a=_perm[X]+Y,aa=_perm[a]+Z,ab=_perm[a+1]+Z;
  var b=_perm[X+1]+Y,ba=_perm[b]+Z,bb=_perm[b+1]+Z;
  return lerp(lerp(lerp(grad3(_perm[aa],x,y,z),grad3(_perm[ba],x-1,y,z),u),
                   lerp(grad3(_perm[ab],x,y-1,z),grad3(_perm[bb],x-1,y-1,z),u),v),
              lerp(lerp(grad3(_perm[aa+1],x,y,z-1),grad3(_perm[ba+1],x-1,y,z-1),u),
                   lerp(grad3(_perm[ab+1],x,y-1,z-1),grad3(_perm[bb+1],x-1,y-1,z-1),u),v),w);
}

/* Fractal Brownian Motion */
function fbm2(x,y,oct,lac,gain){
  var v=0,amp=1,freq=1,sum=0;
  for(var i=0;i<oct;i++){v+=noise2(x*freq,y*freq)*amp;sum+=amp;amp*=gain;freq*=lac;}
  return v/sum;
}
function fbm3(x,y,z,oct,lac,gain){
  var v=0,amp=1,freq=1,sum=0;
  for(var i=0;i<oct;i++){v+=noise3(x*freq,y*freq,z*freq)*amp;sum+=amp;amp*=gain;freq*=lac;}
  return v/sum;
}

/* Domain warp */
function warp2(x,y,str,oct){
  var ox=fbm2(x+0.0,y+0.0,oct,2,0.5)*str;
  var oy=fbm2(x+5.2,y+1.3,oct,2,0.5)*str;
  return fbm2(x+ox,y+oy,oct,2,0.5);
}

/* Voronoi */
function voronoi2(x,y){
  var ix=floor(x),iy=floor(y);
  var d1=999,d2=999;
  for(var j=-1;j<=1;j++)for(var i=-1;i<=1;i++){
    var px=ix+i+noise2((ix+i)*13.7,(iy+j)*17.3)*0.5+0.5;
    var py=iy+j+noise2((ix+i)*23.1,(iy+j)*29.7)*0.5+0.5;
    var dx=x-px,dy=y-py,d=dx*dx+dy*dy;
    if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;
  }
  return{d1:sqrt(d1),d2:sqrt(d2),edge:sqrt(d2)-sqrt(d1)};
}

/* Reseed noise permutation table */
function reseedNoise(s){
  var r=function(){s=(s*16807+0)%2147483647;return(s-1)/2147483646;};
  var p=[];for(var i=0;i<256;i++)p[i]=i;
  for(var i=255;i>0;i--){var j=floor(r()*(i+1));var t=p[i];p[i]=p[j];p[j]=t;}
  for(var i=0;i<512;i++)_perm[i]=p[i&255];
}

/* ══════════════════════════════════════════════════════════
   TEXTURE TYPES — 16 across 4 families
   Each returns a value 0..1 for the given (u,v) coordinates
   plus a bump value for normal perturbation.
   ══════════════════════════════════════════════════════════ */
var TEXTURES=[
  /* ── Stone & Mineral (4) ── */
  {name:'Marble',       family:'Stone & Mineral',  fn:texMarble,
   desc:'Veined stone — turbulent flow equations create organic striations.',
   labels:['Vein Scale','Turbulence','Vein Width','Contrast','Warmth']},
  {name:'Granite',      family:'Stone & Mineral',  fn:texGranite,
   desc:'Crystalline aggregate — Voronoi cells simulate mineral grains.',
   labels:['Grain Size','Speckle','Crystal Mix','Roughness','Depth']},
  {name:'Sandstone',    family:'Stone & Mineral',  fn:texSandstone,
   desc:'Layered sediment — horizontal strata with erosion channels.',
   labels:['Layer Scale','Erosion','Waviness','Grain','Color Shift']},
  {name:'Obsidian',     family:'Stone & Mineral',  fn:texObsidian,
   desc:'Volcanic glass — smooth dark surface with internal flow patterns.',
   labels:['Flow Scale','Sheen','Inclusions','Depth','Fracture']},

  /* ── Organic & Natural (4) ── */
  {name:'Wood Grain',   family:'Organic & Natural', fn:texWood,
   desc:'Tree rings — concentric distortion with stochastic perturbation.',
   labels:['Ring Density','Irregularity','Knot Freq','Grain Dir','Weathering']},
  {name:'Bark',         family:'Organic & Natural', fn:texBark,
   desc:'Tree bark — deep fissures and rough ridges from growth stress.',
   labels:['Fissure Depth','Ridge Width','Scale','Roughness','Age']},
  {name:'Leather',      family:'Organic & Natural', fn:texLeather,
   desc:'Animal hide — pebbled surface with subtle creasing.',
   labels:['Grain Size','Softness','Crease','Polish','Wear']},
  {name:'Scales',       family:'Organic & Natural', fn:texScales,
   desc:'Reptilian scales — overlapping rounded Voronoi cells.',
   labels:['Scale Size','Overlap','Iridescence','Ridge','Regularity']},

  /* ── Fabric & Weave (4) ── */
  {name:'Linen',        family:'Fabric & Weave',   fn:texLinen,
   desc:'Woven cloth — orthogonal thread crossings with natural irregularity.',
   labels:['Thread Size','Looseness','Texture','Fray','Dye Depth']},
  {name:'Silk',         family:'Fabric & Weave',   fn:texSilk,
   desc:'Lustrous fabric — directional sheen with subtle wave pattern.',
   labels:['Sheen','Drape','Ripple','Smoothness','Luminosity']},
  {name:'Tweed',        family:'Fabric & Weave',   fn:texTweed,
   desc:'Coarse woven wool — irregular color mixing with nubby texture.',
   labels:['Coarseness','Color Mix','Nub Density','Weave Scale','Worn']},
  {name:'Chain Mail',   family:'Fabric & Weave',   fn:texChainMail,
   desc:'Interlocking metal rings — regular grid with circular links.',
   labels:['Ring Size','Gap','Shininess','Weight','Tarnish']},

  /* ── Industrial & Engineered (4) ── */
  {name:'Brushed Metal', family:'Industrial',       fn:texBrushedMetal,
   desc:'Machined surface — directional micro-scratches with metallic sheen.',
   labels:['Scratch Dir','Grain','Reflectivity','Anisotropy','Patina']},
  {name:'Carbon Fiber',  family:'Industrial',       fn:texCarbonFiber,
   desc:'Woven composite — 2×2 twill weave with glossy resin coat.',
   labels:['Weave Scale','Glossiness','Fiber Width','Contrast','Tint']},
  {name:'Circuit Board', family:'Industrial',       fn:texCircuitBoard,
   desc:'PCB traces — orthogonal copper paths with solder pads.',
   labels:['Trace Width','Density','Pad Size','Layer Depth','Oxidation']},
  {name:'Corrugated',    family:'Industrial',       fn:texCorrugated,
   desc:'Ribbed sheet — sinusoidal ridges with specular highlights.',
   labels:['Rib Spacing','Depth','Rust','Dent','Shininess']}
];

/* ── Texture generator functions ── */
/* Each takes (u,v, p1..p5) normalized 0..1, returns {color:0..1, bump:0..1, idx:0..1} */

function texMarble(u,v,p1,p2,p3,p4,p5){
  var scale=2+p1*8;
  var turb=p2*4;
  var width=0.2+p3*0.8;
  var n=fbm2(u*scale,v*scale,5,2,0.5)*turb;
  var vein=sin((u*scale+n)*PI*2)*0.5+0.5;
  vein=pow(vein,width);
  var bump=vein;
  var detail=noise2(u*scale*4,v*scale*4)*0.15;
  var c=clamp(vein+detail,0,1);
  c=pow(c,0.5+p4*1.5);
  return{color:c,bump:bump,idx:c*0.7+p5*0.3};
}

function texGranite(u,v,p1,p2,p3,p4,p5){
  var scale=4+p1*12;
  var vor=voronoi2(u*scale,v*scale);
  var crystal=vor.d1;
  var speckle=noise2(u*scale*3,v*scale*3)*p2;
  var mix=lerp(crystal,speckle,p3);
  var rough=fbm2(u*scale*2,v*scale*2,4,2,0.5)*p4*0.3;
  var c=clamp(mix+rough,0,1);
  var bump=clamp(vor.edge*3+rough,0,1);
  return{color:c,bump:bump,idx:vor.d1+p5*0.3};
}

function texSandstone(u,v,p1,p2,p3,p4,p5){
  var layerScale=3+p1*10;
  var layers=sin(v*layerScale*PI+fbm2(u*4,v*4,3,2,0.5)*p3*3)*0.5+0.5;
  var erosion=warp2(u*6,v*6,p2*2,3)*0.3;
  var grain=noise2(u*30,v*30)*p4*0.15;
  var c=clamp(layers+erosion+grain,0,1);
  var bump=clamp(layers*0.6+erosion+grain*2,0,1);
  return{color:c,bump:bump,idx:layers*0.7+p5*0.3};
}

function texObsidian(u,v,p1,p2,p3,p4,p5){
  var scale=2+p1*6;
  var flow=warp2(u*scale,v*scale,2+p4*3,4);
  var sheen=pow(abs(sin(flow*PI*3)),2+p2*8)*0.5;
  var incl=noise2(u*scale*5,v*scale*5)>0.6-p3*0.3?0.3:0;
  var c=clamp(0.1+flow*0.2+sheen+incl,0,1);
  var bump=clamp(flow*0.3+sheen+p5*0.1,0,1);
  return{color:c,bump:bump,idx:flow*0.5+sheen*0.5};
}

function texWood(u,v,p1,p2,p3,p4,p5){
  var density=5+p1*20;
  var cu=u-0.5,cv=v-0.5;
  var angle=p4*PI;
  var ru=cu*cos(angle)-cv*sin(angle),rv=cu*sin(angle)+cv*cos(angle);
  var dist=sqrt(ru*ru+rv*rv)*density;
  var irreg=fbm2(u*3,v*3,3,2,0.5)*p2*3;
  var ring=sin(dist+irreg)*0.5+0.5;
  var knot=0;
  if(p3>0.1){
    var kx=noise2(7.7,3.3)*0.6+0.2,ky=noise2(11.1,5.5)*0.6+0.2;
    var kd=sqrt((u-kx)*(u-kx)+(v-ky)*(v-ky));
    if(kd<p3*0.15) knot=1-kd/(p3*0.15);
  }
  var grain=noise2(ru*40,rv*2)*0.08;
  var weather=fbm2(u*8,v*8,3,2,0.5)*p5*0.2;
  var c=clamp(ring*0.7+knot*0.3+grain+weather,0,1);
  var bump=clamp(ring*0.5+knot*0.4+abs(grain)*3,0,1);
  return{color:c,bump:bump,idx:ring*0.8+0.1};
}

function texBark(u,v,p1,p2,p3,p4,p5){
  var scale=3+p3*8;
  var fissure=abs(fbm2(u*scale*0.5,v*scale,4,2.2,0.45));
  fissure=pow(fissure,0.3+p1*0.7);
  var ridge=sin(v*scale*3+noise2(u*scale*2,v*scale*2)*2)*0.5+0.5;
  ridge=pow(ridge,1+p2*3);
  var rough=fbm2(u*scale*4,v*scale*4,3,2,0.5)*p4*0.3;
  var age=warp2(u*2,v*2,p5*2,3)*0.2;
  var c=clamp(fissure*0.5+ridge*0.3+rough+age+0.1,0,1);
  var bump=clamp(fissure+ridge*0.5,0,1);
  return{color:c,bump:bump,idx:fissure*0.6+ridge*0.4};
}

function texLeather(u,v,p1,p2,p3,p4,p5){
  var scale=6+p1*15;
  var vor=voronoi2(u*scale,v*scale);
  var grain=pow(vor.d1,0.5+p2*1.5);
  var crease=fbm2(u*scale*0.3,v*scale*0.3,3,2,0.5)*p3;
  var polish=1-vor.edge*p4*3;
  var wear=fbm2(u*3,v*3,2,2,0.5)*p5*0.2;
  var c=clamp(grain*0.6+polish*0.3+crease*0.2+wear,0,1);
  var bump=clamp(vor.edge*2+crease*0.5,0,1);
  return{color:c,bump:bump,idx:grain*0.7+0.15};
}

function texScales(u,v,p1,p2,p3,p4,p5){
  var scale=6+p1*14;
  var sv=v+((floor(u*scale)%2)*0.5)/scale;
  var vor=voronoi2(u*scale,sv*scale);
  var edge=1-clamp(vor.edge*(3+p5*5),0,1);
  var overlap=pow(clamp(1-vor.d1*(1.5-p2*0.8),0,1),0.5);
  var irid=sin(vor.d1*PI*8)*p3*0.3;
  var ridge2=pow(1-clamp(vor.edge*5,0,1),2)*p4;
  var c=clamp(edge*0.4+overlap*0.4+irid+ridge2*0.2,0,1);
  var bump=clamp(edge*0.6+ridge2*0.4,0,1);
  return{color:c,bump:bump,idx:vor.d1*0.5+irid+0.25};
}

function texLinen(u,v,p1,p2,p3,p4,p5){
  var scale=8+p1*20;
  var su=u*scale,sv=v*scale;
  var warpU=sin(sv*PI*2)*0.3*p2;
  var warpV=sin(su*PI*2)*0.3*p2;
  var threadU=sin((su+warpU)*PI*2)*0.5+0.5;
  var threadV=sin((sv+warpV)*PI*2)*0.5+0.5;
  var weave=threadU*0.5+threadV*0.5;
  var tex=noise2(u*scale*3,v*scale*3)*p3*0.2;
  var fray=noise2(u*scale*0.5,v*scale*0.5)*p4*0.15;
  var c=clamp(weave+tex+fray,0,1);
  c=pow(c,0.7+p5*0.6);
  var bump=clamp(weave*0.7+abs(tex)*2,0,1);
  return{color:c,bump:bump,idx:weave*0.6+0.2};
}

function texSilk(u,v,p1,p2,p3,p4,p5){
  var sheen=sin(u*20+fbm2(u*3,v*3,3,2,0.5)*p2*4)*0.5+0.5;
  sheen=pow(sheen,0.3+p1*2);
  var ripple=sin(v*15+u*3)*p3*0.15;
  var smooth2=1-fbm2(u*10,v*10,2,2,0.5)*0.1*(1-p4);
  var c=clamp(sheen*0.6+ripple+smooth2*0.3+p5*0.1,0,1);
  var bump=clamp(sheen*0.3+abs(ripple)*2,0,1);
  return{color:c,bump:bump,idx:sheen*0.8+0.1};
}

function texTweed(u,v,p1,p2,p3,p4,p5){
  var scale=5+p4*15;
  var su=u*scale,sv=v*scale;
  var threadU=floor(su*2)%3,threadV=floor(sv*2)%3;
  var mix=(threadU+threadV)%4;
  var colorVar=mix/3*p2+noise2(u*scale*2,v*scale*2)*0.3;
  var coarse=noise2(su*3,sv*3)*p1*0.4;
  var nub=(noise2(u*scale*4,v*scale*4)>0.7-p3*0.3)?0.2:0;
  var worn=fbm2(u*2,v*2,2,2,0.5)*p5*0.15;
  var c=clamp(colorVar+coarse+nub+worn+0.3,0,1);
  var bump=clamp(coarse*0.5+nub+abs(noise2(su,sv))*0.3,0,1);
  return{color:c,bump:bump,idx:colorVar*0.7+0.15};
}

function texChainMail(u,v,p1,p2,p3,p4,p5){
  var scale=6+p1*12;
  var su=u*scale,sv=v*scale;
  var cx=floor(su)+0.5,cy=floor(sv)+0.5;
  var offset=(floor(sv)%2)*0.5;
  cx=floor(su+offset)+0.5-offset;
  var dx=su-cx+offset*(floor(sv)%2?-0.5:0.5),dy=sv-cy;
  // Fix: recalculate properly
  var cellX=floor(su+((floor(sv)%2)*0.5));
  var cellY=floor(sv);
  var cxp=cellX+0.5-((cellY%2)*0.5);
  var cyp=cellY+0.5;
  dx=su-cxp;dy=sv-cyp;
  var dist=sqrt(dx*dx+dy*dy);
  var ringR=0.35+p2*0.1;
  var ringW=0.08+p1*0.04;
  var ring=1-clamp(abs(dist-ringR)/ringW,0,1);
  ring=pow(ring,0.5);
  var shine=pow(clamp(1-abs(dist-ringR)*8,0,1),2)*p3;
  var weight2=ring*0.6+noise2(su*2,sv*2)*0.1*(1-ring);
  var tarnish=fbm2(u*4,v*4,2,2,0.5)*p5*0.2*(1-ring*0.5);
  var c=clamp(weight2*p4+shine+0.1-tarnish,0,1);
  var bump=clamp(ring*0.8+shine*0.2,0,1);
  return{color:c,bump:bump,idx:ring*0.5+shine*0.3+0.1};
}

function texBrushedMetal(u,v,p1,p2,p3,p4,p5){
  var angle=p1*PI;
  var ru=u*cos(angle)-v*sin(angle),rv=u*sin(angle)+v*cos(angle);
  var scratch=noise2(ru*2,rv*80)*0.5+noise2(ru*5,rv*160)*0.3;
  scratch=scratch*p2+0.3;
  var reflect=pow(abs(sin(rv*40+scratch*3)),1+p4*4)*p3*0.4;
  var patina=fbm2(u*3,v*3,3,2,0.5)*p5*0.2;
  var c=clamp(scratch+reflect-patina+0.2,0,1);
  var bump=clamp(abs(scratch-0.5)*2+reflect*0.5,0,1);
  return{color:c,bump:bump,idx:scratch*0.6+reflect*0.4};
}

function texCarbonFiber(u,v,p1,p2,p3,p4,p5){
  var scale=8+p1*16;
  var su=u*scale,sv=v*scale;
  var cellX=floor(su)%2,cellY=floor(sv)%2;
  var twill=(cellX+cellY)%2;
  var fu=su-floor(su),fv=sv-floor(sv);
  var fiberU=sin(fu*PI)*sin(fv*PI);
  var fiberDir=twill?sin(fu*PI*4)*0.3:sin(fv*PI*4)*0.3;
  var base=twill?0.35:0.25;
  var gloss=pow(fiberU,2)*p2*0.4;
  var width2=clamp(fiberU*(0.8+p3*0.2)+fiberDir,0,1);
  var c=clamp(base+width2*0.3+gloss+p5*0.1,0,1);
  c=pow(c,1+p4*0.5);
  var bump=clamp(width2*0.6+fiberDir*0.4,0,1);
  return{color:c,bump:bump,idx:twill*0.4+fiberU*0.3+0.15};
}

function texCircuitBoard(u,v,p1,p2,p3,p4,p5){
  var scale=5+p2*15;
  var su=u*scale,sv=v*scale;
  var traceW=0.05+p1*0.12;
  var gridU=abs(su-floor(su)-0.5),gridV=abs(sv-floor(sv)-0.5);
  var traceH=gridU<traceW?1:0;
  var traceV2=gridV<traceW?1:0;
  var trace=clamp(traceH+traceV2,0,1);
  // Pads at intersections
  var padR=0.08+p3*0.1;
  var padDist=sqrt(pow(su-floor(su)-0.5,2)+pow(sv-floor(sv)-0.5,2));
  var pad=padDist<padR?1:0;
  // Random trace removal for realism
  var cellId=noise2(floor(su)*7.7,floor(sv)*11.3);
  if(cellId>p2*0.8+0.2)trace=0;
  var board=0.3+fbm2(u*30,v*30,2,2,0.5)*0.05;
  var copper=trace*0.7+pad*0.9;
  var oxide=fbm2(u*8,v*8,2,2,0.5)*p5*0.15;
  var depth2=trace*p4*0.3;
  var c=clamp(board*(1-copper)+copper*(0.8-oxide),0,1);
  var bump=clamp(trace*0.5+pad*0.7+depth2,0,1);
  return{color:c,bump:bump,idx:copper*0.6+board*0.4};
}

function texCorrugated(u,v,p1,p2,p3,p4,p5){
  var spacing=4+p1*16;
  var depth2=0.3+p2*0.7;
  var ridge=sin(u*spacing*PI)*0.5+0.5;
  ridge=pow(ridge,0.5+depth2);
  var rust=fbm2(u*8,v*8,4,2,0.5)*p3*0.4;
  var dent=noise2(u*3,v*3)>0.8-p4*0.2?-0.2:0;
  var shine=pow(ridge,3)*p5*0.3;
  var c=clamp(ridge*0.5+shine+0.2-rust+dent,0,1);
  var bump=clamp(ridge+dent*0.5,0,1);
  return{color:c,bump:bump,idx:ridge*0.7+0.15};
}

/* ══════════════════════════════════════════════════════════
   STATE & RENDERING
   ══════════════════════════════════════════════════════════ */
var S={
  texIdx:0,
  mapping:'none', /* none | fill | map3d */
  lastTex:null,   /* {color:canvas, bump:canvas, W, H} */
  tileScale:50,
  tileRot:0,
  bumpStr:60,
  displacement:0
};

/* Slider value helper */
function sv(id){var el=document.getElementById(id);return el?+el.value:50;}

/* Read slider params normalized 0..1 */
function getParams(){
  return[sv('tex-p1')/100,sv('tex-p2')/100,sv('tex-p3')/100,sv('tex-p4')/100,sv('tex-p5')/100];
}

/* Generate texture — renders at internal resolution then upscales for speed */
function generateTexture(tctx,W,H,texIdx,params,palette,forBump){
  var tex=TEXTURES[texIdx];
  var cols=palette||palCols().map(hexToRgb);
  if(cols.length<2)cols.push([180,140,100]);
  if(typeof cols[0]==='string')cols=cols.map(hexToRgb);

  // Render at capped internal resolution for speed, then upscale
  var maxRes=512;
  var iW=Math.min(W,maxRes),iH=Math.min(H,maxRes);
  var offC=document.createElement('canvas');offC.width=iW;offC.height=iH;
  var offCtx=offC.getContext('2d');
  var imgData=offCtx.createImageData(iW,iH);
  var d=imgData.data;
  var bumpC=null,bumpCtx=null,bumpData=null,bd=null;
  if(!forBump){
    bumpC=document.createElement('canvas');bumpC.width=iW;bumpC.height=iH;
    bumpCtx=bumpC.getContext('2d');
    bumpData=bumpCtx.createImageData(iW,iH);
    bd=bumpData.data;
  }

  var p=params||[0.5,0.5,0.5,0.5,0.5];

  for(var y=0;y<iH;y++){
    var v=y/iH;
    for(var x=0;x<iW;x++){
      var u=x/iW;
      var r=tex.fn(u,v,p[0],p[1],p[2],p[3],p[4]);
      var idx2=clamp(r.idx*(cols.length-1),0,cols.length-1.001);
      var ci=floor(idx2);
      var cf=idx2-ci;
      var c0=cols[ci],c1=cols[Math.min(ci+1,cols.length-1)];
      var cr=lC(c0,c1,cf);
      var bright=0.3+r.color*0.7;
      var pi=(y*iW+x)*4;
      d[pi]=clamp(cr[0]*bright,0,255);
      d[pi+1]=clamp(cr[1]*bright,0,255);
      d[pi+2]=clamp(cr[2]*bright,0,255);
      d[pi+3]=255;
      if(bd){
        var bv=clamp(r.bump*255,0,255);
        bd[pi]=bv;bd[pi+1]=bv;bd[pi+2]=bv;bd[pi+3]=255;
      }
    }
  }

  offCtx.putImageData(imgData,0,0);
  // Upscale to target
  tctx.imageSmoothingEnabled=true;
  tctx.imageSmoothingQuality='high';
  tctx.drawImage(offC,0,0,W,H);

  if(bumpData){
    bumpCtx.putImageData(bumpData,0,0);
    var bumpFull=document.createElement('canvas');bumpFull.width=iW;bumpFull.height=iH;
    bumpFull.getContext('2d').putImageData(bumpData,0,0);
    return{bump:bumpFull};
  }
  return null;
}

/* Main render — generate texture and display */
function doRender(targetCtx,W2,H2,silent){
  var tctx,W,H;
  if(targetCtx){
    tctx=targetCtx;W=W2;H=H2;
  } else {
    var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
    if(!lctx)return;
    tctx=lctx;W=lctx.canvas.width;H=lctx.canvas.height;
  }

  var bg=typeof gpal==='function'&&gpal()&&gpal().bg?gpal().bg:'#0a0a12';
  tctx.fillStyle=bg;
  tctx.fillRect(0,0,W,H);

  var params=getParams();
  var cols=palCols().map(hexToRgb);

  var result=generateTexture(tctx,W,H,S.texIdx,params,cols);

  // Cache texture + bump for 3D mapping
  if(result&&result.bump){
    var texCanvas=document.createElement('canvas');
    texCanvas.width=W;texCanvas.height=H;
    texCanvas.getContext('2d').drawImage(tctx.canvas,0,0);
    S.lastTex={color:texCanvas,bump:result.bump,W:W,H:H};
  }

  if(!silent){
    var st=document.getElementById('tex-status');
    if(st) st.textContent=TEXTURES[S.texIdx].name+' \u2014 '+W+'\u00d7'+H+'px generated.';
  }

  if(!targetCtx){
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  }
}

/* Select texture type */
function selectTexture(idx){
  if(idx<0||idx>=TEXTURES.length)return;
  S.texIdx=idx;
  var tex=TEXTURES[idx];

  // Update list highlighting
  var list=document.getElementById('tex-list');
  if(list){
    var btns=list.querySelectorAll('button');
    btns.forEach(function(b,i){
      b.style.background=i===idx?'rgba(192,144,96,0.2)':'none';
      b.style.borderColor=i===idx?'#c09060':'rgba(192,144,96,0.2)';
    });
  }

  // Update description
  var desc=document.getElementById('tex-desc');
  if(desc){desc.textContent=tex.desc;desc.style.display='block';}

  // Update slider labels
  for(var i=0;i<5;i++){
    var lbl=document.getElementById('tex-l'+(i+1));
    if(lbl)lbl.textContent=tex.labels[i]||('Param '+(i+1));
  }

  doRender();
}

/* Cycle through textures */
var _cycleIdx=-1;
function cycle(){
  _cycleIdx=(_cycleIdx+1)%TEXTURES.length;
  var lbl=document.getElementById('tex-cycle-label');
  var name=document.getElementById('tex-cycle-name');
  if(lbl)lbl.style.display='block';
  if(name)name.textContent=(_cycleIdx+1)+'/'+TEXTURES.length+' \u2014 '+TEXTURES[_cycleIdx].name+' ('+TEXTURES[_cycleIdx].family+')';
  selectTexture(_cycleIdx);
}

/* Randomise params */
function randomise(){
  var ids=['tex-p1','tex-p2','tex-p3','tex-p4','tex-p5'];
  ids.forEach(function(id){
    var el=document.getElementById(id);
    if(el){el.value=10+floor(Math.random()*80);el.dispatchEvent(new Event('input'));}
  });
  doRender();
}

/* ── Build UI lists ── */
function buildTexList(){
  var list=document.getElementById('tex-list');
  if(!list)return;
  list.innerHTML='';
  var currentFamily='';
  TEXTURES.forEach(function(tex,i){
    if(tex.family!==currentFamily){
      currentFamily=tex.family;
      var hdr=document.createElement('div');
      hdr.style.cssText='font-size:7px;color:#c09060;letter-spacing:.1em;margin:6px 0 3px;text-transform:uppercase;opacity:0.7;';
      hdr.textContent=currentFamily;
      list.appendChild(hdr);
    }
    var btn=document.createElement('button');
    btn.textContent=tex.name;
    btn.style.cssText='display:inline-block;padding:3px 8px;margin:1px 2px;font-size:8px;background:none;border:1px solid rgba(192,144,96,0.2);color:#c09060;cursor:pointer;border-radius:2px;font-family:inherit;letter-spacing:.04em;';
    btn.addEventListener('click',function(){selectTexture(i);});
    list.appendChild(btn);
  });
}

function wireSliders(){
  var ids=['tex-p1','tex-p2','tex-p3','tex-p4','tex-p5'];
  var vids=['tex-v1','tex-v2','tex-v3','tex-v4','tex-v5'];
  ids.forEach(function(id,i){
    var el=document.getElementById(id);
    if(!el)return;
    el.addEventListener('input',function(){
      var v=document.getElementById(vids[i]);
      if(v)v.textContent=el.value+'%';
    });
  });
  /* Mapping sliders */
  var mapIds=['tex-tile-scale','tex-tile-rot','tex-bump-str','tex-displace'];
  mapIds.forEach(function(id){
    var el=document.getElementById(id);
    if(!el)return;
    el.addEventListener('input',function(){
      var vid=id+'-v';
      var v=document.getElementById(vid);
      if(v){
        if(id==='tex-tile-rot')v.textContent=el.value+'\u00b0';
        else v.textContent=el.value+'%';
      }
    });
  });
  /* Mapping radio buttons */
  var radios=document.querySelectorAll('input[name="tex-map"]');
  radios.forEach(function(r){
    r.addEventListener('change',function(){
      if(r.checked) S.mapping=r.value;
    });
  });
}

/* ── 3D Texture Mapping Integration ── */
/* Expose texture sampling for use by three-d.js */
function sampleTexture(u,v){
  if(!S.lastTex||!S.lastTex.color)return null;
  var tc=S.lastTex.color.getContext('2d');
  var bc=S.lastTex.bump.getContext('2d');
  var W=S.lastTex.W,H=S.lastTex.H;
  // Tile coordinates
  var tu=((u%1)+1)%1,tv=((v%1)+1)%1;
  var px=floor(tu*W)%W,py=floor(tv*H)%H;
  var cd=tc.getImageData(px,py,1,1).data;
  var bd2=bc.getImageData(px,py,1,1).data;
  return{r:cd[0],g:cd[1],b:cd[2],bump:bd2[0]/255};
}

/* Get bump-perturbed normal at UV */
function getBumpNormal(u,v,normal,strength){
  if(!S.lastTex||!S.lastTex.bump)return normal;
  var bc=S.lastTex.bump.getContext('2d');
  var W=S.lastTex.W,H=S.lastTex.H;
  var tu=((u%1)+1)%1,tv=((v%1)+1)%1;
  var px=floor(tu*W)%W,py=floor(tv*H)%H;
  var px1=(px+1)%W,py1=(py+1)%H;
  var c0=bc.getImageData(px,py,1,1).data[0]/255;
  var cx=bc.getImageData(px1,py,1,1).data[0]/255;
  var cy=bc.getImageData(px,py1,1,1).data[0]/255;
  var dbu=cx-c0,dbv=cy-c0;
  var str2=strength*2;
  return[normal[0]+dbu*str2, normal[1]+dbv*str2, normal[2]];
}

/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════ */
setTimeout(function(){
  buildTexList();
  wireSliders();
},200);

/* ── Public API ── */
window._TEX={
  render:doRender,
  randomise:randomise,
  cycle:cycle,
  selectTexture:selectTexture,
  onPaletteChange:function(){doRender();},
  sampleTexture:sampleTexture,
  getBumpNormal:getBumpNormal,
  getActive:function(){return S.lastTex;},
  getMapping:function(){return S.mapping;},
  setMapping:function(m){S.mapping=m;},
  renderDirect:function(tctx,W,H,texIdx,params){
    var prev=S.texIdx;S.texIdx=texIdx;
    if(params){
      var ids=['tex-p1','tex-p2','tex-p3','tex-p4','tex-p5'];
      for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el&&params[i]!==undefined)el.value=floor(params[i]*100);}
    }
    doRender(tctx,W,H,true);
    S.texIdx=prev;
  },
  TEXTURES:TEXTURES
};

console.log('Textures loaded, _TEX=',typeof window._TEX);

})();
