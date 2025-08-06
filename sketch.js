const MQ = MathQuill.getInterface(2);
const latexMQ = MQ.MathField(equation,{
  autoCommands: 'pi tau theta sqrt div Gamma binom sum prod int infinity',
  autoOperatorNames: 'exp ln log sinh sin cosh cos tanh tan coth cot sech sec csch csc arcsinh arcsin arccosh arccos arctanh arctan arccoth arccot arcsech arcsec arccsch arccsc erf erfi Re Im Arg Abs',
  sumStartsWithNEquals: true,
  autoSubscriptNumerals: false,
  restrictMismatchedBrackets: true,
  supSubsRequireOperand:true
});
const outputMQ = MQ.StaticMath(equation2);
//const functionMQ = MQ.StaticMath(equationTxt);

var selection = 0;
var fvar = 'z';
var funct = 'return z;';
var dfunct = 'return vec2(1,0);';

/*
function parse(inputText) {
  if (inputText == "") return 'return z;'
  var TokenTypes = {
    'break': / +/,
    'z':/(zi|iz|z)/,
    'imagNum':/(i\d*(\.\d+|)|\d*(\.\d+|)i)/,
    'realNum':/\d+(\.\d+|)/,
    'operator':/(\+|\-|\*|\/|\^)/,
    'function':/(exp|ln|sinh|sin|cosh|cos|tanh|tan|coth|cot|sech|sec|csch|csc|sqrt|Gamma)/,
    'function2':/(log)/,
    'property':/(Re|Im|Arg|Abs)/,
    'parens':/(\(|\))/,
    'const':/(pi|e)/,
    'comma':/,/
  }
  // Tokenizer
  var txt = inputText;
  var tokens = [];
  while (txt.length > 0) {
    var tok = false;
    for (var i in TokenTypes) {
      var regex = TokenTypes[i];
      if (txt.search(regex) != 0) continue;
      tok = true;
      var m = txt.match(regex)[0];
      txt = txt.substr(m.length,txt.length-1);
      if (i == 'break') break;
      tokens.push({type:i,value:m});
      break;
    }
    if (!tok) {
      console.error('invalid char at: '+(inputText.length-txt.length));
      return 'return z';
    }
  }
  // Negatives
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i].value != '-') continue;
    if (!tokens[i-1] || tokens[i-1].type == 'operator') {
      if (tokens[i+1].type == 'realNum' || tokens[i+1].type == 'imagNum' || tokens[i+1].type == 'const') {
        tokens.splice(i,2,{
          type:tokens[i+1].type,
          value:'-'+tokens[i+1].value,
        });
        continue;
      }
      if (tokens[i+1].type == 'z') {
        tokens.splice(i,2,{
          type:'z',
          value:'(-'+tokens[i+1].value+')',
        });
        continue;
      }
      tokens.splice(i,1,{
        type:'realNum',
        value:'-1',
      },{
        type:'operator',
        value:'*',
      });
    }
  }
  // Groupings
  for (var i = 0; i < tokens.length; i++) {
    function parens() {
      var inside = [];
      var start = i;
      for (i++; i < tokens.length; i++) {
        if (tokens[i].value == "(") parens();
        if (tokens[i].value == ")") break;
        inside.push(tokens[i]);
      }
      if (start != 0 && (tokens[start-1].type == "function" || tokens[start-1].type == "property")) {
        tokens.splice(start-1,inside.length+3,{
          type:tokens[start-1].type,
          function:tokens[start-1].value,
          value:inside
        });
        i = start-1;
      }
      if (start != 0 && tokens[start-1].type == "function2") {
        var index = inside.map(e => e.type).indexOf('comma');
        console.log(index,inside)
        if (index == -1) {
          console.error('function '+tokens[start-1].value+' requires 2 arguments');
          return "return z;";
        }
        tokens.splice(start-1,inside.length+3,{
          type:tokens[start-1].type,
          function:tokens[start-1].value,
          in1:inside.splice(0,index),
          in2:inside.splice(1,index.length-1)
        });
        i = start-1;
      }
      else {
        tokens.splice(start,inside.length+2,{
          type:'grouping',
          value:inside
        });
        i = start;
      }
    }
    if (tokens[i].value == "(") parens();
  }
  // Operations
  var OrderOfOperations = [
    ['^'],
    ['*','/'],
    ['+','-']
  ];
  function scanOOO(toks) {
    for (var i = 0; i < OrderOfOperations.length; i++) {
      var operations = OrderOfOperations[i];
      for (var j = 0; j < toks.length; j++) {
        if (toks[j] && (toks[j].type == 'grouping' || toks[j].type == 'function' || toks[j].type == 'property')) {
          toks[j].value = scanOOO(toks[j].value);
        }
        
        var index = operations.indexOf(toks[j].value);
        if (index == -1) continue;
        
        if (toks[j-1] && (toks[j-1].type == 'grouping' || toks[j-1].type == 'function' || toks[j-1].type == 'property')) {
          toks[j-1].value = scanOOO(toks[j-1].value);
        }
        if (toks[j+1] && (toks[j+1].type == 'grouping' || toks[j+1].type == 'function' || toks[j+1].type == 'property')) {
          toks[j+1].value = scanOOO(toks[j+1].value);
        }
        
        
        toks.splice(j-1,3,{
          type:'operation',
          operation:toks[j].value,
          in1:toks[j-1],
          in2:toks[j+1]
        });
        j--;
      }
    }
    return toks;
  }
  tokens = scanOOO(tokens);
  //Scan Numbers
  /*function scanNum(toks) {
    for (var i = 0; i < OrderOfOperations.length; i++) {
      var operations = OrderOfOperations[i];
      for (var j = 0; j < toks.length; j++) {
        if (toks[j] && (toks[j].type == 'grouping' || toks[j].type == 'function' || toks[j].type == 'property')) {
          toks[j].value = scanNum(toks[j].value);
        }
        if (toks[j] && toks[j].type == 'operation') {
          toks[j].in1 = scanNum(toks[j].in1);
          toks[j].in2 = scanNum(toks[j].in2);
        }
        
        var tok = toks[j];
        if (tok.type != 'operation' && tok.value != "+" && tok.value != "-") continue;
        if (tok.in1.type != 'imagNum' && tok.in1.type != 'realNum') continue;
        if (tok.in2.type != 'imagNum' && tok.in2.type != 'realNum') continue;
        
        var real = 0;
        var imag = 0;
        
        if (tok.in1.value.search(/i/) == -1) {
          real += Number(tok.in1.value);
        } else {
          if (tok.in1.value == 'i') imag += 1;
          else imag += Number(tok.in1.value.replace(/i/,''));
        }
        
        if (tok.in2.value.search(/i/) == -1) {
          real += Number(tok.in2.value);
        } else {
          if (tok.in2.value == 'i') imag += 1;
          else imag += Number(tok.in2.value.replace(/i/,''));
        }
        
        real = real.toString();
        imag = imag.toString();
        if (real.search(/\./) == -1) real += ".";
        if (imag.search(/\./) == -1) imag += ".";
        
        toks.splice(j,1,{
          type:'number',
          real: real,
          imaginary: imag
        });
      }
    }
    return toks;
  }
  tokens = scanNum(tokens);//*
  console.log(tokens)
  // Compiler
  var err = false;
  function toCode(tok) {
    if (tok.type == 'z') {
      if (tok.value.search(/i/) != -1) {
        tok.value = 'Mult_i('+tok.value.replace(/i/,'')+')';
      }
      return tok.value;
    }
    if (tok.type == 'const') {
      return 'vec2('+tok.value+',0)';
    }
    
    if (tok.type == 'imagNum') {
      neg = '';
      if (tok.value.charAt(0) == '-') {
        tok.value = tok.value.substr(1,tok.value.length-1);
        neg = '-';
      }
      if (tok.value == 'i') return 'vec2(0,'+neg+'1)';
      var n = tok.value.replace('i','');
      return 'vec2(0,'+neg+n+')';
    }
    
    if (tok.type == 'realNum') {
      return 'vec2('+tok.value+',0)';
    }
    
    /*if (tok.type == 'number') {
      return 'vec2('+tok.real+','+tok.imaginary+')';
    }//*
    
    var OperationTable = {
      "+":["","+",""],
      "-":["","-",""],
      "*":["Mult(",",",")"],
      "/":["Div(",",",")"],
      "^":["Pow(",",",",kk)"]
    }
    if (tok.type == 'operation') {
      var o = OperationTable[tok.operation];
      return o[0]+toCode(tok.in1)+o[1]+toCode(tok.in2)+o[2];
    }
    
    if (tok.type == 'grouping') {
      var str = "";
      for (var i = 0; i < tok.value.length; i++) {
        str += toCode(tok.value[i]);
      }
      return "("+str+")";
    }
    
    var FunctionTable = {
      "exp":["Exp(",")"],
      "ln":["Ln(",",kk)"],
      "sinh":["Sinh(",")"],
      "sin":["Sin(",")"],
      "cosh":["Cosh(",")"],
      "cos":["Cos(",")"],
      "tanh":["Tanh(",")"],
      "tan":["Tan(",")"],
      "sech":["Sech(",")"],
      "sec":["Sec(",")"],
      "csch":["Csch(",")"],
      "csc":["Csc(",")"],
      "sqrt":["Exp(",")"],
      "Gamma":["Gamma(",",kk)"]
    }
    if (tok.type == 'function') {
      var str = "";
      for (var i = 0; i < tok.value.length; i++) {
        str += toCode(tok.value[i]);
      }
      var f = FunctionTable[tok.function];
      return f[0]+str+f[1];
    }
    
    
    if (tok.type == 'property') {
      var str = "";
      for (var i = 0; i < tok.value.length; i++) {
        str += toCode(tok.value[i]);
      }
      if (tok.function == "Arg") return 'vec2('+tok.function+'('+str+',kk),0)';
      return 'vec2('+tok.function+'('+str+'),0)';
    }
    
    err = true;
    console.error('invalid token: '+tok.type+" "+tok.value);
    return "";
  }
  var code = toCode({type:'grouping',value:tokens});
  if (err) return 'return z;';
  return 'return '+code+';';
}
*/

function regexfix(txt) {
  return txt
    .replaceAll(/--/g,"+")
    .replaceAll(/\+-/g,"-")
    .replace(/sqrt(?=\[)/g, (match) => "root")
    .replace(/log_[\w\d]/g, (match) => "log_{"+match.substr(4,match.length-4) + "}")
    .replace(/\^[\w\d]/g, (match) => "^{"+match.substr(1,match.length-1) + "}")
    .replace(/\\operatorname\{[\w]+\}/g, (match) => "\\"+match.substr(14,match.length-15));
}

function tokenize(txt) {
  var inputText = txt;
  var TokenTypes = {
    'break': /(\\|) +/,
    'num':/\d+(\.\d+|)/,
    'derivative':/\\frac{d}{d(\w)}/,
    'int':/\\int/,
    'rep':/\\(sum|prod)/,
    'differential':/d(\w)/,
    'operator':/(\+|\-|\\cdot|\\cross|\\div|\\pm|\=|\^|\_)/,
    'funct2':/\\(root|log(?=_)|frac)/,
    'funct':/((W)(?=\\left\()|\\(sqrt|exp|ln|log|sinh|sin|cosh|cos|tanh|tan|coth|cot|sech|sec|csch|csc|arcsinh|arcsin|arccosh|arccos|arctanh|arctan|arccoth|arccot|arcsech|arcsec|arccsch|arccsc|erfi|erf|Gamma|Re|Im|Arg|Abs))/,
    'sub':/_/,
    'left':/(\\left|)(\(|\[|\{|\|)/,
    'right':/(\\right|)(\)|\]|\}|\|)/,
    'const':/(\\pi|\\tau|e|i|\\infty)/,
    'var':/\w/,
    'comma':/,/
  }
  // Tokenizer
  var tokens = [];
  while (txt.length > 0) {
    var tok = false;
    for (var i in TokenTypes) {
      var regex = TokenTypes[i];
      if (txt.search(regex) != 0) continue;
      tok = true;
      var matches = txt.match(regex);
      var m = matches[0];
      txt = txt.substr(m.length,txt.length-1);
      if (i == "derivative" || i == "differential") m = matches[1];
      if (i == "rep" || i == "left" || i == "right") m = matches[2];
      if (i == 'break') break;
      if (i == "num") m = Number(m);
      tokens.push({type:i,value:m});
      break;
    }
    if (!tok) {
      console.error('invalid char at: '+(inputText.length-txt.length)+'\nthat is: '+txt.substring(0,5));
      return [{type:"var",value:"z"}];
    }
  }
  return tokens;
}

function parse(tokens) {
  console.log(-1,JSON.parse(JSON.stringify(tokens)));
  // Groupings
  for (var i = 0; i < tokens.length; i++) {
    function parens() {
      var inside = [];
      var start = i;
      for (i++; i < tokens.length; i++) {
        if (tokens[i].type == "left") parens();
        if (tokens[i].type == "right") break;
        inside.push(tokens[i]);
      }
      var group = {
        type:'grouping',
        value:inside,
        left:tokens[start].value,
        right:tokens[i].value
      };
      tokens.splice(start,inside.length+2,group);
      i = start;
    }
    if (tokens[i].type == "left") parens();
  }
  console.log(0,JSON.parse(JSON.stringify(tokens)));
  
  // Order of operations
  var OrderOfOperations = [
    ['_','^'],
    ['\\cdot','\\div','\\frac'],
    ['+','-','\\pm'],
    ['='],
  ];
  function scanOrderOfOps(toks) {
    function fetch(toks,j,isf) {
      if (!toks[j]) {
        console.log(JSON.parse(JSON.stringify(toks)),j);
        return;
      }
      if (toks[j] && toks[j].type == 'grouping') {
        toks[j] = scanOrderOfOps(toks[j].value);
      }
      if (isf >= 1 && toks[j].value == '_') {
        toks.splice(j,2,fetch(toks,j+1));
      }
      if (isf >= 2 && toks[j].value == '^') {
        toks.splice(j,2,fetch(toks,j+1));
      }
      if (toks[j].type == 'funct') {
        toks.splice(j,2,{
          type: 'function',
          name: toks[j].value,
          param: fetch(toks,j+1,1)
        });
      }
      if (toks[j].type == 'funct2') {
        toks.splice(j,3,{
          type: 'function2',
          name: toks[j].value,
          param1: fetch(toks,j+1,1),
          param2: fetch(toks,j+2,1)
        });
      }
      if (toks[j].type == 'rep') {
        toks.splice(j,3,{
          type: 'repeat',
          name: toks[j].value,
          bottom: fetch(toks,j+1,2),
          top: fetch(toks,j+2,2)
        });
      }
      if (toks[j].type == 'int') {
        toks.splice(j,3,{
          type: 'integral',
          bottom: fetch(toks,j+1,2),
          top: fetch(toks,j+2,2)
        });
        for (var n = j; n < toks.length; n++) {
          var tok = fetch(toks,n);
          if (tok.type == "differential") break;
        }
        var param = toks.splice(j+1,n-j);
        toks[j].param = scanOrderOfOps(param.slice(0,param.length-1));
        toks[j].value = param[param.length-1].value;
      }
      return toks[j];
    }
    for (var i = 0; i < OrderOfOperations.length; i++) {
      var operations = OrderOfOperations[i];
      for (var j = 0; j < toks.length; j++) {
        var tok = fetch(toks,j);
        
        if (tok.type == 'operator' && operations.includes(tok.value)) {
          if (!toks[j-1] && tok.value == '-') {
            toks.splice(j,1);
            toks[j] = {
              type:"function",
              name:"-",
              param:toks[j]
            };
            continue;
          }
          toks.splice(j-1,3,{
            type: 'operation',
            operation: toks[j].value,
            in1: fetch(toks,j-1),
            in2: fetch(toks,j+1)
          });
          j--;
          continue;
        }
        
        if (operations.includes('\\cdot') && tok.type != "operator") {
          while (tok && toks[j+1] && toks[j+1].type != 'operator') {
            toks.splice(j,2,{
              type: 'operation',
              operation: '\\cdot',
              in1: tok,
              in2: fetch(toks,j+1)
            });
            tok = toks[j];
          }
        }
        
      }
    }
    return toks;
  }
  tokens = tokens.filter(v=>v !== "\\cdot");
  tokens = scanOrderOfOps(tokens);
  console.log(1,JSON.parse(JSON.stringify(tokens)));
  
  function scanRewrite(tok) {
    if (tok instanceof Array) tok = tok[0];
    if (tok.type == "function" && tok.name == "-") {
      return Syntax.MultNS([Syntax.Num(-1),scanRewrite(tok.param)]);
    }
    if (tok.operation == "+" || tok.operation == "-") {
      var inputs = [scanRewrite(tok.in1),scanRewrite(tok.in2)];
      if (tok.operation == "-") inputs[1] = Syntax.MultNS([Syntax.Num(-1),inputs[1]]);
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].operation == "+") {
          inputs.splice(i,1,...inputs[i].inputs);
        }
      }
      return Syntax.AddNS(inputs);
    }
    if (tok.operation == "\\cdot") {
      var inputs = [scanRewrite(tok.in1),scanRewrite(tok.in2)];
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].operation == "\\cdot") {
          inputs.splice(i,1,...inputs[i].inputs);
        }
      }
      return Syntax.MultNS(inputs);
    }
    if (tok.name == "\\root") {
      return Syntax.Pow(scanRewrite(tok.param2),Syntax.Inv(scanRewrite(tok.param1)));
    }
    if (tok.operation == "\\div") {
      return Syntax.Div(scanRewrite(tok.in1),scanRewrite(tok.in2));
    }
    if (tok.type == "operation") {
      return {
        type:"operation",
        operation:tok.operation,
        in1:scanRewrite(tok.in1),
        in2:scanRewrite(tok.in2)
      };
    }
    if (tok.type == "function") {
      return {
        type:"function",
        name:tok.name,
        param:scanRewrite(tok.param),
      };
    }
    if (tok.type == "function2") {
      return {
        type:"function2",
        name:tok.name,
        param1:scanRewrite(tok.param1),
        param2:scanRewrite(tok.param2)
      };
    }
    if (tok.type == "repeat") {
      return {
        type:"repeat",
        name:tok.name,
        top:scanRewrite(tok.top),
        bottom:scanRewrite(tok.bottom)
      };
    }
    if (tok.type == "integral") {
      return {
        type:"integral",
        top:scanRewrite(tok.top),
        bottom:scanRewrite(tok.bottom),
        param:scanRewrite(tok.param),
        value:tok.value
      };
    }
    return tok;
  }
  tokens = scanRewrite(tokens);
  console.log(2,JSON.parse(JSON.stringify(tokens)));
  
  function scanDerivatives(tok) {
    if (tok instanceof Array) tok = tok[0];
    if (tok.operation == "\\cdot") {
      for (var i = 0; i < tok.inputs.length; i++) {
        var t = tok.inputs[i];
        while (t instanceof Array) t = t[0];
        if (t.type == "repeat" || t.type == "derivative") {
          var bef = tok.inputs.slice(0,i);
          var aft = tok.inputs.slice(i+1);
          console.log(32,t);
          if (t.type == "derivative") return Syntax.Mult(bef, {
            type: "derivative",
            value: t.value,
            param: scanDerivatives(Syntax.Mult(aft))
          } );
          if (t.type == "repeat") {
            console.log(68,t,bef,aft);
            return Syntax.Mult( bef, {
              type: "repeat",
              operation: t.name,
              bottom: scanDerivatives(t.bottom.in2),
              top: scanDerivatives(t.top),
              value: t.bottom.in1.value,
              param: scanDerivatives( Syntax.Mult(aft) )
            } );
          }
        }
      }
    }
    if (tok.type == "operation") {
      return {
        type:"operation",
        operation:tok.operation,
        in1:scanDerivatives(tok.in1),
        in2:scanDerivatives(tok.in2)
      };
    }
    if (tok.type == "operation2") {
      return {
        type:"operation2",
        operation:tok.operation,
        inputs:tok.inputs.map(scanDerivatives)
      };
    }
    if (tok.type == "function") {
      return {
        type:"function",
        name:tok.name,
        param:scanDerivatives(tok.param),
      };
    }
    if (tok.type == "function2") {
      return {
        type:"function2",
        name:tok.name,
        param1:scanDerivatives(tok.param1),
        param2:scanDerivatives(tok.param2)
      };
    }
    if (tok.type == "integral") {
      return {
        type:"integral",
        top:scanDerivatives(tok.top),
        bottom:scanDerivatives(tok.bottom),
        param:scanDerivatives(tok.param),
        value:tok.value
      };
    }
    return tok;
  }
  tokens = scanDerivatives(tokens);
  console.log(3,JSON.parse(JSON.stringify(tokens)));
  
  return tokens;
}

