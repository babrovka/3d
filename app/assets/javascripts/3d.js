var container, balloons = [], table;
var camera, scene, renderer, projector;
var dae;

var current_object, intersect_objects;

function xhr(method, url, data, success, fail) {
  var r = new XMLHttpRequest();
  r.open(method, url, true);
  r.addEventListener("load", success, false);
  r.addEventListener("error", fail, false);
  r.send(data);
}

window.addEventListener('load', function() {
  if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
  window.html = HTML.query.bind(HTML);

  var loader = new THREE.ColladaLoader();
  loader.options.convertUpAxis = true;
  loader.load( '/models/buildings2.dae', function ( collada ) {
    dae = collada.scene;
    dae.scale.x = dae.scale.y = dae.scale.z = 0.5;
    dae.position.x = -10; dae.position.z = 10;
    dae.updateMatrix();
    deepComputeBoundingBox(dae);
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
});

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
  var controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'end', render );
  controls.addEventListener( 'change', render );
  controls.maxPolarAngle = Math.PI / 3;
  controls.minPolarAngle = Math.PI / 3;
  controls.zoomSpeed = 1;
  controls.dollyIn = function( dollyScale ) {
    if ( dollyScale === undefined ) dollyScale = Math.pow( 0.95, this.zoomSpeed );
    this.object.scale.x *= dollyScale;
    this.object.scale.y *= dollyScale;
  };
  controls.dollyOut = function( dollyScale ) {
    if ( dollyScale === undefined ) dollyScale = Math.pow( 0.95, this.zoomSpeed );
    this.object.scale.x /= dollyScale;
    this.object.scale.y /= dollyScale;
  };

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
  var ground = new THREE.Mesh(plane_geometry, plane_material);
  ground.rotation.x = Math.PI / 2;
  scene.add(ground);

  // Grid
  var size = 100, step = 2;

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

  intersect_objects = dae.children.map(function(object) { return object.children[0]; });

  var alerted_material = new THREE.MeshLambertMaterial( { color: 0xbb4444 } );
  var normal_material = new THREE.MeshLambertMaterial( { color: 0xaaaaaa } );
  var selected_material = new THREE.MeshLambertMaterial( { color: 0x88cc88 } );

  xhr('get', '/states', '', function(response) {
    table = HTML.body.add('ul');
    table.classList.add('objects');
    var states = JSON.parse(response.target.response);
    states.forEach(function(state) {
      var object = dae.getObjectById(state.id);

      if(object) {
        object.comment = state.comment;
        object.state = state.state;

        if(state.state === 1) {
          object.children[0].material = alerted_material;
        } else {
          object.children[0].material = normal_material;
        }

        // var balloon = HTML.body.add('span');
        // balloon.classList.add('balloon');
        // balloon.textContent = state.id;
        // balloon.object_id = state.id;
        // balloons.unshift(balloon);

        var li = table.add('li');
        li.textContent = state.id;
        li.addEventListener('click', function() { handler(object.children[0]); });
      }
    });
    render();
  });

  var handler = function(object) {
    if(current_object) {
      if(current_object.state === true) {
        current_object.material = alerted_material;
      } else {
        current_object.material = normal_material;
      }
    }

    object.material = selected_material;
    current_object = object;

    var state = html('#state');
    state.classList.remove('disabled');
    state.query('#name').textContent = object.parent.id;
    state.query('#comment').value = object.parent.comment || '';
    state.query('#alert').checked = object.parent.state;

    render();
  };

  container.addEventListener( 'dblclick', mouseReact(handler), false );
  // container.addEventListener( 'mousemove', mouseReact(handler), false );

  var state = html('#state');
  state.query('#comment').addEventListener('keydown', function(event) {
    if(event.keyCode == 13) {
      current_object.comment = html('#state #comment').value;
      xhr('post', '/comment?id=' + current_object.parent.id + "&comment=" + current_object.comment);
    }
  });

  state.query('#alert').addEventListener('click', function() {
    current_object.state = state.query('#alert').checked;
    if(current_object.state === true) {
      current_object.material = alerted_material;
    } else {
      current_object.material = normal_material;
    }
    render();
    xhr('post', '/state?id=' + current_object.parent.id + "&state=" + current_object.state);
  });
}

function render() {
  renderer.render( scene, camera );
  updateBalloons();
}

function mouseReact(handler) {
  return function(event) {
    event.preventDefault();
    // clientX relative to div
    var mouse3D = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
    var raycaster = projector.pickingRay( mouse3D.clone(), camera );
    var intersects = raycaster.intersectObjects(intersect_objects);
    if(intersects.length > 0)
      handler(intersects[0].object);
  };
}

function updateBalloons() {
  // balloons.forEach(updateBalloon);
}

function updateBalloon(balloon) {
  var object = dae.getObjectById(balloon.object_id);
  if(object) {
    var on_screen = calc2DPoint(object.children[0].geometry.boundingBox.max);
    console.log(object.children[0].geometry.boundingBox.max);

    balloon.style.left = on_screen.x + 'px';
    balloon.style.top = on_screen.y + 'px';
  }
}

function calc2DPoint(worldVector) {
  var vector = projector.projectVector(worldVector, camera);
  var halfWidth = renderer.domElement.width / 2;
  var halfHeight = renderer.domElement.height / 2;
  return {
    x: Math.round(vector.x * halfWidth + halfWidth),
    y: Math.round(-vector.y * halfHeight + halfHeight)
  };
}
