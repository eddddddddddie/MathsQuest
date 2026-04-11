/* ============================================
   SCAVENGER HUNT - 8-BIT RETRO ENGINE v2
   ============================================ */

// ============================================
// UTILITIES
// ============================================
function hexToRgb(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return{r,g,b}}
function rgbToHex(r,g,b){return'#'+[r,g,b].map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('')}
function lighten(hex,pct){const{r,g,b}=hexToRgb(hex);const f=pct/100;return rgbToHex(r+(255-r)*f,g+(255-g)*f,b+(255-b)*f)}
function darken(hex,pct){const{r,g,b}=hexToRgb(hex);const f=1-pct/100;return rgbToHex(r*f,g*f,b*f)}
function formatTime(s){return Math.floor(s/60).toString().padStart(2,'0')+':'+((s%60).toString().padStart(2,'0'))}

// ============================================
// CHIPTUNE SOUND ENGINE
// ============================================
class SoundEngine {
  constructor(){this.ctx=null;this.enabled=true}
  init(){try{this.ctx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){this.enabled=false}}
  play(freq,type,dur,vol=0.12){if(!this.enabled||!this.ctx)return;try{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime);g.gain.setValueAtTime(vol,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+dur);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+dur)}catch(e){}}
  playFind(){this.play(523,'square',0.08,0.1);setTimeout(()=>this.play(659,'square',0.08,0.1),80);setTimeout(()=>this.play(784,'square',0.15,0.1),160)}
  playJump(){this.play(300,'square',0.06,0.08);setTimeout(()=>this.play(500,'square',0.06,0.07),40)}
  playCoin(){this.play(900,'square',0.04,0.08);setTimeout(()=>this.play(1200,'square',0.06,0.07),40)}
  playStomp(){this.play(200,'square',0.06,0.1);setTimeout(()=>this.play(300,'square',0.08,0.08),50)}
  playChallenge(){this.play(330,'square',0.15,0.08)}
  playSuccess(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.play(f,'square',0.2,0.1),i*100))}
  playClick(){this.play(600,'square',0.03,0.06)}
  playError(){this.play(150,'square',0.15,0.1);setTimeout(()=>this.play(120,'square',0.2,0.1),100)}
  playHurt(){this.play(200,'sawtooth',0.1,0.1);setTimeout(()=>this.play(100,'sawtooth',0.15,0.1),60)}
  playDeath(){this.play(400,'square',0.1,0.1);setTimeout(()=>this.play(300,'square',0.1,0.1),120);setTimeout(()=>this.play(200,'square',0.15,0.1),240);setTimeout(()=>this.play(100,'square',0.3,0.1),360)}
  playDoor(){[260,330,390,520].forEach((f,i)=>setTimeout(()=>this.play(f,'square',0.25,0.1),i*150))}
  playGameOver(){[440,415,392,370,349,330,311,294].forEach((f,i)=>setTimeout(()=>this.play(f,'square',0.3,0.1),i*200))}
  playVictory(){[523,523,659,784,659,784,1047].forEach((f,i)=>setTimeout(()=>this.play(f,'square',0.25,0.12),i*130))}
  playPowerup(){[523,659,784,1047,784,1047,1319].forEach((f,i)=>setTimeout(()=>this.play(f,'square',0.12,0.1),i*60))}
}
const sound=new SoundEngine();

// ============================================
// 8-BIT MUSIC ENGINE WITH PERCUSSION
// ============================================
class MusicEngine {
  constructor(){this.playing=false;this.currentTrack=null;this.timers=[];this.nodes=[];this.noiseBuffer=null}
  stop(){this.playing=false;this.currentTrack=null;this.timers.forEach(t=>clearTimeout(t));this.timers=[];this.nodes.forEach(n=>{try{n.stop()}catch(e){}});this.nodes=[]}
  _ensureNoise(){
    if(this.noiseBuffer||!sound.ctx)return;
    const buf=sound.ctx.createBuffer(1,4096,sound.ctx.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<4096;i++)d[i]=Math.random()*2-1;
    this.noiseBuffer=buf;
  }
  _playNoise(startTime,dur,vol){
    if(!this.noiseBuffer||!sound.ctx)return;
    try{const s=sound.ctx.createBufferSource();s.buffer=this.noiseBuffer;const g=sound.ctx.createGain();g.gain.setValueAtTime(vol,startTime);g.gain.exponentialRampToValueAtTime(0.001,startTime+dur);s.connect(g).connect(sound.ctx.destination);s.start(startTime);s.stop(startTime+dur);this.nodes.push(s)}catch(e){}
  }
  playTrack(name){
    if(this.currentTrack===name)return;this.stop();this.currentTrack=name;this.playing=true;this._ensureNoise();
    const NF={C2:65,D2:73,E2:82,F2:87,G2:98,A2:110,Bb2:117,B2:123,Ab2:104,C3:131,D3:147,E3:165,F3:175,G3:196,A3:220,Bb3:233,B3:247,Ab3:208,Eb3:156,C4:262,D4:294,E4:330,F4:349,G4:392,A4:440,Bb4:466,B4:494,Ab4:415,Eb4:311,C5:523,D5:587,E5:659,F5:698,G5:784,A5:880,A1:55,B1:62};
    const tracks={
      character:{bpm:180,voices:[
        {type:'square',vol:0.06,notes:['E4','E4','R','E4','R','C4','E4','R','G4','R','R','R','G3','R','R','R','C4','R','R','G3','R','R','E3','R','R','A3','R','B3','R','Bb3','A3','R','G3','E4','G4','A4','R','F4','G4','R','E4','R','C4','D4','B3','R','R','R']},
        {type:'triangle',vol:0.05,notes:['C3','R','G3','R','C3','R','G3','R','C3','R','G3','R','C3','R','G3','R','C3','R','G3','R','C3','R','G3','R','A2','R','E3','R','B2','R','G3','R','C3','R','G3','R','C3','R','G3','R','C3','R','G3','R','G2','R','G3','R']},
      ],perc:['H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R']},
      'enchanted-forest':{bpm:155,voices:[
        {type:'square',vol:0.05,notes:['E4','G4','A4','G4','E4','D4','C4','D4','E4','R','G4','R','A4','R','R','R','C5','B4','A4','G4','A4','G4','E4','R','D4','E4','G4','E4','D4','C4','R','R','A3','C4','E4','G4','A4','G4','E4','C4','D4','R','E4','R','C4','R','R','R','E4','D4','C4','D4','E4','G4','A4','R','G4','E4','D4','C4','D4','R','R','R']},
        {type:'triangle',vol:0.04,notes:['A2','R','E3','R','A2','R','E3','R','C3','R','G3','R','C3','R','G3','R','A2','R','E3','R','A2','R','E3','R','D3','R','A3','R','E3','R','B3','R','A2','R','E3','R','A2','R','E3','R','C3','R','G3','R','C3','R','G3','R','A2','R','E3','R','C3','R','G3','R','D3','R','A3','R','G3','R','R','R']},
      ],perc:['H','R','R','R','S','R','H','R','H','R','R','R','S','R','R','R','H','R','R','R','S','R','H','R','H','R','R','R','S','R','R','R','H','R','R','R','S','R','H','R','H','R','R','R','S','R','R','R','H','R','R','R','S','R','H','R','H','R','R','R','S','R','R','R']},
      'underwater-ruins':{bpm:140,voices:[
        {type:'triangle',vol:0.06,notes:['E3','R','G3','R','B3','R','R','R','A3','R','G3','R','E3','R','R','R','D3','R','F3','R','A3','R','R','R','G3','R','F3','R','D3','R','R','R','C3','R','E3','R','G3','R','R','R','A3','R','B3','R','C4','R','R','R','B3','R','A3','R','G3','R','E3','R','D3','R','R','R','R','R','R','R']},
        {type:'sine',vol:0.04,notes:['E2','R','R','R','E2','R','R','R','D2','R','R','R','D2','R','R','R','C2','R','R','R','C2','R','R','R','A1','R','R','R','B1','R','R','R','E2','R','R','R','E2','R','R','R','D2','R','R','R','D2','R','R','R','C2','R','R','R','C2','R','R','R','B1','R','R','R','R','R','R','R']},
      ],perc:['R','R','H','R','R','R','S','R','R','R','H','R','R','R','R','R','R','R','H','R','R','R','S','R','R','R','H','R','R','R','R','R','R','R','H','R','R','R','S','R','R','R','H','R','R','R','R','R','R','R','H','R','R','R','S','R','R','R','H','R','R','R','R','R']},
      'haunted-mansion':{bpm:150,voices:[
        {type:'square',vol:0.04,notes:['E4','R','Eb4','R','E4','R','Eb4','R','E4','B3','D4','C4','A3','R','R','R','C3','E3','A3','R','R','R','B3','R','E3','Ab3','B3','R','R','R','R','R','E4','R','Eb4','R','E4','R','Eb4','R','E4','B3','D4','C4','A3','R','R','R','C3','E3','A3','R','R','R','B3','R','C4','R','A3','R','R','R','R','R']},
        {type:'triangle',vol:0.04,notes:['A2','R','R','R','A2','R','R','R','A2','R','R','R','A2','R','R','R','A2','R','R','R','E2','R','R','R','Ab2','R','R','R','E2','R','R','R','A2','R','R','R','A2','R','R','R','A2','R','R','R','A2','R','R','R','A2','R','R','R','E2','R','R','R','A2','R','R','R','R','R','R','R']},
      ],perc:['H','R','R','R','S','R','R','R','H','R','R','R','S','R','R','R','H','R','R','R','S','R','R','R','H','R','H','R','S','R','R','R','H','R','R','R','S','R','R','R','H','R','R','R','S','R','R','R','H','R','R','R','S','R','R','R','H','R','H','R','S','R','R','R']},
      'desert-temple':{bpm:170,voices:[
        {type:'square',vol:0.05,notes:['E4','R','F4','E4','D4','R','C4','R','D4','R','E4','R','R','R','R','R','A4','R','G4','R','E4','R','D4','R','E4','R','R','R','R','R','R','R','E4','R','F4','E4','D4','R','C4','D4','E4','R','G4','R','A4','R','R','R','G4','R','E4','R','D4','R','C4','R','D4','R','R','R','R','R','R','R']},
        {type:'sawtooth',vol:0.03,notes:['A2','R','A2','R','A3','R','A2','R','A2','R','A2','R','A3','R','A2','R','D3','R','D3','R','D4','R','D3','R','D3','R','D3','R','D4','R','D3','R','A2','R','A2','R','A3','R','A2','R','C3','R','C3','R','C4','R','C3','R','G2','R','G2','R','G3','R','G2','R','A2','R','R','R','R','R','R','R']},
      ],perc:['H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R']},
      'space-world':{bpm:130,voices:[
        {type:'triangle',vol:0.05,notes:['C4','R','R','E4','R','R','G4','R','R','C5','R','R','G4','R','R','R','B3','R','R','D4','R','R','G4','R','R','B4','R','R','G4','R','R','R','A3','R','R','C4','R','R','F4','R','R','A4','R','R','F4','R','R','R','G3','R','R','B3','R','R','E4','R','R','G4','R','R','E4','R','R','R']},
        {type:'sine',vol:0.04,notes:['C2','R','R','R','C2','R','R','R','C3','R','R','R','C2','R','R','R','G2','R','R','R','G2','R','R','R','G3','R','R','R','G2','R','R','R','F2','R','R','R','F2','R','R','R','F3','R','R','R','F2','R','R','R','E2','R','R','R','E2','R','R','R','E3','R','R','R','E2','R','R','R']},
      ],perc:['R','R','H','R','R','R','S','R','R','R','H','R','R','R','R','R','R','R','H','R','R','R','S','R','R','R','H','R','R','R','R','R','R','R','H','R','R','R','S','R','R','R','H','R','R','R','R','R','R','R','H','R','R','R','S','R','R','R','H','R','R','R','R','R']},
      'farm-world':{bpm:165,voices:[
        {type:'square',vol:0.05,notes:['G4','R','G4','R','A4','R','B4','R','G4','R','R','R','E4','R','R','R','G4','R','G4','R','A4','R','B4','R','C5','R','R','R','R','R','R','R','D5','R','C5','R','B4','R','A4','R','G4','R','R','R','E4','R','R','R','D4','R','E4','R','G4','R','E4','R','D4','R','R','R','R','R','R','R']},
        {type:'triangle',vol:0.04,notes:['G2','R','D3','R','G2','R','D3','R','C3','R','G3','R','C3','R','G3','R','G2','R','D3','R','G2','R','D3','R','C3','R','G3','R','C3','R','G3','R','G2','R','D3','R','G2','R','D3','R','C3','R','G3','R','C3','R','G3','R','D3','R','A3','R','D3','R','A3','R','G2','R','D3','R','R','R','R','R']},
      ],perc:['H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R','H','R','H','R','S','R','H','R']},
      'mario-world':{bpm:180,voices:[
        {type:'square',vol:0.06,notes:['E4','E4','R','E4','R','C4','E4','R','G4','R','R','R','G3','R','R','R','C4','R','R','G3','R','R','E3','R','R','A3','R','B3','R','Bb3','A3','R','G3','E4','G4','A4','R','F4','G4','R','E4','R','C4','D4','B3','R','R','R','C4','R','R','G3','R','R','E3','R','R','A3','R','B3','R','Bb3','A3','R']},
        {type:'triangle',vol:0.05,notes:['C3','R','G3','R','C3','R','G3','R','E3','R','B3','R','E3','R','B3','R','A2','R','E3','R','A2','R','E3','R','Ab2','R','Eb3','R','Ab2','R','Eb3','R','C3','R','G3','R','C3','R','G3','R','C3','R','G3','R','C3','R','G3','R','A2','R','E3','R','A2','R','E3','R','Ab2','R','Eb3','R','Ab2','R','Eb3','R']},
      ],perc:['H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R']},
      'trump-world':{bpm:160,voices:[
        {type:'square',vol:0.05,notes:['C4','C4','C4','R','C4','R','R','R','G3','R','R','R','C4','R','R','R','E4','R','E4','R','D4','R','C4','R','D4','R','R','R','R','R','R','R','F4','F4','F4','R','F4','R','E4','R','E4','R','R','R','D4','R','R','R','C4','R','D4','R','E4','R','C4','R','G3','R','R','R','R','R','R','R']},
        {type:'sawtooth',vol:0.03,notes:['C3','R','G3','R','C3','R','G3','R','E3','R','B3','R','E3','R','B3','R','F3','R','C4','R','F3','R','C4','R','G3','R','D4','R','G3','R','D4','R','C3','R','G3','R','C3','R','G3','R','F3','R','C4','R','F3','R','C4','R','G3','R','D4','R','G3','R','D4','R','C3','R','G3','R','R','R','R','R']},
      ],perc:['H','R','R','R','S','R','R','R','H','R','H','R','S','R','R','R','H','R','R','R','S','R','R','R','H','R','H','R','S','R','H','R','H','R','R','R','S','R','R','R','H','R','H','R','S','R','R','R','H','R','R','R','S','R','R','R','H','R','H','R','S','R','H','R']},
      victory:{bpm:190,voices:[
        {type:'square',vol:0.06,notes:['C5','C5','R','C5','R','R','G4','R','C5','R','E5','R','G5','R','R','R','E5','R','R','R','C5','R','R','R','G4','R','R','R','R','R','R','R','C5','C5','R','C5','R','R','G4','R','C5','R','E5','R','G5','R','R','R','G5','R','F5','R','E5','R','D5','R','C5','R','R','R','R','R','R','R']},
        {type:'triangle',vol:0.05,notes:['C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','E3','B3','E3','B3','E3','B3','E3','B3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','C3','G3','F3','C4','F3','C4','G3','D4','G3','D4','C3','G3','C3','G3','C3','G3','C3','G3']},
      ],perc:['H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R','H','H','R','H','S','R','H','R']},
    };
    const track=tracks[name];if(!track||!sound.ctx||!sound.enabled)return;
    const beatMs=60000/track.bpm;
    const scheduleLoop=()=>{
      if(!this.playing||this.currentTrack!==name)return;
      const ctx=sound.ctx,now=ctx.currentTime;
      track.voices.forEach(voice=>{voice.notes.forEach((note,i)=>{if(note==='R')return;const freq=NF[note];if(!freq)return;const st=now+i*(beatMs/1000),dur=beatMs/1000*0.8;try{const o=ctx.createOscillator(),g=ctx.createGain();o.type=voice.type;o.frequency.setValueAtTime(freq,st);g.gain.setValueAtTime(voice.vol,st);g.gain.exponentialRampToValueAtTime(0.001,st+dur);o.connect(g).connect(ctx.destination);o.start(st);o.stop(st+dur);this.nodes.push(o)}catch(e){}})});
      // Percussion channel
      if(track.perc){track.perc.forEach((hit,i)=>{if(hit==='R')return;const st=now+i*(beatMs/1000);if(hit==='H')this._playNoise(st,0.03,0.04);else if(hit==='S')this._playNoise(st,0.08,0.06)})}
      const loopMs=track.voices[0].notes.length*beatMs;
      if(true){const t=setTimeout(()=>{this.nodes=[];scheduleLoop()},loopMs);this.timers.push(t)}
    };scheduleLoop();
  }
}
const music=new MusicEngine();