function compileShader(tree) {
  // Compiler
  var err = false;
  var namenum = 0;
  var code = "";
  function toCode(tok) {
    if (!tok) return "";
    if (typeof tok == 'string') return tok;
    if (typeof tok == 'number') tok = Syntax.Num(tok);
    while (tok instanceof Array) tok = tok[0];
    
    if (tok.type == 'const') {
      return {
        "i":'vec2(0,1)',
        "e":'vec2(e,0)',
        "\\pi":'vec2(pi,0)',
        "\\tau":'vec2(tau,0)',
        "\\infty":'vec2(Infinity,0)',
      }[tok.value];
    }
    
    if (tok.type == 'num') {
      return 'vec2('+tok.value+',0)';
    }
    
    if (tok.type == 'var') {
      return tok.value;
    }
    /*if (tok.type == 'number') {
      return 'vec2('+tok.real+','+tok.imaginary+')';
    }*/
    
    var OperationTable = {
      "+":["","+",""],
      "-":["","-",""],
      "\\pm":["","+","*s"],
      "\\cdot":["Mult(",",",")"],
      "\\div":["Div(",",",")"],
      "^":["Pow(",",",",kk)"],
    }
    if (tok.type == 'operation') {
      if (tok.operation == "_") {
        return tok.in1.value+"_"+tok.in2.value;
      }
      // Special cases
      if (tok.in2.type == "grouping" && tok.in2.value.length == 1) {
        tok.in2 = tok.in2.value[0];
      }
      if (tok.operation == "^" && tok.in2.value == -1) {
        return "Inv("+toCode(tok.in1)+")";
      }
      if (tok.operation == "^" && tok.in2.value == 2) {
        return "Square("+toCode(tok.in1)+")";
      }
      if (tok.operation == "^" && tok.in2.value == 3) {
        return "Cube("+toCode(tok.in1)+")";
      }
      if (tok.operation == "^" && tok.in1.value == "e") {
        return "Exp("+toCode(tok.in2)+")";
      }
      // Rest
      var o = OperationTable[tok.operation];
      if (!o) {
        err = true;
        console.error('invalid operation: '+tok.operation);
        return;
      } 
      return o[0]+toCode(tok.in1)+o[1]+toCode(tok.in2)+o[2];
    }
    
    if (tok.type == 'operation2') {
      // Rest
      if (tok.operation == "+") {
        if (tok.inputs.length == 1) return toCode(tok.inputs[0]);
        return "("+tok.inputs.map(v=>toCode(v)).join("+")+")";
      }
      if (tok.operation == "\\cdot") {
        if (tok.inputs.length == 1) return toCode(tok.inputs[0]);
        var numbers = tok.inputs.filter(Syntax.IsNum);
        var others = tok.inputs.filter(v=>!Syntax.IsNum(v));
        var string = toCode(others[0]);
        for (var i = 1; i < others.length; i++) string = "Mult("+string;
        string = string+others.slice(1).map(v=>","+toCode(v)+")").join("");
        string = numbers.map(v=>{
          var s = v.value.toString();
          if (!s.includes(".") && v.type == "num") s = s+".";
          s = s.replace("\\","");
          return s+"*";
        }).join("")+string;
        if (string[string.length-1] == "*") string = string.substr(0,string.length-1);
        return string;
      }
      err = true;
      console.error('invalid operation: '+tok.operation);
      return;
    }
    
    if (tok.type == "repeat") {
      var name = "v"+namenum;
      namenum++;
      var op = {
        "prod":["Mult(",",",")","vec2(1,0)"],
        "sum":["(","+",")","vec2(0)"]
      }[tok.operation];
      code = `
  vec2 ${name} = ${op[3]};
  vec2 ${tok.value} = ${toCode(tok.bottom)};
  for (int i = 0; i < 20; i++) {
    ${tok.value}=${tok.value}+vec2(1,0);
    if (Abs(${tok.value}) < Abs(${toCode(tok.top)})) {
      ${name} = ${op[0]+name+op[1]+toCode(tok.param)+op[2]};
    }
  }`+code;
      return name;
    }
    
    if (tok.type == "integral") {
      var name = "v"+namenum;
      var top = "vT"+namenum;
      var bottom = "vB"+namenum;
      namenum++;
      code = `
  vec2 ${name} = vec2(0);
  vec2 ${top} = ${toCode(tok.top)};
  vec2 ${bottom} = ${toCode(tok.bottom)};
  for (float i = 0.025; i < 1.; i+=0.05) {
    vec2 ${tok.value} = mix(${top},${bottom},i);
    ${name} += ${toCode(tok.param)};
  }
  ${name} = Mult(${name},${top}-${bottom})*0.05;
  `+code;
      return name;
    }
    
    if (tok.type == "derivative") {
      return `((${toCode(Syntax.ReplaceVar(tok.param,tok.value,tok.value+"+vec2(0.01,0)"))}-${toCode(Syntax.ReplaceVar(tok.param,tok.value,tok.value+"-vec2(0.01,0)"))})/0.02)`;
    }
    
    if (tok.type == 'grouping') {
      var str = "";
      for (var i = 0; i < tok.value.length; i++) {
        str += toCode(tok.value[i]);
      }
      return "("+str+")";
    }
    
    var FunctionTable = {
      "\\sqrt":["Sqrt(",",kk,ss)"],
      "\\log":["Log(vec2(2,0),",",kk)"],
      "\\exp":["Exp(",")"],
      "\\ln":["Ln(",",kk)"],
      "\\sinh":["Sinh(",")"],
      "\\sin":["Sin(",")"],
      "\\cosh":["Cosh(",")"],
      "\\cos":["Cos(",")"],
      "\\tanh":["Tanh(",")"],
      "\\tan":["Tan(",")"],
      "\\coth":["Coth(",")"],
      "\\cot":["Cot(",")"],
      "\\sech":["Sech(",")"],
      "\\sec":["Sec(",")"],
      "\\csch":["Csch(",")"],
      "\\csc":["Csc(",")"],
      "\\arcsinh":["Arcsinh(",",kk,ss)"],
      "\\arcsin":["Arcsin(",",kk,ss)"],
      "\\arccosh":["Arccosh(",",kk,ss)"],
      "\\arccos":["Arccos(",",kk,ss)"],
      "\\arctanh":["Arctanh(",",kk)"],
      "\\arctan":["Arctan(",",kk)"],
      "\\arccoth":["Arccoth(",",kk)"],
      "\\arccot":["Arccot(",",kk)"],
      "\\arcsech":["Arcsech(",",kk,ss)"],
      "\\arcsec":["Arcsec(",",kk,ss)"],
      "\\arccsch":["Arccsch(",",kk,ss)"],
      "\\arccsc":["Arccsc(",",kk,ss)"],
      "\\erf":["Erf(",")"],
      "\\erfi":["Erfi(",")"],
      "\\Gamma":["Gamma(",",kk)"],
      "-":["(-",")"]
    }
    if (tok.type == 'function') {
      var f = FunctionTable[tok.name];
      return f[0]+toCode(tok.param)+f[1];
    }
    var Function2Table = {
      "\\frac":["Div(",",",")"],
      "\\root":["Root(",",",",kk)"],
      "\\log":["Log(",",",",kk)"]
    }
    if (tok.type == 'function2') {
      // Special cases
      if (tok.name == "\\sqrt" && tok.param1.value == 2) {
        return "Sqrt("+toCode(tok.param2)+",kk)";
      }
      if (tok.name == "\\frac" && tok.param1.value == 1) {
        return "Inv("+toCode(tok.param2)+")";
      }
      
      var f = Function2Table[tok.name];
      return f[0]+toCode(tok.param1)+f[1]+toCode(tok.param2)+f[2];
    }
    
    err = true;
    console.error('invalid token: '+tok.type+" "+tok.value);
    return "";
  }
  var ret = toCode(tree);
  code = code+'\n  return '+ret+';';
  if (err) return 'return z;';
  return code;
}
function compileLatex(tree,readable) {
  // Compiler
  var err = false;
  function toCode(tok) {
    if (!tok) return "";
    if (typeof tok == 'string') return tok;
    if (typeof tok == 'number') tok = Syntax.Num(tok);
    while (tok instanceof Array) tok = tok[0];
    if (tok.type == 'const' || tok.type == 'num' || tok.type == 'var') {
      return tok.value.toString()+" ";
    }
    /*if (tok.type == 'number') {
      return '('+tok.real+'+'+tok.imaginary+'i)';
    }*/
    
    var OperationTable = {
      "+":["\\left(","+","\\right)"],
      "-":["\\left(","-","\\right)"],
      "\\pm":["\\left(","\\pm ","\\right)"],
      "\\cdot":["\\left(","\\right)\\left(","\\right)"],
      "\\div":["\\left(","\\div ","\\right)"],
      "^":["","^{","}"]
    }
    if (tok.type == 'operation') {
      // Rest
      var o = OperationTable[tok.operation];
      if (!o) {
        err = true;
        console.error('invalid operation: '+tok.operation);
        return;
      }
      var v = tok.in1;
      if (v.type != "num" && v.type != "var" && v.type != "const" && v.type != "function" && v.type != "function2") {
        v = "\\left("+toCode(tok.in1)+"\\right)";
      } else {
        v = toCode(tok.in1)
      }
      return o[0]+v+o[1]+toCode(tok.in2)+o[2];
    }
    
    if (tok.type == 'operation2') {
      // Rest
      if (tok.operation == "+") {
        return tok.inputs.map(v=>toCode(v)).join("+");
      }
      if (tok.operation == "\\cdot") {
        var vars = tok.inputs.filter(v=>v.type == "var" || v.type == "const" || v.type == "function" || v.type == "function2");
        var others = tok.inputs.filter(v=>v.type != "num" && v.type != "var" && v.type != "const" && v.type != "function" && v.type != "function2");
        var nums = tok.inputs.filter(v=>v.type == "num");
        var neg = nums.reduce((a,v)=>a+(v.value==-1),0);
        nums = nums.filter(v=>v.value != -1 && v.value != 1);
        vars.unshift(nums.shift());
        others = others.concat(nums);
        return (neg % 2 == 1 ? "-" : "")+vars.map(toCode).join("")+
          others.map(v=>"\\left("+toCode(v)+"\\right)").join("");
      }
      err = true;
      console.error('invalid operation: '+tok.operation);
      return;
    }
    
    if (tok.type == 'grouping') {
      var str = "";
      for (var i = 0; i < tok.value.length; i++) {
        str += toCode(tok.value[i]);
      }
      return "\\left("+str+"\\right)";
    }
    
    if (tok.type == 'function') {
      if (tok.name == "\\exp") return "e^{"+toCode(tok.param)+"}";
      return tok.name+"\\left("+toCode(tok.param)+"\\right)";
    }
    var Function2Table = {
      "\\frac":["\\frac{","}{","}"],
      "\\root":["\\sqrt[","]{","}"],
      "\\log":["\\log_{","}\\left(","\\right)"]
    }
    if (tok.type == 'function2') {
      var f = Function2Table[tok.name];
      return f[0]+toCode(tok.param1)+f[1]+toCode(tok.param2)+f[2];
    }
    
    if (tok.type == "integral") {
      return `\\int_{${toCode(tok.bottom)}}^{${toCode(tok.top)}}\\left(${toCode(tok.param)}\\right)d${tok.value}`;
    }
    
    if (tok.type == "derivative") {
      if (tok.param.type == "var") return `\\frac{d${tok.param.value}}{d${tok.value}}`;
      return `\\frac{d}{d${tok.value}}\\left(${toCode(tok.param)}\\right)`;
    }
    
    err = true;
    console.error('invalid token: '+tok.type+" "+tok.value);
    return "";
  }
  var code = toCode(tree);
  if (err) return 'z';
  if (readable) {
    code = code.replace(/(\\left|\\right)/g,"");
    code = code.replace(/\\cdot\s+/g,"*");
  }
  code = code.replace(/\+\s*-/g,"-");
  code = code.replace(/(?<!\d)\s*(?!\d)/g,"");
  return code;
}

