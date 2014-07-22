// TODO: wrap in onload
// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, scene, renderer, projector;
var dae;
var ground;

var loader = new THREE.ColladaLoader();
loader.options.convertUpAxis = true;
loader.load( '/models/buildings.dae', function ( collada ) {
  dae = collada.scene;
  dae.scale.x = dae.scale.y = dae.scale.z = 0.01;
  dae.position.x = -10; dae.position.z = 10;
  dae.updateMatrix();
  init();
  render();
});

// var loader = new THREE.OBJLoader();
// loader.load( '/models/damba_simple_v3.obj', function ( obj ) {
//   dae = obj;
//   dae.scale.x = dae.scale.y = dae.scale.z = 0.1;
//   dae.rotation.x = Math.PI/2;
//   dae.updateMatrix();
//   init();
//   render();
// });

function deepComputeBoundingBox(object) {
  object.children.forEach(deepComputeBoundingBox);
  if(object.geometry) object.geometry.computeBoundingBox();
}

function init() {
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );

  projector = new THREE.Projector();

  var aspect = window.innerWidth / window.innerHeight;
  var d = 20;
  camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000 );
  camera.position.set( 0, 20, 20 );
  camera.rotation.y = Math.PI / 3;
  camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) );

  scene = new THREE.Scene();

  // Add the COLLADA
  scene.add( dae );

  // Controls
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render );
  controls.noZoom = false;
  controls.noPan = false;
  controls.maxPolarAngle = Math.PI / 3;
  controls.minPolarAngle = Math.PI / 3;
  controls.zoomSpeed = 1;

  // Lights
  var light = new THREE.PointLight( 0xffffff, 0.8 );
  light.position.set( 0, 50, 50 );
  scene.add( light );

  light = new THREE.AmbientLight( 0x404040 );
  scene.add( light );

  // Axes
  // scene.add( new THREE.AxisHelper( 40 ) );

  // Ground
  var plane_geometry = new THREE.PlaneGeometry( 100, 100 );
  var plane_material = new THREE.MeshBasicMaterial( {color: 0x6666aa, side: THREE.DoubleSide} );
  ground = new THREE.Mesh(plane_geometry, plane_material);
  ground.rotation.x = Math.PI / 2;
  scene.add(ground);

  // Grid
  var size = 100, step = 10;

  var geometry = new THREE.Geometry();
  var material = new THREE.LineBasicMaterial( { color: 0x303030 } );

  for ( var i = - size; i <= size; i += step ) {
    geometry.vertices.push( new THREE.Vector3( - size, 0.04, i ) );
    geometry.vertices.push( new THREE.Vector3(   size, 0.04, i ) );
    geometry.vertices.push( new THREE.Vector3( i, 0.04, - size ) );
    geometry.vertices.push( new THREE.Vector3( i, 0.04,   size ) );
  }

  var line = new THREE.Line( geometry, material, THREE.LinePieces );
  scene.add( line );

  container.appendChild( renderer.domElement );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );

  container.addEventListener( 'dblclick', onDocumentMouseDown, false );
}

function render() {
  renderer.render( scene, camera );
  stats.update();
}

function onDocumentMouseDown( event ) {
  event.preventDefault();
  // var objects = dae.children[0].children.map(function(el) { return el.children; } ).reduce(function(acc, children) { return acc.concat(children); });
  var objects = dae.children[0].children.reduce(function(acc, children) { return acc.concat(children); }, []);

  var mouse3D = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
  var raycaster = projector.pickingRay( mouse3D.clone(), camera );
  var intersects = raycaster.intersectObjects(objects);
  console.log(intersects);

  if(intersects.length > 0) {
    var intersect = intersects[0];
    var color = Math.random() * 0xffffff;
    var material = new THREE.MeshBasicMaterial( { color: color } );
    // if(intersect.object.material.materials)
    //   intersect.object.material.materials.forEach(function(material) { material.color.setHex(color); });
    // else
      intersect.object.material = material; //.color.setHex(color);
  }

  render();
}
