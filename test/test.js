var assert = require('assert');
var parser = require('../lib/parser');
var transpiler = require('../lib/thyme-transpiler');
var Tracer = require('pegjs-backtrace');
var __rt = require('../lib/thyme-runtime.js')

function parse(data, spew){
  var tracer = new Tracer(data);
  var parsed;
  try {
    parsed = parser.parse(data, { tracer : tracer });
  }  catch(err){
    if(spew == undefined ||spew) console.log(tracer.getBacktraceString());
  }
  return parsed
}

function parseAndRun(data){
  return eval(`(${transpiler(parse(data,false)[0])})()`);
}

function testFunc(func, result){
  it(`${func} := ${JSON.stringify(result)}`, function(){
    assert.deepEqual(parseAndRun(func), result);
  });
}

describe('Scene parser', function() {
  it('comments', function() {
    var parsed = parse(`// Comment\n`);
    assert.equal(parsed[0].type, 'comment');
  });
  describe('FileInfo Scene Object', function(){
    var parsed = parse(`
      FileInfo -> {
          title = "test-scene1";
          author = "MyName";
          version = 21
      };
    `);
    assert.equal(parsed[0].type, 'struct');


  }),
  describe('Scene Object property parsing', function(){
    var parsed = parse(`
    Sim -> {
      integer = 1;
      float = 60.000;
      enotation = 9.9999997e-005;
      negativeinteger = -1;
      negativefloat = -9.9999997e-005;
      string = "test-scene1";
      booltrue = true;
      boolfalse = false;
      arraytest = [[[0.00000000, 0.00000000, 0.00000000, 1.0000000], [359.89999, 1.0000000, 1.0000000, 1.0000000]]];
    };`);

    var props = parsed[0].properties;
    it("integers", function(){
      assert.equal(props.integer,1)
    })
    it("floats with e- notation", function(){
      assert.equal(props.enotation,9.9999997e-005)
    })
    it("negative integers", function(){
      assert.equal(props.negativeinteger,-1)
    })
    it("negative float", function(){
      assert.equal(props.negativefloat,-9.9999997e-005)
    });

    it("strings", function(){
      assert.equal(props.string, 'test-scene1');
    });

    it("booleans", function(){
      assert.equal(props.booltrue, true);
      assert.equal(props.boolfalse, false);
    });

    it("nested arrays", function(){
      assert.deepEqual(props.arraytest, [[[0.00000000, 0.00000000, 0.00000000, 1.0000000], [359.89999, 1.0000000, 1.0000000, 1.0000000]]]);
    });
  });
  describe("Scene call parsing", function(){
    var parsed = parse(`
      Scene.addPlane {
        nullnumber := 0.00000;
        integer := 1;
        float := 60.000;
        enotation := 9.9999997e-005;
        negativeinteger := -1;
        negativefloat := -9.9999997e-005;
        string := "test-scene1";
        booltrue := true;
        boolfalse := false;
        arraytest := [[[0.00000000, 0.00000000, 0.00000000, 1.0000000], [359.89999, 1.0000000, 1.0000000, 1.0000000]]];
        emptythymefunc := (e)=>{};
        thymefunccall := (e)=>{foobar();}
      };`);


    var props = parsed[0].arguments;
    it("0.00000 floats", function(){
      assert.equal(props.nullnumber, 0);
    })
    it("integers", function(){
      assert.equal(props.integer,1)
    })
    it("floats with e- notation", function(){
      assert.equal(props.enotation,9.9999997e-005)
    })
    it("negative integers", function(){
      assert.equal(props.negativeinteger,-1)
    })
    it("negative float", function(){
      assert.equal(props.negativefloat,-9.9999997e-005)
    });

    it("strings", function(){
      assert.equal(props.string, 'test-scene1');
    });

    it("booleans", function(){
      assert.equal(props.booltrue, true);
      assert.equal(props.boolfalse, false);
    });

    it("nested arrays", function(){
      assert.deepEqual(props.arraytest, [[[0.00000000, 0.00000000, 0.00000000, 1.0000000], [359.89999, 1.0000000, 1.0000000, 1.0000000]]]);
    });

    it("Empty Thyme function", function(){
      assert.deepEqual(props.emptythymefunc, {
        type: 'ThymeFunc',
        args: [ { type: 'ThymeVarRef', name: 'e' } ],
        body: []
      });
    });

  });

  describe("ThymeScript parsing", function(){
    it("multiple function arguments", function(){
      var parsed = parse(`(a,b,c)=>{}`);
      assert.deepEqual(parsed, [{"type":"ThymeFunc","args":[{"type":"ThymeVarRef","name":"a"},{"type":"ThymeVarRef","name":"b"},{"type":"ThymeVarRef","name":"c"}],"body":[]}]);
    });

    it("var assign", function(){
      var parsed = parse(`(a)=>{ var = 1; }`);

      assert.deepEqual(parsed, [{"type":"ThymeFunc","args":[{"type":"ThymeVarRef","name":"a"}],"body":[{"type":"ThymeVarAssign","affectLocal":true,"name":"var","value":{"type":"ThymeVar","varType":"number","value":1}}]}]);
    });

    it("Math expressions", function(){
      var parsed = parse(`(a)=>{ i+1*1; }`);
      assert.deepEqual(parsed, [{"type":"ThymeFunc","args":[{"type":"ThymeVarRef","name":"a"}],"body":[{"type":"ThymeExpression","head":{"type":"ThymeVarRef","name":"i"},"tail":[["+",{"type":"ThymeExpression","head":{"type":"ThymeVar","varType":"number","value":1},"tail":[["*",{"type":"ThymeVar","varType":"number","value":1}]]}]]}]}]);
    });

    it("Var assign with expression", function(){
      var parsed = parse(`(a)=>{ foo = i+1; }`);
      assert.deepEqual(parsed, [{"type":"ThymeFunc","args":[{"type":"ThymeVarRef","name":"a"}],"body":[{"type":"ThymeVarAssign","affectLocal":true,"name":"foo","value":{"type":"ThymeExpression","head":{"type":"ThymeVarRef","name":"i"},"tail":[["+",{"type":"ThymeVar","varType":"number","value":1}]]}}]}]);
    });

    it("Order of operations", function(){
      var parsed = parse(`(a)=>{ foo = 1+1*(100/100); }`);
      assert.deepEqual(parsed, [{"type":"ThymeFunc","args":[{"type":"ThymeVarRef","name":"a"}],"body":[{"type":"ThymeVarAssign","affectLocal":true,"name":"foo","value":{"type":"ThymeExpression","head":{"type":"ThymeVar","varType":"number","value":1},"tail":[["+",{"type":"ThymeExpression","head":{"type":"ThymeVar","varType":"number","value":1},"tail":[["*",{"type":"ThymeExpression","head":{"type":"ThymeVar","varType":"number","value":100},"tail":[["/",{"type":"ThymeVar","varType":"number","value":100}]]}]]}]]}}]}]);
    });

    it("Ternaries", function(){
      var parsed = parse(`(a)=>{ (something > something) ? { then() } : { else() }; }`);
    })

    describe("VariableTypes", function(){
      var parsed = parse('(a)=>{ 1.3213; "string"; ["array",0]; -1; 1; }');
      var body = parsed[0].body

      it("Floats", function(){
        assert.equal(body[0].value, 1.3213);
      });

      it("Strings", function(){
        assert.equal(body[1].value, "string");
      });


      it("Arrays", function(){
        assert.equal(body[2].items[0].value, "array");
        assert.equal(body[2].items[1].value, 0);
      });

      it("Negative numbers", function(){
        assert.equal(body[3].value, -1);
      })
    });

  });

});

