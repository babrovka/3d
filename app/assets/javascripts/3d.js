// TODO: wrap in onload
// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, scene, renderer;
var dae;

var loader = new THREE.ColladaLoader();
loader.options.convertUpAxis = true;
loader.load( '/models/model.dae', function ( collada ) {
  dae = collada.scene;

  dae.scale.x = dae.scale.y = dae.scale.z = 0.2;
  dae.updateMatrix();

  init();
  render();
});

function init() {
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );

  var aspect = window.innerWidth / window.innerHeight;
  var d = 20;
  camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000 );
  camera.position.set( 0, 20, 20 );
  // camera.rotation.order = 'YXZ';
  camera.rotation.y = Math.PI / 3;
  camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) );

  scene = new THREE.Scene();

  // Grid
  var size = 14, step = 10;

  var geometry = new THREE.Geometry();
  var material = new THREE.LineBasicMaterial( { color: 0x303030 } );

  for ( var i = - size; i <= size; i += step ) {
    geometry.vertices.push( new THREE.Vector3( - size, - 0.04, i ) );
    geometry.vertices.push( new THREE.Vector3(   size, - 0.04, i ) );
    geometry.vertices.push( new THREE.Vector3( i, - 0.04, - size ) );
    geometry.vertices.push( new THREE.Vector3( i, - 0.04,   size ) );
  }

  var line = new THREE.Line( geometry, material, THREE.LinePieces );
  scene.add( line );

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

  // Axes
  scene.add( new THREE.AxisHelper( 40 ) );

  container.appendChild( renderer.domElement );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );
}

function render() {
  requestAnimationFrame(render);
  renderer.render( scene, camera );
  stats.update();
}
