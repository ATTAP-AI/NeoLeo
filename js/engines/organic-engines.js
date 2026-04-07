/*  js/engines/organic-engines.js  -- Organic & biological engine implementations (8 engines)
 *  Loaded via <script> tag AFTER extended-engines.js.
 *  Uses window globals: ctx, gp, pcol, rng, rr, ri, fbm, vn, h2r, lerp, setI, setPr
 */

function physarum(W,H,p){
  const nA=gp('ph_n'),sS=gp('ph_ss'),sA=gp('ph_sa')*Math.PI/180,dD=gp('ph_dd'),dS=gp('ph_ds'),steps=gp('ph_st');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  /* Trail map and agent arrays */
  const trail=new Float32Array(W*H);
  const agents=Array.from({length:nA},()=>({
    x:W/2+(rng()-.5)*W*.6,y:H/2+(rng()-.5)*H*.6,
    a:rng()*Math.PI*2
  }));
  const tw=W,th=H;
  const tidx=(x,y)=>Math.max(0,Math.min(H-1,y|0))*tw+Math.max(0,Math.min(W-1,x|0));
  const sense=(x,y,a)=>{const sx=x+Math.cos(a)*sS*3,sy=y+Math.sin(a)*sS*3;return trail[tidx(sx,sy)];};
  for(let s=0;s<steps;s++){
    /* Agent sense, rotate, move */
    agents.forEach(ag=>{
      const F=sense(ag.x,ag.y,ag.a);
      const L=sense(ag.x,ag.y,ag.a-sA);
      const R=sense(ag.x,ag.y,ag.a+sA);
      if(F>=L&&F>=R){}
      else if(F<L&&F<R)ag.a+=(rng()<.5?sA:-sA);
      else if(L>R)ag.a-=sA;
      else ag.a+=sA;
      ag.x+=Math.cos(ag.a)*sS;ag.y+=Math.sin(ag.a)*sS;
      /* Wrap */
      ag.x=(ag.x+W)%W;ag.y=(ag.y+H)%H;
      trail[tidx(ag.x,ag.y)]+=1;
    });
    /* Diffuse + decay trail */
    const next=new Float32Array(W*H);
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      const sum=trail[(y-1)*W+x]+trail[(y+1)*W+x]+trail[y*W+x-1]+trail[y*W+x+1]+trail[y*W+x]*4;
      next[y*W+x]=Math.max(0,(sum/8)*dD);
    }
    trail.set(next);
    if(s%(steps/4|0)===0)setPr(s/steps*100);
  }
  /* Render trail as image */
  const img=ctx.createImageData(W,H);
  const[r1,g1,b1]=h2r(p.c[0]);const[r2,g2,b2]=h2r(p.c[p.c.length-1]);
  for(let i=0;i<W*H;i++){
    const t=Math.min(1,trail[i]*dS);
    const pi=i*4;
    img.data[pi]=lerp(r1,r2,t)|0;img.data[pi+1]=lerp(g1,g2,t)|0;img.data[pi+2]=lerp(b1,b2,t)|0;img.data[pi+3]=255;
  }
  ctx.putImageData(img,0,0);
  setI(`Physarum ${nA} agents \u00d7 ${steps} steps`);
}

