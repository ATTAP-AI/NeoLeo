/* ══════════════════════════════════════════════════════════
   NEOLEO HELP PANEL — Interactive expandable help guide
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── Link helper: creates a clickable help-link span ──
   sel  = CSS selector to highlight
   act  = optional action:
     'open-section:id'  — expand a right-panel accordion section
     'open-panel:id'    — open a floating panel via openPanel()
     'open-exp:id'      — open experimental sub-section
     'click:selector'   — simulate a click on the element (triggers its native open logic) */
function L(text, sel, act){
  var eSel = (sel||'').replace(/"/g,'&quot;');
  var eAct = (act||'').replace(/"/g,'&quot;');
  return '<a class="help-link" data-sel="'+eSel+'" data-act="'+eAct+'">'+text+'</a>';
}

var INTRO = '<strong>"NeoLeo"</strong> takes its name from "New" and Leonardo DaVinci. ' +
  'Your studio for creating entirely new non-appropriative visual art forms which do not use or access any AI models or Web based libraries or AI based corpuses of any artists work, historical art, photos or images. ' +
  'NeoLeo enables you to imagine, create and visualize using intuitive tools that generate images based on mathematics, nature, and code \u2014 not filters on photos, but original visual art generated from visual \u2018first principles\u2019 from scratch.' +
  '<br><br>' +
  'Any and all work you create using NeoLeo <strong>belongs to you</strong> and is not uploaded to NeoLeo or shared to any other platform. You may, of course, download any of your creations and do whatever you wish from there.' +
  '<br><br>' +
  'NeoLeo is entirely open source and intended (as a platform for creative artists and developers) to be used to further develop its tools and opportunities for all artists.' +
  '<div class="help-welcome">Welcome to NeoLeo \u2014 New Art Forms for a New Age.</div>';

var SECTIONS = [
  {
    title: 'Getting Started',
    body: '<p>Creating your first piece of art is simple:</p>' +
      '<ul>' +
      '<li>'+L('Pick an engine','#eng-toggle','open-section:eng-body')+' \u2014 Open the '+L('Engines','#eng-toggle','open-section:eng-body')+' section in the right panel and click any engine name. Each one produces a completely different style of visual output.</li>' +
      '<li>'+L('Press CREATE','#gbtn')+' \u2014 The large button at the top generates a new image. Every press creates something unique.</li>' +
      '<li>'+L('Change the palette','#pal-toggle','open-section:pal-body')+' \u2014 Open the '+L('Palette','#pal-toggle','open-section:pal-body')+' section and choose a different color scheme. The same engine with a different palette gives you an entirely new mood.</li>' +
      '<li>'+L('Choose your canvas shape','#canvas-toggle2','open-section:canvas-body2')+' \u2014 Open the '+L('Image Creation Window','#canvas-toggle2','open-section:canvas-body2')+' section to pick a shape for your canvas \u2014 square, landscape, portrait, widescreen, or '+L('Free Form','[data-ratio="freeform"]','click:[data-ratio="freeform"]')+' to draw your own custom shape using polygon or hand-drawn modes.</li>' +
      '<li><strong>Experiment freely</strong> \u2014 There is no wrong way to use NeoLeo. Try different engines, adjust the sliders, layer multiple generations together.</li>' +
      '<li>'+L('Lock your seed','#lbtn')+' \u2014 The seed number controls the randomness. Click LOCK to keep the same seed while you change palettes or settings, letting you explore variations of the same composition.</li>' +
      '</ul>'
  },
  {
    title: 'The Creation Engines (48 Styles)',
    body: '<p>'+L('Engines','#eng-toggle','open-section:eng-body')+' are the heart of NeoLeo. Each one uses a different mathematical or natural process to generate original artwork. They are grouped by character:</p>' +
      '<p><strong>Flow and Motion</strong> \u2014 Flow Field, Strange Attractor, Boid Flocking, Curl Noise Sheets, Magnetic Field Lines, Gravity Wells, Lissajous Mesh, Oscilloscope. These create graceful, sweeping forms inspired by the physics of movement.</p>' +
      '<p><strong>Nature and Growth</strong> \u2014 Differential Growth, Physarum (Slime Mold), Fungal Network, Cell Growth, Space Colonization, L-System Plants, Reaction-Diffusion, Watercolor, Diatom. These mimic the organic patterns found in living things.</p>' +
      '<p><strong>Geometry and Pattern</strong> \u2014 Voronoi Diagram, Truchet Tiles, Penrose Tiling, Spirograph, Weave and Knot, Apollonian Gasket, Space-Filling Curve, ASCII Density Map, M\u00F6bius Torus, Recursive Subdivision. These explore the beauty of mathematical structure.</p>' +
      '<p><strong>Fractals and Mathematics</strong> \u2014 Julia and Mandelbrot sets, Newton\u2019s Fractal, IFS and Barnsley, Flame Fractal, Ridged Multifractal, Domain-Warped Noise, Chladni Figures. These reveal the infinite complexity hidden in simple equations.</p>' +
      '<p><strong>Landscape and Terrain</strong> \u2014 Contour Map, Hydraulic Erosion, Cave and Dungeon Map, Sand Drift, Marble and Wood. These generate terrain-like surfaces and natural textures.</p>' +
      '<p><strong>Systems and Simulation</strong> \u2014 Game of Life, Langton\u2019s Ant, Waveform Collapse, Force-Directed Graph, Minimum Spanning Tree, Delaunay Triangulation, Crystal Growth. These simulate emergent behavior from simple rules.</p>' +
      '<p>Each engine has its own set of sliders that control its unique parameters. Move them to dramatically change the output.</p>'
  },
  {
    title: 'Color Palettes',
    body: '<p>Every engine renders using the currently selected color palette. Changing the palette completely transforms the look of any generation.</p>' +
      '<ul>' +
      '<li>Open the '+L('Palette','#pal-toggle','open-section:pal-body')+' section in the right panel to see the available palettes.</li>' +
      '<li>Click any palette name to switch to it. The color swatches at the bottom of the image creation window update to show the active colors.</li>' +
      '<li>The same engine and seed with a different palette will produce the same composition but in entirely different colors.</li>' +
      '<li>You can use the '+L('Rand','#ranbtn')+' button to randomly combine an engine and palette for unexpected results.</li>' +
      '</ul>'
  },
  {
    title: 'Drawing and Painting Tools',
    body: '<p>The toolbar on the left side of the image creation window gives you traditional drawing tools to paint directly onto the image creation window or on top of your generated art:</p>' +
      '<ul>' +
      '<li>'+L('Brush','.tbtn[data-t="brush"]','open-section:dt-body')+' (B) \u2014 A soft, pressure-sensitive painting tool.</li>' +
      '<li>'+L('Pencil','.tbtn[data-t="pencil"]','open-section:dt-body')+' (P) \u2014 A hard-edged drawing tool for precise lines.</li>' +
      '<li>'+L('Line','.tbtn[data-t="line"]','open-section:dt-body')+' (L) \u2014 Draw straight lines between two points.</li>' +
      '<li>'+L('Rectangle','.tbtn[data-t="rect"]','open-section:dt-body')+' (R), '+L('Ellipse','.tbtn[data-t="ellipse"]','open-section:dt-body')+' (E), '+L('Triangle','.tbtn[data-t="triangle"]','open-section:dt-body')+' (T) \u2014 Draw geometric shapes. Choose stroke only, fill only, or both.</li>' +
      '<li>'+L('Polygon','.tbtn[data-t="polygon"]','open-section:dt-body')+' (G) \u2014 Click to place corners, then close the shape.</li>' +
      '<li>'+L('Free Shape','.tbtn[data-t="shape"]','open-section:dt-body')+' (S) \u2014 Draw freely and the shape closes automatically when you release.</li>' +
      '<li>'+L('Fill','.tbtn[data-t="fill"]','open-section:dt-body')+' (F) \u2014 Flood-fill an area with the current color.</li>' +
      '<li>'+L('Color Replace','.tbtn[data-t="creplace"]','open-section:dt-body')+' (C) \u2014 Replace one color with another by painting over it.</li>' +
      '<li>'+L('Crop','.tbtn[data-t="crop"]','open-section:dt-body')+' \u2014 Trim the image creation window to a selected area.</li>' +
      '</ul>' +
      '<p>Use the controls in the '+L('Drawing Tools','#dt-toggle','open-section:dt-body')+' section to adjust <strong>size</strong>, <strong>opacity</strong>, <strong>hardness</strong>, and <strong>color</strong>.</p>' +
      '<p><strong>Mark Color Picker</strong> \u2014 Whenever a mark-making tool is active, a small floating panel anchors next to the vertical toolbar with two swatches:</p>' +
      '<ul>' +
      '<li><strong>LAST</strong> \u2014 Recolors the most recently placed mark in place. Pick a new color and the pixels of your last stroke change to it while preserving softness and opacity. Repeated picks keep targeting that same original mark until you place a new one.</li>' +
      '<li><strong>NEXT</strong> \u2014 Sets the color the next mark will be drawn with. This stays in sync with the main color picker.</li>' +
      '</ul>' +
      '<p>The picker disappears for tools that don\u2019t make marks (like Crop), and reappears as soon as you switch back to a mark-making tool.</p>'
  },
  {
    title: 'Brushes (26 Types)',
    body: '<p>NeoLeo includes 26 unique brush types organized in three families. Click the '+L('brush icon','.tbtn[data-t="brush"]','click:.tbtn[data-t="brush"]')+' in the '+L('Drawing Tools','#dt-toggle','open-section:dt-body')+' section to open the Brush Picker.</p>' +
      '<p><strong>Western Brushes</strong> \u2014 Soft Round, Hard Round, Airbrush, Pencil, Chalk, Dry Brush, Soft Flat, Hard Flat, Spatter, and Ink Pen. These cover the full range of traditional Western painting tools.</p>' +
      '<p><strong>Chinese Calligraphy Brushes</strong> \u2014 Seven brushes inspired by centuries of Chinese brush painting tradition, including M\u00E1o B\u01D0 (standard brush), Xi\u011B Y\u00EC (freehand), G\u014Dng B\u01D0 (fine detail), Zh\u00FA B\u01D0 (bamboo pen), P\u014D M\u00F2 (splash ink), K\u016B B\u01D0 (dry brush), and Sh\u00F2u J\u012Bn (Emperor Huizong\u2019s slender gold style).</p>' +
      '<p><strong>Winsor and Newton Sable</strong> \u2014 Six brushes modeled after the legendary W&N Series 7 sable brushes, including miniature, round, flat wash, rigger, and Cotman varieties.</p>'
  },
  {
    title: 'Advanced Image Tools',
    body: '<p>These tools let you refine and transform your artwork in powerful ways:</p>' +
      '<ul>' +
      '<li>'+L('Humanize','.tbtn[data-t="humanize"]','click:.tbtn[data-t="humanize"]')+' \u2014 Adds organic imperfections to make algorithmic art feel more hand-made. Controls for wobble, pressure variation, edge roughening, ink pooling, and color drift.</li>' +
      '<li>'+L('Naturalize','#nat-toggle','click:#nat-toggle')+' \u2014 Applies film grain, color jitter, and multi-pass blending to give your art a natural, photographic quality.</li>' +
      '<li>'+L('Curves','.tbtn[data-t="curves"]','click:.tbtn[data-t="curves"]')+' \u2014 Fine-tune the brightness and contrast of your image using a curves editor, just like in professional photo software.</li>' +
      '<li>'+L('Gradient','.tbtn[data-t="gradient"]','click:.tbtn[data-t="gradient"]')+' \u2014 Apply smooth color gradients across the image creation window with a full gradient editor and preset library.</li>' +
      '<li>'+L('Texture','.tbtn[data-t="texturemap"]','click:.tbtn[data-t="texturemap"]')+' \u2014 Overlay texture patterns onto your artwork.</li>' +
      '<li>'+L('Eraser','.tbtn[data-t="eraser"]','open-section:dt-body')+' \u2014 Remove parts of your drawing.</li>' +
      '<li>'+L('Eyedropper','.tbtn[data-t="eyedropper"]','open-section:dt-body')+' \u2014 Pick a color from the image creation window to use for drawing.</li>' +
      '<li>'+L('Clone','.tbtn[data-t="clone"]','open-section:dt-body')+' and '+L('Heal','.tbtn[data-t="heal"]','open-section:dt-body')+' \u2014 Copy areas of the image or blend them seamlessly.</li>' +
      '<li>'+L('Dodge','.tbtn[data-t="dodge"]','open-section:dt-body')+' and '+L('Burn','.tbtn[data-t="burn"]','open-section:dt-body')+' \u2014 Lighten or darken specific areas.</li>' +
      '<li>'+L('Blur','.tbtn[data-t="blur"]','open-section:dt-body')+', '+L('Sharpen','.tbtn[data-t="sharpen"]','open-section:dt-body')+', and '+L('Smudge','.tbtn[data-t="smudge"]','open-section:dt-body')+' \u2014 Soften, crisp, or blend parts of your artwork.</li>' +
      '</ul>'
  },
  {
    title: 'Experimental Art Tools',
    body: '<p>These are cutting-edge creative tools found only in NeoLeo. Open the '+L('Experimental Tools','#exp-toggle','open-section:exp-body')+' section at the bottom of the right panel:</p>' +
      '<ul>' +
      '<li>'+L('Intent Sculpting','#intent-sculpt-toggle','open-exp:intent-sculpt-body')+' \u2014 Shape your art using invisible force fields. Adjust tension, decay, and flow to guide how forms are arranged on the image creation window.</li>' +
      '<li>'+L('Topology Engine','#topo-toggle','open-exp:topo-body')+' \u2014 Generate three-dimensional mathematical surfaces like toruses, spheres, and Klein bottles, rendered as art. Rotate and reshape them in real time.</li>' +
      '<li>'+L('Morphogenesis','#morph-toggle','open-exp:morph-body')+' \u2014 Simulate how patterns form in nature \u2014 like spots on a leopard or stripes on a zebra \u2014 using biological growth models.</li>' +
      '<li>'+L('Probability Painting','#pp-toggle','open-exp:pp-body')+' \u2014 Paint with mathematical probability distributions. Each stroke is a field of chance, creating unique textures impossible to achieve by hand.</li>' +
      '<li><strong>Memory Drawing</strong> \u2014 Inscribe text and ideas that become part of the visual texture of your artwork.</li>' +
      '<li><strong>Temporal Canvases</strong> \u2014 Create art that evolves over time, blending and shifting through different states.</li>' +
      '<li>'+L('Organic Forms','#orgf-toggle','open-exp:orgf-body')+' \u2014 Generate smooth, sculptural shapes from pure mathematics, rendered at full resolution with antialiasing. Five systems are included: <strong>Metaballs</strong> \u2014 merging blobs like oil droplets or liquid mercury via implicit surface evaluation; <strong>Superformula</strong> \u2014 Gielis parametric curves that produce starfish, flowers, pollen grains, and sea urchin shapes; <strong>Noise Blobs</strong> \u2014 fractal-noise-displaced circles drawn with smooth b\u00e9zier curves for amoeba and ink-drop silhouettes; <strong>Lava Lamp</strong> \u2014 SDF smooth-union fluids that merge and divide like cell mitosis; and <strong>Radiolaria</strong> \u2014 radially symmetric microscopic organisms inspired by Ernst Haeckel\u2019s illustrations, with concentric shells, lattice structures, and decorative spines. Use the five sliders to sculpt each form, or click Rand for instant surprises.</li>' +
      '<li>'+L('Modality Cycler','#intent-cycle-btn','open-exp:intent-sculpt-body')+' \u2014 Found within Intent Sculpting, the Cycle button steps through eight named force-field modalities (such as Tension Web, Fragile Emergence, and Pure Symmetry), each emphasizing a different aesthetic principle to discover unexpected combinations.</li>' +
      '</ul>' +
      '<p>Use the <strong>Connect</strong> button to blend experimental tool output on top of your engine generation.</p>'
  },
  {
    title: 'The Cycle Buttons \u2014 Guided Discovery',
    body: '<p>Scattered throughout NeoLeo you will find bright red <strong>Cycle</strong> buttons. These are your discovery tools \u2014 each click takes you on a guided tour through an entire family of algorithms, with every setting turned up to full expression so you can see each style at its most dramatic. Think of them as a slideshow of possibilities.</p>' +
      '<p><strong>How they work:</strong> Every Cycle button follows the same simple pattern \u2014 click it and it advances to the next option in the series, generates the result immediately, and shows you where you are (for example, "3/48 \u2014 Voronoi Diagram"). Keep clicking to explore them all, or stop when something catches your eye and start customizing from there.</p>' +
      '<p>Here is every Cycle button in NeoLeo:</p>' +
      '<ul>' +
      '<li>'+L('Engine Cycle','#eng-cycle-btn','open-section:eng-body')+' \u2014 The big one. Steps through all <strong>48 creation engines</strong> one by one, with every parameter set to maximum. This is the fastest way to discover the full range of visual styles NeoLeo can produce \u2014 from flowing particle fields to fractal mathematics to organic growth simulations. Each click is a completely different world.</li>' +
      '<li>'+L('Intent Sculpting Modality Cycle','#intent-cycle-btn','open-exp:intent-sculpt-body')+' \u2014 Tours <strong>8 named force-field modalities</strong>: Tension Web (dense crossed filaments), Fragile Emergence (trembling branches), Pure Symmetry (mirrored organic forms), Dissolution Field (ghostly fading marks), Desire Lines (tight loops and spirals), Resistance Storm (turbulent scattered marks), Full Force (maximal complexity), and Calm Tension (long ordered strands). Each one gives your art a completely different emotional character.</li>' +
      '<li>'+L('Temporal Canvases Cycle','#tc-rand-hdr-btn','open-exp:tc-body')+' \u2014 Steps through <strong>5 time-based modes</strong>: Emergence (calm building into structure), Dissolution (order melting into chaos), Oscillation (wave-like memory), Remembrance (art that recalls itself), and Entropy (everything slowly forgetting). These create art that feels like it is alive and changing.</li>' +
      '<li>'+L('Probability Painting Cycle','#pp-cycle-btn','open-exp:pp-body')+' \u2014 Moves through different <strong>probability expressions</strong> \u2014 each one changes how chance and mathematics shape your brush strokes, producing textures that are impossible to create by hand.</li>' +
      '<li>'+L('Memory Drawing Cycle','#mbd-cycle-btn','open-exp:mbd-body')+' \u2014 Cycles through different <strong>neural architectures</strong> that transform your inscribed text and ideas into visual textures, each one interpreting your words in a different visual language.</li>' +
      '<li>'+L('Morphogenesis Cycle','#morph-cycle-btn','open-exp:morph-body')+' \u2014 Tours <strong>5 biological growth systems</strong>: Reaction-Diffusion (Turing patterns like animal markings), Phylogenetic (evolutionary branching), Branching (tree-like growth), Chladni (vibration patterns on a surface), and Voronoi (cell-like territory maps). Nature\u2019s own design principles, one click at a time.</li>' +
      '<li>'+L('Topology Engine Cycle','#topo-cycle-btn','open-exp:topo-body')+' \u2014 Steps through <strong>mathematical surfaces</strong> \u2014 toruses, Klein bottles, spheres, and other shapes from the field of topology, each one rendered as a unique piece of three-dimensional art.</li>' +
      '<li>'+L('Organic Forms Cycle','#orgf-cycle-btn','open-exp:orgf-body')+' \u2014 Tours <strong>5 sculptural form systems</strong>: Metaballs (merging blobs), Superformula (Gielis parametric shapes), Noise Blobs (amoeba silhouettes), Lava Lamp (smooth-union fluids), and Radiolaria (Haeckel-inspired microscopic forms).</li>' +
      '</ul>' +
      '<p>The Cycle buttons are designed for playful exploration. You do not need to understand the mathematics behind any of these \u2014 just click, look, and follow your eye to what inspires you.</p>'
  },
  {
    title: 'Happy Hallucinations',
    body: '<p>'+L('Happy Hallucinations (HH)','#hh-btn','open-section:dt-body')+' is NeoLeo\u2019s signature creative feature. It automatically composes a complete artwork by randomly combining an engine, palette, and drawing tools into a single layered composition. Each press of the HH button creates a completely unique piece with a descriptive mood name.</p>' +
      '<p><strong>Experimental Tool Blending:</strong> HH and Multi-Pass now have a 40% chance per pass of layering output from one of NeoLeo\u2019s six experimental tools \u2014 Organic Forms, Morphogenesis, Topology Engine, Probability Painting, Memory Drawing, and Temporal Canvases. When an experimental tool fires, its tag appears in the mood label (e.g. <em>organic:nblob</em>, <em>morpho:rd</em>, <em>topo:shape</em>). In Multi-Pass mode, at least one pass is guaranteed to include an experimental layer, producing richly complex compositions that blend algorithmic engines with sculptural forms, biological growth patterns, and mathematical surfaces.</p>' +
      '<p>'+L('Multi-Pass Blend','#hh-multi-btn','click:#hh-multi-btn')+' takes this further \u2014 it runs up to <strong>10 passes</strong> and layers them together with adjustable opacity and decay. The result is rich, complex artwork that no single generation could produce. Use the sliders to control how the passes blend together.</p>'
  },
  {
    title: 'Lighting and Atmosphere',
    body: '<p>Add cinematic lighting and mood to your artwork using the toolbar buttons on the left:</p>' +
      '<p>'+L('Lighting','#ltool','open-panel:light-panel')+' (click the light bulb icon) \u2014 Add up to two light sources to illuminate your art. Choose from point lights, spotlights, or rim lighting. Adjust color, intensity, radius, bloom, and ambient fill to create dramatic illumination.</p>' +
      '<p>'+L('Atmosphere','#atool','open-panel:atmo-panel')+' (click the cloud icon) \u2014 Layer atmospheric effects on top of your art:</p>' +
      '<ul>' +
      '<li><strong>Vignette</strong> \u2014 Darken the edges to draw focus to the center.</li>' +
      '<li><strong>Fog and Haze</strong> \u2014 Add a soft, misty overlay.</li>' +
      '<li><strong>Film Grain</strong> \u2014 Simulate analog film texture.</li>' +
      '<li><strong>Color Grading</strong> \u2014 Shift the overall temperature, saturation, contrast, and brightness.</li>' +
      '<li><strong>Chromatic Aberration</strong> \u2014 Add subtle color fringing like a vintage lens.</li>' +
      '</ul>'
  },
  {
    title: 'Layers',
    body: '<p>'+L('Layers','#laytool','click:#laytool')+' let you stack multiple images on top of each other, just like transparent sheets of paper:</p>' +
      '<p><strong>Drawing Layers</strong> \u2014 Add multiple drawing layers so you can paint on separate surfaces. Each layer can have its own blend mode (how it mixes with layers below) and opacity (how see-through it is). Reorder, duplicate, merge, or flatten layers as needed.</p>' +
      '<p><strong>Engine Layers</strong> \u2014 Capture different engine generations as separate layers and composite them together. Each engine layer has its own blend mode and opacity slider.</p>' +
      '<p><strong>Auto-Layer</strong> \u2014 Toggle the Auto button in the Engine Layers section. When on, every new generation automatically becomes its own layer instead of replacing the previous one. This lets you rapidly build up complex compositions from multiple engines.</p>' +
      '<p><strong>Blend Modes</strong> \u2014 These control how layers combine: Normal stacks them, Multiply darkens, Screen brightens, Overlay adds contrast, and many more. Experiment to find combinations you like.</p>'
  },
  {
    title: 'Free Form Canvas',
    body: '<p>Create a custom-shaped '+L('Image Creation Window','#canvas-toggle2','open-section:canvas-body2')+' instead of the standard rectangular canvas:</p>' +
      '<ul>' +
      '<li>Open the '+L('Image Creation Window','#canvas-toggle2','open-section:canvas-body2')+' section and select the <strong>Free Form</strong> swatch from the shape options.</li>' +
      '<li>A mode selection menu appears with two drawing modes:</li>' +
      '</ul>' +
      '<p><strong>Polygon Mode</strong> \u2014 Click anywhere on the canvas to place vertices one at a time. Each click adds a corner point connected by straight lines. You need at least three points to form a shape. Double-click, press Enter, or click near the first point to close the shape. Press Backspace to remove the last point, or Escape to cancel.</p>' +
      '<p><strong>Hand Drawn Mode</strong> \u2014 Click and hold the mouse button, then drag freely to draw any shape you like. The line follows your mouse movement naturally. When you release the mouse, NeoLeo automatically smooths your drawing into a clean, antialiased curve using corner-cutting refinement, so even a rough sketch becomes an elegant shape.</p>' +
      '<p>Once your shape is complete, the Image Creation Window is clipped to your custom outline. You can then generate art, paint, and use all tools within your custom shape. The background color you have selected fills the area outside your shape.</p>' +
      '<p>Use <strong>Undo</strong> and <strong>Redo</strong> to step back and forward through freeform changes, and <strong>Reset</strong> to return to a standard square canvas.</p>'
  },
  {
    title: 'Uploading and Compositing Images',
    body: '<p>You can bring your own images into NeoLeo to combine with generated art:</p>' +
      '<ul>' +
      '<li>'+L('Upload','#utool','open-panel:upload-panel')+' \u2014 Click the upload button (top of the toolbar) or drag and drop a PNG or JPEG image onto the upload area. Your image appears on the image creation window.</li>' +
      '<li><strong>Layer Mode</strong> \u2014 Choose whether your image sits <em>under</em> the generated art, <em>over</em> it, or <em>replaces</em> it entirely.</li>' +
      '<li><strong>Opacity and Blend</strong> \u2014 Control how transparent your image is and how it blends with the generated art.</li>' +
      '<li><strong>Image Signal</strong> \u2014 Extract the structure and colors from your uploaded image and use them to guide how engines generate. The engine will follow the shapes and palette of your photo.</li>' +
      '<li><strong>Bake to Image</strong> \u2014 Permanently merge your uploaded image into the generated image.</li>' +
      '<li><strong>Image Adjustments</strong> \u2014 Fine-tune brightness, contrast, saturation, exposure, highlights, shadows, temperature, and tint of your uploaded image.</li>' +
      '</ul>'
  },
  {
    title: 'AI Creative Assistant',
    body: '<p>NeoLeo includes an optional AI assistant that can help you explore creative directions. Click the '+L('AI button','#aitool','open-panel:prompt-panel')+' in the toolbar (or press Shift+P) to open the prompt panel.</p>' +
      '<p>Describe what you want in plain language \u2014 for example, "make it warmer and more dramatic" or "switch to something organic and flowing" \u2014 and the assistant will adjust the engine, palette, lighting, and atmosphere settings to match your vision.</p>' +
      '<p>The AI only changes settings and parameters. It does not generate images, access external data, or use any pre-existing artwork. All visual output is still created entirely by NeoLeo\u2019s own engines.</p>'
  },
  {
    title: 'Saving and Exporting Your Art',
    body: '<ul>' +
      '<li>'+L('PNG Export','#xbtn')+' \u2014 Click the PNG button (top bar) to export your artwork as a high-quality PNG image file that downloads to your computer.</li>' +
      '<li>'+L('Save State','#save-btn')+' \u2014 Click Save to store your current settings (engine, palette, seed, sliders) so you can return to them later. You can save up to 8 named states.</li>' +
      '<li><strong>Generation History</strong> \u2014 NeoLeo keeps a visual history of your recent generations. Click any thumbnail in the history strip to restore that generation.</li>' +
      '<li>'+L('Undo','#undo-persist')+' and '+L('Redo','#redo-persist')+' \u2014 Use the Undo and Redo buttons (top left) or keyboard shortcuts to step backward and forward through your changes.</li>' +
      '</ul>'
  },
  {
    title: 'Keyboard Shortcuts',
    body: '<dl class="help-keys">' +
      '<dt>B</dt><dd>Brush tool</dd>' +
      '<dt>P</dt><dd>Pencil tool</dd>' +
      '<dt>F</dt><dd>Fill tool</dd>' +
      '<dt>L</dt><dd>Line tool</dd>' +
      '<dt>R</dt><dd>Rectangle</dd>' +
      '<dt>E</dt><dd>Ellipse</dd>' +
      '<dt>T</dt><dd>Triangle</dd>' +
      '<dt>G</dt><dd>Polygon</dd>' +
      '<dt>S</dt><dd>Free Shape</dd>' +
      '<dt>Esc</dt><dd>Deselect tool</dd>' +
      '<dt>Shift+U</dt><dd>Upload image</dd>' +
      '<dt>Shift+P</dt><dd>AI prompt</dd>' +
      '<dt>Shift+L</dt><dd>Lighting panel</dd>' +
      '<dt>Shift+A</dt><dd>Atmosphere panel</dd>' +
      '<dt>Shift+Y</dt><dd>Layers panel</dd>' +
      '<dt>Ctrl/Cmd+Z</dt><dd>Undo</dd>' +
      '<dt>Ctrl/Cmd+Y</dt><dd>Redo</dd>' +
      '</dl>'
  }
];

/* ── Build the panel ── */
var panel = document.createElement('div');
panel.id = 'help-panel';

var hdr = document.createElement('div');
hdr.id = 'help-hdr';
hdr.innerHTML = '<div style="display:flex;align-items:baseline;"><span id="help-hdr-title">NeoLeo</span><span id="help-hdr-sub">Help Guide</span></div>' +
  '<div id="help-hdr-right"><button id="help-search-btn">\u2315 Find</button><button id="help-close">Close</button></div>';
panel.appendChild(hdr);

var searchBar = document.createElement('div');
searchBar.id = 'help-search-bar';
searchBar.innerHTML = '<input id="help-search-input" type="text" placeholder="Search help\u2026">' +
  '<button id="help-search-go">\u2315</button>' +
  '<span id="help-search-info"></span>';
panel.appendChild(searchBar);

var body = document.createElement('div');
body.id = 'help-body';

/* Intro */
var intro = document.createElement('div');
intro.className = 'help-intro';
intro.innerHTML = INTRO;
body.appendChild(intro);

/* Sections */
SECTIONS.forEach(function(sec){
  var div = document.createElement('div');
  div.className = 'help-sec';

  var title = document.createElement('div');
  title.className = 'help-sec-title';
  title.innerHTML = '<span class="help-sec-arrow">\u25B6</span>' + sec.title;
  title.addEventListener('click', function(){
    div.classList.toggle('open');
  });

  var bd = document.createElement('div');
  bd.className = 'help-sec-body';
  bd.innerHTML = sec.body;

  div.appendChild(title);
  div.appendChild(bd);
  body.appendChild(div);
});

panel.appendChild(body);
/* Backdrop overlay */
var helpOverlay = document.createElement('div');
helpOverlay.id = 'help-overlay';
helpOverlay.addEventListener('click', function(e){
  if(e.target === helpOverlay) panel.classList.remove('open');
});
document.body.appendChild(helpOverlay);
document.body.appendChild(panel);

/* ══════════════════════════════════════════════════════════
   LIVE LINK SYSTEM — highlight & navigate to UI elements
   ══════════════════════════════════════════════════════════ */
var _hlTimer = null;
var _hlInterval = null;
function highlightEl(el){
  if(!el) return;
  /* Clear any previous highlight */
  if(_hlTimer) clearTimeout(_hlTimer);
  if(_hlInterval) clearInterval(_hlInterval);
  /* Scroll element into view */
  el.scrollIntoView({behavior:'smooth', block:'center'});
  /* Blink highlight for 3 seconds */
  var orig = el.style.outline;
  var origShadow = el.style.boxShadow;
  var on = true;
  function setOn(){ el.style.outline = '3px solid #E8F50A'; el.style.boxShadow = '0 0 18px 4px rgba(232,245,10,0.5)'; }
  function setOff(){ el.style.outline = orig; el.style.boxShadow = origShadow; }
  setOn();
  _hlInterval = setInterval(function(){
    on = !on;
    if(on) setOn(); else setOff();
  }, 350);
  _hlTimer = setTimeout(function(){
    clearInterval(_hlInterval);
    _hlInterval = null;
    setOff();
  }, 3000);
}

function openSection(bodyId){
  var bd = document.getElementById(bodyId);
  if(!bd) return;
  if(!bd.classList.contains('open')) bd.classList.add('open');
  /* Also update chevron */
  var sections = [
    {btn:'canvas-toggle2', body:'canvas-body2'},
    {btn:'eng-toggle', body:'eng-body'},
    {btn:'pal-toggle', body:'pal-body'},
    {btn:'dt-toggle', body:'dt-body'},
    {btn:'exp-toggle', body:'exp-body'}
  ];
  sections.forEach(function(s){
    if(s.body === bodyId){
      var btnEl = document.getElementById(s.btn);
      if(btnEl){
        var chev = btnEl.querySelector('.chev');
        if(chev) chev.style.transform = 'rotate(90deg)';
      }
    }
  });
}

function openExpSub(bodyId){
  /* First open the Experimental Tools parent section */
  openSection('exp-body');
  /* Then open the sub-section */
  var bd = document.getElementById(bodyId);
  if(bd) bd.style.display = 'block';
}

/* Wire all help-link clicks */
panel.addEventListener('click', function(e){
  var link = e.target.closest('.help-link');
  if(!link) return;
  e.preventDefault();
  e.stopPropagation();

  var sel = link.dataset.sel;
  var act = link.dataset.act;

  /* Execute action first */
  if(act){
    var colonIdx = act.indexOf(':');
    var cmd = colonIdx > -1 ? act.substring(0, colonIdx) : act;
    var arg = colonIdx > -1 ? act.substring(colonIdx + 1) : '';
    if(cmd === 'open-section') openSection(arg);
    else if(cmd === 'open-panel' && typeof openPanel === 'function') openPanel(arg);
    else if(cmd === 'open-exp') openExpSub(arg);
    else if(cmd === 'click'){
      var clickTarget = document.querySelector(arg);
      if(clickTarget) clickTarget.click();
    }
  }

  /* Highlight the target element */
  if(sel){
    setTimeout(function(){
      var target = document.querySelector(sel);
      if(target) highlightEl(target);
    }, act ? 150 : 0);
  }
});

/* ══════════════════════════════════════════════════════════
   SEARCH SYSTEM — find text within help content
   ══════════════════════════════════════════════════════════ */
(function(){
  var searchBtn = document.getElementById('help-search-btn');
  var bar = document.getElementById('help-search-bar');
  var input = document.getElementById('help-search-input');
  var goBtn = document.getElementById('help-search-go');
  var info = document.getElementById('help-search-info');
  var hits = [];
  var currentHit = -1;

  searchBtn.addEventListener('click', function(e){
    e.stopPropagation();
    bar.classList.toggle('open');
    if(bar.classList.contains('open')){
      input.focus();
      input.select();
    } else {
      clearHits();
    }
  });

  function clearHits(){
    hits.forEach(function(span){
      var parent = span.parentNode;
      if(parent){ parent.replaceChild(document.createTextNode(span.textContent), span); parent.normalize(); }
    });
    hits = [];
    currentHit = -1;
    info.textContent = '';
  }

  function doSearch(){
    clearHits();
    var query = input.value.trim();
    if(!query) return;
    /* Expand all sections so we can search all text */
    body.querySelectorAll('.help-sec').forEach(function(s){ s.classList.add('open'); });
    /* Walk text nodes in #help-body */
    var walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
    var matches = [];
    var node;
    var re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    while(node = walker.nextNode()){
      if(re.test(node.textContent)){
        matches.push(node);
      }
      re.lastIndex = 0;
    }
    /* Wrap matches in highlight spans */
    matches.forEach(function(textNode){
      var parts = textNode.textContent.split(re);
      if(parts.length <= 1) return;
      var frag = document.createDocumentFragment();
      parts.forEach(function(part){
        if(re.test(part)){
          var span = document.createElement('span');
          span.className = 'help-search-hit';
          span.textContent = part;
          hits.push(span);
          frag.appendChild(span);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
        re.lastIndex = 0;
      });
      textNode.parentNode.replaceChild(frag, textNode);
    });
    if(hits.length > 0){
      currentHit = 0;
      hits[0].classList.add('current');
      hits[0].scrollIntoView({behavior:'smooth', block:'center'});
      info.textContent = '1 / ' + hits.length;
    } else {
      info.textContent = 'No results';
    }
  }

  function nextHit(){
    if(hits.length === 0) return;
    hits[currentHit].classList.remove('current');
    currentHit = (currentHit + 1) % hits.length;
    hits[currentHit].classList.add('current');
    hits[currentHit].scrollIntoView({behavior:'smooth', block:'center'});
    info.textContent = (currentHit + 1) + ' / ' + hits.length;
  }

  function prevHit(){
    if(hits.length === 0) return;
    hits[currentHit].classList.remove('current');
    currentHit = (currentHit - 1 + hits.length) % hits.length;
    hits[currentHit].classList.add('current');
    hits[currentHit].scrollIntoView({behavior:'smooth', block:'center'});
    info.textContent = (currentHit + 1) + ' / ' + hits.length;
  }

  /* ── Cmd/Ctrl+G : next match · Cmd/Ctrl+Shift+G : previous match ──
     Active only while the help panel is open. Captures globally so it
     works whether or not the search input has focus. */
  document.addEventListener('keydown', function(e){
    if(!panel.classList.contains('open')) return;
    if((e.metaKey || e.ctrlKey) && (e.key === 'g' || e.key === 'G')){
      e.preventDefault();
      e.stopPropagation();
      if(hits.length === 0){
        /* If no active search yet but the input has text, run it now */
        if(input.value.trim()){
          input.dataset.lastQuery = input.value.trim();
          doSearch();
        } else {
          /* Open the search bar so the user can type */
          bar.classList.add('open');
          input.focus();
        }
        return;
      }
      if(e.shiftKey) prevHit(); else nextHit();
    }
  }, true);

  goBtn.addEventListener('click', function(e){
    e.stopPropagation();
    if(hits.length > 0) nextHit();
    else doSearch();
  });

  input.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
      e.preventDefault();
      if(hits.length > 0 && input.value.trim() === input.dataset.lastQuery) nextHit();
      else { input.dataset.lastQuery = input.value.trim(); doSearch(); }
    }
    if(e.key === 'Escape'){
      clearHits();
      bar.classList.remove('open');
    }
    e.stopPropagation();
  });
  input.addEventListener('mousedown', function(e){ e.stopPropagation(); });
})();

