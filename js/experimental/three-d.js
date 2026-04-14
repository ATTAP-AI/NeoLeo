/* ══════════════════════════════════════════════════════════
   NEOLEO 3D — Software 3D renderer on 2D canvas
   Renders 3D primitives with z-buffer, Phong lighting,
   perspective projection, and palette-driven materials.
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── Palette ── */
function palCols(){
  var p=typeof gpal==='function'?gpal():null;
  if(p&&p.c&&p.c.length) return p.c;
  return['#ff6040','#ffb060','#40c8ff','#a080ff','#60ffa0'];
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
var PI=Math.PI,TAU=PI*2,sin=Math.sin,cos=Math.cos,sqrt=Math.sqrt,abs=Math.abs,floor=Math.floor,min=Math.min,max=Math.max;

function v3add(a,b){return[a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function v3sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function v3mul(a,s){return[a[0]*s,a[1]*s,a[2]*s];}
function v3dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function v3cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function v3len(a){return sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);}
function v3norm(a){var l=v3len(a)||1;return[a[0]/l,a[1]/l,a[2]/l];}

/* ── Matrix helpers (4x4, column-major) ── */
function m4identity(){return[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];}
function m4rotX(a){var c=cos(a),s=sin(a);return[1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];}
function m4rotY(a){var c=cos(a),s=sin(a);return[c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];}
function m4rotZ(a){var c=cos(a),s=sin(a);return[c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1];}
function m4mul(a,b){
  var r=new Array(16);
  for(var i=0;i<4;i++)for(var j=0;j<4;j++){
    r[j*4+i]=a[i]*b[j*4]+a[4+i]*b[j*4+1]+a[8+i]*b[j*4+2]+a[12+i]*b[j*4+3];
  }
  return r;
}
function m4xv3(m,v){
  return[m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12],
         m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13],
         m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]];
}
function m4xDir(m,v){
  return[m[0]*v[0]+m[4]*v[1]+m[8]*v[2],
         m[1]*v[0]+m[5]*v[1]+m[9]*v[2],
         m[2]*v[0]+m[6]*v[1]+m[10]*v[2]];
}

/* ── 3D Shapes — parametric mesh generators ── */
var SHAPES=[
  {name:'Sphere',        fn:genSphere,   desc:'A perfect sphere — the simplest closed 3D surface.'},
  {name:'Cube',          fn:genCube,     desc:'Six planar faces meeting at right angles — the Platonic hexahedron.'},
  {name:'Cylinder',      fn:genCylinder, desc:'A circular cross-section swept along a linear axis.'},
  {name:'Cone',          fn:genCone,     desc:'A circle tapering to a point — a ruled surface.'},
  {name:'Torus',         fn:genTorus,    desc:'A ring — the product of two circles in orthogonal planes.'},
  {name:'Icosahedron',   fn:genIcosa,    desc:'Twenty equilateral triangular faces — a Platonic solid.'},
  {name:'Octahedron',    fn:genOcta,     desc:'Eight equilateral triangles — dual of the cube.'},
  {name:'Capsule',       fn:genCapsule,  desc:'A cylinder capped with hemispheres — a swept sphere.'},
  {name:'Torus Knot',    fn:genTorusKnot,desc:'A closed curve wound around a torus that never self-intersects.'},
  {name:'Super\u00ADellipsoid',fn:genSuperEllipsoid, desc:'A continuous family of shapes from sphere through cube through star.'},
  {name:'Spring',        fn:genSpring,   desc:'A helical coil — a torus swept along a spiral path.'},
  {name:'M\u00F6bius Strip',fn:genMobius,desc:'A surface with only one side and one edge — a topological oddity.'}
];

