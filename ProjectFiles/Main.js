/**
 * Main driver for graphical interface
 * @author drew shotwell <drew.shotwell@principia.edu>
 * @author cameron wood <cameron.wood@principia.edu>
 */

window.onload = main;

function main() {
   /* SCENE AND CAMERA */
   const scene = new THREE.Scene();
   const camera = new THREE.PerspectiveCamera(45,
    window.innerWidth / window.innerHeight, 0.1, 1000)
   camera.position.x = -2000;
   
   /* MESHES */
   // Plane Texture
   const grassTex = new THREE.TextureLoader().load(
    '../Textures/grass20.png');
   grassTex.repeat = new THREE.Vector2(100, 100);
   grassTex.wrapS = THREE.RepeatWrapping;
   grassTex.wrapT = THREE.RepeatWrapping;
   
   // Plane Mesh
   const geometry = new THREE.PlaneGeometry(1000, 1000);
   const material = new THREE.MeshPhongMaterial({map: grassTex});
   const plane = new THREE.Mesh(geometry, material);
   plane.receiveShadow = true;
   plane.position.set(0, -30, 0);
   plane.rotateX(-Math.PI / 2 + 0.02);
   plane.rotateY(-0.03); // Tilt toward chapel
   plane.rotateZ(-Math.PI/ 2);
   scene.add(plane);
   
   // Sky Sphere
   const sphereRad = 500;
   const skyGmy = new THREE.SphereBufferGeometry(sphereRad, 60, 40);
   skyGmy.computeBoundingSphere();
   const bndSphere = skyGmy.boundingSphere;
   const skyTex = new THREE.TextureLoader().load(
    '../Textures/chapel_green_pano.jpg');
   // Used to be 4096 x 1875
	const skyMat = new THREE.MeshBasicMaterial({map: skyTex});
            
	skySphere = new THREE.Mesh(skyGmy, skyMat);
   skySphere.material.side = THREE.BackSide;
   scene.add(skySphere);

   /* LIGHTS */
   // Ambient light
   const amblgt = new THREE.AmbientLight(0xD0D0D0, 0.8);
   scene.add(amblgt);
   
   // Main directional light
   const dirLgt = new THREE.DirectionalLight(0xffffff, 0.8, 20);
   dirLgt.position.set(-10, 75, -10);
   dirLgt.castShadow = true;
   dirLgt.shadow.camera.near = 0.1;
   dirLgt.shadow.camera.far = 200;
   dirLgt.shadow.mapSize.width = 4096;
   dirLgt.shadow.mapSize.height = 4096;
   const dirLgtHelper = new THREE.DirectionalLightHelper(dirLgt);
   const dirCameraHelper = new THREE.CameraHelper(dirLgt.shadow.camera);
   scene.add(dirLgt, dirLgtHelper, dirCameraHelper);

   const recalculateLighting = function (modLst, lgt) {
      const castShadow = function(obj) {
         obj.castShadow = true;
         obj.receiveShadow = true;
         //console.log(this);
         if (obj.children) {
            obj.children.forEach(child => castShadow(child));
         }
      }
      modLst.forEach(mod => castShadow(mod));

      // Set the light's target to the center of a grouping box of modLst
      const groupingBox = getBoundBoxOfList(modLst);
      groupingBox.getCenter(lgt.target.position); 

      // Resetting the shadow camera's dimensions 
      // relative to the grouping box
      ((width, height) => {
         dirLgt.shadow.camera.left = -width / 2;
         dirLgt.shadow.camera.right = width / 2;
         dirLgt.shadow.camera.top = height / 2;
         dirLgt.shadow.camera.bottom = - height / 2;
      })(Math.max(
          groupingBox.max.x + 10, groupingBox.max.y + 10, groupingBox.max.z + 10
         ),
         Math.max(
          groupingBox.max.x + 10, groupingBox.max.y + 10, groupingBox.max.z + 10
         ));
   }

   /* RENDERER */
   const renderer = new THREE.WebGLRenderer();
   renderer.setSize(window.innerWidth, window.innerHeight);
   renderer.autoClearColor = false;
   renderer.shadowMap.enabled = true;
   renderer.shadowMap.type = THREE.BasicShadowMap;
   document.body.appendChild(renderer.domElement);

   /* CONTROLS */
   const controls = new THREE.OrbitControls(camera, renderer.domElement);
   controls.maxPolarAngle = 3*Math.PI/4;
   controls.maxDistance = 1000;
   controls.minDistance = 0.1;
   controls.enabled = false;
   
   /* SONG */
   const song = new Song('Popcorn.mid', 120, [null, null, "drum_set"]);
   
   const modMap = {
      'cnl0': MusicBox,
   };

   /* USER INTERFACE */
   const gui = new GUI();
   GUI.toggleHide();
   const globalOptions = {
      frontView: function() {
         const bndBox = getBoundBoxOfList(instMods);
         const center = new THREE.Vector3();
         bndBox.getCenter(center);
         //set camera position to encapsulate all models based on gauge angle
         camera.position.set(-(Math.tan((90 - camera.filmGauge/2) *
          Math.PI/180) * ((bndBox.max.z - bndBox.min.z)/2)),
          center.y, center.z);
         controls.target = center;
         controls.update();
         camera.lookAt(center);
      },
      backView: function() {
         const bndBox = getBoundBoxOfList(instMods);
         const center = new THREE.Vector3();
         bndBox.getCenter(center);
         camera.position.set((Math.tan((90 - camera.filmGauge/2) *
          Math.PI/180) * ((bndBox.max.z - bndBox.min.z)/2)),
          center.y, center.z);
         controls.target = center;
         controls.update();
         camera.lookAt(center);
      },
      birdEye: function() {
         const bndBox = getBoundBoxOfList(instMods);
         const center = new THREE.Vector3();
         bndBox.getCenter(center);
         camera.position.set(center.x, (Math.tan((90 - camera.filmGauge/2) *
          Math.PI/180) * ((bndBox.max.z - bndBox.min.z)/2)), center.z);
         controls.target = center;
         controls.update();
         controls.rotateLeft(Math.PI/2);
      }
   };
   gui.add(globalOptions, 'frontView').name("Front View");
   gui.add(globalOptions, 'backView').name("Back View");
   gui.add(globalOptions, 'birdEye').name("Bird's Eye View");
   
   
   document.getElementById("startButton").addEventListener('click', () => {
      globalOptions.frontView();
      controls.enabled = true;
      document.getElementById("info").style.display = 'block';
   });
   var drawnFrames = 0;
   const fps = 24;
   const instMods = [];
   var preFrames = 0;
   var camPrvPos = camera.position;
   var hasRendered = false;

   animate();

   function animate(time) {
      requestAnimationFrame(animate);
      if (song.loaded && instMods.length === 0) { // Don't add till song loads
         Object.keys(song.notesMap).forEach(cnl => {
            // |newMod| is determined by the map, or defaults to |MusicBox|
            const newMod = modMap[cnl] ?
               new modMap[cnl](song, cnl.substring(3)) :
               new MusicBox(song, cnl.substring(3));
            
            // Set up of newly created model within scene
            placeMod(newMod, instMods, instMods.length !== 0 ?
               new THREE.Vector3(0, 0,
                instMods[instMods.length - 1].position.z + 1) :
               new THREE.Vector3(0, 0, 0));
            // Add to UI with instrument info
            var instFld;
            var instNum = 0;
            if (modMap[cnl]) {
               const topCnl = cnl;
               song.cnlList.forEach(cnl => {
                  if (modMap[cnl] == modMap[topCnl] || (modMap[topCnl] ==
                      MusicBox && !modMap[cnl]))
                     instNum++;
               });
               if (instNum > 1)
                  instFld = gui.addFolder(
                     `${modMap[cnl].title} ${song.cnlList.indexOf(cnl) + 1}`);
               else
                  instFld = gui.addFolder(modMap[cnl].title);
            }
            else {
               song.cnlList.forEach(cnl => {
                  if (!modMap[cnl] || modMap[cnl] == MusicBox)
                     instNum++;
               });
               if (instNum > 1)
                  instFld = gui.addFolder(
                     `Music Box ${song.cnlList.indexOf(cnl) + 1}`);
               else
                  instFld = gui.addFolder("Music Box");
            }
            
            instFld.add({
               Mute: function() {
                  song.toggle(cnl);
               }
            }, 'Mute');
              
            options = (modMap[cnl] || MusicBox).makeOptions(
             camera, controls, newMod);
            Object.keys(options).forEach(option => {
               instFld.add(options, option);
            });
         });
         // Resetting light
         recalculateLighting(instMods, dirLgt);
         scene.add(...instMods); 
      }
      if (time > drawnFrames) {
         drawnFrames += 1000/fps;
         if (!instMods || !song.started)
            preFrames += 1/fps;
      
         if (song.started) {
            song.update(drawnFrames - preFrames);
         }
         renderer.render(scene, camera);
         instMods.forEach(box => box.updateAnimation(drawnFrames - preFrames));
         bindCamera(camera, camPrvPos, instMods, plane, bndSphere);
         camPrvPos = camera.position.clone();
         scene.traverse(obj => obj.frustumCulled = false); //fix disappearing issue

         // Update light positions
         dirLgt.target.updateMatrixWorld();
         dirLgtHelper.update();
         dirLgt.shadow.camera.updateProjectionMatrix();
         dirCameraHelper.update();
         if (!hasRendered && song.loaded && time < drawnFrames + 1/fps) {
            document.getElementById("startButton").style.display = 'block';
            document.getElementById("loading").style.display = 'none';
            hasRendered = true;
         }
      }
      //requestAnimationFrame(animate);
   }
}
function placeMod(newMod, modLst, dirVec) {
   newMod.position.add(dirVec);
   newMod.boundingBox = (new THREE.Box3())
                         .setFromObject(newMod)
                         .expandByScalar(3);
   const moveByVec = new THREE.Vector3(0, 0, 0);
   for (let mod of modLst) {
      if (newMod.boundingBox.intersectsBox(mod.boundingBox)) {
         // Minimum of the absolute value of the two maxes and mins
         // accounts for different orientations
         const deltaX = Math.min(
            Math.abs(mod.boundingBox.max.x - newMod.boundingBox.min.x),
            Math.abs(newMod.boundingBox.max.x - mod.boundingBox.min.x),
         );
         const deltaY = Math.min(
            Math.abs(mod.boundingBox.max.y - newMod.boundingBox.min.y),
            Math.abs(newMod.boundingBox.max.y - mod.boundingBox.min.y),
         );
         const deltaZ = Math.min(
            Math.abs(mod.boundingBox.max.z - newMod.boundingBox.min.z),
            Math.abs(newMod.boundingBox.max.z - mod.boundingBox.min.z),
         );

         // Only the minimum delta component value is non-zero
         const delta = new THREE.Vector3(
            deltaX > deltaY ? 0 : deltaX > deltaZ ? 0 : deltaX,
            deltaY > deltaX ? 0 : deltaY > deltaZ ? 0 : deltaY,
            deltaZ > deltaX ? 0 : deltaZ > deltaY ? 0 : deltaZ,
         );

         moveByVec.add(delta);
      }
   }
   newMod.position.add(moveByVec);
   newMod.boundingBox.setFromObject(newMod).expandByScalar(3);
   modLst.push(newMod);
}
function getBoundBoxOfList(modLst) {
   const bbox = new THREE.Box3();
   modLst.forEach(mod => {
      bbox.expandByObject(mod);
   });
   return bbox;
}
function bindCamera(cam, prvPos, objs, gnd, bndSphere) {
   objs.forEach(obj => { 
      if (obj.geometry) {
         obj.geometry.computeBoundingSphere();
         obj.geometry.boundingSphere.applyMatrix4(obj.matrixWorld);
         obj.matrixWorldNeedsUpdate = true;
         if (obj.geometry.boundingSphere.containsPoint(cam.position)) {
            cam.position.copy(prvPos);
         }
      }
      if (obj.children)
         bindCamera(cam, prvPos, obj.children, gnd, bndSphere);
   });
   if (!bndSphere.containsPoint(cam.position) || cam.position.y < gnd.position.y)
      cam.position.copy(prvPos);
}