// ============================================
// CHARACTER DESIGNER (8-bit pixel preview)
// ============================================
const SKIN_TONES={'#FDE7C8':{shadow:'#E8C9A4',blush:'#F0B0A0'},'#F5D0A9':{shadow:'#D4A87A',blush:'#E8A090'},'#E8B88A':{shadow:'#C89868',blush:'#D89878'},'#D4956B':{shadow:'#B07848',blush:'#C07858'},'#C07840':{shadow:'#985830',blush:'#A86838'},'#9A5B2F':{shadow:'#7A4020',blush:'#8A4828'},'#6B3E1F':{shadow:'#502A10',blush:'#603018'},'#3D2213':{shadow:'#2A150A',blush:'#35200F'}};
class CharacterDesigner {
  constructor(canvasId){this.canvas=document.getElementById(canvasId);this.ctx=this.canvas.getContext('2d');this.canvas.width=800;this.canvas.height=1040;this.options={faceShape:'oval',skinTone:'#FDE7C8',hairStyle:'short',hairColor:'#2C1810',eyeShape:'almond',eyeColor:'#634E34',noseStyle:'small',mouthStyle:'smile',eyebrowStyle:'natural',clothing:'tshirt',clothingColor:'#E74C3C',accessory:'none',freckles:false,blush:false,beautyMark:false,dimples:false}}
  setOption(k,v){this.options[k]=v;this.render()}
  toggleOption(k){this.options[k]=!this.options[k];this.render()}
  render(view){
    if(view===undefined)view=0;
    const ctx=this.ctx,o=this.options;ctx.save();ctx.scale(2,2);ctx.clearRect(0,0,400,520);
    // Animated background (scrolling color bars)
    const t=Date.now()*0.001;
    ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,400,520);
    for(let y=0;y<520;y+=20){const hue=(y*0.5+t*30)%360;ctx.fillStyle=`hsla(${hue},40%,15%,0.15)`;ctx.fillRect(0,y,400,10)}
    ctx.fillStyle='rgba(68,68,102,0.04)';for(let x=0;x<400;x+=8)ctx.fillRect(x,0,1,520);for(let y=0;y<520;y+=8)ctx.fillRect(0,y,400,1);
    // View label
    const viewNames=['FRONT','SIDE','BACK'];
    ctx.fillStyle='#555577';ctx.font='8px "Press Start 2P",monospace';ctx.textAlign='center';ctx.fillText(viewNames[view],200,20);ctx.textAlign='start';
    const P=10,cx=200,cy=260,ox=cx-5*P;
    const skin=o.skinTone,hair=o.hairColor,cloth=o.clothingColor,skinDk=darken(skin,12);
    ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(ox+P,cy+16*P-P,8*P,P*2);
    ctx.fillStyle='#2a2a4a';ctx.fillRect(ox+2*P,cy+11*P,2*P,4*P);ctx.fillRect(ox+6*P,cy+11*P,2*P,4*P);
    ctx.fillStyle='#1a1a2a';ctx.fillRect(ox+P,cy+15*P,3*P,P);ctx.fillRect(ox+6*P,cy+15*P,3*P,P);
    ctx.fillStyle=cloth;ctx.fillRect(ox+P,cy+6*P,8*P,6*P);ctx.fillStyle=darken(cloth,20);ctx.fillRect(ox+P,cy+10*P,8*P,2*P);ctx.fillStyle=lighten(cloth,15);ctx.fillRect(ox+2*P,cy+6*P,6*P,P);
    if(o.clothing==='hoodie'){ctx.fillStyle=darken(cloth,10);ctx.fillRect(ox+3*P,cy+6*P,4*P,P)}
    if(o.clothing==='jacket'){ctx.fillStyle='#888';ctx.fillRect(ox+5*P-1,cy+6*P,2,6*P)}
    ctx.fillStyle=skin;ctx.fillRect(ox-P,cy+7*P,2*P,3*P);ctx.fillRect(ox+9*P,cy+7*P,2*P,3*P);
    ctx.fillStyle=skin;ctx.fillRect(ox+3*P,cy+4*P,4*P,2*P);
    ctx.fillStyle=skin;ctx.fillRect(ox+P,cy-3*P,8*P,7*P);ctx.fillStyle=skinDk;ctx.fillRect(ox+P,cy+3*P,8*P,P);
    ctx.fillStyle=skin;ctx.fillRect(ox,cy-P,P,3*P);ctx.fillRect(ox+9*P,cy-P,P,3*P);
    if(view===0){
      // FRONT VIEW - full face
      const hs=o.eyeShape;let eh=2;if(hs==='hooded')eh=1;
      ctx.fillStyle='#fff';ctx.fillRect(ox+2*P,cy-P,2*P,eh*P);ctx.fillRect(ox+6*P,cy-P,2*P,eh*P);
      ctx.fillStyle=o.eyeColor;ctx.fillRect(ox+3*P,cy-P,P,eh*P);ctx.fillRect(ox+7*P,cy-P,P,eh*P);
      ctx.fillStyle='#111';ctx.fillRect(ox+3*P,cy,P,P);ctx.fillRect(ox+7*P,cy,P,P);
      ctx.fillStyle='rgba(255,255,255,0.7)';ctx.fillRect(ox+3*P,cy-P,P/2,P/2);ctx.fillRect(ox+7*P,cy-P,P/2,P/2);
      ctx.fillStyle=darken(hair,10);const bs=o.eyebrowStyle;
      if(bs==='thick'){ctx.fillRect(ox+2*P,cy-2*P,3*P,P);ctx.fillRect(ox+6*P,cy-2*P,3*P,P)}
      else{ctx.fillRect(ox+2*P,cy-2*P,2*P,P*0.6);ctx.fillRect(ox+6*P,cy-2*P,2*P,P*0.6)}
      ctx.fillStyle=darken(skin,15);if(o.noseStyle==='small')ctx.fillRect(ox+4*P+P/2,cy+P,P,P);else ctx.fillRect(ox+4*P,cy+P,2*P,P);
      ctx.fillStyle=darken(skin,25);if(o.mouthStyle==='smile'){ctx.fillRect(ox+3*P,cy+2*P,4*P,P/2)}else if(o.mouthStyle==='grin'){ctx.fillStyle='#2a1015';ctx.fillRect(ox+3*P,cy+2*P,4*P,P);ctx.fillStyle='#f0e8e0';ctx.fillRect(ox+3*P,cy+2*P,4*P,P/2)}else ctx.fillRect(ox+3*P,cy+2*P+P/4,4*P,P/3);
      if(o.freckles){ctx.fillStyle=darken(skin,20);ctx.fillRect(ox+2*P,cy+P+P/2,P/2,P/2);ctx.fillRect(ox+7*P,cy+P+P/2,P/2,P/2)}
      if(o.blush){ctx.fillStyle='rgba(240,120,120,0.25)';ctx.fillRect(ox+P,cy+P,2*P,P);ctx.fillRect(ox+7*P,cy+P,2*P,P)}
      if(o.beautyMark){ctx.fillStyle=darken(skin,40);ctx.fillRect(ox+7*P+P/2,cy+P+P/2,P/2,P/2)}
    }else if(view===1){
      // SIDE VIEW - one eye, nose sticks out
      ctx.fillStyle='#fff';ctx.fillRect(ox+6*P,cy-P,2*P,2*P);
      ctx.fillStyle=o.eyeColor;ctx.fillRect(ox+7*P,cy-P,P,2*P);
      ctx.fillStyle='#111';ctx.fillRect(ox+7*P,cy,P,P);
      ctx.fillStyle=darken(skin,15);ctx.fillRect(ox+9*P,cy+P,2*P,P);// nose sticks out
      ctx.fillStyle=darken(skin,25);ctx.fillRect(ox+5*P,cy+2*P,3*P,P/2);
      // Side ear
      ctx.fillStyle=skin;ctx.fillRect(ox,cy-P,P,3*P);
    }
    // view===2 (back) - no face features, just head shape
    ctx.fillStyle=hair;
    if(hs!=='bald'){ctx.fillRect(ox+P,cy-4*P,8*P,2*P);ctx.fillRect(ox+2*P,cy-5*P,6*P,P);ctx.fillStyle=lighten(hair,20);ctx.fillRect(ox+3*P,cy-5*P,4*P,P/2);ctx.fillStyle=hair;
      if(o.hairStyle==='short'){ctx.fillRect(ox,cy-3*P,P,3*P);ctx.fillRect(ox+9*P,cy-3*P,P,3*P)}
      if(o.hairStyle==='medium'){ctx.fillRect(ox,cy-3*P,P,6*P);ctx.fillRect(ox+9*P,cy-3*P,P,6*P)}
      if(o.hairStyle==='long'){ctx.fillRect(ox,cy-3*P,P,10*P);ctx.fillRect(ox+9*P,cy-3*P,P,10*P)}
      if(o.hairStyle==='curly'){ctx.fillRect(ox-P,cy-4*P,P,6*P);ctx.fillRect(ox+10*P,cy-4*P,P,6*P);ctx.fillRect(ox,cy-5*P,10*P,P);ctx.fillRect(ox+P,cy-6*P,8*P,P)}
      if(o.hairStyle==='afro'){ctx.fillRect(ox-P,cy-6*P,12*P,3*P);ctx.fillRect(ox-2*P,cy-4*P,14*P,2*P);ctx.fillRect(ox-2*P,cy-2*P,2*P,4*P);ctx.fillRect(ox+10*P,cy-2*P,2*P,4*P)}
      if(o.hairStyle==='ponytail'){ctx.fillRect(ox+8*P,cy-4*P,3*P,2*P);ctx.fillRect(ox+10*P,cy-2*P,P,6*P);ctx.fillStyle='#E74C3C';ctx.fillRect(ox+9*P,cy-2*P,P,P)}
      if(o.hairStyle==='bun'){ctx.fillRect(ox+3*P,cy-7*P,4*P,2*P);ctx.fillRect(ox+4*P,cy-8*P,2*P,P)}}
    if(o.accessory&&o.accessory.includes('glasses')){ctx.fillStyle='#555';ctx.fillRect(ox+P,cy-2*P,3*P,3*P);ctx.fillRect(ox+6*P,cy-2*P,3*P,3*P);ctx.fillRect(ox+4*P,cy-P,2*P,P/2)}
    if(o.accessory==='earrings'){ctx.fillStyle='#F0C040';ctx.fillRect(ox-P/2,cy+P,P,P);ctx.fillRect(ox+9*P+P/2,cy+P,P,P)}
    if(o.accessory==='headband'){ctx.fillStyle='#E74C3C';ctx.fillRect(ox,cy-3*P,10*P,P)}
    ctx.fillStyle='#ffcc00';ctx.font='10px "Press Start 2P",monospace';ctx.textAlign='center';ctx.fillText('IN-GAME PREVIEW',200,cy+19*P);ctx.textAlign='start';ctx.restore();
  }
  renderMini(canvasId){const mc=document.getElementById(canvasId);if(!mc)return;const m=mc.getContext('2d'),s=mc.width;m.clearRect(0,0,s,s);m.imageSmoothingEnabled=false;m.drawImage(this.canvas,220,260,360,360,0,0,s,s);m.strokeStyle='#444466';m.lineWidth=2;m.strokeRect(0,0,s,s)}
}

// ============================================
// PIXEL ART ITEM SPRITES
// ============================================
function drawPixelItem(ctx,x,y,sprite,color){
  const c=color,dk=darken(c,30),lt=lighten(c,30);
  switch(sprite){
    case'key':ctx.fillStyle=c;ctx.fillRect(x+5,y,6,3);ctx.fillRect(x+7,y+3,3,9);ctx.fillStyle=dk;ctx.fillRect(x+4,y+9,3,2);ctx.fillRect(x+4,y+12,3,2);ctx.fillStyle=lt;ctx.fillRect(x+6,y+1,2,1);break;
    case'gem':ctx.fillStyle=c;ctx.fillRect(x+5,y+1,6,2);ctx.fillRect(x+3,y+3,10,3);ctx.fillRect(x+1,y+6,14,3);ctx.fillRect(x+3,y+9,10,3);ctx.fillRect(x+5,y+12,6,2);ctx.fillStyle=lt;ctx.fillRect(x+5,y+3,3,2);ctx.fillStyle=dk;ctx.fillRect(x+8,y+9,4,2);break;
    case'potion':ctx.fillStyle='#8B5E3C';ctx.fillRect(x+6,y,4,3);ctx.fillStyle=c;ctx.fillRect(x+4,y+3,8,3);ctx.fillRect(x+2,y+6,12,6);ctx.fillRect(x+4,y+12,8,2);ctx.fillStyle=lt;ctx.fillRect(x+5,y+4,2,2);ctx.fillStyle=dk;ctx.fillRect(x+2,y+10,12,2);break;
    case'scroll':ctx.fillStyle=c;ctx.fillRect(x+2,y+2,12,12);ctx.fillStyle=lt;ctx.fillRect(x+1,y+1,14,2);ctx.fillRect(x+1,y+13,14,2);ctx.fillStyle=dk;ctx.fillRect(x+4,y+4,8,1);ctx.fillRect(x+4,y+6,8,1);ctx.fillRect(x+4,y+8,6,1);ctx.fillRect(x+4,y+10,7,1);break;
    case'orb':ctx.fillStyle=dk;ctx.fillRect(x+4,y+1,8,2);ctx.fillRect(x+2,y+3,12,2);ctx.fillRect(x+1,y+5,14,4);ctx.fillRect(x+2,y+9,12,2);ctx.fillRect(x+4,y+11,8,2);ctx.fillStyle=c;ctx.fillRect(x+4,y+3,8,6);ctx.fillStyle=lt;ctx.fillRect(x+5,y+3,3,2);break;
    case'cup':ctx.fillStyle=c;ctx.fillRect(x+3,y+2,10,3);ctx.fillRect(x+2,y+5,12,4);ctx.fillRect(x+4,y+9,8,2);ctx.fillRect(x+6,y+11,4,2);ctx.fillRect(x+3,y+13,10,2);ctx.fillStyle=lt;ctx.fillRect(x+4,y+3,3,2);break;
    case'ring':ctx.fillStyle=c;ctx.fillRect(x+4,y+6,8,2);ctx.fillRect(x+2,y+8,12,3);ctx.fillRect(x+4,y+11,8,2);ctx.fillStyle=lt;ctx.fillRect(x+6,y+2,4,4);ctx.fillStyle='#ff2040';ctx.fillRect(x+7,y+3,2,2);break;
    case'feather':ctx.fillStyle=c;ctx.fillRect(x+10,y+1,2,2);ctx.fillRect(x+8,y+3,3,2);ctx.fillRect(x+6,y+5,4,2);ctx.fillRect(x+4,y+7,4,2);ctx.fillRect(x+3,y+9,3,2);ctx.fillRect(x+2,y+11,3,2);ctx.fillRect(x+1,y+13,2,2);ctx.fillStyle=lt;ctx.fillRect(x+9,y+2,1,1);ctx.fillRect(x+7,y+4,1,1);break;
    case'compass':ctx.fillStyle='#8B5E3C';ctx.fillRect(x+3,y+2,10,12);ctx.fillStyle='#ddd';ctx.fillRect(x+4,y+3,8,10);ctx.fillStyle='#ff2040';ctx.fillRect(x+7,y+4,2,5);ctx.fillStyle='#4488ff';ctx.fillRect(x+7,y+9,2,3);ctx.fillStyle='#333';ctx.fillRect(x+7,y+8,2,1);break;
    case'skull':ctx.fillStyle=c;ctx.fillRect(x+3,y+1,10,8);ctx.fillRect(x+5,y+9,6,3);ctx.fillRect(x+4,y+12,8,2);ctx.fillStyle='#111';ctx.fillRect(x+4,y+4,3,3);ctx.fillRect(x+9,y+4,3,3);ctx.fillRect(x+7,y+8,2,2);ctx.fillRect(x+5,y+13,2,1);ctx.fillRect(x+9,y+13,2,1);break;
    case'music':ctx.fillStyle=c;ctx.fillRect(x+4,y+2,2,10);ctx.fillRect(x+10,y+1,2,9);ctx.fillRect(x+4,y+2,8,2);ctx.fillRect(x+2,y+10,4,3);ctx.fillRect(x+8,y+8,4,3);ctx.fillStyle=lt;ctx.fillRect(x+5,y+3,6,1);break;
    default:ctx.fillStyle=c;ctx.fillRect(x+3,y+3,10,10);ctx.fillStyle=lt;ctx.fillRect(x+4,y+4,4,4);
  }
}

