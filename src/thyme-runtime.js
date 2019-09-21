function op(a,b,f){
  if(a instanceof Array && b instanceof Array){
    return a.map((item, i)=>{
      if(item instanceof Array && b[i] instanceof Array) return op(item, b[i],f);
      return f(item,b[i]);
    });
  } else {
    return f(a,b);
  }
}


var ops = {
  "+": (a,b)=>a+b,
  "-": (a,b)=>a-b,
  "/": (a,b)=>a/b,
  "*": (a,b)=>a*b,
  "%": (a,b)=>a%b,
  "^": (a,b)=>Math.pow(a,b)
};

var __rt = {
  mathOps: ops,
  op: function(a,b,f,fnm){
    return op(a,b,ops[f]);
  },
  var: function(v){
    return (v instanceof Object && v._thymeType === "CodeBlock"
      ? v.evaluate() : v)
  },
  fcall: function(v, args, fnm){
    if(v == undefined) throw `function '${fnm}' not implemented`;
    args.forEach(a=>{
      if(v._thymeType == 'CodeBlock') v = v.evaluate;
      if(v instanceof Array) v = v[a[0]];
      else v = v.apply(null, a);
    });

    return v;
  }
};

if(typeof module !== "undefined"){
  module.exports = __rt;
}
