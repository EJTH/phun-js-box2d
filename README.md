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

## Instructions
Go to the [phun-js-webplayer](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=dragndrop.phz) drag and drop your algodoo scene into the browser. Thats it!

### Player features
  - Drag & drop .phz files to load (Client side)
  - Hinges, springs (wip)
  - water
  - Complex polygons
  - Circles, rectangles
  - Hinges, Motors (Controlled)
  - Fixate joins (wip)
  - Camera follow

### Player examples:
   + [Car](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=car.phz) (Control car with A, D)
   + [Tramboline](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=tramboline.phz)
   + [Trebuchet](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=Trebuchet.phz) (Press keys 1, 2, 3)
   + [Raining men](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=rainingmen.phz)
   + [Brick wall](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=BrickWallTest.phz)
   + [Gears](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=gears.phz) (Broken because of polygon handling... To be fixed)
   + [Water](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=water.phz)
   + [Water glass](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=waterglass.phz)
   + [Water bottle rocket](https://ejth.github.io/phun-js-box2d/lib/player/index.html?scene=rocket.phz)

## ThymeScript parser and Transpiler
  For info on using the Thyme parser and transpiler, take a look at the unit tests provided. and also reference the documentation for PEG.js

## TODOs
   + Fix complex polygons (Earclipping!)
   + Fix emscripten compilation (enable optimizations and fix particles!)
   +

### Web player
   + (Proper) Springs
   + Thrusters
   + Breakables
   + Events & Thyme Scripting
   + Textured and solid rendering mode
   + Sky & cloud
   + Killers and Immortalss
   + Air friction
   + Wind (Probably never going to do this!)
   + Controls (wip)
   + Phun drag&drop support in player

### Greater scheme
   + Scene to HTML converter tool (CLI)
   + THREE.js+liquidfun template with phz scene support.

## Links
+ [Phun-js-box2d github page](http://github.com/ejth/phun-js-box2d)
+ [Algodoo](http://algodoo.com)
