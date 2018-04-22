// shouldnt be a global :(
var particleColors = [
  new b2ParticleColor(0xff, 0x00, 0x00, 0xff), // red
  new b2ParticleColor(0x00, 0xff, 0x00, 0xff), // green
  new b2ParticleColor(0x00, 0x00, 0xff, 0xff), // blue
  new b2ParticleColor(0xff, 0x8c, 0x00, 0xff), // orange
  new b2ParticleColor(0x00, 0xce, 0xd1, 0xff), // turquoise
  new b2ParticleColor(0xff, 0x00, 0xff, 0xff), // magenta
  new b2ParticleColor(0xff, 0xd7, 0x00, 0xff), // gold
  new b2ParticleColor(0x00, 0xff, 0xff, 0xff) // cyan
];
var container;
var world = null;
var threeRenderer;
var renderer;
var camera;
var scene;
var objects = [];
var timeStep = 1.0 / 60.0;
var velocityIterations = 15;
var positionIterations = 30;
var particleIterations = 1;
var test = {};
var projector = new THREE.Projector();
var planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
var g_groundBody = null;
var particleSystem = null;
var waterParticleDef = null;
var mouseMoveView = false;
var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;
var waterSize = 0.16;



document.addEventListener('drop', function(e){
  e.preventDefault();
  var file = e.dataTransfer.files[0];
  var reader = new FileReader();
  if(!(/\.phz$/i).test(file.name)){
    alert('Only algodoo scene files supported (.phz)');
    return;
  }
  loadFromBlob(file);

}, false);

document.addEventListener('dragover', function(e){
  e.preventDefault();
}, false);

document.addEventListener('drop', function(e){
  console.log(e); e.preventDefault();
}, false);

function initPlayer() {
  camera = new THREE.PerspectiveCamera(70
    , windowWidth / windowHeight
    , 1, 1000);
  threeRenderer = new THREE.WebGLRenderer();
  threeRenderer.setClearColor(0xEEEEEE);
  threeRenderer.setSize(windowWidth, windowHeight);
  var savedCam = null;
  try {
    savedCam = JSON.parse(localStorage.getItem("camera"));
  } catch(e){}
  camera.position.fromArray(savedCam || [0,0,100]);

  scene = new THREE.Scene();

  document.body.appendChild( this.threeRenderer.domElement);

  this.mouseJoint = null;

  // hack
  renderer = new Renderer();
  var gravity = new b2Vec2(0, -10);
  world = new b2World(gravity);

  playerInitCallback();
}

function playerInitCallback(obj) {
  // Init world
  //GenerateOffsets();
  //Init
  var that = this;
  document.addEventListener('keypress', function(event) {
    if (test.Keyboard !== undefined) {
      test.Keyboard(String.fromCharCode(event.which) );
    }
  });
  document.addEventListener('keyup', function(event) {
    if (test.KeyboardUp !== undefined) {
      test.KeyboardUp(String.fromCharCode(event.which) );
    }
  });

  document.addEventListener('mousedown', function(event) {
    var p = getMouseCoords(event);
    var aabb = new b2AABB;
    var d = new b2Vec2;

    d.Set(0.01, 0.01);
    b2Vec2.Sub(aabb.lowerBound, p, d);
    b2Vec2.Add(aabb.upperBound, p, d);
    console.log(p);
    var queryCallback = new QueryCallback(p);
    world.QueryAABB(queryCallback, aabb);
    console.log(queryCallback.fixture)
    if (queryCallback.fixture) {
      console.log('mouse');
      var body = queryCallback.fixture.body;
      var md = new b2MouseJointDef;
      md.bodyA = g_groundBody;
      md.bodyB = body;
      md.target = p;
      md.maxForce = 1000 * body.GetMass();
      that.mouseJoint = world.CreateJoint(md);
      body.SetAwake(true);
    } else {
      mouseMoveView = true;
    }

  });

  document.addEventListener('mousemove', function(event) {
    var p = getMouseCoords(event);
    if (that.mouseJoint) {
      that.mouseJoint.SetTarget(p);
    }
    if(mouseMoveView){

      var distance = camera.position.z / 300;

      camera.position.x += -event.movementX * distance;
      camera.position.y += event.movementY * distance;
      localStorage.setItem("camera", JSON.stringify(camera.position.toArray()));
    }
  });

  document.addEventListener('mouseup', function(event) {
    if (that.mouseJoint) {
      world.DestroyJoint(that.mouseJoint);
      that.mouseJoint = null;
    }
    if (test.MouseUp !== undefined) {
      test.MouseUp(getMouseCoords(event));
    }
    mouseMoveView = false;
  });


  window.addEventListener( 'resize', onWindowResize, false );

  document.addEventListener('wheel', function(e){
    camera.position.z += (e.deltaY / 100)*(camera.position.z/20);
    localStorage.setItem("camera", JSON.stringify(camera.position.toArray()));
  });

  loadFromRequest('../../scenes/'+(getSceneFromUrl() || localStorage.getItem('lastScene') || 'polytest.phz'));

  render();
}

