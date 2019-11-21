/**
 * Arms component of MusicBox
 * @author drew shotwell <drew.shotwell@principia.edu>
 * @author cameron wood <cameron.wood@principia.edu>
 */

class DrumMan extends THREE.Group {
   constructor(song, cnl, size) {
      super();

      this.song = song;
      this.cnl = cnl;
      this.muteAnm = 0;

      // MIDI indices for the left and right percussion instruments
      // Shouldn't be any note indices between the max and min.
      this.leftArmIdx = song.getRange(cnl).min;
      this.rightArmIdx = song.getRange(cnl).max;

      // Main body
      const bodyGeo = new THREE.BoxBufferGeometry(1, 3, 1);
      const bodyMat = new THREE.MeshPhongMaterial();
      this.add(new THREE.Mesh(bodyGeo, bodyMat));

      // Arms
      const armLen = 2;
      const armRot = Math.PI / 4;
      const foreArmRotInit = Math.PI / 4;
      
      // Geometry / Mesh objects for symmetric arm components.
      const armGeo = new THREE.BoxBufferGeometry(armLen, 0.1, 0.1);
      const armMat = new THREE.MeshPhongMaterial();
      const armProto = new THREE.Mesh(armGeo, armMat); // for both left and rightarms
      const leftArmMesh = armProto.clone();
      const rightArmMesh = armProto.clone();
      const leftForearmMesh = armProto.clone();
      const rightForearmMesh = armProto.clone();

      // Forearms are centered in respect to the end point of the base arms
      // Left arm
      leftArmMesh.x = -2;
      this.rotArmHingeL(leftArmMesh, armRot);
      this.rotArmHingeL(rightForearmMesh, foreArmRotInit);
      leftForearmMesh.x = 1 -armLeng * Math.cos(armRot) + armLen / 2;
      leftForearmMesh.y = armLeng * Math.sin(armRot);

      // Right arm
      rightArmMesh.x = 2;
      this.rotArmHingeR(rightArmMesh, armRot);
      this.rotArmHingeR(leftforeArmMesh, foreArmRotInit);
      rightForearmMesh.x = 1 + armLeng * Math.cos(armRot) - armLen / 2;
      rightForearmMesh.y = armLeng * Math.sin(armRot);

      this.add(leftArmMesh, rightArmMesh, leftForearmMesh, rightForearmMesh);
   }

   updateAnimation(time) {
      // Definition of window for which key animation will be triggered
      const curTime = time % this.song.midPlayer.endTime;
      const nxtTime = (time + (1 / 24) * 1000) % this.song.midPlayer.endTime;
      if (!MIDI.channels[this.cnl].mute && this.song.started) {
         for (let nte of this.song.notesMap[cnl]) {
            // If curTime is greater than nxtTime, must be last note
            if (nte.end > curTime && (nte.end < nxtTime || curTime > nxtTime)) {
               switch (nte) {
                  case this.leftArmIdx:
                     // hit left hand
                     break;
                  case this.rightArmIdx:
                     // hit right hand
                     break;
                  default:
                     console.warn("Incorrent type of MIDI file for drum detected");
               }
            }
            // If note start and curTime are less than one frame, play first note
            if ((nte.start > curTime || (nte.start < (1000/24) &&
               curTime < (1000/24))) && nte.start < nxtTime) { 
               switch (nte) {
                  case this.leftArmIdx:
                     // move left hand back up
                     break;
                  case this.rightArmIdx:
                     // move right hand back up
                     break;
                  default:
                     console.warn("Incorrent type of MIDI file for drum detected");
               }
            }
         }
      }
   }
   rotArmHingeL(arm, rad) {
      arm.translateZ(-key.len / 2)
         .rotateX(rad / key.len)
         .translateZ(key.len / 2);
   }
   rotArmHingeR(arm, rad) {
      arm.translateZ(key.len / 2)
         .rotateX(rad / key.len)
         .translateZ(-key.len / 2);
   }
};