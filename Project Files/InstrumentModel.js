/**
 * Abstract class for all placeable Instruments in the scene
 * @author drew shotwell <drew.shotwell@principia.edu>
 * @author cameron wood <cameron.wood@principia.edu>
 */

class InstrumentModel extends THREE.Group {
   constructor(song, cnl, size) {
      super();
      this.song = song;
      this.cnl = cnl;
      this.size = size;
   }
   setOrigin() {
      this.translateY(-(new THREE.Box3().setFromObject(this).min.y) - 30);
      //30 offset for plane
   }
   updateAnimation(time) {
      this.children.forEach(child => {
         child.updateAnimation(time);
      });
   }
}
InstrumentModel.makeOptions = function(camera, controls, mod) {
   const instPos = mod.position;
   const bndBox = mod.boundingBox;
   
   const updateCtrls = function() {
      controls.target = instPos.clone();
      controls.update();
   };
   
   return {
      "Front View": function() {
         if (bndBox.max.y > 0)
            camera.position.set(bndBox.min.x - 5,
             (bndBox.max.y - Math.abs(bndBox.min.y))/2, instPos.z);
         else
            camera.position.set(bndBox.min.x - 5,
             (bndBox.min.y - bndBox.max.y)/2, instPos.z);
         updateCtrls();
         camera.lookAt(instPos);         
      },
      "Back View": function() {
         if (bndBox.max.y > 0)
            camera.position.set(bndBox.max.x + 5,
             (bndBox.max.y - Math.abs(bndBox.min.y))/2, instPos.z);
         else
            camera.position.set(bndBox.max.x + 5,
             (bndBox.min.y - bndBox.max.y)/2, instPos.z);
         updateCtrls();
         camera.lookAt(instPos);           
      },
      "Bird's Eye View": function() {
         camera.position.set(instPos.x, mod.boundingBox.max.y + 10,instPos.z);
         updateCtrls();
         controls.rotateLeft(Math.PI/2);
      }
   };
};