/**
 * Harp component of MusicBox
 * @author drew shotwell <drew.shotwell@principia.edu>
 * @author cameron wood <cameron.wood@principia.edu>
 */

MusicBox.Harp = class Harp extends THREE.Group {
   constructor(song, cnl, size) {
      super();

      this.song = song;
      this.cnl = cnl;
      this.muteAnm = 0;

      // Keys have a fixed ratio to their respective spaces, but both are
      // scaled relative to the constextual size and number of keys.
      const spcRat = 4 / 1;
      const keyHeight = 0.1;
      const keyCount = song.getRange(cnl).keys;
      const keyWidth = (spcRat * size)
         / (keyCount * spcRat + keyCount + 1);
      const keySpace = (size)
         / (keyCount * spcRat + keyCount + 1);

      const nibHeight = 0.15;

      const keyTex = Texture('Gold_',
         ['jpg', null, null, 'jpg', 'jpg'], 0, [2, 2], true);
      const ancTex = Texture('Wood_004_',
         ['jpg', 'jpg', 'png', 'jpg', 'jpg'], 0, [2, 1]);
      
      this.keys = [];

      function pntKey(gmy) {
         const posBuf = gmy.attributes.position;

         for (let i = 0; i < posBuf.array.length / 3; i++) {
            if (posBuf.getZ(i).toFixed(5) ===
               (-gmy.parameters.depth / 2).toFixed(5))
               posBuf.setY(i, 0);
         }
      }
      
      /* Creation of keys with logistic function as lengths */
      for (let i = 0; i < keyCount; i++) {
         const keyPosX = (-size / 2) + i * (keySpace + keyWidth)
                      + keySpace + keyWidth / 2;
         // Key length function immediately invoked
         const keyLength = (function (x) {
            return 1 /
               (1 + 10 * Math.pow(Math.E, ((x + (size / 2)) - size))) + 1;
         })(keyPosX);
         const keyGeometry = new THREE.BoxBufferGeometry(
            keyWidth, keyHeight, keyLength, 1, 1, 10);
         pntKey(keyGeometry);
         const keyMesh = new THREE.Mesh(keyGeometry, keyTex.clone());
         keyMesh.position.set(
            keyPosX,
            0,
            size + nibHeight + keyLength / 2,
         );
         keyMesh.len = keyLength;
         keyMesh.keyOn = false;
         keyMesh.vibKey1 = null;[]
         keyMesh.vibKey2 = null;
         this.keys.push(keyMesh);
      }
      this.add(...this.keys);

      /* Fragment-wise creation of moving wood anchor attaching to keys */
      const leftancPoint = -size * (3 / 4), rightancPoint = size * (3 / 4);
      const ancVecs = [], crcCount = 10, crvRadius = 1;
      // First fragment: straight bar along +z
      for (let z = 0; 
           z < size + nibHeight + this.keys[0].len - crvRadius;
           z += 1 / size) {
         ancVecs.push(new THREE.Vector3(
            leftancPoint, 0, z
         ));
      }
      // Second fragment: curve from +z to +x direction
      for (let i = 0; i < crcCount; i++) {
         ancVecs.push(new THREE.Vector3(
            leftancPoint + crvRadius
               + crvRadius 
               * Math.cos(- i * (Math.PI / 2) / crcCount + Math.PI),
            0,
            size + nibHeight + this.keys[0].len - crvRadius
               + crvRadius 
               * Math.sin(- i * (Math.PI / 2) / crcCount + Math.PI),
         ));
      }
      // Third fragment: straight bar along +x
      for (let x = leftancPoint + crvRadius; x < -size / 2; x += 1 / size) {
         ancVecs.push(new THREE.Vector3(
            x,
            0,
            size + nibHeight + this.keys[0].len,
         ));
      }
      // Fourth fragment: anc contact for each key
      for (let key of this.keys) {
         ancVecs.push(new THREE.Vector3(
            key.position.x,
            0,
            key.position.z + key.len / 2
         ));
      }
      // Fifth fragment: straight bar along +x
      for (let x = size / 2; x < rightancPoint - crvRadius; x += 1 / size) {
         ancVecs.push(new THREE.Vector3(
            x,
            0,
            size + nibHeight + this.keys[this.keys.length - 1].len,
         ));
      }
      // Sixth fragment: curve from +z to +x direction
      for (let i = 0; i < crcCount; i++) {
         ancVecs.push(new THREE.Vector3(
            rightancPoint - crvRadius
               + crvRadius 
               * Math.cos(-i * (Math.PI / 2) / crcCount + 1 * Math.PI / 2),
            0,
            size + nibHeight + this.keys[this.keys.length - 1].len - crvRadius
               + crvRadius 
               * Math.sin(-i * (Math.PI / 2) / crcCount + 1 * Math.PI / 2),
         ));
      }
      // Seventh fragment: straight bar along -z
      for (let z = size + nibHeight 
               + this.keys[this.keys.length - 1].len - crvRadius;
           z >= 0;
           z -= 1 / size) {
         ancVecs.push(new THREE.Vector3(
            rightancPoint, 0, z,
         ));
      }

      const ancCrv = new THREE.CatmullRomCurve3(ancVecs);
      const ancGmy = new THREE.TubeGeometry(ancCrv, ancVecs.length,
         0.2, 20);
      const ancMesh = new THREE.Mesh(ancGmy, ancTex);
      this.add(ancMesh);
   }

   updateAnimation(time) {
      // Definition of window for which key animation will be triggered
      const curTime = time % this.song.midPlayer.endTime;
      const nxtTime = (time + (1 / 24) * 1000) % this.song.midPlayer.endTime;
      const anmTime = 10.0;
      if (!MIDI.channels[this.cnl].mute && this.song.started) {
         // Setting of key logic
         for (let nte of this.song.notesMap[`cnl${this.cnl}`]) {
            const nteKey = this.keys[nte.note -
             this.song.getRange(this.cnl).min];
            // If curTime is greater than nxtTime, must be last note
            if (nte.end > curTime && (nte.end < nxtTime || curTime > nxtTime)) {
               this.keyOff(nteKey);
            }
            // If note start and curTime are less than one frame, play first note
            if ((nte.start > curTime || (nte.start < (1000/24) &&
                 curTime < (1000/24))) && nte.start < nxtTime) { 
               this.keyOn(nteKey);
            }
         }
         // Unmute animation
         if (this.muteAnm < 0) {
            this.muteAnm += 1 / anmTime;
            this.position.setX(this.muteAnm);
         }
      }
      else {
         // Mute animation
         for (let key of this.keys) this.keyOff(key);
         if (this.muteAnm >= -1) {
            this.muteAnm -= 1 / anmTime;
            this.position.setX(this.muteAnm);
         }
      }
   }
   keyOn(key) {
      if (!key.keyOn) {
         // Duplicate the key twice for vibrating effect.
         const cloneKey = function (key) {
            const keyCln = new THREE.Mesh(key.geometry, key.material.clone());
            keyCln.len = key.len;
            keyCln.position.set(key.position.x, key.position.y, key.position.z);
            return keyCln;
         }
         const vibKey1 = cloneKey(key);
         const vibKey2 = cloneKey(key);
         key.vibKey1 = vibKey1;
         key.vibKey2 = vibKey2;
         
         // Set transparency
         key.vibKey1.material.transparent = true;
         key.vibKey2.material.transparent = true;
         key.vibKey1.material.opacity = 0.5;
         key.vibKey2.material.opacity = 0.5;
         this.add(vibKey1);
         this.add(vibKey2);

         // Transform the key to vibrating position
         this.rotKeyHinge(key.vibKey1, -Math.PI / 40);
         this.rotKeyHinge(key.vibKey2, Math.PI / 40);
         key.keyOn = true;
      }
   }
   keyOff(key) {
      if (key.keyOn) {
         // Remove the duplicate effect key.
         this.remove(key.vibKey1);
         this.remove(key.vibKey2);
         key.vibKey1 = null;
         key.vibKey2 = null;

         // Move the keys back to standard position.
         key.keyOn = false;
      }
   }
   rotKeyHinge(key, rad) {
      key.translateZ(key.len / 2)
         .rotateX(rad / key.len)
         .translateZ(-key.len / 2);
   }
};