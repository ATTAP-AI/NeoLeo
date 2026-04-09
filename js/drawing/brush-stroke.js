/* ══════════════════════════════════════════════════════════════
   BRUSH-STROKE  --  Type-aware live brush stroke renderer
   Extracted from NeoLeo monolith (lines ~2150-2556)
   Includes: buildBezierPath, clipToCanvas, applyBrushStroke,
   bezierToPoints, Chinese Brush engines, Winsor & Newton Sable
   Plain JS, window.* globals, NO ES modules
   ══════════════════════════════════════════════════════════════ */

/* ── Type-aware live brush stroke renderer ── */
function buildBezierPath(ctx2,pts){
  ctx2.beginPath();
  ctx2.moveTo(pts[0][0],pts[0][1]);
  if(pts.length===2){
    ctx2.lineTo(pts[1][0],pts[1][1]);
  } else {
    for(var i=1;i<pts.length-1;i++){
      var mx=(pts[i][0]+pts[i+1][0])/2;
      var my=(pts[i][1]+pts[i+1][1])/2;
      ctx2.quadraticCurveTo(pts[i][0],pts[i][1],mx,my);
    }
    ctx2.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]);
  }
}


/* ── Clip all drawing to canvas pixel bounds ── */
function clipToCanvas(ctx){
  ctx.beginPath();
  if(window._canvasRatio==='circle'){
    const W=ctx.canvas.width,H=ctx.canvas.height;
    ctx.arc(W/2,H/2,Math.min(W,H)/2,0,Math.PI*2);
  } else {
    ctx.rect(0,0,ctx.canvas.width,ctx.canvas.height);
  }
  ctx.clip();
}
function applyBrushStroke(ctx2,pts,type,col,sz,hd,op){
  if(!pts||pts.length<1)return;
  var r=parseInt(col.slice(1,3),16)||255;
  var g=parseInt(col.slice(3,5),16)||64;
  var b=parseInt(col.slice(5,7),16)||64;
  ctx2.save();
  clipToCanvas(ctx2);
  ctx2.globalCompositeOperation='source-over';

  if(type==='round_soft'||type==='round_hard'||(!type)){
    /* True soft/hard round brush: stamp radial gradient circles along path */
    /* For hard brushes (hd=1): sharp edge. For soft (hd=0): full feather. */
    if(hd>=0.98){
      /* Hard edge -- single continuous stroke is most efficient */
      ctx2.globalAlpha=op;
      ctx2.lineWidth=sz;ctx2.lineCap='round';ctx2.lineJoin='round';
      ctx2.strokeStyle=col;
      ctx2.shadowBlur=0;
      buildBezierPath(ctx2,pts);ctx2.stroke();
    } else {
      /* Soft edge -- stamp radial gradients along path */
      var spacing=Math.max(1,sz*0.25);
      var pathPts=bezierToPoints(pts,spacing);
      for(var si=0;si<pathPts.length;si++){
        var px=pathPts[si][0],py=pathPts[si][1];
        var rad=sz/2;
        var innerStop=hd*0.85; /* inner solid core */
        var grd=ctx2.createRadialGradient(px,py,innerStop*rad,px,py,rad);
        grd.addColorStop(0,'rgba('+r+','+g+','+b+','+op.toFixed(3)+')');
        grd.addColorStop(1,'rgba('+r+','+g+','+b+',0)');
        ctx2.fillStyle=grd;
        ctx2.beginPath();ctx2.arc(px,py,rad,0,Math.PI*2);ctx2.fill();
      }
    }

  } else if(type==='airbrush'){
    for(var pi=1;pi<pts.length;pi++){
      var px2=pts[pi][0],py2=pts[pi][1];
      var spread=sz*0.8;
      for(var d=0;d<8;d++){
        var ang=Math.random()*Math.PI*2;
        var dist=Math.random()*spread;
        ctx2.fillStyle='rgba('+r+','+g+','+b+','+(Math.random()*op*0.35+0.01).toFixed(3)+')';
        ctx2.beginPath();ctx2.arc(px2+Math.cos(ang)*dist,py2+Math.sin(ang)*dist,0.8+Math.random()*2,0,Math.PI*2);ctx2.fill();
      }
    }

  } else if(type==='pencil'){
    ctx2.globalAlpha=op;
    ctx2.lineWidth=Math.max(1,sz*0.4);ctx2.lineCap='round';ctx2.lineJoin='round';
    ctx2.strokeStyle=col;
    buildBezierPath(ctx2,pts);ctx2.stroke();
    ctx2.globalAlpha=op*0.2;
    for(var gi=0;gi<pts.length-1;gi++){
      for(var gj=0;gj<3;gj++){
        ctx2.fillStyle='rgba('+r+','+g+','+b+',0.8)';
        ctx2.fillRect(pts[gi][0]+(Math.random()-.5)*sz*0.6,pts[gi][1]+(Math.random()-.5)*sz*0.6,1,1);
      }
    }

  } else if(type==='chalk'){
    for(var cp2=0;cp2<3;cp2++){
      ctx2.globalAlpha=op*(0.25+cp2*0.15);
      ctx2.lineWidth=sz*(0.6+cp2*0.2);ctx2.lineCap='round';
      ctx2.strokeStyle=col;
      ctx2.save();ctx2.translate((Math.random()-.5)*2,(Math.random()-.5)*2);
      buildBezierPath(ctx2,pts);ctx2.stroke();ctx2.restore();
    }
    ctx2.globalCompositeOperation='destination-out';
    for(var cgi=0;cgi<pts.length;cgi+=2){
      if(Math.random()<0.3){
        ctx2.fillStyle='rgba(0,0,0,'+(Math.random()*0.5+0.1).toFixed(2)+')';
        ctx2.fillRect(pts[cgi][0]+(Math.random()-.5)*sz,pts[cgi][1]+(Math.random()-.5)*sz*0.5,1+Math.random()*4,1+Math.random()*6);
      }
    }

  } else if(type==='dry'){
    var bristles=Math.max(4,Math.round(sz/4));
    for(var bi=0;bi<bristles;bi++){
      ctx2.globalAlpha=op*(0.2+Math.random()*0.5);
      ctx2.lineWidth=0.8+Math.random()*1.5;ctx2.lineCap='round';
      ctx2.strokeStyle=col;
      ctx2.save();ctx2.translate(0,(bi/(bristles-1)-.5)*sz*0.9);
      buildBezierPath(ctx2,pts);ctx2.stroke();ctx2.restore();
    }

  } else if(type==='flat_soft'||type==='flat_hard'){
    var fblur=type==='flat_soft'?sz*0.8:0;
    ctx2.globalAlpha=op;
    ctx2.lineWidth=sz*1.5;ctx2.lineCap='butt';ctx2.lineJoin='miter';
    ctx2.strokeStyle=col;
    ctx2.shadowBlur=fblur;ctx2.shadowColor=col;
    buildBezierPath(ctx2,pts);ctx2.stroke();

  } else if(type==='spatter'){
    for(var si2=0;si2<pts.length-1;si2++){
      var scount=Math.max(1,Math.round(sz/3));
      for(var sd=0;sd<scount;sd++){
        var sx2=pts[si2][0]+(Math.random()-.5)*sz*1.8;
        var sy2=pts[si2][1]+(Math.random()-.5)*sz*0.5;
        ctx2.globalAlpha=Math.random()*op*0.9+0.05;
        ctx2.fillStyle=col;
        ctx2.beginPath();ctx2.arc(sx2,sy2,0.5+Math.random()*Math.min(sz*.3,4),0,Math.PI*2);ctx2.fill();
      }
    }

  } else if(type==='ink'){
    ctx2.globalAlpha=op;
    ctx2.fillStyle=col;
    if(pts.length>=2){
      var upper=[],lower=[];
      for(var ii=0;ii<pts.length;ii++){
        var speed2=1;
        if(ii>0&&ii<pts.length-1){var ddx=pts[ii+1][0]-pts[ii-1][0],ddy=pts[ii+1][1]-pts[ii-1][1];speed2=Math.min(3,Math.sqrt(ddx*ddx+ddy*ddy)/8+0.3);}
        var halfW=Math.max(0.5,(sz/2)*(1/speed2)*0.8);
        var nx2=0,ny2=1;
        if(ii<pts.length-1){var ddx2=pts[ii+1][0]-pts[ii][0],ddy2=pts[ii+1][1]-pts[ii][1],len2=Math.sqrt(ddx2*ddx2+ddy2*ddy2)||1;nx2=-ddy2/len2;ny2=ddx2/len2;}
        upper.push([pts[ii][0]+nx2*halfW,pts[ii][1]+ny2*halfW]);
        lower.push([pts[ii][0]-nx2*halfW,pts[ii][1]-ny2*halfW]);
      }
      ctx2.beginPath();ctx2.moveTo(upper[0][0],upper[0][1]);
      upper.forEach(function(p){ctx2.lineTo(p[0],p[1]);});
      for(var li=lower.length-1;li>=0;li--)ctx2.lineTo(lower[li][0],lower[li][1]);
      ctx2.closePath();ctx2.fill();
    }

  /* ── Chinese Brushes -- canvas drawing engine ── */

  } else if(type==='maobi'){
    /* Calligraphy brush -- pressure-tapered variable width */
    ctx2.globalAlpha=op;ctx2.fillStyle=col;
    if(pts.length>=2){
      var upper=[],lower=[];
      for(var mi=0;mi<pts.length;mi++){
        var t2=mi/(pts.length-1);
        /* Pressure envelope: thin entry -> thick body -> thin exit */
        var press=Math.sin(t2*Math.PI)*0.85+Math.sin(t2*Math.PI*2.5)*0.12;
        var halfW=Math.max(0.5,(sz/2)*press*0.9);
        /* Slight wobble */
        var wb=Math.sin(mi*0.5)*0.5;
        var nx=0,ny=1;
        if(mi<pts.length-1){var ddx=pts[mi+1][0]-pts[mi][0],ddy=pts[mi+1][1]-pts[mi][1],len=Math.sqrt(ddx*ddx+ddy*ddy)||1;nx=-ddy/len;ny=ddx/len;}
        else if(mi>0){var ddx=pts[mi][0]-pts[mi-1][0],ddy=pts[mi][1]-pts[mi-1][1],len=Math.sqrt(ddx*ddx+ddy*ddy)||1;nx=-ddy/len;ny=ddx/len;}
        upper.push([pts[mi][0]+nx*(halfW+wb),pts[mi][1]+ny*(halfW+wb)]);
        lower.push([pts[mi][0]-nx*(halfW*1.1+wb),pts[mi][1]-ny*(halfW*1.1+wb)]);
      }
      ctx2.beginPath();ctx2.moveTo(upper[0][0],upper[0][1]);
      upper.forEach(function(p){ctx2.lineTo(p[0],p[1]);});
      for(var li=lower.length-1;li>=0;li--)ctx2.lineTo(lower[li][0],lower[li][1]);
      ctx2.closePath();ctx2.fill();
      /* Ink bleed texture */
      for(var bi2=0;bi2<pts.length;bi2+=3){
        if(Math.random()<0.4){
          ctx2.globalAlpha=op*0.12;ctx2.beginPath();
          ctx2.arc(pts[bi2][0]+(Math.random()-.5)*sz*.3,pts[bi2][1]+(Math.random()-.5)*sz*.3,Math.random()*2,0,Math.PI*2);ctx2.fill();
        }
      }
    }

  } else if(type==='xieyi'){
    /* Expressionistic freehand -- dramatic thick-thin with splashes */
    if(pts.length>=2){
      for(var xpass=0;xpass<3;xpass++){
        var xalpha=op*(0.25+xpass*0.25);
        ctx2.fillStyle='rgba('+r+','+g+','+b+','+xalpha.toFixed(3)+')';
        var upper=[],lower=[];
        for(var xi=0;xi<pts.length;xi++){
          var t2=xi/(pts.length-1);
          var press=Math.pow(Math.sin(t2*Math.PI),0.6);
          var halfW=0.5+press*sz*0.55+Math.sin(xi*0.3)*1.0;
          var oy=(xpass-1)*1.5;
          var nx=0,ny=1;
          if(xi<pts.length-1){var ddx=pts[xi+1][0]-pts[xi][0],ddy=pts[xi+1][1]-pts[xi][1],len=Math.sqrt(ddx*ddx+ddy*ddy)||1;nx=-ddy/len;ny=ddx/len;}
          else if(xi>0){var ddx=pts[xi][0]-pts[xi-1][0],ddy=pts[xi][1]-pts[xi-1][1],len=Math.sqrt(ddx*ddx+ddy*ddy)||1;nx=-ddy/len;ny=ddx/len;}
          upper.push([pts[xi][0]+nx*halfW+oy,pts[xi][1]+ny*halfW+oy]);
          lower.push([pts[xi][0]-nx*halfW+oy,pts[xi][1]-ny*halfW+oy]);
        }
        ctx2.beginPath();ctx2.moveTo(upper[0][0],upper[0][1]);
        upper.forEach(function(p){ctx2.lineTo(p[0],p[1]);});
        for(var li=lower.length-1;li>=0;li--)ctx2.lineTo(lower[li][0],lower[li][1]);
        ctx2.closePath();ctx2.fill();
      }
      /* Splash dots */
      ctx2.fillStyle=col;
      for(var si2=0;si2<pts.length;si2+=4){
        if(Math.random()<0.3){
          ctx2.globalAlpha=op*Math.random()*0.4;
          ctx2.beginPath();ctx2.arc(pts[si2][0]+(Math.random()-.5)*sz*2,pts[si2][1]+(Math.random()-.5)*sz*2,0.5+Math.random()*2.5,0,Math.PI*2);ctx2.fill();
        }
      }
    }

  } else if(type==='gongbi'){
    /* Fine detail -- thin even hairline */
    ctx2.globalAlpha=op;ctx2.lineWidth=Math.max(1,sz*0.3);ctx2.lineCap='round';ctx2.lineJoin='round';
    ctx2.strokeStyle=col;
    buildBezierPath(ctx2,pts);ctx2.stroke();
    /* Ghost parallel for silk-thread effect */
    ctx2.globalAlpha=op*0.2;ctx2.lineWidth=0.5;
    ctx2.save();ctx2.translate(0,2);
    buildBezierPath(ctx2,pts);ctx2.stroke();
    ctx2.restore();

  } else if(type==='zhubi'){
    /* Bamboo brush -- stiff splayed bristles that fan->converge */
    var bristles=Math.max(5,Math.round(sz/3));
    for(var bi=0;bi<bristles;bi++){
      var spread=(bi/(bristles-1)-.5)*sz*0.9;
      ctx2.globalAlpha=op*(0.15+Math.random()*0.55);
      ctx2.lineWidth=0.6+Math.random()*1.4;ctx2.lineCap='round';
      ctx2.strokeStyle=col;
      ctx2.beginPath();
      for(var pi=0;pi<pts.length;pi++){
        var t2=pi/(pts.length-1);
        /* Fan at start, converge at end */
        var spreadFactor=1.6*(1-t2)+0.3*t2;
        var ox=spread*spreadFactor;
        if(pi===0)ctx2.moveTo(pts[pi][0],pts[pi][1]+ox);
        else ctx2.lineTo(pts[pi][0],pts[pi][1]+ox);
      }
      ctx2.stroke();
    }

  } else if(type==='pomo'){
    /* Splash ink -- wet broad wash with pooling, blended at all sizes */
    ctx2.lineCap='round';ctx2.lineJoin='round';ctx2.strokeStyle=col;
    /* Outer soft halo */
    ctx2.globalAlpha=op*0.32;ctx2.lineWidth=sz*1.9;
    ctx2.shadowBlur=sz*1.6;ctx2.shadowColor='rgba('+r+','+g+','+b+',0.45)';
    buildBezierPath(ctx2,pts);ctx2.stroke();ctx2.shadowBlur=0;
    /* Mid wash */
    ctx2.globalAlpha=op*0.45;ctx2.lineWidth=sz*1.45;
    buildBezierPath(ctx2,pts);ctx2.stroke();
    /* Inner saturated body -- matches mid for seamless blend */
    ctx2.globalAlpha=op*0.55;ctx2.lineWidth=sz*1.05;
    buildBezierPath(ctx2,pts);ctx2.stroke();
    /* Darker pooled core, large enough to blend (was sz*0.5 -- caused nested look) */
    ctx2.globalAlpha=op*0.38;ctx2.lineWidth=sz*0.7;
    buildBezierPath(ctx2,pts);ctx2.stroke();
    /* Wet scatter */
    ctx2.fillStyle=col;
    for(var pi2=0;pi2<pts.length;pi2+=2){
      if(Math.random()<0.35){
        ctx2.globalAlpha=op*Math.random()*0.2;
        ctx2.beginPath();ctx2.arc(pts[pi2][0]+(Math.random()-.5)*sz*1.5,pts[pi2][1]+(Math.random()-.5)*sz*1.5,1+Math.random()*3,0,Math.PI*2);ctx2.fill();
      }
    }

  } else if(type==='kubi'){
    /* Dry ink -- sparse dashed bristle strokes */
    var bristles=Math.max(4,Math.round(sz/3));
    for(var bi=0;bi<bristles;bi++){
      var spread=(bi/(bristles-1)-.5)*sz*0.7;
      ctx2.globalAlpha=op*(0.2+Math.random()*0.45);
      ctx2.lineWidth=0.5+Math.random()*1.8;ctx2.lineCap='round';
      ctx2.strokeStyle=col;
      ctx2.setLineDash([2+Math.random()*6,1+Math.random()*4]);
      ctx2.save();ctx2.translate(0,spread);
      buildBezierPath(ctx2,pts);ctx2.stroke();
      ctx2.restore();
    }
    ctx2.setLineDash([]);
    /* Dry gap cutouts */
    ctx2.globalCompositeOperation='destination-out';
    for(var cgi=0;cgi<pts.length;cgi+=3){
      if(Math.random()<0.25){
        ctx2.fillStyle='rgba(0,0,0,'+(Math.random()*0.5).toFixed(2)+')';
        ctx2.fillRect(pts[cgi][0]+(Math.random()-.5)*sz*.3,pts[cgi][1]+(Math.random()-.5)*sz*.4,1+Math.random()*4,1+Math.random()*3);
      }
    }

  } else if(type==='shoujin'){
    /* Huizong Slender Gold -- sharp angular strokes, nail-head entry, crane-beak exit */
    ctx2.globalAlpha=op;ctx2.fillStyle=col;
    if(pts.length>=2){
      var upper=[],lower=[];
      var sjK=Math.max(0.1,sz/5); /* size scaling: default sz=5 -> 1.0 */
      for(var si=0;si<pts.length;si++){
        var t2=si/(pts.length-1);
        /* Slender Gold pressure signature, scaled by brush size */
        var w;
        if(t2<0.08) w=(2.5+t2/0.08*1.5)*sjK; /* nail-head entrance */
        else if(t2<0.15) w=(4-((t2-0.08)/0.07)*2.8)*sjK; /* rapid thin-down */
        else if(t2>0.88) w=(1.2+((t2-0.88)/0.12)*2.0)*sjK; /* crane-beak exit flare */
        else w=(1.0+Math.sin((t2-0.15)*Math.PI*0.8)*0.4)*sjK; /* thin body */
        var nx=0,ny=1;
        if(si<pts.length-1){var ddx=pts[si+1][0]-pts[si][0],ddy=pts[si+1][1]-pts[si][1],len=Math.sqrt(ddx*ddx+ddy*ddy)||1;nx=-ddy/len;ny=ddx/len;}
        else if(si>0){var ddx=pts[si][0]-pts[si-1][0],ddy=pts[si][1]-pts[si-1][1],len=Math.sqrt(ddx*ddx+ddy*ddy)||1;nx=-ddy/len;ny=ddx/len;}
        upper.push([pts[si][0]+nx*w,pts[si][1]+ny*w]);
        lower.push([pts[si][0]-nx*w,pts[si][1]-ny*w]);
      }
      ctx2.beginPath();ctx2.moveTo(upper[0][0],upper[0][1]);
      upper.forEach(function(p){ctx2.lineTo(p[0],p[1]);});
      for(var li=lower.length-1;li>=0;li--)ctx2.lineTo(lower[li][0],lower[li][1]);
      ctx2.closePath();ctx2.fill();
    }

  /* ── Winsor & Newton Sable -- canvas drawing engine ── */

  } else if(type==='wn_s7mini'){
    /* Series 7 Miniature -- ultra-fine precise hairline */
    ctx2.globalAlpha=op;ctx2.lineWidth=Math.max(1,sz*0.25);
    ctx2.lineCap='round';ctx2.lineJoin='round';ctx2.strokeStyle=col;
    buildBezierPath(ctx2,pts);ctx2.stroke();

  } else if(type==='wn_s7round'){
    /* Series 7 Round -- smooth pressure taper with wet sable belly */
    ctx2.globalAlpha=op;ctx2.fillStyle=col;
    if(pts.length>=2){
      var upper=[],lower=[];
      for(var si=0;si<pts.length;si++){
        var t2=si/(pts.length-1);
        var press=Math.sin(t2*Math.PI);
        var halfW=0.6+press*sz*0.38;
        var nx=0,ny=1;
        if(si<pts.length-1){var ddx=pts[si+1][0]-pts[si][0],ddy=pts[si+1][1]-pts[si][1],len=Math.sqrt(ddx*ddx+ddy*ddy)||1;nx=-ddy/len;ny=ddx/len;}
        else if(si>0){var ddx=pts[si][0]-pts[si-1][0],ddy=pts[si][1]-pts[si-1][1],len=Math.sqrt(ddx*ddx+ddy*ddy)||1;nx=-ddy/len;ny=ddx/len;}
        upper.push([pts[si][0]+nx*halfW,pts[si][1]+ny*halfW]);
        lower.push([pts[si][0]-nx*halfW,pts[si][1]-ny*halfW]);
      }
      ctx2.beginPath();ctx2.moveTo(upper[0][0],upper[0][1]);
      upper.forEach(function(p){ctx2.lineTo(p[0],p[1]);});
      for(var li=lower.length-1;li>=0;li--)ctx2.lineTo(lower[li][0],lower[li][1]);
      ctx2.closePath();ctx2.fill();
      /* Subtle wet edge glow */
      ctx2.globalAlpha=op*0.06;ctx2.shadowBlur=sz*0.6;ctx2.shadowColor=col;
      ctx2.fill();ctx2.shadowBlur=0;
    }

  } else if(type==='wn_sceptre'){
    /* Sceptre Gold -- sable/synthetic blend, springy medium softness */
    ctx2.globalAlpha=op;ctx2.lineWidth=sz;ctx2.lineCap='round';ctx2.lineJoin='round';
    ctx2.strokeStyle=col;
    ctx2.shadowBlur=sz*0.4;ctx2.shadowColor=col;
    buildBezierPath(ctx2,pts);ctx2.stroke();ctx2.shadowBlur=0;

  } else if(type==='wn_flatwash'){
    /* Sable Flat Wash -- wide even wash with soft wet edges */
    ctx2.globalAlpha=op*0.6;ctx2.lineWidth=sz*1.8;ctx2.lineCap='butt';ctx2.lineJoin='miter';
    ctx2.strokeStyle=col;
    ctx2.shadowBlur=sz*2;ctx2.shadowColor='rgba('+r+','+g+','+b+',0.3)';
    buildBezierPath(ctx2,pts);ctx2.stroke();ctx2.shadowBlur=0;
    /* Watercolour edge darkening */
    ctx2.globalAlpha=op*0.15;ctx2.lineWidth=sz*1.8+2;
    ctx2.strokeStyle='rgba('+r+','+g+','+b+',0.2)';
    buildBezierPath(ctx2,pts);ctx2.stroke();

  } else if(type==='wn_cotman'){
    /* Cotman Round -- clean consistent stroke with slight softness */
    ctx2.globalAlpha=op;ctx2.lineWidth=sz;ctx2.lineCap='round';ctx2.lineJoin='round';
    ctx2.strokeStyle=col;ctx2.shadowBlur=sz*0.25;ctx2.shadowColor=col;
    buildBezierPath(ctx2,pts);ctx2.stroke();ctx2.shadowBlur=0;

  } else if(type==='wn_rigger'){
    /* Sable Rigger -- long thin liner, slightly thicker at start */
    ctx2.globalAlpha=op;ctx2.strokeStyle=col;ctx2.lineCap='round';
    /* Main thin line */
    ctx2.lineWidth=Math.max(1,sz*0.35);
    buildBezierPath(ctx2,pts);ctx2.stroke();
    /* Heavier ink loading at start -- first third */
    if(pts.length>4){
      ctx2.globalAlpha=op*0.35;ctx2.lineWidth=sz*0.7;
      ctx2.beginPath();ctx2.moveTo(pts[0][0],pts[0][1]);
      var third=Math.min(pts.length-1,Math.floor(pts.length/3));
      for(var ri=1;ri<=third;ri++)ctx2.lineTo(pts[ri][0],pts[ri][1]);
      ctx2.stroke();
    }
  }
  ctx2.restore();
}

/* Convert bezier path pts[] to evenly-spaced points for stamp rendering */
function bezierToPoints(pts,spacing){
  if(pts.length<2)return pts;
  var result=[pts[0]];
  var acc=0;
  for(var i=1;i<pts.length;i++){
    var dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1];
    var dist=Math.sqrt(dx*dx+dy*dy);
    acc+=dist;
    while(acc>=spacing){
      acc-=spacing;
      var t=1-(acc/dist);
      result.push([pts[i-1][0]+dx*t,pts[i-1][1]+dy*t]);
    }
  }
  return result;
}

/* ══ Expose on window ══ */
window.buildBezierPath=buildBezierPath;
window.clipToCanvas=clipToCanvas;
window.applyBrushStroke=applyBrushStroke;
window.bezierToPoints=bezierToPoints;