console.logSyntax = function() {
  var r = v => {
    if (v instanceof Array) return v.map(r);
    if (typeof v == "object") return compileLatex(v);
    return v;
  };
  console.log.apply(this,Array.from(arguments).map(r));
}

function parseLatex(inputText,options) {
  console.log(inputText);
  if (inputText == "") return Syntax.Var("z");
  inputText = regexfix(inputText);
  console.log(inputText);
  
  var tokenList = tokenize(inputText)
  console.log(Syntax.copy(tokenList));
  
  var syntaxTree = parse(tokenList);
  console.log(syntaxTree);
  
  //syntaxTree = [simplify(syntaxTree,true,{nodistrib:1})];
  //syntaxTree = [simplify(syntaxTree,true)];
  //syntaxTree = [simplify(syntaxTree,true,options||{nodistrib:1})];
  console.logSyntax(syntaxTree);
  return syntaxTree;
}

function derivative(v,tok) {
  if (tok instanceof Array) tok = tok[0];
  if (tok.type == "num" || tok.type == "const") {
    return Syntax.Zero;
  }
  if (tok.type == "var") {
    if (tok.value == v) return Syntax.One;
    else return Syntax.Zero;
  }
  function chainRule(rule,param) {
    return Syntax.Mult(rule,derivative(v,param));
  }
  if (tok.type == "integral") {
    var ret = Syntax.Sub(
      chainRule(
        Syntax.ReplaceVar(tok.param,tok.value,tok.top),
        tok.top
      ),
      chainRule(
        Syntax.ReplaceVar(tok.param,tok.value,tok.bottom),
        tok.bottom
      )
    );
    console.logSyntax(ret);
    return ret;
  }
  if (tok.type == "derivative") {
    return {
      type:"derivative",
      value:tok.value,
      param:derivative(v,tok.param),
    }
  }
  if (tok.type == "repeat") {
    if (tok.operation == "sum" && !Syntax.ContainsVar(tok.top,v) && !Syntax.ContainsVar(tok.bottom,v)) return {
      type:"repeat",
      operation: tok.operation,
      bottom: tok.bottom,
      top: tok.top,
      value:tok.value,
      param:derivative(v,tok.param),
    };
  }
  if (tok.type == "operation") {
    /*if (tok.operation == "+" || tok.operation == "-") {
      return {
        type: "operation",
        operation: tok.operation,
        in1: derivative(v,tok.in1),
        in2: derivative(v,tok.in2)
      };
    }
    if (tok.operation == "\\cdot") {
      return {
        type: "operation",
        operation: "+",
        in1: {
          type: "operation",
          operation: "\\cdot",
          in1: derivative(v,tok.in1),
          in2: tok.in2
        },
        in2: {
          type: "operation",
          operation: "\\cdot",
          in1: tok.in1,
          in2: derivative(v,tok.in2)
        }
      };
    }*/
    if (tok.operation == "^") {
      if (tok.in2.type == "num") {
        return chainRule(Syntax.Mult([tok.in2,Syntax.Pow(tok.in1,Syntax.Add([tok.in2,Syntax.Num(-1)]))]),tok.in1);
      }
      if (tok.in1.type == "num") {
        return chainRule(Syntax.Mult([
          Syntax.Ln(tok.in1),
          tok
        ]),tok.in2);
      }
      return derivative(v,Syntax.Exp(Syntax.Mult([
        tok.in2,
        Syntax.Ln(tok.in1),
      ])));
    }
  }
  if (tok.type == "operation2") {
    if (tok.operation == "+") {
      return Syntax.Add(tok.inputs.map(t=>derivative(v,t)))
    }
    if (tok.operation == "\\cdot") {
      var numbers = tok.inputs.filter(Syntax.IsNum);
      var notNumbers = tok.inputs.filter(v=>!Syntax.IsNum(v));
      var derivativeInputs = notNumbers.map(t=>derivative(v,t));
      //console.log(109,numbers,notNumbers,derivativeInputs);
      return Syntax.Mult(numbers.concat([Syntax.Add(derivativeInputs.map((a,i) => Syntax.Mult(notNumbers.map((b,j) => j == i ? a : b))))]));
    }
  }
  if (tok.type == "function") {
    /*if (tok.name == "-") {
      return {
        type: "function",
        name: "-",
        param: derivative(v,tok.param)
      };
    }*/
    if (tok.name == "\\exp") {
      return chainRule(tok,tok.param);
    }
    if (tok.name == "\\ln") {
      return chainRule(Syntax.Inv(tok.param),tok.param);
    }
    if (tok.name == "\\sqrt") {
      return chainRule(Syntax.Inv(Syntax.Mult(Syntax.Num(2),Syntax.Funct("\\sqrt",tok.param))),tok.param);
    }
    if (tok.name == "\\sinh") {
      return chainRule(Syntax.Funct("\\cosh",tok.param),tok.param);
    }
    if (tok.name == "\\sin") {
      return chainRule(Syntax.Funct("\\cos",tok.param),tok.param);
    }
    if (tok.name == "\\cosh") {
      return chainRule(Syntax.Funct("\\sinh",tok.param),tok.param);
    }
    if (tok.name == "\\cos") {
      return chainRule(Syntax.Neg(Syntax.Funct("\\sin",tok.param)),tok.param);
    }
    if (tok.name == "\\tanh") {
      return chainRule(Syntax.Square(Syntax.Funct("\\sech",tok.param)),tok.param);
    }
    if (tok.name == "\\tan") {
      return chainRule(Syntax.Square(Syntax.Funct("\\sec",tok.param)),tok.param);
    }
    if (tok.name == "\\coth") {
      return chainRule(Syntax.Neg(Syntax.Square(Syntax.Funct("\\csch",tok.param))),tok.param);
    }
    if (tok.name == "\\cot") {
      return chainRule(Syntax.Neg(Syntax.Square(Syntax.Funct("\\csc",tok.param))),tok.param);
    }
    if (tok.name == "\\sech") {
      return chainRule(Syntax.Mult(Syntax.Num(-1),Syntax.Funct("\\sech",tok.param),Syntax.Funct("\\tanh",tok.param)),tok.param);
    }
    if (tok.name == "\\sec") {
      return chainRule(Syntax.Mult(Syntax.Funct("\\sec",tok.param),Syntax.Funct("\\tan",tok.param)),tok.param);
    }
    if (tok.name == "\\csch") {
      return chainRule(Syntax.Mult(Syntax.Num(-1),Syntax.Funct("\\csch",tok.param),Syntax.Funct("\\coth",tok.param)),tok.param);
    }
    if (tok.name == "\\csc") {
      return chainRule(Syntax.Mult(Syntax.Num(-1),Syntax.Funct("\\csc",tok.param),Syntax.Funct("\\cot",tok.param)),tok.param);
    }
    if (tok.name == "\\arcsinh") {
      return Syntax.Inv(Syntax.Funct("\\sqrt",Syntax.Add(Syntax.Square(tok.param),Syntax.One)));
    }
    if (tok.name == "\\arcsin") {
      return Syntax.Inv(Syntax.Funct("\\sqrt",Syntax.Sub(Syntax.One,Syntax.Square(tok.param))));
    }
    if (tok.name == "\\arccosh") {
      return Syntax.Inv(Syntax.Funct("\\sqrt",Syntax.Sub(Syntax.Square(tok.param),Syntax.One)));
    }
    if (tok.name == "\\arccos") {
      return Syntax.Div(Syntax.Num(-1),Syntax.Funct("\\sqrt",Syntax.Sub(Syntax.One,Syntax.Square(tok.param))));
    }
    if (tok.name == "\\arctanh" || tok.name == "\\arccoth") {
      return Syntax.Inv(Syntax.Sub(Syntax.One,Syntax.Square(tok.param)));
    }
    if (tok.name == "\\arctan") {
      return Syntax.Inv(Syntax.Add(Syntax.Square(tok.param),Syntax.One));
    }
    if (tok.name == "\\arccot") {
      return Syntax.Div(Syntax.Num(-1),Syntax.Add(Syntax.Square(tok.param),Syntax.One));
    }
    if (tok.name == "\\arcsech") {
      return Syntax.Div(Syntax.Num(-1),Syntax.Funct("\\sqrt",Syntax.Sub(Syntax.Square(tok.param),Syntax.Pow(tok.param,Syntax.Num(4)))))
    }
    if (tok.name == "\\arcsec") {
      return Syntax.Div(Syntax.i,Syntax.Funct("\\sqrt",Syntax.Sub(Syntax.Square(tok.param),Syntax.Pow(tok.param,Syntax.Num(4)))))
    }
    if (tok.name == "\\arcsech") {
      return Syntax.Div(Syntax.Num(-1),Syntax.Funct("\\sqrt",Syntax.Add(Syntax.Square(tok.param),Syntax.Pow(tok.param,Syntax.Num(4)))))
    }
    if (tok.name == "\\arccsch") {
      return Syntax.Div(Syntax.Num(-1),Syntax.Mult(Syntax.Funct("\\sqrt",Syntax.Square(tok.param)),Syntax.Funct("\\sqrt",Syntax.Add(Syntax.One,Syntax.Square(tok.param)))));
    }
    if (tok.name == "\\arccsc") {
      return Syntax.Inv(Syntax.Mult(Syntax.Funct("\\sqrt",Syntax.Square(tok.param)),Syntax.Funct("\\sqrt",Syntax.Sub(Syntax.Square(tok.param),Syntax.One))));
    }
  }
  if (tok.type == "function2") {
    if (tok.name == "\\frac") {
      return Syntax.Div(Syntax.Add([Syntax.Mult([tok.param2,derivative(v,tok.param1)]),Syntax.Mult([Syntax.Num(-1),tok.param1,derivative(v,tok.param2)])]),Syntax.Square(tok.param2));
    }
    if (tok.name == "\\log") {
      return derivative(v,Syntax.Div(
        Syntax.Ln(tok.param2),
        Syntax.Ln(tok.param1),
      ));
    }
    /*if (tok.name == "\\root") {
      return Syntax.Div(Syntax.Add([Syntax.Mult([tok.param2,derivative(v,tok.param1)]),Syntax.Mult([Syntax.Num(-1),tok.param1,derivative(v,tok.param2)])]),Syntax.Square(tok.param2));
    }*/
  }
  if (tok.type == "grouping") {
    return {
      type: "grouping",
      value: [derivative(v,tok.value)]
    };
  }
  return {
    type:"derivative",
    value:v,
    param:tok,
  };
}

