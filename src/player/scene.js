var sceneObjectEntityIds = {};
var sceneObjectGeomIds = {};
var sceneObjectBodyIds = {};
var lineEndPoints = {};
var keyBindings = {};

document.addEventListener('keydown', function(e){
  var key = e.code.match(/^(Key|Arrow|Digit)(.+)|/i);
  if(!key[2]) return;
  key = key[2].toLowerCase();

  if(keyBindings[key])
  keyBindings[key].forEach(function(handlers){
    handlers.down();
  });

});

document.addEventListener('keyup', function(e){
  var key = e.code.match(/^(Key|Arrow|Digit)(.+)|/i);
  if(!key[2]) return;
  key = key[2].toLowerCase();
  if(keyBindings[key])
  keyBindings[key].forEach(function(handlers){
    handlers.up();
  });
});


b2_maxPolygonVertices = 256;


function getPolygonDimensions(vertices){
  var hx=0,hy=0;
  var lx=0,ly=0;
  vertices.forEach(v=>{
    if(v[0]>hx) hx = v[0];
    if(v[0]<lx) lx = v[0];
    if(v[1]>hy) hy = v[1];
    if(v[1]<ly) ly = v[1];
  })
  return {
    x: Math.abs(lx-hx),
    y: Math.abs(ly-hy),
  }
}

function simplifyPolygon(polygon){
    var result = [];
    var canOptimize = true;
    var newRes = [];
    var dim = getPolygonDimensions(polygon);
    var size = Math.sqrt(dim.x * dim.y) / 50;
    while(canOptimize){
      for(var i=0; i<polygon.length; i++){
        var p1 = polygon[i > 0 ? i-1 : polygon.length-1];
        var p2 = polygon[i];
        var p3 = polygon[i+1 < polygon.length ? i+1 : 0];

        canOptimize = false;
        if(getAngle(p1,p2,p3) > 2 && getDist(p1,p2) > size){
          newRes.push(p2);
        }
      }
      polygon = newRes;
    }
    return polygon;
}

function getAngle(vec1,vec2,vec3)
{
    lengthA = getDist(vec1,vec2);
    lengthB = getDist(vec2,vec3);
    lengthC = getDist(vec3,vec1);

    calc = ((lengthA * lengthA) + (lengthB * lengthB) - (lengthC * lengthC)) / (2 * lengthA * lengthB);
    var r = Math.abs((Math.acos(calc)* 180/Math.PI) -180);
    return r;
}

function getDist(vec1,vec2){
   return Math.sqrt(Math.pow(vec2[0] - vec1[0], 2) + Math.pow(vec2[1] - vec1[1],2));
}