// ============================================
// WORLD DEFINITIONS
// ============================================
const WORLDS=[
{
  id:'enchanted-forest',name:'Enchanted Forest',icon:'\u{1F333}',description:'A magical 8-bit forest',
  difficulty:'Easy',worldWidth:3200,gravity:0.5,jumpForce:14,
  colors:{sky:'#0a1628',ground:'#1a4a20',groundDk:'#0f3010',plat:'#2a6a30',platTop:'#3a8a40',platEdge:'#1a4a20',brick:'#225a28'},
  platforms:[
    {x:120,yo:70,w:160,h:16},{x:400,yo:80,w:140,h:16},{x:650,yo:70,w:150,h:16},
    {x:950,yo:90,w:140,h:16},{x:1200,yo:80,w:160,h:16},{x:1500,yo:70,w:140,h:16},
    {x:1800,yo:90,w:150,h:16},{x:2050,yo:80,w:140,h:16},{x:2350,yo:70,w:160,h:16},
    {x:2600,yo:90,w:140,h:16},{x:2850,yo:80,w:150,h:16},
    {x:300,yo:170,w:150,h:16},{x:700,yo:180,w:140,h:16},{x:1100,yo:170,w:160,h:16},
    {x:1550,yo:180,w:140,h:16},{x:1900,yo:170,w:150,h:16},{x:2300,yo:180,w:140,h:16},{x:2700,yo:170,w:150,h:16},
    {x:250,yo:290,w:180,h:16},{x:800,yo:300,w:160,h:16},{x:1400,yo:310,w:180,h:16},
    {x:2000,yo:300,w:160,h:16},{x:2550,yo:290,w:180,h:16},
    {x:200,yo:35,w:100,h:16},{x:1000,yo:35,w:100,h:16},{x:2100,yo:35,w:100,h:16},
  ],
  ladders:[{x:340,yo:0,h:290},{x:860,yo:0,h:300},{x:1480,yo:0,h:310},{x:2060,yo:0,h:300},{x:2620,yo:0,h:290}],
  movingPlatforms:[{x:580,yo:140,w:80,h:16,range:100,speed:1},{x:1700,yo:230,w:80,h:16,range:80,speed:0.8},{x:2450,yo:200,w:80,h:16,range:90,speed:0.9}],
  powerups:[{x:500,yo:200},{x:1900,yo:300}],
  obstacles:[
    {type:'spike',x:550,yo:0,w:48},{type:'spike',x:1350,yo:0,w:48},{type:'spike',x:2200,yo:0,w:48},{type:'spike',x:2900,yo:0,w:48},
    {type:'enemy',x:680,yo:0,range:140,speed:1,color:'#aa3333'},
    {type:'enemy',x:1600,yo:0,range:120,speed:0.8,color:'#33aa33'},
    {type:'enemy',x:2400,yo:0,range:100,speed:1,color:'#aa3333'},
  ],
  items:[
    {id:'golden-acorn',name:'Golden Acorn',sprite:'gem',spriteColor:'#ffcc00',xo:180,yo:100,points:100},
    {id:'fairy-wing',name:'Fairy Wing',sprite:'feather',spriteColor:'#cc88ff',xo:310,yo:320,points:150,challenge:true},
    {id:'magic-potion',name:'Magic Potion',sprite:'potion',spriteColor:'#44dd66',xo:860,yo:330,points:120},
    {id:'ancient-key',name:'Ancient Key',sprite:'key',spriteColor:'#ffaa00',xo:1250,yo:100,points:130,challenge:true},
    {id:'enchanted-compass',name:'Enchanted Compass',sprite:'compass',spriteColor:'#bb8844',xo:1460,yo:340,points:140},
    {id:'crystal-orb',name:'Crystal Orb',sprite:'orb',spriteColor:'#6688ff',xo:2060,yo:330,points:160,challenge:true},
    {id:'dragon-egg',name:'Dragon Egg',sprite:'gem',spriteColor:'#ff6644',xo:2350,yo:100,points:180},
    {id:'silver-feather',name:'Silver Feather',sprite:'feather',spriteColor:'#ccddff',xo:2610,yo:320,points:120},
  ],
  drawBg(ctx,W,H,camX,gY,f){
    ctx.fillStyle='#0a1628';ctx.fillRect(0,0,W,H);
    // Twinkling stars
    ctx.fillStyle='#aaccff';for(let i=0;i<30;i++){const sx=(i*137+50)%W,sy=(i*73+20)%(H*0.4);if(Math.sin(f*0.05+i)>0){ctx.fillRect(sx,sy,2,2);if(Math.sin(f*0.08+i*3)>0.8)ctx.fillRect(sx-1,sy+1,4,1)}}
    // Big moon with craters
    ctx.fillStyle='#ffee88';ctx.fillRect(W-110,20,30,30);ctx.fillStyle='#ddcc66';ctx.fillRect(W-104,24,6,6);ctx.fillRect(W-94,30,4,4);ctx.fillRect(W-100,38,5,5);
    ctx.fillStyle='#0a1628';ctx.fillRect(W-108,20,6,20);
    // Big background trees (parallax, sway)
    const bo=camX*0.15;
    for(let i=0;i<12;i++){const tx=i*280-(bo%(280*12));if(tx<-80||tx>W+80)continue;
      const sway=Math.sin(f*0.01+i*2)*4;const th=80+Math.sin(i*2.3)*30;
      ctx.fillStyle='#0a2010';ctx.fillRect(tx-5+sway*0.3,gY-th,10,th);
      // Big canopy
      ctx.fillRect(tx-30+sway,gY-th-10,60,20);ctx.fillRect(tx-25+sway,gY-th-25,50,20);ctx.fillRect(tx-15+sway,gY-th-35,30,15);
      // Owl on some trees
      if(i%3===0){const oy=gY-th-15;ctx.fillStyle='#554433';ctx.fillRect(tx+12+sway,oy,12,10);ctx.fillStyle='#ffcc00';
        const blink=Math.sin(f*0.03+i)>0.9;
        if(!blink){ctx.fillRect(tx+14+sway,oy+2,3,3);ctx.fillRect(tx+20+sway,oy+2,3,3)}
        ctx.fillStyle='#111';if(!blink){ctx.fillRect(tx+15+sway,oy+3,1,1);ctx.fillRect(tx+21+sway,oy+3,1,1)}}
    }
    // Floating mushroom spores (large, slow)
    for(let i=0;i<8;i++){
      const sx=(i*400+f*0.3+Math.sin(f*0.005+i*1.7)*60)%W,sy=H*0.15+Math.sin(f*0.008+i*2.1)*H*0.25;
      ctx.fillStyle='rgba(150,255,100,0.08)';ctx.fillRect(sx-6,sy-6,12,12);ctx.fillStyle='rgba(150,255,100,0.15)';ctx.fillRect(sx-2,sy-2,4,4);
    }
    // Firefly swarms
    for(let i=0;i<15;i++){const fx=(i*200+f*0.5+Math.sin(f*0.02+i)*30)%W,fy=gY-30-Math.sin(f*0.015+i*1.3)*50-Math.abs(Math.sin(f*0.03+i*0.7))*20;
      const a=Math.sin(f*0.04+i)>0;if(a){ctx.fillStyle='#aaffaa';ctx.fillRect(fx,fy,3,3)}}
  }
},
{
  id:'underwater-ruins',name:'Underwater Ruins',icon:'\u{1F30A}',description:'Ancient 8-bit ocean ruins',
  difficulty:'Medium',worldWidth:3000,gravity:0.5,jumpForce:14,
  colors:{sky:'#050f28',ground:'#0c2838',groundDk:'#081820',plat:'#2a4060',platTop:'#3a6080',platEdge:'#1a3050',brick:'#284a60'},
  platforms:[
    {x:150,yo:70,w:150,h:18},{x:400,yo:80,w:140,h:18},{x:650,yo:70,w:150,h:18},{x:900,yo:90,w:140,h:18},{x:1150,yo:80,w:150,h:18},{x:1450,yo:70,w:140,h:18},{x:1700,yo:90,w:150,h:18},{x:1950,yo:80,w:140,h:18},{x:2200,yo:70,w:150,h:18},{x:2500,yo:90,w:140,h:18},{x:2720,yo:80,w:150,h:18},
    {x:250,yo:180,w:150,h:18},{x:700,yo:190,w:140,h:18},{x:1100,yo:180,w:160,h:18},{x:1500,yo:190,w:140,h:18},{x:1900,yo:180,w:150,h:18},{x:2350,yo:190,w:140,h:18},
    {x:200,yo:300,w:170,h:18},{x:750,yo:310,w:160,h:18},{x:1350,yo:320,w:170,h:18},{x:1950,yo:310,w:160,h:18},{x:2500,yo:300,w:170,h:18},
    {x:300,yo:35,w:100,h:18},{x:1200,yo:35,w:100,h:18},{x:2100,yo:35,w:100,h:18},
  ],
  ladders:[{x:310,yo:0,h:300},{x:810,yo:0,h:310},{x:1420,yo:0,h:320},{x:2010,yo:0,h:310},{x:2570,yo:0,h:300}],
  movingPlatforms:[{x:500,yo:150,w:80,h:18,range:90,speed:0.7},{x:1600,yo:240,w:80,h:18,range:80,speed:0.8}],
  powerups:[{x:450,yo:210},{x:1800,yo:310}],
  obstacles:[
    {type:'spike',x:550,yo:0,w:48},{type:'spike',x:1300,yo:0,w:48},{type:'spike',x:1800,yo:0,w:48},{type:'spike',x:2650,yo:0,w:32},
    {type:'enemy',x:750,yo:0,range:130,speed:0.8,color:'#3366aa'},{type:'enemy',x:1450,yo:0,range:110,speed:0.9,color:'#33aa66'},{type:'enemy',x:2200,yo:0,range:100,speed:1,color:'#3366aa'},
  ],
  items:[
    {id:'pearl-wisdom',name:'Pearl of Wisdom',sprite:'orb',spriteColor:'#eeddff',xo:260,yo:210,points:120},
    {id:'trident-fragment',name:'Trident Fragment',sprite:'key',spriteColor:'#44aacc',xo:260,yo:330,points:160,challenge:true},
    {id:'mermaid-scale',name:'Mermaid Scale',sprite:'gem',spriteColor:'#44ddaa',xo:810,yo:340,points:140},
    {id:'golden-chalice',name:'Golden Chalice',sprite:'cup',spriteColor:'#ffcc00',xo:1200,yo:110,points:150,challenge:true},
    {id:'sea-crystal',name:'Sea Crystal',sprite:'gem',spriteColor:'#66bbff',xo:1410,yo:350,points:130},
    {id:'ancient-tablet',name:'Ancient Tablet',sprite:'scroll',spriteColor:'#ccbb88',xo:2010,yo:340,points:170},
    {id:'nautilus-shell',name:'Nautilus Shell',sprite:'gem',spriteColor:'#ffaa88',xo:2350,yo:100,points:110,challenge:true},
    {id:'captains-compass',name:"Captain's Compass",sprite:'compass',spriteColor:'#bb8844',xo:2560,yo:330,points:120},
  ],
  drawBg(ctx,W,H,camX,gY,f){
    ctx.fillStyle='#050f28';ctx.fillRect(0,0,W,H);
    // Light rays from surface (wide, animated)
    for(let i=0;i<5;i++){const rx=W*0.1+i*W*0.2+Math.sin(f*0.003+i)*30;ctx.fillStyle='rgba(60,140,200,0.05)';ctx.save();ctx.translate(rx,0);ctx.transform(1,0,0.1+Math.sin(f*0.005+i)*0.05,1,0,0);ctx.fillRect(-25,0,50,H*0.65);ctx.restore()}
    // Big whale shadow (slow, far background)
    const whaleX=(f*0.15+camX*0.05)%(W+400)-200;
    ctx.fillStyle='rgba(20,40,70,0.2)';ctx.fillRect(whaleX,H*0.12,120,35);ctx.fillRect(whaleX+100,H*0.12+8,40,18);ctx.fillRect(whaleX-30,H*0.12+5,40,24);ctx.fillRect(whaleX+130,H*0.12+4,20,10);ctx.fillRect(whaleX+140,H*0.12-2,16,8);
    // Eye
    ctx.fillStyle='rgba(60,100,140,0.3)';ctx.fillRect(whaleX+5,H*0.12+10,6,6);
    // Large fish swimming (multiple, different depths)
    const fishColors=['#ff8866','#66ddff','#ffcc44','#88ff88','#ff88cc'];
    for(let i=0;i<5;i++){
      const dir=i%2===0?1:-1;const spd=0.3+i*0.15;
      const fx=(i*600+f*spd*dir+500)%(W+200)-100;const fy=H*0.2+i*H*0.12+Math.sin(f*0.01+i*2)*20;
      const sz=16+i*4;ctx.fillStyle=fishColors[i];
      // Fish body
      ctx.fillRect(fx,fy,sz,sz*0.5);ctx.fillRect(fx+sz*0.2,fy-sz*0.15,sz*0.6,sz*0.8);
      // Tail
      const td=dir>0?-1:1;ctx.fillRect(fx+(dir>0?-sz*0.3:sz),fy-sz*0.1,sz*0.3,sz*0.7);
      // Eye
      ctx.fillStyle='#fff';ctx.fillRect(fx+(dir>0?sz*0.65:sz*0.15),fy+sz*0.05,sz*0.15,sz*0.15);
      ctx.fillStyle='#111';ctx.fillRect(fx+(dir>0?sz*0.7:sz*0.2),fy+sz*0.1,sz*0.08,sz*0.08);
    }
    // Jellyfish (floating up and down, translucent)
    for(let i=0;i<4;i++){
      const jx=(i*500+300-camX*0.15)%(W+100)-50;const jy=H*0.15+Math.sin(f*0.008+i*1.5)*H*0.2;
      ctx.fillStyle='rgba(200,150,255,0.12)';ctx.fillRect(jx,jy,24,14);ctx.fillRect(jx+4,jy-4,16,8);
      ctx.fillStyle='rgba(200,150,255,0.08)';
      // Tentacles (wavy)
      for(let t=0;t<4;t++){const tw=Math.sin(f*0.03+i+t)*4;ctx.fillRect(jx+4+t*5+tw,jy+14,2,16+Math.sin(f*0.02+t)*6)}
    }
    // Rising bubbles (big)
    for(let i=0;i<12;i++){const bx=(i*180+f*0.3)%W,by=H-(f*0.25+i*60)%(H+60);const bs=3+i%3*2;
      ctx.fillStyle='rgba(100,180,255,0.12)';ctx.fillRect(bx,by,bs,bs);ctx.fillStyle='rgba(180,220,255,0.2)';ctx.fillRect(bx+1,by+1,2,2)}
    // Distant ruins
    const ro=camX*0.1;for(let i=0;i<6;i++){const rx=i*500-(ro%(500*6));if(rx<-40||rx>W+40)continue;ctx.fillStyle='rgba(25,45,75,0.3)';ctx.fillRect(rx-12,gY-80,24,80);ctx.fillRect(rx-18,gY-86,36,8);ctx.fillRect(rx-8,gY-100,16,20)}
  }
},
{
  id:'haunted-mansion',name:'Haunted Mansion',icon:'\u{1F3DA}',description:'A spooky 8-bit mansion',
  difficulty:'Hard',worldWidth:2800,gravity:0.5,jumpForce:14,
  colors:{sky:'#0d0a15',ground:'#201018',groundDk:'#140a10',plat:'#3a2030',platTop:'#503040',platEdge:'#2a1820',brick:'#352530'},
  platforms:[
    {x:100,yo:70,w:140,h:16},{x:350,yo:80,w:150,h:16},{x:600,yo:70,w:130,h:16},{x:850,yo:90,w:140,h:16},{x:1100,yo:80,w:150,h:16},{x:1400,yo:70,w:140,h:16},{x:1650,yo:90,w:150,h:16},{x:1900,yo:80,w:140,h:16},{x:2150,yo:70,w:150,h:16},{x:2400,yo:90,w:140,h:16},{x:2600,yo:80,w:140,h:16},
    {x:200,yo:180,w:160,h:16},{x:600,yo:190,w:150,h:16},{x:1000,yo:180,w:160,h:16},{x:1400,yo:190,w:150,h:16},{x:1800,yo:180,w:160,h:16},{x:2200,yo:190,w:150,h:16},
    {x:150,yo:300,w:180,h:16},{x:650,yo:310,w:170,h:16},{x:1200,yo:320,w:180,h:16},{x:1750,yo:310,w:170,h:16},{x:2300,yo:300,w:180,h:16},
    {x:250,yo:35,w:100,h:16},{x:950,yo:35,w:100,h:16},{x:1900,yo:35,w:100,h:16},
  ],
  ladders:[{x:280,yo:0,h:300},{x:720,yo:0,h:310},{x:1280,yo:0,h:320},{x:1870,yo:0,h:310},{x:2380,yo:0,h:300}],
  movingPlatforms:[{x:450,yo:140,w:80,h:16,range:100,speed:0.9},{x:1550,yo:250,w:80,h:16,range:70,speed:1}],
  powerups:[{x:400,yo:200},{x:1650,yo:320}],
  obstacles:[
    {type:'spike',x:470,yo:0,w:48},{type:'spike',x:780,yo:0,w:48},{type:'spike',x:1250,yo:0,w:48},{type:'spike',x:1550,yo:0,w:48},{type:'spike',x:2050,yo:0,w:32},{type:'spike',x:2530,yo:0,w:48},
    {type:'enemy',x:500,yo:0,range:120,speed:0.9,color:'#8833aa'},{type:'enemy',x:1200,yo:0,range:100,speed:1,color:'#aa3388'},{type:'enemy',x:1850,yo:0,range:130,speed:0.8,color:'#8833aa'},{type:'enemy',x:2500,yo:0,range:90,speed:1,color:'#aa3388'},
  ],
  items:[
    {id:'skeleton-key',name:'Skeleton Key',sprite:'key',spriteColor:'#aaaaaa',xo:210,yo:310,points:140,challenge:true},
    {id:'crystal-ball',name:'Crystal Ball',sprite:'orb',spriteColor:'#bb66ff',xo:660,yo:340,points:160},
    {id:'vampires-ring',name:"Vampire's Ring",sprite:'ring',spriteColor:'#ffcc00',xo:1050,yo:210,points:170},
    {id:'ghost-lantern',name:'Ghost Lantern',sprite:'orb',spriteColor:'#44ff88',xo:1260,yo:350,points:130,challenge:true},
    {id:'spell-book',name:'Spell Book',sprite:'scroll',spriteColor:'#6644aa',xo:1700,yo:110,points:150},
    {id:'cursed-mirror',name:'Cursed Mirror',sprite:'gem',spriteColor:'#8888cc',xo:1810,yo:340,points:180,challenge:true},
    {id:'bat-medallion',name:'Bat Medallion',sprite:'ring',spriteColor:'#aa4444',xo:2250,yo:210,points:120},
    {id:'phantom-music-box',name:'Music Box',sprite:'music',spriteColor:'#aa66cc',xo:2360,yo:330,points:150},
  ],
  drawBg(ctx,W,H,camX,gY,f){
    ctx.fillStyle='#0d0a15';ctx.fillRect(0,0,W,H);
    // Wallpaper pattern
    ctx.fillStyle='rgba(60,40,60,0.06)';const po=camX*0.1;for(let x=-po%60;x<W;x+=60)for(let y=0;y<gY;y+=60)ctx.fillRect(x+25,y+25,10,10);
    // Paintings with TRACKING EYES (large, creepy)
    const wo=camX*0.2;
    for(let i=0;i<4;i++){const wx=i*650+80-(wo%(650*4));if(wx<-80||wx>W+80)continue;
      // Frame
      ctx.fillStyle='#3a2820';ctx.fillRect(wx-4,H*0.1-4,58,68);ctx.fillStyle='#1a1018';ctx.fillRect(wx,H*0.1,50,60);
      // Face in painting
      ctx.fillStyle='#2a1a1a';ctx.fillRect(wx+15,H*0.1+10,20,30);
      // Eyes that TRACK (move based on frame/camera position)
      const eyeOff=Math.sin(f*0.01+i*2)*3;
      ctx.fillStyle='#fff';ctx.fillRect(wx+18,H*0.1+18,8,6);ctx.fillRect(wx+30,H*0.1+18,8,6);
      ctx.fillStyle='#cc2222';ctx.fillRect(wx+20+eyeOff,H*0.1+19,4,4);ctx.fillRect(wx+32+eyeOff,H*0.1+19,4,4);
      // Mouth (slight frown)
      ctx.fillStyle='#1a0a0a';ctx.fillRect(wx+20,H*0.1+32,12,3);
      // Lightning flash through windows
      if(Math.sin(f*0.015+i*3)>0.95){ctx.fillStyle='rgba(150,120,200,0.15)';ctx.fillRect(0,0,W,H)}
    }
    // Swinging chandeliers
    for(let i=0;i<3;i++){const cx2=i*400+200-(camX*0.3%(400*3));if(cx2<-40||cx2>W+40)continue;
      const swing=Math.sin(f*0.015+i*2)*15;
      // Chain
      ctx.fillStyle='#4a3a2a';ctx.fillRect(cx2+swing*0.3,0,3,H*0.08);
      // Chandelier body
      const cy2=H*0.08;ctx.fillStyle='#6a5a3a';ctx.fillRect(cx2-15+swing,cy2,33,8);ctx.fillRect(cx2-10+swing,cy2+8,23,4);
      // Candle flames (flicker)
      for(let c=0;c<3;c++){const fl=Math.sin(f*0.15+i+c)>0;ctx.fillStyle=fl?'#ffaa30':'#ff8800';ctx.fillRect(cx2-12+c*12+swing,cy2-4,5,5);}
    }
    // BIG FLOATING GHOSTS
    for(let i=0;i<3;i++){
      const gx=(i*800+Math.sin(f*0.006+i*2.5)*150-camX*0.08)%(W+200)-100;
      const gy=H*0.15+Math.sin(f*0.01+i*1.5)*H*0.15;const ga=0.08+Math.sin(f*0.02+i)*0.04;
      ctx.fillStyle=`rgba(180,160,220,${ga})`;
      // Ghost body (large, ~40x50)
      ctx.fillRect(gx+8,gy,24,8);ctx.fillRect(gx+4,gy+8,32,8);ctx.fillRect(gx,gy+16,40,20);
      ctx.fillRect(gx+4,gy+36,8,8);ctx.fillRect(gx+16,gy+36,8,8);ctx.fillRect(gx+28,gy+36,8,8);
      // Ghost eyes
      ctx.fillStyle=`rgba(40,20,60,${ga+0.1})`;ctx.fillRect(gx+10,gy+18,8,8);ctx.fillRect(gx+24,gy+18,8,8);
      // Ghost mouth (O shape)
      ctx.fillRect(gx+16,gy+28,8,6);
    }
    // Flickering candles (on ground)
    const co=camX*0.35;for(let i=0;i<7;i++){const cx3=i*420-(co%(420*7));if(cx3<-10||cx3>W+10)continue;
      ctx.fillStyle='#d4a44a';ctx.fillRect(cx3,gY-28,5,16);
      const fl=Math.sin(f*0.15+i*2)>0;ctx.fillStyle=fl?'#ffaa30':'#ff8800';ctx.fillRect(cx3-1,gY-32,7,6);
      ctx.fillStyle='rgba(255,170,48,0.06)';ctx.fillRect(cx3-12,gY-40,30,20)}
    // Bats flying across
    for(let i=0;i<4;i++){const bx=(i*500+f*1.2)%(W+100)-50,by=H*0.08+Math.sin(f*0.02+i*3)*30;
      const wing=Math.sin(f*0.1+i)*6;ctx.fillStyle='rgba(40,20,50,0.3)';
      ctx.fillRect(bx,by,6,4);ctx.fillRect(bx-8-wing,by-2,8,3);ctx.fillRect(bx+6+wing,by-2,8,3)}
  }
},
{
  id:'desert-temple',name:'Desert Temple',icon:'\u{1F3DB}',description:'An ancient 8-bit temple',
  difficulty:'Expert',worldWidth:3400,gravity:0.5,jumpForce:14,
  colors:{sky:'#1a1510',ground:'#5a4528',groundDk:'#3a2a18',plat:'#6a5530',platTop:'#8a7040',platEdge:'#4a3518',brick:'#5a4a28'},
  platforms:[
    {x:150,yo:70,w:150,h:16},{x:400,yo:80,w:160,h:16},{x:650,yo:70,w:140,h:16},{x:900,yo:90,w:150,h:16},{x:1150,yo:80,w:140,h:16},{x:1450,yo:70,w:150,h:16},{x:1700,yo:90,w:140,h:16},{x:1950,yo:80,w:160,h:16},{x:2200,yo:70,w:140,h:16},{x:2500,yo:90,w:150,h:16},{x:2750,yo:80,w:140,h:16},{x:3050,yo:70,w:150,h:16},
    {x:250,yo:180,w:160,h:16},{x:700,yo:190,w:150,h:16},{x:1100,yo:180,w:160,h:16},{x:1550,yo:190,w:150,h:16},{x:1950,yo:180,w:160,h:16},{x:2400,yo:190,w:150,h:16},{x:2900,yo:180,w:160,h:16},
    {x:200,yo:310,w:180,h:16},{x:750,yo:320,w:170,h:16},{x:1350,yo:330,w:180,h:16},{x:1900,yo:320,w:170,h:16},{x:2500,yo:310,w:180,h:16},{x:3000,yo:320,w:160,h:16},
    {x:300,yo:35,w:100,h:16},{x:1050,yo:35,w:100,h:16},{x:1800,yo:35,w:100,h:16},{x:2700,yo:35,w:100,h:16},
  ],
  ladders:[{x:330,yo:0,h:310},{x:820,yo:0,h:320},{x:1430,yo:0,h:330},{x:1970,yo:0,h:320},{x:2570,yo:0,h:310},{x:3070,yo:0,h:320}],
  movingPlatforms:[{x:550,yo:150,w:80,h:16,range:110,speed:1},{x:1300,yo:260,w:80,h:16,range:80,speed:0.9},{x:2650,yo:200,w:80,h:16,range:100,speed:0.8}],
  powerups:[{x:600,yo:200},{x:1700,yo:330},{x:2800,yo:310}],
  obstacles:[
    {type:'spike',x:530,yo:0,w:48},{type:'spike',x:850,yo:0,w:48},{type:'spike',x:1300,yo:0,w:48},{type:'spike',x:1650,yo:0,w:48},{type:'spike',x:2100,yo:0,w:48},{type:'spike',x:2650,yo:0,w:32},{type:'spike',x:3150,yo:0,w:48},
    {type:'enemy',x:580,yo:0,range:130,speed:0.9,color:'#aa6622'},{type:'enemy',x:1100,yo:0,range:110,speed:1,color:'#cc4422'},{type:'enemy',x:1850,yo:0,range:120,speed:0.8,color:'#aa6622'},{type:'enemy',x:2400,yo:0,range:100,speed:1,color:'#cc4422'},{type:'enemy',x:2900,yo:0,range:90,speed:0.9,color:'#aa6622'},
  ],
  items:[
    {id:'scarab-amulet',name:'Scarab Amulet',sprite:'ring',spriteColor:'#ffcc00',xo:310,yo:340,points:150},
    {id:'pharaohs-eye',name:"Pharaoh's Eye",sprite:'skull',spriteColor:'#ffcc00',xo:760,yo:350,points:180,challenge:true},
    {id:'sun-disk',name:'Sun Disk',sprite:'orb',spriteColor:'#ffaa44',xo:1150,yo:210,points:160},
    {id:'sand-hourglass',name:'Sand Hourglass',sprite:'potion',spriteColor:'#ddaa44',xo:1410,yo:360,points:140,challenge:true},
    {id:'golden-ankh',name:'Golden Ankh',sprite:'key',spriteColor:'#ffcc00',xo:1950,yo:110,points:170},
    {id:'sacred-scroll',name:'Sacred Scroll',sprite:'scroll',spriteColor:'#ccbb88',xo:1960,yo:350,points:130},
    {id:'oasis-gem',name:'Oasis Gem',sprite:'gem',spriteColor:'#44ddcc',xo:2560,yo:340,points:150,challenge:true},
    {id:'sphinx-stone',name:'Sphinx Stone',sprite:'skull',spriteColor:'#ccaa77',xo:3060,yo:350,points:200},
  ],
  drawBg(ctx,W,H,camX,gY,f){
    // Sky gradient (bands)
    ctx.fillStyle='#1a1510';ctx.fillRect(0,0,W,H);ctx.fillStyle='#2a1e14';ctx.fillRect(0,0,W,H*0.3);ctx.fillStyle='#221810';ctx.fillRect(0,H*0.3,W,H*0.2);
    // Big sun with glow
    ctx.fillStyle='#ffcc60';ctx.fillRect(W*0.78-14,H*0.08,28,28);ctx.fillStyle='#ffaa40';ctx.fillRect(W*0.78-10,H*0.08+4,20,20);
    ctx.fillStyle='rgba(255,170,64,0.04)';ctx.fillRect(W*0.78-40,H*0.06-10,80,60);
    // Heat shimmer (wavy horizontal lines)
    ctx.fillStyle='rgba(255,200,100,0.03)';for(let y=gY-80;y<gY;y+=6){const w2=Math.sin(f*0.02+y*0.1)*8;ctx.fillRect(w2,y,W,2)}
    // Big dunes (parallax)
    const dO=camX*0.08;ctx.fillStyle='rgba(70,50,25,0.2)';for(let i=0;i<8;i++){const dx=i*400-(dO%(400*8));ctx.fillRect(dx-100,gY-12,200,14);ctx.fillRect(dx-80,gY-18,160,8)}
    // Temple silhouettes (large, detailed)
    const tO=camX*0.15;for(let i=0;i<3;i++){const tx=i*1100+200-(tO%(1100*3));if(tx<-120||tx>W+120)continue;ctx.fillStyle='rgba(50,35,20,0.25)';
      ctx.fillRect(tx-50,gY-100,100,100);ctx.fillRect(tx-40,gY-120,80,25);ctx.fillRect(tx-30,gY-135,60,18);ctx.fillRect(tx-20,gY-145,40,12);
      // Temple door
      ctx.fillStyle='rgba(30,20,10,0.3)';ctx.fillRect(tx-10,gY-60,20,60);
      // Hieroglyphics
      ctx.fillStyle='rgba(200,160,60,0.06)';for(let h=0;h<4;h++)ctx.fillRect(tx-35+h*20,gY-90+h*5,8,8)}
    // Circling vultures
    for(let i=0;i<3;i++){const angle=f*0.008+i*2.1;const vr=60+i*20;
      const vx=W*0.5+Math.cos(angle)*vr-camX*0.05,vy=H*0.1+Math.sin(angle)*vr*0.4+i*15;
      ctx.fillStyle='rgba(40,25,15,0.25)';ctx.fillRect(vx,vy,8,4);
      const wing=Math.sin(f*0.06+i)*8;ctx.fillRect(vx-10-wing,vy-1,10,3);ctx.fillRect(vx+8+wing,vy-1,10,3)}
    // Tumbleweeds rolling across
    for(let i=0;i<3;i++){const twX=(i*1200+f*1.5)%(W+200)-100,twY=gY-12-Math.abs(Math.sin(f*0.03+i*2))*15;
      const rot=f*0.05+i;ctx.fillStyle='rgba(120,90,40,0.2)';ctx.fillRect(twX-8,twY-8,16,16);ctx.fillStyle='rgba(100,70,30,0.15)';ctx.fillRect(twX-6,twY-10,12,4);ctx.fillRect(twX-10,twY-4,4,8)}
    // Torches with big flames
    const fO=camX*0.3;for(let i=0;i<6;i++){const ttx=i*600+100-(fO%(600*6));if(ttx<-15||ttx>W+15)continue;
      ctx.fillStyle='#5a4020';ctx.fillRect(ttx-2,gY-40,6,28);
      const fl=Math.sin(f*0.12+i*1.5);ctx.fillStyle=fl>0?'#ff8020':'#ffaa40';ctx.fillRect(ttx-4,gY-48,10,10);
      ctx.fillStyle=fl>0.3?'#ffcc60':'#ff9030';ctx.fillRect(ttx-2,gY-52,6,6);
      ctx.fillStyle='rgba(255,140,40,0.06)';ctx.fillRect(ttx-18,gY-55,40,30)}
    // Dust clouds drifting
    for(let i=0;i<6;i++){const px2=(i*500+f*0.8)%(W+40)-20,py2=gY-6-Math.sin(f*0.01+i)*12;
      ctx.fillStyle='rgba(180,140,80,0.08)';ctx.fillRect(px2-10,py2-4,20,8);ctx.fillRect(px2-6,py2-8,12,6)}
  }
},
{
  id:'space-world',name:'Space World',icon:'\u{1F680}',description:'Collect treasures among the stars',
  difficulty:'Medium',worldWidth:3200,gravity:0.35,jumpForce:15,
  colors:{sky:'#020210',ground:'#2a2a40',groundDk:'#1a1a30',plat:'#3a3a5a',platTop:'#5555aa',platEdge:'#2a2a45',brick:'#333355'},
  platforms:[
    {x:120,yo:70,w:150,h:16},{x:380,yo:90,w:140,h:16},{x:620,yo:70,w:150,h:16},{x:880,yo:100,w:140,h:16},{x:1150,yo:80,w:160,h:16},{x:1400,yo:70,w:140,h:16},{x:1680,yo:90,w:150,h:16},{x:1930,yo:80,w:140,h:16},{x:2200,yo:70,w:150,h:16},{x:2500,yo:90,w:140,h:16},{x:2800,yo:80,w:150,h:16},
    {x:250,yo:180,w:150,h:16},{x:650,yo:190,w:140,h:16},{x:1050,yo:180,w:160,h:16},{x:1500,yo:190,w:140,h:16},{x:1850,yo:180,w:150,h:16},{x:2350,yo:190,w:140,h:16},{x:2700,yo:180,w:150,h:16},
    {x:200,yo:300,w:170,h:16},{x:750,yo:310,w:160,h:16},{x:1350,yo:320,w:170,h:16},{x:1950,yo:310,w:160,h:16},{x:2550,yo:300,w:170,h:16},
  ],
  ladders:[{x:320,yo:0,h:300},{x:820,yo:0,h:310},{x:1420,yo:0,h:320},{x:2020,yo:0,h:310},{x:2620,yo:0,h:300}],
  movingPlatforms:[{x:500,yo:150,w:80,h:16,range:110,speed:0.6},{x:1700,yo:250,w:80,h:16,range:90,speed:0.5}],
  powerups:[{x:480,yo:210},{x:1850,yo:310}],
  obstacles:[
    {type:'spike',x:520,yo:0,w:48},{type:'spike',x:1250,yo:0,w:48},{type:'spike',x:2100,yo:0,w:48},{type:'spike',x:2900,yo:0,w:48},
    {type:'enemy',x:700,yo:0,range:140,speed:0.7,color:'#44cc44'},{type:'enemy',x:1600,yo:0,range:120,speed:0.8,color:'#44cc44'},{type:'enemy',x:2400,yo:0,range:100,speed:0.9,color:'#44cc44'},
  ],
  items:[
    {id:'moon-rock',name:'Moon Rock',sprite:'gem',spriteColor:'#aaaacc',xo:200,yo:100,points:120},
    {id:'star-map',name:'Star Map',sprite:'scroll',spriteColor:'#4466cc',xo:320,yo:320,points:150,challenge:true},
    {id:'alien-crystal',name:'Alien Crystal',sprite:'gem',spriteColor:'#44ffaa',xo:820,yo:330,points:140},
    {id:'rocket-fuel',name:'Rocket Fuel',sprite:'potion',spriteColor:'#ff6644',xo:1200,yo:100,points:130,challenge:true},
    {id:'asteroid-ore',name:'Asteroid Ore',sprite:'gem',spriteColor:'#cc8844',xo:1420,yo:340,points:160},
    {id:'space-compass',name:'Space Compass',sprite:'compass',spriteColor:'#6688ff',xo:2020,yo:330,points:140,challenge:true},
    {id:'nebula-gem',name:'Nebula Gem',sprite:'orb',spriteColor:'#cc44ff',xo:2350,yo:100,points:170},
    {id:'cosmic-key',name:'Cosmic Key',sprite:'key',spriteColor:'#ffcc44',xo:2600,yo:320,points:120},
  ],
  drawBg(ctx,W,H,camX,gY,f){
    ctx.fillStyle='#020210';ctx.fillRect(0,0,W,H);
    // Dense starfield (multiple layers)
    for(let i=0;i<60;i++){const sx=(i*97+30-camX*0.05)%W,sy=(i*61+10)%(H*0.8);const br=Math.sin(f*0.04+i)>0;ctx.fillStyle=br?'#ffffff':'#8888cc';ctx.fillRect(sx,sy,2,2)}
    for(let i=0;i<30;i++){const sx=(i*151+80-camX*0.02)%W,sy=(i*83+40)%(H*0.7);ctx.fillStyle='#555577';ctx.fillRect(sx,sy,1,1)}
    // Nebula clouds (large, colorful, slow)
    for(let i=0;i<3;i++){const nx=(i*500+100-camX*0.03)%(W+200)-100,ny=H*0.1+i*H*0.2;
      ctx.fillStyle=['rgba(100,40,140,0.06)','rgba(40,80,140,0.05)','rgba(140,40,60,0.05)'][i];
      ctx.fillRect(nx,ny,180,80);ctx.fillRect(nx+20,ny-20,140,120);ctx.fillRect(nx+40,ny+10,100,60)}
    // Planets (big, slow parallax)
    const px1=(800-camX*0.04)%W;ctx.fillStyle='#884422';ctx.fillRect(px1,H*0.12,40,40);ctx.fillStyle='#aa6633';ctx.fillRect(px1+8,H*0.12+4,24,12);
    ctx.fillStyle='#664422';ctx.fillRect(px1-4,H*0.12+16,48,6);ctx.fillRect(px1-2,H*0.12+24,44,4); // rings
    const px2=(1800-camX*0.06)%W;ctx.fillStyle='#446688';ctx.fillRect(px2,H*0.25,28,28);ctx.fillStyle='#5588aa';ctx.fillRect(px2+6,H*0.25+4,16,10);
    // Floating asteroids
    for(let i=0;i<5;i++){const ax=(i*600+f*0.4)%(W+100)-50,ay=H*0.15+Math.sin(f*0.008+i*2)*H*0.15;
      ctx.fillStyle='#555566';ctx.fillRect(ax,ay,12+i*3,10+i*2);ctx.fillStyle='#444455';ctx.fillRect(ax+2,ay+2,4,4)}
    // Shooting stars (occasional)
    if(Math.sin(f*0.01)>0.95){const sx2=f*3%W,sy2=20+f%60;ctx.fillStyle='#fff';ctx.fillRect(sx2,sy2,12,2);ctx.fillRect(sx2+12,sy2+2,8,1)}
  }
},
{
  id:'farm-world',name:'Farm World',icon:'\u{1F33E}',description:'A peaceful farm with hidden treasure',
  difficulty:'Easy',worldWidth:3000,gravity:0.5,jumpForce:14,
  colors:{sky:'#1a2810',ground:'#4a7a30',groundDk:'#3a6020',plat:'#6a5530',platTop:'#8a7a40',platEdge:'#5a4520',brick:'#5a4a28'},
  platforms:[
    {x:140,yo:70,w:160,h:16},{x:400,yo:80,w:140,h:16},{x:650,yo:70,w:150,h:16},{x:900,yo:90,w:140,h:16},{x:1150,yo:80,w:160,h:16},{x:1400,yo:70,w:140,h:16},{x:1650,yo:90,w:150,h:16},{x:1900,yo:80,w:140,h:16},{x:2150,yo:70,w:150,h:16},{x:2450,yo:90,w:140,h:16},{x:2700,yo:80,w:150,h:16},
    {x:280,yo:170,w:150,h:16},{x:680,yo:180,w:140,h:16},{x:1080,yo:170,w:160,h:16},{x:1480,yo:180,w:140,h:16},{x:1880,yo:170,w:150,h:16},{x:2300,yo:180,w:140,h:16},
    {x:230,yo:280,w:170,h:16},{x:780,yo:290,w:160,h:16},{x:1380,yo:300,w:170,h:16},{x:1980,yo:290,w:160,h:16},{x:2500,yo:280,w:170,h:16},
  ],
  ladders:[{x:350,yo:0,h:280},{x:850,yo:0,h:290},{x:1450,yo:0,h:300},{x:2050,yo:0,h:290},{x:2570,yo:0,h:280}],
  movingPlatforms:[{x:550,yo:130,w:80,h:16,range:80,speed:0.7},{x:1750,yo:220,w:80,h:16,range:70,speed:0.6}],
  powerups:[{x:480,yo:190},{x:1880,yo:290}],
  obstacles:[
    {type:'spike',x:530,yo:0,w:48},{type:'spike',x:1250,yo:0,w:48},{type:'spike',x:2050,yo:0,w:48},
    {type:'enemy',x:700,yo:0,range:130,speed:0.8,color:'#886622'},{type:'enemy',x:1550,yo:0,range:110,speed:0.9,color:'#886622'},{type:'enemy',x:2400,yo:0,range:100,speed:0.8,color:'#886622'},
  ],
  items:[
    {id:'golden-egg',name:'Golden Egg',sprite:'gem',spriteColor:'#ffcc00',xo:200,yo:100,points:100},
    {id:'magic-seeds',name:'Magic Seeds',sprite:'potion',spriteColor:'#44aa22',xo:350,yo:310,points:140,challenge:true},
    {id:'horseshoe',name:'Lucky Horseshoe',sprite:'ring',spriteColor:'#ccaa44',xo:850,yo:320,points:130},
    {id:'farm-bell',name:'Farm Bell',sprite:'cup',spriteColor:'#ddaa00',xo:1200,yo:100,points:120,challenge:true},
    {id:'corn-crown',name:'Corn Crown',sprite:'ring',spriteColor:'#ddcc22',xo:1450,yo:330,points:150},
    {id:'milk-bottle',name:'Magic Milk',sprite:'potion',spriteColor:'#eeeeff',xo:2050,yo:320,points:120,challenge:true},
    {id:'tractor-key',name:'Tractor Key',sprite:'key',spriteColor:'#cc4422',xo:2400,yo:100,points:160},
    {id:'scarecrow-hat',name:'Scarecrow Hat',sprite:'skull',spriteColor:'#aa8844',xo:2560,yo:310,points:110},
  ],
  drawBg(ctx,W,H,camX,gY,f){
    ctx.fillStyle='#88ccff';ctx.fillRect(0,0,W,H*0.4);ctx.fillStyle='#66aadd';ctx.fillRect(0,H*0.4,W,H*0.2);ctx.fillStyle='#2a4a18';ctx.fillRect(0,H*0.6,W,H*0.4);
    // Sun
    ctx.fillStyle='#ffee44';ctx.fillRect(W*0.85-16,20,32,32);ctx.fillStyle='rgba(255,238,68,0.04)';ctx.fillRect(W*0.85-30,10,60,54);
    // Clouds (big, moving)
    for(let i=0;i<5;i++){const cx2=(i*400+f*0.3-camX*0.05)%(W+200)-100,cy2=30+i*25;ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(cx2,cy2,60,16);ctx.fillRect(cx2+10,cy2-8,40,10);ctx.fillRect(cx2+15,cy2+14,30,8)}
    // Barn silhouettes
    const bo=camX*0.12;for(let i=0;i<3;i++){const bx=i*1000+200-(bo%(1000*3));if(bx<-80||bx>W+80)continue;ctx.fillStyle='rgba(140,40,30,0.2)';ctx.fillRect(bx,gY-70,60,70);ctx.fillRect(bx+10,gY-90,40,25);ctx.fillRect(bx+22,gY-100,16,12);ctx.fillStyle='rgba(100,30,20,0.15)';ctx.fillRect(bx+20,gY-40,20,40)}
    // Cows (pixel art, walking slowly)
    for(let i=0;i<3;i++){const cx3=(i*800+f*0.2)%(W+100)-50,cy3=gY-18;ctx.fillStyle='rgba(240,240,240,0.15)';ctx.fillRect(cx3,cy3,20,12);ctx.fillRect(cx3-4,cy3+10,6,6);ctx.fillRect(cx3+18,cy3+10,6,6);ctx.fillRect(cx3+16,cy3-4,8,6);ctx.fillStyle='rgba(60,40,30,0.12)';ctx.fillRect(cx3+4,cy3+2,6,4);ctx.fillRect(cx3+12,cy3+4,4,3)}
    // Chickens pecking
    for(let i=0;i<5;i++){const ckx=(i*500+300-camX*0.2)%(W+60)-30,cky=gY-10;const peck=Math.sin(f*0.1+i*2)>0.5;ctx.fillStyle='rgba(230,200,150,0.2)';ctx.fillRect(ckx,cky-(peck?2:0),8,6);ctx.fillRect(ckx+6,cky-4-(peck?2:0),4,4);ctx.fillStyle='rgba(220,160,40,0.15)';ctx.fillRect(ckx+9,cky-2-(peck?2:0),3,2)}
    // Haystacks
    const ho=camX*0.18;for(let i=0;i<6;i++){const hx=i*500+100-(ho%(500*6));if(hx<-30||hx>W+30)continue;ctx.fillStyle='rgba(200,180,80,0.12)';ctx.fillRect(hx,gY-20,24,20);ctx.fillRect(hx+4,gY-26,16,8)}
  }
},
{
  id:'mario-world',name:'Mushroom Kingdom',icon:'\u{1F344}',description:'Jump through pipes and clouds!',
  difficulty:'Medium',worldWidth:3200,gravity:0.5,jumpForce:14,
  colors:{sky:'#1a1628',ground:'#aa5522',groundDk:'#883310',plat:'#22aa44',platTop:'#44cc66',platEdge:'#188830',brick:'#cc7744'},
  platforms:[
    {x:120,yo:70,w:150,h:16},{x:380,yo:90,w:140,h:16},{x:630,yo:70,w:150,h:16},{x:880,yo:100,w:140,h:16},{x:1150,yo:80,w:160,h:16},{x:1400,yo:70,w:140,h:16},{x:1680,yo:90,w:150,h:16},{x:1930,yo:80,w:140,h:16},{x:2200,yo:70,w:150,h:16},{x:2500,yo:90,w:140,h:16},{x:2800,yo:80,w:150,h:16},
    {x:260,yo:180,w:150,h:16},{x:660,yo:190,w:140,h:16},{x:1060,yo:180,w:160,h:16},{x:1460,yo:190,w:140,h:16},{x:1860,yo:180,w:150,h:16},{x:2350,yo:190,w:140,h:16},{x:2700,yo:180,w:150,h:16},
    {x:200,yo:300,w:170,h:16},{x:750,yo:310,w:160,h:16},{x:1400,yo:320,w:170,h:16},{x:2000,yo:310,w:160,h:16},{x:2550,yo:300,w:170,h:16},
  ],
  ladders:[{x:330,yo:0,h:300},{x:830,yo:0,h:310},{x:1470,yo:0,h:320},{x:2070,yo:0,h:310},{x:2620,yo:0,h:300}],
  movingPlatforms:[{x:500,yo:140,w:80,h:16,range:100,speed:0.8},{x:1700,yo:240,w:80,h:16,range:90,speed:0.7},{x:2450,yo:200,w:80,h:16,range:80,speed:0.9}],
  powerups:[{x:500,yo:200},{x:1850,yo:310}],
  obstacles:[
    {type:'spike',x:520,yo:0,w:48},{type:'spike',x:1300,yo:0,w:48},{type:'spike',x:2100,yo:0,w:48},{type:'spike',x:2900,yo:0,w:48},
    {type:'enemy',x:700,yo:0,range:140,speed:0.9,color:'#885522'},{type:'enemy',x:1550,yo:0,range:120,speed:1,color:'#885522'},{type:'enemy',x:2400,yo:0,range:100,speed:0.8,color:'#885522'},
  ],
  items:[
    {id:'fire-flower',name:'Fire Flower',sprite:'gem',spriteColor:'#ff4422',xo:200,yo:100,points:120},
    {id:'super-star',name:'Super Star',sprite:'orb',spriteColor:'#ffcc00',xo:330,yo:320,points:160,challenge:true},
    {id:'warp-whistle',name:'Warp Whistle',sprite:'music',spriteColor:'#88ccff',xo:830,yo:330,points:140},
    {id:'magic-mushroom',name:'Magic Mushroom',sprite:'potion',spriteColor:'#ff4444',xo:1200,yo:100,points:130,challenge:true},
    {id:'koopa-shell',name:'Koopa Shell',sprite:'gem',spriteColor:'#44cc44',xo:1470,yo:340,points:150},
    {id:'princess-crown',name:'Princess Crown',sprite:'cup',spriteColor:'#ffaacc',xo:2070,yo:330,points:170,challenge:true},
    {id:'pipe-key',name:'Pipe Key',sprite:'key',spriteColor:'#44aa44',xo:2400,yo:100,points:120},
    {id:'coin-block',name:'Coin Block',sprite:'gem',spriteColor:'#ffcc00',xo:2600,yo:320,points:140},
  ],
  drawBg(ctx,W,H,camX,gY,f){
    ctx.fillStyle='#6688ff';ctx.fillRect(0,0,W,H*0.5);ctx.fillStyle='#5577ee';ctx.fillRect(0,H*0.5,W,H*0.5);
    // Big clouds
    for(let i=0;i<6;i++){const cx2=(i*350+f*0.2-camX*0.04)%(W+200)-100,cy2=20+i*20+Math.sin(i*2)*15;ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(cx2+10,cy2,40,14);ctx.fillRect(cx2,cy2+6,60,14);ctx.fillRect(cx2+8,cy2+16,44,8)}
    // Hills (layered)
    const ho=camX*0.08;for(let i=0;i<10;i++){const hx=i*350-(ho%(350*10));ctx.fillStyle='rgba(60,140,60,0.15)';ctx.fillRect(hx-40,gY-30,120,30);ctx.fillRect(hx-20,gY-50,80,25);ctx.fillRect(hx,gY-60,40,15)}
    // Big green pipes
    const pOff=camX*0.2;for(let i=0;i<5;i++){const ppx=i*650+100-(pOff%(650*5));if(ppx<-40||ppx>W+40)continue;const ph=40+i%2*20;ctx.fillStyle='#22aa44';ctx.fillRect(ppx,gY-ph,30,ph);ctx.fillStyle='#44cc66';ctx.fillRect(ppx-4,gY-ph,38,10);ctx.fillStyle='#188830';ctx.fillRect(ppx,gY-ph+10,4,ph-10)}
    // Question blocks floating (animated)
    for(let i=0;i<4;i++){const qx=(i*700+200-camX*0.15)%(W+100)-50;const qy=gY-140-Math.sin(f*0.02+i)*8;const shine=Math.floor(f/15)%2;ctx.fillStyle=shine?'#ffcc00':'#ddaa00';ctx.fillRect(qx,qy,20,20);ctx.fillStyle='#aa8800';ctx.fillRect(qx+2,qy+2,16,16);ctx.fillStyle=shine?'#ffcc00':'#ddaa00';ctx.font='10px "Press Start 2P"';ctx.textAlign='center';ctx.fillText('?',qx+10,qy+15);ctx.textAlign='start'}
    // Goombas walking (background, decorative)
    for(let i=0;i<3;i++){const gx=(i*900+f*0.3)%(W+60)-30;ctx.fillStyle='rgba(140,80,40,0.15)';ctx.fillRect(gx,gY-14,14,14);ctx.fillStyle='rgba(100,60,30,0.12)';ctx.fillRect(gx+2,gY-18,10,6);ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect(gx+2,gY-10,4,3);ctx.fillRect(gx+8,gY-10,4,3)}
  }
},
{
  id:'trump-world',name:'Trump Tower',icon:'\u{1F3E2}',description:'The biggest, most tremendous world!',
  difficulty:'Hard',worldWidth:3400,gravity:0.5,jumpForce:14,
  colors:{sky:'#1a1520',ground:'#8a7030',groundDk:'#6a5020',plat:'#cc9944',platTop:'#eebb55',platEdge:'#aa7722',brick:'#bb8833'},
  platforms:[
    {x:150,yo:70,w:150,h:16},{x:420,yo:90,w:160,h:16},{x:680,yo:70,w:140,h:16},{x:940,yo:100,w:150,h:16},{x:1200,yo:80,w:140,h:16},{x:1460,yo:70,w:150,h:16},{x:1720,yo:90,w:140,h:16},{x:1980,yo:80,w:160,h:16},{x:2240,yo:70,w:140,h:16},{x:2500,yo:90,w:150,h:16},{x:2780,yo:80,w:140,h:16},{x:3050,yo:70,w:150,h:16},
    {x:280,yo:180,w:160,h:16},{x:720,yo:190,w:150,h:16},{x:1100,yo:180,w:160,h:16},{x:1550,yo:190,w:150,h:16},{x:1950,yo:180,w:160,h:16},{x:2400,yo:190,w:150,h:16},{x:2900,yo:180,w:160,h:16},
    {x:220,yo:310,w:180,h:16},{x:780,yo:320,w:170,h:16},{x:1350,yo:330,w:180,h:16},{x:1900,yo:320,w:170,h:16},{x:2500,yo:310,w:180,h:16},{x:3000,yo:320,w:160,h:16},
  ],
  ladders:[{x:360,yo:0,h:310},{x:860,yo:0,h:320},{x:1430,yo:0,h:330},{x:1970,yo:0,h:320},{x:2570,yo:0,h:310},{x:3070,yo:0,h:320}],
  movingPlatforms:[{x:560,yo:150,w:80,h:16,range:100,speed:0.9},{x:1650,yo:260,w:80,h:16,range:80,speed:0.8},{x:2700,yo:200,w:80,h:16,range:90,speed:1}],
  powerups:[{x:600,yo:200},{x:1750,yo:330},{x:2800,yo:310}],
  obstacles:[
    {type:'spike',x:550,yo:0,w:48},{type:'spike',x:900,yo:0,w:48},{type:'spike',x:1350,yo:0,w:48},{type:'spike',x:1750,yo:0,w:48},{type:'spike',x:2200,yo:0,w:48},{type:'spike',x:2700,yo:0,w:32},{type:'spike',x:3150,yo:0,w:48},
    {type:'enemy',x:600,yo:0,range:130,speed:0.9,color:'#cc8844'},{type:'enemy',x:1200,yo:0,range:110,speed:1,color:'#cc8844'},{type:'enemy',x:1850,yo:0,range:120,speed:0.8,color:'#cc8844'},{type:'enemy',x:2500,yo:0,range:100,speed:1,color:'#cc8844'},{type:'enemy',x:3000,yo:0,range:90,speed:0.9,color:'#cc8844'},
  ],
  items:[
    {id:'golden-toilet',name:'Golden Toilet',sprite:'cup',spriteColor:'#ffcc00',xo:350,yo:340,points:150},
    {id:'wall-brick',name:'Wall Brick',sprite:'gem',spriteColor:'#cc6644',xo:860,yo:350,points:130,challenge:true},
    {id:'tax-scroll',name:'Tax Returns',sprite:'scroll',spriteColor:'#44aa44',xo:1200,yo:210,points:160},
    {id:'covfefe-potion',name:'Covfefe Potion',sprite:'potion',spriteColor:'#885522',xo:1430,yo:360,points:140,challenge:true},
    {id:'big-mac',name:'Big Mac',sprite:'ring',spriteColor:'#ff8844',xo:1970,yo:110,points:170},
    {id:'twitter-bird',name:'Twitter Bird',sprite:'feather',spriteColor:'#44aaff',xo:2000,yo:350,points:120,challenge:true},
    {id:'hair-piece',name:'The Hair',sprite:'feather',spriteColor:'#ffcc44',xo:2570,yo:340,points:200},
    {id:'fake-news',name:'Fake News',sprite:'scroll',spriteColor:'#ff4444',xo:3070,yo:350,points:130},
  ],
  drawBg(ctx,W,H,camX,gY,f){
    ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
    // American flag banners (large, waving)
    const fo=camX*0.08;for(let i=0;i<6;i++){const fx=i*550+50-(fo%(550*6));if(fx<-50||fx>W+50)continue;const wave=Math.sin(f*0.02+i)*3;
      // Pole
      ctx.fillStyle='rgba(180,180,180,0.12)';ctx.fillRect(fx,H*0.02,3,H*0.25);
      // Flag
      const fy=H*0.04+wave;ctx.fillStyle='rgba(200,40,40,0.12)';ctx.fillRect(fx+3,fy,36,4);ctx.fillRect(fx+3,fy+8,36,4);ctx.fillRect(fx+3,fy+16,36,4);
      ctx.fillStyle='rgba(240,240,240,0.1)';ctx.fillRect(fx+3,fy+4,36,4);ctx.fillRect(fx+3,fy+12,36,4);
      ctx.fillStyle='rgba(40,60,120,0.15)';ctx.fillRect(fx+3,fy,16,12)}
    // City skyline
    const bo=camX*0.1;for(let i=0;i<15;i++){const bx=i*250-(bo%(250*15));if(bx<-60||bx>W+60)continue;const bh=60+Math.sin(i*3.7)*40;
      ctx.fillStyle='rgba(40,30,20,0.3)';ctx.fillRect(bx,gY-bh,40+i%3*10,bh);ctx.fillStyle='rgba(255,200,80,0.08)';for(let wy=gY-bh+8;wy<gY-8;wy+=12)for(let wx=bx+4;wx<bx+36+i%3*10;wx+=10)ctx.fillRect(wx,wy,5,6)}
    // White House silhouette (far background)
    const whx=W*0.25-camX*0.03;ctx.fillStyle='rgba(200,200,200,0.06)';ctx.fillRect(whx-40,gY-70,80,70);ctx.fillRect(whx-30,gY-80,60,12);
    ctx.fillRect(whx-10,gY-95,20,18);ctx.fillRect(whx-5,gY-100,10,8);// dome
    ctx.fillRect(whx-50,gY-55,10,55);ctx.fillRect(whx+40,gY-55,10,55);// columns
    // TRUMP TOWER (big, gold)
    const ttx=W*0.55-camX*0.05;ctx.fillStyle='rgba(180,140,60,0.15)';ctx.fillRect(ttx-35,gY-200,70,200);ctx.fillRect(ttx-45,gY-210,90,15);ctx.fillRect(ttx-30,gY-220,60,12);
    ctx.fillStyle='rgba(255,200,80,0.06)';for(let wy=gY-190;wy<gY-10;wy+=10)ctx.fillRect(ttx-28,wy,56,5);
    ctx.fillStyle='rgba(255,204,0,0.12)';ctx.font='8px "Press Start 2P"';ctx.textAlign='center';ctx.fillText('TRUMP',ttx,gY-215);ctx.textAlign='start';
    // Bald eagles soaring
    for(let i=0;i<3;i++){const ex=(i*900+f*0.6)%(W+150)-75,ey=H*0.06+Math.sin(f*0.008+i*2)*20;
      const wing=Math.sin(f*0.05+i)*10;ctx.fillStyle='rgba(60,40,20,0.2)';ctx.fillRect(ex,ey,14,6);ctx.fillRect(ex-12-wing,ey-2,12,4);ctx.fillRect(ex+14+wing,ey-2,12,4);
      ctx.fillStyle='rgba(240,240,240,0.15)';ctx.fillRect(ex+12,ey-2,6,4)}// white head
    // Flying dollar bills
    for(let i=0;i<8;i++){const dx=(i*400+f*0.8)%(W+100)-50,dy=H*0.1+Math.sin(f*0.01+i*2)*H*0.2;
      ctx.fillStyle='rgba(80,160,80,0.1)';ctx.fillRect(dx,dy,18,10);ctx.fillStyle='rgba(60,120,60,0.07)';ctx.fillRect(dx+2,dy+2,14,6);ctx.fillStyle='rgba(100,180,100,0.08)';ctx.fillRect(dx+7,dy+3,4,4)}
    // Red ties falling
    for(let i=0;i<5;i++){const tx2=(i*550+f*0.5)%(W+60)-30,ty=gY-40-Math.sin(f*0.008+i*3)*30;
      ctx.fillStyle='rgba(200,40,40,0.1)';ctx.fillRect(tx2,ty,6,20);ctx.fillRect(tx2+1,ty+20,4,10)}
    // MAGA hats floating
    for(let i=0;i<3;i++){const mx=(i*700+f*0.4+200)%(W+80)-40,my=H*0.15+Math.sin(f*0.009+i*2.5)*H*0.15;
      ctx.fillStyle='rgba(200,40,40,0.12)';ctx.fillRect(mx,my,16,8);ctx.fillRect(mx-4,my+6,24,4);
      ctx.fillStyle='rgba(240,240,240,0.06)';ctx.font='3px "Press Start 2P"';ctx.textAlign='center';ctx.fillText('MAGA',mx+8,my+6);ctx.textAlign='start'}
    // Twitter birds
    for(let i=0;i<3;i++){const tbx=(i*800+f*1.2)%(W+100)-50,tby=H*0.08+Math.sin(f*0.015+i*2.5)*25;
      ctx.fillStyle='rgba(68,170,255,0.15)';ctx.fillRect(tbx,tby,10,8);ctx.fillRect(tbx+8,tby+2,6,4);const wing=Math.sin(f*0.08+i)*4;ctx.fillRect(tbx+2,tby-4-wing,6,4)}
    // Fireworks (occasional)
    if(Math.sin(f*0.007)>0.9){const fwx=W*0.3+Math.sin(f*0.1)*100,fwy=H*0.15;
      ctx.fillStyle='rgba(255,80,80,0.1)';for(let s=0;s<6;s++){const a=s*Math.PI/3+f*0.05;ctx.fillRect(fwx+Math.cos(a)*15,fwy+Math.sin(a)*15,4,4)}}
    if(Math.sin(f*0.009+1)>0.9){const fwx=W*0.7+Math.sin(f*0.08)*80,fwy=H*0.12;
      ctx.fillStyle='rgba(80,80,255,0.1)';for(let s=0;s<6;s++){const a=s*Math.PI/3+f*0.04;ctx.fillRect(fwx+Math.cos(a)*12,fwy+Math.sin(a)*12,4,4)}}
  }
},
];

