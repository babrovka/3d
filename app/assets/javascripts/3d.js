// TODO: wrap in onload
// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, scene, renderer, projector;
var dae;
var ground;
var objects, groups;

function xhr(method, url, data, success, fail) {
  var r = new XMLHttpRequest();
  r.open(method, url, true);
  r.addEventListener("load", success, false);
  r.addEventListener("error", fail, false);
  r.send(data);
}

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
  camera.position.set( 17.32, 14.14, 17.32 );
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

  objects = dae.children[0].children.reduce(function(acc, children) { return acc.concat(children); }, []);

  // Group by object ids
  groups = [
    {name: 'pyramid', min: 1, max: 21 },
    {name: 'warehouse', min: 22, max: 42 },
    {name: 'angle', min: 43, max: 47 },
    {name: 'wall', min: 48, max: 50 },
    {name: 'building', min: 51, max: 55 },
    {name: 'ambar', min: 56, max: 58 }
  ];

  // Group objects
  groups.forEach(function(group) {
    // TODO: filter instead of reduce
    group.members = objects.reduce(function(matching, object) {
      if(object.id >= group.min && object.id <= group.max) return matching.concat(object);
      else return matching;
    }, []);
  });

  xhr('get', '/states', '', function(response) {
    var states = JSON.parse(response.target.response);
    states.forEach(function(group_state) {
      var group = groups.find(function(group) { return group.name === group_state.name; });

      if(group) {
        group.comment = group_state.comment;
        group.state = group_state.state;
      }

      if(group_state.state === 1) {
        group.members.forEach(function(object) {
          var red = 0xaa4444;
          var material = new THREE.MeshBasicMaterial( { color: red } );
          object.material = material;
        });
      }
    });
    render();
  });

  var handler = function(intersect) {
    var id = intersect.object.id;
    // TODO: find instead of reduce
    var group = groups.reduce(function(target, group) {
      if(id >= group.min && id <= group.max) return group;
      else return target;
    });

    objects.forEach(function(object) {
      if(object.old_material) object.material = object.old_material;
    });

    var major_color = Math.random() * 0xf00000;
    group.members.foreach(function(object) {
      var minor_color = math.random() * 0xfffff;
      var material = new THREE.MeshBasicMaterial( { color: (major_color + minor_color) } );
      object.old_material = object.material;
      object.material = material;
    });

    render();
  };

  container.addEventListener( 'dblclick', mouseReact(handler), false );
  // container.addEventListener( 'mousemove', mouseReact(handler), false );
}

function render() {
  renderer.render( scene, camera );
  stats.update();
}

function mouseReact(handler) {
  return function(event) {
    event.preventDefault();
    var mouse3D = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
    var raycaster = projector.pickingRay( mouse3D.clone(), camera );
    var intersects = raycaster.intersectObjects(objects);
    if(intersects.length > 0)
      handler(intersects[0]);
  };
}