function space_colonization(W,H,p){
  const nA=gp('sc_na'),nN=gp('sc_nn'),kI=gp('sc_ki'),kR=gp('sc_kr'),lw=gp('sc_lw'),maxB=gp('sc_mb');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  /* Random attractors (nutrient sources) */
  const attrs=Array.from({length:nA},()=>({x:rr(W*.05,W*.95),y:rr(H*.05,H*.85),active:true}));
  /* Root node at bottom center */
  const nodes=[{x:W/2+rr(-W*.1,W*.1),y:H*.9,px:-1,depth:0}];
  const MAX_STEPS=200;
  for(let step=0;step<MAX_STEPS;step++){
    /* Each active attractor influences nearest node */
    const influence=new Map();
    attrs.forEach((a,ai)=>{
      if(!a.active)return;
      let best=Infinity,bi=-1;
      nodes.forEach((n,ni)=>{const d=(n.x-a.x)**2+(n.y-a.y)**2;if(d<best){best=d;bi=ni;}});
      if(bi<0)return;
      if(Math.sqrt(best)<kR){a.active=false;return;}
      if(!influence.has(bi))influence.set(bi,[]);
      influence.get(bi).push(ai);
    });
    if(influence.size===0)break;
    /* Grow new nodes */
    const newNodes=[];
    influence.forEach((ais,ni)=>{
      if(nodes.length+newNodes.length>=maxB)return;
      const n=nodes[ni];let dx=0,dy=0;
      ais.forEach(ai=>{const a=attrs[ai];const d=Math.sqrt((a.x-n.x)**2+(a.y-n.y)**2)+.001;dx+=(a.x-n.x)/d;dy+=(a.y-n.y)/d;});
      const dl=Math.sqrt(dx*dx+dy*dy)+.001;
      newNodes.push({x:n.x+dx/dl*kI,y:n.y+dy/dl*kI,px:ni,depth:n.depth+1});
    });
    newNodes.forEach(n=>nodes.push(n));
    setPr(step/MAX_STEPS*100);
  }
  /* Render branches */
  const maxD=Math.max(...nodes.map(n=>n.depth))||1;
  nodes.forEach((n,i)=>{
    if(n.px<0)return;
    const par=nodes[n.px];
    const t=n.depth/maxD;
    ctx.strokeStyle=pcol(p,t,0.85);
    ctx.lineWidth=Math.max(0.4,lw*(1-t*.8));
    ctx.beginPath();ctx.moveTo(par.x,par.y);ctx.lineTo(n.x,n.y);ctx.stroke();
  });
  setI(`${nodes.length} nodes, ${attrs.filter(a=>!a.active).length} consumed`);
}

function reaction_diffusion_b(W,H,p){
  const preset=gp('rb_pr'),iters=gp('rb_it'),sc=gp('rb_sc')|1;
  const PRESETS={
    coral:   {f:.0545,k:.062},
    fingerprint:{f:.055,k:.0625},
    sponge:  {f:.026,k:.051},
    bacteria:{f:.034,k:.056},
    maze:    {f:.029,k:.057},
    spots:   {f:.018,k:.051},
    mitosis: {f:.028,k:.053},
    labyrinths:{f:.037,k:.06}
  };
  const {f,k}=PRESETS[preset]||PRESETS.coral;
  const cw=Math.ceil(W/sc),ch=Math.ceil(H/sc);
  let A=new Float32Array(cw*ch).fill(1),B=new Float32Array(cw*ch);
  const Da=1.0,Db=0.5;
  /* Seed with irregular organic blobs rather than random points */
  const nSeeds=Math.floor(rng()*8+4);
  for(let s=0;s<nSeeds;s++){
    const sx=ri(2,cw-3),sy=ri(2,ch-3),sr=ri(2,8);
    for(let dy=-sr;dy<=sr;dy++)for(let dx=-sr;dx<=sr;dx++){
      if(dx*dx+dy*dy<=sr*sr){const i=(sy+dy)*cw+(sx+dx);if(i>=0&&i<cw*ch){A[i]=0.5+rng()*.4;B[i]=0.25+rng()*.4;}}
    }
  }
  const An=new Float32Array(cw*ch),Bn=new Float32Array(cw*ch);
  const idx=(x,y)=>((y+ch)%ch)*cw+((x+cw)%cw);
  for(let it=0;it<iters;it++){
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
      const i=idx(x,y),a=A[i],b=B[i];
      const la=(A[idx(x-1,y)]+A[idx(x+1,y)]+A[idx(x,y-1)]+A[idx(x,y+1)]-4*a);
      const lb=(B[idx(x-1,y)]+B[idx(x+1,y)]+B[idx(x,y-1)]+B[idx(x,y+1)]-4*b);
      const abb=a*b*b;
      An[i]=Math.max(0,Math.min(1,a+Da*la-abb+f*(1-a)));
      Bn[i]=Math.max(0,Math.min(1,b+Db*lb+abb-(k+f)*b));
    }
    A.set(An);B.set(Bn);
    if(it%20===0)setPr(it/iters*100);
  }
  const img2=ctx.createImageData(cw,ch);
  const[r1,g1,b1]=h2r(p.c[0]);const[r2,g2,b2]=h2r(p.c[p.c.length-1]);
  const[r3,g3,b3]=h2r(p.bg);
  for(let i=0;i<cw*ch;i++){
    const t=Math.max(0,Math.min(1,(A[i]-B[i]+1)/2));
    const pi=i*4;
    img2.data[pi]=lerp(r3,r2,t)|0;img2.data[pi+1]=lerp(g3,g2,t)|0;img2.data[pi+2]=lerp(b3,b2,t)|0;img2.data[pi+3]=255;
  }
  const tmp2=document.createElement('canvas');tmp2.width=cw;tmp2.height=ch;tmp2.getContext('2d').putImageData(img2,0,0);
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  ctx.drawImage(tmp2,0,0,W,H);
  setI(`RD ${preset} f=${f} k=${k} iter=${iters}`);
}

