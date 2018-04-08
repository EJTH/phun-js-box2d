# phun-js
Phun-js is a bundle of utilities revolving around the sandbox "games" Phun and Algodoo.
The greater goal of this project is to create a HTML Web player for Algodoo & Phun scenes.

As of now it currently consists of:
- Scene & ThymeScript parser
- ThymeScript to JavaScript Transpiler
- Small runtime for Thyme in javascript (polyfills for thyme specific language features)

## Plans for a HTML5 Algodoo scene viewer/player
The plan for the web player is to use [LiquidFun](https://github.com/google/liquidfun) by Google for the Physics calculations and possibly THREE.js for the rendering. LiquidFun is an extension of the Box2D physics engine and comes in an EmScripten compiled version for javascript.


##TODOs:

### Web player
   + Implementations of Scene.* and other core calls.
   + Implementation of constraints (Hinges, Welds, Springs)
   + Scene loader
   + Debug rendering mode
   + Events & Thyme Scripting
   + Texture rendering mode
   + Sky & cloud
   + Controls

### Scene parser
   + Unzipping (Maybe even clientside support? https://gildas-lormeau.github.io/zip.js/)

### Greater scheme
   + Scene to HTML converter tool (CLI)
   + Online scene player (User "uploads"  own scenes)
   + THREE.js+liquidfun template with phz support.
