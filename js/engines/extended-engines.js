/*  js/engines/extended-engines.js  -- Extended engine implementations (32 engines)
 *  Loaded via <script> tag AFTER core-engines.js.
 *  Uses window globals: ctx, gp, pcol, rng, rr, ri, rp, fbm, vn, h2r, lerp, setI, setPr
 */

function gravity_wells(W,H,p){
  const nw=gp('gw_n'),np=gp('gw_p'),G=gp('gw_g'),spd=gp('gw_s'),tr=gp('gw_t');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const wells=Array.from({length:nw},(_,i)=>({x:rr(W*.12,W*.88),y:rr(H*.12,H*.88),m:rr(0.6,2.2)}));
  const STEPS=160;
  for(let i=0;i<np;i++){
    let x=rng()*W,y=rng()*H,vx=(rng()-.5)*spd,vy=(rng()-.5)*spd;
    const maxSpd=spd*2.5;
    const seg=[[x,y]];
    for(let s=0;s<STEPS;s++){
      wells.forEach(w=>{const dx=w.x-x,dy=w.y-y,d=Math.sqrt(dx*dx+dy*dy)+1;const f=G*w.m/(d*d);vx+=f*dx/d*0.3;vy+=f*dy/d*0.3;});
      const sp=Math.sqrt(vx*vx+vy*vy);if(sp>maxSpd){vx=vx/sp*maxSpd;vy=vy/sp*maxSpd;}
      vx*=0.992;vy*=0.992;x+=vx;y+=vy;
      if(x<0||x>W||y<0||y>H)break;
      seg.push([x,y]);
    }
    if(seg.length<2)continue;
    const baseCol=pcol(p,i/np,1);
    const rgb=baseCol.match(/\d+/g);
    for(let k=1;k<seg.length;k++){
      const t=k/seg.length;
      const alpha=(0.08+t*0.55)*Math.min(1,tr*18);
      ctx.strokeStyle=`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;
      ctx.lineWidth=0.5+t*0.6;
      ctx.beginPath();ctx.moveTo(seg[k-1][0],seg[k-1][1]);ctx.lineTo(seg[k][0],seg[k][1]);ctx.stroke();
    }
    if(i%200===0)setPr(i/np*100);
  }
  wells.forEach((w,i)=>{
    ctx.fillStyle=pcol(p,i/nw,0.9);
    ctx.beginPath();ctx.arc(w.x,w.y,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=pcol(p,i/nw,0.35);ctx.lineWidth=0.8;
    ctx.beginPath();ctx.arc(w.x,w.y,14,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(w.x,w.y,26,0,Math.PI*2);ctx.stroke();
  });
  setI(`${nw} wells \u00d7 ${np} particles`);
}

function boid_flocking(W,H,p){
  const nb=gp('bf_n'),al=gp('bf_al'),co=gp('bf_co'),se=gp('bf_se'),sp=gp('bf_sp');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const boids=Array.from({length:nb},()=>({x:rng()*W,y:rng()*H,vx:(rng()-.5)*sp,vy:(rng()-.5)*sp}));
  const R=60,steps=120;
  for(let t=0;t<steps;t++){
    boids.forEach((b,i)=>{
      let ax=0,ay=0,cx=0,cy=0,sx=0,sy=0,nn=0;
      boids.forEach((o,j)=>{if(i===j)return;const dx=o.x-b.x,dy=o.y-b.y,d=Math.sqrt(dx*dx+dy*dy);if(d<R){ax+=o.vx;ay+=o.vy;cx+=o.x;cy+=o.y;if(d<20){sx-=dx/(d+1);sy-=dy/(d+1);}nn++;}});
      if(nn>0){b.vx+=(ax/nn-b.vx)*al*0.01+(cx/nn-b.x)*co*0.005+sx*se*0.02;b.vy+=(ay/nn-b.vy)*al*0.01+(cy/nn-b.y)*co*0.005+sy*se*0.02;}
      const s=Math.sqrt(b.vx*b.vx+b.vy*b.vy);if(s>sp){b.vx=b.vx/s*sp;b.vy=b.vy/s*sp;}
      b.x=(b.x+b.vx+W)%W;b.y=(b.y+b.vy+H)%H;
    });
    if(t%8===0||t===steps-1){
      ctx.fillStyle=`rgba(${h2r(p.bg).join(',')},0.12)`;ctx.fillRect(0,0,W,H);
      boids.forEach((b,i)=>{
        const a=Math.atan2(b.vy,b.vx);const sz=5+Math.sqrt(b.vx*b.vx+b.vy*b.vy)*0.8;
        ctx.fillStyle=pcol(p,i/nb,0.7);ctx.beginPath();
        ctx.moveTo(b.x+Math.cos(a)*sz,b.y+Math.sin(a)*sz);
        ctx.lineTo(b.x+Math.cos(a+2.4)*sz*0.5,b.y+Math.sin(a+2.4)*sz*0.5);
        ctx.lineTo(b.x+Math.cos(a-2.4)*sz*0.5,b.y+Math.sin(a-2.4)*sz*0.5);
        ctx.closePath();ctx.fill();
      });
      setPr(t/steps*100);
    }
  }
  setI(`${nb} boids`);
}

function magnetic_field(W,H,p){
  const np=gp('mf_n'),lpp=gp('mf_l'),step=gp('mf_s'),lw=gp('mf_w');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const poles=Array.from({length:np},(_,i)=>({x:rr(W*.1,W*.9),y:rr(H*.1,H*.9),s:i%2===0?1:-1}));
  poles.forEach((pole,pi)=>{
    for(let li=0;li<lpp;li++){
      const ang=(li/lpp)*Math.PI*2;let x=pole.x+Math.cos(ang)*15,y=pole.y+Math.sin(ang)*15;
      ctx.strokeStyle=pcol(p,pi/np,0.7);ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x,y);
      for(let s=0;s<300;s++){
        let fx=0,fy=0;
        poles.forEach(q=>{const dx=x-q.x,dy=y-q.y,d=Math.sqrt(dx*dx+dy*dy)+0.1;fx+=q.s*dx/(d*d*d);fy+=q.s*dy/(d*d*d);});
        const fl=Math.sqrt(fx*fx+fy*fy)+0.0001;x+=fx/fl*step*pole.s;y+=fy/fl*step*pole.s;
        if(x<0||x>W||y<0||y>H)break;
        let tooClose=false;poles.forEach(q=>{if(Math.sqrt((x-q.x)**2+(y-q.y)**2)<10)tooClose=true;});
        if(tooClose)break;
        ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
  });
  poles.forEach((q,i)=>{ctx.fillStyle=q.s>0?pcol(p,0.85,1):pcol(p,0.15,1);ctx.beginPath();ctx.arc(q.x,q.y,7,0,Math.PI*2);ctx.fill();});
  setI(`${np} poles \u00d7 ${lpp} lines`);
}

function reaction_diffusion(W,H,p){
  const f=gp('rd_f'),k=gp('rd_k'),iters=gp('rd_it'),sc=gp('rd_sc')|1;
  const cw=Math.ceil(W/sc),ch=Math.ceil(H/sc);
  let A=new Float32Array(cw*ch).fill(1),B=new Float32Array(cw*ch);
  const Da=1.0,Db=0.5;
  for(let i=0;i<cw*ch;i++)if(rng()<0.02){A[i]=0.5+rng()*0.5;B[i]=0.2+rng()*0.5;}
  const An=new Float32Array(cw*ch),Bn=new Float32Array(cw*ch);
  const idx=(x,y)=>((y+ch)%ch)*cw+((x+cw)%cw);
  for(let it=0;it<iters;it++){
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
      const i=idx(x,y);const a=A[i],b=B[i];
      const la=(A[idx(x-1,y)]+A[idx(x+1,y)]+A[idx(x,y-1)]+A[idx(x,y+1)]-4*a);
      const lb=(B[idx(x-1,y)]+B[idx(x+1,y)]+B[idx(x,y-1)]+B[idx(x,y+1)]-4*b);
      const abb=a*b*b;
      An[i]=Math.max(0,Math.min(1,a+Da*la-abb+f*(1-a)));
      Bn[i]=Math.max(0,Math.min(1,b+Db*lb+abb-(k+f)*b));
    }
    A.set(An);B.set(Bn);
    if(it%15===0)setPr(it/iters*100);
  }
  const id2=ctx.createImageData(cw,ch);
  const [r1,g1,b1]=h2r(p.c[0]);const [r2,g2,b2]=h2r(p.c[p.c.length-1]);
  for(let i=0;i<cw*ch;i++){const t=Math.max(0,Math.min(1,B[i]*3));const pi=i*4;id2.data[pi]=lerp(r1,r2,t);id2.data[pi+1]=lerp(g1,g2,t);id2.data[pi+2]=lerp(b1,b2,t);id2.data[pi+3]=255;}
  const tmp=document.createElement('canvas');tmp.width=cw;tmp.height=ch;tmp.getContext('2d').putImageData(id2,0,0);
  ctx.drawImage(tmp,0,0,W,H);
  setI(`${iters} iters f=${f.toFixed(3)} k=${k.toFixed(3)}`);
}

function sand_drift(W,H,p){
  const ng=gp('sd_n'),grav=gp('sd_g'),ang=gp('sd_a')*Math.PI/180,sz=gp('sd_sz');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const cols=Math.ceil(W/sz),rows=Math.ceil(H/sz);
  const grid=new Uint16Array(cols*rows);
  const gidx=(x,y)=>y*cols+x;
  for(let i=0;i<ng;i++){
    let gx=ri(0,cols-1),gy=0;
    while(gy<rows-1){
      const below=gy+1;
      if(grid[gidx(gx,below)]===0){gy=below;}
      else{
        const dl=gx>0&&grid[gidx(gx-1,below)]===0,dr=gx<cols-1&&grid[gidx(gx+1,below)]===0;
        if(dl&&dr)gx+=rng()<0.5?-1:1,gy=below;
        else if(dl)gx--,gy=below;
        else if(dr)gx++,gy=below;
        else break;
      }
    }
    grid[gidx(gx,gy)]++;
  }
  let maxH=0;for(let i=0;i<grid.length;i++)if(grid[i]>maxH)maxH=grid[i];if(!maxH)maxH=1;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const h=grid[gidx(x,y)];if(!h)continue;
    ctx.fillStyle=pcol(p,h/maxH,0.9);ctx.fillRect(x*sz,y*sz,sz-1,sz-1);
  }
  setI(`${ng} grains`);
}

function voronoi(W,H,p){
  const n=gp('vo_n'),ew=gp('vo_e'),style=gp('vo_s');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const sites=Array.from({length:n},(_,i)=>({x:rng()*W,y:rng()*H,c:i/n}));
  const step=Math.max(1,Math.round(Math.sqrt(W*H/40000)));
  const img=ctx.createImageData(W,H);
  for(let y=0;y<H;y+=step)for(let x=0;x<W;x+=step){
    let best=Infinity,bi=0;
    sites.forEach((s,i)=>{const d=(x-s.x)**2+(y-s.y)**2;if(d<best){best=d;bi=i;}});
    const [r,g,b]=h2r(pcol(p,sites[bi].c,1).match(/\d+/g).map(Number));
    for(let dy=0;dy<step&&y+dy<H;dy++)for(let dx=0;dx<step&&x+dx<W;dx++){
      const pi=((y+dy)*W+(x+dx))*4;img.data[pi]=r;img.data[pi+1]=g;img.data[pi+2]=b;img.data[pi+3]=255;
    }
  }
  if(style==='fill'||style==='both')ctx.putImageData(img,0,0);
  if(style==='outline'||style==='both'){
    ctx.strokeStyle=p.c[0];ctx.lineWidth=ew;
    sites.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,3,0,Math.PI*2);ctx.fillStyle=p.bg;ctx.fill();});
  }
  if(style==='dots')sites.forEach((s,i)=>{ctx.fillStyle=pcol(p,s.c,1);ctx.beginPath();ctx.arc(s.x,s.y,5,0,Math.PI*2);ctx.fill();});
  setI(`${n} sites`);
}

function truchet(W,H,p){
  const ts=gp('tr_s'),lw=gp('tr_w'),type=gp('tr_t');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  for(let y=0;y<H;y+=ts)for(let x=0;x<W;x+=ts){
    const t=Math.round((x/W+y/H)*p.c.length/2)%p.c.length;
    ctx.strokeStyle=pcol(p,t/p.c.length,0.85);ctx.lineWidth=lw;
    const flip=rng()>0.5;
    if(type==='quarter'||(type==='mixed'&&rng()<0.6)){
      ctx.beginPath();
      if(flip){ctx.arc(x,y,ts,0,Math.PI/2);ctx.arc(x+ts,y+ts,ts,Math.PI,Math.PI*1.5);}
      else{ctx.arc(x+ts,y,ts,Math.PI/2,Math.PI);ctx.arc(x,y+ts,ts,Math.PI*1.5,0);}
      ctx.stroke();
    } else {
      ctx.beginPath();
      if(flip){ctx.moveTo(x,y);ctx.lineTo(x+ts,y+ts);}
      else{ctx.moveTo(x+ts,y);ctx.lineTo(x,y+ts);}
      ctx.stroke();
    }
  }
  setI(`${Math.ceil(W/ts)}\u00d7${Math.ceil(H/ts)} tiles`);
}

function penrose(W,H,p){
  const depth=gp('pe_d'),style=gp('pe_s');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const golden=(1+Math.sqrt(5))/2;
  let tris=[];
  const cx=W/2,cy=H/2,r=Math.min(W,H)*0.52;
  for(let i=0;i<10;i++){
    const a1=(2*i-1)*Math.PI/10,a2=(2*i+1)*Math.PI/10;
    tris.push({t:'thick',A:{x:cx,y:cy},B:{x:cx+r*Math.cos(a1),y:cy+r*Math.sin(a1)},C:{x:cx+r*Math.cos(a2),y:cy+r*Math.sin(a2)},c:i%p.c.length});
  }
  for(let d=0;d<depth;d++){
    const next=[];
    tris.forEach(tr=>{
      const {A,B,C,t}=tr;
      if(t==='thick'){
        const P={x:A.x+(B.x-A.x)/golden,y:A.y+(B.y-A.y)/golden};
        next.push({t:'thick',A:C,B:P,C:B,c:tr.c});next.push({t:'thin',A:P,B:C,C:A,c:(tr.c+1)%p.c.length});
      } else {
        const Q={x:B.x+(A.x-B.x)/golden,y:B.y+(A.y-B.y)/golden};
        const R={x:B.x+(C.x-B.x)/golden,y:B.y+(C.y-B.y)/golden};
        next.push({t:'thin',A:R,B:C,C:A,c:tr.c});next.push({t:'thin',A:Q,B:R,C:B,c:(tr.c+1)%p.c.length});
        next.push({t:'thick',A:R,B:Q,C:A,c:tr.c});
      }
    });
    tris=next;
    setPr(d/depth*100);
  }
  tris.forEach(tr=>{
    const col=pcol(p,tr.c/p.c.length,0.85);
    ctx.beginPath();ctx.moveTo(tr.A.x,tr.A.y);ctx.lineTo(tr.B.x,tr.B.y);ctx.lineTo(tr.C.x,tr.C.y);ctx.closePath();
    if(style==='fill'||style==='both'){ctx.fillStyle=col;ctx.fill();}
    if(style==='outline'||style==='both'){ctx.strokeStyle=p.c[0];ctx.lineWidth=0.4;ctx.stroke();}
  });
  setI(`Penrose depth ${depth}, ${tris.length} tiles`);
}

function spirograph(W,H,p){
  const R=gp('sg_R'),r=gp('sg_r'),d=gp('sg_d'),nc=gp('sg_n'),turns=gp('sg_t');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const cx=W/2,cy=H/2;
  for(let ci=0;ci<nc;ci++){
    const ph=ci/nc*Math.PI*2,r2=r*(0.6+ci*0.4/nc),d2=d*(0.7+ci*0.3/nc);
    ctx.strokeStyle=pcol(p,ci/nc,0.7);ctx.lineWidth=0.7;ctx.beginPath();
    let first=true;
    for(let i=0;i<=turns;i++){
      const t=i/turns*Math.PI*2*lcm2(R,Math.round(r2))/R+ph;
      const x=cx+(R-r2)*Math.cos(t)+d2*Math.cos((R-r2)/r2*t);
      const y=cy+(R-r2)*Math.sin(t)-d2*Math.sin((R-r2)/r2*t);
      if(first){ctx.moveTo(x,y);first=false;}else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  setI(`${nc} spirographs R=${R} r=${r}`);
}
function lcm2(a,b){let x=Math.round(a),y=Math.round(b);while(y){const t=y;y=x%y;x=t;}return Math.round(a)*Math.round(b)/x;}

function apollonian(W,H,p){
  const maxD=gp('ap_d'),lw=gp('ap_w');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const cx=W/2,cy=H/2,r0=Math.min(W,H)*0.46;
  const queue=[{x:cx,y:cy,r:r0,depth:0}];
  let drawn=0;
  while(queue.length>0&&drawn<3000){
    const {x,y,r,depth}=queue.shift();
    if(r<1.5||depth>maxD)continue;
    ctx.strokeStyle=pcol(p,Math.max(0,1-r/r0)*0.95,0.85);
    ctx.lineWidth=Math.max(0.3,lw*(r/r0));
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
    drawn++;
    const nr=r/3;
    const angles=[0,Math.PI*2/3,Math.PI*4/3];
    angles.forEach(a=>{
      const dist=r-nr;
      queue.push({x:x+Math.cos(a)*dist,y:y+Math.sin(a)*dist,r:nr,depth:depth+1});
    });
    if(depth<maxD-1){
      const inner_r=r*(2/3-1/3);
      if(inner_r>1.5) queue.push({x,y,r:inner_r*0.38,depth:depth+2});
    }
  }
  setI(`Apollonian depth ${maxD}, ${drawn} circles`);
}

function space_filling(W,H,p){
  const order=gp('sf_d'),type=gp('sf_t'),lw=gp('sf_w');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const pts=[];
  if(type==='hilbert'){
    const n=1<<order,sz=Math.min(W,H)*0.9;
    function d2xy(n,d){let rx,ry,s,t=d,x=0,y=0;for(s=1;s<n;s*=2){rx=1&(t/2);ry=1&(t^rx);if(ry===0){if(rx===1){x=s-1-x;y=s-1-y;}const tmp=x;x=y;y=tmp;}x+=s*rx;y+=s*ry;t>>=2;}return{x,y};}
    for(let d=0;d<n*n;d++){const {x,y}=d2xy(n,d);pts.push({x:W/2-sz/2+x/n*sz+sz/(2*n),y:H/2-sz/2+y/n*sz+sz/(2*n),t:d/(n*n)});}
  } else if(type==='gosper'){
    const sz=Math.min(W,H)*0.85;
    const steps=Math.min(order,5);
    let ang=0,x2=W/2-sz*0.3,y2=H/2+sz*0.3,len=sz/(Math.pow(2.65,steps));
    let axiom='A';const rules={A:'A-B--B+A++AA+B-',B:'+A-BB--B-A++A+B'};
    for(let i=0;i<steps;i++){let s='';for(const c of axiom)s+=(rules[c]||c);axiom=s;if(axiom.length>50000)break;}
    pts.push({x:x2,y:y2,t:0});const da=Math.PI/3;let pi=0;
    for(const c of axiom){pi++;
      if(c==='A'||c==='B'){x2+=Math.cos(ang)*len;y2+=Math.sin(ang)*len;pts.push({x:x2,y:y2,t:pi/axiom.length});}
      else if(c==='+')ang+=da;else if(c==='-')ang-=da;
      if(pts.length>8000)break;
    }
  } else {
    const n=1<<order,sz=Math.min(W,H)*0.9;
    for(let i=0;i<n*n;i++){pts.push({x:W/2-sz/2+(i%n)/n*sz,y:H/2-sz/2+(Math.floor(i/n))/n*sz,t:i/(n*n)});}
  }
  if(pts.length<2){setI('Too complex');return;}
  ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  pts.forEach((pt,i)=>{if(i>0){ctx.strokeStyle=pcol(p,pt.t,0.8);ctx.lineTo(pt.x,pt.y);if(i%500===0){ctx.stroke();ctx.beginPath();ctx.moveTo(pt.x,pt.y);}}});
  ctx.stroke();
  setI(`${type} order ${order}, ${pts.length} pts`);
}

function lsystem(W,H,p){
  const iters=gp('ls_n'),angle=gp('ls_a')*Math.PI/180,type=gp('ls_t'),lw=gp('ls_w');
  const systems={
    plant:{axiom:'X',rules:{X:'F+[[X]-X]-F[-FX]+X',F:'FF'},da:angle,len:4},
    fern:{axiom:'X',rules:{X:'F-[[X]+X]+F[+FX]-X',F:'FF'},da:angle*1.1,len:4},
    dragon:{axiom:'FX',rules:{X:'X+YF+',Y:'-FX-Y'},da:Math.PI/2,len:6},
    sierpinski:{axiom:'A',rules:{A:'B-A-B',B:'A+B+A'},da:Math.PI/3,len:5},
    bush:{axiom:'Y',rules:{Y:'YFX[+Y][-Y]',X:'X[-FFF][+FFF]FX'},da:angle,len:3}
  };
  const sys=systems[type]||systems.plant;
  let str=sys.axiom;
  for(let i=0;i<iters;i++){let ns='';for(const c of str)ns+=(sys.rules[c]||c);str=ns;if(str.length>120000)break;}
  const len=sys.len*(0.8**iters)*Math.min(W,H)/60;
  let x=W/2,y=H*.9,dir=-Math.PI/2,stack=[];
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=pcol(p,0.6,0.85);ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x,y);
  let ci=0;
  for(const c of str){
    if(ci++>80000)break;
    if(c==='F'||c==='A'||c==='B'){const nx=x+Math.cos(dir)*len,ny=y+Math.sin(dir)*len;ctx.lineTo(nx,ny);x=nx;y=ny;}
    else if(c==='+')dir+=sys.da;else if(c==='-')dir-=sys.da;
    else if(c==='['){stack.push({x,y,dir});ctx.stroke();ctx.strokeStyle=pcol(p,stack.length/8,0.8);ctx.beginPath();ctx.moveTo(x,y);}
    else if(c===']'&&stack.length){ctx.stroke();const s=stack.pop();x=s.x;y=s.y;dir=s.dir;ctx.strokeStyle=pcol(p,stack.length/8,0.8);ctx.beginPath();ctx.moveTo(x,y);}
  }
  ctx.stroke();
  setI(`${type} iter ${iters}, ${str.length} chars`);
}

function domain_warp(W,H,p){
  const oct=gp('dw_o'),wstr=gp('dw_s'),pxsz=gp('dw_r'),sc=gp('dw_sc');
  const ns1=ri(0,99999),ns2=ri(0,99999),ns3=ri(0,99999);
  for(let y=0;y<H;y+=pxsz){
    for(let x=0;x<W;x+=pxsz){
      const nx=x/W*sc,ny=y/H*sc;
      let v=0,a=0.5,f=1,m=0;
      for(let i=0;i<oct;i++){
        const wx=nx*f+vn(nx*f+100,ny*f,ns1)*wstr;
        const wy=ny*f+vn(nx*f,ny*f+100,ns2)*wstr;
        v+=vn(wx,wy,ns3)*a;m+=a;a*=0.5;f*=2;
      }
      const t=Math.max(0,Math.min(1,v/m));
      ctx.fillStyle=pcol(p,t,1);ctx.fillRect(x,y,pxsz,pxsz);
    }
    if(y%60===0)setPr(y/H*100);
  }
  setI(`Domain warp oct=${oct} str=${wstr.toFixed(1)}`);
}

function curl_noise(W,H,p){
  const layers=gp('cn_l'),np=gp('cn_p'),step=gp('cn_s'),al=gp('cn_w')/100;
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  for(let li=0;li<layers;li++){
    const ns=ri(0,99999)+li*1000,sc=3+li*2;
    ctx.strokeStyle=pcol(p,li/layers,al);ctx.lineWidth=0.6;
    for(let i=0;i<np/layers;i++){
      let x=rng()*W,y=rng()*H;ctx.beginPath();ctx.moveTo(x,y);
      for(let s=0;s<80;s++){
        const nx=x/W*sc,ny=y/H*sc;
        const eps=0.01;
        const curlx=(fbm(nx,ny+eps,ns)-fbm(nx,ny-eps,ns))/(2*eps);
        const curly=-(fbm(nx+eps,ny,ns)-fbm(nx-eps,ny,ns))/(2*eps);
        const mag=Math.sqrt(curlx*curlx+curly*curly)+0.0001;
        x+=curlx/mag*step;y+=curly/mag*step;
        if(x<0||x>W||y<0||y>H)break;ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
  }
  setI(`${layers} curl layers \u00d7 ${np} lines`);
}

function ridged_fractal(W,H,p){
  const oct=gp('rf_o'),pxsz=gp('rf_r'),nc=gp('rf_c'),sc=gp('rf_sc');
  const ns=ri(0,99999);
  for(let y=0;y<H;y+=pxsz){
    for(let x=0;x<W;x+=pxsz){
      let v=0,a=0.5,f=1,m=0;
      for(let i=0;i<oct;i++){const s=vn(x/W*sc*f,y/H*sc*f,ns+i*100);v+=a*(1-2*Math.abs(s-0.5));m+=a;a*=0.5;f*=2.18;}
      const t=Math.max(0,Math.min(1,v/m));
      const band=Math.floor(t*nc)/nc;
      ctx.fillStyle=pcol(p,band,1);ctx.fillRect(x,y,pxsz,pxsz);
    }
    if(y%60===0)setPr(y/H*100);
  }
  setI(`Ridged oct=${oct}, ${nc} bands`);
}

function marble_wood(W,H,p){
  const type=gp('mw_t'),sc=gp('mw_sc'),twist=gp('mw_tw'),pxsz=gp('mw_r')|1;
  const ns=ri(0,99999);
  for(let y=0;y<H;y+=pxsz){
    for(let x=0;x<W;x+=pxsz){
      const nx=x/W*sc,ny=y/H*sc;
      const n=fbm(nx,ny,ns);
      let t;
      if(type==='marble')t=(Math.sin(nx*Math.PI+twist*n)+1)/2;
      else if(type==='wood'){const r=Math.sqrt((nx-sc/2)**2+(ny-sc/2)**2);t=(r*twist+n)*0.2;t-=Math.floor(t);}
      else t=n;
      ctx.fillStyle=pcol(p,Math.max(0,Math.min(1,t)),1);ctx.fillRect(x,y,pxsz,pxsz);
    }
    if(y%80===0)setPr(y/H*100);
  }
  setI(`${type} sc=${sc} twist=${twist}`);
}

function game_of_life(W,H,p){
  const cs=gp('gl_sc'),gens=gp('gl_g'),den=gp('gl_d');
  const cols=Math.floor(W/cs),rows=Math.floor(H/cs);
  let grid=new Uint8Array(cols*rows);
  const age=new Uint8Array(cols*rows);
  for(let i=0;i<grid.length;i++)if(rng()*100<den)grid[i]=1;
  const idx=(x,y)=>((y+rows)%rows)*cols+((x+cols)%cols);
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  for(let g=0;g<gens;g++){
    const next=new Uint8Array(cols*rows);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!(dx===0&&dy===0))n+=grid[idx(x+dx,y+dy)];
      const c=grid[idx(x,y)];next[idx(x,y)]=(c&&(n===2||n===3))||((!c)&&n===3)?1:0;
      if(next[idx(x,y)])age[idx(x,y)]++;else age[idx(x,y)]=Math.max(0,age[idx(x,y)]-1);
    }
    grid=next;
    if(g%8===0||g===gens-1){
      ctx.fillStyle=`rgba(${h2r(p.bg).join(',')},0.25)`;ctx.fillRect(0,0,W,H);
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        if(grid[idx(x,y)]||age[idx(x,y)]>0){ctx.fillStyle=pcol(p,Math.min(1,age[idx(x,y)]/10),grid[idx(x,y)]?0.9:0.3);ctx.fillRect(x*cs,y*cs,cs-1,cs-1);}
      }
      setPr(g/gens*100);
    }
  }
  setI(`${cols}\u00d7${rows} grid, ${gens} gens`);
}

function langtons_ant(W,H,p){
  const steps=gp('la_s'),cs=gp('la_cs'),na=gp('la_na');
  const cols=Math.floor(W/cs),rows=Math.floor(H/cs);
  const grid=new Uint8Array(cols*rows);
  const ants=Array.from({length:na},()=>({x:Math.floor(cols/2)+ri(-5,5),y:Math.floor(rows/2)+ri(-5,5),dir:ri(0,3)}));
  const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  for(let s=0;s<steps;s++){
    ants.forEach(ant=>{
      const i=ant.y*cols+ant.x;
      if(grid[i]===0){ant.dir=(ant.dir+1)%4;grid[i]=1;}
      else{ant.dir=(ant.dir+3)%4;grid[i]=0;}
      ant.x=(ant.x+dirs[ant.dir][0]+cols)%cols;
      ant.y=(ant.y+dirs[ant.dir][1]+rows)%rows;
    });
    if(s%(steps/60|0)===0){
      ctx.clearRect(0,0,W,H);ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        if(grid[y*cols+x]){ctx.fillStyle=pcol(p,(y/rows+x/cols)/2,0.9);ctx.fillRect(x*cs,y*cs,cs,cs);}
      }
      ants.forEach(a=>{ctx.fillStyle=pcol(p,0.9,1);ctx.fillRect(a.x*cs,a.y*cs,cs,cs);});
      setPr(s/steps*100);
    }
  }
  setI(`${na} ants \u00d7 ${steps} steps`);
}

function cave_map(W,H,p){
  const cs=gp('cm_sc'),iters=gp('cm_it'),den=gp('cm_d'),style=gp('cm_s');
  const cols=Math.floor(W/cs),rows=Math.floor(H/cs);
  let grid=Array.from({length:rows},()=>Array.from({length:cols},()=>rng()*100<den?1:0));
  for(let row of grid[0])grid[0].fill(1);for(let r of grid)r[0]=r[cols-1]=1;grid[rows-1].fill(1);
  for(let it=0;it<iters;it++){
    const next=grid.map(r=>[...r]);
    for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
      let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)n+=grid[y+dy][x+dx];
      next[y][x]=n>=5?1:0;
    }
    grid=next;
  }
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const wall=grid[y][x];
    if(style==='solid'){ctx.fillStyle=wall?p.c[0]:p.c[p.c.length-1];}
    else if(style==='gradient'){let depth=0;if(!wall)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const ny=y+dy,nx2=x+dx;if(ny>=0&&ny<rows&&nx2>=0&&nx2<cols&&grid[ny][nx2])depth++;}ctx.fillStyle=pcol(p,wall?0.1:0.4+depth/25*0.5,0.9);}
    else{ctx.fillStyle=wall?p.c[0]:p.bg;}
    ctx.fillRect(x*cs,y*cs,cs,cs);
    if(style==='outlined'&&!wall){ctx.strokeStyle=p.c[1];ctx.lineWidth=0.5;ctx.strokeRect(x*cs,y*cs,cs,cs);}
  }
  setI(`${cols}\u00d7${rows} cave, ${iters} smooth`);
}

function crystal_growth(W,H,p){
  const np=gp('cg_p'),ns=gp('cg_s'),stick=gp('cg_st'),ws=gp('cg_w');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const grid=new Uint8Array(W*H);
  const frozen=[];
  const seeds=Array.from({length:ns},()=>({x:Math.floor(rr(W*.2,W*.8)),y:Math.floor(rr(H*.2,H*.8))}));
  seeds.forEach(s=>{const i=s.y*W+s.x;grid[i]=1;frozen.push(i);});
  seeds.forEach(s=>{ctx.fillStyle=pcol(p,0.9,1);ctx.fillRect(s.x,s.y,2,2);});
  let added=0;
  for(let i=0;i<np&&frozen.length<W*H*0.4;i++){
    let x=ri(0,W-1),y=ri(0,H-1);
    for(let s=0;s<2000;s++){
      x=Math.max(0,Math.min(W-1,x+(ri(0,2)-1)*ws));
      y=Math.max(0,Math.min(H-1,y+(ri(0,2)-1)*ws));
      let stuck=false;
      const neighbors=[[1,0],[-1,0],[0,1],[0,-1]];
      for(const[dx,dy]of neighbors){const nx2=x+dx,ny=y+dy;if(nx2>=0&&nx2<W&&ny>=0&&ny<H&&grid[ny*W+nx2]){if(rng()<stick)stuck=true;break;}}
      if(stuck){grid[y*W+x]=1;frozen.push(y*W+x);const t=added/(np*0.6);ctx.fillStyle=pcol(p,Math.min(1,t),0.9);ctx.fillRect(x,y,1,1);added++;break;}
    }
    if(i%2000===0)setPr(i/np*100);
  }
  setI(`DLA: ${added} crystals, ${ns} seeds`);
}

function force_graph(W,H,p){
  const nn=gp('fg_n'),ep=gp('fg_e'),iters=gp('fg_it'),rep=gp('fg_r');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const nodes=Array.from({length:nn},(_,i)=>({x:rr(W*.1,W*.9),y:rr(H*.1,H*.9),vx:0,vy:0,c:i/nn}));
  const edges=[];
  for(let i=0;i<nn;i++)for(let j=i+1;j<nn;j++)if(rng()<ep)edges.push([i,j]);
  for(let it=0;it<iters;it++){
    nodes.forEach((n,i)=>{n.vx=0;n.vy=0;nodes.forEach((m,j)=>{if(i===j)return;const dx=n.x-m.x,dy=n.y-m.y,d=Math.sqrt(dx*dx+dy*dy)+0.1;const f=rep/(d*d);n.vx+=f*dx/d;n.vy+=f*dy/d;});});
    edges.forEach(([i,j])=>{const n=nodes[i],m=nodes[j];const dx=m.x-n.x,dy=m.y-n.y;const d=Math.sqrt(dx*dx+dy*dy)+0.1;const f=(d-80)*0.01;nodes[i].vx+=f*dx/d;nodes[i].vy+=f*dy/d;nodes[j].vx-=f*dx/d;nodes[j].vy-=f*dy/d;});
    nodes.forEach(n=>{n.vx*=0.85;n.vy*=0.85;n.x=Math.max(20,Math.min(W-20,n.x+n.vx));n.y=Math.max(20,Math.min(H-20,n.y+n.vy));});
    if(it%15===0)setPr(it/iters*100);
  }
  edges.forEach(([i,j])=>{ctx.strokeStyle=pcol(p,(nodes[i].c+nodes[j].c)/2,0.4);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.stroke();});
  nodes.forEach(n=>{ctx.fillStyle=pcol(p,n.c,0.9);ctx.beginPath();ctx.arc(n.x,n.y,5,0,Math.PI*2);ctx.fill();});
  setI(`${nn} nodes, ${edges.length} edges`);
}

function mst(W,H,p){
  const n=gp('ms_n'),lw=gp('ms_w'),showPts=gp('ms_d');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const pts=Array.from({length:n},(_,i)=>({x:rng()*W,y:rng()*H,c:i/n}));
  const edges=[];
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y;edges.push({i,j,d:Math.sqrt(dx*dx+dy*dy)});}
  edges.sort((a,b)=>a.d-b.d);
  const par=Array.from({length:n},(_,i)=>i);
  function find(x){let r=x;while(par[r]!==r)r=par[r];while(par[x]!==r){const nx=par[x];par[x]=r;x=nx;}return r;}
  const tree=[];
  for(const e of edges){const pi=find(e.i),pj=find(e.j);if(pi!==pj){par[pi]=pj;tree.push(e);if(tree.length===n-1)break;}}
  tree.forEach(e=>{ctx.strokeStyle=pcol(p,(pts[e.i].c+pts[e.j].c)/2,0.8);ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(pts[e.i].x,pts[e.i].y);ctx.lineTo(pts[e.j].x,pts[e.j].y);ctx.stroke();});
  if(showPts==='yes')pts.forEach(pt=>{ctx.fillStyle=pcol(p,pt.c,0.9);ctx.beginPath();ctx.arc(pt.x,pt.y,4,0,Math.PI*2);ctx.fill();});
  setI(`MST: ${n} pts, ${tree.length} edges`);
}

function delaunay(W,H,p){
  const n=gp('dl_n'),style=gp('dl_s'),lw=gp('dl_w');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const pts=Array.from({length:n},(_,i)=>({x:rng()*W,y:rng()*H}));
  pts.push({x:-W,y:-H},{x:3*W,y:-H},{x:W/2,y:3*H});
  const tris=bowyer_watson(pts);
  tris.forEach((tri,ti)=>{
    const[a,b,c]=tri;
    if(a>=n||b>=n||c>=n)return;
    const col=pcol(p,ti/tris.length,0.7);
    if(style==='triangles'||style==='both'){ctx.fillStyle=col;ctx.globalAlpha=0.4;ctx.beginPath();ctx.moveTo(pts[a].x,pts[a].y);ctx.lineTo(pts[b].x,pts[b].y);ctx.lineTo(pts[c].x,pts[c].y);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
    if(style==='triangles'||style==='both'||style==='voronoi'){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(pts[a].x,pts[a].y);ctx.lineTo(pts[b].x,pts[b].y);ctx.lineTo(pts[c].x,pts[c].y);ctx.closePath();ctx.stroke();}
  });
  setI(`Delaunay ${n} pts, ${tris.length} tris`);
}
function bowyer_watson(pts){
  const n=pts.length;let tris=[[n-3,n-2,n-1]];
  for(let pi=0;pi<n-3;pi++){
    const badTris=[];
    tris.forEach(t=>{const cc=circumcircle(pts[t[0]],pts[t[1]],pts[t[2]]);if(cc&&(pts[pi].x-cc.x)**2+(pts[pi].y-cc.y)**2<cc.r*cc.r)badTris.push(t);});
    const poly=[];
    badTris.forEach(t=>{[[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]].forEach(e=>{const shared=badTris.some(t2=>t2!==t&&t2.includes(e[0])&&t2.includes(e[1]));if(!shared)poly.push(e);});});
    tris=tris.filter(t=>!badTris.includes(t));
    poly.forEach(e=>tris.push([e[0],e[1],pi]));
  }
  return tris;
}
function circumcircle(a,b,c){const D=2*(a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y));if(Math.abs(D)<1e-10)return null;const ux=((a.x**2+a.y**2)*(b.y-c.y)+(b.x**2+b.y**2)*(c.y-a.y)+(c.x**2+c.y**2)*(a.y-b.y))/D;const uy=((a.x**2+a.y**2)*(c.x-b.x)+(b.x**2+b.y**2)*(a.x-c.x)+(c.x**2+c.y**2)*(b.x-a.x))/D;return{x:ux,y:uy,r:Math.sqrt((a.x-ux)**2+(a.y-uy)**2)};}

function julia_set(W,H,p){
  const mode=gp('js_m'),cx2=gp('js_cx'),cy2=gp('js_cy'),maxI=gp('js_it'),zoom=gp('js_z');
  const img=ctx.createImageData(W,H);
  const s=2.5/(zoom*Math.min(W,H)/2);
  for(let py=0;py<H;py++){
    for(let px=0;px<W;px++){
      let zr=(px-W/2)*s,zi=(py-H/2)*s,i=0;
      if(mode==='mandelbrot'){const cr=zr,ci2=zi;zr=0;zi=0;for(;i<maxI&&zr*zr+zi*zi<4;i++){const t=zr*zr-zi*zi+cr;zi=2*zr*zi+ci2;zr=t;}}
      else{for(;i<maxI&&zr*zr+zi*zi<4;i++){const t=zr*zr-zi*zi+cx2;zi=2*zr*zi+cy2;zr=t;}}
      const t=i===maxI?0:Math.sqrt(i/maxI);
      const col=pcol(p,t,1).match(/\d+/g).map(Number);
      const pi=(py*W+px)*4;img.data[pi]=col[0];img.data[pi+1]=col[1];img.data[pi+2]=col[2];img.data[pi+3]=255;
    }
    if(py%50===0)setPr(py/H*100);
  }
  ctx.putImageData(img,0,0);
  setI(`${mode} iter=${maxI} zoom=${zoom.toFixed(1)}`);
}

function newton_fractal(W,H,p){
  const deg=gp('nf_d'),maxI=gp('nf_it'),zoom=gp('nf_z');
  const roots=Array.from({length:deg},(_,i)=>{const a=i/deg*Math.PI*2;return{r:Math.cos(a),i:Math.sin(a)};});
  const img=ctx.createImageData(W,H);
  const s=3/(zoom*Math.min(W,H)/2);
  for(let py=0;py<H;py++){
    for(let px=0;px<W;px++){
      let zr=(px-W/2)*s,zi=(py-H/2)*s;
      let iter=0,rootIdx=0;
      for(;iter<maxI;iter++){
        let fr=1,fi=0,dfr=0,dfi=0;
        roots.forEach(rt=>{const ar=zr-rt.r,ai=zi-rt.i;const nr=fr*ar-fi*ai;fi=fr*ai+fi*ar;fr=nr;const ndr=dfr*ar-dfi*ai+fr;dfi=dfr*ai+dfi*ar+fi;dfr=ndr;});
        const dd=dfr*dfr+dfi*dfi+1e-14;const nr=zr-(fr*dfr+fi*dfi)/dd;const ni=zi-(fi*dfr-fr*dfi)/dd;zr=nr;zi=ni;
        let best=Infinity;
        roots.forEach((rt,ri)=>{const d=(zr-rt.r)**2+(zi-rt.i)**2;if(d<best){best=d;rootIdx=ri;}});
        if(best<1e-6)break;
      }
      const t=rootIdx/deg,shade=Math.max(0.15,1-iter/maxI*0.85);
      const col=pcol(p,t,shade).match(/\d+/g).map(Number);
      const pi=(py*W+px)*4;img.data[pi]=col[0];img.data[pi+1]=col[1];img.data[pi+2]=col[2];img.data[pi+3]=255;
    }
    if(py%50===0)setPr(py/H*100);
  }
  ctx.putImageData(img,0,0);
  setI(`Newton deg=${deg}, iter=${maxI}`);
}

function ifs(W,H,p){
  const type=gp('if_t'),np=gp('if_n'),ps=gp('if_s');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const systems={
    barnsley:{fns:[{a:0,b:0,c:0,d:0.16,e:0,f:0,w:0.01},{a:0.85,b:0.04,c:-0.04,d:0.85,e:0,f:1.6,w:0.85},{a:0.2,b:-0.26,c:0.23,d:0.22,e:0,f:1.6,w:0.07},{a:-0.15,b:0.28,c:0.26,d:0.24,e:0,f:0.44,w:0.07}],sx:0.3,sy:-0.3,tx:W/2,ty:H*.95},
    sierpinski:{fns:[{a:0.5,b:0,c:0,d:0.5,e:0,f:0,w:0.33},{a:0.5,b:0,c:0,d:0.5,e:0.5,f:0,w:0.33},{a:0.5,b:0,c:0,d:0.5,e:0.25,f:0.5,w:0.34}],sx:Math.min(W,H)*0.9,sy:-Math.min(W,H)*0.9,tx:W*.05,ty:H*.95},
    tree:{fns:[{a:0,b:0,c:0,d:0.5,e:0,f:0,w:0.1},{a:0.42,b:-0.42,c:0.42,d:0.42,e:0,f:0.2,w:0.4},{a:0.42,b:0.42,c:-0.42,d:0.42,e:0,f:0.2,w:0.4},{a:0.1,b:0,c:0,d:0.1,e:0,f:0.2,w:0.1}],sx:Math.min(W,H)*0.8,sy:-Math.min(W,H)*0.8,tx:W/2,ty:H*.95},
    levy:{fns:[{a:0.5,b:-0.5,c:0.5,d:0.5,e:0,f:0,w:0.5},{a:0.5,b:0.5,c:-0.5,d:0.5,e:0.5,f:0.5,w:0.5}],sx:Math.min(W,H)*0.8,sy:-Math.min(W,H)*0.8,tx:W*.1,ty:H*.7},
    dragon:{fns:[{a:0.5,b:-0.5,c:0.5,d:0.5,e:0,f:0,w:0.5},{a:-0.5,b:-0.5,c:0.5,d:-0.5,e:1,f:0,w:0.5}],sx:Math.min(W,H)*0.6,sy:-Math.min(W,H)*0.6,tx:W*.2,ty:H*.7}
  };
  const sys=systems[type]||systems.barnsley;
  let x=0,y=0;
  const cumW=[];let sum=0;sys.fns.forEach(f=>{sum+=f.w;cumW.push(sum);});
  for(let i=0;i<np;i++){
    const r=rng();let fi=0;while(fi<sys.fns.length-1&&r>cumW[fi])fi++;
    const f=sys.fns[fi];const nx=f.a*x+f.b*y+f.e,ny=f.c*x+f.d*y+f.f;x=nx;y=ny;
    if(i>20){const px2=x*sys.sx+sys.tx,py2=y*sys.sy+sys.ty;ctx.fillStyle=pcol(p,fi/sys.fns.length,0.6);ctx.fillRect(px2-ps/2,py2-ps/2,ps,ps);}
    if(i%50000===0)setPr(i/np*100);
  }
  setI(`${type} IFS, ${(np/1000).toFixed(0)}k pts`);
}

function flame_fractal(W,H,p){
  const nf=gp('ff_n'),np=gp('ff_p'),ps=gp('ff_s'),gamma=gp('ff_g');
  const fns=Array.from({length:nf},()=>({a:rr(-1.5,1.5),b:rr(-1.5,1.5),c:rr(-1.5,1.5),d:rr(-1.5,1.5),e:rr(-0.5,0.5),f:rr(-0.5,0.5),w:rng()}));
  let sw=0;fns.forEach(f=>sw+=f.w);fns.forEach(f=>f.w/=sw);
  const cumW=[];let s2=0;fns.forEach(f=>{s2+=f.w;cumW.push(s2);});
  const hist=new Float32Array(W*H);let maxH=0;
  const vars=[
    (x,y)=>[x,y],
    (x,y)=>{const r=Math.sqrt(x*x+y*y);return[Math.sin(x)/r,Math.sin(y)/r];},
    (x,y)=>{const r2=x*x+y*y;return[x/r2,y/r2];},
    (x,y)=>{const r=Math.sqrt(x*x+y*y),a=Math.atan2(y,x);return[r*Math.cos(a+r),r*Math.sin(a+r)];},
    (x,y)=>[Math.sin(x),Math.sin(y)]
  ];
  let x=rng()*2-1,y=rng()*2-1;
  for(let i=0;i<np;i++){
    const r=rng();let fi=0;while(fi<nf-1&&r>cumW[fi])fi++;
    const f=fns[fi];const ax=f.a*x+f.b*y+f.e,ay=f.c*x+f.d*y+f.f;
    const vi=fi%vars.length;const[vx,vy]=vars[vi](ax,ay);x=vx;y=vy;
    if(i>20){const px2=Math.floor((x+2)/4*W),py2=Math.floor((y+2)/4*H);if(px2>=0&&px2<W&&py2>=0&&py2<H){hist[py2*W+px2]+=1;if(hist[py2*W+px2]>maxH)maxH=hist[py2*W+px2];}}
    if(i%100000===0)setPr(i/np*100);
  }
  const img=ctx.createImageData(W,H);const lmax=Math.log(maxH+1);
  for(let i=0;i<W*H;i++){const a=hist[i]?Math.pow(Math.log(hist[i]+1)/lmax,1/gamma):0;const col=pcol(p,a,1).match(/\d+/g).map(Number);const pi=i*4;img.data[pi]=col[0];img.data[pi+1]=col[1];img.data[pi+2]=col[2];img.data[pi+3]=Math.round(a*255);}
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);ctx.putImageData(img,0,0);
  setI(`Flame ${nf} fns, ${(np/1000).toFixed(0)}k pts`);
}

function contour_map(W,H,p){
  const nc=gp('ct_l'),sc=gp('ct_sc'),lw=gp('ct_w'),style=gp('ct_s');
  const ns=ri(0,99999);
  if(style==='filled'||style==='both'){
    for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){
      const v=fbm(x/W*sc,y/H*sc,ns);const band=Math.floor(v*nc)/nc;
      ctx.fillStyle=pcol(p,band,0.7);ctx.fillRect(x,y,2,2);
    }
  } else {ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);}
  if(style==='lines'||style==='both'){
    for(let li=1;li<nc;li++){
      const threshold=li/nc;ctx.strokeStyle=pcol(p,threshold,0.85);ctx.lineWidth=li%5===0?lw*2:lw;
      marching_squares(W,H,threshold,sc,ns);
    }
  }
  setI(`${nc} contours`);
}
function marching_squares(W,H,thresh,sc,ns){
  const step=4;
  for(let y=0;y<H-step;y+=step)for(let x=0;x<W-step;x+=step){
    const v00=fbm(x/W*sc,y/H*sc,ns),v10=fbm((x+step)/W*sc,y/H*sc,ns);
    const v01=fbm(x/W*sc,(y+step)/H*sc,ns),v11=fbm((x+step)/W*sc,(y+step)/H*sc,ns);
    const c=(v00>thresh?8:0)|(v10>thresh?4:0)|(v11>thresh?2:0)|(v01>thresh?1:0);
    const lerp2=(a,b,t)=>a+(b-a)*t,tl2=(a,b)=>lerp2(0,step,(thresh-a)/(b-a+0.0001));
    const pts={T:[x+tl2(v00,v10),y],B:[x+tl2(v01,v11),y+step],L:[x,y+tl2(v00,v01)],R:[x+step,y+tl2(v10,v11)]};
    const lines={1:[pts.L,pts.B],2:[pts.B,pts.R],3:[pts.L,pts.R],4:[pts.T,pts.R],5:[pts.T,pts.B],6:[pts.T,pts.B],7:[pts.T,pts.L],8:[pts.T,pts.L],9:[pts.T,pts.B],10:[pts.L,pts.R],11:[pts.T,pts.R],12:[pts.L,pts.R],13:[pts.B,pts.R],14:[pts.L,pts.B]};
    if(lines[c]){ctx.beginPath();ctx.moveTo(lines[c][0][0],lines[c][0][1]);ctx.lineTo(lines[c][1][0],lines[c][1][1]);ctx.stroke();}
  }
}

function chladni(W,H,p){
  const m=gp('ch_m'),n2=gp('ch_n2'),cs=gp('ch_sc')|1;
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const img=ctx.createImageData(Math.ceil(W/cs),Math.ceil(H/cs));
  const iw=img.width,ih=img.height;
  for(let y=0;y<ih;y++)for(let x=0;x<iw;x++){
    const px=x/iw*Math.PI,py=y/ih*Math.PI;
    const v=Math.sin(m*px)*Math.sin(n2*py)-Math.sin(n2*px)*Math.sin(m*py);
    const t=Math.abs(v)<0.12?0:1;
    const col=t?pcol(p,0.1,1):pcol(p,0.85,1);
    const rgb=col.match(/\d+/g).map(Number);
    const pi=(y*iw+x)*4;img.data[pi]=rgb[0];img.data[pi+1]=rgb[1];img.data[pi+2]=rgb[2];img.data[pi+3]=255;
  }
  const tmp=document.createElement('canvas');tmp.width=iw;tmp.height=ih;tmp.getContext('2d').putImageData(img,0,0);
  ctx.drawImage(tmp,0,0,W,H);
  setI(`Chladni m=${m} n=${n2}`);
}

function weave_knot(W,H,p){
  const ns=gp('wk_n'),cr=gp('wk_c'),sw=gp('wk_w'),type=gp('wk_t');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const cx=W/2,cy=H/2,R=Math.min(W,H)*0.40;
  if(type==='weave'){
    const gs=Math.min(W,H)/(ns*2);
    for(let i=0;i<ns;i++){
      ctx.strokeStyle=pcol(p,i/ns,0.8);ctx.lineWidth=sw;
      ctx.beginPath();ctx.moveTo(0,(i+0.5)*H/ns);ctx.lineTo(W,(i+0.5)*H/ns);ctx.stroke();
      ctx.strokeStyle=pcol(p,1-i/ns,0.8);ctx.lineWidth=sw;
      ctx.beginPath();ctx.moveTo((i+0.5)*W/ns,0);ctx.lineTo((i+0.5)*W/ns,H);ctx.stroke();
    }
  } else if(type==='braid'){
    for(let s=0;s<ns;s++){
      ctx.strokeStyle=pcol(p,s/ns,0.85);ctx.lineWidth=sw;ctx.beginPath();
      for(let t=0;t<=200;t++){const x=t/200*W,y=cy+Math.sin(x/W*Math.PI*cr*2+s*Math.PI*2/ns)*H*0.3;t===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
    }
  } else {
    for(let s=0;s<ns;s++){
      const ang=s/ns*Math.PI*2;ctx.strokeStyle=pcol(p,s/ns,0.8);ctx.lineWidth=sw;ctx.beginPath();
      for(let t=0;t<=300;t++){const a=t/300*Math.PI*2*cr+ang;const rr2=R*(0.6+0.4*Math.sin(t/300*Math.PI*2*ns));ctx.lineTo(cx+rr2*Math.cos(a),cy+rr2*Math.sin(a));}ctx.stroke();
    }
  }
  setI(`${type} ns=${ns} cr=${cr}`);
}

function mobius_torus(W,H,p){
  const type=gp('mt_t'),U=gp('mt_u'),V=gp('mt_v'),style=gp('mt_s');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const project=(x,y,z,rx,ry)=>{const cosX=Math.cos(rx),sinX=Math.sin(rx),cosY=Math.cos(ry),sinY=Math.sin(ry);const y2=y*cosX-z*sinX,z2=y*sinX+z*cosX;const x2=x*cosY+z2*sinY;const z3=-x*sinY+z2*cosY;const d=4;return{x:x2/(z3+d)*Math.min(W,H)*0.5+W/2,y:y2/(z3+d)*Math.min(W,H)*0.5+H/2,z:z3};};
  const pts=[];
  const R=1.2,r=0.5;
  for(let ui=0;ui<=U;ui++){const u=ui/U*Math.PI*2;
    const row=[];
    for(let vi=0;vi<=V;vi++){const v=vi/V*Math.PI*2;let x,y,z;
      if(type==='torus'){x=(R+r*Math.cos(v))*Math.cos(u);y=(R+r*Math.cos(v))*Math.sin(u);z=r*Math.sin(v);}
      else if(type==='mobius'){x=(1+v/(2*V)*Math.cos(u/2))*Math.cos(u);y=(1+v/(2*V)*Math.cos(u/2))*Math.sin(u);z=v/(2*V)*Math.sin(u/2);}
      else if(type==='trefoil'){const s=u;x=Math.sin(s)+2*Math.sin(2*s);y=Math.cos(s)-2*Math.cos(2*s);z=-Math.sin(3*s);}
      else{x=Math.cos(u)*(R+r*Math.cos(v));y=Math.sin(u)*(R+r*Math.cos(v));z=r*Math.sin(v);}
      row.push({x,y,z,t:ui/U});
    }
    pts.push(row);
  }
  const rx=0.4,ry=0.8;
  for(let ui=0;ui<U;ui++)for(let vi=0;vi<V;vi++){
    const a=project(pts[ui][vi].x,pts[ui][vi].y,pts[ui][vi].z,rx,ry);
    const b=project(pts[ui+1][vi].x,pts[ui+1][vi].y,pts[ui+1][vi].z,rx,ry);
    const c=project(pts[ui][vi+1].x,pts[ui][vi+1].y,pts[ui][vi+1].z,rx,ry);
    const col=pcol(p,pts[ui][vi].t,0.7);
    if(style==='surface'){ctx.fillStyle=col;ctx.globalAlpha=0.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(project(pts[ui+1][vi+1].x,pts[ui+1][vi+1].y,pts[ui+1][vi+1].z,rx,ry).x,project(pts[ui+1][vi+1].x,pts[ui+1][vi+1].y,pts[ui+1][vi+1].z,rx,ry).y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
    ctx.strokeStyle=col;ctx.lineWidth=0.6;
    if(style==='wireframe'||style==='lines'){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke();}
  }
  setI(`${type} U=${U} V=${V}`);
}

function oscilloscope(W,H,p){
  const xf=gp('os_x'),yf=gp('os_y'),ns=gp('os_n'),lw=gp('os_w'),al=gp('os_al')/100;
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  for(let si=0;si<ns;si++){
    const xf2=xf+si*0.5,yf2=yf+si*0.7;
    const ph=rng()*Math.PI*2,ph2=rng()*Math.PI*2;
    ctx.strokeStyle=pcol(p,si/ns,al);ctx.lineWidth=lw;ctx.beginPath();
    for(let t=0;t<=800;t++){
      const a=t/800*Math.PI*2;
      const x=W/2+Math.sin(xf2*a+ph)*W*0.44;const y=H/2+Math.sin(yf2*a+ph2)*H*0.44;
      t===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  setI(`Osc X=${xf} Y=${yf} \u00d7 ${ns} signals`);
}

function ascii_density(W,H,p){
  const cs=gp('ad_cs'),sc=gp('ad_sc'),type=gp('ad_t');
  const chars=' .,:;i1tfLCG08#@'.split('');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  ctx.font=`${cs}px 'Courier New',monospace`;
  const ns=ri(0,99999);
  for(let y=cs;y<H;y+=cs)for(let x=0;x<W;x+=cs){
    let v;
    if(type==='noise')v=fbm(x/W*sc,y/H*sc,ns);
    else if(type==='gradient')v=Math.sqrt(((x-W/2)/W)**2+((y-H/2)/H)**2)*2;
    else v=(Math.sin(x/W*sc*Math.PI)+Math.sin(y/H*sc*Math.PI))/2*0.5+0.5;
    const t=Math.max(0,Math.min(1,v));
    const ci=Math.floor(t*(chars.length-1));
    ctx.fillStyle=pcol(p,t,0.9);ctx.fillText(chars[ci],x,y);
  }
  setI(`ASCII ${type} cs=${cs}`);
}

function wfc(W,H,p){
  const ts=gp('wf2_s'),type=gp('wf2_t');
  const cols=Math.floor(W/ts),rows=Math.floor(H/ts);
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const palettes={
    maze:{tiles:['empty','wall','h_wall','v_wall'],rules:{empty:['empty','h_wall','v_wall'],wall:['wall','empty'],h_wall:['empty','h_wall'],v_wall:['empty','v_wall']}},
    circuit:{tiles:['bg','wire_h','wire_v','corner','node'],rules:{bg:['bg','wire_h','wire_v'],wire_h:['bg','wire_h','corner'],wire_v:['bg','wire_v','corner'],corner:['wire_h','wire_v'],node:['wire_h','wire_v']}},
    organic:{tiles:['a','b','c'],rules:{a:['a','b'],b:['b','c','a'],c:['b','c']}},
    castle:{tiles:['floor','wall','tower','door'],rules:{floor:['floor','wall','door'],wall:['wall','floor','tower'],tower:['wall'],door:['floor']}}
  };
  const sys=palettes[type]||palettes.maze;
  const nt=sys.tiles.length;
  const grid=Array.from({length:rows},()=>Array.from({length:cols},()=>({opts:[...Array(nt).keys()],collapsed:false})));
  const colorFor=t=>pcol(p,t/nt,0.85);
  for(let attempts=0;attempts<rows*cols*2;attempts++){
    let minEnt=Infinity,mx=-1,my=-1;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const c=grid[y][x];if(!c.collapsed&&c.opts.length<minEnt){minEnt=c.opts.length;mx=x;my=y;}}
    if(mx<0)break;
    const cell=grid[my][mx];cell.collapsed=true;cell.opts=[cell.opts[ri(0,cell.opts.length-1)]];
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){if(!grid[y][x].collapsed&&grid[y][x].opts.length>1)grid[y][x].opts=grid[y][x].opts.filter((_,i)=>rng()<0.7||i<2);}
  }
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const c=grid[y][x];const ti=c.opts[0]||0;
    ctx.fillStyle=colorFor(ti);ctx.fillRect(x*ts,y*ts,ts-1,ts-1);
    ctx.strokeStyle=colorFor((ti+2)%nt);ctx.lineWidth=0.5;ctx.strokeRect(x*ts,y*ts,ts-1,ts-1);
  }
  setI(`WFC ${type} ${cols}\u00d7${rows}`);
}

/* ── Expose on window ── */
window.gravity_wells=gravity_wells;
window.boid_flocking=boid_flocking;
window.magnetic_field=magnetic_field;
window.reaction_diffusion=reaction_diffusion;
window.sand_drift=sand_drift;
window.voronoi=voronoi;
window.truchet=truchet;
window.penrose=penrose;
window.spirograph=spirograph;
window.lcm2=lcm2;
window.apollonian=apollonian;
window.space_filling=space_filling;
window.lsystem=lsystem;
window.domain_warp=domain_warp;
window.curl_noise=curl_noise;
window.ridged_fractal=ridged_fractal;
window.marble_wood=marble_wood;
window.game_of_life=game_of_life;
window.langtons_ant=langtons_ant;
window.cave_map=cave_map;
window.crystal_growth=crystal_growth;
window.force_graph=force_graph;
window.mst=mst;
window.delaunay=delaunay;
window.bowyer_watson=bowyer_watson;
window.circumcircle=circumcircle;
window.julia_set=julia_set;
window.newton_fractal=newton_fractal;
window.ifs=ifs;
window.flame_fractal=flame_fractal;
window.contour_map=contour_map;
window.marching_squares=marching_squares;
window.chladni=chladni;
window.weave_knot=weave_knot;
window.mobius_torus=mobius_torus;
window.oscilloscope=oscilloscope;
window.ascii_density=ascii_density;
window.wfc=wfc;