const MAX_REP_INT = 2;
function integrate(v,tok,reps) {
  if (reps > MAX_REP_INT) return false;
  if (tok instanceof Array) tok = tok[0];
  if (!Syntax.ContainsVar(tok,v)) {
    return Syntax.Mult(tok,Syntax.Var(v));
  }
  if (tok.type == "var") {
    if (tok.value == v) return Syntax.Mult(Syntax.Num(0.5),Syntax.Square(Syntax.Var(v)));
  }
  /*
  function chainRule(rule,param) {
    return Syntax.Mult(rule,derivative(v,param));
  }
  if (tok.type == "integral") {
    if (!Syntax.ContainsVar(tok.param,v)) {
      return Syntax.Sub(
        chainRule(
          Syntax.ReplaceVar(tok.param,tok.value,tok.top),
          tok.top
        ),
        chainRule(
          Syntax.ReplaceVar(tok.param,tok.value,tok.bottom),
          tok.bottom
        )
      );
    }
  }*/
  if (tok.type == "derivative" && tok.value == v) {
    return tok.param;
  }
  /*if (tok.type == "repeat") {
    if (tok.operation == "sum" && !Syntax.ContainsVar(tok.top,v) && !Syntax.ContainsVar(tok.bottom,v)) return {
      type:"repeat",
      operation: tok.operation,
      bottom: tok.bottom,
      top: tok.top,
      value:tok.value,
      param:derivative(v,tok.param),
    };
  }
  if (tok.type == "operation") {
    if (tok.operation == "+" || tok.operation == "-") {
      return {
        type: "operation",
        operation: tok.operation,
        in1: derivative(v,tok.in1),
        in2: derivative(v,tok.in2)
      };
    }
    if (tok.operation == "\\cdot") {
      return {
        type: "operation",
        operation: "+",
        in1: {
          type: "operation",
          operation: "\\cdot",
          in1: derivative(v,tok.in1),
          in2: tok.in2
        },
        in2: {
          type: "operation",
          operation: "\\cdot",
          in1: tok.in1,
          in2: derivative(v,tok.in2)
        }
      };
    }
    if (tok.operation == "^") {
      if (tok.in1.type == "num") {
        return chainRule(Syntax.Mult([
          {
            type: "function",
            name: "\\ln",
            param: tok.in1
          },
          tok
        ]),tok.in2);
      }
      return derivative(v,{
        type: "function",
        name: "\\exp",
        param: Syntax.Mult([
          tok.in2,
          {
            type: "function",
            name: "\\ln",
            param: tok.in1,
          }
        ]),
      });
    }
  }*/
  if (tok.type == "operation2") {
    if (tok.operation == "+") {
      var ret = tok.inputs.map(t=>integrate(v,t,reps));
      if (ret.some(n=>n===false)) return false;
      return Syntax.Add(ret);
    }
    if (tok.operation == "\\cdot") {
      var numbers = tok.inputs.filter(n=>!Syntax.ContainsVar(n,v));
      var notNumbers = tok.inputs.filter(n=>Syntax.ContainsVar(n,v));
      if (numbers.length > 0) {
        var ret = integrate(v,Syntax.Mult(notNumbers),reps);
        if (ret === false) return false;
        return Syntax.Mult(numbers,ret);
      }
      /*var derivativeInputs = notNumbers.map(t=>derivative(v,t));
      console.log(110,numbers,notNumbers,derivativeInputs);
      return Syntax.Mult(numbers.concat([Syntax.Add(derivativeInputs.map((a,i) => Syntax.Mult(notNumbers.map((b,j) => j == i ? a : b))))]));*/
    }
  }
  if (tok.type == "function") {
    if (tok.name == "\\exp") {
      //console.log(78,tok);
      if (tok.param.value == v) {
        return tok;
      }
      if (tok.param.name == "\\ln") {
        return integrate(v,tok.param.param,reps);
      }
      if (tok.param.operation == "\\cdot") {
        var p = tok.param.inputs;
        var numbers = p.filter(n=>!Syntax.ContainsVar(n,v));
        var notNumbers = p.filter(n=>Syntax.ContainsVar(n,v));
        if (notNumbers.length == 1) {
          var n = notNumbers[0];
          if (n.value == v) {
            return Syntax.Div(Syntax.copy(tok),Syntax.Mult(numbers));
          }
          if (n.name == "\\ln" && n.param.value == v) {
            var x = Syntax.Add(Syntax.Mult(numbers),Syntax.One);
            x = simplify(Syntax.copy(x),true);
            //console.log(59,x);
            if (x.value === 0) return Syntax.Ln(n.param);
            return Syntax.Div(Syntax.Pow(n.param,x),x);
          }
        }
      }
      if (tok.param.operation == "+") {
        console.log(67,tok.param.inputs);
        var integralList = tok.param.inputs.map(n=>integrate(v,Syntax.Exp(n),reps+1));
        var derivativeList = tok.param.inputs.map(n=>derivative(v,n));
        console.log(67.5,integralList);
        out: for (var i = 0; i < integralList.length; i++) {
          if (!integralList[i]) continue;
          var exps = Syntax.Exp(Syntax.Add(tok.param.inputs.filter((a,b)=>b!==i)));
          console.log(34,exps);
          var checks = [];
          for (var j = 0; j < tok.param.inputs.length; j++) {
            if (j == i) continue;
            var c = Syntax.Mult(derivativeList[j],exps,integralList[i]);
            c = hypersimplify(c,true,{variable:v});
            //c = ultrasimplify(c,true,{variable:v});
            console.log(34.5,c);
            c = integrate(v,c,reps+1);
            if (!c) continue out;
            checks.push(c);
          }
          console.log(35,checks);
          return Syntax.Add(Syntax.Mult(exps,integralList[i]),checks.map(n=>Syntax.Neg(n)));
        }
        console.log(68,tok.param.inputs,integralList,derivativeList);
        
      }
    }
    if (tok.name == "\\ln") {
      if (tok.param.name == "\\exp") {
        return integrate(v,tok.param.param,reps);
      }
      if (tok.param.value == v) {
        return Syntax.Sub(Syntax.Mult(tok.param,tok),tok.param);
      }
      if (tok.param.operation == "+") {
        var p = tok.param.inputs;
        for (var i = 0; i < p.length; i++) {
          if (p[i].value == 1) break;
          var int1 = integrate(v,Syntax.Ln(p[i]),reps+1);
          console.log(72,int1);
          if (!int1) continue;
          var others = p.filter((n,j)=>i!==j);
          var int2 = Syntax.Ln(Syntax.Add(Syntax.One,Syntax.Div(Syntax.Add(others),p[i])));
          int2 = hypersimplify(int2,true,{variable:v});
          console.log(72.5,int2);
          int2 = integrate(v,int2,reps+1);
          if (!int2) continue;
          console.log(73,int2);
          int2 = fixsimplify(int2,true,{variable:v});
          return Syntax.Add(int1,int2);
        }
      }
    }
    /*if (tok.name == "-") {
      return {
        type: "function",
        name: "-",
        param: derivative(v,tok.param)
      };
    }*/
    /*
    if (tok.name == "\\exp") {
      return chainRule(tok,tok.param);
    }
    if (tok.name == "\\ln") {
      return chainRule(Syntax.Inv(tok.param),tok.param);
    }
    if (tok.name == "\\sin") {
      return chainRule({
        type: "function",
        name: "\\cos",
        param: tok.param
      },tok.param);
    }
    if (tok.name == "\\cos") {
      return chainRule(Syntax.Neg({
        type: "function",
        name: "\\sin",
        param: tok.param
      }),tok.param);
    }
    if (tok.name == "\\tan") {
      return chainRule(Syntax.Square({
        type: "function",
        name: "\\sec",
        param: tok.param
      }),tok.param);
    }
    if (tok.name == "\\cot") {
      return chainRule(Syntax.Neg(Syntax.Square({
        type: "function",
        name: "\\csc",
        param: tok.param
      })),tok.param);
    }*/
  }
  /*if (tok.type == "function2") {
    if (tok.name == "\\frac") {
      return Syntax.Div(Syntax.Add([Syntax.Mult([tok.param2,derivative(v,tok.param1)]),Syntax.Mult([Syntax.Num(-1),tok.param1,derivative(v,tok.param2)])]),Syntax.Square(tok.param2));
    }
  }
  if (tok.type == "grouping") {
    return {
      type: "grouping",
      value: [derivative(v,tok.value)]
    };
  }*/
  var tab = checkTable(v,tok,IntegrationTable);
  if (tab) return tab;
  //return usub(v,tok,tok,reps);
}
function inverse(v,tok,ret,hyped) {
  while (tok instanceof Array) tok = tok[0];
  if (tok.value == v) return ret;
  console.log(tok);
  if (tok.type == "function") {
    var inverseMap = {
      "\\sqrt":Syntax.Square,
      "\\exp":"\\ln",
      "\\ln":"\\exp",
      "\\sin":"\\arcsin",
      "\\cos":"\\arccos",
      "\\sec":"\\arcsec",
      "\\csc":"\\arccsc",
      "\\tan":"\\arctan",
      "\\cot":"\\arccot",
      "\\sinh":"\\arcsinh",
      "\\cosh":"\\arccosh",
      "\\sech":"\\arcsech",
      "\\csch":"\\arccsch",
      "\\tanh":"\\arctanh",
      "\\coth":"\\arccoth",
      "\\arcsin":"\\sin",
      "\\arccos":"\\cos",
      "\\arcsec":"\\sec",
      "\\arccsc":"\\csc",
      "\\arctan":"\\tan",
      "\\arccot":"\\cot",
      "\\arcsinh":"\\sinh",
      "\\arccosh":"\\cosh",
      "\\arcsech":"\\sech",
      "\\arccsch":"\\csch",
      "\\arctanh":"\\tanh",
      "\\arccoth":"\\coth",
    };
    var inv = inverseMap[tok.name];
    if (typeof inv == "string") {
      return inverse(v,tok.param,Syntax.Funct(inv,ret));
    }
    if (typeof inv == "function") {
      return inverse(v,tok.param,inv(ret));
    }
  }
  if (tok.type == "operation2") {
    var numbers = tok.inputs.filter(n=>!Syntax.ContainsVar(n,v));
    var notNumbers = tok.inputs.filter(n=>Syntax.ContainsVar(n,v));
    if (numbers.length > 0) {
      if (tok.operation == "+") return inverse(v,Syntax.Add(notNumbers),Syntax.Sub(ret,Syntax.Add(numbers)));
      if (tok.operation == "\\cdot") return inverse(v,Syntax.Mult(notNumbers),Syntax.Div(ret,Syntax.Mult(numbers)));
    } else {
      var oldop = tok.operation;
      tok = simplify(tok,true,{nodistrib:true,nodistribpow:true});
      if (oldop != tok.operation) {
        return inverse(v,tok,ret);
      }
    }
  }
  if (tok.type == "operation") {
    if (!Syntax.ContainsVar(tok.in1,v)) {
      if (tok.operation == "^") return inverse(v,tok.in2,Syntax.Funct2("\\log",tok.in1,ret));
    }
    if (!Syntax.ContainsVar(tok.in2,v)) {
      if (tok.operation == "^") return inverse(v,tok.in1,Syntax.Pow(tok.in2,Syntax.Inv(ret)));
    }
  }
  if (tok.type == "function2") {
    if (!Syntax.ContainsVar(tok.param1,v)) {
      if (tok.operation == "\\log") return inverse(v,tok.param2,Syntax.Pow(tok.param1,ret));
      if (tok.operation == "\\root") return inverse(v,tok.param2,Syntax.Pow(ret,tok.param1));
      if (tok.operation == "\\frac") return inverse(v,tok.param2,Syntax.Div(ret,tok.param1));
    }
    if (!Syntax.ContainsVar(tok.param2,v)) {
      if (tok.operation == "\\log") return inverse(v,tok.param1,Syntax.Pow(tok.param2,Syntax.Inv(ret)));
      if (tok.operation == "\\root") return inverse(v,tok.param1,Syntax.Inv(Syntax.Funct2("\\log",tok.param2,ret)));
      if (tok.operation == "\\frac") return inverse(v,tok.param1,Syntax.Mult(ret,tok.param2));
    }
  }
  var tab = checkTable(v,tok,InverseTable);
  if (tab) return tab;
  return false;
  //if (hyped) return false;
  //return inverse(v,hypersimplify(tok,true,{variable:v}),ret,true);
}

function* permutations(iterable, r) {
    const pool = Array.from(iterable);
    const n = pool.length;
    r = !r ? n : r;
    if (r > n) {
        return;
    }

    const indices = Array.from({ length: n }, (_, i) => i);
    const cycles = Array.from({ length: r }, (_, i) => n - i);
    yield indices.slice(0, r).map(i => pool[i]);

    loop: while (n) {
      for (var i = r - 1; i >= 0; i--) {
          cycles[i]--;
          if (cycles[i] === 0) {
              indices.splice(i, 1, ...indices.splice(i + 1, n - i - 1), indices[i]);
              cycles[i] = n - i;
          } else {
              const j = cycles[i];
              [indices[i], indices[n - j]] = [indices[n - j], indices[i]];
              yield indices.slice(0, r).map(i => pool[i]);
              break;
          }
      }
      if (i < 0) return;
    }
}
function checkTable(v,tok,table,permute) {
  for (var i = 0; i < table.length; i++) {
    var t = table[i];
    var mat = Syntax.Match(v,tok,t.case);
    var conj = [];
    if (!mat && permute && tok.type == "operation2" && t.case.type == "operation2" && tok.operation == t.case.operation) {
      var indicies = tok.inputs.map((_,j)=>j);
      var perm = permutations(indicies,t.case.inputs.length);
      for (var j = 0; j < 200; j++) {
        var p = perm.next();
        if (p.done) break;
        console.logSyntax(9,Syntax.Operation2(tok.operation,p.value));
        console.log(p);
        var ops = p.value.map(n=>tok.inputs[n]);
        ops = Syntax.Operation2(tok.operation,ops);
        mat = Syntax.Match(v,ops,t.case);
        if (mat) {
          // choose indicies not found yet
          conj = indicies.filter(n=>!p.value.includes(n));
          conj = conj.map(n=>tok.inputs[n]);
          break;
        }
      }
    }
    console.logSyntax(10,tok,t.case);
    console.log(mat);
    if (!mat) continue;
    var ret = v ? Syntax.ReplaceVar(t.result,"var",Syntax.Var(v)) : t.result;
    for (var j in mat) {
      ret = Syntax.ReplaceVar(ret,j,mat[j]);
    }
    if (conj.length > 0) {
      ret = Syntax.Operation2(tok.operation,conj.concat(ret));
    }
    return ret;
  }
  console.log(192,i);
  return false;
}
function usub(v,tok,total,reps) {
  if (reps > MAX_REP_INT) return false;
  if (!Syntax.ContainsVar(tok,v)) return false;
  var u = "u_{"+v+"}";
  var dudv = derivative(v,tok);
  console.logSyntax(90,[tok,total,dudv]);
  var ret = Syntax.Div(Syntax.ReplaceVar(total,tok,Syntax.Var(u)),dudv);
  console.logSyntax(91,ret);
  ret = hypersimplify(ret,true,{variable:u});
  console.logSyntax(91.5,ret);
  if (Syntax.ContainsVar(ret,v)) {
    var inv = inverse(v,tok,Syntax.Var(u));
    inv = hypersimplify(inv,true,{variable:u});
    console.logSyntax(91.6,inv);
    if (inv) {
      ret = Syntax.ReplaceVar(ret,v,inv);
      ret = hypersimplify(ret,true,{variable:u});
    }
  }
  console.logSyntax(91.7,ret);
  if (!Syntax.ContainsVar(ret,v)) {
    ret = integrate(u,ret,reps+1);
    console.logSyntax(92,ret);
    if (ret) {
      ret = Syntax.ReplaceVar(ret,u,tok);
      console.logSyntax(93,ret);
      return ret;
    }
  }
  if (tok.type == "operation2") {
    for (var i = 0; i < tok.inputs.length; i++) {
      var r = usub(v,tok.inputs[i],total,reps+1);
      if (r) return r;
    }
  }
  if (tok.type == "function") {
    return usub(v,tok.param,total,reps+1);
  }
  return false;
}

