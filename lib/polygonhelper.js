function getAngle(vec1,vec2,vec3)
{
    lenghtA = Mathf.Sqrt(Mathf.Pow(vec2.x - vec1.x, 2) + Mathf.Pow(vec2.y - vec1.y,2));
    lenghtB = Mathf.Sqrt(Mathf.Pow(vec3.x - vec2.x,2) + Mathf.Pow(vec3.y - vec2.y, 2));
    lenghtC = Mathf.Sqrt(Mathf.Pow(vec3.x - vec1.x,2) + Mathf.Pow(vec3.y - vec1.y, 2));

    calc = ((lenghtA * lenghtA) + (lenghtB * lenghtB) - (lenghtC * lenghtC)) / (2 * lenghtA * lenghtB);

    return Math.acos(calc)* 180/Math.PI;

}
