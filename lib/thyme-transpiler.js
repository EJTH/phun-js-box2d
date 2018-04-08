var rt = require('./thyme-runtime.js');

module.exports = function(tree, runtimePrefix){
  runtimePrefix = runtimePrefix || '__rt';

  var src = "";

  var transforms = {
    ThymeFunc: function(node){
      var strArgs = node.args.map(arg => arg.name).join(", ");
      var body = buildFunctionBody(node.body);
      return `function(${strArgs}){ ${body} }`
    },
    ThymeVar: function(node){
      return JSON.stringify(node.value);
    },
    ThymeExpression: function(node){
      var head = transformNode(node.head);
      var tail = node.tail;
      if(tail.length > 0 && rt.mathOps[tail[0][0]] instanceof Function){
        var last = head;
        var output = '';
        tail.forEach((next, i) => {
          var op = next[0];
          var subNode = transformNode(next[1]);
          last = `${runtimePrefix}.op(${last},${subNode}, '${op}')`
        });
        return last;
      }

      var tail = node.tail.map(n => {
        var op = n[0];
        var subNode = transformNode(n[1]);
        return `${op} ${subNode}`;
      });

      return `(${head} ${tail.join(" ")})`
    },
    ThymeCall: function(node){
      var args = node.args.map(a=>a.map(transformNode));
      return `${runtimePrefix}.fcall(${node.name}, [${args.map(a => '['+a.join(", ")+']')}], "${node.name}")`
    },
    ThymeVarAssign: function(node){
      var valExpr = transformNode(node.value);
      return `${node.name} = ${valExpr}`;
    },
    ThymeVarRef: function(node){
      return `${runtimePrefix}.var(${node.name})`;
    },
    ThymeCodeBlock: function(node){
      var body = buildFunctionBody(node.body);
      return `({ "_thymeType": "CodeBlock", evaluate: function(){ ${body} }})`
    },
    ThymeTernary: function(node){
      var test;

      if(node.test.type == 'ThymeCodeBlock'){
        var body = buildFunctionBody(node.test.body);
        test = `(function(){ ${body} })()`;
      } else {
        test = transformNode(node.test);
      }

      var t = buildFunctionBody(node.then);
      var e = buildFunctionBody(node.else);
      return `${test} ? (function(){ ${t} })() : (function(){ ${e} })()`
    },
    ThymeArray: function(node){
      var values = node.items.map(transformNode);
      return `[${values.join(', ')}]`;
    },
    ThymeNegate: function(node){
      var head = transformNode(node.head);
      return `!${head}`;
    },
    ThymeObject: function(node){
      var props = node.props;
      var obj = [];
      for(var key in props){
        n = transformNode(props[key]);
        obj.push(`"${key}" : ${n}`);
      };
      return `{${obj.join(', ')}}`;

    }
  };

  function buildFunctionBody(bodyNodes){
    var body = bodyNodes.map(transformNode);
    if(body.length > 0){
      body[body.length-1] = `return ${body[body.length-1]};`
    }
    return body.join("; ");
  }

  function transformNode(node){
    if(transforms[node.type] instanceof Function){
      return transforms[node.type](node);
    } else {
      return `/* No transform for: ${node.type} */`;
    }
  }

  return transformNode(tree).replace(/(\n|\t| )+/g,' ');
}