var Syntax = {
  modify(obj,changes) {
    obj = Syntax.copy(obj||{});
    for (var i in changes) obj[i] = changes[i];
    return obj;
  },
  copy(tok) {
    return JSON.parse(JSON.stringify(tok));
  },
  Is(tok,type,value) {
    if (tok.type !== type) return false;
    if (tok.type == "function" || tok.type == "function2") {
      if (tok.name !== value) return false;
    } else if (tok.type == "operation" || tok.type == "operation2") {
      if (tok.operation !== value) return false;
    } else {
      if (tok.value !== value) return false;
    }
    return true;
  },
  IsEqual(tok1,tok2) {
    return JSON.stringify(tok1) == JSON.stringify(tok2);
  },
  IsEqualNum(tok,value) {
    return tok.type == "num" && tok.value == value;
  },
  IsNum(tok) {
    return tok.type == "num" || (tok.type == "const" && tok.value != "i" && tok.value != "-i");
  },
  IsNumi(tok) {
    return tok.type == "num" || tok.type == "const";
  },
  IsFrac(tok) {
    return tok.type == "function2" && tok.name == "\\frac";
  },
  GetNum(tok) {
    if (tok.type == "num") return Number(tok.value);
    if (tok.type == "const") return {
      "e":Math.E,
      "\\pi":Math.PI,
      "\\tau":2*Math.PI,
      "\\infty":Infinity
    }[tok.value];
    return false;
  },
  Mult() {
    var inputs = Array.from(arguments).flat().sort(Syntax.Sort);
    return Syntax.MultNS(inputs);
  },
  MultNS(inputs) {
    inputs = inputs.filter(v=>!Syntax.IsEqualNum(v,1));
    if (inputs.length == 0) return Syntax.One;
    if (inputs.length == 1) return inputs[0];
    return {
      type: "operation2",
      operation: "\\cdot",
      inputs: inputs
    };
  },
  Pow(in1,in2) {
    if (in1.value === 0) return Syntax.One;
    if (in1.value === 1) return in2;
    return {
      type: "operation",
      operation: "^",
      in1: in1,
      in2: in2
    };
  },
  Square(tok) {
    return Syntax.Pow(tok,Syntax.Num(2));
  },
  Neg(tok) {
    if (tok.type == "num") return Syntax.Num(-tok.value);
    return Syntax.Mult(Syntax.Num(-1),tok);
  },
  Inv(tok) {
    if (tok.type == "function2" && tok.name == "\\frac") {
      return Syntax.Div(tok.param2,tok.param1);
    }
    if (tok.type == "operation" && tok.operation == "^") {
      return Syntax.Pow(tok.in1,Syntax.Neg(tok.in2));
    }
    if (tok.name == "\\exp") {
      return Syntax.Exp(Syntax.Neg(tok.param));
    }
    if (tok.value == "i") return Syntax.Neg(tok);
    return Syntax.Div(Syntax.One,tok);
  },
  Add() {
    var inputs = Array.from(arguments).flat().sort(Syntax.Sort);
    return Syntax.AddNS(inputs);
  },
  AddNS(inputs) {
    inputs = inputs.filter(v=>!Syntax.IsEqualNum(v,0));
    if (inputs.length == 0) return Syntax.Zero;
    if (inputs.length == 1) return inputs[0];
    return {
      type: "operation2",
      operation: "+",
      inputs: inputs
    };
  },
  Sub(in1,in2) {
    return Syntax.Add(in1,Syntax.Neg(in2));
  },
  Div(param1,param2) {
    return {
      type: "function2",
      name: "\\frac",
      param1: param1,
      param2: param2
    };
  },
  Num(n) {
    return {
      type: "num",
      value: n
    }
  },
  Var(v) {
    return {
      type: "var",
      value: v
    }
  },
  get One() {
    return Syntax.Num(1)
  },
  get Zero() {
    return Syntax.Num(0);
  },
  get Pi() {
    return {
      type: "const",
      value: "\\pi"
    };
  },
  get E() {
    return {
      type: "const",
      value: "e"
    };
  },
  get i() {
    return {
      type: "const",
      value: "i"
    };
  },
  get Infinity() {
    return {
      type: "const",
      value: "\\infty"
    };
  },
  Match(v,tokens,expected) {
    var constlist = {};
    function setupconst(tok,syn) {
      if (!syn.placeholder) return syn.value == tok.value;
      console.logSyntax(12,syn,tok,constlist[syn.value]);
      if (constlist[syn.value]) {
        if (!scan(constlist[syn.value],tok)) return false;
      }
      constlist[syn.value] = simplify(tok,true,{nodistrib:true,nofactor:true,nodistribpow:true,nofactorpow:true});
      //constlist[syn.value] = tok;
      return true;
    }
    function scan(tok,syn,hyped) {
      var ret = scan2(tok,syn,hyped);
      if (ret) return true;
      //if (hyped) return false;
      //return scan(hypersimplify(tok,true,{variable:v}),hypersimplify(syn,true,{variable:"var"}),true);
    }
    function scan2(tok,syn,hyped) {
      console.logSyntax(11.2,tok,syn);
      while (tok instanceof Array) tok = tok[0];
      while (syn instanceof Array) syn = syn[0];
      if (syn.type == "var") {
        if (syn.value == "var") return tok.value == v;
        return setupconst(tok,syn);
      }
      if (syn.type == "function") {
        if (tok.type != "function") return false;
        if (tok.name != syn.name) return false;
        return scan(tok.param,syn.param);
      }
      if (syn.type == "operation2") {
        if (tok.type == "operation2" && tok.operation != syn.operation) return false;
        var p = tok.inputs || [tok];
        /*var numbers = p;
        var synNumbers = syn.inputs;
        var notNumbers = [];
        var synNotNumbers = [];*/
        var test = n => n.type == "num" || n.type == "const" || n.type == "var";
        var synNumbers = syn.inputs.filter(test);
        var synNotNumbers = syn.inputs.filter(n=>!test(n));
        var numbers = p.filter(test);
        var notNumbers = p.filter(n=>!test(n));
        //var notNumbers = p.filter(n=>Syntax.ContainsVar(n,v));
        //var synNumbers = syn.inputs.filter(n=>!Syntax.ContainsVar(n,"var"));
        //var synNotNumbers = syn.inputs.filter(n=>Syntax.ContainsVar(n,"var"));
        //var numbers = p.filter(n=>!Syntax.ContainsVar(n,v));
        //var notNumbers = p.filter(n=>Syntax.ContainsVar(n,v));
        //var synNumbers = syn.inputs.filter(n=>!Syntax.ContainsVar(n,"var"));
        //var synNotNumbers = syn.inputs.filter(n=>Syntax.ContainsVar(n,"var"));
        //var numbers = p.filter(n=>!Syntax.ContainsVar(n,v));
        //var notNumbers = p.filter(n=>Syntax.ContainsVar(n,v));
        //var synNumbers = syn.inputs.filter(n=>!Syntax.ContainsVar(n,`"type":"var"`,1)||n.placeholder);
        //var synNotNumbers = syn.inputs.filter(n=>Syntax.ContainsVar(n,`"type":"var"`,1)||n.placeholder);
        if (notNumbers.length !== synNotNumbers.length) return false;
        console.logSyntax(13,synNumbers,numbers,synNotNumbers,notNumbers);
        for (let i = 0; i < synNotNumbers.length; i++) {
          //if (scan(synNotNumbers[i],notNumbers[i]) && !notNumbers.some((n,j)=>j!==i&&scan(synNotNumbers[i],n))) return false;
          if (!scan(notNumbers[i],synNotNumbers[i])) return false;
        }
        loop: for (var i = 0; i < synNumbers.length; i++) {
          console.logSyntax(11.3,synNumbers[i])
          if (!synNumbers[i].placeholder) continue;
          for (var j = i+1; j < synNumbers.length; j++) {
            console.logSyntax(11.35,synNumbers[j]);
            if (synNumbers[j].placeholder) break loop;
            //if (JSON.stringify(synNumbers[j]).includes(`"placeholder":true`)) break loop;
          }
          console.log(11.5,synNumbers);
          if (syn.operation == "+") return setupconst(Syntax.Sub(Syntax.Add(numbers),Syntax.Add(synNumbers.filter((n,j)=>j!==i))),synNumbers[i]);
          if (syn.operation == "\\cdot") return setupconst(Syntax.Div(Syntax.Mult(numbers),Syntax.Mult(synNumbers.filter((n,j)=>j!==i))),synNumbers[i]);
        }
        if (notNumbers.length !== synNotNumbers.length) return false;
        /*for (let i = 0; i < synNumbers.length; i++) {
          //if (scan(synNumbers[i],numbers[i]) && !numbers.some((n,j)=>j!==i&&scan(synNumbers[i],n))) return false;
          if (!numbers[i]) return false;
          //console.logSyntax(synNumbers[i],numbers[i],scan(synNumbers[i],numbers[i]))
          if (!scan(numbers[i],synNumbers[i])) return false;
        }*/
        if (numbers.length !== synNumbers.length) return false;
        loop: for (var i = 0; i < synNumbers.length; i++) {
          for (var j = 0; j < numbers.length; j++) {
            if (scan(numbers[j],synNumbers[i])) {
              numbers.splice(j,1);
              continue loop;
            }
          }
          if (j >= numbers.length) {
            return false;
          }
        }
        return true;
      }
      if (syn.type == "operation") {
        if (tok.type != "operation") return false;
        if (tok.operation != syn.operation) return false;
        return scan(tok.in1,syn.in1) && scan(tok.in2,syn.in2);
      }
      if (Syntax.IsEqual(tok,syn)) return true;
      if (hyped) return false;
      return scan(hypersimplify(tok,true,{variable:v}),hypersimplify(syn,true,{variable:"var"}),true);
      //return false;
      /*if (tok instanceof Array) tok = tok[0];
      if (typeof v == 'object' && Syntax.IsEqual(v,tok)) {
        count++;
        return rep;
      }
      if ((typeof v == 'string' || !v) && tok.type == "var" && (!v || tok.value === v)) {
        count++;
        return rep;
      }
      if (tok.type == "operation") {
        return {
          type:"operation",
          operation:tok.operation,
          in1:scan(tok.in1),
          in2:scan(tok.in2)
        };
      }
      if (tok.type == "operation2") {
        return {
          type:"operation2",
          operation:tok.operation,
          inputs:tok.inputs.map(scan)
        };
      }
      if (tok.type == "function") {
        return {
          type:"function",
          name:tok.name,
          param:scan(tok.param),
        };
      }
      if (tok.type == "function2") {
        return {
          type:"function2",
          name:tok.name,
          param1:scan(tok.param1),
          param2:scan(tok.param2)
        };
      }
      if (tok.type == "repeat") {
        return {
          type:"repeat",
          operation:tok.operation,
          value:tok.value,
          top:scan(tok.top),
          bottom:scan(tok.bottom),
          param:scan(tok.param)
        };
      }
      if (tok.type == "integral") {
        return {
          type:"integral",
          name:tok.name,
          top:scan(tok.top),
          bottom:scan(tok.bottom),
          param:scan(tok.param),
          value:tok.value
        };
      }
      if (tok.type == "derivative") {
        return {
          type:"derivative",
          param:scan(tok.param),
          value:tok.value
        };
      }
      return tok;*/
    }
    if (scan(tokens,expected)) return constlist;
    return false;
  },
  Funct(name,param) {
    return {
      type: "function",
      name: name,
      param: param,
    };
  },
  Operation2(name,inputs) {
    if (name == "+") return Syntax.Add(inputs);
    if (name == "\\cdot") return Syntax.Mult(inputs);
  },
  Funct2(name,param1,param2) {
    return {
      type: "function2",
      name: name, 
      param1: param1,
      param2: param2
    }
  },
  Exp(param) {
    return Syntax.Funct("\\exp",param);
  },
  Ln(param) {
    return Syntax.Funct("\\ln",param);
  },
  ReplaceVar(tokens,v,rep,temp) {
    var count = 0;
    function scan(tok) {
      if (typeof tok !== "object") return;
      if (tok instanceof Array) tok = tok[0];
      if (temp && tok.type == "var") return {
        type:"var",
        value:tok.value,
        placeholder:true
      }
      if (typeof v == 'object' && Syntax.IsEqual(v,tok)) {
        count++;
        return rep;
      }
      if ((typeof v == 'string' || !v) && tok.type == "var" && (!v || tok.value === v)) {
        count++;
        return rep;
      }
      if (tok.type == "operation") {
        return {
          type:"operation",
          operation:tok.operation,
          in1:scan(tok.in1),
          in2:scan(tok.in2)
        };
      }
      if (tok.type == "operation2") {
        return {
          type:"operation2",
          operation:tok.operation,
          inputs:tok.inputs.map(scan)
        };
      }
      if (tok.type == "function") {
        return {
          type:"function",
          name:tok.name,
          param:scan(tok.param),
        };
      }
      if (tok.type == "function2") {
        return {
          type:"function2",
          name:tok.name,
          param1:scan(tok.param1),
          param2:scan(tok.param2)
        };
      }
      if (tok.type == "repeat") {
        return {
          type:"repeat",
          operation:tok.operation,
          value:tok.value,
          top:scan(tok.top),
          bottom:scan(tok.bottom),
          param:scan(tok.param)
        };
      }
      if (tok.type == "integral") {
        return {
          type:"integral",
          name:tok.name,
          top:scan(tok.top),
          bottom:scan(tok.bottom),
          param:scan(tok.param),
          value:tok.value
        };
      }
      if (tok.type == "derivative") {
        return {
          type:"derivative",
          param:scan(tok.param),
          value:tok.value
        };
      }
      return tok;
    }
    var ret = scan(tokens);
    if (temp) return ret;
    if (!rep) return count != 0;
    return ret;
  },
  Sort(a,b) {
    return JSON.stringify(a).length-JSON.stringify(b).length;
  },
  /*Sort(tokens) {
    function sorter(a,b) {
      return JSON.stringify(a).length-JSON.stringify(b).length;
    };
    function scan(tok) {
      if (tok instanceof Array) tok = tok[0];
      if (typeof v == 'object' && Syntax.IsEqual(v,tok)) {
        count++;
        return rep;
      }
      if ((typeof v == 'string' || !v) && tok.type == "var" && (!v || tok.value === v)) {
        count++;
        return rep;
      }
      if (tok.type == "operation") {
        return {
          type:"operation",
          operation:tok.operation,
          in1:scan(tok.in1),
          in2:scan(tok.in2)
        };
      }
      if (tok.type == "operation2") {
        return {
          type:"operation2",
          operation:tok.operation,
          inputs:tok.inputs.map(scan)
        };
      }
      if (tok.type == "function") {
        return {
          type:"function",
          name:tok.name,
          param:scan(tok.param),
        };
      }
      if (tok.type == "function2") {
        return {
          type:"function2",
          name:tok.name,
          param1:scan(tok.param1),
          param2:scan(tok.param2)
        };
      }
      if (tok.type == "repeat") {
        return {
          type:"repeat",
          operation:tok.operation,
          value:tok.value,
          top:scan(tok.top),
          bottom:scan(tok.bottom),
          param:scan(tok.param)
        };
      }
      if (tok.type == "integral") {
        return {
          type:"integral",
          name:tok.name,
          top:scan(tok.top),
          bottom:scan(tok.bottom),
          param:scan(tok.param),
          value:tok.value
        };
      }
      if (tok.type == "derivative") {
        return {
          type:"derivative",
          param:scan(tok.param),
          value:tok.value
        };
      }
      return tok;
    }
    return scan(tokens);
  },*/
  ContainsVar(tokens,v,lit) {
    var tokens = JSON.stringify(tokens);
  	if (typeof v == "string") v = Syntax.Var(v);
    if (!lit) v = JSON.stringify(v);
    return tokens.includes(v);
  }
};
//var step = 0;
function simplify(tok,strict,options,disable) {
  if (disable) return tok;
  options = options||{};
  if (tok instanceof Array) tok = tok[0];
  if (tok.type == "grouping") {
    return {
      type: "grouping",
      value: [simplify(tok.value,strict,options)]
    };
  }
  /*step++;
  if (step >= 150 && step <= 150) console.log(tok);
  if (step >= 1000) return tok;*/
  if (options.unultra == 2) {
    var tab = checkTable(false,tok,SimplifyTable,true);
    if (tab) return simplify(tab,strict,options);
  }
  if (tok.type != "operation" && tok.type != "operation2" && tok.type != "function" && tok.type != "function2" && tok.type != "integral" && tok.type != "derivative") return tok;
  //
  if (tok.type == "operation") {
    tok = {
      type: "operation",
      operation: tok.operation,
      in1: simplify(tok.in1,strict,options),
      in2: simplify(tok.in2,strict,options)
    };
    /*if (tok.operation == "-" && tok.in2.value == 0) return tok.in1;
    if (tok.operation == "+") {
      if (tok.in1.value == 0) return tok.in2;
      if (tok.in2.value == 0) return tok.in1;
    }
    if (tok.operation == "\\cdot") {
      if (tok.in1.value == 1) return tok.in2;
      if (tok.in2.value == 1) return tok.in1;
      if (tok.in2.value == -1) return simplify({
        type:"function",
        name:"-",
        param:tok.in1
      },strict,options);
      if (tok.in1.value == -1) return simplify({
        type:"function",
        name:"-",
        param:tok.in2
      },strict,options);
      if (tok.in1.value == 0) return tok.in1;
      if (tok.in2.value == 0) return tok.in2;
      if (Syntax.IsFrac(tok.in2)) return simplify({
        type:"function2",
        name:"\\frac",
        param1:{
          type:"operation",
          operation:"\\cdot",
          in1: tok.in1,
          in2: tok.in2.param1
        },
        param2: tok.in2.param2
      },strict,options);
      if (Syntax.IsFrac(tok.in1)) return simplify({
        type:"function2",
        name:"\\frac",
        param1:{
          type:"operation",
          operation:"\\cdot",
          in1: tok.in2,
          in2: tok.in1.param1
        },
        param2: tok.in1.param2
      },strict,options);
      if (tok.in2.operation == "+") return simplify({
        type:"operation",
        operation:tok.in2.operation,
        in1:{
          type:"operation",
          operation:"\\cdot",
          in1: tok.in1,
          in2: tok.in2.in1
        },
        in2: {
          type:"operation",
          operation:"\\cdot",
          in1: tok.in1,
          in2: tok.in2.in2
        }
      },strict,options);
      if (isAddSub(tok.in1)) return simplify({
        type:"operation",
        operation:tok.in1.operation,
        in1:{
          type:"operation",
          operation:"\\cdot",
          in1: tok.in2,
          in2: tok.in1.in1
        },
        in2: {
          type:"operation",
          operation:"\\cdot",
          in1: tok.in2,
          in2: tok.in1.in2
        }
      },strict,options);
    }*/
    if (tok.operation == "^") {
      if (tok.in2.value == 0) return {type:"num",value:1};
      if (tok.in2.value == 1) return tok.in1;
      if (tok.in1.value == 1) return tok.in1;
      if (tok.in2.value == -1) return simplify(Syntax.Inv(tok.in1),strict,options);
      if (tok.in1.value == "e") return simplify(Syntax.Exp(tok.in2),strict,options);
      if (tok.in1.value == "i" && Math.round(tok.in2.value) == tok.in2.value) {
        switch (tok.in2.value % 4) {
          case -3: return Syntax.i;
          case -2: return Syntax.Num(-1);
          case -1: return Syntax.Neg(Syntax.i);
          case 0: return Syntax.One;
          case 1: return Syntax.i;
          case 2: return Syntax.Num(-1);
          case 3: return Syntax.Neg(Syntax.i);
          default: break;
        }
      }
      
      if (!options.nodistribpow) {
        if (tok.in1.type == "operation2" && tok.in1.operation == "\\cdot") {
          return simplify(Syntax.Mult(tok.in1.inputs.map(v=>Syntax.Pow(v,tok.in2))),strict,options);
        }
      }
    }
    if (!Syntax.IsNum(tok.in1) || !Syntax.IsNum(tok.in2)) return tok;
    var optable = {
      "+": (a,b)=>a+b,
      "-": (a,b)=>a-b,
      "\\cdot": (a,b)=>a*b,
      "^": Math.pow,
    };
    if (!optable[tok.operation]) return tok;
    var v = optable[tok.operation](Syntax.GetNum(tok.in1),Syntax.GetNum(tok.in2));
    if (isNaN(v) || (strict && v.toString().length > 10)) return tok;
    return Syntax.Num(v);
  }
  if (tok.type == "operation2") {
    tok = {
      type: "operation2",
      operation: tok.operation,
      inputs: tok.inputs.map(v=>simplify(v,strict,options))
    };
    
    if (tok.inputs.length == 1) return tok.inputs[0];
    
    var sameop = [];
    for (var i = 0; i < tok.inputs.length; i++) {
      if (tok.inputs[i].type == "operation2" && tok.inputs[i].operation == tok.operation) {
        sameop = sameop.concat(tok.inputs[i].inputs);
        continue;
      }
      sameop.push(tok.inputs[i]);
    }
    if (sameop.length > tok.inputs.length) return simplify({
      type:"operation2",
      operation:tok.operation,
      inputs: sameop
    },strict,options);
    
    if (tok.operation == "+") {
      tok.inputs = tok.inputs.filter(v=>!Syntax.IsNum(v)||Syntax.GetNum(v)!=0);
      
      if (tok.inputs.length == 1) return tok.inputs[0];
      if (tok.inputs.length == 0) return Syntax.Zero;
      
      var numerator = [];
      var denominator = [];
      for (var i = 0; i < tok.inputs.length; i++) {
        if (tok.inputs[i].type == "function2" && tok.inputs[i].name == "\\frac") {
          var t = tok.inputs[i];
          numerator.push(t.param1);
          var fdenom = (t.param2.type == "operation2" && t.param2.operation == "\\cdot") ? t.param2.inputs : [t.param2];
          for (var j = 0; j < fdenom.length; j++) {
            if (!denominator.some(v=>JSON.stringify(v)==JSON.stringify(fdenom[j]))) denominator.push(fdenom[j]);
          }
          continue;
        }
        numerator.push(tok.inputs[i]);
      }
     // console.log(11,numerator,denominator,denominator.length>0)
      if (denominator.length > 0) return simplify(Syntax.Div(
        Syntax.Add(tok.inputs.map(v=>{
          return Syntax.Mult(denominator,v);
        })),
        Syntax.Mult(denominator)
      ),strict,options);
      
      if (!options.nofactor) {
        var factors = [];
        for (var i = 0; i < tok.inputs.length; i++) {
          var fmult = (tok.inputs[i].type == "operation2" && tok.inputs[i].operation == "\\cdot") ? tok.inputs[i].inputs : [tok.inputs[i]];
          for (var j = 0; j < fmult.length; j++) {
            if (fmult[j].type != "num" && !factors.some(v=>Syntax.IsEqual(v,fmult[j])))  factors.push(fmult[j]);
          }
        }
        var ainputs = Array.from(tok.inputs);
        var newadd = [];
        for (var i = 0; i < factors.length; i++) {
          var coef = [];
          for (var j = ainputs.length-1; j >= 0; j--) {
            var fmult = (ainputs[j].type == "operation2" && ainputs[j].operation == "\\cdot") ? ainputs[j].inputs.concat(Syntax.One) : [ainputs[j],Syntax.One];
            for (var k = 0; k < fmult.length; k++) {
              if (!Syntax.IsEqual(fmult[k],factors[i])) continue;
              fmult.splice(k,1);
              ainputs.splice(j,1);
              coef = coef.concat(Syntax.Mult(fmult));
              break;
            }
          }
          if (coef.length < 1) continue;
          newadd.push(Syntax.Mult(Syntax.Add(coef),factors[i]));
        }
        //console.log(8, newadd, ainputs)
        if (newadd.length > 0) return simplify(Syntax.Add(newadd.concat(ainputs).map(v=>simplify(v,strict,Syntax.modify(options,{nodistrib:1})))),strict,Syntax.modify(options,{nofactor:1}));
      }
    }
    if (tok.operation == "\\cdot") {
      tok.inputs = tok.inputs.filter(v=>!Syntax.IsNum(v)||Syntax.GetNum(v)!=1);
      if (tok.inputs.some(v=>Syntax.IsNum(v)&&Syntax.GetNum(v)==0)) return {
        type:"num",
        value:0
      }
      
      if (tok.inputs.length == 1) return tok.inputs[0];
      if (tok.inputs.length == 0) return Syntax.One;
    
      
      var numerator = [];
      var denominator = [];
      for (var i = 0; i < tok.inputs.length; i++) {
        if (tok.inputs[i].type == "function2" && tok.inputs[i].name == "\\frac") {
          numerator.push(tok.inputs[i].param1);
          denominator.push(tok.inputs[i].param2);
          continue;
        }
        numerator.push(tok.inputs[i]);
      }
      if (denominator.length > 0) return simplify(Syntax.Div(
        Syntax.Mult(numerator),
        Syntax.Mult(denominator),
      ), strict, options);
      
      
      if (!options.nofactor) {
        var factors = [];
        for (var i = 0; i < tok.inputs.length; i++) {
          var fpow = (tok.inputs[i].type == "operation" && tok.inputs[i].operation == "^") ? [tok.inputs[i].in1,tok.inputs[i].in2] : [tok.inputs[i],Syntax.One];
          factors.push(fpow);
        }
        var newmult = [];
        while (factors.length > 0) {
          var base = factors[0][0];
          var common = [];
          for (var i = factors.length-1; i >= 0; i--) {
            if (!Syntax.IsEqual(factors[i][0],base)) continue;
            common.push(factors.splice(i,1)[0][1]);
          }
          //console.log(2,common);
          newmult.push(Syntax.Pow(base,Syntax.Add(common)));
        }
        //console.log(18, newmult, tok.inputs);
        if (newmult.length < tok.inputs.length) return simplify(Syntax.Mult(newmult),strict,Syntax.modify(options,{nofactor:1}));
      }
      
      if (!options.nodistrib) {
        for (var i = 0; i < tok.inputs.length; i++) {
          if (tok.inputs[i].type != "operation2" || tok.inputs[i].operation != "+") continue;
          var distrib = tok.inputs.filter((_,j)=>i!==j);
          //console.log(3,distrib);
          return simplify(Syntax.Add(tok.inputs[i].inputs.map(v=>Syntax.Mult(distrib,v))),strict,options);
        }
      }
      
      /*if (options.unultra) {
        for (var i = 0; i < tok.inputs.length; i++) {
          var p = tok.inputs[i];
          if (p.type == "function" && p.name == "\\ln") {
            var numbers = tok.inputs.filter((v,j)=>j!==i && v.type == "num");
            var notNumbers = tok.inputs.filter((v,j)=>j!==i && v.type != "num");
            //return simplify(Syntax.Mult(notNumbers,Syntax.Pow(p.param,Syntax.Mult(numbers))),strict,options);
          }
        }
      }*/
    }
    /*
    if (tok.operation == "\\cdot") {
      if (Syntax.IsFrac(tok.in2)) return simplify({
        type:"function2",
        name:"\\frac",
        param1:{
          type:"operation",
          operation:"\\cdot",
          in1: tok.in1,
          in2: tok.in2.param1
        },
        param2: tok.in2.param2
      },strict,options);
      if (Syntax.IsFrac(tok.in1)) return simplify({
        type:"function2",
        name:"\\frac",
        param1:{
          type:"operation",
          operation:"\\cdot",
          in1: tok.in2,
          in2: tok.in1.param1
        },
        param2: tok.in1.param2
      },strict,options);
      if (isAddSub(tok.in2)) return simplify({
        type:"operation",
        operation:tok.in2.operation,
        in1:{
          type:"operation",
          operation:"\\cdot",
          in1: tok.in1,
          in2: tok.in2.in1
        },
        in2: {
          type:"operation",
          operation:"\\cdot",
          in1: tok.in1,
          in2: tok.in2.in2
        }
      },strict,options);
      if (isAddSub(tok.in1)) return simplify({
        type:"operation",
        operation:tok.in1.operation,
        in1:{
          type:"operation",
          operation:"\\cdot",
          in1: tok.in2,
          in2: tok.in1.in1
        },
        in2: {
          type:"operation",
          operation:"\\cdot",
          in1: tok.in2,
          in2: tok.in1.in2
        }
      },strict,options);
    }//*/
    
    //var iconsts = tok.inputs.filter(v=>v.value == "i");
    //if (iconsts > 2) return simplify(Syntax.Mult(Syntax.Num(-1),iconsts.slice(2)),strict,options);

    var numbers = tok.inputs.filter(Syntax.IsNum);
    if (numbers.length < 2) return tok;
    var notNumbers = tok.inputs.filter(v=>!Syntax.IsNum(v));
    var op2table = {
      "+": (a,b)=>a+b,
      "\\cdot": (a,b)=>a*b,
    };
    
    if (!op2table[tok.operation]) return tok;
    
    //var v = optable[tok.operation](Syntax.GetNum(tok.in1),Syntax.GetNum(tok.in2))
    //if (strict && v.toString().length > 10) return tok;
    for (var i = 1; i < numbers.length; i++) {
      var v = op2table[tok.operation](Syntax.GetNum(numbers[i-1]),Syntax.GetNum(numbers[i]));
      if (isNaN(v) || (strict && v.toString().length > 10)) continue;
      numbers.splice(i-1,2,Syntax.Num(v));
      i--;
    }
    //console.log(2,numbers)
    
    tok.inputs = numbers.concat(notNumbers);
    if (tok.inputs.length > 1) return tok;
    return tok.inputs[0];
  }
  if (tok.type == "function") {
    if (tok.name == "\\tan") return simplify(Syntax.Div(Syntax.Funct("\\sin",tok.param),Syntax.Funct("\\cos",tok.param)),strict,options);
    if (tok.name == "\\tanh") return simplify(Syntax.Div(Syntax.Funct("\\sinh",tok.param),Syntax.Funct("\\cosh",tok.param)),strict,options);
    if (tok.name == "\\cot") return simplify(Syntax.Div(Syntax.Funct("\\cos",tok.param),Syntax.Funct("\\sin",tok.param)),strict,options);
    if (tok.name == "\\coth") return simplify(Syntax.Div(Syntax.Funct("\\cosh",tok.param),Syntax.Funct("\\sinh",tok.param)),strict,options);
    if (tok.name == "\\sec") return simplify(Syntax.Inv(Syntax.Funct("\\cos",tok.param)),strict,options);
    if (tok.name == "\\sech") return simplify(Syntax.Inv(Syntax.Funct("\\cosh",tok.param)),strict,options);
    if (tok.name == "\\csc") return simplify(Syntax.Inv(Syntax.Funct("\\sin",tok.param)),strict,options);
    if (tok.name == "\\csch") return simplify(Syntax.Inv(Syntax.Funct("\\sinh",tok.param)),strict,options);
    /*if (tok.name == "\\sin") return simplify(Syntax.Mult(Syntax.Num(-1),Syntax.i,Syntax.Funct("\\sinh",Syntax.Mult(Syntax.i,tok.param))),strict,options);
    if (tok.name == "\\cos") return simplify(Syntax.Funct("\\cosh",Syntax.Mult(Syntax.i,tok.param)),strict,options);
    if (tok.name == "\\cosh") return simplify(
      Syntax.Mult(Syntax.Num(0.5),Syntax.Add(
        Syntax.Exp(tok.param),
        Syntax.Exp(Syntax.Neg(tok.param))
      )),strict,options);
    if (tok.name == "\\sinh") return simplify(
      Syntax.Mult(Syntax.Num(0.5),Syntax.Sub(
        Syntax.Exp(tok.param),
        Syntax.Exp(Syntax.Neg(tok.param))
      )),strict,options);*/
    tok = {
      type: "function",
      name: tok.name,
      param: simplify(tok.param,strict,options),
    };
    if (tok.name == "\\exp" && tok.param.name == "\\ln") return tok.param.param;
    if (tok.name == "\\ln" && tok.param.name == "\\exp") return tok.param.param;
    if (tok.name == "\\exp") { 
      if (tok.param.value === 0) return Syntax.One;
      if (tok.param.value === 1) return Syntax.E;
      if (tok.param.operation == "\\cdot") {
        var p = tok.param.inputs;
        if (p.length == 2 && Syntax.ContainsVar(p[0]) && p[1].name == "\\ln" && !Syntax.ContainsVar(p[1].param)) {
          return simplify(Syntax.Pow(p[1].param,p[0]),strict,options);
        }
        if (options.unultra) {
          for (var i = 0; i < p.length; i++) {
            if (p[i].name == "\\ln") {
              return simplify(Syntax.Pow(p[i].param,Syntax.Mult(p.filter((v,j)=>i!==j))),strict,options);
            }
          }
        }
      }
      if (options.unultra) {
        if (tok.param.operation == "+") {
          var p = tok.param.inputs;
          return simplify(Syntax.Mult(p.map(v=>Syntax.Exp(v))),strict,options);
        }
      }
    }
    if (tok.name == "\\ln") {
      if (tok.param.value === 1) return Syntax.Zero;
      if (tok.param.value === "e") return Syntax.One;
    }
    if (!Syntax.IsNum(tok.param)) return tok
    var ftable = {
      "-": a=>-a,
      "\\sqrt": Math.sqrt,
      "\\exp": Math.exp,
      "\\ln": Math.log,
      "\\log": Math.log2,
      "\\sin": Math.sin,
      "\\cos": Math.cos,
      "\\tan": Math.tan,
      "\\cot": Math.cot,
      "\\sec": Math.sec,
      "\\csc": Math.csc,
      "\\sinh": Math.sinh,
      "\\cosh": Math.cosh,
      "\\tanh": Math.tanh,
      "\\coth": Math.coth,
      "\\sech": Math.sech,
      "\\csch": Math.csch,
      "\\arcsin": Math.asin,
      "\\arccos": Math.acos,
      "\\arctan": Math.atan,
      "\\arccot": Math.acot,
      "\\arcsec": Math.asec,
      "\\arccsc": Math.acsc,
      "\\arcsinh": Math.asinh,
      "\\arccosh": Math.acosh,
      "\\arctanh": Math.atanh,
      "\\arccoth": Math.acoth,
      "\\arcsech": Math.asech,
      "\\arccsch": Math.acsch,
      "\\erf": math.erf,
    };
    var mathf = ftable[tok.name] || Math[tok.name.substring(1)];
    if (!mathf) return tok;
    var v = mathf(Syntax.GetNum(tok.param));
    if (isNaN(v) || (strict && v.toString().length > 10)) return tok;
    return Syntax.Num(v);
  }
  function getProd(tok) {
    return (tok.type == "operation2" && tok.operation == "\\cdot") ? tok.inputs : [tok];
  }
  if (tok.type == "function2") {
    if (tok.name == "\\frac" && !options.unfrac) {
      var numerator = getProd(tok.param1);
      var denominator =  getProd(tok.param2);
      return simplify(Syntax.Mult(numerator.concat(denominator.map(v=>Syntax.Inv(v)))),strict,Syntax.modify(options,{unfrac:true}));
    }
    if (tok.name == "\\log" && !options.unfrac) {
      return simplify(Syntax.Div(Syntax.Ln(tok.param2),Syntax.Ln(tok.param1)),strict);
    }
    if (tok.name == "\\frac") {
      var numerator = getProd(tok.param1);
      var denominator =  getProd(tok.param2);
      for (var i = denominator.length-1; i >= 0; i--) {
        var d = denominator[i];
        if (Syntax.Is(d,"function2","\\frac")) {
          denominator.splice(i,1,getProd(d.param1));
          numerator = numerator.concat(getProd(d.param2));
        }
      }
      for (var i = numerator.length-1; i >= 0; i--) {
        var d = numerator[i];
        if (Syntax.Is(d,"function2","\\frac")) {
          numerator.splice(i,1,getProd(d.param1));
          denominator = denominator.concat(getProd(d.param2));
        }
      }
      //console.log(9,numerator,denominator)
      for (var i = numerator.length-1; i >= 0; i--) {
        for (var j = denominator.length-1; j >= 0; j--) {
          if (JSON.stringify(numerator[i]) != JSON.stringify(denominator[j])) continue;
          numerator.splice(i,1);
          denominator.splice(j,1);
        }
      }
      tok.param1 = Syntax.Mult(numerator);
      tok.param2 = Syntax.Mult(denominator);
      if (tok.param2.length == 0) return tok.param1;
      if (tok.param1.length == 0) tok.param1 = Syntax.One;
    }
    tok = {
      type: "function2",
      name: tok.name,
      param1: simplify(tok.param1,strict,options),
      param2: simplify(tok.param2,strict,options)
    };
    if (tok.name == "\\frac") {
      if (tok.param2.value === 1) return tok.param1;
      if (tok.param1.value === 0) return Syntax.Zero;
      if (tok.param2.value === 0) return Syntax.Infinity;
      if (tok.param2.value === "\\infty") return Syntax.Zero;
    }
    if (!Syntax.IsNum(tok.param1) || !Syntax.IsNum(tok.param2)) return tok;
    var table = {
      "\\frac": (a,b) => a/b,
      "\\log_": (a,b) => Math.log(b)/Math.log(a),
    };
    if (!table[tok.name]) return tok;
    var v = table[tok.name](Syntax.GetNum(tok.param1),Syntax.GetNum(tok.param2));
    if (strict && v.toString().length > 10) return tok;
    return {
      type: "num",
      value: v
    };
  }
  function BoundInt(tok,param) {
    return Syntax.Sub(
      Syntax.ReplaceVar(param,tok.value,tok.top),
      Syntax.ReplaceVar(param,tok.value,tok.bottom),
    );
  }
  if (tok.type == "integral") {
    //var res = integrate(tok.value,tok.param,0);
    //if (res) return simplify(BoundInt(tok,res),strict,options,disable);
    var preres = {
      type:"integral",
      top:simplify(tok.top,strict,options),
      bottom:simplify(tok.bottom,strict,options),
      param:hypersimplify(tok.param,strict,Syntax.modify(options,{variable:tok.value})),
      value:tok.value
    };
    //console.log(233,preres);
    var res = integrate(preres.value,preres.param,0);
    console.logSyntax(243.5,res||preres.param);
    console.logSyntax(243,res,tok);
    if (!res) return {
      type:"integral",
      top:preres.top,
      bottom:preres.bottom,
      param:simplify(tok.param,strict,options),
      value:tok.value
    };
    //res = hypersimplify(res,strict,Syntax.modify(options,{variable:tok.value}));
    //res = simplify(BoundInt(tok,res),strict,options);
    console.logSyntax(253,res);
    return simplify(BoundInt(tok,res),strict,options);
    //return res;
  }
  if (tok.type == "derivative") {
    tok = derivative(tok.value,tok.param);
    if (tok.type == "derivative") return tok;
    return simplify(tok,strict,options,disable);
  }
  return tok;
}
function ultrasimplify(tok,strict,options,disable) {
  if (disable) return tok;
  options = options||{};
  if (tok instanceof Array) tok = tok[0];
  if (tok.type == "grouping") {
    return {
      type: "grouping",
      value: [simplify(tok.value,strict,options)]
    };
  }
  /*step++;
  if (step >= 150 && step <= 150) console.log(tok);
  if (step >= 1000) return tok;*/
  if (tok.type != "operation" && tok.type != "operation2" && tok.type != "function" && tok.type != "function2" && tok.type != "integral" && tok.type != "derivative") return tok;
  //
  if (tok.type == "operation") {
    tok = {
      type: "operation",
      operation: tok.operation,
      in1: ultrasimplify(tok.in1,strict,options),
      in2: ultrasimplify(tok.in2,strict,options)
    };
    if (tok.operation == "^") {
      if (tok.in2.value == 0) return Syntax.One;
      if (tok.in2.value == 1) return tok.in1;
      if (tok.in1.value == 1) return tok.in1;
      if (tok.in2.value == -1) return ultrasimplify(Syntax.Exp(Syntax.Neg(Syntax.Ln(tok.in1))),strict,options);
      if (tok.in1.value == "e") return ultrasimplify(Syntax.Exp(tok.in2),strict,options);
      var num = Syntax.GetNum(tok.in2);
      if (num && num % 1 == 0) {
        return ultrasimplify(Syntax.Mult(Array(num).fill(0).map(v=>Syntax.copy(tok.in1))),strict,options);
      }
      return ultrasimplify(Syntax.Exp(Syntax.Mult(tok.in2,Syntax.Ln(tok.in1))),strict,options);
    }
  }
  if (tok.type == "operation2") {
    tok = {
      type: "operation2",
      operation: tok.operation,
      inputs: tok.inputs.map(v=>ultrasimplify(v,strict,options))
    };
    
    if (tok.inputs.length == 1) return tok.inputs[0];
    
    var sameop = [];
    for (var i = 0; i < tok.inputs.length; i++) {
      if (tok.inputs[i].type == "operation2" && tok.inputs[i].operation == tok.operation) {
        sameop = sameop.concat(tok.inputs[i].inputs);
        continue;
      }
      sameop.push(tok.inputs[i]);
    }
    if (sameop.length > tok.inputs.length) return ultrasimplify({
      type:"operation2",
      operation:tok.operation,
      inputs: sameop
    },strict,options);
    
    if (tok.operation == "+") {
      tok.inputs = tok.inputs.filter(v=>!Syntax.IsNum(v)||Syntax.GetNum(v)!=0);
      
      if (tok.inputs.length == 1) return tok.inputs[0];
      if (tok.inputs.length == 0) return Syntax.Zero;
      /*
      var numerator = [];
      var denominator = [];
      for (var i = 0; i < tok.inputs.length; i++) {
        if (tok.inputs[i].type == "function2" && tok.inputs[i].name == "\\frac") {
          var t = tok.inputs[i]
          numerator.push(t.param1);
          var fdenom = (t.param2.type == "operation2" && t.param2.operation == "\\cdot") ? t.param2.inputs : [t.param2];
          for (var j = 0; j < fdenom.length; j++) {
            if (!denominator.some(v=>JSON.stringify(v)==JSON.stringify(fdenom[j]))) denominator.push(fdenom[j]);
          }
          continue;
        }
        numerator.push(tok.inputs[i]);
      }
      //console.log(111,numerator,denominator,denominator.length>0)
      if (denominator.length > 0) return simplify(Syntax.Div(
        Syntax.Add(tok.inputs.map(v=>{
          return Syntax.Mult(denominator,v);
        })),
        Syntax.Mult(denominator)
      ),strict,options);
      */
      if (!options.nofactor) {
        var factors = [];
        for (var i = 0; i < tok.inputs.length; i++) {
          var fmult = (tok.inputs[i].type == "operation2" && tok.inputs[i].operation == "\\cdot") ? tok.inputs[i].inputs : [tok.inputs[i]];
          for (var j = 0; j < fmult.length; j++) {
            if (fmult[j].type != "num" && !factors.some(v=>Syntax.IsEqual(v,fmult[j])))  factors.push(fmult[j]);
          }
        }
        var ainputs = Array.from(tok.inputs);
        var newadd = [];
        for (var i = 0; i < factors.length; i++) {
          var coef = [];
          for (var j = ainputs.length-1; j >= 0; j--) {
            var fmult = (ainputs[j].type == "operation2" && ainputs[j].operation == "\\cdot") ? ainputs[j].inputs.concat(Syntax.One) : [ainputs[j],Syntax.One];
            for (var k = 0; k < fmult.length; k++) {
              if (!Syntax.IsEqual(fmult[k],factors[i])) continue;
              fmult.splice(k,1);
              ainputs.splice(j,1);
              coef = coef.concat(Syntax.Mult(fmult));
              break;
            }
          }
          if (coef.length < 1) continue;
          newadd.push(Syntax.Mult(Syntax.Add(coef),factors[i]));
        }
        //console.log(98, newadd, ainputs)
        if (newadd.length > 0) return ultrasimplify(Syntax.Add(newadd.concat(ainputs).map(v=>simplify(v,strict,Syntax.modify(options,{nodistrib:1})))),strict,Syntax.modify(options,{nofactor:1}));
      }
    }
    if (tok.operation == "\\cdot") {
      var numbers = tok.inputs.filter(v=>!Syntax.ContainsVar(v,options.variable));
      var notNumbers = tok.inputs.filter(v=>Syntax.ContainsVar(v,options.variable));
      return Syntax.Mult(numbers,ultrasimplify(Syntax.Exp(Syntax.Add(notNumbers.map(v=>Syntax.Ln(v)))),strict,options));
    }
    
    var numbers = tok.inputs.filter(Syntax.IsNum);
    if (numbers.length < 2) return tok;
    var notNumbers = tok.inputs.filter(v=>!Syntax.IsNum(v));
    var op2table = {
      "+": (a,b)=>a+b,
      "\\cdot": (a,b)=>a*b,
    };
    
    if (!op2table[tok.operation]) return tok;
    
    //var v = optable[tok.operation](Syntax.GetNum(tok.in1),Syntax.GetNum(tok.in2))
    //if (strict && v.toString().length > 10) return tok;
    for (var i = 1; i < numbers.length; i++) {
      var v = op2table[tok.operation](Syntax.GetNum(numbers[i-1]),Syntax.GetNum(numbers[i]));
      if (strict && v.toString().length > 10) continue;
      numbers.splice(i-1,2,{type:"num",value:v});
      i--;
    }
    //console.log(2,numbers)
    
    tok.inputs = numbers.concat(notNumbers);
    if (tok.inputs.length > 1) return tok;
    return tok.inputs[0];
  }
  if (tok.type == "function") {
    if (tok.name == "\\sqrt") return ultrasimplify(Syntax.Pow(tok.param,Syntax.Num(0.5)),strict,options);
    if (tok.name == "\\tan") return ultrasimplify(Syntax.Div(Syntax.Funct("\\sin",tok.param),Syntax.Funct("\\cos",tok.param)),strict,options);
    if (tok.name == "\\tanh") return ultrasimplify(Syntax.Div(Syntax.Funct("\\sinh",tok.param),Syntax.Funct("\\cosh",tok.param)),strict,options);
    if (tok.name == "\\cot") return ultrasimplify(Syntax.Div(Syntax.Funct("\\cos",tok.param),Syntax.Funct("\\sin",tok.param)),strict,options);
    if (tok.name == "\\coth") return ultrasimplify(Syntax.Div(Syntax.Funct("\\cosh",tok.param),Syntax.Funct("\\sinh",tok.param)),strict,options);
    if (tok.name == "\\sec") return ultrasimplify(Syntax.Inv(Syntax.Funct("\\cos",tok.param)),strict,options);
    if (tok.name == "\\sech") return ultrasimplify(Syntax.Inv(Syntax.Funct("\\cosh",tok.param)),strict,options);
    if (tok.name == "\\csc") return ultrasimplify(Syntax.Inv(Syntax.Funct("\\sin",tok.param)),strict,options);
    if (tok.name == "\\csch") return ultrasimplify(Syntax.Inv(Syntax.Funct("\\sinh",tok.param)),strict,options);
    if (tok.name == "\\sin") return ultrasimplify(Syntax.Mult(Syntax.Num(-1),Syntax.i,Syntax.Funct("\\sinh",Syntax.Mult(Syntax.i,tok.param))),strict,options);
    if (tok.name == "\\cos") return ultrasimplify(Syntax.Funct("\\cosh",Syntax.Mult(Syntax.i,tok.param)),strict,options);
    if (tok.name == "\\cosh") return ultrasimplify(Syntax.Mult(Syntax.Num(0.5),Syntax.Add(Syntax.Exp(tok.param),Syntax.Exp(Syntax.Neg(tok.param)))),strict,options);
    if (tok.name == "\\sinh") return ultrasimplify(Syntax.Mult(Syntax.Num(0.5),Syntax.Sub(Syntax.Exp(tok.param),Syntax.Exp(Syntax.Neg(tok.param)))),strict,options);
    if (tok.name == "\\arcsinh") return ultrasimplify(Syntax.Ln(Syntax.Add(tok.param,Syntax.Pow(Syntax.Add(Syntax.Pow(tok.param,Syntax.Num(2)),Syntax.One),Syntax.Num(0.5)))),strict,options);
    if (tok.name == "\\arcsin") return ultrasimplify(Syntax.Mult(Syntax.Num(-1),Syntax.i,Syntax.Funct("\\arcsinh",Syntax.Mult(Syntax.i,tok.param))),strict,options);
    if (tok.name == "\\arccosh") return ultrasimplify(Syntax.Ln(Syntax.Add(tok.param,Syntax.Pow(Syntax.Sub(Syntax.Pow(tok.param,Syntax.Num(2)),Syntax.One),Syntax.Num(0.5)))),strict,options);
    if (tok.name == "\\arccos") return ultrasimplify(Syntax.Mult(Syntax.Num(-1),Syntax.i,Syntax.Funct("\\arcsinh",tok.param)),strict,options);
    if (tok.name == "\\arctanh") return ultrasimplify(Syntax.Mult(Syntax.Num(0.5),Syntax.Ln(Syntax.Div(Syntax.Add(Syntax.One,tok.param),Syntax.Sub(Syntax.One,tok.param)))),strict,options);
    if (tok.name == "\\arctan") return ultrasimplify(Syntax.Mult(Syntax.Num(-1),Syntax.i,Syntax.Funct("\\arctanh",Syntax.Mult(Syntax.i,tok.param))),strict,options);
    if (tok.name == "\\arccoth") return ultrasimplify(Syntax.Funct("\\arctanh",Syntax.Inv(tok.param)),strict,options);
    if (tok.name == "\\arccot") return ultrasimplify(Syntax.Funct("\\arctan",Syntax.Inv(tok.param)),strict,options);
    if (tok.name == "\\arcsech") return ultrasimplify(Syntax.Funct("\\arccosh",Syntax.Inv(tok.param)),strict,options);
    if (tok.name == "\\arcsec") return ultrasimplify(Syntax.Funct("\\arccos",Syntax.Inv(tok.param)),strict,options);
    if (tok.name == "\\arccsch") return ultrasimplify(Syntax.Funct("\\arcsinh",Syntax.Inv(tok.param)),strict,options);
    if (tok.name == "\\arccsc") return ultrasimplify(Syntax.Funct("\\arcsin",Syntax.Inv(tok.param)),strict,options);

    tok = Syntax.Funct(tok.name,ultrasimplify(tok.param,strict,options));
    if (tok.name == "\\exp" && tok.param.name == "\\ln") return tok.param.param;
    if (tok.name == "\\ln" && tok.param.name == "\\exp") return tok.param.param;
    if (tok.name == "\\exp") {
      if (tok.param.value === 0) return Syntax.One;
      if (tok.param.value === 1) return Syntax.E;
      if (tok.param.operation == "+") {
        var p = tok.param.inputs;
        for (var i = 0; i < p.length; i++) {
          if (p[i].name == "\\ln" && p[i].param.operation == "+") {
            var np = Syntax.Exp(Syntax.Add(p.filter((v,j)=>j!==i)));
            var ip = p[i].param.inputs.map(v=>Syntax.Mult(v,np));
            console.log(23,np,ip);
            return ultrasimplify(Syntax.Add(ip),strict,options);
          }
          if (!Syntax.ContainsVar(p[i],options.variable)) {
            var np = p.filter((v,j)=>j!==i);
            //console.log(43,p[i],np);
            return ultrasimplify(Syntax.Mult(Syntax.Exp(p[i]),Syntax.Exp(Syntax.Add(np))),strict,options);
          }
        }
      }
    }
    if (tok.name == "\\ln") {
      if (tok.param.value === 1) return Syntax.Zero;
      if (tok.param.value === "e") return Syntax.One;
    }
    return tok;
  }
  function getProd(tok) {
    return (tok.type == "operation2" && tok.operation == "\\cdot") ? tok.inputs : [tok];
  }
  if (tok.type == "function2") {
    if (tok.name == "\\frac") {
      var numerator = getProd(tok.param1);
      var denominator =  getProd(tok.param2);
      //var numnums = numerator.filter(v=>!Syntax.ContainsVar(v,options.variable));
      //var notnumnums = numerator.filter(v=>Syntax.ContainsVar(v,options.variable));
      //var numdenoms = denominator.filter(v=>!Syntax.ContainsVar(v,options.variable));
      //var notnumdenoms = denominator.filter(v=>Syntax.ContainsVar(v,options.variable));
      //return Syntax.Mult(numnums,Syntax.Inv(numdenoms),ultrasimplify(Syntax.Exp(Syntax.Add(notnumnums.map(v=>Syntax.Ln(v)).concat(notnumdenoms.map(v=>Syntax.Neg(Syntax.Ln(v)))))),strict,options));
      return ultrasimplify(Syntax.Exp(Syntax.Add(numerator.map(v=>Syntax.Ln(v)).concat(denominator.map(v=>Syntax.Neg(Syntax.Ln(v)))))),strict,options);
      //return ultrasimplify(Syntax.Mult(numerator,Syntax.Inv(denominator)),strict,options);
    }
    if (tok.name == "\\log" && !options.unfrac) {
      return ultrasimplify(Syntax.Div(Syntax.Ln(tok.param2),Syntax.Ln(tok.param1)),strict,options);
    }
  }
  return tok;
}
function hypersimplify(tok,strict,options,disable) {
  return simplify(ultrasimplify(tok,strict,options,disable),strict,options,disable);
}
function fixsimplify(tok,strict,options,disable) {
  return simplify(tok,strict,options,disable);
  return simplify(
    simplify(
      simplify(
        ultrasimplify(
          tok,
         strict,options,disable),
      strict,Syntax.modify(options,{unultra:1}),disable),
    strict,Syntax.modify(options,{unultra:2}),disable),
  strict,Syntax.modify(options,{unultra:2}),disable);
}