// ============================================
// PLATFORMER ENGINE
// ============================================
class PlatformerEngine {
  constructor(container,app){
    this.container=container;this.app=app;
    this.canvas=document.createElement('canvas');this.canvas.className='game-canvas';this.canvas.tabIndex=1;
    this.ctx=this.canvas.getContext('2d');
    this.player=null;this.world=null;this.platforms=[];this.items=[];this.obstacles=[];this.ladders=[];this.powerups=[];this.movPlats=[];this.coins=[];
    this.door=null;this.doorOpen=false;this.camera={x:0,y:0};this.keys={};
    this.running=false;this.paused=false;this.foundItems=new Set();
    this.frame=0;this.W=960;this.H=540;this.groundY=490;
    this.floatingTexts=[];this.enteringDoor=false;
    this.challengeCooldown=0;this.lastChallengeId=null;
    this.shakeTimer=0;this.coinCount=0;
    this._onKey=this._onKey.bind(this);this._loop=this._loop.bind(this);
  }
  mount(){this.container.innerHTML='';this.container.appendChild(this.canvas);this.resize();window.addEventListener('resize',()=>this.resize());window.addEventListener('keydown',this._onKey);window.addEventListener('keyup',this._onKey);this.canvas.focus()}
  unmount(){window.removeEventListener('keydown',this._onKey);window.removeEventListener('keyup',this._onKey);this.running=false}
  resize(){const r=this.container.getBoundingClientRect();const dpr=window.devicePixelRatio||1;this.W=r.width;this.H=r.height;this.canvas.width=this.W*dpr;this.canvas.height=this.H*dpr;this.canvas.style.width=this.W+'px';this.canvas.style.height=this.H+'px';this.ctx.setTransform(dpr,0,0,dpr,0,0);this.groundY=this.H-60}
  _onKey(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();const d=e.type==='keydown';if(e.key==='ArrowLeft'||e.key==='a')this.keys.left=d;if(e.key==='ArrowRight'||e.key==='d')this.keys.right=d;if(e.key==='ArrowUp'||e.key==='w')this.keys.up=d;if(e.key==='ArrowDown'||e.key==='s')this.keys.down=d;if(e.key===' ')this.keys.space=d}

