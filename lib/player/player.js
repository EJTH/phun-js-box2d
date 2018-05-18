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
var unitConvertion = 3;
var camTracked = null;


function worldToScenePoint(vec){
  return [vec.x/unitConvertion, vec.y/unitConvertion];
}
function sceneToWorldPoint(arr){
  return new b2Vec2(arr[0]*unitConvertion, arr[1]*unitConvertion);
}

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

  camTracked = null;

  document.body.appendChild( this.threeRenderer.domElement);

  this.mouseJoint = null;

  // hack
  renderer = new Renderer();
  var gravity = new b2Vec2(0, -10);
  world = new b2World(gravity);
  world.SetContactListener({
    PreSolve: function(contacts, manifold){
      var b1 = contacts.GetFixtureA().body, b2 = contacts.GetFixtureB().body;
      [b1,b2].forEach(function(body, i){
        if(body.userData && body.userData.onCollide){
          var tb = body;
          var ob = i ? b1 : b2;
          setTimeout(function(){
            body.userData.onCollide({
              pos: worldToScenePoint(b1.GetWorldPoint(contacts.GetWorldManifold().GetPoint())),
              this: tb.userData,
              other: ob.userData
            });
          },0);
        }
      });
    }
  })
  playerInitCallback();
}

var le
var ms;

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

    var queryCallback = new QueryCallback(p);
    world.QueryAABB(queryCallback, aabb);

    if (queryCallback.fixture) {
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
      ms = new b2Vec2();
      b2Vec2.Sub(ms, screenToWorld(0,0),screenToWorld(1,1));
    }

  });

  document.addEventListener('mousemove', function(event) {
    var p = getMouseCoords(event);
    if (that.mouseJoint) {
      that.mouseJoint.SetTarget(p);
    }
    if(mouseMoveView){
      if(le){

        camera.position.x += (event.clientX-le.clientX)*ms.x;
        camera.position.y -= (le.clientY-event.clientY)*ms.y;
      }
      le = event;
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
    le = null;
    mouseMoveView = false;
  });


  window.addEventListener( 'resize', onWindowResize, false );

  document.addEventListener('wheel', function(e){
    camera.fov += e.deltaY*(camera.fov*0.0005);
    camera.updateProjectionMatrix();
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
      if(n.name == "Scene.Camera"){
        camera.position.x = n.properties.pan[0]*unitConvertion;
        camera.position.y = n.properties.pan[1]*unitConvertion;


    		// see http://www.bobatkins.com/photography/technical/field_of_view.html
    		var vExtentSlope = 0.5 * 3.5 / n.properties.zoom;

    		camera.fov = (180/Math.PI) * 2 * Math.atan( vExtentSlope );

        camera.updateProjectionMatrix();
      }

      if(n.name == "Sim"){
        var props = n.properties;
        world.SetGravity(new b2Vec2(0, props.gravitySwitch ? props.gravityStrength*-1 : 0));
      }
    }
  });

  Scene.initializeFixedJoints();
}
var lastCalledTime;
var lastTime = performance.now();
var render = function(time) {
  if(camTracked){
    var p = camTracked.GetPosition();
    camera.position.x = p.x;
    camera.position.y = p.y;
  }
  // bring objects into world
  renderer.currentVertex = 0;
  Step();
  renderer.draw();

  threeRenderer.render(scene, camera);
  requestAnimationFrame(render);
};

function camTrackEntity(id){
  if(sceneObjectEntityIds[id]){
    camTracked = sceneObjectEntityIds[id];
  }
}

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

function screenToWorld(x,y){
  var sp = new THREE.Vector3();
  sp.x = (x / windowWidth) * 2 - 1;
  sp.y = -(y / windowHeight) * 2 + 1;
  sp.z = 300;

  projector.unprojectVector(sp, camera);
  var dir = sp.sub(camera.position).normalize();
  var distance = -camera.position.z / dir.z;
  var pos = camera.position.clone().add(dir.multiplyScalar(distance));
  var p = new b2Vec2(pos.x, pos.y);
  return p;
}

function getMouseCoords(event) {
  return screenToWorld(event.clientX, event.clientY);
  return p;
}