var IntegrationTable = [
  {
    case:"\\frac{1}{A+Bx^{2}}",
    result:"\\frac{\\arctan\\left(\\frac{x\\sqrt{B}}{\\sqrt{A}}\\right)}{\\sqrt{A}\\sqrt{B}}",
    var:"x"
  },
  {
    case:"\\frac{1}{A-Bx^{2}}",
    result:"\\frac{\\arctanh\\left(\\frac{x\\sqrt{B}}{\\sqrt{A}}\\right)}{\\sqrt{A}\\sqrt{B}}",
    var:"x"
  },
  {
    case:"e^{ax^{2}}",
    result:"\\frac{-i\\sqrt{\\pi}\\erf\\left(ix\\sqrt{a}\\right)}{2\\sqrt{a}}",
    var:"x"
  }
  /*{
    result:"\\arcsin\\left(x\\right)",
    var:"x"
  },*/
  /*{
    case:"\\tanh\\left(x\\right)",
    result:"\\ln\\left(\\cosh\\left(x\\right)\\right)",
    var:"x"
  },*/
].concat([
  /*"ln","exp",
  "sin","cos","tan","cot","sec","csc",
  "sinh","cosh","tanh","coth","sech","csch",
  "arcsin","arccos","arctan","arccot","arcsec","arccsc",
  "arcsinh","arccosh","arctanh","arccoth","arcsech","arccsch"*/
].map(n=>{
  return {
    result:`\\${n}\\left(x\\right)`,
    var:"x"
  };
})).map(c=>{
  c.result = setupTree(c.var,c.result);
  if (!c.case) {
    c.case = derivative(c.var,c.result);
  } else {
    c.case = setupTree(c.var,c.case);
  }
  c.case = ultrasimplify(c.case,true,{variable:"var"});
  c.case = simplify(c.case,true,{variable:"var"});
  console.log(c);
  return c;
});
var InverseTable = [
  {
    case:"Ax+BC^{x}",
    result:"\\frac{x}{A}-\\frac{W\\left(\\frac{B}{A}C^{x}\\ln\\left(C\\right)\\right)}{\\ln\\left(C\\right)}",
    var:"x"
  },
  {
    case:"xA^{Bx}",
    result:"\\frac{W\\left(Bx\\ln\\left(A\\right)\\right)}{B\\ln\\left(A\\right)}",
    var:"x"
  }
].map(c=>{
  c.result = setupTree(c.var,c.result);
  c.case = setupTree(c.var,c.case);
  /*if (!c.case) {
    c.case = inverse(c.var,c.result);
  } else {
    c.case = setupTree(c.case);
  }*/
  c.case = ultrasimplify(c.case,true,{variable:"var"});
  c.case = simplify(c.case,true,{variable:"var"});
  console.log(c);
  return c;
});
function setupTree(v,rawtxt) {
  var tree = parseLatex(rawtxt);
  tree = Syntax.ReplaceVar(tree,false,false,true);
  tree = Syntax.ReplaceVar(tree,v,Syntax.Var("var"));
  tree = simplify(tree,true);
  return tree;
}