/* ── Close button ── */
document.getElementById('help-close').addEventListener('click', function(){
  panel.classList.remove('open');
  helpOverlay.classList.remove('open');
});

/* ── Click outside to close ── */
panel.addEventListener('click', function(e){
  if(e.target === panel){
    panel.classList.remove('open');
    helpOverlay.classList.remove('open');
  }
});

/* ── Draggable header ── */
(function(){
  var drag = null;
  hdr.addEventListener('mousedown', function(e){
    if(e.target.id === 'help-close' || e.target.id === 'help-search-btn') return;
    e.preventDefault();
    hdr.style.cursor = 'grabbing';
    /* On first drag, switch from centered to absolute positioning */
    if(panel.style.transform){
      var r = panel.getBoundingClientRect();
      panel.style.left = r.left + 'px';
      panel.style.top = r.top + 'px';
      panel.style.transform = 'none';
    }
    var r2 = panel.getBoundingClientRect();
    drag = {sx: e.clientX, sy: e.clientY, ol: r2.left, ot: r2.top};
    function onMove(ev){
      if(!drag) return;
      var nl = Math.max(0, Math.min(window.innerWidth - 60, drag.ol + (ev.clientX - drag.sx)));
      var nt = Math.max(0, Math.min(window.innerHeight - 40, drag.ot + (ev.clientY - drag.sy)));
      panel.style.left = nl + 'px';
      panel.style.top = nt + 'px';
    }
    function onUp(){
      drag = null;
      hdr.style.cursor = 'grab';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
})();

/* ── Wire help button ── */
var helpBtn = document.getElementById('help-btn');
if(helpBtn){
  helpBtn.addEventListener('click', function(e){
    e.preventDefault();
    if(panel.classList.contains('open')){
      panel.classList.remove('open');
      helpOverlay.classList.remove('open');
    } else {
      /* Reset to centered position */
      panel.style.left = '50%';
      panel.style.top = '50%';
      panel.style.transform = 'translate(-50%,-50%)';
      panel.classList.add('open');
      helpOverlay.classList.add('open');
      body.scrollTop = 0;
    }
  });
}

})();
