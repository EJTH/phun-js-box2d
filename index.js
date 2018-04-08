const parser = require('./lib/parser');
const transpiler = require('./lib/thyme-transpiler');
const runtime = require('./lib/thyme-runtime');

function parse(data){
  try {
    var tracer = new Tracer(data);
    return parser.parse(data, { tracer : tracer });
  } catch(e){
    console.log(tracer.getBacktraceString());
    throw e;
  }
}

function transpile(data, runtimePrefix){
  if(data instanceof String){
    return transpiler(parse(data)[0], runtimePrefix);
  }
  return transpile(data, runtimePrefix);
}

module.exports = {
  parse: parse,
  transpile: transpile,
  runtime: runtime
}
