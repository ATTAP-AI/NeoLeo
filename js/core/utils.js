/*  js/core/utils.js  — Pure utility / math helpers
 *  Loaded via <script> tag. Everything exposed on window.* for
 *  backward-compat with the monolith.
 */

/* ── Seeded PRNG ── */
let _s=1;
const seed=v=>{_s=(v>>>0)||1;};
const rng=()=>{_s|=0;_s=(_s+0x6D2B79F5)|0;let t=Math.imul(_s^(_s>>>15),1|_s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const rr=(a,b)=>a+rng()*(b-a);
const ri=(a,b)=>Math.floor(rr(a,b+.999));
const rp=a=>a[ri(0,a.length-1)];

/* ── Value noise ── */
const vn=(x,y,sd)=>{const xi=x|0,yi=y|0,xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const h=(a,b)=>{let n=(a*1619+b*31337+sd*6971)^(a*b*1543);n=((n>>8)^n)*1103515245+12345;return((n>>16)&0x7fff)/32767;};return h(xi,yi)*(1-u)*(1-v)+h(xi+1,yi)*u*(1-v)+h(xi,yi+1)*(1-u)*v+h(xi+1,yi+1)*u*v;};

/* ── Fractal Brownian Motion ── */
const fbm=(x,y,sd)=>{let v=0,a=.5,f=1,m=0;for(let i=0;i<5;i++){v+=vn(x*f,y*f,sd+i*100)*a;m+=a;a*=.5;f*=2;}return v/m;};

/* ── Color / math helpers ── */
const lerp=(a,b,t)=>a+(b-a)*t;
const h2r=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const pcol=(p,t,a=1)=>{const c=p.c,s=Math.max(0,Math.min(1,t))*(c.length-1),i=s|0,f=s-i;const[r1,g1,b1]=h2r(c[Math.min(i,c.length-1)]);const[r2,g2,b2]=h2r(c[Math.min(i+1,c.length-1)]);return`rgba(${lerp(r1,r2,f)|0},${lerp(g1,g2,f)|0},${lerp(b1,b2,f)|0},${a})`;};
function clamp(v,mn,mx){return Math.max(mn,Math.min(mx,v));}

/* ── Expose on window ── */
window.seed=seed;
window.rng=rng;
window.rr=rr;
window.ri=ri;
window.rp=rp;
window.vn=vn;
window.fbm=fbm;
window.lerp=lerp;
window.h2r=h2r;
window.pcol=pcol;
window.clamp=clamp;