describe('Thyme -> JS Transpiler test snippets', function(){
  testFunc("(e)=>{ 1+1 }", 2);
  testFunc("(e)=>{ a=[1,2,3]; a(2) }", 3);
  testFunc("(e)=>{ 10+10*3 }", 40);
  testFunc("(e)=>{ f=[{ 1+1 }, 0, { f(0)() }]; f(2)(); }", 2);
  testFunc("(e)=>{ 1+1 == 2 || false }", true);
  testFunc("(e)=>{ foo = { 10*10 }; foo }", 100);
  testFunc("(e)=>{ f=0; foo = { f = f + 1 }; foo; foo; }", 2);
  testFunc("(e)=>{ foo = \"bar\"+\"baz\" }", "barbaz");
  testFunc(`(e)=>{
    n=1;
    repeat = (t,f)=>{
      i=0;
      next = {
        i < t ? { f(i); i=i+1; next; } : { i=0 };
      };
      next;
    };
    repeat(1000, (i)=>{n=n+2});
    n;
  }
`.replace(/(\n| )+/g,' '), 2001);

  testFunc("(e)=>{ 2*1%2 }",0);

  testFunc("(e)=>{ 0.00000000; }",0);

  describe('Thyme array ops', function(){
    testFunc("(e)=>{ [1,2]+[1,2]; }", [2,4]);
    testFunc("(e)=>{ [1,1]/[1,2]; }", [1,0.5]);
    testFunc("(e)=>{ [1,2]*[1,2]; }", [1,4]);
    testFunc("(e)=>{ [2]%[2]; }", [0]);
    testFunc("(e)=>{ [[1],[2]]*[[1],[2]]; }", [[1],[4]]);
  });
})
