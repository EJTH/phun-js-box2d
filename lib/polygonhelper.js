function getAngle(vec1,vec2,vec3)
{
    lenghtA = Math.sqrt(Math.pow(vec2.x - vec1.x, 2) + Math.pow(vec2.y - vec1.y,2));
    lenghtB = Math.sqrt(Math.pow(vec3.x - vec2.x,2) + Math.pow(vec3.y - vec2.y, 2));
    lenghtC = Math.sqrt(Math.pow(vec3.x - vec1.x,2) + Math.pow(vec3.y - vec1.y, 2));
    calc = ((lenghtA * lenghtA) + (lenghtB * lenghtB) - (lenghtC * lenghtC)) / (2 * lenghtA * lenghtB);
    return Math.acos(calc)* 180/Math.PI;
}

function simplifyPolygon(vertices){
  var p1 = vertices[0];
  var p2 = vertices[1];
  var p3;
  var simple = [];
  for(var i=2; i<vertices.length;i++){
    var p3 = vertices[i];
    if(Math.abs(getAngle(p1,p2,p3) - 180) > 2){
      p1 = p2;
      p2 = p3;
      simple.push(p3);
    } else {
      p2 = p3;
    }
  }
}
