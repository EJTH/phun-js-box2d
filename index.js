const parser = require('./src/parser');
const transpiler = require('./src/thyme-transpiler');
const runtime = require('./src/thyme-runtime');

function parse(data){
  try {
    var tracer = new Tracer(data);
    return parser.parse(data, { tracer : tracer });
  } catch(e){
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