function PhunScene(){
  this.reset = function(){
    sceneObjectEntityIds = {};
    sceneObjectGeomIds = {"0":g_groundBody};
    sceneObjectBodyIds = {};
    lineEndPoints = {};
    keyBindings = {};
    camTracked = null;
  }

  function initShape(shape, params){


    if(params.onCollide){
      params.onCollide = eval(`(${transformThymeToJs(params.onCollide)})`);
    }





    bd = new b2BodyDef;
    bd.type = (params.glued && !params.body) ? b2_staticBody : b2_dynamicBody;
    if(params.pos) bd.position.Set(params.pos[0]*unitConvertion, params.pos[1]*unitConvertion);
    if(params.angle) bd.angle = params.angle;
    var body = world.CreateBody(bd);

    var fixture = null;

    if(!(shape instanceof Array)){
      var fd = new b2FixtureDef;
      fd.density = params.density || 2;
      fd.restitution = typeof params.restitution == "number" ? params.restitution : 0.5;
      fd.friction = typeof params.friction == "number" ? params.friction : 0.5 ;

      if(params.body) fd.filter.groupIndex = -params.body;
      if(params.heteroCollide) fd.filter.groupIndex = -params.collideSet;

      fd.filter.maskBits = fd.filter.categoryBits = typeof params.collideSet == "number" ? params.collideSet : 1;

      fd.shape = shape;
      fixture = body.CreateFixtureFromDef(fd);
    } else {
      shape.forEach(function(tri){
        var fd = new b2FixtureDef;
        fd.density = params.density || 2;
        fd.restitution = typeof params.restitution == "number" ? params.restitution : 0.5;
        fd.friction = typeof params.friction == "number" ? params.friction : 0.5 ;

        var shape = new b2PolygonShape;
        shape.vertices = tri;
        fd.shape = shape;
        fixture = body.CreateFixtureFromDef(fd);
      });
    }

    sceneObjectGeomIds[params.geomID] = sceneObjectEntityIds[params.entityID] = body;

    if(params.body){
      if(!sceneObjectBodyIds[params.body]) sceneObjectBodyIds[params.body] = [];
      sceneObjectBodyIds[params.body].push(body);
    }
    if(params.vel){
      var v = new b2Vec2(params.vel[0]*unitConvertion,params.vel[1]*unitConvertion);
      body.SetLinearVelocity(v);
      body.SetAngularVelocity(params.angvel);
    }

    body.userData = params;
    return body;
  }

  this.setBodyAttrib = function(){
    console.log('notimplemented')
  }

  this.addBox = function addBox(params){
    shape = new b2PolygonShape;
    shape.SetAsBoxXY(params.size[0]*unitConvertion/2, params.size[1]*unitConvertion/2);
    initShape(shape, params);
  }

  this.addPlane = function addPlane(params){
    var shape = new b2PolygonShape;
    shape.vertices[0] = new b2Vec2(0,500*unitConvertion)
    shape.vertices[1] = new b2Vec2(0,-500*unitConvertion);
    shape.vertices[2] = new b2Vec2(-500*unitConvertion,-500*unitConvertion);
    shape.vertices[3] = new b2Vec2(-500*unitConvertion,500*unitConvertion);
    params.glued = true; params.body = 0;
    initShape(shape, params);
  }

  this.addPolygon = function addPolygon(params){

    var trans = params.polyTrans || [1,0,0,1];
    var transformedSurfaces = params.surfaces.map(function(surface){
      return surface.map(a=>[a[0]*unitConvertion*trans[0],a[1]*unitConvertion*trans[3]]);
    }).map(simplifyPolygon);
    params.surfaces = transformedSurfaces.map(surface => surface.map(a => new b2Vec2(a[0],a[1])));
    console.log(params);
    var data = earcut.flatten(transformedSurfaces);
    var tris = earcut(data.vertices, data.holes, data.dimensions);

    var vertices = [];
    for(var i = 0; i<data.vertices.length; i+=2){
      vertices.push(new b2Vec2(data.vertices[i],data.vertices[i+1]));
    }

    var surfaces = [];
    for(var i = 0; i<tris.length; i+=3){
      surfaces.push([
        vertices[tris[i]],
        vertices[tris[i+1]],
        vertices[tris[i+2]],
      ]);
    }

    var body = initShape(surfaces, params);
  };

  this.addCircle = function addCircle(params){
    shape = new b2CircleShape;
    shape.radius = (params.radius||1)*unitConvertion;
    initShape(shape, params);
  }

  this.addHinge = function addHinge(params){
    var jd = new b2RevoluteJointDef;
    if(params.motor || params.buttonForward || params.buttonBack){
      jd.enableMotor = true;
      jd.maxMotorTorque = Math.pow(params.motorTorque,unitConvertion);
    }
    if(params.motor){
      jd.motorSpeed = params.motorSpeed;
    }

    var body1 = g_groundBody;
    var body2 = g_groundBody;
    var anchor = new b2Vec2();
    var ax = new b2Vec2(0,1);


    if(sceneObjectGeomIds[params.geom0]){
      body1 = sceneObjectGeomIds[params.geom0];
    }
    anchor1 = body1.GetWorldPoint(new b2Vec2(params.geom0pos[0]*unitConvertion,params.geom0pos[1]*unitConvertion));
    if(sceneObjectGeomIds[params.geom1]){
      body2 = sceneObjectGeomIds[params.geom1];
    }

    var motor = jd.InitializeAndCreate(body1,body2, anchor1,  ax);

    if(params.buttonForward){
      addKeyBinding(params.buttonForward, e=>{motor.SetMotorSpeed(0)}, e=>{motor.SetMotorSpeed(params.motorSpeed);});
    }
    if(params.buttonBack){
      addKeyBinding(params.buttonBack, e=>{motor.SetMotorSpeed(0)}, e=>{motor.SetMotorSpeed(-params.motorSpeed)});
    }
    initJoint(motor, params);
  }

  this.addSpring = function addSpring(params){
    var jd = new b2DistanceJointDef;
    jd.distance = params.length*unitConvertion;
    jd.frequencyHz = Math.max(1, Math.min(30, params.constant));
    jd.dampingRate = params.dampingFactor;

    var p0 = lineEndPoints[params.lineEndPoint0];
    var p1 = lineEndPoints[params.lineEndPoint1];

    var b0 = sceneObjectGeomIds[p0.geom];
    var v0 = arr2vec(p0.relPoint);

    var b1 = sceneObjectGeomIds[p1.geom];
    var v1 = arr2vec(p1.relPoint);

    var spring = jd.InitializeAndCreate(b0,b1,v0,v1);
    initJoint(spring, params);
  }

  this.addLineEndPoint = function addLineEndPoint(params){
    lineEndPoints[params.entityID] = params;
  }

  this.addFixjoint = function addFixjoint(params){
    var body1 = sceneObjectGeomIds[params.geom0];
    if(params.geom1 == 0){
      body1.SetType(b2_staticBody);
    } else if(body1.userData.body === 0) {
      var body2 = sceneObjectGeomIds[params.geom1];
      var jd = new b2WeldJointDef();
      jd.dampingRate=1;
      var joint = jd.InitializeAndCreate(body1,body2, body1.GetWorldCenter());
    }

    params.isFixJoint = true;

    initJoint(joint, params, e=>body1.SetType(b2_dynamicBody));
  }

  function arr2vec(arr){
    return new b2Vec2(arr[0]*unitConvertion,arr[1]*unitConvertion);
  }


  function addKeyBinding(key, up, down){
    if(!keyBindings[key]) keyBindings[key] = [];
    keyBindings[key].push({
      up: up,
      down: down
    });
  }

  function initJoint(joint, params, onDestoy){
    if(params.buttonDestroy){
      addKeyBinding(''+params.buttonDestroy, e=>{
        if(onDestoy) onDestoy();
        else world.DestroyJoint(joint);
      },e=>{});
    }
  }

  this.addGroup = function(params){

    if(params.name == "tracked"){
      camTrackEntity(params.entityIDs[0]);
    }
  }

  function addLayer(params){

  }

  this.addContact = function(){}
  this.addLayer = function(){}

  this.addWidget = function(){}
  this.addThruster = function(){}

  this.addWater = function(params){
    var pg = new b2ParticleGroup(null);
    params.vecs.forEach(p=>{
      var pd = new b2ParticleDef;
      pd.position.Set(p[0]*unitConvertion,p[1]*unitConvertion);
      pd.flags = b2_elasticParticle;
      pd.group = pg
      particleSystem.CreateParticle(pd);
    });

  }

  this.initializeFixedJoints = function(){
    Object.values(sceneObjectBodyIds).forEach(function(bArr){
      var h,mb,m,mbi;
      bArr.forEach((b,i)=>{
        m = b.GetMass();
        if(!mb || m > h){
          mb = b;
          h = m;
          mbi = i;
        }
      });
      bArr.forEach((b,i)=>{
      //  bArr.forEach((bo,io)=>{
          if(i !== mbi){
            var jd = new b2WeldJointDef();
            jd.dampingRate=1;
            setTimeout(e=>jd.InitializeAndCreate(b,mb,b.GetWorldCenter()), i*10);
          }
      //  });
      });
    });
  }

};

var Scene = new PhunScene();
