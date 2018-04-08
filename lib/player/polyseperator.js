function b2Seperator() {


   /**
    * Separates a non-convex polygon into convex polygons and adds them as fixtures to the <code>body</code> parameter.<br/>
    * There are some rules you should follow (otherwise you might get unexpected results) :
    * <ul>
    * <li>This class is specifically for non-convex polygons. If you want to create a convex polygon, you don't need to use this class - Box2D's <code>b2PolygonShape</code> class allows you to create convex shapes with the <code>setAsArray()</code>/<code>setAsVector()</code> method.</li>
    * <li>The vertices must be in clockwise order.</li>
    * <li>No three neighbouring points should lie on the same line segment.</li>
    * <li>There must be no overlapping segments and no "holes".</li>
    * </ul> <p/>
    * @param body The b2Body, in which the new fixtures will be stored.
    * @param fixtureDef A b2FixtureDef, containing all the properties (friction, density, etc.) which the new fixtures will inherit.
    * @param verticesVec The vertices of the non-convex polygon, in clockwise order.
    * @param scale <code>[optional]</code> The scale which you use to draw shapes in Box2D. The bigger the scale, the better the precision. The default value is 30.
    * @see b2PolygonShape
    * @see b2PolygonShape.SetAsArray()
    * @see b2PolygonShape.SetAsVector()
    * @see b2Fixture
    * */

   this.Seperate = function Separate(body,fixtureDef,verticesVec,scale) {
     scale = scale || 1;
     var i,n=verticesVec.length,j,m;
     var vec=[]  ,figsVec;
     var polyShape;

     for (i=0; i<n; i++) {
       vec.push(new b2Vec2(verticesVec[i].x*scale,verticesVec[i].y*scale));
     }

     figsVec=calcShapes(vec);
     n=figsVec.length;

     for (i=0; i<n; i++) {
       verticesVec={}  ;
       vec=figsVec[i];
       m=vec.length;
       polyShape=new b2PolygonShape  ;
       for (j=0; j<m; j++) {
         polyShape.vertices[j] = (new b2Vec2(vec[j].x/scale,vec[j].y/scale));
       }

       fixtureDef.shape=polyShape;
       body.CreateFixtureFromDef(fixtureDef);
     }
   }

   /**
    * Checks whether the vertices in <code>verticesVec</code> can be properly distributed into the new fixtures (more specifically, it makes sure there are no overlapping segments and the vertices are in clockwise order).
    * It is recommended that you use this method for debugging only, because it may cost more CPU usage.
    * <p/>
    * @param verticesVec The vertices to be validated.
    * @return An integer which can have the following values:
    * <ul>
    * <li>0 if the vertices can be properly processed.</li>
    * <li>1 If there are overlapping lines.</li>
    * <li>2 if the points are <b>not</b> in clockwise order.</li>
    * <li>3 if there are overlapping lines <b>and</b> the points are <b>not</b> in clockwise order.</li>
    * </ul>
    * */

   this.Validate = function Validate(verticesVec) {
     var i,n=verticesVec.length,j,j2,i2,i3,d,ret=0;
     var fl,fl2=false;

     for (i=0; i<n; i++) {
       i2=(i<n-1)?i+1:0;
       i3=(i>0)?i-1:n-1;

       fl=false;
       for (j=0; j<n; j++) {
         if (((j!=i)&&j!=i2)) {
           if (! fl) {
             d=det(verticesVec[i].x,verticesVec[i].y,verticesVec[i2].x,verticesVec[i2].y,verticesVec[j].x,verticesVec[j].y);
             if ((d>0)) {
               fl=true;
             }
           }

           if ((j!=i3)) {
             j2=(j<n-1)?j+1:0;
             if (hitSegment(verticesVec[i].x,verticesVec[i].y,verticesVec[i2].x,verticesVec[i2].y,verticesVec[j].x,verticesVec[j].y,verticesVec[j2].x,verticesVec[j2].y)) {
               ret=1;
             }
           }
         }
       }

       if (! fl) {
         fl2=true;
       }
     }

     if (fl2) {
       if ((ret==1)) {
         ret=3;
       }
       else {
         ret=2;
       }

     }
     return ret;
   }

   function calcShapes(verticesVec) {
     var vec;
     var i,n,j;
     var d,t,dx,dy,minLen;
     var i1,i2,i3,p1,p2,p3;
     var j1,j2,v1,v2,k,h;
     var vec1,vec2;
     var v,hitV;
     var isConvex;
     var figsVec=[],queue=[];

     queue.push(verticesVec);

     while (queue.length) {
       vec=queue[0];
       n=vec.length;
       isConvex=true;

       for (i=0; i<n; i++) {
         i1=i;
         i2=(i<n-1)?i+1:i+1-n;
         i3=(i<n-2)?i+2:i+2-n;

         p1=vec[i1];
         p2=vec[i2];
         p3=vec[i3];

         d=det(p1.x,p1.y,p2.x,p2.y,p3.x,p3.y);
         if ((d<0)) {
           isConvex=false;
           minLen=Number.MAX_VALUE;

           for (j=0; j<n; j++) {
             if (((j!=i1)&&j!=i2)) {
               j1=j;
               j2=(j<n-1)?j+1:0;

               v1=vec[j1];
               v2=vec[j2];

               v=hitRay(p1.x,p1.y,p2.x,p2.y,v1.x,v1.y,v2.x,v2.y);

               if (v) {
                 dx=p2.x-v.x;
                 dy=p2.y-v.y;
                 t=dx*dx+dy*dy;

                 if ((t<minLen)) {
                   h=j1;
                   k=j2;
                   hitV=v;
                   minLen=t;
                 }
               }
             }
           }

           if ((minLen==Number.MAX_VALUE)) {
             err(1);
           }

           vec1=[]  ;
           vec2=[]  ;

           j1=h;
           j2=k;
           v1=vec[j1];
           v2=vec[j2];

           if (! pointsMatch(hitV.x,hitV.y,v2.x,v2.y)) {
             vec1.push(hitV);
           }
           if (! pointsMatch(hitV.x,hitV.y,v1.x,v1.y)) {
             vec2.push(hitV);
           }

           h=-1;
           k=i1;
           while (true) {
             if ((k!=j2)) {
               vec1.push(vec[k]);
             }
             else {
               if (((h<0)||h>=n)) {
                 err(2);
               }
               if (! isOnSegment(v2.x,v2.y,vec[h].x,vec[h].y,p1.x,p1.y)) {
                 vec1.push(vec[k]);
               }
               break;
             }

             h=k;
             if (((k-1)<0)) {
               k=n-1;
             }
             else {
               k--;
             }
           }

           vec1=vec1.reverse();

           h=-1;
           k=i2;
           while (true) {
             if ((k!=j1)) {
               vec2.push(vec[k]);
             }
             else {
               if (((h<0)||h>=n)) {
                 err(3);
               }
               if (((k==j1)&&! isOnSegment(v1.x,v1.y,vec[h].x,vec[h].y,p2.x,p2.y))) {
                 vec2.push(vec[k]);
               }
               break;
             }

             h=k;
             if (((k+1)>n-1)) {
               k=0;
             }
             else {
               k++;
             }
           }

           queue.push(vec1,vec2);
           queue.shift();

           break;
         }
       }

       if (isConvex) {
         figsVec.push(queue.shift());
       }
     }

     return figsVec;
   }

   function hitRay(x1,y1,x2,y2,x3,y3,x4,y4) {
     var t1=x3-x1,t2=y3-y1,t3=x2-x1,t4=y2-y1,t5=x4-x3,t6=y4-y3,t7=t4*t5-t3*t6,a;

     a=(((t5*t2)-t6*t1)/t7);
     var px=x1+a*t3,py=y1+a*t4;
     var b1=isOnSegment(x2,y2,x1,y1,px,py);
     var b2=isOnSegment(px,py,x3,y3,x4,y4);

     if ((b1&&b2)) {
       return new b2Vec2(px,py);
     }

     return null;
   }

   function hitSegment(x1,y1,x2,y2,x3,y3,x4,y4) {
     var t1=x3-x1,t2=y3-y1,t3=x2-x1,t4=y2-y1,t5=x4-x3,t6=y4-y3,t7=t4*t5-t3*t6,a;

     a=(((t5*t2)-t6*t1)/t7);
     var px=x1+a*t3,py=y1+a*t4;
     var b1=isOnSegment(px,py,x1,y1,x2,y2);
     var b2=isOnSegment(px,py,x3,y3,x4,y4);

     if ((b1&&b2)) {
       return new b2Vec2(px,py);
     }

     return null;
   }

   function isOnSegment(px,py,x1,y1,x2,y2) {
     var b1=((((x1+0.1)>=px)&&px>=x2-0.1)||(((x1-0.1)<=px)&&px<=x2+0.1));
     var b2=((((y1+0.1)>=py)&&py>=y2-0.1)||(((y1-0.1)<=py)&&py<=y2+0.1));
     return ((b1&&b2)&&isOnLine(px,py,x1,y1,x2,y2));
   }
   isOnSegment = isOnSegment;

   function pointsMatch(x1,y1,x2,y2) {
     var dx=(x2>=x1)?x2-x1:x1-x2,dy=(y2>=y1)?y2-y1:y1-y2;
     return ((dx<0.1)&&dy<0.1);
   }

   function isOnLine(px,py,x1,y1,x2,y2) {
     if ((((x2-x1)>0.1)||x1-x2>0.1)) {
       var a=(y2-y1)/(x2-x1),possibleY=a*(px-x1)+y1,diff=(possibleY>py)?possibleY-py:py-possibleY;
       return (diff<0.1);
     }

     return (((px-x1)<0.1)||x1-px<0.1);
   }

   function det(x1,y1,x2,y2,x3,y3) {
     return x1*y2+x2*y3+x3*y1-y1*x2-y2*x3-y3*x1;
   }

   function err(i) {
     throw new Error("A problem has occurred. Use the Validate() method to see where the problem is."+ i);
   }
}
