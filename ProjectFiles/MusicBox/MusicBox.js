/**
 * Class for a MusicBox InstrumentModel object
 * @author drew shotwell <drew.shotwell@principia.edu>
 * @author cameron wood <cameron.wood@principia.edu>
 */

class MusicBox extends InstrumentModel {
   constructor(song, cnl, size = 5) {
      super(song, cnl, size);

      this.cnl = cnl;

      const cylPlayer = new MusicBox.CylinderPlayer(song, cnl, size);
      this.add(cylPlayer);
      
      const harp = new MusicBox.Harp(song, cnl, size);
      harp.rotateY(-Math.PI/2);
      this.add(harp);
      
      const cylHold = new MusicBox.CylinderHolder(size);
      cylHold.rotateY(-Math.PI/2);
      this.add(cylHold);
      
      super.setOrigin();
   }
}

MusicBox.title = "Music Box";

MusicBox.makeOptions = function(camera, controls, mod) {
   const instPos = mod.position;
   const bndBox = mod.boundingBox;
   
   const updateCtrls = function() {
      controls.target = instPos.clone();
      controls.update();
   };
   
   const opt = InstrumentModel.makeOptions(camera, controls, mod);
   
   opt["Main View"] = function() {
      camera.position.set(bndBox.min.x - 6, bndBox.max.y - 4, bndBox.min.z + 3);
      updateCtrls();
      camera.lookAt(instPos);  
   };
   
   return opt;
}