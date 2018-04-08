Root
  = struct:(RootThymeFunc / Struct / Call / Comment / WS / UTFBOM)* {
    return struct.filter(item => item !== null);
  }

RootThymeFunc
  = f:ThymeFunc ";"? {
    return f;
  }


Call
  = _ name:StructName _ vars:CallStruct ";"? _ {
    return {
      type : "call",
      name : name,
      arguments: vars
    }
  }

CallStruct
  = "{"
  _ vars:CallParam* _
  "}" {
    var props = {};
    vars.forEach(item => {
      props[item.key] = item.value;
    })
    return props;
  }

CallParam
  = _ key:VarName _ ":=" _ value:StructVariableTypes _ ";"? _ {
    return {
      key: key, value: value
    }
  }

Struct "structure"
  = _ name:StructName _ "->" _ "{"
  _ vars:StructProperty* _
  "}" ";"? _ {
    var props = {};
    vars.forEach(item => {
      props[item.key] = item.value;
    })
    return {
      type : "struct",
      name : name,
      properties: props
    }
  }

StructVariableTypes
  = StructArray
  / VariableTypes

StructProperty "property"
  = _ key:VarName _ "=" _ value:StructVariableTypes ";"? _ {
    return {
      key: key, value: value
    }
  }

ThymeExpressionStatements
  = ThymeVar
  / ThymeVarAssign
  / ThymeFunctionCall
  / ThymeVarRef

ThymeStatements
  = ThymeTernary
  / ThymeExpression
  / ThymeVar
  / ThymeVarAssign

VariableTypes
  = VarString
  / VarFloat
  / VarArray
  / VarBool
  / VarInf
  / VarNaN
  / ThymeFunc
  / ThymeObject
  / ThymeCodeBlock

ThymeFunc
  = _ "(" args:ThymeArrayArgs+ ")" _ "=>" _ script:ThymeBody? _ {
    return {
      type : "ThymeFunc",
      args: args,
      body : script
    };
  }


ThymeObject
  = "{"
  _ vars:ThymeObjectParam* _
  "}" {
    var props = {};
    vars.forEach(item => {
      props[item.key] = item.value;
    })
    return {
      type : "ThymeObject",
      props : props
    }
  }

ThymeObjectParam
  = _ key:VarName _ ":=" _ value:ThymeExpression _ ";"? _ {
    return {
      key: key, value: value
    }
  }

ThymeArrayArgs
  = _ v:ThymeArgs ","? _ {
    return v;
  }

ThymeVar
  = v:VariableTypes {
    if(typeof v === "object" && v.type) return v;
    return {
      type: 'ThymeVar',
      varType : typeof v,
      value: v
    };
  }



ThymeVarAssign
= _ name:StructName _ noLocal:":"? "=" _ v:ThymeExpression {
  return {
    type: 'ThymeVarAssign',
    affectLocal: !noLocal,
    name: name,
    value: v,
  }
}


ThymeVarRef
  = _ name:StructName _ {
    return {
      type: 'ThymeVarRef',
      name: name
    }
  }

ThymeArgs
  = ThymeVarRef / ThymeStatements

ThymeCodeBlock
  = b:ThymeBody {
    return {
      type: 'ThymeCodeBlock',
      body: b
    }
  }

ThymeBody
  = "{" _ body:(ThymeStatements / ";" / WS)* _ "}" {
    return  body.filter(i => i && i.type !== undefined)
  }

ThymeTernary
 = test:ThymeExpression _ "?" _ t:ThymeBody _ ":" _ e:ThymeBody _ {
   return {
     type: "ThymeTernary",
     test: test,
     then: t,
     else: e
   }
 }

ThymeExpression
  = ThymeFunc
  / ThymeBooleanExpression;

ThymeBooleanExpression
  = head:ThymeCompareExpression tail:(_ ("&&" / "||") _ ThymeCompareExpression)* {
   if(!tail.length) return head;
   return {
     type: 'ThymeExpression',
     head: head,
     tail: tail.map(t => [t[1],t[3]])
   }
}


