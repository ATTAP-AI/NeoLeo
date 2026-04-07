/*  js/engines/engine-registry.js  -- ENAMES display-name map & ENGINES function map
 *  Loaded via <script> tag AFTER all engine files (core, extended, organic).
 *  Reads engine functions from window.* globals.
 */

const ENAMES={flowfield:'Flow Field',attractor:'Strange Attractor',subdivision:'Recursive Subdivision',interference:'Wave Interference',growth:'Differential Growth',lissajous:'Lissajous Mesh',gravity_wells:'Gravity Wells',boid_flocking:'Boid Flocking',magnetic_field:'Magnetic Field Lines',reaction_diffusion:'Reaction-Diffusion',sand_drift:'Sand Drift',voronoi:'Voronoi Diagram',truchet:'Truchet Tiles',penrose:'Penrose Tiling',spirograph:'Spirograph',apollonian:'Apollonian Gasket',space_filling:'Space-Filling Curve',lsystem:'L-System Plants',domain_warp:'Domain-Warped Noise',curl_noise:'Curl Noise Sheets',ridged_fractal:'Ridged Multifractal',marble_wood:'Marble / Wood',game_of_life:'Game of Life',langtons_ant:"Langton's Ant",cave_map:'Cave / Dungeon Map',crystal_growth:'Crystal Growth (DLA)',force_graph:'Force-Directed Graph',mst:'Minimum Spanning Tree',delaunay:'Delaunay Triangulation',julia_set:'Julia / Mandelbrot',newton_fractal:"Newton's Fractal",ifs:'IFS / Barnsley',flame_fractal:'Flame Fractal',contour_map:'Contour / Isoline Map',chladni:'Chladni Figures',weave_knot:'Weave / Knot Diagram',mobius_torus:'M\u00f6bius / Torus',oscilloscope:'Oscilloscope',ascii_density:'ASCII Density Map',wfc:'Waveform Collapse',physarum:'Physarum / Slime Mold',space_colonization:'Space Colonization',reaction_diffusion_b:'Reaction-Diffusion (Organic)',hydraulic_erosion:'Hydraulic Erosion',cell_growth:'Cell / Tissue Growth',watercolor:'Watercolor / Wet Media',diatom:'Diatom / Biomorph',fungal_network:'Fungal Network'};

const ENGINES={flowfield,attractor,subdivision,interference,growth,lissajous,gravity_wells,boid_flocking,magnetic_field,reaction_diffusion,sand_drift,voronoi,truchet,penrose,spirograph,apollonian,space_filling,lsystem,domain_warp,curl_noise,ridged_fractal,marble_wood,game_of_life,langtons_ant,cave_map,crystal_growth,force_graph,mst,delaunay,julia_set,newton_fractal,ifs,flame_fractal,contour_map,chladni,weave_knot,mobius_torus,oscilloscope,ascii_density,wfc,physarum,space_colonization,reaction_diffusion_b,hydraulic_erosion,cell_growth,watercolor,diatom,fungal_network};

window.ENAMES=ENAMES;
window.ENGINES=ENGINES;
window._seed=seed;