var SimplifyTable = [
  {
    case:"Ae^{x}+Ae^{-x}",
    result:"2A\\cosh\\left(x\\right)"
  },
  {
    case:"Ae^{x}-Ae^{-x}",
    result:"2A\\sinh\\left(x\\right)"
  },
  {
    case:"A\\cosh\\left(x\\right)^{2}-A\\sinh\\left(x\\right)^{2}",
    result:"A"
  },
  {
    case:"\\ln\\left(x+\\sqrt{x^{2}+1}\\right)",
    result:"\\arcsinh\\left(x\\right)"
  },
  {
    case:"\\ln\\left(x+\\sqrt{x^{2}-1}\\right)",
    result:"\\arccosh\\left(x\\right)"
  },
  {
    case:"\\ln\\left(x+\\sqrt{x^{2}-1}\\right)",
    result:"\\arccosh\\left(x\\right)"
  },
  {
    case:"\\ln\\left(\\frac{1+x}{1-x}\\right)",
    result:"\\arctanh\\left(x\\right)"
  },
  /*{
    case:"\\cosh\\left(xi\\right)",
    result:"\\cos\\left(x\\right)"
  },
  {
    case:"i\\sinh\\left(xi\\right)",
    result:"-\\sin\\left(x\\right)"
  },
  {
    case:"\\frac{A\\sin\\left(x\\right)}{B\\cos\\left(x\\right)}",
    result:"\\frac{A}{B}\\tan\\left(x\\right)"
  },
  {
    case:"\\frac{A\\sin\\left(x\\right)}{B\\cos\\left(x\\right)}",
    result:"\\frac{A}{B}\\tan\\left(x\\right)"
  },
  {
    case:"\\frac{A\\cos\\left(x\\right)}{B\\sin\\left(x\\right)}",
    result:"\\frac{A}{B}\\cot\\left(x\\right)"
  },
  {
    case:"\\frac{A}{B\\cos\\left(x\\right)}",
    result:"\\frac{A}{B}\\sec\\left(x\\right)"
  },
  {
    case:"\\frac{A}{B\\sin\\left(x\\right)}",
    result:"\\frac{A}{B}\\csc\\left(x\\right)"
  },
  */
].map(c=>{
  c.result = Syntax.ReplaceVar(parseLatex(c.result,{nodistrib:1,nofactor:1})[0],false,false,true);
  c.case = Syntax.ReplaceVar(parseLatex(c.case,{nodistrib:1,nofactor:1})[0],false,false,true);
  return c;
});