  startWorld(wd,co){
    this.world=wd;this.foundItems=new Set();this.doorOpen=false;this.enteringDoor=false;
    this.floatingTexts=[];this.frame=0;this.keys={};this.challengeCooldown=0;this.lastChallengeId=null;this.shakeTimer=0;this.coinCount=0;
    this.platforms=wd.platforms.map(p=>({x:p.x,y:this.groundY-p.yo,w:p.w,h:p.h}));
    this.items=wd.items.map(i=>({...i,x:i.xo,y:this.groundY-i.yo,size:28,collected:false}));
    this.obstacles=wd.obstacles.map(o=>({...o,y:this.groundY-(o.yo||0),cx:o.x,dir:1,dead:false,squishTimer:0}));
    this.ladders=(wd.ladders||[]).map(l=>({x:l.x,y:this.groundY-l.yo-l.h,w:24,h:l.h}));
    this.powerups=(wd.powerups||[]).map(pu=>({x:pu.x,y:this.groundY-pu.yo,collected:false}));
    this.movPlats=(wd.movingPlatforms||[]).map(mp=>({...mp,startX:mp.x,y:this.groundY-mp.yo,cx:mp.x,dx:0}));
    // Generate coins
    this.coins=[];
    for(let x=100;x<wd.worldWidth-100;x+=55+Math.floor(Math.random()*25)){
      let safe=true;for(const o of wd.obstacles)if(Math.abs(x-o.x)<50){safe=false;break}
      if(safe)this.coins.push({x,y:this.groundY-18,collected:false});
    }
    this.platforms.forEach(p=>{for(let x=p.x+12;x<p.x+p.w-12;x+=40)this.coins.push({x,y:p.y-16,collected:false})});
    this.door={x:wd.worldWidth-80,y:this.groundY-72,w:48,h:72};
    this.player={x:60,y:this.groundY-50,vx:0,vy:0,width:30,height:48,onGround:false,onLadder:false,facing:1,walkFrame:0,climbFrame:0,
      lives:3,starTimer:0,invincible:0,dying:false,dyingTimer:0,opts:co};
    this.camera={x:0,y:0};this.running=true;this.paused=false;this.canvas.focus();this._loop();
  }
  stop(){this.running=false}
  pause(){this.paused=true}
  resume(){this.paused=false;this.canvas.focus()}

