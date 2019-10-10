/**
 * Wrapper class for the MIDI.js API
 * @author cameron wood <cameron.wood@principia.edu>
 */

class Song {      
   constructor(fileName, bpm, instList) {
      var player;
      var noteTime = 0;
      const notesMap = {};
      const self = this;
      
      this.midPlayer;
      this.notesMap;
      this.cnlList = [];
      this.started = false;
      this.loaded = false;
      
      fileName = "../MidiFiles/" + fileName;
      
      MIDI.loadPlugin({
         onsuccess: function() {
            // This sets up the MIDI.Player and gets things going...
            player = MIDI.Player;
            player.timeWarp = 0.01; // Song speed (lower = faster)
            player.BPM = bpm;
            player.loadFile(fileName, logNotes, instList);
            self.midPlayer = player;
         },
         soundfontUrl: "../soundfont/FluidR3_GM/",
         instruments: instList,
      });
      document.getElementById("startButton").addEventListener('click', () => {
         if (self.loaded) {
            player.timeWarp = 1;
            player.loadFile(fileName, startPlayer, instList);
            self.midPlayer = player;
            document.getElementById("startButton").style.display = 'none';
         }
         GUI.toggleHide();
      });
      function startPlayer() {
         self.midPlayer.start();
         self.started = true;
      }
      function logNotes() {
         for (let obj of player.data) {
            var event = obj[0].event;
            noteTime += obj[1];
            switch (event.subtype) {
               case 'noteOn':
                  if (!notesMap[`cnl${event.channel}`])
                     notesMap[`cnl${event.channel}`] = [];
                  notesMap[`cnl${event.channel}`].push({
                     note: event.noteNumber - 20,
                     start: noteTime * 100,
                  });                  
                  break;
               case 'noteOff':
                  notesMap[`cnl${event.channel}`].forEach((note) => {
                     if (note.note === event.noteNumber - 20 && !note.end)
                        note.end = noteTime * 100;
                  });
                  break;
               default: break;
            }
         }
         self.loaded = true;
         self.notesMap = notesMap;
         Object.keys(notesMap).forEach(note => self.cnlList.push(note));
      }
   }
   update(drawnFrames) {
      const player = this.midPlayer;
      const frameTime = drawnFrames * 1000 % player.endTime;
      player.currentTime = frameTime;
      if (!player.playing) {
         player.resume();
      }
      // If song is at its end
      if (Math.round(frameTime*1000)/1000 < Math.round((1000/24)*1000)/1000 &&
          frameTime > 0.1) { //necessary for beginning to start on time
         player.currentTime = 0;
         player.resume();
      }
   }
   toggle(cnl) {
      this.midPlayer.pause(true);
      const cnlId = cnl.substring(3);
      MIDI.channels[cnlId].mute = !MIDI.channels[cnlId].mute;
      /*if (MIDI.channels[`${cnlId}`].mute)
         MIDI.channels[`${cnlId}`].mute = false;
      else
         MIDI.channels[`${cnlId}`].mute = true;*/
   }
   getRange(cnlId) {
      var max = 1, min = 88;
      
      this.notesMap[`cnl${cnlId}`].forEach(function(note) {
         var val = note.note;
         if (val > max)
            max = val;
         if (val < min)
            min = val;
      });
      return {max, min, keys: max-min+1};
   }

}
