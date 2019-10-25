/**
 * Cylinder Player component of MusicBox
 * @author drew shotwell <drew.shotwell@principia.edu>
 * @author cameron wood <cameron.wood@principia.edu>
 */

MusicBox.CylinderPlayer = class CylinderPlayer extends THREE.Group {
   constructor(song, cnl, size) {
      super();
      var points = [];
      const thickness = 1/4;
      const cSize = size/2;
      const edges = size * 20;
      const wheelTex = Texture('Wood_005_',
       ['jpg', 'jpg', 'png', 'jpg', 'jpg'], 0, [1,5]);

      points.push(
         new THREE.Vector2(size, -cSize),
         new THREE.Vector2(size, cSize),
         new THREE.Vector2(size, cSize),
         new THREE.Vector2(size-thickness, cSize),
         new THREE.Vector2(size-thickness, cSize),
         new THREE.Vector2(size-thickness, -cSize),
         new THREE.Vector2(size-thickness, -cSize),
         new THREE.Vector2(size, -cSize),
      );

      const cylGmy1 = new THREE.LatheBufferGeometry(points, edges);
      const cylGmy2 = new THREE.CylinderGeometry(size-thickness, 
       size-thickness, thickness, edges);
      const cylGmy3 = new THREE.CylinderGeometry(thickness * 2, 
       thickness * 2, cSize * 2, edges);

      this.add(new THREE.Mesh(cylGmy1, wheelTex), 
       new THREE.Mesh(cylGmy2, wheelTex),
       new THREE.Mesh(cylGmy3, wheelTex));

      this.song = song;
      this.size = size;
      this.cnl = cnl;
      this.nibRat = 4;
      this.rotation.x = Math.PI/2;

      const nibTex = Texture('Gold_',
       ['jpg', null, null, 'jpg', 'jpg'], 0, [1,1], 0.2, true);
      const makeNib = (note, width, spc) => {
         const rng = this.song.getRange(this.cnl);
         const len = note.end - note.start;
         const ridges = Math.trunc(len/20);
         //make box with multiple x vertices for ridge creation
         const nibGmy = new THREE.BoxBufferGeometry(len/1000,
          width, 0.1, ridges);
         this.curveNib(nibGmy);
         const mesh = new THREE.Mesh(nibGmy, nibTex);
         //takes into account which note, and spacing in between to get position
         mesh.rotation.y = ((2*Math.PI)* (1 - ((note.start+(len/2)) /
          (this.song.midPlayer.endTime*100)))) + 3*Math.PI/2;
         //endTime is * 100 because of 100x speed when created

         mesh.position.y = (width+spc)*
          (note.note - rng.max) - spc -(width/2) + this.size/2;

         return mesh;
      }
      this.song.notesMap[Object.keys(this.song.notesMap)[this.cnl]].forEach
       (note => {
         const kys = this.song.getRange(this.cnl).keys;
         this.add(makeNib(note, this.size*this.nibRat /
          ((kys*this.nibRat) + kys + 1),
          this.size/((kys*this.nibRat) + kys + 1)));
      });      
   }
   updateAnimation(time) {
      this.rotation.y = ((2*Math.PI)/this.song.midPlayer.endTime) * time;
   }
   curveNib(gmy) {
      const fromAngle = (Math.PI*3/2) - ((gmy.parameters.width/this.size)/2);
      const toAngle = (Math.PI*3/2) + ((gmy.parameters.width/this.size)/2);
      const backCrv = new THREE.EllipseCurve(0, 0, this.size, this.size,
       fromAngle, toAngle);
      const frontCrv = new THREE.EllipseCurve(0, 0, this.size +
       gmy.parameters.depth/2, this.size + gmy.parameters.depth/2,
       fromAngle, toAngle);
      const ridgeCrv = new THREE.EllipseCurve(0, 0, this.size +
       5*gmy.parameters.depth/6, this.size + 5*gmy.parameters.depth/6,
       fromAngle, toAngle);

      const posBuf = gmy.attributes.position;
      var segments = gmy.parameters.widthSegments;
      if (segments < 2) //box can't have less than 2 segments
         segments = 2;
      const backCrvPnts = backCrv.getPoints(segments);
      const frontCrvPnts = frontCrv.getPoints(segments);
      const ridgeCrvPnts = ridgeCrv.getPoints(segments);
      var xVals = [], ridges = [];
      //get all unique x coordinates
      for (var i = 0; i < posBuf.array.length/3; i++)
         if (!xVals.includes(posBuf.getX(i).toFixed(5)) && 
             posBuf.getX(i).toFixed(5) !== "-0.00000") //0 != -0 as strings
            xVals.push(posBuf.getX(i).toFixed(5));
      //get every other unique x coordinate
      xVals = xVals.sort((a, b) => a-b);
      for (i = 0; i < xVals.length; i+=2)
         ridges.push(xVals[i]);
      for (i = 0; i < posBuf.array.length/3; i++) {
         //push up all vertices along each x line to outer curve  
         for (var j = 0; j < ridges.length; j++)
            if (posBuf.getX(i).toFixed(5) === ridges[j] &&
                posBuf.getZ(i).toFixed(5) ===
               (gmy.parameters.depth/2).toFixed(5)) {
               posBuf.setX(i, ridgeCrvPnts[j*2].x);
               posBuf.setZ(i, (-ridgeCrvPnts[j*2].y));
            }
         for (j = 0; j < xVals.length; j++)
            //console.log(posBuf.getX(i).toFixed(5), xVals[j]);
            if (posBuf.getX(i).toFixed(5) === xVals[j] ||
               (posBuf.getX(i).toFixed(5) === "-0.00000" && //0 != -0 as strings
                xVals[j] === "0.00000")) {
               //move all bottom vertices that are not ridges to middle curve
               if (posBuf.getZ(i).toFixed(5) ===
                  (gmy.parameters.depth/2).toFixed(5)) {
                  posBuf.setX(i, frontCrvPnts[j].x);
                  posBuf.setZ(i, (-frontCrvPnts[j].y));
               }
               //push all top vertices to inner most curve
               if (posBuf.getZ(i).toFixed(5) ===
                  (-gmy.parameters.depth/2).toFixed(5)) {
                  posBuf.setX(i, backCrvPnts[j].x);
                  posBuf.setZ(i, (-backCrvPnts[j].y));
               }
            }
      }
   }
};