function hydraulic_erosion(W,H,p){
  const res=gp('he_res'),drops=gp('he_dr'),cap=gp('he_cap'),er=gp('he_er'),dep=gp('he_dep');
  const cw=Math.floor(W/res),ch=Math.floor(H/res);
  /* Height field with fBm base terrain */
  const ns=ri(0,99999);
  const ht=new Float32Array(cw*ch);
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
    let v=0,a=.5,f=1,m=0;
    for(let o=0;o<6;o++){v+=vn(x/cw*4*f,y/ch*4*f,ns+o*100)*a;m+=a;a*=.5;f*=2.1;}
    ht[y*cw+x]=v/m;
  }
  const sed=new Float32Array(cw*ch);
  const tidx=(x,y)=>Math.max(0,Math.min(ch-1,y|0))*cw+Math.max(0,Math.min(cw-1,x|0));
  /* Simulate droplets */
  for(let d=0;d<drops;d++){
    let x=rng()*cw,y=rng()*ch,vx=0,vy=0,water=1,sediment=0,speed=1;
    for(let step=0;step<120;step++){
      const xi=x|0,yi=y|0;
      if(xi<1||xi>=cw-1||yi<1||yi>=ch-1)break;
      const h00=ht[tidx(xi,yi)],h10=ht[tidx(xi+1,yi)],h01=ht[tidx(xi,yi+1)],h11=ht[tidx(xi+1,yi+1)];
      const gx=h00-h10+(h01-h11);const gy=h00-h01+(h10-h11);
      vx=vx*.05+gx*.95;vy=vy*.05+gy*.95;
      const spd=Math.sqrt(vx*vx+vy*vy)+.001;
      const nx=x+vx/spd,ny=y+vy/spd;
      const drop=Math.max(0,ht[tidx(x,y)]-ht[tidx(nx,ny)]);
      const sedCap=Math.max(.01,drop*spd*water*cap);
      if(sediment>sedCap){const amount=(sediment-sedCap)*dep;ht[tidx(x,y)]+=amount;sed[tidx(x,y)]+=amount;sediment-=amount;}
      else{const amount=Math.min((sedCap-sediment)*er,drop);ht[tidx(x,y)]-=amount;sed[tidx(x,y)]-=amount;sediment+=amount;}
      x=nx;y=ny;water*=0.97;
    }
    if(d%1000===0)setPr(d/drops*100);
  }
  /* Render height + sediment combined */
  const img3=ctx.createImageData(cw,ch);
  let minH=Infinity,maxH=-Infinity;for(let i=0;i<cw*ch;i++){if(ht[i]<minH)minH=ht[i];if(ht[i]>maxH)maxH=ht[i];}
  const rng2=maxH-minH||1;
  for(let i=0;i<cw*ch;i++){
    const t=(ht[i]-minH)/rng2;
    const col=pcol(p,t,1).match(/\d+/g).map(Number);
    const pi=i*4;img3.data[pi]=col[0];img3.data[pi+1]=col[1];img3.data[pi+2]=col[2];img3.data[pi+3]=255;
  }
  const tmp3=document.createElement('canvas');tmp3.width=cw;tmp3.height=ch;tmp3.getContext('2d').putImageData(img3,0,0);
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);ctx.drawImage(tmp3,0,0,W,H);
  setI(`Hydraulic erosion ${drops} drops`);
}

