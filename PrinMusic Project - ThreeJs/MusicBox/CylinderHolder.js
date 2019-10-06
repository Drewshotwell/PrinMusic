/**
 * Cylinder Holder component of MusicBox
 * @author drew shotwell <drew.shotwell@principia.edu>
 * @author cameron wood <cameron.wood@principia.edu>
 */

MusicBox.CylinderHolder = class CylinderHolder extends THREE.Group {
   constructor(size) {
      super();
      var tubePositions = [];
      const count = 40, width = 0.75;
      const xPos = size - width;
      
      const woodTex = Texture('Wood_004_',
       ['jpg', 'jpg', 'png', 'jpg', 'jpg'], 0, [2,1]);
      const goldTex = Texture('Gold_',
       ['jpg', null, null, 'jpg', 'jpg'], 0, [1,1], true);
      
      const holderEdge = (size/2)-1.5;
      // From cone to first curve
      tubePositions.push(new THREE.Vector3(-holderEdge, 1, 0),
                         new THREE.Vector3(0, 1, 0));
      // First curve
      for (let i = count-1; i > 0; i--)
         tubePositions.push(new THREE.Vector3(
          Math.cos(i * (Math.PI/2) / count),
          Math.sin(i * (Math.PI/2) / count), 0));
      // From first curve down to second
      for (let y = 0; y >= -size; y--)
         tubePositions.push(new THREE.Vector3(1, y, 0));
      // second curve
      for (let i = count-1; i > 0; i--)
         tubePositions.push(new THREE.Vector3(
          Math.cos((i*(Math.PI/2)/count) + (3*Math.PI/2)),
          Math.sin((i*(Math.PI/2)/count) + (3*Math.PI/2))-size, 0));
      // Second curve to middle
      for (let x = -holderEdge; x >= -xPos; x-= 0.25)
         tubePositions.push(new THREE.Vector3(x, -size-1, 0));
      // Middle pole going down
      for (let y = -size-1; y >= -size*2; y--)
         tubePositions.push(new THREE.Vector3(-xPos, y, 0));
      
      const curve = new THREE.CatmullRomCurve3(tubePositions);
      const tubeGmy = new THREE.TubeGeometry(
       curve, tubePositions.length, width, count);
      const coneGmy = new THREE.ConeGeometry(width, width, count);
      const cylGmy = new THREE.CylinderGeometry(0.3,0.3,3,30);
      const genericStand = new THREE.Mesh(tubeGmy, woodTex);
      const tubeCap = new THREE.Mesh(coneGmy, goldTex);
      const harpRod = new THREE.Mesh(cylGmy, goldTex);
      harpRod.rotation.x = Math.PI/2
      harpRod.position.z = 1.5;

      var leftStand = genericStand.clone();
      var leftCap = tubeCap.clone();
      var leftRod = harpRod.clone();
      var rightStand = genericStand.clone();
      var rightCap = tubeCap.clone();
      var rightRod = harpRod.clone();
      
      leftStand.scale.set(-1, 1, 1);
      leftStand.position.set(-xPos, -1, 0);
      leftCap.position.x = -(xPos-holderEdge-(width/2));
      leftCap.rotation.z = -Math.PI/2;
      leftRod.position.x = -(3*size/4);
      rightStand.position.set(xPos, -1, 0);
      rightCap.position.x = xPos-holderEdge-(width/2);
      rightCap.rotation.z = Math.PI/2;
      rightRod.position.x = 3*size/4;
      
      super.add(leftStand, leftCap, leftRod, rightStand, rightCap, rightRod);
   }

   // Stationary object, no transform-per-frame required
   updateAnimation(time) {}
};