  _loop(){if(!this.running)return;if(!this.paused)this._update();this._render();this.frame++;requestAnimationFrame(this._loop)}

  _update(){
    const p=this.player,w=this.world;if(this.enteringDoor)return;
    // Death animation
    if(p.dying){p.dyingTimer++;p.vy+=0.5;p.y+=p.vy;if(p.dyingTimer>70){p.dying=false;if(p.lives>0){p.x=60;p.y=this.groundY-50;p.vx=0;p.vy=0;p.onLadder=false;p.invincible=60;this.camera.x=0}else{this.running=false;this.app.showGameOver()}}return}
    // Invincibility timers
    if(p.starTimer>0)p.starTimer--;
    if(p.invincible>0)p.invincible--;
    // Shake
    if(this.shakeTimer>0)this.shakeTimer--;
    // Moving platforms
    this.movPlats.forEach(mp=>{const prev=mp.cx;mp.cx=mp.startX+Math.sin(this.frame*mp.speed*0.03)*mp.range;mp.dx=mp.cx-prev});
    // Ladder check
    let touchingLadder=null;const pcx=p.x+p.width/2;
    for(const ld of this.ladders){if(pcx>ld.x-4&&pcx<ld.x+ld.w+4&&p.y+p.height>ld.y&&p.y<ld.y+ld.h){touchingLadder=ld;break}}
    if(touchingLadder&&(this.keys.up||this.keys.down)&&!p.onLadder){p.onLadder=true;p.vy=0;p.vx=0;p.x=touchingLadder.x+touchingLadder.w/2-p.width/2}
    if(p.onLadder){if(this.keys.space){p.onLadder=false;p.vy=-10;sound.playJump()}else if((this.keys.left||this.keys.right)&&!this.keys.up&&!this.keys.down)p.onLadder=false;else if(!touchingLadder)p.onLadder=false}
    if(p.onLadder){
      const cs=3.5;if(this.keys.up){p.y-=cs;p.climbFrame++}else if(this.keys.down){p.y+=cs;p.climbFrame++}else p.climbFrame=0;
      p.vx=0;p.vy=0;p.onGround=false;
      if(touchingLadder){if(p.y<=touchingLadder.y-p.height){p.y=touchingLadder.y-p.height;p.onLadder=false;p.onGround=true}if(p.y+p.height>touchingLadder.y+touchingLadder.h){p.y=touchingLadder.y+touchingLadder.h-p.height;p.onLadder=false;p.onGround=true}}
    }else{
      const spd=5;if(this.keys.left){p.vx=-spd;p.facing=-1}else if(this.keys.right){p.vx=spd;p.facing=1}else{p.vx*=0.7;if(Math.abs(p.vx)<0.3)p.vx=0}
      if(this.keys.space&&p.onGround){p.vy=-(w.jumpForce||14);p.onGround=false;sound.playJump()}
      if(!this.keys.space&&p.vy<-4)p.vy*=0.85;
      p.vy+=(w.gravity||0.5);if(p.vy>14)p.vy=14;
      p.x+=p.vx;if(p.x<0){p.x=0;p.vx=0}if(p.x>w.worldWidth-p.width){p.x=w.worldWidth-p.width;p.vx=0}
      const prevBot=p.y+p.height;p.y+=p.vy;p.onGround=false;
      if(p.y+p.height>this.groundY){p.y=this.groundY-p.height;p.vy=0;p.onGround=true}
      // Static platforms
      for(const pl of this.platforms){const tol=Math.max(4,Math.abs(p.vy)+2);if(p.vy>=0&&prevBot<=pl.y+tol&&p.y+p.height>pl.y&&p.x+p.width>pl.x+4&&p.x<pl.x+pl.w-4){p.y=pl.y-p.height;p.vy=0;p.onGround=true;break}}
      // Moving platforms
      for(const mp of this.movPlats){const tol=Math.max(4,Math.abs(p.vy)+2);if(p.vy>=0&&prevBot<=mp.y+tol&&p.y+p.height>mp.y&&p.x+p.width>mp.cx+4&&p.x<mp.cx+mp.w-4){p.y=mp.y-p.height;p.vy=0;p.onGround=true;p.x+=mp.dx;break}}
      if(p.y>this.H+50){p.x=60;p.y=0;p.vy=0}
    }
    if(p.onGround&&Math.abs(p.vx)>0.5)p.walkFrame++;else if(p.onGround)p.walkFrame=0;
    // Enemies
    this.obstacles.forEach(o=>{if(o.type==='enemy'&&!o.dead){o.cx+=o.speed*o.dir;if(o.cx>o.x+o.range||o.cx<o.x)o.dir*=-1}if(o.squishTimer>0)o.squishTimer--});
    // Obstacle collision
    if(p.invincible<=0&&p.starTimer<=0){
      const prevBot=p.y+p.height;
      for(const o of this.obstacles){
        if(o.dead)continue;let ox,oy,ow,oh;
        if(o.type==='spike'){ox=o.x;oy=o.y-14;ow=o.w;oh=14}else{ox=o.cx;oy=o.y-24;ow=24;oh=24}
        if(p.x+p.width>ox+4&&p.x<ox+ow-4&&p.y+p.height>oy+4&&p.y<oy+oh-4){
          // Enemy stomp check
          if(o.type==='enemy'&&p.vy>0&&p.y+p.height-p.vy<=oy+6){
            o.dead=true;o.squishTimer=20;p.vy=-9;sound.playStomp();
            this.app.addScore(50);this.floatingTexts.push({text:'+50',x:o.cx+8,y:oy-10,alpha:1,life:60,maxLife:60,scale:0.5});
          }else{this._takeHit();break}
        }
      }
    }else if(p.starTimer>0){
      // Invincible from star - destroy enemies on contact
      for(const o of this.obstacles){if(o.dead||o.type==='spike')continue;const ox=o.cx,oy=o.y-24;
        if(p.x+p.width>ox+2&&p.x<ox+26&&p.y+p.height>oy+2&&p.y<oy+26){o.dead=true;o.squishTimer=20;sound.playStomp();this.app.addScore(50);this.floatingTexts.push({text:'+50',x:o.cx+8,y:oy-10,alpha:1,life:60,maxLife:60,scale:0.5})}}
    }
    // Coins
    for(const coin of this.coins){if(coin.collected)continue;if(p.x+p.width>coin.x&&p.x<coin.x+10&&p.y+p.height>coin.y&&p.y<coin.y+10){coin.collected=true;this.coinCount++;sound.playCoin();this.app.addScore(10)}}
    // Items
    if(this.challengeCooldown>0){this.challengeCooldown--}else{
      if(this.lastChallengeId){const last=this.items.find(i=>i.id===this.lastChallengeId);if(last){const m=12;if(p.x+p.width<last.x-m||p.x>last.x+last.size+m||p.y+p.height<last.y-m||p.y>last.y+last.size+m)this.lastChallengeId=null}else this.lastChallengeId=null}
      for(const item of this.items){
        if(item.collected||this.foundItems.has(item.id)||item.id===this.lastChallengeId)continue;
        const hb=2;if(p.x+p.width>item.x-hb&&p.x<item.x+item.size+hb&&p.y+p.height>item.y-hb&&p.y<item.y+item.size+hb){
          if(item.challenge){this.lastChallengeId=item.id;this.pause();this.app.showChallenge(item)}
          else{this._collectItem(item)}
          break;
        }
      }
    }
    // Powerups
    for(const pu of this.powerups){if(pu.collected)continue;if(p.x+p.width>pu.x&&p.x<pu.x+32&&p.y+p.height>pu.y&&p.y<pu.y+24){pu.collected=true;p.starTimer=300;sound.playPowerup();this.floatingTexts.push({text:'INVINCIBLE!',x:pu.x,y:pu.y-16,alpha:1,life:70,maxLife:70,scale:0.5})}}
    // Door
    if(this.doorOpen&&!this.enteringDoor){const d=this.door;if(p.x+p.width>d.x+8&&p.x<d.x+d.w-8&&p.y+p.height>d.y&&p.y<d.y+d.h){this.enteringDoor=true;sound.playDoor();setTimeout(()=>{this.running=false;this.app.completeWorld()},800)}}
    // Camera (horizontal + vertical)
    const tx=p.x-this.W/2+p.width/2;this.camera.x+=(tx-this.camera.x)*0.08;this.camera.x=Math.max(0,Math.min(w.worldWidth-this.W,this.camera.x));
    const ty=p.y-this.H*0.45;this.camera.y+=(ty-this.camera.y)*0.06;this.camera.y=Math.min(0,Math.max(-(this.H*0.4),this.camera.y));
    // Texts
    this.floatingTexts=this.floatingTexts.filter(ft=>{ft.y-=1;ft.life--;const half=ft.maxLife/2;ft.alpha=ft.life>half?1:(ft.life/half);ft.scale=(ft.scale||1)+(ft.life>half?0.02:-0.01);return ft.life>0});
  }

  _collectItem(item){item.collected=true;this.foundItems.add(item.id);sound.playFind();this.app.onItemCollected(item);this.floatingTexts.push({text:`+${item.points}`,x:item.x,y:item.y-10,alpha:1,life:60,maxLife:60,scale:0.5});if(this.foundItems.size===this.world.items.length){this.doorOpen=true;sound.playSuccess();this.floatingTexts.push({text:'DOOR OPEN!',x:this.door.x-30,y:this.door.y-20,alpha:1,life:80,maxLife:80,scale:0.5})}}
  collectChallengeItem(id){const item=this.items.find(i=>i.id===id);if(item)this._collectItem(item);this.lastChallengeId=null;this.challengeCooldown=20;this.resume()}
  skipChallenge(){this.challengeCooldown=30;this.resume()}
  _takeHit(){
    const p=this.player;
    if(p.invincible>0||p.starTimer>0)return;
    p.lives--;this.app.updateLives(p.lives);
    p.dying=true;p.dyingTimer=0;p.vy=-8;p.vx=0;p.onLadder=false;
    this.shakeTimer=10;sound.playDeath();
  }
  wrongAnswer(){this._takeHit();this.resume()}

