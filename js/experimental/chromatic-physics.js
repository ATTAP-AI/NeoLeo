/* ══════════════════════════════════════════════════════════
   CHROMATIC PHYSICS — Color as a living, physical phenomenon
   Five systems that treat color as substance with real optical
   properties: wavelength, interference, diffusion, scattering.
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── CIE 1931 color matching functions (sampled 380-700nm, 5nm steps) ── */
var CIE_X=[0.0014,0.0042,0.0143,0.0435,0.1344,0.2839,0.3483,0.3362,0.2908,0.1954,0.0956,0.032,0.0049,0.0093,0.0633,0.1655,0.2904,0.4334,0.5945,0.7621,0.9163,1.0263,1.0622,1.0026,0.8544,0.6424,0.4479,0.2835,0.1649,0.0874,0.0468,0.0227,0.0114,0.0058,0.0029,0.0014,0.0007,0.0003,0.0002,0.0001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var CIE_Y=[0,0.0001,0.0004,0.0012,0.004,0.0116,0.023,0.038,0.06,0.091,0.139,0.208,0.323,0.503,0.71,0.862,0.954,0.995,0.995,0.952,0.87,0.757,0.631,0.503,0.381,0.265,0.175,0.107,0.061,0.032,0.017,0.0082,0.0041,0.0021,0.001,0.0005,0.0003,0.0001,0.0001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var CIE_Z=[0.0065,0.0201,0.0679,0.2074,0.6456,1.3856,1.7471,1.7721,1.6692,1.2876,0.813,0.4652,0.272,0.1582,0.0782,0.0422,0.0203,0.0087,0.0039,0.0021,0.0017,0.0011,0.0008,0.0003,0.0002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

var SYSTEMS = [
  {
    id:'film', name:'Thin-Film Interference',
    nature:'Soap bubbles, oil slicks, beetle shells, peacock feathers, opals',
    desc:'Simulates light interference from varying film thickness — colors emerge from wave physics, producing iridescent hues impossible to find in any palette.',
    labels:['Thickness Range','Refractive Index','Turbulence','Iridescence','Viewing Angle'],
    min:[1,10,0,10,0], max:[100,40,100,100,80],
    def:[55,15,40,70,25],
    fmt:[function(v){return Math.round(v)+'nm'},function(v){return (1+v/20).toFixed(2)},function(v){return Math.round(v)+'%'},function(v){return Math.round(v)+'%'},function(v){return Math.round(v)+'°'}]
  },
  {
    id:'scatter', name:'Light Scattering',
    nature:'Skies, sunsets, deep water, atmospheric haze, Tyndall beams',
    desc:'Rayleigh and Mie scattering simulation — short wavelengths scatter more, producing natural sky-to-sunset color gradients from pure optics.',
    labels:['Sun Elevation','Atmosphere Density','Particle Size','Turbidity','Horizon Glow'],
    min:[0,5,1,5,0], max:[90,100,80,100,100],
    def:[25,50,20,40,60],
    fmt:[function(v){return Math.round(v)+'°'},function(v){return Math.round(v)+'%'},function(v){return (v/10).toFixed(1)+'µm'},function(v){return Math.round(v)+'%'},function(v){return Math.round(v)+'%'}]
  },
  {
    id:'mix', name:'Subtractive Pigment',
    nature:'Watercolor bleeds, ink diffusion, paint mixing, dye absorption',
    desc:'Kubelka-Munk pigment model — colors mix like real paint where red+blue=dark violet, not bright magenta. Diffusion spreads colors into each other like wet media.',
    labels:['Pigment Count','Diffusion Steps','Viscosity','Absorption','Granulation'],
    min:[2,5,5,10,0], max:[12,200,100,100,100],
    def:[5,80,45,55,35],
    fmt:[function(v){return Math.round(v)},function(v){return Math.round(v)},function(v){return Math.round(v)+'%'},function(v){return Math.round(v)+'%'},function(v){return Math.round(v)+'%'}]
  },
  {
    id:'field', name:'Chromatic Fields',
    nature:'Color pressure maps, hue magnetism, saturation currents, vibrating territories',
    desc:'Colors as charged particles in force fields — complementary colors attract, analogous repel, creating emergent spatial patterns from color physics alone.',
    labels:['Color Count','Field Strength','Damping','Iterations','Boundary Glow'],
    min:[3,10,5,20,0], max:[14,100,90,500,100],
    def:[6,55,40,200,50],
    fmt:[function(v){return Math.round(v)},function(v){return Math.round(v)+'%'},function(v){return Math.round(v)+'%'},function(v){return Math.round(v)},function(v){return Math.round(v)+'%'}]
  },
  {
    id:'prism', name:'Spectral Dispersion',
    nature:'Prism rainbows, caustic light patterns, diamond fire, refraction art',
    desc:'White light decomposed through refractive geometry — the full visible spectrum fans from 380nm to 700nm through simulated optical elements.',
    labels:['Prism Count','Dispersion','Light Spread','Caustic Intensity','Chromatic Blur'],
    min:[1,10,5,10,0], max:[8,100,100,100,80],
    def:[3,60,40,65,30],
    fmt:[function(v){return Math.round(v)},function(v){return (v/20).toFixed(2)},function(v){return Math.round(v)+'°'},function(v){return Math.round(v)+'%'},function(v){return Math.round(v)+'%'}]
  }
];

/* ── Private state ── */
var M = {sysIdx:0, cycleIdx:-1};

/* ── PRNG (fast xorshift) ── */
var _seed = 1;
function prng(s){ if(s!==undefined) _seed=s|0||1; _seed^=_seed<<13; _seed^=_seed>>17; _seed^=_seed<<5; return (_seed>>>0)/4294967296; }

/* ── Helpers ── */
function hRGB(hex){
  hex=hex.replace('#','');
  return [parseInt(hex.substring(0,2),16), parseInt(hex.substring(2,4),16), parseInt(hex.substring(4,6),16)];
}

function palCols(){
  var p = typeof gpal==='function' ? gpal() : null;
  return p&&p.c&&p.c.length ? p.c : ['#4488cc','#cc4466','#44cc88','#cc8844','#8844cc','#cccc44'];
}

function getSys(){ return SYSTEMS[M.sysIdx]; }
function pv(i){ var el=document.getElementById('chrp-p'+(i+1)); return el ? parseInt(el.value) : getSys().def[i]; }

/* ── Local noise (value noise) ── */
function vnLocal(x,y,sd){
  function h(a,b){a=((a*2654435761)^(b*2246822519)^((sd||0)*3266489917))>>>0; a=((a^(a>>16))*2246822507)>>>0; a=((a^(a>>13))*3266489909)>>>0; return ((a^(a>>16))>>>0)/4294967296;}
  var ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  var u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  var a=h(ix,iy),b=h(ix+1,iy),c=h(ix,iy+1),d=h(ix+1,iy+1);
  return a+(b-a)*u+(c-a)*v+(d-b-c+a)*u*v;
}

function fbmLocal(x,y,sd,oct){
  oct=oct||5; var v=0,a=0.5,f=1;
  for(var i=0;i<oct;i++){v+=a*vnLocal(x*f,y*f,sd+i*7); a*=0.5; f*=2;}
  return v;
}

function lerp(a,b,t){ return a+(b-a)*t; }
function clamp(v,mn,mx){ return v<mn?mn:v>mx?mx:v; }

/* ── Spectral → RGB conversion via CIE ── */
function spectrumToRGB(spectrum){
  // spectrum: array of 65 values (380-700nm, 5nm steps), each 0-1 intensity
  var X=0,Y=0,Z=0;
  for(var i=0;i<65;i++){
    var s=spectrum[i]||0;
    X+=s*CIE_X[i]; Y+=s*CIE_Y[i]; Z+=s*CIE_Z[i];
  }
  // XYZ to sRGB
  var r= 3.2406*X - 1.5372*Y - 0.4986*Z;
  var g=-0.9689*X + 1.8758*Y + 0.0415*Z;
  var b= 0.0557*X - 0.2040*Y + 1.0570*Z;
  // Gamma
  function gamma(c){ return c<=0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055; }
  r=clamp(gamma(r),0,1); g=clamp(gamma(g),0,1); b=clamp(gamma(b),0,1);
  return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];
}

function wavelengthToSpectrumIdx(nm){ return clamp(Math.round((nm-380)/5),0,64); }

/* ── Hex color to approximate dominant wavelength ── */
function hexToWavelength(hex){
  var rgb=hRGB(hex);
  var r=rgb[0]/255,g=rgb[1]/255,b=rgb[2]/255;
  // Approximate: map hue to wavelength
  var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0;
  if(mx===mn) h=0;
  else if(mx===r) h=60*((g-b)/(mx-mn))%360;
  else if(mx===g) h=60*((b-r)/(mx-mn))+120;
  else h=60*((r-g)/(mx-mn))+240;
  if(h<0) h+=360;
  // Map hue 0-360 to wavelength ~700nm (red) down to ~380nm (violet)
  // Red=0°→700nm, Yellow=60°→580nm, Green=120°→520nm, Cyan=180°→490nm, Blue=240°→450nm, Violet=280°→400nm
  if(h<=60) return lerp(700,580,h/60);
  if(h<=120) return lerp(580,520,(h-60)/60);
  if(h<=180) return lerp(520,490,(h-120)/60);
  if(h<=240) return lerp(490,450,(h-180)/60);
  if(h<=300) return lerp(450,400,(h-240)/60);
  return lerp(400,700,(h-300)/60);
}

/* ── Single wavelength → spectral power (Gaussian centered on λ) ── */
function wavelengthSpectrum(centerNm, width){
  var spec=new Float32Array(65);
  width=width||15;
  for(var i=0;i<65;i++){
    var nm=380+i*5;
    var d=(nm-centerNm)/width;
    spec[i]=Math.exp(-0.5*d*d);
  }
  return spec;
}

/* ═══════════════════════════════════════════════════
   RENDERER 1: THIN-FILM INTERFERENCE
   ═══════════════════════════════════════════════════ */
function renderFilm(ctx,W,H,cols){
  var thickRange = pv(0)/100*400+50; // 50-450nm range
  var n = 1+pv(1)/20;               // refractive index 1.5-3.0
  var turb = pv(2)/100;
  var iri = pv(3)/100;
  var angle = pv(4)/100*0.8;        // viewing angle factor

  _seed = Date.now()&0xFFFFFF;
  var grd = Math.min(W,H);
  var step = Math.max(1, Math.floor(grd/320));
  var offCanvas = document.createElement('canvas');
  offCanvas.width = Math.ceil(W/step);
  offCanvas.height = Math.ceil(H/step);
  var octx = offCanvas.getContext('2d');
  var imgData = octx.createImageData(offCanvas.width, offCanvas.height);
  var px = imgData.data;

  // Base thickness gradient: radial + noise
  var cx=W/2, cy=H/2, maxR=Math.sqrt(cx*cx+cy*cy);

  for(var py2=0; py2<offCanvas.height; py2++){
    for(var px2=0; px2<offCanvas.width; px2++){
      var x=px2*step, y=py2*step;
      var nx=x/W, ny=y/H;

      // Film thickness from gradient + turbulence
      var radDist = Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy))/maxR;
      var noiseVal = fbmLocal(nx*4,ny*4,_seed,4)*turb;
      var swirl = fbmLocal(nx*3+noiseVal*2, ny*3+noiseVal*2, _seed+99, 3)*turb*0.5;
      var thickness = (radDist*0.6 + noiseVal*0.3 + swirl*0.2 + 0.1) * thickRange + 80;

      // Angle-dependent path length
      var cosTheta = Math.cos(angle * radDist * Math.PI * 0.5);
      var opticalPath = 2 * n * thickness * cosTheta;

      // Compute interference spectrum
      var spectrum = new Float32Array(65);
      for(var i=0;i<65;i++){
        var lambda = 380+i*5;
        var phase = 2*Math.PI*opticalPath/lambda;
        // Reflectance from thin film: R = 4*r²*sin²(δ/2) / (1 - r²)² + 4r²sin²(δ/2)
        // Simplified: intensity modulation
        var sinHalf = Math.sin(phase/2);
        var r2 = Math.pow((n-1)/(n+1),2);
        spectrum[i] = 4*r2*sinHalf*sinHalf / ((1-r2)*(1-r2)+4*r2*sinHalf*sinHalf);
        spectrum[i] *= iri; // iridescence intensity
      }

      var rgb = spectrumToRGB(spectrum);

      // Blend with palette-tinted base
      var colIdx = Math.floor(radDist*cols.length)%cols.length;
      var base = hRGB(cols[colIdx]);
      var blend = 0.3 + iri*0.5;
      var fr = clamp(Math.round(lerp(base[0],rgb[0]*2.5,blend)),0,255);
      var fg = clamp(Math.round(lerp(base[1],rgb[1]*2.5,blend)),0,255);
      var fb = clamp(Math.round(lerp(base[2],rgb[2]*2.5,blend)),0,255);

      var idx = (py2*offCanvas.width+px2)*4;
      px[idx]=fr; px[idx+1]=fg; px[idx+2]=fb; px[idx+3]=255;
    }
  }
  octx.putImageData(imgData,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(offCanvas,0,0,W,H);
}

/* ═══════════════════════════════════════════════════
   RENDERER 2: LIGHT SCATTERING
   ═══════════════════════════════════════════════════ */
function renderScatter(ctx,W,H,cols){
  var sunElev = pv(0)/90;           // 0-1
  var density = pv(1)/100;
  var particleSize = pv(2)/80;      // 0-1
  var turbidity = pv(3)/100;
  var horizonGlow = pv(4)/100;

  _seed = Date.now()&0xFFFFFF;
  var step = Math.max(1, Math.floor(Math.min(W,H)/320));
  var ow = Math.ceil(W/step), oh = Math.ceil(H/step);
  var offCanvas = document.createElement('canvas');
  offCanvas.width=ow; offCanvas.height=oh;
  var octx = offCanvas.getContext('2d');
  var imgData = octx.createImageData(ow,oh);
  var px = imgData.data;

  // Sun in normalized coords
  var sunNx = 0.5 + fbmLocal(0.5,0.5,_seed,2)*0.25;
  var sunNy = 1.0 - sunElev*0.8;

  // Palette colors for tinting
  var palLen = cols.length;
  var c0=hRGB(cols[0%palLen]), c1=hRGB(cols[1%palLen]), c2=hRGB(cols[2%palLen]);
  var c3=hRGB(cols[Math.min(3,palLen-1)%palLen]);

  // Physically-inspired RGB scattering (avoids CIE conversion issues)
  // Blue(450nm) scatters ~5.5x more than red(650nm) via Rayleigh λ⁻⁴
  var scatR=1.0, scatG=Math.pow(650/550,4-particleSize*2), scatB=Math.pow(650/450,4-particleSize*2);

  for(var py2=0; py2<oh; py2++){
    for(var px2=0; px2<ow; px2++){
      var nx=px2/ow, ny=py2/oh;

      var dx=nx-sunNx, dy=ny-sunNy;
      var sunDist = Math.sqrt(dx*dx+dy*dy);

      // Altitude: 1 at top, 0 at bottom
      var alt = 1-ny;
      // Airmass: longer path near horizon
      var airmass = 1.0/(alt*alt+0.04);
      var tau = density*1.5*airmass;

      // Beer-Lambert extinction per channel
      var extR = Math.exp(-tau*scatR*0.4);
      var extG = Math.exp(-tau*scatG*0.4);
      var extB = Math.exp(-tau*scatB*0.4);

      // ── Direct sunlight: warm near horizon (blue extinguished)
      var sunAtten = Math.exp(-sunDist*sunDist*18);
      var dirR = sunAtten*extR;
      var dirG = sunAtten*extG*0.9;
      var dirB = sunAtten*extB*0.6;

      // ── Inscattered sky light: blue dominates overhead
      var insR = (1-extR)*scatR*0.08;
      var insG = (1-extG)*scatG*0.08;
      var insB = (1-extB)*scatB*0.08;

      // ── Horizon glow: warm band at bottom
      var hBand = Math.exp(-alt*alt*8)*horizonGlow;
      var glowR = hBand*0.35;
      var glowG = hBand*0.18;
      var glowB = hBand*0.05;

      // ── Mie forward scattering: bright halo around sun
      var mie = Math.exp(-sunDist*4)*particleSize*0.4;

      var fr = (dirR+insR+glowR+mie)*255;
      var fg = (dirG+insG+glowG+mie*0.8)*255;
      var fb = (dirB+insB+glowB+mie*0.5)*255;

      // Turbidity noise
      if(turbidity>0.05){
        var tn = fbmLocal(nx*5,ny*5,_seed+33,3)*turbidity*40;
        fr+=tn*0.6; fg+=tn*0.4; fb+=tn*0.2;
      }

      // Palette tinting: blend sky colors with palette
      var palAmt = 0.3;
      // Vertical gradient through palette colors
      var tintR,tintG,tintB;
      if(alt<0.33){ var t=alt*3; tintR=lerp(c0[0],c1[0],t); tintG=lerp(c0[1],c1[1],t); tintB=lerp(c0[2],c1[2],t); }
      else if(alt<0.66){ var t=(alt-0.33)*3; tintR=lerp(c1[0],c2[0],t); tintG=lerp(c1[1],c2[1],t); tintB=lerp(c1[2],c2[2],t); }
      else { var t=(alt-0.66)*3; tintR=lerp(c2[0],c3[0],t); tintG=lerp(c2[1],c3[1],t); tintB=lerp(c2[2],c3[2],t); }

      fr=lerp(fr,tintR,palAmt);
      fg=lerp(fg,tintG,palAmt);
      fb=lerp(fb,tintB,palAmt);

      var idx=(py2*ow+px2)*4;
      px[idx]=clamp(Math.round(fr),0,255);
      px[idx+1]=clamp(Math.round(fg),0,255);
      px[idx+2]=clamp(Math.round(fb),0,255);
      px[idx+3]=255;
    }
  }
  octx.putImageData(imgData,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(offCanvas,0,0,W,H);
}

/* ═══════════════════════════════════════════════════
   RENDERER 3: SUBTRACTIVE PIGMENT (Kubelka-Munk)
   ═══════════════════════════════════════════════════ */
function renderMix(ctx,W,H,cols){
  var pigCount = Math.round(lerp(2,12,pv(0)/100));
  var diffSteps = Math.round(lerp(5,200,pv(1)/100));
  var viscosity = pv(2)/100;
  var absorption = pv(3)/100;
  var granulation = pv(4)/100;

  _seed = Date.now()&0xFFFFFF;

  // Grid resolution for diffusion simulation
  var gw=160, gh=160;
  var cellW=W/gw, cellH=H/gh;

  // Each cell has RGB pigment concentration
  var grid = new Float32Array(gw*gh*3);

  // Place pigment blobs
  for(var p=0; p<pigCount; p++){
    var col = hRGB(cols[p%cols.length]);
    // IS integration for placement
    var bx,by;
    if(window._IS && window._IS.active){
      var att=0;
      do { bx=prng(); by=prng(); att++; } while(att<40 && prng()>(_IS.getDens ? _IS.getDens(bx,by):0.5)+0.15);
    } else {
      bx = 0.15+prng()*0.7;
      by = 0.15+prng()*0.7;
    }
    var cx=Math.floor(bx*gw), cy=Math.floor(by*gh);
    var radius = gw*(0.12+prng()*0.22);

    for(var dy=-Math.ceil(radius);dy<=Math.ceil(radius);dy++){
      for(var dx=-Math.ceil(radius);dx<=Math.ceil(radius);dx++){
        var gx=cx+dx, gy=cy+dy;
        if(gx<0||gx>=gw||gy<0||gy>=gh) continue;
        var d=Math.sqrt(dx*dx+dy*dy)/radius;
        if(d>1) continue;
        var strength = Math.pow(1-d,2) * (0.7+prng()*0.3);
        // Granulation: add texture
        if(granulation>0){
          strength *= (1-granulation*0.6) + granulation*0.6*vnLocal(gx*0.5,gy*0.5,_seed+p*11);
        }
        var idx=(gy*gw+gx)*3;
        // Subtractive mixing: multiply concentrations (like real pigment layering)
        // More pigment = darker (absorbs more light)
        var absK = absorption*0.8+0.2;
        grid[idx]   = clamp(grid[idx]   + (1-grid[idx])   * strength * col[0]/255 * absK, 0, 1);
        grid[idx+1] = clamp(grid[idx+1] + (1-grid[idx+1]) * strength * col[1]/255 * absK, 0, 1);
        grid[idx+2] = clamp(grid[idx+2] + (1-grid[idx+2]) * strength * col[2]/255 * absK, 0, 1);
      }
    }
  }

  // Diffusion simulation (pigment spreading like wet watercolor)
  var diffRate = (1-viscosity)*0.25;
  for(var s=0; s<diffSteps; s++){
    var next = new Float32Array(grid.length);
    for(var y=1;y<gh-1;y++){
      for(var x=1;x<gw-1;x++){
        var idx=(y*gw+x)*3;
        for(var ch=0;ch<3;ch++){
          var c=grid[idx+ch];
          var avg=(grid[((y-1)*gw+x)*3+ch]+grid[((y+1)*gw+x)*3+ch]+
                   grid[(y*gw+x-1)*3+ch]+grid[(y*gw+x+1)*3+ch])*0.25;
          // Kubelka-Munk inspired: heavier pigment diffuses slower
          var weight = diffRate * (1 - c*viscosity*0.5);
          next[idx+ch] = c + (avg-c)*weight;
          // Granulation noise
          if(granulation>0.2){
            next[idx+ch] += (vnLocal(x*0.3+s*0.01,y*0.3,_seed+ch)-0.5)*granulation*0.01;
          }
          next[idx+ch] = clamp(next[idx+ch],0,1);
        }
      }
    }
    // Copy edges
    for(var x=0;x<gw;x++){
      next[x*3]=grid[x*3]; next[x*3+1]=grid[x*3+1]; next[x*3+2]=grid[x*3+2];
      var b2=((gh-1)*gw+x)*3;
      next[b2]=grid[b2]; next[b2+1]=grid[b2+1]; next[b2+2]=grid[b2+2];
    }
    for(var y=0;y<gh;y++){
      var l=(y*gw)*3,r=(y*gw+gw-1)*3;
      next[l]=grid[l]; next[l+1]=grid[l+1]; next[l+2]=grid[l+2];
      next[r]=grid[r]; next[r+1]=grid[r+1]; next[r+2]=grid[r+2];
    }
    grid = next;
  }

  // Render grid to canvas (subtractive: pigment absorbs light from paper)
  var offCanvas = document.createElement('canvas');
  offCanvas.width=gw; offCanvas.height=gh;
  var octx=offCanvas.getContext('2d');
  var imgData=octx.createImageData(gw,gh);
  var px=imgData.data;

  // Paper is always warm white (like real watercolor paper) regardless of canvas bg
  var paper = [248,244,236];

  for(var y=0;y<gh;y++){
    for(var x=0;x<gw;x++){
      var idx=(y*gw+x)*3;
      var pidx=(y*gw+x)*4;

      var cr=grid[idx], cg=grid[idx+1], cb=grid[idx+2];
      var totalPig = (cr+cg+cb)/3;

      if(totalPig < 0.005){
        // No pigment: show paper
        px[pidx]=paper[0]; px[pidx+1]=paper[1]; px[pidx+2]=paper[2]; px[pidx+3]=255;
        continue;
      }

      // Subtractive color mixing: each pigment channel absorbs its complementary light
      // Red pigment absorbs green+blue, reflects red, etc.
      // Reconstruct visible color from pigment concentrations
      var absStr = 2.5 + absorption*4; // absorption strength multiplier

      // Each pigment concentration directly represents that color being deposited
      // Subtractive: paper white minus what's absorbed
      // Red pigment absorbs cyan (G+B), green pigment absorbs magenta (R+B), blue absorbs yellow (R+G)
      var fr = paper[0] * (1 - clamp((1-cr)*cg*0.7 + (1-cr)*cb*0.7, 0, 0.95)) * (0.3 + cr*0.7);
      var fg = paper[1] * (1 - clamp((1-cg)*cr*0.7 + (1-cg)*cb*0.7, 0, 0.95)) * (0.3 + cg*0.7);
      var fb = paper[2] * (1 - clamp((1-cb)*cr*0.7 + (1-cb)*cg*0.7, 0, 0.95)) * (0.3 + cb*0.7);

      // Muddy darkening where multiple pigments overlap (subtractive gets darker)
      if(totalPig > 0.25){
        var muddyFactor = Math.pow(totalPig, 1.3) * absorption * 0.6;
        fr *= (1-muddyFactor);
        fg *= (1-muddyFactor);
        fb *= (1-muddyFactor);
      }

      // Granulation texture: slight luminance variation
      if(granulation > 0.1){
        var gn = 0.85 + 0.3*vnLocal(x*0.8, y*0.8, _seed+77);
        fr*=gn; fg*=gn; fb*=gn;
      }

      px[pidx]=clamp(Math.round(fr),0,255);
      px[pidx+1]=clamp(Math.round(fg),0,255);
      px[pidx+2]=clamp(Math.round(fb),0,255);
      px[pidx+3]=255;
    }
  }
  octx.putImageData(imgData,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(offCanvas,0,0,W,H);
}

/* ═══════════════════════════════════════════════════
   RENDERER 4: CHROMATIC FIELDS
   ═══════════════════════════════════════════════════ */
function renderField(ctx,W,H,cols){
  var colorCount = Math.round(lerp(3,14,pv(0)/100));
  var fieldStr = pv(1)/100;
  var damping = pv(2)/100;
  var iterations = Math.round(lerp(20,500,pv(3)/100));
  var glowAmt = pv(4)/100;

  _seed = Date.now()&0xFFFFFF;

  // Create color particles with position, velocity, hue
  var particles = [];
  for(var i=0;i<colorCount;i++){
    var col = hRGB(cols[i%cols.length]);
    var hue = rgbToHue(col[0],col[1],col[2]);
    particles.push({
      x: 0.1+prng()*0.8,
      y: 0.1+prng()*0.8,
      vx: (prng()-0.5)*0.01,
      vy: (prng()-0.5)*0.01,
      hue: hue,
      r: col[0], g: col[1], b: col[2],
      mass: 0.5+prng()*0.5,
      trail: []
    });
  }

  // Simulate color field interactions
  for(var iter=0;iter<iterations;iter++){
    for(var i=0;i<particles.length;i++){
      var pi=particles[i];
      var fx=0, fy=0;
      for(var j=0;j<particles.length;j++){
        if(i===j) continue;
        var pj=particles[j];
        var dx=pj.x-pi.x, dy=pj.y-pi.y;
        var dist=Math.sqrt(dx*dx+dy*dy)+0.001;
        // Hue distance determines attraction/repulsion
        var hueDiff = Math.abs(pi.hue-pj.hue);
        if(hueDiff>180) hueDiff=360-hueDiff;
        // Complementary (180°) attract, analogous (<60°) repel
        var force = (hueDiff-90)/90 * fieldStr * 0.001 / (dist*dist+0.01);
        fx += dx/dist * force * pj.mass;
        fy += dy/dist * force * pj.mass;
      }
      // IS integration
      if(window._IS && window._IS.active && window._IS.getGradDir){
        var gd = window._IS.getGradDir(pi.x, pi.y);
        fx += gd[0]*0.0005*fieldStr;
        fy += gd[1]*0.0005*fieldStr;
      }
      pi.vx = (pi.vx+fx)*(1-damping*0.02);
      pi.vy = (pi.vy+fy)*(1-damping*0.02);
      pi.x = clamp(pi.x+pi.vx, 0.02, 0.98);
      pi.y = clamp(pi.y+pi.vy, 0.02, 0.98);
      pi.trail.push({x:pi.x,y:pi.y});
      if(pi.trail.length>300) pi.trail.shift();
    }
  }

  // Render: for each pixel, compute influence from all particles
  var step = Math.max(1, Math.floor(Math.min(W,H)/280));
  var offCanvas = document.createElement('canvas');
  offCanvas.width=Math.ceil(W/step); offCanvas.height=Math.ceil(H/step);
  var octx=offCanvas.getContext('2d');
  var imgData=octx.createImageData(offCanvas.width,offCanvas.height);
  var px=imgData.data;

  for(var py2=0;py2<offCanvas.height;py2++){
    for(var px2=0;px2<offCanvas.width;px2++){
      var x=(px2*step)/W, y=(py2*step)/H;
      var tr=0,tg=0,tb=0,tw=0;
      var minDist=999;

      for(var i=0;i<particles.length;i++){
        var pi=particles[i];
        // Influence from current position
        var dx=x-pi.x, dy=y-pi.y;
        var dist=Math.sqrt(dx*dx+dy*dy)+0.001;
        var w=1/(dist*dist*50+0.1);
        tr+=pi.r*w; tg+=pi.g*w; tb+=pi.b*w; tw+=w;
        if(dist<minDist) minDist=dist;

        // Influence from trail
        for(var t=pi.trail.length-1;t>=0;t-=3){
          var pt=pi.trail[t];
          var tdx=x-pt.x, tdy=y-pt.y;
          var td=Math.sqrt(tdx*tdx+tdy*tdy)+0.001;
          var tw2=1/(td*td*80+0.2) * (t/pi.trail.length)*0.5;
          tr+=pi.r*tw2; tg+=pi.g*tw2; tb+=pi.b*tw2; tw+=tw2;
        }
      }

      var fr=clamp(Math.round(tr/tw),0,255);
      var fg=clamp(Math.round(tg/tw),0,255);
      var fb=clamp(Math.round(tb/tw),0,255);

      // Boundary glow: bright edges where color territories meet
      if(glowAmt>0){
        // Find two nearest different-colored particles
        var sorted=[];
        for(var i=0;i<particles.length;i++){
          var dx=x-particles[i].x,dy=y-particles[i].y;
          sorted.push({d:Math.sqrt(dx*dx+dy*dy),i:i});
        }
        sorted.sort(function(a,b){return a.d-b.d;});
        if(sorted.length>=2){
          var ratio=sorted[0].d/(sorted[1].d+0.001);
          if(ratio>0.7 && ratio<1.3){
            // Near boundary: add glow
            var glowI = (1-Math.abs(ratio-1)/0.3)*glowAmt;
            fr=clamp(Math.round(fr+glowI*180),0,255);
            fg=clamp(Math.round(fg+glowI*180),0,255);
            fb=clamp(Math.round(fb+glowI*180),0,255);
          }
        }
      }

      var idx=(py2*offCanvas.width+px2)*4;
      px[idx]=fr; px[idx+1]=fg; px[idx+2]=fb; px[idx+3]=255;
    }
  }
  octx.putImageData(imgData,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(offCanvas,0,0,W,H);
}

function rgbToHue(r,g,b){
  r/=255;g/=255;b/=255;
  var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0;
  if(mx===mn) return 0;
  if(mx===r) h=60*((g-b)/(mx-mn));
  else if(mx===g) h=60*((b-r)/(mx-mn))+120;
  else h=60*((r-g)/(mx-mn))+240;
  return h<0?h+360:h;
}

/* ═══════════════════════════════════════════════════
   RENDERER 5: SPECTRAL DISPERSION
   ═══════════════════════════════════════════════════ */
function renderPrism(ctx,W,H,cols){
  var prismCount = Math.round(lerp(1,8,pv(0)/100));
  var dispersion = pv(1)/20;        // 0.5-5.0
  var lightSpread = pv(2)/100;
  var causticInt = pv(3)/100;
  var chromBlur = pv(4)/100;

  _seed = Date.now()&0xFFFFFF;

  var step = Math.max(1, Math.floor(Math.min(W,H)/300));
  var offCanvas = document.createElement('canvas');
  offCanvas.width=Math.ceil(W/step); offCanvas.height=Math.ceil(H/step);
  var octx=offCanvas.getContext('2d');
  var imgData=octx.createImageData(offCanvas.width,offCanvas.height);
  var px=imgData.data;

  // Define prism positions and orientations
  var prisms = [];
  for(var p=0;p<prismCount;p++){
    prisms.push({
      x: 0.15+prng()*0.7,
      y: 0.15+prng()*0.7,
      angle: prng()*Math.PI*2,
      size: 0.08+prng()*0.12,
      n: 1.4+prng()*dispersion*0.4  // refractive index varies
    });
  }

  // Light source
  var lightX = 0.5+fbmLocal(0.5,0.5,_seed,2)*0.3;
  var lightY = 0.1+prng()*0.2;

  for(var py2=0;py2<offCanvas.height;py2++){
    for(var px2=0;px2<offCanvas.width;px2++){
      var x=(px2*step)/W, y=(py2*step)/H;
      var spectrum = new Float32Array(65);

      // For each prism, compute spectral dispersion at this pixel
      for(var p=0;p<prisms.length;p++){
        var pr=prisms[p];
        var dx=x-pr.x, dy=y-pr.y;

        // Rotate to prism local coords
        var cos=Math.cos(-pr.angle), sin=Math.sin(-pr.angle);
        var lx=dx*cos-dy*sin, ly=dx*sin+dy*cos;

        // Distance from prism center
        var dist=Math.sqrt(lx*lx+ly*ly);
        if(dist>pr.size*3) continue;

        // Angle from prism determines which wavelength arrives here
        var refAngle=Math.atan2(ly,lx);

        // Light direction
        var ldx=x-lightX, ldy=y-lightY;
        var lightAngle=Math.atan2(ldy,ldx);
        var incidentAngle = lightAngle-pr.angle;

        // Snell's law dispersion: each wavelength refracts differently
        for(var i=0;i<65;i++){
          var lambda = 380+i*5;
          // Cauchy equation: n(λ) = A + B/λ²
          var nLambda = pr.n + dispersion*0.3*30000/(lambda*lambda);
          // Refraction angle
          var sinRefract = Math.sin(incidentAngle)/nLambda;
          sinRefract = clamp(sinRefract,-1,1);
          var refractAngle = Math.asin(sinRefract);

          // Does this wavelength reach this pixel?
          var targetAngle = pr.angle + refractAngle;
          var pixelAngle = Math.atan2(y-pr.y, x-pr.x);
          var angleDiff = Math.abs(pixelAngle-targetAngle);
          if(angleDiff>Math.PI) angleDiff=2*Math.PI-angleDiff;

          // Intensity falls off with angular distance
          var spread = lightSpread*0.3+0.05;
          var intensity = Math.exp(-angleDiff*angleDiff/(2*spread*spread));
          // Distance falloff
          intensity *= Math.exp(-dist/(pr.size*2));
          // Caustic concentration
          intensity *= 1+causticInt*2*Math.pow(Math.cos(angleDiff*5),2);

          spectrum[i] += intensity*0.5;
        }
      }

      // Background: subtle noise-colored field from palette
      var bgNoise = fbmLocal(x*3,y*3,_seed+77,3);
      var bgIdx = Math.floor(bgNoise*cols.length*2)%cols.length;
      var bgCol = hRGB(cols[bgIdx]);
      var bgAmt = 0.15;

      var rgb = spectrumToRGB(spectrum);
      var specTotal = 0;
      for(var i=0;i<65;i++) specTotal+=spectrum[i];
      var specAmt = clamp(specTotal*0.5,0,1);

      var fr=clamp(Math.round(lerp(bgCol[0]*bgAmt,rgb[0]*3,specAmt)),0,255);
      var fg=clamp(Math.round(lerp(bgCol[1]*bgAmt,rgb[1]*3,specAmt)),0,255);
      var fb=clamp(Math.round(lerp(bgCol[2]*bgAmt,rgb[2]*3,specAmt)),0,255);

      // Chromatic blur: slight offset between channels
      if(chromBlur>0.1){
        var blurOff = chromBlur*3;
        var bx=clamp(px2+Math.round(blurOff),0,offCanvas.width-1);
        var rx=clamp(px2-Math.round(blurOff),0,offCanvas.width-1);
        // Will be applied as post-process glow instead
        fr = clamp(fr+Math.round(specAmt*chromBlur*40),0,255);
        fb = clamp(fb+Math.round(specAmt*chromBlur*30),0,255);
      }

      var idx=(py2*offCanvas.width+px2)*4;
      px[idx]=fr; px[idx+1]=fg; px[idx+2]=fb; px[idx+3]=255;
    }
  }
  octx.putImageData(imgData,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(offCanvas,0,0,W,H);

  // Additive glow pass for caustics
  if(causticInt>0.2){
    ctx.globalCompositeOperation='screen';
    ctx.globalAlpha=causticInt*0.4;
    ctx.filter='blur('+Math.round(chromBlur*5+2)+'px)';
    ctx.drawImage(offCanvas,0,0,W,H);
    ctx.filter='none';
    ctx.globalAlpha=1;
    ctx.globalCompositeOperation='source-over';
  }
}

/* ═══════════════════════════════════════════════════
   MAIN RENDER PIPELINE
   ═══════════════════════════════════════════════════ */
function doRender(){
  if(window.genUndoPush) window.genUndoPush();

  var dv = document.getElementById('dv');
  var lctx = window._getActiveLayerCtx ? window._getActiveLayerCtx() : (window._dctx||null);
  if(!lctx||!dv) return;
  var W=dv.width, H=dv.height;
  if(W<=0||H<=0) return;

  var cols = palCols();
  if(!window._ENG_CONNECT) lctx.clearRect(0,0,W,H);

  lctx.imageSmoothingEnabled=true;
  lctx.imageSmoothingQuality='high';

  var sys=getSys();
  var st=document.getElementById('chrp-status');
  if(st) st.textContent='Generating '+sys.name+'…';

  setTimeout(function(){
    try {
      if(sys.id==='film')    renderFilm(lctx,W,H,cols);
      else if(sys.id==='scatter') renderScatter(lctx,W,H,cols);
      else if(sys.id==='mix')     renderMix(lctx,W,H,cols);
      else if(sys.id==='field')   renderField(lctx,W,H,cols);
      else if(sys.id==='prism')   renderPrism(lctx,W,H,cols);
    } catch(e){ console.warn('ChromaticPhysics render error:',e); }

    if(window._layersCompositeFn) window._layersCompositeFn();
    if(window._layersUpdateThumbs) window._layersUpdateThumbs();

    var hex=Math.floor(Math.random()*0xFFFFFF).toString(16).toUpperCase();
    while(hex.length<6) hex='0'+hex;
    if(st) st.textContent=sys.name+' — seed: 0x'+hex;
  },16);
}

/* ── Slider wiring ── */
function wireSliders(){
  var sys=getSys();
  var _t=null;
  function schedRender(){ clearTimeout(_t); _t=setTimeout(doRender,120); }

  for(var i=0;i<5;i++){
    (function(idx){
      var sl=document.getElementById('chrp-p'+(idx+1));
      var lb=document.getElementById('chrp-l'+(idx+1));
      var vl=document.getElementById('chrp-v'+(idx+1));
      if(!sl) return;
      sl.min=sys.min[idx]; sl.max=sys.max[idx]; sl.value=sys.def[idx];
      if(lb) lb.textContent=sys.labels[idx];
      if(vl) vl.textContent=sys.fmt[idx](sys.def[idx]);
      sl.oninput=function(){
        var v=parseInt(this.value);
        if(vl) vl.textContent=sys.fmt[idx](v);
        schedRender();
      };
    })(i);
  }

  var desc=document.getElementById('chrp-desc');
  if(desc){
    desc.style.display='block';
    desc.textContent=sys.desc;
  }
}

/* ── System list building ── */
function buildSysList(){
  var cont=document.getElementById('chrp-sys-list');
  if(!cont) return;
  cont.innerHTML='';
  SYSTEMS.forEach(function(sys,idx){
    var btn=document.createElement('button');
    btn.className='fx-bb';
    btn.style.cssText='display:block;width:100%;text-align:left;font-size:8px;padding:4px 8px;margin-bottom:2px;border-color:'+(idx===M.sysIdx?'#6a8ccc':'var(--brd)')+';color:'+(idx===M.sysIdx?'#8ab4ff':'#6a8ccc')+';background:'+(idx===M.sysIdx?'rgba(106,140,204,0.08)':'none')+';cursor:pointer;';
    btn.innerHTML='<strong>'+sys.name+'</strong> <span style="color:#5a7aaa;font-style:italic;margin-left:4px;">'+sys.nature+'</span>';
    btn.onclick=function(){ selectSystem(idx); };
    cont.appendChild(btn);
  });
}

function selectSystem(idx){
  M.sysIdx=idx;
  buildSysList();
  wireSliders();
  updateDesc();
  doRender();
}

function updateDesc(){
  var sys=getSys();
  var desc=document.getElementById('chrp-desc');
  if(desc){
    desc.style.display='block';
    desc.innerHTML='<span style="font-size:8px;color:#5a7aaa;font-style:italic;line-height:1.5;">'+sys.desc+'</span>';
  }
}

/* ── Randomise ── */
function randomise(){
  var sys=getSys();
  for(var i=0;i<5;i++){
    var sl=document.getElementById('chrp-p'+(i+1));
    var vl=document.getElementById('chrp-v'+(i+1));
    if(!sl) continue;
    var v=Math.round(lerp(sys.min[i],sys.max[i],Math.random()));
    sl.value=v;
    if(vl) vl.textContent=sys.fmt[i](v);
  }
  doRender();
}

/* ── Cycle ── */
function cycle(){
  M.cycleIdx=(M.cycleIdx+1)%SYSTEMS.length;
  M.sysIdx=M.cycleIdx;
  buildSysList();
  wireSliders();
  updateDesc();
  // Show cycle label
  var cl=document.getElementById('chrp-cycle-label');
  var cn=document.getElementById('chrp-cycle-name');
  if(cl) cl.style.display='block';
  if(cn) cn.textContent=(M.cycleIdx+1)+'/'+SYSTEMS.length+' — '+getSys().name;
  // Set sliders to max for dramatic effect
  var sys=getSys();
  for(var i=0;i<5;i++){
    var sl=document.getElementById('chrp-p'+(i+1));
    var vl=document.getElementById('chrp-v'+(i+1));
    if(!sl) continue;
    var v=Math.round(lerp(sys.def[i],sys.max[i],0.8));
    sl.value=v;
    if(vl) vl.textContent=sys.fmt[i](v);
  }
  doRender();
}

/* ── Public API ── */
window._CHRP = {
  render: doRender,
  randomise: randomise,
  cycle: cycle,
  selectSystem: selectSystem,
  /** Render a specific system synchronously onto an arbitrary context.
   *  sysIdx: 0-4 (film, scatter, mix, field, prism)
   *  tctx:   target CanvasRenderingContext2D
   *  W,H:    canvas dimensions
   *  cols:   palette color array (optional — uses current palette if omitted)
   */
  renderDirect: function(sysIdx, tctx, W, H, cols){
    if(!cols) cols = palCols();
    /* Temporarily set system index so pv() reads correct defaults */
    var prevIdx = M.sysIdx;
    M.sysIdx = sysIdx;
    /* Set slider values to system defaults for best showcase output */
    var sys = SYSTEMS[sysIdx];
    if(sys){
      for(var i=0; i<5; i++){
        var el = document.getElementById('chrp-p'+(i+1));
        if(el) el.value = sys.def[i];
      }
    }
    var ids = ['film','scatter','mix','field','prism'];
    var id = ids[sysIdx];
    if(id==='film')    renderFilm(tctx,W,H,cols);
    else if(id==='scatter') renderScatter(tctx,W,H,cols);
    else if(id==='mix')     renderMix(tctx,W,H,cols);
    else if(id==='field')   renderField(tctx,W,H,cols);
    else if(id==='prism')   renderPrism(tctx,W,H,cols);
    M.sysIdx = prevIdx;
  },
  onPaletteChange: function(){
    var b=document.getElementById('chrp-body');
    if(b&&b.style.display!=='none') doRender();
  }
};

/* ── Init ── */
setTimeout(function(){
  buildSysList();
  wireSliders();
},500);

})();