//*
async function loadFile(url) {
  var response = await fetch(url);
  var data = await response.text();
  return data;
}
//*/

var theShader;
var vertSrc;
var fragSrc;

var offset;
var zoom = 2;
var windowScale = 0;
var loaded = false;
async function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight, WEBGL);
  windowScale = min(width, height);
  noStroke();
  offset = createVector(0,0);
  
  vertSrc = await loadFile('shader.vert');
  fragSrc = await loadFile('shader.frag');
  repShader(vertSrc,fragSrc);
  
  loaded = true;
  
  loadData();
  setTimeout(()=>{
    console.log("Loading Eq:"+latexMQ.latex())
    keyCode = 13;
    keyPressed();
  },5000);
}

function draw() {
  if (!loaded) return;
  shader(theShader);
  theShader.setUniform("u_lines", pow(10,-floor(Math.log10(zoom))));
  theShader.setUniform("u_scale", windowScale);
  theShader.setUniform("u_resolution", [width, height]);
  theShader.setUniform("u_zoom", zoom);
  theShader.setUniform("u_offset", [offset.x,-offset.y]);
  theShader.setUniform("u_mouse", [mouseX,-mouseY]);

  scale(width,height);
  quad(-1,-1, -1,1, 1,1, 1,-1);
  
  if (mouseIsPressed) {
    offset.x += (pmouseX - mouseX)/windowScale * 2 * zoom;
    offset.y += (pmouseY - mouseY)/windowScale * 2 * zoom;
  }
  
  // Heights
  var eqh = equation.offsetHeight;
  //equationTxt.style.height = (eqh-4)+"px";
  //equationTxt.style.top = (height-eqh-55)+"px";
  equation.style.top = (height-eqh-35)+"px";
  equation2.style.top = (height-eqh-35)+"px";
  equation2.style.height = (eqh-4)+"px";
}

function mouseWheel(e) {
  var s = e.deltaY > 0 ? 1.05 : 0.95;
  /*if (zoom < 0.2 || zoom > 2) {
    zoom = min(max(zoom, 0.2), 2);
    return;
  }*/
  var mx = (mouseX*2 - width)/windowScale;
  mx = mx*zoom+offset.x
  var my = (mouseY*2 - height)/windowScale;
  my = my*zoom+offset.y
  offset.x = mx * (1 - s) + offset.x * s;
  offset.y = my * (1 - s) + offset.y * s;
  zoom *= s;
  saveData();
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  windowScale = min(width, height);
}

function repShader(vert,frag) {
  frag = frag.replaceAll("#FUNCTION#",`
vec2 F(vec2 ${fvar}, int kk) {
  float ss = 1.0; if (fract(float(kk)/2.) == 1.) ss = -1.0;
  ${funct}
}`+(dfunct?`
vec2 dF(vec2 ${fvar}, int kk) {
  float ss = 1.0; if (fract(float(kk)/2.) == 1.) ss = -1.0;
  ${dfunct}
}`:''))
    .replaceAll("#DEVAL#",dfunct?`dF(z,#SELECTION#)*0.01`:`F(z+0.01,#SELECTION#)-r`)
    .replaceAll("#SELECTION#",selection);
  theShader = createShader(vert,frag);
}

var lastSave = 0;
function saveData() {
  if (Date.now()-lastSave < 5000) return;
  lastSave = Date.now();
  console.log("Saving Eq: ",latexMQ.latex())
  localStorage.data = JSON.stringify({
    latex:latexMQ.latex(),
    funct,
    dfunct,
    fvar,
    selection,
    offset:[offset.x,offset.y],
    zoom
  });
}
function loadData() {
  if (!localStorage.data) return;
  var data = JSON.parse(localStorage.data);
  latexMQ.write(data.latex);
  funct = data.funct;
  dfunct = data.dfunct;
  fvar = data.fvar;
  selection = data.selection;
  offset.x = data.offset[0];
  offset.y = data.offset[1];
  zoom = data.zoom;
}

function keyPressed() {
  // Other Commands
  var typedLatex = "";
  var seq = latexMQ.__controller.cursor[-1];
  while (seq) {
    typedLatex += seq.ctrlSeq;
    seq = seq[-1];
  }
  typedLatex = typedLatex.split("").reverse().join("");
  const symbols = {
    "!=":"\\ne",
    "\\+-":"\\pm",
    "cbrt":"\\sqrt[3]{}",
    "cross":"\\times",
    "eval":"\\left|\\right|_{x=}",
    "diff":"\\left|\\right|_{x=}^{x=}",
    "inf":"\\infty"
  }
  for (const s in symbols) {
    const rest = s.substr(0,s.length-1);
    const last = s.charAt(s.length-1);
    const regex = new RegExp('(?<!\\\\)'+rest+'$');
    //console.log(regex)
    //console.log(typedLatex)
    const match = regex.test(typedLatex);
    if (match && key == last) {
      for (var i = 0; i < s.replace('\\','').length-1; i++) {
        latexMQ.keystroke("Backspace");
      }
      latexMQ.write(symbols[s]);
      
      return false;
    }
  }
  
  // Parse
  if (keyCode == 13) {
    var txt = latexMQ.latex();
    //txt = txt.replaceAll(/\\left\(/g,"(").replaceAll(/\\right\)/g,")").replaceAll("{","(").replaceAll("}",")").replaceAll(/\\(?=(exp|ln|sinh|sin|cosh|cos|tanh|tan|coth|cot|sech|sec|csch|csc|sqrt|Gamma|log|Re|Im|Arg|Abs))/g,"");
    var mat = txt.match(/(\w)\\left\((\w)\\right\)\s*=\s*/);
    if (!mat) mat = ["","f","z"];
    txt = txt.replace(mat[0],"");
    fvar = mat[2];
    funct = parseLatex(txt);
    console.log(1.12,funct);
    dfunct = fixsimplify(derivative(fvar,funct),true,{variable:fvar});
    funct = fixsimplify(funct,true,{variable:fvar});
    console.log(2,dfunct);
    console.logSyntax(3,inverse(fvar,funct,Syntax.Var("w")));
    console.logSyntax(3.5,hypersimplify(funct,true,{variable:fvar}));
    console.logSyntax(3.6,funct);
    //outputMQ.latex(mat[0]+compileLatex(funct));
    outputMQ.latex(mat[1]+`'\\left(${fvar}\\right) = `+compileLatex(dfunct));
    if (dfunct.type == "derivative") dfunct = false;
    else dfunct = compileShader(dfunct);
    funct = compileShader(funct);
    repShader(vertSrc,fragSrc);
    saveData();
    return false;
  }
  
  if (keyIsDown(17) && keyCode == 188 && keyIsPressed) {
    selection--;
    console.log("k="+selection);
    repShader(vertSrc,fragSrc);
    return false;
  }
  
  if (keyIsDown(17) && keyCode == 190 && keyIsPressed) {
    selection++;
    console.log("k="+selection);
    repShader(vertSrc,fragSrc);
    return false;
  }
}

// \sin \left(\cos \left(x\right)e^x+2xi\right)