function cell_growth(W,H,p){
  const nC=gp('cg2_n'),iters=gp('cg2_it'),press=gp('cg2_pr'),style=gp('cg2_st');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  /* Start with a cluster of cells, each a circle */
  const cells=Array.from({length:nC},(_,i)=>{
    const a=i/nC*Math.PI*2,d=rng()*Math.min(W,H)*.15;
    return{x:W/2+Math.cos(a)*d,y:H/2+Math.sin(a)*d,r:8+rng()*12,t:i/nC};
  });
  /* Push cells apart (pressure) and let them divide */
  for(let it=0;it<iters;it++){
    cells.forEach((c,i)=>{
      cells.forEach((d,j)=>{
        if(i===j)return;
        const dx=c.x-d.x,dy=c.y-d.y,dist=Math.sqrt(dx*dx+dy*dy)+.01;
        const minD=c.r+d.r;
        if(dist<minD){const f=(minD-dist)*press*.05;c.x+=dx/dist*f;c.y+=dy/dist*f;}
      });
      /* Boundary pressure */
      const mg=c.r;
      if(c.x<mg)c.x=mg;if(c.x>W-mg)c.x=W-mg;
      if(c.y<mg)c.y=mg;if(c.y>H-mg)c.y=H-mg;
    });
    /* Occasional division */
    if(it<iters*.6&&cells.length<200&&rng()<.08){
      const parent=cells[ri(0,cells.length-1)];
      const a=rng()*Math.PI*2;
      cells.push({x:parent.x+Math.cos(a)*parent.r*.8,y:parent.y+Math.sin(a)*parent.r*.8,r:parent.r*(0.5+rng()*.3),t:rng()});
    }
    if(it%10===0)setPr(it/iters*100);
  }
  /* Render */
  cells.forEach((c,i)=>{
    const col=pcol(p,c.t,0.82);
    ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
    if(style==='fill'||style==='both'){ctx.fillStyle=col;ctx.fill();}
    if(style==='outline'||style==='both'){ctx.strokeStyle=pcol(p,(c.t+.3)%1,.7);ctx.lineWidth=0.8;ctx.stroke();}
    /* Cell membrane highlight */
    if(style==='membrane'){
      const g=ctx.createRadialGradient(c.x-c.r*.3,c.y-c.r*.3,c.r*.1,c.x,c.y,c.r);
      g.addColorStop(0,pcol(p,(c.t+.5)%1,.15));g.addColorStop(1,col);
      ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle=pcol(p,c.t,.5);ctx.lineWidth=1.5;ctx.stroke();
    }
  });
  setI(`${cells.length} cells`);
}

