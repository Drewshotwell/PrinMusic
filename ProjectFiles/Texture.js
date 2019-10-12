/**
 * Polymorphic wrapper class for Instrument models
 * @author cameron wood <cameron.wood@principia.edu>
 */

const Texture = function(name, suffixes, maxHeight, repeat, pys) {
   var texture = {};
      
   const mapNames = ['baseColor.', 'normal.',
                     'height.', 'roughness.', 'ambientOcclusion.'];
   var mapFiles = [];
   for (let i = 0; i < suffixes.length; i++) {
      const suffix = suffixes[i];
      if (suffix)
         mapFiles.push(mapNames[i] + suffix);
   }

   var maps = {};

   const texUrlPath = location.pathname + "Resources/Textures/";

   mapFiles.forEach(mapFile => {
      var map = new THREE.TextureLoader().load(texUrlPath + name + mapFile);
      map.repeat = new THREE.Vector2(repeat[0], repeat[1]);
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      maps[mapFile.substring(0, mapFile.length - 4)] = map;    
   });
   if (maps['baseColor'])
      texture.map = maps['baseColor'];
   if (maps['normal'])
      texture.normalMap = maps['normal'];
   if (maps['height']) {
      texture.displacementMap = maps['height'];
      texture.displacementScale = maxHeight;
   }
   if (maps['roughness'])
      texture.roughnessMap = maps['roughness'];
   if (maps['ambientOcclusion'])
      texture.aoMap = maps['ambientOcclusion'];
   if (pys) {
      texture.reflectivity = 1.0;
      texture.metalness = 0.5;
      return new THREE.MeshPhysicalMaterial(texture);
   }
   else {
      return new THREE.MeshStandardMaterial(texture);
   }
}