function genSphere(res){
  var verts=[],faces=[],norms=[],uvs=[];
  for(var i=0;i<=res;i++){
    var phi=PI*i/res;
    for(var j=0;j<=res;j++){
      var theta=TAU*j/res;
      var x=sin(phi)*cos(theta),y=cos(phi),z=sin(phi)*sin(theta);
      verts.push([x,y,z]);
      norms.push([x,y,z]);
      uvs.push([j/res,i/res]);
    }
  }
  for(var i=0;i<res;i++)for(var j=0;j<res;j++){
    var a=i*(res+1)+j,b=a+1,c=a+res+1,d=c+1;
    faces.push([a,c,d,b]);
  }
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genCube(res){
  var verts=[],faces=[],norms=[],uvs=[];
  var dirs=[[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,1,0],[0,0,-1]],
            [[0,1,0],[1,0,0],[0,0,1]],[[0,-1,0],[1,0,0],[0,0,-1]],
            [[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[-1,0,0],[0,1,0]]];
  var r=max(2,floor(res/4));
  dirs.forEach(function(d){
    var norm=d[0],right=d[1],up=d[2],base=verts.length;
    for(var i=0;i<=r;i++)for(var j=0;j<=r;j++){
      var u=i/r*2-1,v2=j/r*2-1;
      verts.push([norm[0]+right[0]*u+up[0]*v2, norm[1]+right[1]*u+up[1]*v2, norm[2]+right[2]*u+up[2]*v2]);
      norms.push(norm.slice());
      uvs.push([i/r,j/r]);
    }
    for(var i=0;i<r;i++)for(var j=0;j<r;j++){
      var a=base+i*(r+1)+j,b=a+1,c=a+r+1,d2=c+1;
      faces.push([a,c,d2,b]);
    }
  });
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genCylinder(res){
  var verts=[],faces=[],norms=[],uvs=[],h=1.6;
  for(var i=0;i<=res;i++){
    var v2=i/res,y=v2*h-h/2;
    for(var j=0;j<=res;j++){
      var u=j/res,theta=TAU*u;
      var x=cos(theta),z=sin(theta);
      verts.push([x,y,z]);
      norms.push([x,0,z]);
      uvs.push([u,v2]);
    }
  }
  for(var i=0;i<res;i++)for(var j=0;j<res;j++){
    var a=i*(res+1)+j,b=a+1,c=a+res+1,d=c+1;
    faces.push([a,c,d,b]);
  }
  var topC=verts.length;verts.push([0,h/2,0]);norms.push([0,1,0]);uvs.push([0.5,0.5]);
  var botC=verts.length;verts.push([0,-h/2,0]);norms.push([0,-1,0]);uvs.push([0.5,0.5]);
  for(var j=0;j<res;j++){
    var a=res*(res+1)+j,b=a+1;
    faces.push([topC,a,b,topC]);
    var c=j,d2=j+1;
    faces.push([botC,d2,c,botC]);
  }
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genCone(res){
  var verts=[],faces=[],norms=[],uvs=[],h=2;
  var apex=verts.length;verts.push([0,h/2,0]);norms.push([0,1,0]);uvs.push([0.5,0]);
  for(var i=0;i<=res;i++){
    var v2=i/res,y=h/2-v2*h,r=v2;
    for(var j=0;j<=res;j++){
      var theta=TAU*j/res;
      var x=r*cos(theta),z=r*sin(theta);
      verts.push([x,y,z]);
      var sl=1/sqrt(1+h*h/(1+0.01));
      norms.push(v3norm([cos(theta)*h,1,sin(theta)*h]));
      uvs.push([j/res,v2]);
    }
  }
  for(var j=0;j<res;j++){faces.push([apex,1+j,1+j+1,apex]);}
  for(var i=0;i<res;i++)for(var j=0;j<res;j++){
    var a=1+i*(res+1)+j,b=a+1,c=a+res+1,d=c+1;
    faces.push([a,c,d,b]);
  }
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genTorus(res){
  var verts=[],faces=[],norms=[],uvs=[],R=0.7,r=0.35;
  for(var i=0;i<=res;i++){
    var phi=TAU*i/res;
    for(var j=0;j<=res;j++){
      var theta=TAU*j/res;
      var x=(R+r*cos(theta))*cos(phi),y=r*sin(theta),z=(R+r*cos(theta))*sin(phi);
      verts.push([x,y,z]);
      norms.push(v3norm([cos(theta)*cos(phi),sin(theta),cos(theta)*sin(phi)]));
      uvs.push([i/res,j/res]);
    }
  }
  for(var i=0;i<res;i++)for(var j=0;j<res;j++){
    var a=i*(res+1)+j,b=a+1,c=a+res+1,d=c+1;
    faces.push([a,c,d,b]);
  }
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genIcosa(){
  var t=(1+sqrt(5))/2,verts=[],norms=[],faces=[],uvs=[];
  var iv=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
  iv.forEach(function(v){var n=v3norm(v);verts.push(n);norms.push(n);uvs.push([0.5+Math.atan2(n[2],n[0])/TAU,0.5-Math.asin(clamp(n[1],-1,1))/PI]);});
  var fi=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
          [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  function midpoint(a,b){return v3norm(v3mul(v3add(verts[a],verts[b]),0.5));}
  var cache={};
  function getMid(a,b){var key=min(a,b)+'-'+max(a,b);if(cache[key]!==undefined)return cache[key];var m=midpoint(a,b);var idx=verts.length;verts.push(m);norms.push(m);uvs.push([0.5+Math.atan2(m[2],m[0])/TAU,0.5-Math.asin(clamp(m[1],-1,1))/PI]);cache[key]=idx;return idx;}
  var nf=[];
  fi.forEach(function(f){
    var a=getMid(f[0],f[1]),b=getMid(f[1],f[2]),c=getMid(f[2],f[0]);
    nf.push([f[0],a,c]);nf.push([f[1],b,a]);nf.push([f[2],c,b]);nf.push([a,b,c]);
  });
  nf.forEach(function(f){faces.push([f[0],f[1],f[2],f[2]]);});
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genOcta(){
  var verts=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  var norms=verts.map(function(v){return v.slice();});
  var uvs=verts.map(function(v){return[0.5+Math.atan2(v[2],v[0])/TAU,0.5-Math.asin(clamp(v[1],-1,1))/PI];});
  var fi=[[0,2,4],[0,4,3],[0,3,5],[0,5,2],[1,4,2],[1,3,4],[1,5,3],[1,2,5]];
  var faces=fi.map(function(f){return[f[0],f[1],f[2],f[2]];});
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genCapsule(res){
  var verts=[],faces=[],norms=[],uvs=[],h=0.8,r=0.6;
  var halfRes=floor(res/2);
  var totalRows=halfRes+1+res+1+halfRes+1;
  var row=0;
  for(var i=0;i<=halfRes;i++,row++){
    var phi=PI*0.5*i/halfRes;
    for(var j=0;j<=res;j++){
      var theta=TAU*j/res;
      verts.push([r*sin(phi)*cos(theta),r*cos(phi)+h,r*sin(phi)*sin(theta)]);
      norms.push([sin(phi)*cos(theta),cos(phi),sin(phi)*sin(theta)]);
      uvs.push([j/res,row/(totalRows-1)]);
    }
  }
  for(var i=0;i<=res;i++,row++){
    var v2=i/res,y=h-v2*h*2;
    for(var j=0;j<=res;j++){
      var theta=TAU*j/res;
      verts.push([r*cos(theta),y,r*sin(theta)]);
      norms.push([cos(theta),0,sin(theta)]);
      uvs.push([j/res,row/(totalRows-1)]);
    }
  }
  for(var i=0;i<=halfRes;i++,row++){
    var phi=PI*0.5+PI*0.5*i/halfRes;
    for(var j=0;j<=res;j++){
      var theta=TAU*j/res;
      verts.push([r*sin(phi)*cos(theta),r*cos(phi)-h,r*sin(phi)*sin(theta)]);
      norms.push(v3norm([sin(phi)*cos(theta),cos(phi),sin(phi)*sin(theta)]));
      uvs.push([j/res,row/(totalRows-1)]);
    }
  }
  for(var i=0;i<totalRows-1;i++)for(var j=0;j<res;j++){
    var a=i*(res+1)+j,b=a+1,c=a+res+1,d=c+1;
    if(c<verts.length&&d<verts.length)faces.push([a,c,d,b]);
  }
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genTorusKnot(res){
  var verts=[],faces=[],norms=[],uvs=[],p=2,q=3,R=0.6,r=0.15;
  var segs=res*3,tubSegs=max(8,floor(res/3));
  // Compute spine
  var spine=[];
  for(var i=0;i<=segs;i++){
    var t=TAU*i/segs;
    var cx=(R+0.3*cos(q*t))*cos(p*t),cy=0.3*sin(q*t),cz=(R+0.3*cos(q*t))*sin(p*t);
    spine.push([cx,cy,cz]);
  }
  // Frenet frame + tube
  for(var i=0;i<=segs;i++){
    var i0=i%segs,i1=(i+1)%segs;
    var T=v3norm(v3sub(spine[i1],spine[i0]));
    var up=abs(T[1])>0.9?[1,0,0]:[0,1,0];
    var N=v3norm(v3cross(T,up));
    var B=v3cross(T,N);
    for(var j=0;j<=tubSegs;j++){
      var theta=TAU*j/tubSegs;
      var cx2=r*cos(theta),cy2=r*sin(theta);
      var pt=v3add(spine[i],v3add(v3mul(N,cx2),v3mul(B,cy2)));
      var nm=v3norm(v3add(v3mul(N,cos(theta)),v3mul(B,sin(theta))));
      verts.push(pt);norms.push(nm);uvs.push([i/segs,j/tubSegs]);
    }
  }
  for(var i=0;i<segs;i++)for(var j=0;j<tubSegs;j++){
    var a=i*(tubSegs+1)+j,b=a+1,c=a+tubSegs+1,d=c+1;
    faces.push([a,c,d,b]);
  }
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genSuperEllipsoid(res){
  var verts=[],faces=[],norms=[],uvs=[];
  var e1=0.3,e2=0.3;
  function spow(v,p){return Math.sign(v)*Math.pow(abs(v),p);}
  for(var i=0;i<=res;i++){
    var phi=-PI/2+PI*i/res;
    for(var j=0;j<=res;j++){
      var theta=-PI+TAU*j/res;
      var x=spow(cos(phi),e1)*spow(cos(theta),e2);
      var y=spow(cos(phi),e1)*spow(sin(theta),e2);
      var z=spow(sin(phi),e1);
      verts.push([x,z,y]);
      norms.push(v3norm([spow(cos(phi),2-e1)*spow(cos(theta),2-e2),
                         spow(sin(phi),2-e1),
                         spow(cos(phi),2-e1)*spow(sin(theta),2-e2)]));
      uvs.push([j/res,i/res]);
    }
  }
  for(var i=0;i<res;i++)for(var j=0;j<res;j++){
    var a=i*(res+1)+j,b=a+1,c=a+res+1,d=c+1;
    faces.push([a,c,d,b]);
  }
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genSpring(res){
  var verts=[],faces=[],norms=[],uvs=[];
  var coils=3,R=0.5,r=0.12,h=2;
  var segs=res*coils,tubSegs=max(8,floor(res/3));
  var spine=[];
  for(var i=0;i<=segs;i++){
    var t=i/segs;
    var theta=TAU*coils*t;
    spine.push([R*cos(theta), t*h-h/2, R*sin(theta)]);
  }
  for(var i=0;i<=segs;i++){
    var i0=clamp(i,0,segs-1),i1=clamp(i+1,0,segs);
    var T=v3norm(v3sub(spine[min(i1,segs)],spine[max(i0,0)]));
    var up=abs(T[1])>0.9?[1,0,0]:[0,1,0];
    var N=v3norm(v3cross(T,up)),B=v3cross(T,N);
    for(var j=0;j<=tubSegs;j++){
      var theta=TAU*j/tubSegs;
      var pt=v3add(spine[min(i,segs)],v3add(v3mul(N,r*cos(theta)),v3mul(B,r*sin(theta))));
      var nm=v3norm(v3add(v3mul(N,cos(theta)),v3mul(B,sin(theta))));
      verts.push(pt);norms.push(nm);uvs.push([i/segs,j/tubSegs]);
    }
  }
  for(var i=0;i<segs;i++)for(var j=0;j<tubSegs;j++){
    var a=i*(tubSegs+1)+j,b=a+1,c=a+tubSegs+1,d=c+1;
    faces.push([a,c,d,b]);
  }
  return{v:verts,f:faces,n:norms,uv:uvs};
}

function genMobius(res){
  var verts=[],faces=[],norms=[],uvs=[],R=0.7,w=0.35;
  for(var i=0;i<=res;i++){
    var u=TAU*i/res;
    for(var j=0;j<=res;j++){
      var v2=(j/res)*2-1;
      var halfU=u/2;
      var x=(R+w*v2*cos(halfU))*cos(u);
      var y=(R+w*v2*cos(halfU))*sin(u);
      var z=w*v2*sin(halfU);
      verts.push([x,z,y]);
      // Approximate normal via cross product of partial derivatives
      var du=0.01,dv=0.01;
      var u2=u+du,v3=v2+dv,h2=u2/2;
      var px2=(R+w*v2*cos(h2))*cos(u2),py2=(R+w*v2*cos(h2))*sin(u2),pz2=w*v2*sin(h2);
      var px3=(R+w*v3*cos(halfU))*cos(u),py3=(R+w*v3*cos(halfU))*sin(u),pz3=w*v3*sin(halfU);
      var dPdu=[px2-x,pz2-z,py2-y],dPdv=[px3-x,pz3-z,py3-y];
      norms.push(v3norm(v3cross(dPdu,dPdv)));
      uvs.push([i/res,j/res]);
    }
  }
  for(var i=0;i<res;i++)for(var j=0;j<res;j++){
    var a=i*(res+1)+j,b=a+1,c=a+res+1,d=c+1;
    faces.push([a,c,d,b]);
  }
  return{v:verts,f:faces,n:norms,uv:uvs};
}

/* ── State ── */
var S={shapeIdx:0, animating:false, animId:null};

function sv(id){var el=document.getElementById(id);return el?parseFloat(el.value):50;}

/* ── Main Render ── */
function doRender(targetCtx, targetW, targetH, clearBg){
  var tctx=targetCtx,W2=targetW,H2=targetH;
  if(!tctx){
    tctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
    if(!tctx)return;
    var cv=tctx.canvas;W2=cv.width;H2=cv.height;
    if(window._saveU)window._saveU();
  }

  var resolution=clamp(Math.round(sv('td-resolution')),6,200);
  var zoom=sv('td-zoom')/50;
  var rotX2=sv('td-rotx')/100*TAU;
  var rotY2=sv('td-roty')/100*TAU;
  var rotZ2=sv('td-rotz')/100*TAU;
  var lightAngle=sv('td-light')/100*TAU;
  var specPow=sv('td-specular')/100*80+2;
  var wireframe=sv('td-wireframe')/100;
  var ambient=0.12+sv('td-ambient')/100*0.4;

  // Generate mesh
  var mesh=SHAPES[S.shapeIdx].fn(resolution);
  var verts=mesh.v,faces=mesh.f,normals=mesh.n,meshUVs=mesh.uv||null;

  // Check for active texture mapping
  var texActive=window._TEX&&window._TEX.getActive&&window._TEX.getActive()&&window._TEX.sampleTexture;
  var texBump=window._TEX&&window._TEX.getBumpNormal;
  var bumpStr=0;
  if(texActive){var bs=document.getElementById('tex-bump-str');bumpStr=bs?(+bs.value/100):0.6;}

  // Build model matrix
  var modelMat=m4mul(m4rotZ(rotZ2),m4mul(m4rotY(rotY2),m4rotX(rotX2)));

  // Transform verts + normals
  var tv=new Array(verts.length),tn=new Array(normals.length);
  for(var i=0;i<verts.length;i++){
    tv[i]=m4xv3(modelMat,verts[i]);
    tn[i]=v3norm(m4xDir(modelMat,normals[i]));
  }

  // Perspective projection
  var fov=2.5*zoom;
  var camZ=3.0/zoom;
  var proj=[];
  for(var i=0;i<tv.length;i++){
    var z2=tv[i][2]+camZ;
    var scale=fov/(z2>0.01?z2:0.01);
    proj.push([tv[i][0]*scale*min(W2,H2)/2+W2/2, -tv[i][1]*scale*min(W2,H2)/2+H2/2, z2]);
  }

  // Light direction
  var lightDir=v3norm([cos(lightAngle)*0.7, -0.6, sin(lightAngle)*0.7]);
  var viewDir=[0,0,1];

  // Palette colors for face coloring
  var cols=palCols().map(hexToRgb);
  if(cols.length<1)cols=[[200,120,80]];

  // Sort faces back-to-front (painter's algorithm)
  var faceDist=[];
  for(var i=0;i<faces.length;i++){
    var f=faces[i];
    var avgZ=(proj[f[0]][2]+proj[f[1]][2]+proj[f[2]][2]+(f[3]!==f[2]?proj[f[3]][2]:proj[f[2]][2]))/(f[3]!==f[2]?4:3);
    faceDist.push({idx:i,z:avgZ});
  }
  faceDist.sort(function(a,b){return b.z-a.z;});

  // Clear
  if(clearBg!==false){
    var bg=typeof gpal==='function'&&gpal()&&gpal().bg?gpal().bg:'#0a0a12';
    tctx.fillStyle=bg;
    tctx.fillRect(0,0,W2,H2);
  }

  // Draw faces
  for(var fi2=0;fi2<faceDist.length;fi2++){
    var fIdx=faceDist[fi2].idx;
    var f=faces[fIdx];
    var isQuad=f[3]!==f[2];

    // Face normal (average vertex normals)
    var fn2;
    if(isQuad) fn2=v3norm(v3add(v3add(tn[f[0]],tn[f[1]]),v3add(tn[f[2]],tn[f[3]])));
    else fn2=v3norm(v3add(v3add(tn[f[0]],tn[f[1]]),tn[f[2]]));

    // Back-face cull
    var fc=isQuad?
      [(tv[f[0]][0]+tv[f[1]][0]+tv[f[2]][0]+tv[f[3]][0])/4,
       (tv[f[0]][1]+tv[f[1]][1]+tv[f[2]][1]+tv[f[3]][1])/4,
       (tv[f[0]][2]+tv[f[1]][2]+tv[f[2]][2]+tv[f[3]][2])/4]:
      [(tv[f[0]][0]+tv[f[1]][0]+tv[f[2]][0])/3,
       (tv[f[0]][1]+tv[f[1]][1]+tv[f[2]][1])/3,
       (tv[f[0]][2]+tv[f[1]][2]+tv[f[2]][2])/3];
    var toView=v3norm(v3sub([0,0,camZ],fc));
    if(v3dot(fn2,toView)<-0.05)continue;

    // Texture UV — average face UVs
    var faceU=0,faceV=0,hasUV=false;
    if(texActive&&meshUVs){
      var nv=isQuad?4:3;
      for(var vi=0;vi<nv;vi++){var uvi=meshUVs[f[vi]];if(uvi){faceU+=uvi[0];faceV+=uvi[1];}}
      faceU/=nv;faceV/=nv;hasUV=true;
    }

    // Bump-perturbed normal for texture mapping
    var shadingN=fn2;
    if(texActive&&hasUV&&texBump&&bumpStr>0){
      shadingN=v3norm(window._TEX.getBumpNormal(faceU,faceV,fn2,bumpStr));
    }

    // Phong shading
    var NdotL=clamp(v3dot(shadingN,lightDir),0,1);
    var diffuse=NdotL*0.7;
    var halfVec=v3norm(v3add(lightDir,viewDir));
    var NdotH=clamp(v3dot(shadingN,halfVec),0,1);
    var spec=Math.pow(NdotH,specPow)*0.5;

    var light2=ambient+diffuse;

    // Color: texture sample or palette
    var baseCol;
    if(texActive&&hasUV){
      var ts=window._TEX.sampleTexture(faceU,faceV);
      baseCol=ts?[ts.r,ts.g,ts.b]:cols[fIdx%cols.length];
    } else {
      baseCol=cols[fIdx%cols.length];
    }
    var r2=clamp(baseCol[0]*light2+spec*255,0,255);
    var g=clamp(baseCol[1]*light2+spec*255,0,255);
    var b=clamp(baseCol[2]*light2+spec*255,0,255);

    // Fill face
    tctx.beginPath();
    tctx.moveTo(proj[f[0]][0],proj[f[0]][1]);
    tctx.lineTo(proj[f[1]][0],proj[f[1]][1]);
    tctx.lineTo(proj[f[2]][0],proj[f[2]][1]);
    if(isQuad)tctx.lineTo(proj[f[3]][0],proj[f[3]][1]);
    tctx.closePath();

    if(wireframe<0.99){
      tctx.fillStyle='rgb('+Math.round(r2)+','+Math.round(g)+','+Math.round(b)+')';
      tctx.fill();
    }

    // Wireframe overlay
    if(wireframe>0.01){
      var wAlpha=wireframe*0.6;
      var wBright=clamp(light2*1.5,0.3,1);
      tctx.strokeStyle='rgba(255,255,255,'+wAlpha*wBright+')';
      tctx.lineWidth=0.5+wireframe*0.5;
      tctx.stroke();
    }
  }

  // Status
  var st=document.getElementById('td-status');
  if(st)st.textContent=SHAPES[S.shapeIdx].name+' — '+verts.length+' verts, '+faces.length+' faces';

  if(!targetCtx){
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  }
  return{verts:verts.length,faces:faces.length};
}

/* ── Controls ── */
function selectShape(idx){
  S.shapeIdx=clamp(idx,0,SHAPES.length-1);
  // Highlight active
  var list=document.getElementById('td-shape-list');
  if(list){
    var btns=list.querySelectorAll('button');
    btns.forEach(function(b,i){b.style.background=i===S.shapeIdx?'rgba(255,160,60,0.15)':'none';b.style.borderColor=i===S.shapeIdx?'#ffa03c':'var(--brd)';});
  }
  var desc=document.getElementById('td-desc');
  if(desc){desc.textContent=SHAPES[S.shapeIdx].desc;desc.style.display='block';}
  doRender();
}

function cycle(){
  var next=(S.shapeIdx+1)%SHAPES.length;
  selectShape(next);
  var lbl=document.getElementById('td-cycle-label');
  if(lbl){lbl.style.display='block';document.getElementById('td-cycle-name').textContent=(next+1)+'/'+SHAPES.length+' — '+SHAPES[next].name;}
}

function randomise(){
  S.shapeIdx=floor(Math.random()*SHAPES.length);
  // Randomize sliders
  var ids=['td-rotx','td-roty','td-rotz'];
  ids.forEach(function(id){var el=document.getElementById(id);if(el){el.value=Math.round(Math.random()*100);var vl=document.getElementById(id+'-v');if(vl)vl.textContent=el.value+'%';}});
  var dl=document.getElementById('td-light');if(dl){dl.value=Math.round(Math.random()*100);var vl=document.getElementById('td-light-v');if(vl)vl.textContent=dl.value+'%';}
  selectShape(S.shapeIdx);
}

function toggleAnim(){
  if(S.animating){
    S.animating=false;
    if(S.animId)cancelAnimationFrame(S.animId);
    var btn=document.getElementById('td-anim-btn');if(btn)btn.textContent='▶ Animate';
    return;
  }
  S.animating=true;
  var btn=document.getElementById('td-anim-btn');if(btn)btn.textContent='■ Stop';
  var ry=document.getElementById('td-roty');
  function frame(){
    if(!S.animating)return;
    if(ry){ry.value=(parseFloat(ry.value)+0.3)%100;var vl=document.getElementById('td-roty-v');if(vl)vl.textContent=Math.round(ry.value)+'%';}
    doRender();
    S.animId=requestAnimationFrame(frame);
  }
  frame();
}

/* ── Build shape list ── */
function buildShapeList(){
  var list=document.getElementById('td-shape-list');
  if(!list)return;
  list.innerHTML='';
  SHAPES.forEach(function(sh,i){
    var b=document.createElement('button');
    b.textContent=sh.name;
    b.style.cssText='display:inline-block;margin:0 4px 4px 0;padding:3px 8px;font-size:8px;font-family:inherit;background:none;border:1px solid var(--brd);color:#ffa03c;cursor:pointer;letter-spacing:.08em;';
    b.addEventListener('click',function(){selectShape(i);});
    list.appendChild(b);
  });
}

/* ── Wire sliders ── */
function wireSliders(){
  var ids=['td-resolution','td-zoom','td-rotx','td-roty','td-rotz','td-light','td-specular','td-wireframe','td-ambient'];
  ids.forEach(function(id){
    var el=document.getElementById(id);
    if(!el)return;
    el.addEventListener('input',function(){
      var vl=document.getElementById(id+'-v');
      if(vl){
        if(id==='td-resolution')vl.textContent=Math.round(el.value);
        else if(id==='td-zoom')vl.textContent=(el.value/50).toFixed(1)+'×';
        else vl.textContent=Math.round(el.value)+'%';
      }
      if(!S.animating)doRender();
    });
  });
}

/* ══════════════════════════════════════════════════════════
   OBJECT MODE — move, resize, rotate the rendered 3D object
   ══════════════════════════════════════════════════════════ */
var OBJ={
  active:false, img:null,
  x:0, y:0, w:0, h:0, angle:0,
  dragging:null, startX:0, startY:0,
  startOX:0, startOY:0, startW:0, startH:0, startAngle:0,
  overlay:null, octx:null
};
var HSIZE=6;

function ensureOverlay(){
  if(OBJ.overlay)return;
  var wrap=document.getElementById('cvwrap');if(!wrap)return;
  var c=document.createElement('canvas');
  c.id='td-obj-ov';
  c.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;z-index:50;pointer-events:none;';
  wrap.appendChild(c);
  OBJ.overlay=c; OBJ.octx=c.getContext('2d');
  syncOverlay();
}
function syncOverlay(){
  if(!OBJ.overlay)return;
  var wrap=document.getElementById('cvwrap');if(!wrap)return;
  var cv=wrap.querySelector('canvas:not(#td-obj-ov):not(#topo-obj-ov):not(#om-ov)');
  if(cv){OBJ.overlay.width=cv.width;OBJ.overlay.height=cv.height;}
}
function removeOverlay(){
  if(OBJ.overlay&&OBJ.overlay.parentNode)OBJ.overlay.parentNode.removeChild(OBJ.overlay);
  OBJ.overlay=null;OBJ.octx=null;
}

function getHandles(){
  var cx=OBJ.x+OBJ.w/2,cy=OBJ.y+OBJ.h/2,a=OBJ.angle;
  function rot(px,py){
    var dx=px-cx,dy=py-cy;
    return{x:cx+dx*cos(a)-dy*sin(a), y:cy+dx*sin(a)+dy*cos(a)};
  }
  return{
    nw:rot(OBJ.x,OBJ.y), n:rot(OBJ.x+OBJ.w/2,OBJ.y),
    ne:rot(OBJ.x+OBJ.w,OBJ.y), w:rot(OBJ.x,OBJ.y+OBJ.h/2),
    e:rot(OBJ.x+OBJ.w,OBJ.y+OBJ.h/2), sw:rot(OBJ.x,OBJ.y+OBJ.h),
    s:rot(OBJ.x+OBJ.w/2,OBJ.y+OBJ.h), se:rot(OBJ.x+OBJ.w,OBJ.y+OBJ.h),
    rot:rot(OBJ.x+OBJ.w/2,OBJ.y-30)
  };
}

function hitTestObj(mx,my){
  var h=getHandles(),tol=HSIZE+5;
  var names=['nw','n','ne','w','e','sw','s','se','rot'];
  for(var i=0;i<names.length;i++){
    var p=h[names[i]];
    if(abs(mx-p.x)<tol&&abs(my-p.y)<tol)return names[i]==='rot'?'rot':names[i];
  }
  // Body hit: inverse-rotate then rect test
  var cx=OBJ.x+OBJ.w/2,cy=OBJ.y+OBJ.h/2;
  var dx=mx-cx,dy=my-cy,a=-OBJ.angle;
  var lx=cx+dx*cos(a)-dy*sin(a), ly=cy+dx*sin(a)+dy*cos(a);
  if(lx>=OBJ.x-6&&lx<=OBJ.x+OBJ.w+6&&ly>=OBJ.y-6&&ly<=OBJ.y+OBJ.h+6)return'move';
  return null;
}

function drawOverlay(){
  if(!OBJ.octx)return;
  var oc=OBJ.octx;
  oc.clearRect(0,0,OBJ.overlay.width,OBJ.overlay.height);
  if(!OBJ.active||!OBJ.img)return;
  var cx=OBJ.x+OBJ.w/2,cy=OBJ.y+OBJ.h/2;
  oc.save();
  oc.translate(cx,cy);oc.rotate(OBJ.angle);
  // Bbox
  oc.strokeStyle='#ffa03c';oc.lineWidth=1.5;oc.setLineDash([6,4]);
  oc.strokeRect(-OBJ.w/2,-OBJ.h/2,OBJ.w,OBJ.h);
  oc.setLineDash([]);
  // Handles
  var pts=[[-OBJ.w/2,-OBJ.h/2],[0,-OBJ.h/2],[OBJ.w/2,-OBJ.h/2],
           [-OBJ.w/2,0],[OBJ.w/2,0],
           [-OBJ.w/2,OBJ.h/2],[0,OBJ.h/2],[OBJ.w/2,OBJ.h/2]];
  pts.forEach(function(p){
    oc.fillStyle='rgba(255,160,60,0.3)';oc.strokeStyle='#ffa03c';oc.lineWidth=1.5;
    oc.fillRect(p[0]-HSIZE,p[1]-HSIZE,HSIZE*2,HSIZE*2);
    oc.strokeRect(p[0]-HSIZE,p[1]-HSIZE,HSIZE*2,HSIZE*2);
  });
  // Rotation handle
  oc.beginPath();oc.arc(0,-OBJ.h/2-30,7,0,TAU);
  oc.fillStyle='rgba(255,160,60,0.2)';oc.fill();
  oc.strokeStyle='#ffa03c';oc.lineWidth=1.5;oc.stroke();
  oc.beginPath();oc.moveTo(0,-OBJ.h/2);oc.lineTo(0,-OBJ.h/2-23);oc.stroke();
  // Label
  oc.fillStyle='rgba(0,0,0,0.6)';oc.fillRect(-80,-OBJ.h/2-52,160,16);
  oc.fillStyle='#ffa03c';oc.font='10px sans-serif';oc.textAlign='center';
  oc.fillText('move \u00b7 resize \u00b7 \u21bb rotate',0,-OBJ.h/2-40);
  oc.restore();
}

function compositeObject(){
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx||!OBJ.img)return;
  var cv=lctx.canvas;
  // Clear and fill bg
  var bg=typeof gpal==='function'&&gpal()&&gpal().bg?gpal().bg:'#0a0a12';
  lctx.fillStyle=bg;lctx.fillRect(0,0,cv.width,cv.height);
  // Draw rotated/scaled object
  lctx.save();
  var cx=OBJ.x+OBJ.w/2,cy=OBJ.y+OBJ.h/2;
  lctx.translate(cx,cy);lctx.rotate(OBJ.angle);
  lctx.drawImage(OBJ.img,-OBJ.w/2,-OBJ.h/2,OBJ.w,OBJ.h);
  lctx.restore();
  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
}

function toggleObjMode(){
  var btn=document.getElementById('td-obj-btn');
  if(OBJ.active){
    // Deactivate: composite final position
    compositeObject();
    OBJ.active=false;
    removeOverlay();
    OBJ.img=null;
    if(btn){btn.textContent='ENABLE OBJECT MODE';btn.style.background='rgba(255,160,60,0.08)';}
    var wrap=document.getElementById('cvwrap');if(wrap)wrap.style.cursor='';
    return;
  }
  // Activate: capture current render to offscreen canvas
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx){return;}
  var cv=lctx.canvas;
  var off=document.createElement('canvas');off.width=cv.width;off.height=cv.height;
  off.getContext('2d').drawImage(cv,0,0);
  OBJ.img=off;
  OBJ.x=0;OBJ.y=0;OBJ.w=cv.width;OBJ.h=cv.height;OBJ.angle=0;
  OBJ.active=true;
  ensureOverlay();syncOverlay();drawOverlay();
  if(btn){btn.textContent='EXIT OBJECT MODE';btn.style.background='rgba(255,160,60,0.25)';}
  // Wire pointer events
  wireObjEvents();
}

function placeObject(){
  if(!OBJ.active||!OBJ.img)return;
  compositeObject();
  OBJ.active=false;
  if(OBJ.octx)OBJ.octx.clearRect(0,0,OBJ.overlay.width,OBJ.overlay.height);
  removeOverlay();OBJ.img=null;
  var btn=document.getElementById('td-obj-btn');
  if(btn){btn.textContent='ENABLE OBJECT MODE';btn.style.background='rgba(255,160,60,0.08)';}
  var wrap=document.getElementById('cvwrap');if(wrap)wrap.style.cursor='';
  var st=document.getElementById('td-status');if(st)st.textContent='Object placed on canvas.';
  if(typeof genUndoPush==='function')genUndoPush();
}

function deactivateObjMode(){
  if(!OBJ.active)return;
  OBJ.active=false;
  if(OBJ.octx)OBJ.octx.clearRect(0,0,OBJ.overlay.width,OBJ.overlay.height);
  removeOverlay();OBJ.img=null;
  var btn=document.getElementById('td-obj-btn');
  if(btn){btn.textContent='ENABLE OBJECT MODE';btn.style.background='rgba(255,160,60,0.08)';}
}

var _objEventsWired=false;
function wireObjEvents(){
  if(_objEventsWired)return;_objEventsWired=true;
  var wrap=document.getElementById('cvwrap');if(!wrap)return;

  function canvasCoords(e){
    var r=wrap.getBoundingClientRect();
    var cv=wrap.querySelector('canvas:not(#td-obj-ov):not(#topo-obj-ov):not(#om-ov)');
    if(!cv)return{x:0,y:0};
    var sx=cv.width/r.width,sy=cv.height/r.height;
    return{x:(e.clientX-r.left)*sx, y:(e.clientY-r.top)*sy};
  }

  wrap.addEventListener('pointerdown',function(e){
    if(!OBJ.active)return;
    var pt=canvasCoords(e);
    var hit=hitTestObj(pt.x,pt.y);
    if(!hit)return;
    e.preventDefault();e.stopPropagation();
    OBJ.dragging=hit;OBJ.startX=pt.x;OBJ.startY=pt.y;
    OBJ.startOX=OBJ.x;OBJ.startOY=OBJ.y;
    OBJ.startW=OBJ.w;OBJ.startH=OBJ.h;OBJ.startAngle=OBJ.angle;
    OBJ.overlay.style.pointerEvents='auto';
    wrap.style.cursor=hit==='move'?'grabbing':hit==='rot'?'crosshair':'nwse-resize';
  },true);

  function onMove(e){
    if(!OBJ.active||!OBJ.dragging)return;
    var pt=canvasCoords(e);
    var dx=pt.x-OBJ.startX,dy=pt.y-OBJ.startY;

    if(OBJ.dragging==='move'){
      OBJ.x=OBJ.startOX+dx;OBJ.y=OBJ.startOY+dy;
    } else if(OBJ.dragging==='rot'){
      var cx=OBJ.x+OBJ.w/2,cy=OBJ.y+OBJ.h/2;
      var a0=Math.atan2(OBJ.startY-cy,OBJ.startX-cx);
      var a1=Math.atan2(pt.y-cy,pt.x-cx);
      OBJ.angle=OBJ.startAngle+(a1-a0);
    } else {
      // Resize: work in local (un-rotated) space
      var cx=OBJ.startOX+OBJ.startW/2,cy=OBJ.startOY+OBJ.startH/2;
      var ca=cos(-OBJ.angle),sa=sin(-OBJ.angle);
      var ldx=dx*ca-dy*sa,ldy=dx*sa+dy*ca;
      var d=OBJ.dragging;
      var nx=OBJ.startOX,ny=OBJ.startOY,nw=OBJ.startW,nh=OBJ.startH;
      if(d.indexOf('w')>=0){nx+=ldx;nw-=ldx;}
      if(d.indexOf('e')>=0){nw+=ldx;}
      if(d.indexOf('n')>=0){ny+=ldy;nh-=ldy;}
      if(d.indexOf('s')>=0){nh+=ldy;}
      if(nw<20)nw=20;if(nh<20)nh=20;
      OBJ.x=nx;OBJ.y=ny;OBJ.w=nw;OBJ.h=nh;
    }
    compositeObject();drawOverlay();
  }

  function onUp(){
    if(!OBJ.dragging)return;
    OBJ.dragging=null;
    if(OBJ.overlay)OBJ.overlay.style.pointerEvents='none';
    var wrap2=document.getElementById('cvwrap');if(wrap2)wrap2.style.cursor='';
  }

  document.addEventListener('pointermove',onMove);
  document.addEventListener('pointerup',onUp);
}

/* ── Init ── */
setTimeout(function(){
  buildShapeList();
  wireSliders();
},200);

/* ── Public API ── */
window._TD={
  render:doRender,
  randomise:randomise,
  cycle:cycle,
  selectShape:selectShape,
  toggleAnim:toggleAnim,
  toggleObj:toggleObjMode,
  placeObj:placeObject,
  deactivateObj:deactivateObjMode,
  onPaletteChange:function(){if(!S.animating)doRender();},
  renderDirect:function(tctx,W2,H2,shapeIdx,sliders){
    var prev=S.shapeIdx;S.shapeIdx=shapeIdx;
    if(sliders){
      var ids=['td-resolution','td-zoom','td-rotx','td-roty','td-rotz','td-light','td-specular','td-wireframe','td-ambient'];
      var keys=['resolution','zoom','rotx','roty','rotz','light','specular','wireframe','ambient'];
      for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el&&sliders[keys[i]]!==undefined)el.value=sliders[keys[i]];}
    }
    doRender(tctx,W2,H2,true);
    S.shapeIdx=prev;
  }
};

})();