  // =========== RENDERING ===========
  _render(){
    const ctx=this.ctx,cam=this.camera,W=this.W,H=this.H,p=this.player;
    ctx.imageSmoothingEnabled=false;ctx.save();
    // Screen shake
    if(this.shakeTimer>0){const s=this.shakeTimer;ctx.translate(Math.sin(s*9)*s*0.5,Math.cos(s*7)*s*0.4)}
    // Vertical camera offset
    ctx.translate(0,-cam.y);
    ctx.clearRect(0,cam.y,W,H);
    // Background
    this.world.drawBg(ctx,W,H,cam.x,this.groundY,this.frame);
    // Ground
    const c=this.world.colors;
    ctx.fillStyle=c.ground;ctx.fillRect(0,this.groundY,W,H-this.groundY+Math.abs(cam.y)+60);
    ctx.fillStyle=c.groundDk;ctx.fillRect(0,this.groundY+6,W,H-this.groundY-6+Math.abs(cam.y)+60);
    ctx.fillStyle=c.platTop;ctx.fillRect(0,this.groundY,W,3);
    ctx.fillStyle=c.brick;const gx=-cam.x%32;for(let x=gx;x<W;x+=32){ctx.fillRect(x,this.groundY+8,1,40);ctx.fillRect(x,this.groundY+20,16,1)}
    // Platforms
    this.platforms.forEach(pl=>{const px=pl.x-cam.x;if(px+pl.w<-10||px>W+10)return;ctx.fillStyle=c.plat;ctx.fillRect(px,pl.y,pl.w,pl.h);ctx.fillStyle=c.platTop;ctx.fillRect(px,pl.y,pl.w,3);ctx.fillStyle=c.platEdge;ctx.fillRect(px,pl.y,2,pl.h);ctx.fillRect(px+pl.w-2,pl.y,2,pl.h);ctx.fillStyle=c.brick;for(let x=px+8;x<px+pl.w-4;x+=16)ctx.fillRect(x,pl.y+5,1,pl.h-6);ctx.fillRect(px+2,pl.y+Math.floor(pl.h/2),pl.w-4,1);ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(px+2,pl.y+pl.h,pl.w-2,3)});
    // Moving platforms (distinct color)
    this.movPlats.forEach(mp=>{const px=mp.cx-cam.x;if(px+mp.w<-10||px>W+10)return;ctx.fillStyle='#6060a0';ctx.fillRect(px,mp.y,mp.w,mp.h);ctx.fillStyle='#8080cc';ctx.fillRect(px,mp.y,mp.w,3);ctx.fillStyle='#4040706';ctx.fillRect(px,mp.y,2,mp.h);ctx.fillRect(px+mp.w-2,mp.y,2,mp.h);ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(px+2,mp.y+mp.h,mp.w-2,3)});
    // Ladders
    this.ladders.forEach(ld=>{const lx=ld.x-cam.x;if(lx+ld.w<-10||lx>W+10)return;ctx.fillStyle='#886633';ctx.fillRect(lx,ld.y,4,ld.h);ctx.fillRect(lx+ld.w-4,ld.y,4,ld.h);ctx.fillStyle='#aa8844';ctx.fillRect(lx+1,ld.y,1,ld.h);ctx.fillRect(lx+ld.w-3,ld.y,1,ld.h);ctx.fillStyle='#997744';for(let y=ld.y+8;y<ld.y+ld.h-4;y+=14){ctx.fillRect(lx+4,y,ld.w-8,3);ctx.fillStyle='#775522';ctx.fillRect(lx+4,y+3,ld.w-8,1);ctx.fillStyle='#997744'}});
    // Coins
    this.coins.forEach(cn=>{if(cn.collected)return;const cx2=cn.x-cam.x;if(cx2<-10||cx2>W+10)return;ctx.fillStyle='#ffcc00';ctx.fillRect(cx2+2,cn.y,6,1);ctx.fillRect(cx2+1,cn.y+1,8,1);ctx.fillRect(cx2,cn.y+2,10,5);ctx.fillRect(cx2+1,cn.y+7,8,1);ctx.fillRect(cx2+2,cn.y+8,6,1);ctx.fillStyle='#ffee88';ctx.fillRect(cx2+2,cn.y+2,2,2);ctx.fillStyle='#aa8800';ctx.fillRect(cx2+4,cn.y+3,2,3)});
    // Powerups
    this.powerups.forEach(pu=>{if(pu.collected)return;const px=pu.x-cam.x;if(px+32<-10||px>W+10)return;const f=Math.floor(this.frame/8)%4;ctx.fillStyle='#ffcc00';ctx.fillRect(px+12,pu.y,8,4);ctx.fillRect(px+8,pu.y+4,16,4);ctx.fillRect(px+4,pu.y+8,24,4);ctx.fillRect(px,pu.y+12,32,4);ctx.fillRect(px+8,pu.y+16,16,4);ctx.fillRect(px+4,pu.y+20,8,4);ctx.fillRect(px+20,pu.y+20,8,4);ctx.fillStyle='#ffee88';ctx.fillRect(px+14,pu.y+2,4,2);if(f<2){ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(px-2,pu.y-2,36,28)}});
    // Obstacles
    this.obstacles.forEach(o=>{
      if(o.type==='spike'){const sx=o.x-cam.x;if(sx+o.w<-10||sx>W+10)return;const cnt=Math.floor(o.w/16);for(let i=0;i<cnt;i++){ctx.fillStyle='#ff2040';const bx=sx+i*16;ctx.fillRect(bx+6,o.y-14,4,4);ctx.fillRect(bx+4,o.y-10,8,4);ctx.fillRect(bx+2,o.y-6,12,4);ctx.fillRect(bx,o.y-2,16,2);ctx.fillStyle='#ff6080';ctx.fillRect(bx+7,o.y-14,2,2)}}
      else{if(o.dead){if(o.squishTimer>0){const ex=o.cx-cam.x;ctx.fillStyle=o.color||'#ff4040';ctx.fillRect(ex,o.y-4,24,4);ctx.fillStyle='#fff';ctx.fillRect(ex+4,o.y-3,3,2);ctx.fillRect(ex+16,o.y-3,3,2)}return}
        const ex=o.cx-cam.x,ey=o.y-24;if(ex+24<-10||ex>W+10)return;const ec=o.color||'#ff4040';ctx.fillStyle=ec;ctx.fillRect(ex,ey,24,24);ctx.fillStyle=darken(ec,25);ctx.fillRect(ex,ey+18,24,6);ctx.fillStyle='#fff';ctx.fillRect(ex+4,ey+6,6,6);ctx.fillRect(ex+14,ey+6,6,6);ctx.fillStyle='#111';const pd=o.dir>0?3:0;ctx.fillRect(ex+4+pd,ey+8,3,4);ctx.fillRect(ex+14+pd,ey+8,3,4);ctx.fillStyle='#111';ctx.fillRect(ex+3,ey+4,7,2);ctx.fillRect(ex+14,ey+4,7,2);ctx.fillStyle=darken(ec,15);const ef=Math.floor(this.frame/10)%2;ctx.fillRect(ex+2,ey+24,8,3+ef*2);ctx.fillRect(ex+14,ey+24,8,3+(1-ef)*2)}
    });
    // Door
    const d=this.door,dx=d.x-cam.x;
    if(dx+d.w>=-10&&dx<=W+10){
      if(this.doorOpen){const on=Math.floor(this.frame/15)%2;ctx.fillStyle=on?'rgba(0,255,65,0.12)':'rgba(0,255,65,0.06)';ctx.fillRect(dx-8,d.y-8,d.w+16,d.h+8);ctx.fillStyle='#1a5a2a';ctx.fillRect(dx-4,d.y-4,d.w+8,d.h+4);ctx.fillStyle='#0a2a10';ctx.fillRect(dx,d.y,d.w,d.h);ctx.fillStyle='rgba(0,255,65,0.15)';ctx.fillRect(dx+4,d.y+4,d.w-8,d.h-4);const bounce=Math.floor(this.frame/20)%2*4;ctx.fillStyle='#00ff41';ctx.font='12px "Press Start 2P",monospace';ctx.textAlign='center';ctx.fillText('EXIT',dx+d.w/2,d.y-8+bounce);ctx.textAlign='start'}
      else{ctx.fillStyle='#4a3520';ctx.fillRect(dx-4,d.y-4,d.w+8,d.h+4);ctx.fillStyle='#6a5030';ctx.fillRect(dx,d.y,d.w,d.h);ctx.fillStyle='#5a4020';for(let y=d.y+8;y<d.y+d.h;y+=10)ctx.fillRect(dx+2,y,d.w-4,1);ctx.fillStyle='#888';ctx.fillRect(dx+d.w/2-5,d.y+d.h/2-3,10,8);ctx.fillStyle='#333';ctx.fillRect(dx+d.w/2-1,d.y+d.h/2-1,2,4);ctx.fillStyle='#ff4444';ctx.font='7px "Press Start 2P",monospace';ctx.textAlign='center';ctx.fillText('LOCKED',dx+d.w/2,d.y-6);ctx.textAlign='start'}
    }
    // Items (pixel art, scaled up)
    this.items.forEach(item=>{if(item.collected||this.foundItems.has(item.id))return;const ix=item.x-cam.x,iy=item.y;if(ix+item.size<-10||ix>W+10)return;
      // Challenge items get a golden border to mark them
      if(item.challenge){const blink=Math.floor(this.frame/20)%2;ctx.fillStyle=blink?'#ffcc00':'#aa8800';ctx.fillRect(ix-3,iy-3,item.size+6,item.size+6);ctx.fillStyle='#1a1a2a';ctx.fillRect(ix-1,iy-1,item.size+2,item.size+2)}
      // Draw the actual pixel sprite scaled to item size
      ctx.save();ctx.translate(ix,iy);const s=item.size/16;ctx.scale(s,s);
      drawPixelItem(ctx,0,0,item.sprite,item.spriteColor);
      ctx.restore();
    });
    // Player
    if(!p.dying||Math.floor(this.frame/3)%2===0){
      if(!(p.invincible>0&&Math.floor(this.frame/4)%2===0))this._drawPlayer(ctx,cam);
    }
    // Floating texts
    ctx.textAlign='center';
    this.floatingTexts.forEach(ft=>{ctx.globalAlpha=ft.alpha;const s=ft.scale||1;ctx.save();ctx.translate(ft.x-cam.x,ft.y);ctx.scale(s,s);ctx.font='bold 12px "Press Start 2P",monospace';ctx.fillStyle='#000';ctx.fillText(ft.text,1,1);ctx.fillStyle='#ffcc00';ctx.fillText(ft.text,0,0);ctx.restore()});
    ctx.globalAlpha=1;ctx.textAlign='start';
    // Door fade
    if(this.enteringDoor){ctx.fillStyle=`rgba(0,0,0,${Math.min(1,this.frame%1000*0.03)})`;ctx.fillRect(0,cam.y,W,H)}
    ctx.restore();
    // Controls hint (outside camera transform)
    if(this.frame<180){ctx.globalAlpha=Math.max(0,1-this.frame/180);ctx.fillStyle='rgba(0,0,0,0.7)';const bw=380,bh=40,bx=W/2-bw/2,by=H-100;ctx.fillRect(bx,by,bw,bh);ctx.strokeStyle='#444466';ctx.lineWidth=2;ctx.strokeRect(bx,by,bw,bh);ctx.fillStyle='#ffcc00';ctx.font='7px "Press Start 2P",monospace';ctx.textAlign='center';ctx.fillText('ARROWS:MOVE  SPACE:JUMP  \u{2191}\u{2193}:CLIMB  STOMP ENEMIES!',W/2,by+24);ctx.textAlign='start';ctx.globalAlpha=1}
  }

  _drawPlayer(ctx,cam){
    const p=this.player,opts=p.opts;
    const px=Math.round(p.x-cam.x),py=Math.round(p.y);
    ctx.save();ctx.translate(px+p.width/2,py);
    // Star invincibility: rainbow flash + scale
    if(p.starTimer>0){
      const rc=['#ff2040','#ffcc00','#00ff41','#4488ff','#cc44ff'][Math.floor(this.frame/3)%5];
      ctx.scale(p.facing*1.15,1.15);ctx.translate(0,-4);
      // Rainbow glow
      ctx.fillStyle=rc;ctx.globalAlpha=0.2;ctx.fillRect(-p.width/2-4,-2,p.width+8,p.height+4);ctx.globalAlpha=1;
      ctx.strokeStyle=rc;ctx.lineWidth=2;ctx.strokeRect(-p.width/2-3,-1,p.width+6,p.height+2);
    }else ctx.scale(p.facing,1);
    const ox=-p.width/2,skin=opts.skinTone,hair=opts.hairColor,cloth=opts.clothingColor;
    const isClimb=p.onLadder,isWalk=!isClimb&&p.onGround&&Math.abs(p.vx)>0.5,isJump=!isClimb&&!p.onGround;
    const wf=Math.floor(p.walkFrame/8)%2,cf=Math.floor(p.climbFrame/10)%2;
    if(p.onGround){ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(ox+3,p.height-1,p.width-6,3)}
    ctx.fillStyle='#2a2a4a';
    if(isClimb){if(cf===0){ctx.fillRect(ox+5,32,7,12);ctx.fillRect(ox+18,36,7,10)}else{ctx.fillRect(ox+5,36,7,10);ctx.fillRect(ox+18,32,7,12)}}
    else if(isWalk){if(wf===0){ctx.fillRect(ox+5,34,7,12);ctx.fillRect(ox+18,37,7,9)}else{ctx.fillRect(ox+5,37,7,9);ctx.fillRect(ox+18,34,7,12)}}
    else if(isJump){ctx.fillRect(ox+5,32,7,10);ctx.fillRect(ox+18,32,7,10)}
    else{ctx.fillRect(ox+5,34,7,12);ctx.fillRect(ox+18,34,7,12)}
    const shoeY=isJump?42:46;ctx.fillStyle='#1a1a2a';ctx.fillRect(ox+3,shoeY,9,3);ctx.fillRect(ox+18,shoeY,9,3);
    ctx.fillStyle=cloth;ctx.fillRect(ox+3,18,24,18);ctx.fillStyle=darken(cloth,20);ctx.fillRect(ox+3,30,24,6);ctx.fillStyle=lighten(cloth,15);ctx.fillRect(ox+5,18,20,3);
    const armOff=isClimb?(cf===0?-8:4):isWalk?(wf===0?-3:3):0;const armJ=isClimb?-4:isJump?-6:0;
    ctx.fillStyle=skin;ctx.fillRect(ox-1,22+armOff+armJ,5,9);ctx.fillRect(ox+26,22-armOff+armJ,5,9);
    ctx.fillStyle=skin;ctx.fillRect(ox+10,14,10,6);ctx.fillRect(ox+4,2,22,14);ctx.fillStyle=darken(skin,10);ctx.fillRect(ox+4,12,22,4);
    ctx.fillStyle='#fff';ctx.fillRect(ox+8,7,5,5);ctx.fillRect(ox+17,7,5,5);ctx.fillStyle=opts.eyeColor;ctx.fillRect(ox+10,8,3,4);ctx.fillRect(ox+19,8,3,4);ctx.fillStyle='#111';ctx.fillRect(ox+11,9,2,3);ctx.fillRect(ox+20,9,2,3);ctx.fillStyle='rgba(255,255,255,0.7)';ctx.fillRect(ox+11,8,1,1);ctx.fillRect(ox+20,8,1,1);
    ctx.fillStyle=darken(skin,25);ctx.fillRect(ox+11,13,8,1);ctx.fillRect(ox+10,12,1,1);ctx.fillRect(ox+19,12,1,1);
    ctx.fillStyle=hair;const hs=opts.hairStyle;
    if(hs!=='bald'){ctx.fillRect(ox+3,-1,24,5);ctx.fillRect(ox+5,-3,20,4);ctx.fillStyle=lighten(hair,20);ctx.fillRect(ox+8,-2,12,2);ctx.fillStyle=hair;
      if(hs==='short'){ctx.fillRect(ox+2,0,3,8);ctx.fillRect(ox+25,0,3,8)}if(hs==='medium'){ctx.fillRect(ox+1,0,4,14);ctx.fillRect(ox+25,0,4,14)}if(hs==='long'){ctx.fillRect(ox,0,4,20);ctx.fillRect(ox+26,0,4,20)}if(hs==='curly'){ctx.fillRect(ox-1,-1,5,14);ctx.fillRect(ox+26,-1,5,14);ctx.fillRect(ox+1,-4,28,4)}if(hs==='afro'){ctx.fillRect(ox-2,-6,34,10);ctx.fillRect(ox-3,-2,6,10);ctx.fillRect(ox+27,-2,6,10)}if(hs==='ponytail'){ctx.fillRect(ox+22,-1,8,5);ctx.fillRect(ox+26,2,4,14)}if(hs==='bun'){ctx.fillRect(ox+8,-8,14,6)}}
    if(opts.accessory&&opts.accessory.includes('glasses')){ctx.fillStyle='#555';ctx.fillRect(ox+7,6,7,7);ctx.fillRect(ox+16,6,7,7);ctx.fillRect(ox+14,8,2,2)}
    // World costume overlay
    const wid=this.world?.id;
    if(wid==='trump-world'){
      // MAGA hat (red cap)
      ctx.fillStyle='#dd2020';ctx.fillRect(ox+2,-5,26,7);ctx.fillRect(ox,-1,30,4);
      ctx.fillStyle='#fff';ctx.fillRect(ox+6,-3,18,2); // MAGA text band
    }else if(wid==='space-world'){
      // Space helmet (glass dome over head)
      ctx.fillStyle='rgba(150,200,255,0.25)';ctx.fillRect(ox+1,-6,28,20);
      ctx.strokeStyle='#8899bb';ctx.lineWidth=2;ctx.strokeRect(ox+1,-6,28,20);
      // Visor shine
      ctx.fillStyle='rgba(200,230,255,0.2)';ctx.fillRect(ox+3,-4,8,6);
      // Suit collar
      ctx.fillStyle='#ccccdd';ctx.fillRect(ox+2,16,26,3);
    }else if(wid==='mario-world'){
      // Red Mario cap with M
      ctx.fillStyle='#dd2222';ctx.fillRect(ox+2,-5,26,7);ctx.fillRect(ox,-1,30,4);
      ctx.fillStyle='#fff';ctx.fillRect(ox+10,-4,10,5);
      ctx.fillStyle='#dd2222';ctx.fillRect(ox+12,-3,2,3);ctx.fillRect(ox+16,-3,2,3);ctx.fillRect(ox+13,-2,4,1);
      // Mario mustache
      ctx.fillStyle='#3a2210';ctx.fillRect(ox+8,12,14,3);ctx.fillRect(ox+6,13,4,2);ctx.fillRect(ox+20,13,4,2);
    }else if(wid==='farm-world'){
      // Straw hat
      ctx.fillStyle='#ddcc66';ctx.fillRect(ox+1,-6,28,6);ctx.fillRect(ox-4,-1,38,4);
      ctx.fillStyle='#bbaa44';ctx.fillRect(ox+3,-5,24,1);ctx.fillRect(ox-2,0,34,1);
      // Dungaree straps over shirt
      ctx.fillStyle='#4466aa';ctx.fillRect(ox+5,18,4,14);ctx.fillRect(ox+21,18,4,14);
      ctx.fillRect(ox+5,30,20,4);
    }else if(wid==='haunted-mansion'){
      // Ghost sheet draped over (translucent white, covers body)
      ctx.fillStyle='rgba(220,210,230,0.35)';ctx.fillRect(ox-1,-4,32,50);
      ctx.fillRect(ox-4,10,38,30);
      // Ghost eyes (dark holes)
      ctx.fillStyle='rgba(20,10,30,0.5)';ctx.fillRect(ox+8,5,5,6);ctx.fillRect(ox+17,5,5,6);
      // Ragged bottom edge
      ctx.fillStyle='rgba(220,210,230,0.35)';
      ctx.fillRect(ox-4,38,8,6);ctx.fillRect(ox+8,40,8,4);ctx.fillRect(ox+22,38,8,6);
    }else if(wid==='underwater-ruins'){
      // Diving helmet (round, brass colored)
      ctx.fillStyle='#bb8833';ctx.fillRect(ox+1,-7,28,22);
      ctx.fillStyle='#aa7722';ctx.fillRect(ox,-1,30,3);ctx.fillRect(ox+1,-7,28,3);
      // Visor window
      ctx.fillStyle='#88ccee';ctx.fillRect(ox+6,-3,18,12);
      ctx.fillStyle='rgba(200,240,255,0.3)';ctx.fillRect(ox+8,-1,6,4);
      // Bolts
      ctx.fillStyle='#ddd';ctx.fillRect(ox+3,0,3,3);ctx.fillRect(ox+24,0,3,3);
    }else if(wid==='enchanted-forest'){
      // Explorer/adventurer hat (green, like Link)
      ctx.fillStyle='#338833';ctx.fillRect(ox+2,-6,26,7);ctx.fillRect(ox-2,-1,18,4);
      ctx.fillStyle='#44aa44';ctx.fillRect(ox+4,-5,22,3);
      // Feather in hat
      ctx.fillStyle='#ff4444';ctx.fillRect(ox+22,-8,3,4);ctx.fillRect(ox+24,-10,2,3);
    }else if(wid==='desert-temple'){
      // Pharaoh headdress (gold/blue stripes)
      ctx.fillStyle='#ddaa22';ctx.fillRect(ox,-4,30,6);ctx.fillRect(ox-3,0,36,3);
      ctx.fillStyle='#2244aa';ctx.fillRect(ox+2,-3,26,2);
      // Side flaps
      ctx.fillStyle='#ddaa22';ctx.fillRect(ox-4,2,6,14);ctx.fillRect(ox+28,2,6,14);
      ctx.fillStyle='#2244aa';ctx.fillRect(ox-3,6,4,2);ctx.fillRect(ox+29,6,4,2);ctx.fillRect(ox-3,10,4,2);ctx.fillRect(ox+29,10,4,2);
    }
    ctx.restore();
  }
}

