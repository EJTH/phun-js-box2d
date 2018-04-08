var sceneObjectEntityIds = {};
var sceneObjectGeomIds = {};
var sceneObjectBodyIds = {};

var keyBindings = {};
document.addEventListener('keydown', function(e){
  var key = e.code.match(/(Key|Arrow|Digit)(.+)|/i);
  console.log(key,e);
  if(!key) return;
  key = key[2].toLowerCase();

  if(keyBindings[key])
  keyBindings[key].forEach(function(handlers){
    console.log(keyBindings[key], key, handlers);
    handlers.down();
  });

});

document.addEventListener('keyup', function(e){
  var key = e.code.match(/(Key|Arrow|Digit)(.+)|/i);
  if(!key) return;
  key = key[2].toLowerCase();
  if(keyBindings[key])
  keyBindings[key].forEach(function(handlers){
    handlers.up();
  });
});



var removedPolygons = 0;

var unitConvertion = 3;
b2_maxPolygonVertices = 256;
function getAngle(vec1,vec2,vec3)
{
    lenghtA = Math.sqrt(Math.pow(vec2.x - vec1.x, 2) + Math.pow(vec2.y - vec1.y,2));
    lenghtB = Math.sqrt(Math.pow(vec3.x - vec2.x,2) + Math.pow(vec3.y - vec2.y, 2));
    lenghtC = Math.sqrt(Math.pow(vec3.x - vec1.x,2) + Math.pow(vec3.y - vec1.y, 2));
    calc = ((lenghtA * lenghtA) + (lenghtB * lenghtB) - (lenghtC * lenghtC)) / (2 * lenghtA * lenghtB);

    return Math.abs((Math.acos(calc)* 180/Math.PI) -180);
}

function dist(a,b){
  var d = new b2Vec2;
  b2Vec2.Sub(d,a,b);
  console.log(d.Length());
  return d.Length();
}