function getSceneFromUrl(){
  var match = window.location.search.match('scene=(.+)($|&)');
  if(match) return match[1];
}

var loadFromBlob = function(file){
    if(file.name){
      localStorage.setItem('lastScene', file.name);
    }
    console.log('Loading scene zip data...');
    zip.createReader(new zip.BlobReader(file), function(reader){
      reader.getEntries(function(entries){
        entries.forEach(i=>{
          if(i.filename == 'scene.phn'){
            console.log('Unzipping scene...');
            i.getData(new zip.TextWriter(), function(text) {
              loadScene(text);
            });
          }
        })
      });
    });
}

var loadFromRequest = function(url){
  var oReq = new XMLHttpRequest();
  oReq.open("GET", url, true);
  oReq.responseType = "arraybuffer";

  oReq.onload = function (oEvent) {
    var blob = new Blob([oReq.response], {type: "image/png"});
    loadFromBlob(blob);
  };

  oReq.send(null);
}

var loadScene = function(data){
  ResetWorld();
  world.SetGravity(new b2Vec2(0, -10));
  var bd = new b2BodyDef;
  g_groundBody = world.CreateBody(bd);

  var psd = new b2ParticleSystemDef();
  psd.radius = waterSize;
  particleSystem = world.CreateParticleSystem(psd);

  Scene.reset(g_groundBody);

  var nodes = PhunParser.parse(data);
  console.log(nodes);
  nodes.forEach(n=>{
    if(n.type == "call"){
      try {
        eval(`${n.name}(${JSON.stringify(n.arguments)});`);
      } catch(e){
        console.log(`Error calling ${n.name}`, n.arguments, e);
      }
    }
    if(n.type == "struct"){
      console.log(n);
      if(0&&n.name == "Scene.Camera"){
        camera.position.x = n.properties.pan[0];
        camera.position.y = n.properties.pan[1];


    		// see http://www.bobatkins.com/photography/technical/field_of_view.html
    		var vExtentSlope = 0.5 * 35 / n.properties.zoom;

    		camera.fov = (180/Math.PI) * 2 * Math.atan( vExtentSlope );

        camera.updateProjectionMatrix();
      }
    }
  });

  Scene.initializeFixedJoints();
}
var lastCalledTime;
var lastTime = performance.now();
var render = function(time) {
  // bring objects into world
  renderer.currentVertex = 0;
  Step();
  renderer.draw();

  threeRenderer.render(scene, camera);
  requestAnimationFrame(render);
};

var ResetWorld = function() {
  if (world !== null) {
    while (world.joints.length > 0) {
      world.DestroyJoint(world.joints[0]);
    }

    while (world.bodies.length > 0) {
      world.DestroyBody(world.bodies[0]);
    }

    while (world.particleSystems.length > 0) {
      world.DestroyParticleSystem(world.particleSystems[0]);
    }
  }
  var savedCam = null
  try {
    savedCam = JSON.parse(localStorage.getItem("camera"));
  } catch(e){}
  camera.position.fromArray(savedCam || [0,0,100]);
};

var Step = function() {
  world.Step(timeStep, velocityIterations, positionIterations);
};

/**@constructor*/
function QueryCallback(point) {
  this.point = point;
  this.fixture = null;
}

/**@return bool*/
QueryCallback.prototype.ReportFixture = function(fixture) {
  var body = fixture.body;
  console.log(fixture);
  if (body.GetType() === b2_dynamicBody) {
    var inside = fixture.TestPoint(this.point);
    if (inside) {
      this.fixture = fixture;
      return false;
    }
  }
  return true;
};

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  threeRenderer.setSize( window.innerWidth, window.innerHeight );
}

function getMouseCoords(event) {
  var mouse = new THREE.Vector3();
  mouse.x = (event.clientX / windowWidth) * 2 - 1;
  mouse.y = -(event.clientY / windowHeight) * 2 + 1;
  mouse.z = 300;

  projector.unprojectVector(mouse, camera);
  var dir = mouse.sub(camera.position).normalize();
  var distance = -camera.position.z / dir.z;
  var pos = camera.position.clone().add(dir.multiplyScalar(distance));
  var p = new b2Vec2(pos.x, pos.y);
  return p;
}