// ============================================
// APP
// ============================================
class App {
  constructor(){
    this.designer=new CharacterDesigner('character-canvas');this.engine=null;
    this.currentScreen='title';this.characterName='Player 1';this.currentWorldIndex=-1;
    this.worldProgress=WORLDS.map(()=>({completed:false,score:0,time:0,bestTime:Infinity}));
    this.gameTimer=null;this.gameSeconds=0;this.gameScore=0;this.challengesSolved=0;this.currentChallengeItemId=null;
    this.init();
  }
  init(){this.initParticles();this.designer.render();this.bindEvents()}
  showScreen(name){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));requestAnimationFrame(()=>{const s=document.getElementById(`screen-${name}`);if(s)s.classList.add('active')});this.currentScreen=name}

  bindEvents(){
    document.getElementById('btn-start').addEventListener('click',()=>{sound.init();sound.playClick();this.showScreen('character');music.playTrack('character');this.buildCharSelect()});
    // Name input
    const nameInp=document.getElementById('character-name');
    nameInp.addEventListener('input',()=>{nameInp.style.borderColor='';nameInp.placeholder='ENTER NAME'});
    // Start quest
    document.getElementById('btn-enter-hunt').addEventListener('click',()=>{const name=nameInp.value.trim();if(!name){sound.playError();nameInp.style.borderColor='#ff2040';nameInp.placeholder='ENTER NAME!';nameInp.focus();return}sound.playSuccess();this.characterName=name;this.showWorldSelect()});
    // Random
    document.getElementById('btn-random').addEventListener('click',()=>{this._randomizeCharacter()});
    // Rotate view
    this._charView=0;
    document.getElementById('btn-rotate').addEventListener('click',()=>{this._charView=(this._charView+1)%3;sound.play(400+this._charView*100,'square',0.05,0.06);this.designer.render(this._charView)});
    // Auto-rotate
    setInterval(()=>{if(this.currentScreen==='character'){this._charView=(this._charView+1)%3;this.designer.render(this._charView)}},2500);
    document.getElementById('btn-back-char').addEventListener('click',()=>{sound.playClick();this.showScreen('character');this.buildCharSelect()});
    document.getElementById('btn-game-back').addEventListener('click',()=>{sound.playClick();this.stopTimer();if(this.engine)this.engine.stop();this.showWorldSelect()});
    document.getElementById('challenge-submit').addEventListener('click',()=>this.submitChallenge());
    document.getElementById('challenge-input').addEventListener('keydown',(e)=>{if(e.key==='Enter')this.submitChallenge()});
    document.getElementById('challenge-skip').addEventListener('click',()=>this.skipChallenge());
    // btn-next-world onclick set in completeWorld()
    document.getElementById('btn-to-worlds').addEventListener('click',()=>{sound.playClick();this.showWorldSelect()});
    document.getElementById('btn-play-again').addEventListener('click',()=>{sound.playClick();this.resetGame()});
    document.getElementById('btn-retry').addEventListener('click',()=>{sound.playClick();this.startWorld(this.currentWorldIndex)});
    document.getElementById('btn-gameover-worlds').addEventListener('click',()=>{sound.playClick();this.showWorldSelect()});
  }

  // Character select option definitions
  _charOpts(){return[
    {key:'skinTone',label:'SKIN',vals:['#FDE7C8','#F5D0A9','#E8B88A','#D4956B','#C07840','#9A5B2F','#6B3E1F','#3D2213'],names:['LIGHT','FAIR','MED-LT','MEDIUM','TAN','MED-DK','DARK','DEEP'],color:true},
    {key:'hairStyle',label:'HAIR',vals:['short','medium','long','curly','afro','ponytail','bun','bald'],names:['SHORT','MEDIUM','LONG','CURLY','AFRO','PONYTAIL','BUN','BALD']},
    {key:'hairColor',label:'HAIR COL',vals:['#2C1810','#5C3317','#8B5E3C','#C44E2E','#DAA520','#F0E68C','#E8E8E8','#4169E1','#9B59B6','#E75480'],names:['BLACK','DK BROWN','BROWN','RED','GOLDEN','BLONDE','PLAT','BLUE','PURPLE','PINK'],color:true},
    {key:'eyeColor',label:'EYES',vals:['#634E34','#8B7355','#2E8B57','#4682B4','#708090','#B8860B'],names:['BROWN','HAZEL','GREEN','BLUE','GRAY','AMBER'],color:true},
    {key:'clothing',label:'OUTFIT',vals:['tshirt','hoodie','jacket','tank','sweater'],names:['T-SHIRT','HOODIE','JACKET','TANK','SWEATER']},
    {key:'clothingColor',label:'OUTFIT COL',vals:['#E74C3C','#3498DB','#2ECC71','#9B59B6','#F39C12','#1ABC9C','#2C3E50','#ECF0F1','#E91E63','#333333'],names:['RED','BLUE','GREEN','PURPLE','ORANGE','TEAL','NAVY','WHITE','PINK','BLACK'],color:true},
    {key:'accessory',label:'ACCS',vals:['none','round-glasses','square-glasses','earrings','headband'],names:['NONE','ROUND GL','SQUARE GL','EARRINGS','HEADBAND']},
    {key:'faceShape',label:'FACE',vals:['oval','round','square','heart'],names:['OVAL','ROUND','SQUARE','HEART']},
  ]}

  _charPresets(){return[
    {name:'WARRIOR',opts:{skinTone:'#D4956B',hairStyle:'short',hairColor:'#2C1810',clothing:'jacket',clothingColor:'#333333',accessory:'none',eyeColor:'#634E34'}},
    {name:'WIZARD',opts:{skinTone:'#FDE7C8',hairStyle:'long',hairColor:'#E8E8E8',clothing:'sweater',clothingColor:'#9B59B6',accessory:'round-glasses',eyeColor:'#4682B4'}},
    {name:'EXPLORER',opts:{skinTone:'#E8B88A',hairStyle:'medium',hairColor:'#8B5E3C',clothing:'jacket',clothingColor:'#2C3E50',accessory:'none',eyeColor:'#8B7355'}},
    {name:'PIRATE',opts:{skinTone:'#C07840',hairStyle:'bald',hairColor:'#2C1810',clothing:'tank',clothingColor:'#333333',accessory:'earrings',eyeColor:'#634E34'}},
    {name:'PRINCESS',opts:{skinTone:'#F5D0A9',hairStyle:'ponytail',hairColor:'#DAA520',clothing:'sweater',clothingColor:'#E91E63',accessory:'headband',eyeColor:'#2E8B57'}},
    {name:'ROBOT',opts:{skinTone:'#9A5B2F',hairStyle:'afro',hairColor:'#4169E1',clothing:'hoodie',clothingColor:'#1ABC9C',accessory:'square-glasses',eyeColor:'#708090'}},
  ]}

  _calcStats(){
    const o=this.designer.options;
    const hairVal={'short':3,'medium':5,'long':7,'curly':8,'afro':9,'ponytail':6,'bun':4,'bald':1};
    const clothVal={'tshirt':3,'hoodie':6,'jacket':8,'tank':2,'sweater':5};
    const accVal={'none':1,'round-glasses':7,'square-glasses':6,'earrings':4,'headband':5,'cat-glasses':8};
    const faceVal={'oval':5,'round':6,'square':7,'heart':4};
    return{
      STR:faceVal[o.faceShape]||5,SPD:10-(hairVal[o.hairStyle]||5),
      DEF:clothVal[o.clothing]||5,INT:(accVal[o.accessory]||3),
      STY:hairVal[o.hairStyle]||5,LCK:Math.floor(Math.random()*4)+4
    };
  }

  _updateStats(){
    const stats=this._calcStats();const el=document.getElementById('char-stats');
    el.innerHTML=Object.entries(stats).map(([k,v])=>{
      let bars='';for(let i=0;i<10;i++)bars+=`<div class="${i<v?'char-stat-fill':'char-stat-empty'}"></div>`;
      return`<div class="char-stat-row"><span class="char-stat-name">${k}</span><span class="char-stat-bar">${bars}</span></div>`}).join('');
  }

  buildCharSelect(){
    const opts=this._charOpts();const optsCont=document.getElementById('char-options');
    optsCont.innerHTML='';
    opts.forEach((opt,oi)=>{
      const row=document.createElement('div');row.className='char-opt-row';
      const idx=opt.vals.indexOf(this.designer.options[opt.key]);
      const curIdx=Math.max(0,idx);
      row.innerHTML=`<span class="char-opt-label">${opt.label}</span><button class="char-opt-arrow" data-oi="${oi}" data-dir="-1">&lt;&lt;</button><span class="char-opt-val" id="charval-${oi}" ${opt.color?`style="color:${opt.vals[curIdx]}"`:''}>${opt.names[curIdx]}</span><button class="char-opt-arrow" data-oi="${oi}" data-dir="1">&gt;&gt;</button>`;
      optsCont.appendChild(row);
    });
    // Arrow click handlers
    optsCont.querySelectorAll('.char-opt-arrow').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const oi=parseInt(btn.dataset.oi),dir=parseInt(btn.dataset.dir);
        const opt=opts[oi];const cur=opt.vals.indexOf(this.designer.options[opt.key]);
        const next=(cur+dir+opt.vals.length)%opt.vals.length;
        this.designer.setOption(opt.key,opt.vals[next]);
        sound.play(300+oi*60,'square',0.04,0.07);
        const valEl=document.getElementById(`charval-${oi}`);
        valEl.textContent=opt.names[next];
        if(opt.color)valEl.style.color=opt.vals[next];
        this._updateStats();
        this.designer.render(this._charView);
      });
    });
    // Presets
    const presCont=document.getElementById('char-presets');presCont.innerHTML='';
    this._charPresets().forEach((pre,pi)=>{
      const btn=document.createElement('button');btn.className='char-preset';btn.textContent=pre.name;
      btn.addEventListener('click',()=>{
        sound.play(500,'square',0.06,0.08);setTimeout(()=>sound.play(600,'square',0.06,0.07),60);
        Object.entries(pre.opts).forEach(([k,v])=>this.designer.setOption(k,v));
        presCont.querySelectorAll('.char-preset').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this.buildCharSelect();this.designer.render(this._charView);
      });
      presCont.appendChild(btn);
    });
    this._updateStats();
    this.designer.render(this._charView);
  }

  _randomizeCharacter(){
    const opts=this._charOpts();let step=0;
    const spin=setInterval(()=>{
      opts.forEach(opt=>{const ri=Math.floor(Math.random()*opt.vals.length);this.designer.options[opt.key]=opt.vals[ri]});
      sound.play(300+step*30,'square',0.03,0.06);
      this.designer.render(this._charView);step++;
      if(step>15){clearInterval(spin);sound.playSuccess();this.buildCharSelect();this.designer.render(this._charView)}
    },60);
  }

  showWorldSelect(){
    const grid=document.getElementById('world-grid');grid.innerHTML='';
    WORLDS.forEach((w,i)=>{
      const completed=this.worldProgress[i].completed;
      const card=document.createElement('div');card.className=`world-card${completed?' completed':''}`;
      // Canvas background showing the actual world
      const cvs=document.createElement('canvas');cvs.width=320;cvs.height=160;cvs.style.cssText='position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated';
      const c=cvs.getContext('2d');c.imageSmoothingEnabled=false;
      // Draw the world background, ground, and some platforms
      const gY=130;
      w.drawBg(c,320,160,w.worldWidth*0.3,gY,i*100+50);
      c.fillStyle=w.colors.ground;c.fillRect(0,gY,320,30);c.fillStyle=w.colors.groundDk;c.fillRect(0,gY+4,320,26);c.fillStyle=w.colors.platTop;c.fillRect(0,gY,320,2);
      // Draw a few platforms
      const platSample=w.platforms.slice(0,6);platSample.forEach(p=>{const px=(p.x*0.1)%300;const py=gY-p.yo*0.4;c.fillStyle=w.colors.plat;c.fillRect(px,py,p.w*0.3,6);c.fillStyle=w.colors.platTop;c.fillRect(px,py,p.w*0.3,2)});

      const bt=this.worldProgress[i].bestTime<Infinity?formatTime(this.worldProgress[i].bestTime):'--:--';
      const diffIcon={'Easy':'\u{2605}','Medium':'\u{2605}\u{2605}','Hard':'\u{2605}\u{2605}\u{2605}','Expert':'\u{2605}\u{2605}\u{2605}\u{2605}'}[w.difficulty]||'\u{2605}';
      card.innerHTML=`${completed?'<div class="check-icon" style="color:#00ff41;font-size:12px">DONE</div>':''}<div class="world-card-content"><div class="world-card-name">${w.name}</div><div class="world-card-desc">${w.description}</div><div class="world-card-meta"><span>${diffIcon}</span><span>${w.items.length} items</span>${completed?`<span>${bt}</span><span>${this.worldProgress[i].score}pts</span>`:''}</div></div>`;
      card.insertBefore(cvs,card.firstChild);
      card.addEventListener('click',()=>{sound.playClick();this.startWorld(i)});
      grid.appendChild(card);
    });
    this.designer.renderMini('worlds-mini-avatar');document.getElementById('worlds-player-name').textContent=this.characterName;music.playTrack('character');this.showScreen('worlds');
  }

  startWorld(index){
    this.currentWorldIndex=index;const w=WORLDS[index];
    this.gameSeconds=0;this.gameScore=0;this.challengesSolved=0;
    this.designer.renderMini('game-mini-avatar');
    document.getElementById('game-player-name').textContent=this.characterName;
    document.getElementById('game-timer').textContent='00:00';document.getElementById('game-score').textContent='0';
    document.getElementById('game-found').textContent=`0/${w.items.length}`;
    this.updateLives(3);
    const bar=document.getElementById('item-bar');bar.innerHTML='';
    w.items.forEach(item=>{const e=document.createElement('div');e.className='item-bar-entry';e.dataset.id=item.id;e.innerHTML=`<span class="ib-icon" style="color:${item.spriteColor}">\u{25A0}</span><span>${item.name}</span>`;bar.appendChild(e)});
    this.showScreen('game');music.playTrack(w.id);
    if(this.engine)this.engine.unmount();
    const container=document.getElementById('game-world');
    this.engine=new PlatformerEngine(container,this);this.engine.mount();
    setTimeout(()=>{this.engine.resize();this.engine.startWorld(w,this.designer.options);this.startTimer()},100);
  }

  startTimer(){this.stopTimer();this.gameTimer=setInterval(()=>{this.gameSeconds++;document.getElementById('game-timer').textContent=formatTime(this.gameSeconds)},1000)}
  stopTimer(){if(this.gameTimer){clearInterval(this.gameTimer);this.gameTimer=null}}
  addScore(pts){this.gameScore+=pts;document.getElementById('game-score').textContent=this.gameScore}
  updateLives(n){const el=document.getElementById('game-lives');el.textContent='\u{2665}'.repeat(Math.max(0,n))}
  onItemCollected(item){this.addScore(item.points);const w=WORLDS[this.currentWorldIndex];document.getElementById('game-found').textContent=`${this.engine.foundItems.size}/${w.items.length}`;const be=document.querySelector(`.item-bar-entry[data-id="${item.id}"]`);if(be)be.classList.add('found')}

  showChallenge(item){
    this.currentChallengeItemId=item.id;
    const a=Math.floor(Math.random()*12)+1,b=Math.floor(Math.random()*12)+1;const correct=a*b;this._currentAnswer=correct;
    const wrongs=new Set();while(wrongs.size<3){const v=correct+Math.floor(Math.random()*21)-10;if(v!==correct&&v>0)wrongs.add(v)}
    const allOpts=[correct,...wrongs].sort(()=>Math.random()-0.5);
    const modal=document.getElementById('challenge-modal'),fb=document.getElementById('challenge-feedback'),inp=document.getElementById('challenge-input'),opts=document.getElementById('challenge-options'),sub=document.getElementById('challenge-submit');
    fb.textContent='';fb.className='challenge-feedback';inp.value='';sound.playChallenge();
    document.getElementById('challenge-icon').textContent='[x]';document.getElementById('challenge-title').textContent='TIMES TABLE!';
    document.getElementById('challenge-text').textContent=`What is ${a} \u{00D7} ${b} ?`;
    inp.classList.add('hidden');sub.classList.add('hidden');opts.innerHTML='';
    allOpts.forEach(o=>{const btn=document.createElement('button');btn.className='challenge-opt-btn';btn.textContent=o;btn.addEventListener('click',()=>this.checkChallengeAnswer(o));opts.appendChild(btn)});
    opts.classList.remove('hidden');modal.classList.remove('hidden');
  }
  submitChallenge(){}
  checkChallengeAnswer(answer){
    const fb=document.getElementById('challenge-feedback');
    if(Number(answer)===this._currentAnswer){fb.textContent='CORRECT!';fb.className='challenge-feedback correct';sound.playSuccess();this.challengesSolved++;setTimeout(()=>{document.getElementById('challenge-modal').classList.add('hidden');if(this.engine)this.engine.collectChallengeItem(this.currentChallengeItemId)},800)}
    else{fb.textContent='WRONG!';fb.className='challenge-feedback wrong';sound.playHurt();setTimeout(()=>{document.getElementById('challenge-modal').classList.add('hidden');if(this.engine)this.engine.wrongAnswer()},800)}
  }
  skipChallenge(){sound.playClick();document.getElementById('challenge-modal').classList.add('hidden');if(this.engine)this.engine.skipChallenge()}

  showGameOver(){
    this.stopTimer();music.stop();sound.playGameOver();
    document.getElementById('gameover-score').textContent=this.gameScore;
    this.designer.renderMini('gameover-avatar');
    this.showScreen('gameover');
  }

  completeWorld(){
    this.stopTimer();const w=WORLDS[this.currentWorldIndex];const total=this.gameScore+Math.max(0,300-this.gameSeconds)*2;
    const prev=this.worldProgress[this.currentWorldIndex];
    this.worldProgress[this.currentWorldIndex]={completed:true,score:Math.max(prev.score,total),time:this.gameSeconds,bestTime:Math.min(prev.bestTime||Infinity,this.gameSeconds)};
    document.getElementById('complete-world-name').textContent=w.name;
    document.getElementById('stat-items').textContent=`${this.engine.foundItems.size}/${w.items.length}`;
    document.getElementById('stat-time').textContent=formatTime(this.gameSeconds);
    document.getElementById('stat-challenges').textContent=this.challengesSolved;
    document.getElementById('stat-score').textContent=total;
    const nb=document.getElementById('btn-next-world');
    const allDone=this.worldProgress.every(p=>p.completed);
    if(allDone){nb.textContent='VICTORY! \u{1F451}';nb.onclick=()=>{sound.playClick();this.showVictory()}}
    else{nb.textContent='WORLD SELECT \u{27A1}';nb.onclick=()=>{sound.playClick();this.showWorldSelect()}}
    sound.playSuccess();music.stop();if(this.engine)this.engine.unmount();this.showScreen('complete');
  }
  showVictory(){const ts=this.worldProgress.reduce((s,p)=>s+p.score,0),tt=this.worldProgress.reduce((s,p)=>s+p.time,0),ti=WORLDS.reduce((s,w)=>s+w.items.length,0);document.getElementById('victory-score').textContent=ts;document.getElementById('victory-time').textContent=formatTime(tt);document.getElementById('victory-items').textContent=`${ti}/${ti}`;music.playTrack('victory');this.showScreen('victory')}
  resetGame(){this.worldProgress=WORLDS.map(()=>({completed:false,score:0,time:0,bestTime:Infinity}));this.showWorldSelect()}

  initParticles(){
    const canvas=document.getElementById('bg-particles'),ctx=canvas.getContext('2d');let ps=[],w,h;
    const resize=()=>{w=canvas.width=window.innerWidth;h=canvas.height=window.innerHeight};resize();window.addEventListener('resize',resize);
    for(let i=0;i<25;i++)ps.push({x:Math.random()*w,y:Math.random()*h,dx:(Math.random()-0.5)*0.2,dy:(Math.random()-0.5)*0.2,alpha:0.15+Math.random()*0.2,color:`hsl(${220+Math.random()*30},50%,60%)`});
    const anim=()=>{ctx.clearRect(0,0,w,h);ps.forEach(p=>{p.x+=p.dx;p.y+=p.dy;if(p.x<0)p.x=w;if(p.x>w)p.x=0;if(p.y<0)p.y=h;if(p.y>h)p.y=0;ctx.fillStyle=p.color;ctx.globalAlpha=p.alpha;ctx.fillRect(Math.round(p.x),Math.round(p.y),3,3)});ctx.globalAlpha=1;ctx.strokeStyle='rgba(68,88,136,0.03)';ctx.lineWidth=1;for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const dx=ps[i].x-ps[j].x,dy=ps[i].y-ps[j].y;if(Math.sqrt(dx*dx+dy*dy)<100){ctx.beginPath();ctx.moveTo(Math.round(ps[i].x),Math.round(ps[i].y));ctx.lineTo(Math.round(ps[j].x),Math.round(ps[j].y));ctx.stroke()}}requestAnimationFrame(anim)};anim();
  }
}
window.addEventListener('DOMContentLoaded',()=>{new App()});