function PhunScene(){
  function initShape(shape, params){
    var fd = new b2FixtureDef;

    fd.density = params.density;
    fd.restitution = params.restitution;
    fd.friction = params.friction;

    if(params.body) fd.filter.groupIndex = -params.body;
    if(params.heteroCollide) fd.filter.groupIndex = -params.collideSet;

    fd.filter.categoryBits = params.collideSet;
    fd.filter.maskBits = params.collideSet;

    var body = null;

    bd = new b2BodyDef;
    bd.type = (params.glued && !params.body) ? b2_staticBody : b2_dynamicBody;
    bd.position.Set(params.pos[0]*unitConvertion, params.pos[1]*unitConvertion);
    bd.angle = params.angle;

    body = world.CreateBody(bd);

    var fixture = null;

    if(!(shape instanceof Array)){
      fd.shape = shape;
      fixture = body.CreateFixtureFromDef(fd);
    } else {
      seperator = new b2Seperator;
      try {
        fixture = seperator.Seperate(body, fd, shape);
        console.log(fixture);
      } catch(e){
        console.log("Failed to create polygon shape. Fallback to ChainShape",seperator.Validate(shape));
        var cs = new b2ChainShape;

        while(shape.length > 100){
          shape = shape.filter(function(v,i){
            return i%2==0;
          });
        }
        console.info(`Creating chainshape with ${shape.length} vertices...`);
        shape.forEach((v,i)=>{
          cs.vertices[i] = v;
        });
        cs.CreateLoop();
        fd.shape = cs;

        fixture = body.CreateFixtureFromDef(fd);

        var massData = new b2MassData(2,new b2Vec2(),0.1);
        body.SetMassData(massData);

      }
    }

    sceneObjectGeomIds[params.geomID] = sceneObjectEntityIds[params.entityID] = body;

    if(params.body){
      if(!sceneObjectBodyIds[params.body]) sceneObjectBodyIds[params.body] = [];
      sceneObjectBodyIds[params.body].push(body);
    }
    if(params.vel){
      var v = new b2Vec2(params.vel[0]*unitConvertion,params.vel[1]*unitConvertion);
      body.SetLinearVelocity(v);
      body.SetAngularVelocity(params.angvel)
    }
    body.userData = params;
    return body;
  }

  this.addBox = function addBox(params){
    shape = new b2PolygonShape;
    shape.SetAsBoxXY(params.size[0]*unitConvertion/2, params.size[1]*unitConvertion/2);
    initShape(shape, params);
  }

  this.addPlane = function addPlane(params){
    var shape = new b2PolygonShape;
    shape.vertices[0] = new b2Vec2(0,10000)
    shape.vertices[1] = new b2Vec2(0,-10000);
    shape.vertices[2] = new b2Vec2(-10000,-10000);
    shape.vertices[3] = new b2Vec2(-10000,0);
    params.glued = true; params.body = 0;
    initShape(shape, params);
  }

  this.addPolygon = function addPolygon(params){
    var trans = params.polyTrans || [1,0,0,1];

    var shape = new b2PolygonShape;
    var surfaces = params.surfaces[0].map(a=>new b2Vec2(a[0]*unitConvertion*trans[0],a[1]*unitConvertion*trans[3]));
    var accepted = [];


    surfaces.forEach(function(v,i){
      if(i  == 0 || i==surfaces.length-1 || i>0 && i<surfaces.length && getAngle(surfaces[i-1], v, surfaces[i+1]) > 1){
        accepted.push(v);
      }
    });

    var body = initShape(accepted, params);
  };

  this.addCircle = function addCircle(params){
    shape = new b2CircleShape;
    shape.radius = params.radius*unitConvertion;
    initShape(shape, params);
  }

  this.addHinge = function addHinge(params){
    var jd = new b2RevoluteJointDef;
    if(params.motor){
      jd.enableMotor = true;
      jd.maxMotorTorque = Math.pow(params.motorTorque,unitConvertion);
      jd.motorSpeed = params.motorSpeed;
      console.log('motor',jd);
    }

    var body1 = g_groundBody;
    var body2 = g_groundBody;
    var anchor1 = new b2Vec2();
    var anchor2 = new b2Vec2();
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
      addKeyBinding(params.buttonForward, e=>{motor.SetMotorSpeed(0)}, e=>{motor.SetMotorSpeed(params.motorSpeed); console.log(params.motorSpeed)});
    }
    if(params.buttonBackward){
      addKeyBinding(params.buttonBackward, e=>{motor.SetMotorSpeed(0)}, e=>{motor.SetMotorSpeed(-params.motorSpeed)});
    }
    console.log(motor);
  }

  function addKeyBinding(key, up, down){
    if(!keyBindings[key]) keyBindings[key] = [];
    keyBindings[key].push({
      up: up,
      down: down
    });
  }

  function addLineEndPoint(params){
    console.log('addLineEndPoint not implemented');
  }

  function addSpring(params){
    console.log('addSpring not implemented');
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

    if(params.buttonDestroy){
      console.log('test...')
      addKeyBinding(''+params.buttonDestroy, e=>{
        console.log('destroy');
        if(params.geom1 == 0) body1.SetType(b2_dynamicBody);
        else world.DestroyJoint(joint);
      },e=>{});
    }

  }

  function setBodyAttrib(params){
    console.log('setBodyAttrib not implemented');
  }

  this.addGroup = function addGroup(params){
    console.log(params);
  }

  function addLayer(params){

  }
  this.addContact = function(){}
  this.addLayer = function(){}
  this.addGroup = function(){}

  this.loopFixedJoints = function(){
    Object.values(sceneObjectBodyIds).forEach(function(bArr){
      bArr.forEach((b,i)=>{
      //  bArr.forEach((bo,io)=>{
          if(i !== 0){
            var jd = new b2WeldJointDef();
            jd.dampingRate=1;
            jd.InitializeAndCreate(b,bArr[i-1],b.GetWorldCenter());
          }
      //  });
      });
    });
  }
};

var Scene = new PhunScene();