function watercolor(W,H,p){
  const layers=gp('wc_l'),brush=gp('wc_b'),blur2=gp('wc_bl'),wet=gp('wc_w');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const ns=ri(0,99999);
  for(let li=0;li<layers;li++){
    const baseX=rr(W*.1,W*.9),baseY=rr(H*.1,H*.9);
    const col=pcol(p,li/layers,0.12+rng()*.1);
    const pts=Math.floor(brush*8+12);
    const rad=rr(W*.06,W*.22);
    /* Build irregular blob using noise-displaced circle */
    ctx.beginPath();
    for(let k=0;k<=pts;k++){
      const a=k/pts*Math.PI*2;
      const noiseR=rad*(0.7+vn(Math.cos(a)*2+ns,Math.sin(a)*2+li*10,ns+li)*wet*.6);
      const px=baseX+Math.cos(a)*noiseR;
      const py=baseY+Math.sin(a)*noiseR;
      k===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.closePath();
    /* Soft fill with slight stroke for edge bleed */
    ctx.fillStyle=col;ctx.fill();
    /* Edge texture: multiple thin strokes at boundary */
    const edgeCol=pcol(p,(li/layers+.15)%1,0.06+rng()*.05);
    for(let edge=0;edge<3;edge++){
      ctx.beginPath();
      for(let k=0;k<=pts;k++){
        const a=k/pts*Math.PI*2+rng()*.05;
        const noiseR=rad*(0.72+vn(Math.cos(a)*2+ns+edge,Math.sin(a)*2+li*10,ns+li+edge)*wet*.55);
        const px=baseX+Math.cos(a)*noiseR;const py=baseY+Math.sin(a)*noiseR;
        k===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.strokeStyle=edgeCol;ctx.lineWidth=0.5+rng();ctx.stroke();
    }
    /* Interior granulation: small dots mimicking pigment settling */
    const dots=Math.floor(rad*1.5);
    for(let d=0;d<dots;d++){
      const a2=rng()*Math.PI*2;const r2=rng()*rad*.8;
      const px=baseX+Math.cos(a2)*r2,py=baseY+Math.sin(a2)*r2;
      const grainT=vn(px/W*5,py/H*5,ns+li*100);
      ctx.fillStyle=pcol(p,(li/layers+grainT*.3)%1,0.04+grainT*.06);
      ctx.beginPath();ctx.arc(px,py,0.5+rng()*1.5,0,Math.PI*2);ctx.fill();
    }
    setPr(li/layers*100);
  }
  setI(`Watercolor ${layers} layers, brush=${brush}`);
}

function diatom(W,H,p){
  const sym=gp('dt_sym'),rings=gp('dt_ri'),pts=gp('dt_pt'),lw=gp('dt_lw'),count=gp('dt_co');
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const ns=ri(0,99999);
  const cells=Math.min(count,12);
  const grid=Math.ceil(Math.sqrt(cells));
  const cw2=W/grid,ch2=H/grid;
  for(let ci=0;ci<cells;ci++){
    const gx=(ci%grid+.5)*cw2,gy=(Math.floor(ci/grid)+.5)*ch2;
    const maxR=Math.min(cw2,ch2)*.44;
    const rot=rng()*Math.PI*2;
    /* Draw concentric rings with noise displacement */
    for(let ri2=0;ri2<rings;ri2++){
      const r=maxR*(ri2+1)/rings;
      const nAmp=r*.12+ri2*.04;
      ctx.strokeStyle=pcol(p,ri2/rings,(0.5+ri2/rings*.5)*0.85);
      ctx.lineWidth=lw*(1-ri2/rings*.5);
      ctx.beginPath();
      for(let k=0;k<=pts*sym;k++){
        const a=k/(pts*sym)*Math.PI*2+rot;
        const symA=Math.floor(k/pts)*Math.PI*2/sym;
        const nv=vn(Math.cos(symA)*3+ns+ri2,Math.sin(symA)*3+ns+ri2+100,ns);
        const nr=r+nAmp*(nv-.5)*2;
        const px=gx+Math.cos(a)*nr,py=gy+Math.sin(a)*nr;
        k===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.stroke();
    }
    /* Radial spines / ribs */
    for(let sp=0;sp<sym;sp++){
      const a=sp/sym*Math.PI*2+rot;
      ctx.strokeStyle=pcol(p,.8,.6);ctx.lineWidth=lw*.6;
      ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+Math.cos(a)*maxR*.95,gy+Math.sin(a)*maxR*.95);ctx.stroke();
      /* Pore dots along each rib */
      for(let d=1;d<5;d++){
        const r2=maxR*d/5;
        const nx=gx+Math.cos(a)*r2,ny=gy+Math.sin(a)*r2;
        ctx.fillStyle=pcol(p,d/5,.7);
        ctx.beginPath();ctx.arc(nx,ny,1+lw,0,Math.PI*2);ctx.fill();
      }
    }
    /* Central nucleus */
    ctx.fillStyle=pcol(p,1,.8);ctx.beginPath();ctx.arc(gx,gy,maxR*.07,0,Math.PI*2);ctx.fill();
  }
  setI(`${cells} diatoms, ${sym}-fold symmetry`);
}

function fungal_network(W,H,p){
  const seeds=gp('fn_se'),steps=gp('fn_st'),angle=gp('fn_an')*Math.PI/180,taper=gp('fn_tp'),anast=gp('fn_an2')/100;
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
  const ns=ri(0,99999);
  /* Grow hyphal branches from multiple seed points */
  const hyphae=[];
  /* Create seed nodes */
  for(let s=0;s<seeds;s++){
    const x=rr(W*.1,W*.9),y=rr(H*.1,H*.9);
    const nBranches=ri(2,5);
    for(let b=0;b<nBranches;b++){
      hyphae.push({x,y,a:rng()*Math.PI*2,gen:0,w:1.5+rng()*1.5,alive:true});
    }
  }
  /* All tip points for anastomosis check */
  const allPts=[];
  for(let step=0;step<steps;step++){
    const newH=[];
    hyphae.forEach(h=>{
      if(!h.alive)return;
      /* Drift angle using noise */
      const drift=vn(h.x/W*6,h.y/H*6,ns+step*.01)*angle*2-angle;
      h.a+=drift*.4+(rng()-.5)*angle*.5;
      const stepLen=8+rng()*4;
      const nx=h.x+Math.cos(h.a)*stepLen,ny=h.y+Math.sin(h.a)*stepLen;
      if(nx<0||nx>W||ny<0||ny>H){h.alive=false;return;}
      /* Anastomosis: if near another hypha, fuse and stop */
      let fused=false;
      if(rng()<anast){
        for(const pt of allPts){
          if(Math.hypot(nx-pt.x,ny-pt.y)<10&&h.gen>0){
            ctx.strokeStyle=pcol(p,h.gen/8,.5);ctx.lineWidth=Math.max(.3,h.w*taper**h.gen);
            ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.lineTo(pt.x,pt.y);ctx.stroke();
            h.alive=false;fused=true;break;
          }
        }
      }
      if(fused)return;
      /* Draw segment */
      ctx.strokeStyle=pcol(p,h.gen/8+rng()*.1,.6+rng()*.3);
      ctx.lineWidth=Math.max(.3,h.w*Math.pow(taper,h.gen));
      ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.lineTo(nx,ny);ctx.stroke();
      h.x=nx;h.y=ny;
      allPts.push({x:nx,y:ny});
      /* Branching */
      if(rng()<.07&&h.gen<6&&hyphae.length+newH.length<800){
        newH.push({x:h.x,y:h.y,a:h.a+(rng()<.5?angle:-angle)*(1+rng()),gen:h.gen+1,w:h.w*.7,alive:true});
      }
    });
    newH.forEach(h=>hyphae.push(h));
    if(step%(steps/5|0)===0)setPr(step/steps*100);
  }
  setI(`Fungal net: ${seeds} seeds, ${hyphae.length} hyphae`);
}

/* ── Expose on window ── */
window.physarum=physarum;
window.space_colonization=space_colonization;
window.reaction_diffusion_b=reaction_diffusion_b;
window.hydraulic_erosion=hydraulic_erosion;
window.cell_growth=cell_growth;
window.watercolor=watercolor;
window.diatom=diatom;
window.fungal_network=fungal_network;
