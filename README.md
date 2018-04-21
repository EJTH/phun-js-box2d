# phun-js
Phun-js is a bundle of utilities revolving around the sandbox "games" Phun and Algodoo.
The greater goal of this project is to create a HTML Web player for Algodoo & Phun scenes.

As of now it currently consists of:
- Scene & ThymeScript parser
- ThymeScript to JavaScript Transpiler
- Small runtime for Thyme in javascript (polyfills for thyme specific language features)
- WIP Web player for Algodoo scenes

## HTML5 Algodoo scene viewer/player
The plan for the web player is to use [LiquidFun](https://github.com/google/liquidfun) by Google for the Physics calculations and possibly THREE.js for the rendering. LiquidFun is an extension of the Box2D physics engine and comes in an EmScripten compiled version for javascript.

### Player examples:
   + [Car](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=car.phz) (Control car with A, D)
   + [Tramboline](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=tramboline.phz)
   + [Trebuchet](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=Trebuchet.phz) (Press keys 1, 2, 3)
   + [Raining men](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=rainingmen.phz)
   + [Brick wall](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=BrickWallTest.phz)
   + [Gears](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=gears.phz) (Broken because of polygon handling... To be fixed)


## TODOs

### Web player
   + Implementations of Scene.* and other core calls.
   + Springs
   + Thrusters
   + Water
   + Breakables
   + Better polygon support
   + Events & Thyme Scripting
   + Texture rendering mode
   + Sky & cloud
   + Controls (wip)
   + Phun drag&drop support in player

### Scene parser
   ???

### Greater scheme
   + Scene to HTML converter tool (CLI)
   + Online scene player (User "uploads"  own scenes) (Works, but WIP)
   + THREE.js+liquidfun template with phz support.

## Links
+ [Phun-js-box2d github page](http://github.com/ejth/phun-js-box2d)
+ [Algodoo](http://algodoo.com)
