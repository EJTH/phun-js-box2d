function TestWaveMachine() {
  var psd = new b2ParticleSystemDef();
 var particleSystem= world.CreateParticleSystem(psd);

 var expectedParticleCount = 50;
 for(var i = 0; i < expectedParticleCount; i++) {
   var pd = new b2ParticleDef();
   pd.position = new b2Vec2(i, 0);
   particleSystem.CreateParticle(pd);
 }

 var assertParticleCount = "Expected particle count: " + expectedParticleCount + " actual: " + particleSystem.GetParticleCount();
 var assertPositionBuffer = "Expected position buffer size: " + (expectedParticleCount * 2) + " actual: " + particleSystem.GetPositionBuffer().length;

 console.log(assertParticleCount);
 console.log(assertPositionBuffer);
}