ThymeCompareExpression
  = head:ThymeArithmeticExpression
    tail:(_ (">=" / "<=" / ">" / "<" / "==" / "!=" / "%") _ ThymeArithmeticExpression)* {
  if(!tail.length) return head;
  return {
    type: 'ThymeExpression',
    head: head,
    tail: tail.map(t => [t[1],t[3]])
  }
}

ThymeArithmeticExpression
  = head:ThymeMultiplyExpression tail:(_ ("+" / "-") _ ThymeMultiplyExpression)* {
     if(!tail.length) return head;
     return {
       type: 'ThymeExpression',
       head: head,
       tail: tail.map(t => [t[1],t[3]])
     }
   }

ThymeMultiplyExpression
  = head:ThymeFactor tail:(_ ("*"/"/"/"&"/"|") _ ThymeFactor)* {
    if(!tail.length) return head;
    return {
      type: 'ThymeExpression',
      head: head,
      tail: tail.map(t => [t[1],t[3]])
    }
  }

ThymeBooleanNegate
  = "!" _ expr:ThymeFactor {
    return {
      type: "ThymeNegate",
      head: expr
    }
  }

ThymeFactor
  = "(" _ expr:ThymeExpression _ ")" { return expr }
  / ThymeBooleanNegate
  / ThymeExpressionStatements


ThymeFunctionCallParam
  = arg:ThymeStatements _ ","? _ {
    return arg;
  }

ThymeArgClause
  = "(" _ args:ThymeFunctionCallParam*  _ ")" {return args}

ThymeFuncArg
  =  _ args:ThymeArgClause+ {return args}
  / _ args:ThymeStatements {return [[args]]}


ThymeFunctionCall
  = _ name:StructName _ args:ThymeFuncArg {
    return {
      type: "ThymeCall",
      args: args,
      name: name
    };
  }

VarInf
  = sign:[+\-] "inf" {
    return Infinity*(sign == "-" ? -1 : 1);
  }

VarNaN
 = "NaN" {
   return NaN;
 }

VarString
  = "\"" txt:[^"]* "\"" {
    return txt.join('');
  }

VarBool
  = t:("true"/"false") { return t === "true" };

NumberText
  =sign:"-"? digits:[0-9.]+ err:"e-"? err2:[0-9]* {
    var txt = "";
    if(sign) txt += "-";
    if(digits) txt += digits.join("");
    if(err) txt += "e-"+err2.join("");
    return txt;
  }

VarFloat
  = txt:NumberText {
    return parseFloat(txt);
  }

VarArrayElem
  = _ v:ThymeStatements _ ","? _ {
  return v;
}

StructArrayElem
  = _ v:VariableTypes _ ","? _ {
  return v;
}

StructArray
  = "[" vars:StructArrayElem* "]" {

    var objToArr = function(obj){
      if(obj instanceof Array) return obj.map(objToArr);
      if(typeof obj == "object"){
        if(obj.type == "ThymeArray") return obj.items.map(objToArr)
        if(obj.type == "ThymeVar") return obj.value;
      }
      return obj;
    }

    return objToArr(vars);
  }


VarArray
  = "[" vars:VarArrayElem* "]" {
    return {
      type: "ThymeArray",
      items: vars
    }
  }

StructName
  = name:Word {
    return name
  }

VarName
  =name:[a-zA-Z0-9_]+ {
    return name.join("");
  }


Comment "comment"
 = "//" txt:TextLine {
   return {
     type: 'comment',
     text: txt
   }
 }

TextLine "textline"
  = text:[^\n]+ eol:EndOfLine {
    return text.join('');
  }

Word
  = w:([a-z]i[a-z_0-9\.]i*) {
    w = w.map(s=>{
      if(s instanceof Array) return s.join("");
      return s;
    })
    return w.join("");
  }

EndOfLine
  = "\n"

_ "whitespace"
 = [ \t\r\n]*

WS "whitespace"
  = [ \t\r\n]+ {
    return null;
  }

UTFBOM "UTFBOM"
  = "\uFEFF" {
    return null
  }
