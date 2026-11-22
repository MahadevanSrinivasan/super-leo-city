// ============================================================================
// SUPER LEO CITY 3D — MASSIVE 6-DISTRICT OPEN-WORLD & CUSTOM ZIP CODE SANDBOX
// Connected Highways, Stunt Airport, Mountain Pass, Resort Island & OSM Town
// ============================================================================

(() => {
  'use strict';

  // --- AUDIO SYNTHESIZER & VICE CITY KIDS RADIO (Web Audio API) ---
  const RADIO_STATIONS = [
    {
      name: 'Sunny FM',
      sub: '80s Kid Synth-Pop',
      bpm: 118,
      type: 'triangle',
      notes: [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63, 293.66],
      bass: [130.81, 130.81, 174.61, 196.0]
    },
    {
      name: 'Ocean Wave 103',
      sub: 'Miami Beach Synthwave',
      bpm: 104,
      type: 'sine',
      notes: [220.0, 261.63, 329.63, 392.0, 329.63, 293.66, 261.63, 246.94],
      bass: [110.0, 110.0, 146.83, 164.81]
    },
    {
      name: 'Dino Funk 105',
      sub: 'Bouncy T-Rex Groove',
      bpm: 112,
      type: 'square',
      notes: [196.0, 246.94, 293.66, 392.0, 329.63, 293.66, 246.94, 220.0],
      bass: [98.0, 110.0, 130.81, 146.83]
    },
    {
      name: 'Stunt Rock',
      sub: 'Turbo Ramp Anthems',
      bpm: 132,
      type: 'sawtooth',
      notes: [329.63, 329.63, 392.0, 440.0, 493.88, 440.0, 392.0, 329.63],
      bass: [164.81, 164.81, 196.0, 220.0]
    },
    {
      name: 'Radio Off',
      sub: 'City Ambience Only',
      bpm: 0,
      type: 'sine',
      notes: [],
      bass: []
    }
  ];

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.sirenTimer = 0;
      this.jingleStep = 0;
      this.radioIdx = 0;
      this.radioTimer = 0;
      this.radioStep = 0;
    }
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    tone(freq, dur = 0.12, type = 'triangle', vol = 0.12, slideTo = null) {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + dur);
      } catch (e) {}
    }
    playBoost() { this.tone(140, 0.25, 'sawtooth', 0.14, 420); }
    playSplash() { this.tone(320, 0.09, 'sine', 0.08, 120); }
    playJump() { this.tone(240, 0.3, 'triangle', 0.15, 620); }
    playRoar() { this.tone(95, 0.45, 'sawtooth', 0.22, 48); }
    playCheckpoint() {
      this.tone(587.33, 0.11, 'triangle', 0.15);
      setTimeout(() => this.tone(880, 0.18, 'triangle', 0.16), 80);
    }
    playHorn() {
      this.tone(440, 0.15, 'square', 0.1, 440);
      setTimeout(() => this.tone(554, 0.22, 'square', 0.1, 554), 90);
    }
    playFanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, i) => setTimeout(() => this.tone(n, 0.22, 'triangle', 0.18), i * 95));
    }
    playMissionPassed() {
      // Classic 80s Vice City neon-synth victory arpeggio
      const melody = [392.0, 493.88, 587.33, 783.99, 987.77];
      melody.forEach((n, i) => {
        setTimeout(() => {
          this.tone(n, 0.28, 'triangle', 0.16);
          this.tone(n * 0.5, 0.32, 'sine', 0.1);
        }, i * 105);
      });
    }
    playRadioTune() {
      this.tone(1200, 0.04, 'sawtooth', 0.05, 600);
      setTimeout(() => this.tone(880, 0.06, 'sine', 0.06), 45);
    }
    playSmash() { this.tone(190, 0.09, 'square', 0.08, 70); }
    updateRadio(dt, inVehicle) {
      if (this.muted || !this.ctx || !inVehicle) return;
      const st = RADIO_STATIONS[this.radioIdx];
      if (!st || !st.bpm || st.notes.length === 0) return;
      const stepDur = 60 / st.bpm / 2; // eighth notes
      this.radioTimer += dt;
      if (this.radioTimer >= stepDur) {
        this.radioTimer -= stepDur;
        const note = st.notes[this.radioStep % st.notes.length];
        this.tone(note, stepDur * 0.85, st.type, 0.026);
        if (this.radioStep % 2 === 0) {
          const bassNote = st.bass[Math.floor(this.radioStep / 2) % st.bass.length];
          this.tone(bassNote, stepDur * 1.6, 'sine', 0.032);
        }
        this.radioStep = (this.radioStep + 1) % 64;
      }
    }
    updateSpecialAudio(dt, vehType, speed) {
      if (this.muted || !this.ctx) return;
      this.sirenTimer += dt;
      if ((vehType === 'police' || vehType === 'firetruck') && Math.abs(speed) > 8) {
        if (this.sirenTimer > 0.45) {
          this.sirenTimer = 0;
          this.jingleStep = (this.jingleStep + 1) % 2;
          this.tone(this.jingleStep ? 680 : 510, 0.35, 'sine', 0.05);
        }
      } else if (vehType === 'icecream' && Math.abs(speed) > 4) {
        if (this.sirenTimer > 0.28) {
          this.sirenTimer = 0;
          const melody = [523, 659, 784, 659, 880, 784, 659, 587];
          this.jingleStep = (this.jingleStep + 1) % melody.length;
          this.tone(melody[this.jingleStep], 0.2, 'triangle', 0.06);
        }
      }
    }
  }

  const sfx = new SoundEngine();

  // --- 6 INTERCONNECTED WORLD DISTRICTS ---
  const WORLD_DISTRICTS = [
    { id: 'downtown', name: '🏙️ Downtown', x: 0, y: 0, z: 75, h: Math.PI, desc: 'Grand Boulevard & Hometown Streets' },
    { id: 'airport', name: '✈️ Stunt Airport', x: 920, y: 0, z: 360, h: Math.PI, desc: '1km Runway, Jumbo Jets & Hangar Jumps' },
    { id: 'mountain', name: '🏔️ Summit Pass', x: 0, y: 38, z: -1020, h: 0, desc: 'High-Altitude Plateau & Mega Ski-Jump' },
    { id: 'island', name: '🏖️ Resort Island', x: 0, y: 0, z: 820, h: Math.PI, desc: 'Ocean Causeway, Ferris Wheel & Marina' },
    { id: 'canyon', name: '🦖 Dino Canyon', x: -900, y: 0, z: 180, h: Math.PI, desc: 'Red Rock Archways & Off-Road Rally' },
    { id: 'stadium', name: '⚽ Soccer Arena', x: 55, y: 0, z: 82, h: Math.PI, desc: '3D Car-Soccer Pitch & Goal Nets' }
  ];
  let currentDistrictIdx = 0;

  // --- VEHICLE CATALOG (9 RIDES + LEO ON FOOT) ---
  const VEHICLE_CATALOG = [
    {
      id: 'supercar',
      key: '1',
      name: 'Comet GT Supercar',
      emoji: '🏎️',
      sub: 'SPACE: Twin-Turbo Nitro • Z: Sport Horn',
      color: 0xef233c,
      accent: 0xffd166,
      maxSpeed: 98,
      accel: 64,
      turnRate: 2.5,
      grip: 0.92,
      mass: 1.2
    },
    {
      id: 'police',
      key: '2',
      name: 'Hero Patrol Interceptor',
      emoji: '🚓',
      sub: 'SPACE: Pursuit Boost • Z: Siren Strobe',
      color: 0x1e293b,
      accent: 0x38bdf8,
      maxSpeed: 94,
      accel: 60,
      turnRate: 2.55,
      grip: 0.93,
      mass: 1.35
    },
    {
      id: 'firetruck',
      key: '3',
      name: 'Big Red Fire Engine',
      emoji: '🚒',
      sub: 'Z / F: High-Pressure 3D Water Cannon!',
      color: 0xd90429,
      accent: 0xfef08a,
      maxSpeed: 76,
      accel: 48,
      turnRate: 2.05,
      grip: 0.9,
      mass: 2.2
    },
    {
      id: 'monster',
      key: '4',
      name: 'Monster Crush 4x4',
      emoji: '🛻',
      sub: 'Z / F: Hydraulic Mega-Bounce • 1.5x Ramp Air!',
      color: 0x2563eb,
      accent: 0x4ade80,
      maxSpeed: 82,
      accel: 54,
      turnRate: 2.35,
      grip: 0.88,
      mass: 2.0
    },
    {
      id: 'icecream',
      key: '5',
      name: 'Melody Ice Cream Van',
      emoji: '🍦',
      sub: 'Z / F: Launch Rainbow Cones • Plays Jingle!',
      color: 0xf472b6,
      accent: 0x67e8f9,
      maxSpeed: 72,
      accel: 45,
      turnRate: 2.25,
      grip: 0.9,
      mass: 1.5
    },
    {
      id: 'pizza',
      key: '6',
      name: 'Rocket Pizza Buggy',
      emoji: '🍕',
      sub: 'Z / F: Launch Hot Pizzas • SPACE: Rocket Boost',
      color: 0xf59e0b,
      accent: 0xef4444,
      maxSpeed: 88,
      accel: 60,
      turnRate: 2.65,
      grip: 0.91,
      mass: 1.0
    },
    {
      id: 'helicopter',
      key: '7',
      name: 'Sky-Hawk Rescue Heli',
      emoji: '🚁',
      sub: 'SPACE: Climb Up • Z/F: Descend • Fly Anywhere!',
      color: 0x0284c7,
      accent: 0xfacc15,
      maxSpeed: 115,
      accel: 62,
      turnRate: 2.4,
      grip: 0.96,
      mass: 1.4,
      isFlying: true
    },
    {
      id: 'speedboat',
      key: '8',
      name: 'Aqua-Jet Speedboat',
      emoji: '🚤',
      sub: 'Carves Ocean Waves + Amphibious Hydro-Ski!',
      color: 0x06b6d4,
      accent: 0xffffff,
      maxSpeed: 96,
      accel: 58,
      turnRate: 2.4,
      grip: 0.86,
      mass: 1.3,
      isBoat: true
    },
    {
      id: 'trex',
      key: '9',
      name: 'Emerald Rex (3D Dino)',
      emoji: '🦖',
      sub: 'Z / F: Ground-Shaking Dino Roar • SPACE: Leap!',
      color: 0x16a34a,
      accent: 0x86efac,
      maxSpeed: 70,
      accel: 55,
      turnRate: 2.7,
      grip: 0.94,
      mass: 2.4,
      isDino: true
    }
  ];

  // --- PROCEDURAL HIGH-RES TEXTURE GENERATOR ---
  function makeCanvasTexture(w, h, drawFn, repeatX = 1, repeatY = 1) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }

  function makeSignTexture(text, subText = '', bgColor = '#065f46', borderColor = '#ffffff', textColor = '#ffffff') {
    return makeCanvasTexture(512, 160, (ctx, w, h) => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 38px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(text.slice(0, 26), w / 2, subText ? h * 0.38 : h * 0.5);

      if (subText) {
        ctx.fillStyle = '#fde047';
        ctx.font = '800 24px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(subText.slice(0, 36), w / 2, h * 0.74);
      }
    }, 1, 1);
  }

  const TEXTURES = {
    roadN: makeCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, 40, h);
      ctx.fillRect(w - 40, 0, 40, h);
      for (let y = 0; y < h; y += 128) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(26, y, 16, 64);
        ctx.fillRect(w - 42, y, 16, 64);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(26, y + 64, 16, 64);
        ctx.fillRect(w - 42, y + 64, 16, 64);
      }
      ctx.fillStyle = '#facc15';
      ctx.fillRect(w / 2 - 16, 0, 11, h);
      ctx.fillRect(w / 2 + 5, 0, 11, h);
      ctx.fillStyle = '#ffffff';
      for (let y = 24; y < h; y += 128) {
        ctx.fillRect(w * 0.27, y, 12, 72);
        ctx.fillRect(w * 0.73 - 12, y, 12, 72);
      }
    }, 1, 24),

    roadE: makeCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, w, 40);
      ctx.fillRect(0, h - 40, w, 40);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, h / 2 - 16, w, 11);
      ctx.fillRect(0, h / 2 + 5, w, 11);
      ctx.fillStyle = '#ffffff';
      for (let x = 24; x < w; x += 128) {
        ctx.fillRect(x, h * 0.27, 72, 12);
        ctx.fillRect(x, h * 0.73 - 12, 72, 12);
      }
    }, 24, 1),

    runwayTex: makeCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(18, 0, 12, h);
      ctx.fillRect(w - 30, 0, 12, h);
      for (let y = 20; y < h; y += 128) {
        ctx.fillRect(w / 2 - 10, y, 20, 76);
      }
      ctx.fillStyle = '#facc15';
      for (let x = 60; x < w - 60; x += 48) {
        ctx.fillRect(x, 0, 20, 28);
      }
    }, 1, 14),

    buildingGlass: makeCanvasTexture(256, 512, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e3a5f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      const cols = 8, rows = 16;
      const padX = 6, padY = 6;
      const cw = w / cols, ch = h / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = Math.random() > 0.32;
          ctx.fillStyle = lit ? (Math.random() > 0.25 ? '#bae6fd' : '#fef08a') : '#1e293b';
          ctx.fillRect(c * cw + padX, r * ch + padY, cw - padX * 2, ch - padY * 2);
        }
      }
    }),

    buildingWarm: makeCanvasTexture(256, 512, (ctx, w, h) => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, w, h);
      const cols = 6, rows = 14;
      const cw = w / cols, ch = h / rows;
      for (let r = 0; r < rows; r++) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(0, r * ch, w, 3);
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = Math.random() > 0.3 ? '#fde68a' : '#475569';
          ctx.fillRect(c * cw + 8, r * ch + 8, cw - 16, ch - 16);
        }
      }
    }),

    rampTex: makeCanvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(20, h - 30);
      ctx.lineTo(w / 2, 40);
      ctx.lineTo(w - 20, h - 30);
      ctx.lineTo(w - 55, h - 30);
      ctx.lineTo(w / 2, 95);
      ctx.lineTo(55, h - 30);
      ctx.closePath();
      ctx.fill();
    }, 0.05, 0.05),

    grass: makeCanvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) {
        ctx.fillStyle = i % 2 ? '#16a34a' : '#4ade80';
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
    }, 80, 80),

    desertSand: makeCanvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#e09f5a';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) {
        ctx.fillStyle = i % 2 ? '#d97706' : '#fcd34d';
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
    }, 80, 80),

    snowGround: makeCanvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1500; i++) {
        ctx.fillStyle = i % 2 ? '#e2e8f0' : '#bae6fd';
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
    }, 80, 80),

    soccerPitch: makeCanvasTexture(512, 512, (ctx, w, h) => {
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#16a34a' : '#22c55e';
        ctx.fillRect(0, (i * h) / 10, w, h / 10);
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      ctx.beginPath();
      ctx.moveTo(20, h / 2);
      ctx.lineTo(w - 20, h / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeRect(w * 0.25, 20, w * 0.5, 85);
      ctx.strokeRect(w * 0.25, h - 105, w * 0.5, 85);
    })
  };

  // --- THREE.JS SCENE, CAMERA & RENDERER ---
  const canvas = document.getElementById('gameCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xff82b2);
  scene.fog = new THREE.FogExp2(0xffb3c6, 0.00052);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 2600);
  camera.position.set(0, 12, -25);

  // --- LIGHTING (VICE SUNSET / SUNNY DAY / GOLDEN HOUR / NEON NIGHT) ---
  const hemiLight = new THREE.HemisphereLight(0xffd6e7, 0x2a1b4e, 0.85);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffe8b6, 1.35);
  sunLight.position.set(220, 360, 180);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 1200;
  const d = 480;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  let timeMode = 0;
  const TIME_PRESETS = [
    { name: '🌴 Vice Sunset (T)', bg: 0xff82b2, fog: 0xffb3c6, hemi: 0.85, sun: 1.35, sunCol: 0xffe8b6, exposure: 1.12 },
    { name: '☀️ Sunny Day (T)', bg: 0x38bdf8, fog: 0x7dd3fc, hemi: 0.84, sun: 1.35, sunCol: 0xfffbeb, exposure: 1.1 },
    { name: '🌅 Golden Hour (T)', bg: 0xf97316, fog: 0xfb923c, hemi: 0.68, sun: 1.18, sunCol: 0xfde047, exposure: 1.06 },
    { name: '🌙 Neon Night (T)', bg: 0x0b081a, fog: 0x1a1033, hemi: 0.4, sun: 0.34, sunCol: 0x67e8f9, exposure: 0.98 }
  ];

  // --- WORLD STATE & COLLIDERS ---
  const buildingColliders = [];
  const baseBuildingColliders = [];
  const ramps = []; // { x, z, w, l, h, baseY, dir, isLanding }
  const physicsProps = [];
  const clouds = [];
  const waterDrops = [];
  const projectiles = [];
  const weatherParticles = [];
  let weatherType = 'clear';
  let ferrisWheelGroup = null;
  let airportRadarMesh = null;
  let terrainGeo = null;
  let terrainMesh = null;
  let welcomeSignMeshN = null;
  let welcomeSignMeshS = null;

  const hometownDynamicGroup = new THREE.Group();
  scene.add(hometownDynamicGroup);

  // Full Connected Road Network Coordinates (spanning 3,000m x 3,000m!)
  const roadXCoords = [-660, -440, -220, 0, 220, 440, 660];
  const roadZCoords = [-660, -420, -260, -140, -20, 100, 220, 660];

  const hometown = {
    zip: 'VICE',
    city: 'Super Leo Island',
    state: 'Vice Bay',
    stateAbbr: 'SL',
    lat: 25.79,
    lon: -80.13,
    biome: 'coastal',
    biomeLabel: 'Tropical Vice Bay',
    elevMin: 0,
    elevMax: 42,
    tempF: 78,
    weatherDesc: '🌴 Sunny Breeze',
    streets: ['Ocean Blvd', 'Palm Avenue', 'Flamingo Way', 'Starlight Dr', 'Boardwalk Lane', 'Sunset Blvd'],
    landmarks: ['Palm Grove Park', "Leo's Pizza Plaza", 'Sunset Lighthouse', 'Sunny Scoops Beach', 'Starlight Pier']
  };

  let currentElevationGrid = null;
  let terrainReliefScale = 16;

  // --- UNIFIED SEAMLESS ROAD + ELEVATED HIGHWAY + TERRAIN HEIGHT FUNCTION ---
  function isOnFlatRoadOrDistrict(x, z) {
    // 1. North-South Avenues & Outer Beltway
    for (let i = 0; i < roadXCoords.length; i++) {
      if (Math.abs(x - roadXCoords[i]) < 20 && z >= -680 && z <= 680) return true;
    }
    // 2. East-West Cross Streets & Outer Beltway
    for (let i = 0; i < roadZCoords.length; i++) {
      if (Math.abs(z - roadZCoords[i]) < 20 && x >= -680 && x <= 680) return true;
    }
    // 3. East/West Expressways out to Stunt Airport (X = +660..+1260) and Dino Canyon (X = -660..-1260)
    if ((Math.abs(z - (-140)) < 22 || Math.abs(z - 100) < 22) && Math.abs(x) <= 1260) return true;
    // 4. Stunt Airport District Tarmac & Runways (X = 640..1280, Z = -580..520)
    if (x >= 640 && x <= 1280 && z >= -580 && z <= 520) return true;
    // 5. Dino Canyon Rally Circuit (X = -1260..-640, Z = -460..460)
    if (x >= -1260 && x <= -640 && z >= -460 && z <= 460) {
      if (Math.abs(x - (-920)) < 22 || Math.abs(x - (-1120)) < 22 || Math.abs(z - (-360)) < 22 || Math.abs(z - 360) < 22) return true;
    }
    // 6. South Ocean Causeways & Starlight Resort Island (Z = 200..1180)
    if ((Math.abs(x) < 22 || Math.abs(x - (-220)) < 22) && z >= 200 && z <= 1150) return true;
    if (x >= -520 && x <= 520 && z >= 640 && z <= 1180) return true;
    // 7. Central Soccer Stadium
    if (x > 5 && x < 105 && z > 0 && z < 85) return true;
    return false;
  }

  function getTerrainHeightAt(x, z) {
    // North Mountain Highway & Summit Plateau (Z = -660..-1280)
    // Smoothly climbs from Y = 0 at Z = -660 up to Y = 38m at Z = -940..-1260!
    if (z < -660 && Math.abs(x) < 380) {
      if (z >= -940) {
        const climbT = (-660 - z) / 280; // 0.0 at Z=-660 -> 1.0 at Z=-940
        // Smooth S-curve highway grade so cars never bump on transition!
        const smoothT = climbT * climbT * (3 - 2 * climbT);
        return smoothT * 38.0;
      }
      if (z >= -1260) {
        return 38.0;
      }
    }

    // Keep all roads, airport runways, bridges, soccer stadium, and resort island flush at Y = 0
    if (isOnFlatRoadOrDistrict(x, z)) return 0;

    // Smooth blend into rolling topographic hills in open parklands and outer wilderness
    let minRoadDist = 999;
    roadXCoords.forEach(rx => { minRoadDist = Math.min(minRoadDist, Math.abs(x - rx) - 18); });
    roadZCoords.forEach(rz => { minRoadDist = Math.min(minRoadDist, Math.abs(z - rz) - 18); });
    const blend = Math.max(0, Math.min(1, minRoadDist / 45));

    const wave =
      Math.sin(x * 0.012 + hometown.lat) * Math.cos(z * 0.012 + hometown.lon) * 0.5 +
      Math.sin(x * 0.028 - z * 0.024) * 0.25 + 0.5;

    let gridH = wave;
    if (currentElevationGrid && currentElevationGrid.length === 49) {
      const gx = Math.max(0, Math.min(6, Math.floor(((x + 1400) / 2800) * 6)));
      const gz = Math.max(0, Math.min(6, Math.floor(((z + 1400) / 2800) * 6)));
      gridH = currentElevationGrid[gz * 7 + gx] * 0.7 + wave * 0.3;
    }

    const outerBoost = Math.max(0, (Math.hypot(x, z) - 720) / 350);
    return (blend * 0.25 + outerBoost * 1.35) * gridH * terrainReliefScale;
  }

  function rebuildTerrainVertices() {
    if (!terrainGeo) return;
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = -pos.getY(i);
      // Channel of Ocean Bay between Main Island (Z=230) and Starlight Resort Island (Z=640)
      if (vz > 245 && vz < 635 && Math.abs(vx) < 620) {
        pos.setZ(i, -2.5);
      } else {
        pos.setZ(i, getTerrainHeightAt(vx, vz));
      }
    }
    pos.needsUpdate = true;
    terrainGeo.computeVertexNormals();
  }

  // --- HELPER: CREATE CONNECTED RAMP WITH FLUSH APRON, SIDE RAILS & OPTIONAL LANDING ---
  function addConnectedRamp(r) {
    const baseY = r.baseY || 0;
    const shape = new THREE.Shape();
    shape.moveTo(-r.l / 2, 0);
    shape.lineTo(r.l / 2, 0);
    shape.lineTo(r.l / 2, r.h);
    shape.closePath();

    const extrudeGeo = new THREE.ExtrudeGeometry(shape, { depth: r.w, bevelEnabled: false });
    extrudeGeo.center();

    const rampGroup = new THREE.Group();
    const rampMesh = new THREE.Mesh(
      extrudeGeo,
      new THREE.MeshStandardMaterial({ map: TEXTURES.rampTex, roughness: 0.45 })
    );
    rampMesh.position.y = r.h / 2;
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    rampGroup.add(rampMesh);

    // Flush Yellow Lead-In Entry Apron at (-r.l/2) so road-to-ramp transition looks 100% seamless!
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.14, r.w + 0.6),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    apron.position.set(-r.l / 2 - 2.0, 0.08, 0);
    rampGroup.add(apron);

    // 3D Glowing Side Guide Rails along the incline so cars stay aligned on the ramp
    const railLen = Math.hypot(r.l, r.h);
    const railPitch = Math.atan2(r.h, r.l);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 });
    [-r.w / 2 - 0.35, r.w / 2 + 0.35].forEach(rz => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(railLen, 0.75, 0.45), railMat);
      rail.position.set(0, r.h / 2 + 0.4, rz);
      rail.rotation.z = railPitch;
      rampGroup.add(rail);
    });

    rampGroup.position.set(r.x, baseY, r.z);
    if (r.dir === 'N') rampGroup.rotation.y = Math.PI / 2;
    else if (r.dir === 'S') rampGroup.rotation.y = -Math.PI / 2;
    else if (r.dir === 'W') rampGroup.rotation.y = Math.PI;
    scene.add(rampGroup);

    // Floating Golden Sky-Ring above the jump trajectory
    if (!r.noRing) {
      const skyRing = new THREE.Mesh(
        new THREE.TorusGeometry(7.2, 0.6, 12, 28),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      const offsetZ = r.dir === 'N' ? -r.l * 0.85 : r.dir === 'S' ? r.l * 0.85 : 0;
      const offsetX = r.dir === 'E' ? r.l * 0.85 : r.dir === 'W' ? -r.l * 0.85 : 0;
      skyRing.position.set(r.x + offsetX, baseY + r.h + 8.5, r.z + offsetZ);
      if (r.dir === 'E' || r.dir === 'W') skyRing.rotation.y = Math.PI / 2;
      scene.add(skyRing);
    }

    ramps.push({ ...r, baseY });
  }

  // --- BUILD THE MASSIVE 6-DISTRICT CONNECTED WORLD ---
  function buildBaseWorld() {
    // 1. Massive Ocean Bay Plane (6,000m x 6,000m)
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(6000, 6000),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.18, metalness: 0.35 })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -1.4;
    ocean.receiveShadow = true;
    scene.add(ocean);

    // 2. Massive 2,800m x 2,800m Subdivided 3D Terrain Mesh (96x96 grid)
    terrainGeo = new THREE.PlaneGeometry(2800, 2800, 96, 96);
    terrainMesh = new THREE.Mesh(
      terrainGeo,
      new THREE.MeshStandardMaterial({ map: TEXTURES.grass, roughness: 0.85 })
    );
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.set(0, -0.02, 0);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);
    rebuildTerrainVertices();

    // 3. Connected Main Road & Outer Ring Beltway Grid (-660..+660)
    const roadMatN = new THREE.MeshStandardMaterial({ map: TEXTURES.roadN, roughness: 0.7 });
    const roadMatE = new THREE.MeshStandardMaterial({ map: TEXTURES.roadE, roughness: 0.7 });
    const junctionMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });

    roadXCoords.forEach(rx => {
      const w = Math.abs(rx) === 660 || rx === 0 ? 32 : 26;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, 1360), roadMatN);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(rx, 0.06, 0);
      mesh.receiveShadow = true;
      scene.add(mesh);
    });

    roadZCoords.forEach(rz => {
      const w = Math.abs(rz) === 660 ? 32 : 26;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1360, w), roadMatE);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0.05, rz);
      mesh.receiveShadow = true;
      scene.add(mesh);
    });

    // Paved Asphalt Intersection Plazas where avenues & streets cross so roads connect seamlessly
    roadXCoords.forEach(rx => {
      roadZCoords.forEach(rz => {
        const box = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), junctionMat);
        box.rotation.x = -Math.PI / 2;
        box.position.set(rx, 0.075, rz);
        scene.add(box);
      });
    });

    // 4. East & West Cross-Island Expressways (Connecting Dino Canyon <-> Downtown <-> Stunt Airport)
    [-140, 100].forEach(ez => {
      const expRoad = new THREE.Mesh(new THREE.PlaneGeometry(2500, 28), roadMatE);
      expRoad.rotation.x = -Math.PI / 2;
      expRoad.position.set(0, 0.065, ez);
      expRoad.receiveShadow = true;
      scene.add(expRoad);
    });

    // 5. DISTRICT 2: INTERNATIONAL STUNT AIRPORT (X = +700..+1220, Z = -520..+460)
    const tarmac = new THREE.Mesh(
      new THREE.PlaneGeometry(520, 980),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    tarmac.rotation.x = -Math.PI / 2;
    tarmac.position.set(960, 0.04, -30);
    tarmac.receiveShadow = true;
    scene.add(tarmac);

    // Twin 920m Runways (X = 920 and X = 1080)
    [920, 1080].forEach(rwx => {
      const rw = new THREE.Mesh(
        new THREE.PlaneGeometry(44, 920),
        new THREE.MeshStandardMaterial({ map: TEXTURES.runwayTex, roughness: 0.65 })
      );
      rw.rotation.x = -Math.PI / 2;
      rw.position.set(rwx, 0.08, -30);
      rw.receiveShadow = true;
      scene.add(rw);
    });

    // Air Traffic Control Tower (X = 810, Z = -30)
    const towerStem = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 10, 68, 12),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
    );
    towerStem.position.set(810, 34, -30);
    towerStem.castShadow = true;
    const towerCab = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 10, 12, 16),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.7, roughness: 0.2 })
    );
    towerCab.position.set(810, 72, -30);
    airportRadarMesh = new THREE.Mesh(
      new THREE.BoxGeometry(14, 2.2, 1.5),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    airportRadarMesh.position.set(810, 81, -30);
    scene.add(towerStem, towerCab, airportRadarMesh);

    // 2 Drive-Through Stunt Hangars on Tarmac (X = 810, Z = 180 and Z = -220)
    [180, -220].forEach(hz => {
      const hMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.4, roughness: 0.4 });
      const wallL = new THREE.Mesh(new THREE.BoxGeometry(2.5, 22, 54), hMat);
      wallL.position.set(790, 11, hz);
      const wallR = new THREE.Mesh(new THREE.BoxGeometry(2.5, 22, 54), hMat);
      wallR.position.set(830, 11, hz);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(43, 3, 54), hMat);
      roof.position.set(810, 23, hz);
      roof.castShadow = true;
      scene.add(wallL, wallR, roof);
    });

    // 2 Parked 3D Jumbo Jets on Runway 1 (Jump RIGHT OVER their wings with the connected Runway Ramps!)
    [-160, 120].forEach(jz => {
      const jet = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 38, 12), bodyMat);
      fuse.rotation.z = Math.PI / 2;
      fuse.position.y = 4.2;
      const wings = new THREE.Mesh(new THREE.BoxGeometry(10, 0.6, 42), wingMat);
      wings.position.y = 4.0;
      const tail = new THREE.Mesh(new THREE.BoxGeometry(5, 9, 1.2), wingMat);
      tail.position.set(-16, 8.5, 0);
      jet.add(fuse, wings, tail);
      jet.position.set(920, 0, jz);
      scene.add(jet);
    });

    // 6. DISTRICT 3: NORTH MOUNTAIN HIGHWAY & SUMMIT OVERLOOK (Z = -660..-1250)
    // Paved Mountain Highway climbing smoothly along terrain from Z=-660 to Z=-1220
    const mtnRoadGeo = new THREE.PlaneGeometry(30, 580, 1, 40);
    const mrPos = mtnRoadGeo.attributes.position;
    for (let i = 0; i < mrPos.count; i++) {
      const rz = -mrPos.getY(i) - 950;
      mrPos.setZ(i, getTerrainHeightAt(0, rz) + 0.12);
    }
    mtnRoadGeo.computeVertexNormals();
    const mtnRoad = new THREE.Mesh(mtnRoadGeo, roadMatN);
    mtnRoad.rotation.x = -Math.PI / 2;
    mtnRoad.position.set(0, 0, -950);
    mtnRoad.receiveShadow = true;
    scene.add(mtnRoad);

    // Summit Paved Overlook Plaza at (X = 0, Z = -1080, Y = 38m)
    const summitPlaza = new THREE.Mesh(
      new THREE.BoxGeometry(220, 1.0, 220),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 })
    );
    summitPlaza.position.set(0, 37.6, -1080);
    summitPlaza.receiveShadow = true;
    scene.add(summitPlaza);

    const summitSign = new THREE.Mesh(
      new THREE.BoxGeometry(36, 5.5, 1.4),
      new THREE.MeshBasicMaterial({ map: makeSignTexture('SUMMIT SKY-JUMP OVERLOOK', 'ALTITUDE +38M • BLAST OFF RAMP AHEAD!', '#1d4ed8') })
    );
    summitSign.position.set(0, 52, -975);
    scene.add(summitSign);

    // 7. DISTRICT 4: OCEAN CAUSEWAYS & STARLIGHT RESORT ISLAND (Z = +240..+1150)
    // Two Mega Bridges across the Ocean Bay Channel (Z = 220..660):
    // Bridge 1: Golden Gate Suspension Bridge (X = -220, Z = 220..660)
    // Bridge 2: Central Ocean Causeway (X = 0, Z = 220..1100)
    const causeway = new THREE.Mesh(
      new THREE.BoxGeometry(32, 1.6, 880),
      new THREE.MeshStandardMaterial({ map: TEXTURES.roadN, roughness: 0.7 })
    );
    causeway.position.set(0, -0.7, 660);
    causeway.receiveShadow = true;
    scene.add(causeway);

    const bridgeDeck = new THREE.Mesh(
      new THREE.BoxGeometry(30, 1.6, 460),
      new THREE.MeshStandardMaterial({ map: TEXTURES.roadN, roughness: 0.7 })
    );
    bridgeDeck.position.set(-220, -0.7, 440);
    bridgeDeck.receiveShadow = true;
    scene.add(bridgeDeck);

    const towerMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45, metalness: 0.3 });
    [330, 530].forEach(tz => {
      [-234, -206].forEach(tx => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 68, 3.6), towerMat);
        pillar.position.set(tx, 32, tz);
        pillar.castShadow = true;
        scene.add(pillar);
      });
      [30, 56].forEach(by => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(32, 3.0, 3.0), towerMat);
        beam.position.set(-220, by, tz);
        beam.castShadow = true;
        scene.add(beam);
      });
    });

    // Resort Island Sandy Beach & Boardwalk (Z = 650..1150)
    const resortBeach = new THREE.Mesh(
      new THREE.BoxGeometry(920, 1.5, 480),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.9 })
    );
    resortBeach.position.set(0, -0.72, 900);
    resortBeach.receiveShadow = true;
    scene.add(resortBeach);

    // Resort Island Cross-Boulevard (Z = 850)
    const islandRoad = new THREE.Mesh(new THREE.PlaneGeometry(760, 28), roadMatE);
    islandRoad.rotation.x = -Math.PI / 2;
    islandRoad.position.set(0, 0.08, 850);
    scene.add(islandRoad);

    // Rotating 3D Ferris Wheel on Resort Island Boardwalk (X = 140, Z = 890)
    const standMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.3 });
    [-6, 6].forEach(oz => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 38, 10), standMat);
      leg.position.set(140, 18, 890 + oz);
      leg.rotation.x = oz > 0 ? -0.18 : 0.18;
      scene.add(leg);
    });
    ferrisWheelGroup = new THREE.Group();
    ferrisWheelGroup.position.set(140, 35, 890);
    ferrisWheelGroup.add(new THREE.Mesh(new THREE.TorusGeometry(25, 0.9, 12, 36), new THREE.MeshBasicMaterial({ color: 0xf472b6 })));
    const gondolaColors = [0xef4444, 0xf59e0b, 0xeab308, 0x22c55e, 0x06b6d4, 0x3b82f6, 0xa855f7, 0xec4899];
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 50, 6), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      spoke.rotation.z = ang;
      ferrisWheelGroup.add(spoke);
      const cab = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 12), new THREE.MeshStandardMaterial({ color: gondolaColors[i % gondolaColors.length], roughness: 0.3 }));
      cab.position.set(Math.cos(ang) * 25, Math.sin(ang) * 25, 0);
      ferrisWheelGroup.add(cab);
    }
    scene.add(ferrisWheelGroup);

    // 8. DISTRICT 5: DINO SAFARI VALLEY & CANYON RALLY (X = -1200..-660, Z = -400..+400)
    [-920, -1120].forEach(cx => {
      const cRoad = new THREE.Mesh(new THREE.PlaneGeometry(26, 760), roadMatN);
      cRoad.rotation.x = -Math.PI / 2;
      cRoad.position.set(cx, 0.06, 0);
      scene.add(cRoad);
    });
    [-360, 360].forEach(cz => {
      const cRoad = new THREE.Mesh(new THREE.PlaneGeometry(520, 26), roadMatE);
      cRoad.rotation.x = -Math.PI / 2;
      cRoad.position.set(-920, 0.05, cz);
      scene.add(cRoad);
    });

    // Red Rock Canyon Drive-Through Archways over the Dino Rally Track (X = -920)
    [-180, 0, 180].forEach(az => {
      const archMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.85 });
      [-16, 16].forEach(ox => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 5.5, 28, 8), archMat);
        col.position.set(-920 + ox, 14, az);
        scene.add(col);
      });
      const span = new THREE.Mesh(new THREE.BoxGeometry(38, 6, 8), archMat);
      span.position.set(-920, 27, az);
      scene.add(span);
    });

    // 9. Boulevard Welcome Overhead Gantry Archways in Downtown (X = 0)
    [-85, 22].forEach((az, idx) => {
      const archGroup = new THREE.Group();
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.3 });
      [-15.5, 15.5].forEach(ax => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 18.5, 12), pillarMat);
        p.position.set(ax, 9.2, az);
        p.castShadow = true;
        archGroup.add(p);
      });
      const signTex = makeSignTexture(
        idx === 0 ? 'DOWNTOWN ' + hometown.city.toUpperCase() : 'WELCOME TO ' + hometown.city.toUpperCase(),
        `ZIP ${hometown.zip} • ${hometown.state.toUpperCase()}`
      );
      const banner = new THREE.Mesh(new THREE.BoxGeometry(33, 4.8, 1.4), new THREE.MeshBasicMaterial({ map: signTex }));
      banner.position.set(0, 17.5, az);
      if (idx === 0) welcomeSignMeshN = banner;
      else welcomeSignMeshS = banner;
      archGroup.add(banner);
      scene.add(archGroup);
    });

    // 10. Downtown Skyscrapers & District Buildings
    const blockPlots = [
      { x: -165, z: -200, w: 42, d: 42, h: 78, tint: 0x38bdf8, helipad: true },
      { x: -165, z: -80,  w: 38, d: 44, h: 62, tint: 0x818cf8 },
      { x: -55,  z: -200, w: 44, d: 40, h: 92, tint: 0x60a5fa, helipad: true },
      { x: -55,  z: -80,  w: 36, d: 36, h: 52, tint: 0xf472b6 },
      { x: 55,   z: -200, w: 42, d: 40, h: 70, tint: 0x34d399 },
      { x: 55,   z: -80,  w: 38, d: 38, h: 48, tint: 0xfbbf24 },
      { x: 165,  z: -200, w: 44, d: 42, h: 64, tint: 0xa78bfa },
      { x: 165,  z: -80,  w: 36, d: 36, h: 42, tint: 0xf87171 },
      { x: -165, z: 40,   w: 44, d: 36, h: 42, tint: 0xef4444 },
      { x: -165, z: 150,  w: 38, d: 34, h: 36, tint: 0x3b82f6 },
      { x: -45,  z: 40,   w: 36, d: 36, h: 54, tint: 0x38bdf8 },
      { x: -45,  z: 150,  w: 38, d: 34, h: 44, tint: 0xa855f7 },
      { x: 55,   z: 150,  w: 40, d: 34, h: 48, tint: 0x22c55e },
      { x: 165,  z: 40,   w: 40, d: 38, h: 46, tint: 0xf59e0b },
      { x: 165,  z: 150,  w: 38, d: 36, h: 40, tint: 0xf43f5e },
      // North Downtown High-Rises
      { x: -55,  z: -340, w: 48, d: 44, h: 112, tint: 0x38bdf8 },
      { x: 55,   z: -340, w: 48, d: 44, h: 106, tint: 0xfacc15 },
      { x: -165, z: -340, w: 44, d: 42, h: 88,  tint: 0xf472b6 },
      { x: 165,  z: -340, w: 44, d: 42, h: 84,  tint: 0x34d399 },
      // East & West Midtown Towers
      { x: -330, z: -200, w: 44, d: 44, h: 72,  tint: 0x2dd4bf },
      { x: -330, z: -80,  w: 42, d: 42, h: 58,  tint: 0xfb7185 },
      { x: -330, z: 40,   w: 42, d: 42, h: 48,  tint: 0x60a5fa },
      { x: 330,  z: -200, w: 44, d: 44, h: 76,  tint: 0x818cf8 },
      { x: 330,  z: -80,  w: 42, d: 42, h: 60,  tint: 0xfacc15 },
      { x: 330,  z: 40,   w: 42, d: 42, h: 50,  tint: 0x4ade80 }
    ];

    blockPlots.forEach((b, idx) => {
      const tex = idx % 2 === 0 ? TEXTURES.buildingGlass : TEXTURES.buildingWarm;
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.25 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const crown = new THREE.Mesh(new THREE.BoxGeometry(b.w + 1.2, 1.8, b.d + 1.2), new THREE.MeshBasicMaterial({ color: b.tint }));
      crown.position.set(b.x, b.h + 0.9, b.z);
      scene.add(crown);

      if (b.helipad) {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
        pad.position.set(b.x, b.h + 1.9, b.z);
        scene.add(pad);
        const ring = new THREE.Mesh(new THREE.RingGeometry(7.5, 9, 24), new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(b.x, b.h + 2.25, b.z);
        scene.add(ring);
      }

      const col = {
        minX: b.x - b.w / 2 - 1.5,
        maxX: b.x + b.w / 2 + 1.5,
        minZ: b.z - b.d / 2 - 1.5,
        maxZ: b.z + b.d / 2 + 1.5,
        height: b.h + 2
      };
      baseBuildingColliders.push(col);
      buildingColliders.push(col);
    });

    // 11. 3D Car-Soccer Stadium (X = 55, Z = 42)
    const pitchMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(76, 56),
      new THREE.MeshStandardMaterial({ map: TEXTURES.soccerPitch, roughness: 0.8 })
    );
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.rotation.z = Math.PI / 2;
    pitchMesh.position.set(55, 0.08, 42);
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    [17, 93].forEach((gx, gi) => {
      const goalColor = gi === 0 ? 0x38bdf8 : 0xf43f5e;
      const postMat = new THREE.MeshBasicMaterial({ color: goalColor });
      const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 18), postMat);
      crossbar.position.set(gx, 7.5, 42);
      scene.add(crossbar);
      [-8.5, 8.5].forEach(gz => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 7.5, 12), postMat);
        post.position.set(gx, 3.75, 42 + gz);
        scene.add(post);
      });
    });

    // 12. PROPERLY CONNECTED STUNT RAMPS (WITH CENTER EXPRESS LANES, GUARDRAILS & PAIRED LANDINGS!)
    const connectedRamps = [
      // Central Grand Boulevard Center Stunt Lane (8.5m wide in a 32m road, leaving 11m pass-through lanes on both sides!)
      { x: 0,    z: 35,   w: 9.5, l: 26, h: 6.2, dir: 'N' },
      { x: 0,    z: -32,  w: 9.5, l: 24, h: 6.2, dir: 'S', noRing: true }, // Paired smooth down-landing ramp!
      { x: 0,    z: -195, w: 9.5, l: 26, h: 6.8, dir: 'N' },
      { x: 0,    z: -260, w: 9.5, l: 24, h: 6.8, dir: 'S', noRing: true },

      // Stunt Airport Runway Jumbo-Jet Jumps (Jump right over the parked 3D Jumbo Jets at Z = 120 and Z = -160!)
      { x: 920,  z: 155,  w: 14,  l: 30, h: 8.5, dir: 'N' },
      { x: 920,  z: 85,   w: 14,  l: 28, h: 8.5, dir: 'S', noRing: true },
      { x: 920,  z: -125, w: 14,  l: 30, h: 8.5, dir: 'N' },
      { x: 920,  z: -195, w: 14,  l: 28, h: 8.5, dir: 'S', noRing: true },
      // Runway 2 Speed Jump
      { x: 1080, z: 0,    w: 16,  l: 34, h: 10.5, dir: 'N' },

      // North Mountain Summit Mega Ski-Jump (At Y = 38m altitude, launching South toward Downtown!)
      { x: 0,    z: -955, w: 16,  l: 34, h: 11.0, baseY: 38.0, dir: 'S' },

      // Starlight Resort Island & Golden Gate Bridge Jumps
      { x: -220, z: 260,  w: 10,  l: 26, h: 6.8, dir: 'S' },
      { x: 0,    z: 780,  w: 12,  l: 28, h: 7.5, dir: 'S' },

      // Dino Safari Canyon Rally Jumps
      { x: -920, z: 80,   w: 11,  l: 26, h: 7.2, dir: 'N' },
      { x: -920, z: -80,  w: 11,  l: 26, h: 7.2, dir: 'N' }
    ];

    connectedRamps.forEach(r => addConnectedRamp(r));

    // 13. Knockable 3D Physics Props (Cones & Crates across Districts)
    const coneGeo = new THREE.ConeGeometry(0.85, 2.2, 10);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const crateGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });

    for (let i = 0; i < 110; i++) {
      const isCone = i % 3 !== 0;
      const mesh = new THREE.Mesh(isCone ? coneGeo : crateGeo, isCone ? coneMat : crateMat);
      const rx = roadXCoords[i % roadXCoords.length] + (i % 2 === 0 ? 11 : -11);
      const rz = -520 + (i * 10.5) % 1080;
      mesh.position.set(rx, isCone ? 1.1 : 0.9, rz);
      mesh.castShadow = true;
      scene.add(mesh);
      physicsProps.push({ mesh, vx: 0, vy: 0, vz: 0, hitCooldown: 0, baseY: isCone ? 1.1 : 0.9 });
    }

    // 14. Fluffy 3D Sky Clouds across the 3km Sky
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    for (let i = 0; i < 36; i++) {
      const cg = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(10 + Math.random() * 8, 10, 10), cloudMat);
        puff.position.set(j * 9 - 14, Math.random() * 4, (Math.random() - 0.5) * 8);
        puff.scale.y = 0.55;
        cg.add(puff);
      }
      cg.position.set((Math.random() - 0.5) * 2400, 135 + Math.random() * 55, (Math.random() - 0.5) * 2400);
      scene.add(cg);
      clouds.push(cg);
    }

    // 15. 3D Weather Particle Pool
    const flakeGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    const flakeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 220; i++) {
      const p = new THREE.Mesh(flakeGeo, flakeMat);
      p.position.set((Math.random() - 0.5) * 180, Math.random() * 75, (Math.random() - 0.5) * 180);
      p.visible = false;
      scene.add(p);
      weatherParticles.push(p);
    }
  }

  // --- REBUILD DYNAMIC HOMETOWN LAYER (OSM BUILDINGS, 3D STREET SIGNS, FLORA & HORIZON) ---
  function rebuildHometownScenery(osmData = null) {
    while (hometownDynamicGroup.children.length > 0) {
      hometownDynamicGroup.remove(hometownDynamicGroup.children[0]);
    }
    buildingColliders.length = 0;
    baseBuildingColliders.forEach(c => buildingColliders.push(c));

    if (welcomeSignMeshN) {
      welcomeSignMeshN.material.map = makeSignTexture(
        'DOWNTOWN SUPER LEO CITY',
        'PALM GROVE PARK • PIZZA PLAZA • HERO HQ',
        '#701a75',
        '#ff49a8',
        '#ffffff'
      );
      welcomeSignMeshN.material.needsUpdate = true;
    }
    if (welcomeSignMeshS) {
      welcomeSignMeshS.material.map = makeSignTexture(
        'WELCOME TO SUPER LEO ISLAND',
        'OCEAN CAUSEWAY • LIGHTHOUSE PIER • RESORT BEACH',
        '#0f172a',
        '#00e5ff',
        '#ffffff'
      );
      welcomeSignMeshS.material.needsUpdate = true;
    }

    if (terrainMesh) {
      if (hometown.biome === 'desert') {
        terrainMesh.material.map = TEXTURES.desertSand;
        terrainReliefScale = 24;
      } else if (hometown.biome === 'alpine') {
        terrainMesh.material.map = TEXTURES.snowGround;
        terrainReliefScale = 36;
      } else {
        terrainMesh.material.map = TEXTURES.grass;
        terrainReliefScale = hometown.biome === 'coastal' ? 14 : 20;
      }
      terrainMesh.material.needsUpdate = true;
      rebuildTerrainVertices();
    }

    // 3D Green Street Name Signs at Major Intersections & District Entrances!
    const streetSignCoords = [
      { x: 17,   z: 58,   streetIdx: 0 },
      { x: -17,  z: -5,   streetIdx: 1 },
      { x: 17,   z: -115, streetIdx: 2 },
      { x: -200, z: 58,   streetIdx: 3 },
      { x: 200,  z: 58,   streetIdx: 4 },
      { x: -200, z: -115, streetIdx: 5 },
      { x: 640,  z: -120, custom: '✈️ STUNT AIRPORT EXPY' },
      { x: -640, z: -120, custom: '🦖 DINO CANYON PKWY' },
      { x: 18,   z: -640, custom: '🏔️ SUMMIT HIGHWAY' },
      { x: 18,   z: 215,  custom: '🏖️ OCEAN CAUSEWAY' }
    ];
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 });
    streetSignCoords.forEach((sc, idx) => {
      const sName = sc.custom || (hometown.streets[idx % hometown.streets.length] || 'MAIN ST').toUpperCase();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 7.8, 8), poleMat);
      post.position.set(sc.x, 3.9, sc.z);
      hometownDynamicGroup.add(post);

      const board = new THREE.Mesh(
        new THREE.BoxGeometry(9.5, 2.3, 0.35),
        new THREE.MeshBasicMaterial({ map: makeSignTexture(sName, `📍 ${hometown.city}, ${hometown.stateAbbr}`, '#047857') })
      );
      board.position.set(sc.x, 7.8, sc.z);
      hometownDynamicGroup.add(board);
    });

    // Extrude Real OpenStreetMap Building Footprints cleanly inside City Blocks (No floating disconnected road scraps!)
    if (osmData && Array.isArray(osmData.elements)) {
      const nodes = new Map();
      osmData.elements.forEach(el => {
        if (el.type === 'node') nodes.set(el.id, el);
      });

      const metersPerDegLat = 111132;
      const metersPerDegLon = 111132 * Math.cos((hometown.lat * Math.PI) / 180);
      const osmBldgMat = new THREE.MeshStandardMaterial({
        map: TEXTURES.buildingWarm,
        roughness: 0.45,
        metalness: 0.2
      });

      let osmBuildingsAdded = 0;
      osmData.elements.forEach(el => {
        if (el.type !== 'way' || !Array.isArray(el.nodes) || !el.tags || !el.tags.building) return;
        if (osmBuildingsAdded >= 65) return;

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        el.nodes.forEach(nid => {
          const n = nodes.get(nid);
          if (n) {
            const x = (n.lon - hometown.lon) * metersPerDegLon * 1.8;
            const z = -(n.lat - hometown.lat) * metersPerDegLat * 1.8;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
          }
        });
        if (!isFinite(minX)) return;

        const cx = (minX + maxX) / 2;
        const cz = (minZ + maxZ) / 2;
        const bw = Math.max(10, Math.min(36, (maxX - minX) * 1.2));
        const bd = Math.max(10, Math.min(36, (maxZ - minZ) * 1.2));

        // Keep roads, ramps, and soccer pitch 100% clear!
        if (roadXCoords.some(rx => Math.abs(cx - rx) < 28)) return;
        if (roadZCoords.some(rz => Math.abs(cz - rz) < 28)) return;
        if (cx > 0 && cx < 110 && cz > -5 && cz < 90) return;
        if (Math.abs(cx) > 610 || Math.abs(cz) > 610) return;

        const levels = parseInt(el.tags['building:levels'], 10) || (2 + (osmBuildingsAdded % 7));
        const bh = Math.min(82, Math.max(14, levels * 5.8));
        const baseY = getTerrainHeightAt(cx, cz);

        const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), osmBldgMat);
        bMesh.position.set(cx, baseY + bh / 2, cz);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        hometownDynamicGroup.add(bMesh);
        osmBuildingsAdded++;
      });
    }

    // Outer 3D Mountain Range / Red Rock Canyon Horizon around the 3km World (Radius = 1550m)
    const isDesert = hometown.biome === 'desert';
    const isAlpine = hometown.biome === 'alpine';
    const mtnMat = new THREE.MeshStandardMaterial({
      color: isDesert ? 0xc2410c : isAlpine ? 0x475569 : 0x334155,
      roughness: 0.88
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: isDesert ? 0xf59e0b : 0xf8fafc,
      roughness: 0.55
    });

    for (let i = 0; i < 36; i++) {
      const ang = (i / 36) * Math.PI * 2;
      const dist = 1520 + (i % 3) * 110;
      const h = (isAlpine ? 240 : isDesert ? 165 : 185) + (i % 4) * 55;
      const mtn = new THREE.Group();

      if (isDesert) {
        const mesa = new THREE.Mesh(new THREE.CylinderGeometry(65, 135, h, 8), mtnMat);
        mesa.position.y = h / 2 - 2;
        const topLayer = new THREE.Mesh(new THREE.CylinderGeometry(52, 65, h * 0.22, 8), capMat);
        topLayer.position.y = h * 0.9 - 2;
        mtn.add(mesa, topLayer);
      } else {
        const base = new THREE.Mesh(new THREE.ConeGeometry(155, h, 7), mtnMat);
        base.position.y = h / 2 - 2;
        const cap = new THREE.Mesh(new THREE.ConeGeometry(68, h * 0.44, 7), capMat);
        cap.position.y = h * 0.78 - 2;
        mtn.add(base, cap);
      }
      mtn.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
      hometownDynamicGroup.add(mtn);
    }

    // Regional Flora across the 6 Districts
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: isAlpine ? 0x065f46 : 0x16a34a, roughness: 0.7 });
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });

    for (let i = 0; i < 160; i++) {
      const tx = (Math.random() - 0.5) * 1800;
      const tz = (Math.random() - 0.5) * 1800;
      if (isOnFlatRoadOrDistrict(tx, tz)) continue;
      if (tz > 240 && tz < 640) continue; // Ocean channel
      if (buildingColliders.some(b => tx > b.minX - 5 && tx < b.maxX + 5 && tz > b.minZ - 5 && tz < b.maxZ + 5)) continue;

      const ty = getTerrainHeightAt(tx, tz);
      if (ty < -0.5) continue;
      const flora = new THREE.Group();

      if (isDesert || tx < -650) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 8.5, 8), cactusMat);
        stem.position.y = 4.25;
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 3.2, 8), cactusMat);
        armL.position.set(-1.1, 5.2, 0);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.8, 8), cactusMat);
        armR.position.set(1.1, 4.4, 0);
        flora.add(stem, armL, armR);
      } else if (hometown.biome === 'coastal' || tz > 640) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.75, 10.5, 8), trunkMat);
        trunk.position.y = 5.2;
        flora.add(trunk);
        for (let f = 0; f < 6; f++) {
          const frond = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 4.8), leafMat);
          const fang = (f / 6) * Math.PI * 2;
          frond.position.set(Math.sin(fang) * 2.1, 10.4, Math.cos(fang) * 2.1);
          frond.rotation.y = fang;
          frond.rotation.x = 0.35;
          flora.add(frond);
        }
      } else {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 6, 7), trunkMat);
        trunk.position.y = 3;
        const crown1 = new THREE.Mesh(new THREE.ConeGeometry(4.2, 8, 8), leafMat);
        crown1.position.y = 8;
        const crown2 = new THREE.Mesh(new THREE.ConeGeometry(3.1, 6.5, 8), isAlpine || tz < -650 ? snowMat : leafMat);
        crown2.position.y = 11.5;
        flora.add(trunk, crown1, crown2);
      }

      flora.position.set(tx, ty, tz);
      hometownDynamicGroup.add(flora);
    }
  }

  // --- HANDCRAFTED EXPLORABLE OPEN-WORLD ISLAND (FOOT & CAR DISCOVERY!) ---
  const ISLAND_LANDMARKS = [
    { id: 'palm_park', emoji: '🌴', name: 'Palm Grove Trampoline Park', sub: 'Fountain, Benches & Bouncy Jump Pads', x: -110, z: 40, radius: 52 },
    { id: 'pizza_plaza', emoji: '🍕', name: "Leo's Neon Pizza Plaza", sub: 'Spinning Rooftop Pizza & Patio', x: 165, z: -20, radius: 46 },
    { id: 'fire_hq', emoji: '🚒', name: 'Central Fire Station HQ', sub: 'Drive-Through Bay & Big Red Engine', x: -185, z: 100, radius: 46 },
    { id: 'hero_hq', emoji: '🚓', name: 'Hero Patrol Precinct', sub: 'Neon Beacon & Patrol Cruisers', x: -185, z: -140, radius: 46 },
    { id: 'sunny_scoops', emoji: '🍦', name: 'Sunny Scoops Beach Parlor', sub: 'Pastel Ice Cream Shop & Umbrellas', x: -130, z: 850, radius: 52 },
    { id: 'ferris_boardwalk', emoji: '🎡', name: 'Starlight Boardwalk & Wheel', sub: 'Giant Ferris Wheel & Ocean Lamps', x: 140, z: 890, radius: 58 },
    { id: 'lighthouse_pier', emoji: '🗼', name: 'Sunset Lighthouse & Pier', sub: 'Walkable Ocean Pier & Rotating Beacon', x: 340, z: 960, radius: 60 },
    { id: 'soccer_stadium', emoji: '⚽', name: 'Super Leo Soccer Stadium', sub: '3D Car-Soccer Pitch & Floodlights', x: 55, z: 42, radius: 55 },
    { id: 'stunt_airport', emoji: '✈️', name: 'Stunt Airport & Tower', sub: 'Twin Runways, Hangars & Jumbo Jets', x: 920, z: 120, radius: 95 },
    { id: 'dino_canyon', emoji: '🦖', name: 'Dino Safari Canyon', sub: 'Red Rock Arches, Volcano & T-Rex', x: -920, z: 0, radius: 95 }
  ];
  const discoveredLandmarks = new Set();
  const collectibleStars = [];
  const jumpPads = [];
  const citizens = [];
  let lighthouseBeam = null;
  let rooftopPizzaSign = null;
  let customWaypoint = null;

  // Custom 3D Cyan Waypoint dropped by clicking the Interactive Street Map (M)
  const waypointGroup = new THREE.Group();
  const wpBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.2, 110, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
  );
  wpBeam.position.y = 55;
  const wpRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.5, 0.45, 10, 24),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff })
  );
  wpRing.rotation.x = Math.PI / 2;
  wpRing.position.y = 0.6;
  waypointGroup.add(wpBeam, wpRing);
  waypointGroup.visible = false;
  scene.add(waypointGroup);

  function addJumpPad(x, z, baseY = 0, power = 34) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.8, 0.7, 20),
      new THREE.MeshStandardMaterial({ color: 0x140b29, roughness: 0.4, metalness: 0.5 })
    );
    base.position.y = 0.35;
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(3.3, 3.3, 0.78, 20),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    glow.position.y = 0.38;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.9, 0.25, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xff49a8 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.76;
    g.add(base, glow, ring);
    g.position.set(x, baseY, z);
    scene.add(g);
    jumpPads.push({ x, y: baseY, z, power, mesh: g, cooldown: 0 });
  }

  function addCollectibleStar(x, z, extraY = 3.2, hint = 'Island Secret') {
    const baseY = Math.max(0, getTerrainHeightAt(x, z)) + extraY;
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.75, 0),
      new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xf59e0b, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.6 })
    );
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.16, 8, 20),
      new THREE.MeshBasicMaterial({ color: 0xff49a8 })
    );
    g.add(core, halo);
    g.position.set(x, baseY, z);
    scene.add(g);
    collectibleStars.push({ x, y: baseY, z, baseY, hint, mesh: g, collected: false });
  }

  function addCitizen(cx, cz, radius = 18, phase = 0) {
    const shirtColors = [0xff49a8, 0x00e5ff, 0xffd166, 0x42f59b, 0xa855f7, 0xf97316];
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.8, 0.75),
      new THREE.MeshStandardMaterial({ color: shirtColors[citizens.length % shirtColors.length] })
    );
    body.position.y = 2.1;
    body.castShadow = true;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xfde68a })
    );
    head.position.y = 3.55;
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.45), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    legL.position.set(-0.3, 0.65, 0);
    const legR = legL.clone();
    legR.position.x = 0.3;
    g.add(body, head, legL, legR);
    g.position.set(cx, 0, cz);
    scene.add(g);
    citizens.push({
      mesh: g,
      legL,
      legR,
      cx,
      cz,
      x: cx,
      z: cz,
      r: radius,
      angle: phase,
      spd: 0.32 + (citizens.length % 4) * 0.08,
      cheerTimer: 0,
      waveCooldown: 0
    });
  }

  function buildExplorableWorld() {
    // 1. PALM GROVE TRAMPOLINE PARK (Walkable Plaza, Tiered Fountain, Benches & 3 Jump Pads!)
    const parkPad = new THREE.Mesh(
      new THREE.CylinderGeometry(36, 36, 0.35, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    parkPad.position.set(-110, 0.12, 40);
    parkPad.receiveShadow = true;
    scene.add(parkPad);

    const fountainBase = new THREE.Mesh(
      new THREE.CylinderGeometry(9.5, 10.5, 1.6, 20),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
    );
    fountainBase.position.set(-110, 0.9, 40);
    const fountainWater = new THREE.Mesh(
      new THREE.CylinderGeometry(8.4, 8.4, 1.4, 20),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    fountainWater.position.set(-110, 1.0, 40);
    const fountainSpire = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 2.4, 6.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xff85c8 })
    );
    fountainSpire.position.set(-110, 3.6, 40);
    scene.add(fountainBase, fountainWater, fountainSpire);

    // Park Benches around Fountain
    const benchMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const bench = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.1, 1.6), benchMat);
      bench.position.set(-110 + Math.cos(a) * 19, 0.7, 40 + Math.sin(a) * 19);
      bench.rotation.y = -a + Math.PI / 2;
      scene.add(bench);
    }

    // 3 Bouncy Jump Pads in Palm Grove Park + others across the island!
    addJumpPad(-110, 12, 0.2, 34);
    addJumpPad(-84, 40, 0.2, 34);
    addJumpPad(-136, 40, 0.2, 34);
    addJumpPad(165, 12, 0.1, 32);    // Leo's Pizza Plaza jump pad
    addJumpPad(140, 845, 0.1, 36);   // Ferris Wheel Boardwalk jump pad
    addJumpPad(-130, 815, 0.1, 32);  // Sunny Scoops Beach jump pad
    addJumpPad(340, 920, 0.1, 34);   // Lighthouse Pier jump pad
    addJumpPad(845, 120, 0.1, 38);   // Airport Hangar super bounce

    // 2. LEO'S NEON PIZZA PLAZA (X = 165, Z = -20)
    const pizzaPatio = new THREE.Mesh(
      new THREE.BoxGeometry(44, 0.3, 40),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 })
    );
    pizzaPatio.position.set(165, 0.15, -20);
    scene.add(pizzaPatio);

    const pizzaShop = new THREE.Mesh(
      new THREE.BoxGeometry(22, 11, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 })
    );
    pizzaShop.position.set(165, 5.5, -28);
    pizzaShop.castShadow = true;
    const pizzaStripe = new THREE.Mesh(
      new THREE.BoxGeometry(23, 2.2, 17),
      new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    pizzaStripe.position.set(165, 11.4, -28);
    scene.add(pizzaShop, pizzaStripe);

    rooftopPizzaSign = new THREE.Group();
    const rpDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, 0.9, 18),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.35 })
    );
    rpDisc.rotation.x = Math.PI / 2;
    rooftopPizzaSign.add(rpDisc);
    rooftopPizzaSign.position.set(165, 17.5, -28);
    scene.add(rooftopPizzaSign);

    const pizzaSignBoard = new THREE.Mesh(
      new THREE.BoxGeometry(18, 3.2, 0.6),
      new THREE.MeshBasicMaterial({ map: makeSignTexture("LEO'S NEON PIZZA", 'HOT SLICES & PATIO', '#991b1b', '#ffd166') })
    );
    pizzaSignBoard.position.set(165, 9.2, -19.6);
    scene.add(pizzaSignBoard);

    // 3. SUNNY SCOOPS BEACH PARLOR (X = -130, Z = 850)
    const parlor = new THREE.Mesh(
      new THREE.BoxGeometry(24, 10, 16),
      new THREE.MeshStandardMaterial({ color: 0xff85c8, roughness: 0.4 })
    );
    parlor.position.set(-130, 5, 868);
    parlor.castShadow = true;
    const coneRoof = new THREE.Mesh(
      new THREE.ConeGeometry(4.2, 9.5, 14),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    coneRoof.rotation.x = Math.PI;
    coneRoof.position.set(-130, 14.5, 868);
    const scoopRoof = new THREE.Mesh(
      new THREE.SphereGeometry(4.4, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0x67e8f9 })
    );
    scoopRoof.position.set(-130, 19.5, 868);
    const scoopsSign = new THREE.Mesh(
      new THREE.BoxGeometry(19, 3.2, 0.6),
      new THREE.MeshBasicMaterial({ map: makeSignTexture('SUNNY SCOOPS', 'RAINBOW CONES • BEACH PARLOR', '#be185d', '#67e8f9') })
    );
    scoopsSign.position.set(-130, 8.6, 859.6);
    scene.add(parlor, coneRoof, scoopRoof, scoopsSign);

    // Colorful Beach Umbrellas along Resort Island
    const umbColors = [0xff49a8, 0x00e5ff, 0xffd166, 0x42f59b];
    for (let i = 0; i < 12; i++) {
      const ux = -260 + i * 48;
      const uz = 945 + (i % 2) * 35;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.5, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      pole.position.set(ux, 2.75, uz);
      const top = new THREE.Mesh(
        new THREE.ConeGeometry(4.6, 1.8, 10),
        new THREE.MeshStandardMaterial({ color: umbColors[i % umbColors.length], roughness: 0.5 })
      );
      top.position.set(ux, 5.6, uz);
      scene.add(pole, top);
    }

    // 4. SUNSET LIGHTHOUSE & WALKABLE OCEAN PIER (X = 340, Z = 960..1180)
    const pierDeck = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1.8, 220),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 })
    );
    pierDeck.position.set(340, 0.2, 1065);
    pierDeck.receiveShadow = true;
    scene.add(pierDeck);

    // Striped Red & White Lighthouse Tower
    for (let s = 0; s < 5; s++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(6.8 - s * 0.7, 7.5 - s * 0.7, 8.5, 16),
        new THREE.MeshStandardMaterial({ color: s % 2 === 0 ? 0xffffff : 0xef4444, roughness: 0.4 })
      );
      seg.position.set(340, 4.5 + s * 8.5, 1165);
      seg.castShadow = true;
      scene.add(seg);
    }
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8, 3.8, 6.5, 14),
      new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    lantern.position.set(340, 46, 1165);
    const lhRoof = new THREE.Mesh(
      new THREE.ConeGeometry(4.8, 5.5, 14),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    lhRoof.position.set(340, 51.5, 1165);
    scene.add(lantern, lhRoof);

    lighthouseBeam = new THREE.Group();
    lighthouseBeam.position.set(340, 46, 1165);
    const beamCone = new THREE.Mesh(
      new THREE.ConeGeometry(16, 130, 14, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    beamCone.rotation.z = Math.PI / 2;
    beamCone.position.x = 65;
    lighthouseBeam.add(beamCone);
    scene.add(lighthouseBeam);

    // 5. CENTRAL FIRE STATION HQ & HERO PATROL PRECINCT SIGNS
    const fireSign = new THREE.Mesh(
      new THREE.BoxGeometry(20, 3.6, 0.8),
      new THREE.MeshBasicMaterial({ map: makeSignTexture('FIRE STATION HQ', 'BIG RED ENGINE BAY', '#b91c1c', '#facc15') })
    );
    fireSign.position.set(-185, 14, 100);
    const patrolSign = new THREE.Mesh(
      new THREE.BoxGeometry(20, 3.6, 0.8),
      new THREE.MeshBasicMaterial({ map: makeSignTexture('HERO PATROL HQ', 'SUPER LEO PRECINCT', '#1e3a8a', '#00e5ff') })
    );
    patrolSign.position.set(-185, 14, -140);
    scene.add(fireSign, patrolSign);

    // 6. STADIUM FLOODLIGHT TOWERS (X = 55, Z = 42)
    [[14, 10], [96, 10], [14, 74], [96, 74]].forEach(([fx, fz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 26, 8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
      pole.position.set(fx, 13, fz);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.2, 1.4), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      lamp.position.set(fx, 26.5, fz);
      scene.add(pole, lamp);
    });

    // 7. DINO CANYON GLOWING VOLCANO LANDMARK (X = -1020, Z = -200)
    const volcano = new THREE.Mesh(
      new THREE.ConeGeometry(58, 72, 10),
      new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.9 })
    );
    volcano.position.set(-1020, 34, -200);
    const lavaCap = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 16, 4, 10),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    lavaCap.position.set(-1020, 70, -200);
    scene.add(volcano, lavaCap);

    // 8. 24 HIDDEN GOLDEN STAR COLLECTIBLES (Walkable + Car Stunt Secrets!)
    const starSpots = [
      [-110, 40, 9.5, 'Above Palm Grove Fountain'],
      [-110, 12, 11.5, 'Palm Park Bounce Peak'],
      [-84, 40, 11.5, 'East Park Bounce Peak'],
      [165, -14, 3.2, "Leo's Pizza Patio"],
      [165, 12, 11.0, 'Pizza Plaza Bounce Star'],
      [-185, 100, 3.2, 'Fire Station HQ Bay'],
      [-185, -140, 3.2, 'Hero Patrol Precinct'],
      [55, 42, 6.0, 'Stadium Center Kickoff'],
      [0, -32, 8.5, 'Grand Blvd Stunt Jump'],
      [0, -225, 9.5, 'North Blvd Ramp Peak'],
      [-220, 430, 4.5, 'Golden Gate Bridge Deck'],
      [0, 520, 4.5, 'Ocean Causeway Overlook'],
      [-130, 848, 3.2, 'Sunny Scoops Patio'],
      [-130, 815, 11.5, 'Beach Parlor Bounce Star'],
      [140, 868, 3.2, 'Starlight Ferris Wheel Deck'],
      [140, 845, 12.5, 'Boardwalk Bounce Star'],
      [340, 1060, 3.5, 'Sunset Pier Mid-Deck'],
      [340, 1148, 3.8, 'Sunset Lighthouse Tip'],
      [810, 180, 4.2, 'Inside Airport Hangar'],
      [920, 120, 14.0, 'Over the Jumbo Jet!'],
      [1080, -25, 13.5, 'Runway 2 Mega Ramp'],
      [0, -960, 42.0, 'Summit Overlook Ski-Jump'],
      [-920, 0, 5.0, 'Dino Canyon Red Rock Arch'],
      [-920, -180, 5.0, 'Dino Volcano Trail']
    ];
    starSpots.forEach(([sx, sz, sy, hint]) => addCollectibleStar(sx, sz, sy, hint));

    // 9. 22 FRIENDLY WANDERING CITIZENS (Palm Park, Downtown, Pizza Plaza & Resort Boardwalk!)
    const citizenZones = [
      [-110, 40, 22], [-110, 40, 26], [-110, 40, 18], [-110, 40, 30],
      [165, -6, 16], [165, -6, 20], [165, -6, 14],
      [-25, 70, 16], [25, 70, 16], [-25, -45, 18], [25, -45, 18],
      [-130, 840, 22], [-130, 840, 26], [-60, 850, 22],
      [110, 865, 24], [140, 865, 28], [170, 865, 22],
      [340, 990, 8], [340, 1080, 8],
      [55, 78, 18], [-185, 85, 14], [-185, -125, 14]
    ];
    citizenZones.forEach(([cx, cz, r], i) => addCitizen(cx, cz, r, i * 0.9));
  }

  // --- 3D ARTICULATED VEHICLE BUILDER ---
  function createVehicleMesh(spec) {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    const wheels = [];
    let rotorMain = null;
    let rotorTail = null;
    const dinoLegs = [];

    const mainMat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.25, metalness: 0.45 });
    const accentMat = new THREE.MeshStandardMaterial({ color: spec.accent, roughness: 0.3, metalness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.85 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.2 });

    if (spec.isDino) {
      const torso = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.6, 5.6), mainMat);
      torso.position.set(0, 4.2, 0);
      torso.castShadow = true;
      bodyGroup.add(torso);

      const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 3.8), mainMat);
      head.position.set(0, 6.8, 2.8);
      head.castShadow = true;
      bodyGroup.add(head);

      const jaw = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 3.2), accentMat);
      jaw.position.set(0, 5.2, 2.9);
      bodyGroup.add(jaw);

      [-1.42, 1.42].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        eye.position.set(ex, 7.2, 3.6);
        bodyGroup.add(eye);
      });

      const tail = new THREE.Mesh(new THREE.ConeGeometry(1.4, 6.5, 8), mainMat);
      tail.rotation.x = -Math.PI / 2.2;
      tail.position.set(0, 4.0, -5.2);
      bodyGroup.add(tail);

      [-1.4, 1.4].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.6, 1.8), mainMat);
        leg.position.set(lx, 1.8, 0);
        leg.castShadow = true;
        bodyGroup.add(leg);
        dinoLegs.push(leg);
      });
    } else if (spec.isFlying) {
      const fuselage = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.2, 7.5), mainMat);
      fuselage.position.set(0, 2.8, 0);
      fuselage.castShadow = true;
      bodyGroup.add(fuselage);

      const cockpit = new THREE.Mesh(new THREE.SphereGeometry(2.1, 16, 12), glassMat);
      cockpit.position.set(0, 2.9, 2.6);
      bodyGroup.add(cockpit);

      const tailBoom = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 6.5), accentMat);
      tailBoom.position.set(0, 3.1, -6.2);
      bodyGroup.add(tailBoom);

      [-1.8, 1.8].forEach(sx => {
        const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 7.5, 8), rimMat);
        skid.rotation.x = Math.PI / 2;
        skid.position.set(sx, 0.5, 0.5);
        bodyGroup.add(skid);
      });

      rotorMain = new THREE.Group();
      rotorMain.position.set(0, 4.8, 0);
      rotorMain.add(
        new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.12, 0.7), wheelMat),
        new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 13.5), wheelMat)
      );
      bodyGroup.add(rotorMain);

      rotorTail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 0.4), accentMat);
      rotorTail.position.set(0.65, 3.3, -9.2);
      bodyGroup.add(rotorTail);
    } else if (spec.isBoat) {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.5, 8.6), mainMat);
      hull.position.set(0, 1.1, 0);
      hull.castShadow = true;
      bodyGroup.add(hull);

      const bow = new THREE.Mesh(new THREE.ConeGeometry(2.8, 4.2, 4), accentMat);
      bow.rotation.x = Math.PI / 2;
      bow.rotation.y = Math.PI / 4;
      bow.position.set(0, 1.2, 5.8);
      bodyGroup.add(bow);

      const windshield = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.1, 2.2), glassMat);
      windshield.position.set(0, 2.1, 1.2);
      bodyGroup.add(windshield);
    } else {
      const isTruck = spec.id === 'firetruck' || spec.id === 'icecream';
      const isMonster = spec.id === 'monster';
      const chassisH = isTruck ? 2.8 : 1.35;
      const chassisL = isTruck ? 9.2 : 7.2;
      const chassisW = isMonster ? 4.2 : 3.8;
      const liftY = isMonster ? 2.4 : 1.15;

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(chassisW, chassisH, chassisL), mainMat);
      chassis.position.set(0, liftY + chassisH / 2, 0);
      chassis.castShadow = true;
      bodyGroup.add(chassis);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(chassisW + 0.1, 0.45, chassisL * 0.88), accentMat);
      stripe.position.set(0, liftY + chassisH * 0.45, 0);
      bodyGroup.add(stripe);

      const cabL = isTruck ? chassisL * 0.72 : chassisL * 0.52;
      const cabH = isTruck ? 1.8 : 1.25;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(chassisW * 0.86, cabH, cabL), glassMat);
      cabin.position.set(0, liftY + chassisH + cabH / 2 - 0.1, isTruck ? 0.4 : -0.3);
      cabin.castShadow = true;
      bodyGroup.add(cabin);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(chassisW * 0.82, 0.25, cabL * 0.88), mainMat);
      roof.position.set(0, liftY + chassisH + cabH, isTruck ? 0.4 : -0.3);
      bodyGroup.add(roof);

      if (spec.id === 'supercar') {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.22, 1.1), accentMat);
        wing.position.set(0, liftY + chassisH + 0.85, -chassisL / 2 + 0.5);
        bodyGroup.add(wing);
      } else if (spec.id === 'police' || spec.id === 'firetruck') {
        const barRed = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        barRed.position.set(-0.75, liftY + chassisH + cabH + 0.3, 0.4);
        const barBlue = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.6), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
        barBlue.position.set(0.75, liftY + chassisH + cabH + 0.3, 0.4);
        bodyGroup.add(barRed, barBlue);
        if (spec.id === 'firetruck') {
          const ladder = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 7.6), new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4 }));
          ladder.position.set(0, liftY + chassisH + cabH + 0.55, -0.5);
          bodyGroup.add(ladder);
        }
      } else if (spec.id === 'icecream') {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.4, 12), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
        cone.rotation.x = Math.PI * 0.78;
        cone.position.set(0, liftY + chassisH + cabH + 1.1, 0.2);
        const scoop = new THREE.Mesh(new THREE.SphereGeometry(1.05, 14, 14), new THREE.MeshStandardMaterial({ color: 0xf472b6 }));
        scoop.position.set(0, liftY + chassisH + cabH + 2.1, 0.8);
        bodyGroup.add(cone, scoop);
      } else if (spec.id === 'pizza') {
        const pie = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.35, 18), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        pie.position.set(0, liftY + chassisH + cabH + 0.35, -0.3);
        bodyGroup.add(pie);
      }

      const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      [-1.25, 1.25].forEach(lx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.2), hlMat);
        hl.position.set(lx, liftY + 0.7, chassisL / 2 + 0.05);
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 0.2), tlMat);
        tl.position.set(lx, liftY + 0.75, -chassisL / 2 - 0.05);
        bodyGroup.add(hl, tl);
      });

      const wheelRadius = isMonster ? 1.55 : 0.95;
      const wheelWidth = isMonster ? 1.15 : 0.65;
      const wheelX = chassisW / 2 + wheelWidth * 0.32;
      const wheelZ = chassisL * 0.33;

      [
        { x: -wheelX, z: wheelZ, front: true },
        { x: wheelX, z: wheelZ, front: true },
        { x: -wheelX, z: -wheelZ, front: false },
        { x: wheelX, z: -wheelZ, front: false }
      ].forEach(wp => {
        const wGroup = new THREE.Group();
        wGroup.position.set(wp.x, wheelRadius, wp.z);
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 18), wheelMat);
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.55, wheelRadius * 0.55, wheelWidth + 0.05, 12), rimMat);
        hub.rotation.z = Math.PI / 2;
        wGroup.add(tire, hub);
        root.add(wGroup);
        wheels.push({ group: wGroup, tire, front: wp.front });
      });
    }

    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const flameGroup = new THREE.Group();
    [-0.9, 0.9].forEach(fx => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.6, 10), flameMat);
      f.rotation.x = -Math.PI / 2;
      f.position.set(fx, 1.2, -4.6);
      flameGroup.add(f);
    });
    flameGroup.visible = false;
    bodyGroup.add(flameGroup);

    const headSpot = new THREE.SpotLight(0xfffbeb, 0.0, 85, Math.PI / 5, 0.45, 1.2);
    headSpot.position.set(0, 2.4, 3.5);
    headSpot.target.position.set(0, 0, 28);
    bodyGroup.add(headSpot);
    bodyGroup.add(headSpot.target);

    scene.add(root);

    return {
      spec,
      root,
      bodyGroup,
      wheels,
      rotorMain,
      rotorTail,
      dinoLegs,
      flameGroup,
      headSpot,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      heading: 0,
      speed: 0,
      steerAngle: 0,
      airTime: 0
    };
  }

  function createLeoCharacter() {
    const group = new THREE.Group();
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.5 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.8), shirtMat);
    torso.position.y = 2.1;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.65, 14, 14), skinMat);
    head.position.y = 3.45;
    head.castShadow = true;
    group.add(head);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.35, 1.35), capMat);
    cap.position.set(0, 3.95, 0.15);
    group.add(cap);

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.3, 0.52), pantsMat);
    legL.position.set(-0.32, 0.7, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.3, 0.52), pantsMat);
    legR.position.set(0.32, 0.7, 0);
    group.add(legL, legR);

    group.visible = false;
    scene.add(group);
    return { group, legL, legR, x: 0, y: 0, z: 0, vy: 0, heading: 0, speed: 0 };
  }

  // --- INITIALIZE BASE WORLD, EXPLORABLE LANDMARKS & PARKED VEHICLES ---
  buildBaseWorld();
  rebuildHometownScenery(null);
  buildExplorableWorld();

  const worldVehicles = [];
  const spawnPositions = [
    { x: 0,    z: 75,   h: Math.PI },       // 1: Comet GT Supercar (Downtown Grand Blvd)
    { x: -185, z: -120, h: Math.PI },       // 2: Hero Patrol Interceptor (Hero Patrol Precinct)
    { x: -185, z: 120,  h: 0 },             // 3: Big Red Fire Engine (Central Fire Station HQ)
    { x: -920, z: 150,  h: Math.PI },       // 4: Monster Crush 4x4 (Dino Canyon Rally)
    { x: -130, z: 835,  h: Math.PI / 2 },   // 5: Melody Ice Cream Van (Sunny Scoops Beach Parlor)
    { x: 165,  z: 2,    h: -Math.PI / 2 },  // 6: Rocket Pizza Buggy (Leo's Neon Pizza Plaza)
    { x: 920,  z: 280,  h: Math.PI },       // 7: Sky-Hawk Helicopter (Stunt Airport)
    { x: 315,  z: 1020, h: 0 },             // 8: Aqua-Jet Speedboat (Sunset Lighthouse Marina)
    { x: -920, z: -150, h: 0 }              // 9: Emerald Rex (Dino Safari Canyon)
  ];

  VEHICLE_CATALOG.forEach((spec, i) => {
    const v = createVehicleMesh(spec);
    const sp = spawnPositions[i];
    v.x = sp.x;
    v.y = sp.y || 0;
    v.z = sp.z;
    v.heading = sp.h;
    v.root.position.set(v.x, v.y, v.z);
    v.root.rotation.y = v.heading;
    worldVehicles.push(v);
  });

  // Giant 3D Bouncy Soccer Ball
  const soccerBallMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.8, 2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  soccerBallMesh.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.83, 1), new THREE.MeshBasicMaterial({ color: 0x111827, wireframe: true })));
  soccerBallMesh.castShadow = true;
  scene.add(soccerBallMesh);
  const soccerBall = { mesh: soccerBallMesh, x: 55, y: 2.8, z: 42, vx: 0, vy: 0, vz: 0 };

  // AI Traffic Cars across the 1,320m Avenues & Beltway
  const aiCars = [];
  const aiColors = [0x38bdf8, 0xa855f7, 0x22c55e, 0xfacc15, 0xf43f5e, 0xf97316];
  for (let i = 0; i < 24; i++) {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.5, 6.4), new THREE.MeshStandardMaterial({ color: aiColors[i % aiColors.length], roughness: 0.35 }));
    b.position.y = 1.3;
    b.castShadow = true;
    const t = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.1, 3.4), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 }));
    t.position.y = 2.4;
    g.add(b, t);
    const rx = [-660, -440, -220, 220, 440, 660][i % 6];
    const dir = i % 2 === 0 ? 1 : -1;
    const rz = -600 + (i * 52) % 1200;
    g.position.set(rx + (dir > 0 ? 6.5 : -6.5), 0, rz);
    g.rotation.y = dir > 0 ? 0 : Math.PI;
    scene.add(g);
    aiCars.push({ group: g, x: rx + (dir > 0 ? 6.5 : -6.5), z: rz, dir, speed: 28 + (i % 5) * 6 });
  }

  // --- VICE CITY MULTI-STEP KID-FRIENDLY HERO MISSIONS (8 ADVENTURES) ---
  let MISSIONS = [];
  let missionIdx = 0;
  let completedMissionIds = new Set();
  let activeObjectives = [];
  let missionTimeLeft = 0;
  let missionBoardOpen = false;
  let vcGameMinutes = 16 * 60 + 20; // Starts at 16:20 Vice Sunset!
  let heroHype = 25;
  let lastDetectedDistrictId = 'downtown';

  const missionPropsGroup = new THREE.Group();
  scene.add(missionPropsGroup);

  const beaconGroup = new THREE.Group();
  const beaconCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(6.8, 6.8, 72, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff49a8, transparent: true, opacity: 0.26, side: THREE.DoubleSide })
  );
  beaconCylinder.position.y = 36;
  const beaconRing = new THREE.Mesh(
    new THREE.TorusGeometry(7.6, 0.6, 12, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  beaconRing.rotation.x = Math.PI / 2;
  beaconRing.position.y = 0.7;
  beaconGroup.add(beaconCylinder, beaconRing);
  scene.add(beaconGroup);

  function clearMissionProps() {
    while (missionPropsGroup.children.length > 0) {
      missionPropsGroup.remove(missionPropsGroup.children[0]);
    }
  }

  function createObjectiveMesh(obj, missionType) {
    const g = new THREE.Group();
    const ringColor =
      missionType === 'fire' ? 0xff6b35 :
      missionType === 'delivery' ? 0xffd166 :
      missionType === 'icecream' ? 0xff49a8 :
      missionType === 'robopup' ? 0x00e5ff :
      missionType === 'roar' ? 0x42f59b : 0xff49a8;

    const padRing = new THREE.Mesh(
      new THREE.TorusGeometry(6.8, 0.52, 10, 28),
      new THREE.MeshBasicMaterial({ color: ringColor })
    );
    padRing.rotation.x = Math.PI / 2;
    padRing.position.y = 0.55;
    g.add(padRing);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, 42, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    beam.position.y = 21;
    g.add(beam);

    if (missionType === 'fire') {
      const flames = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const fCone = new THREE.Mesh(
          new THREE.ConeGeometry(1.7, 5.6 + (i % 2) * 1.6, 8),
          new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xef4444 : 0xf97316 })
        );
        fCone.position.set(Math.cos(i * 1.1) * 2.4, 2.8, Math.sin(i * 1.1) * 2.4);
        flames.add(fCone);
      }
      g.add(flames);
      g.userData.animPart = flames;
    } else if (missionType === 'delivery') {
      const pizzaDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.2, 0.55, 16),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 })
      );
      const crust = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.35, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0xd97706 })
      );
      crust.rotation.x = Math.PI / 2;
      const pizzaWrap = new THREE.Group();
      pizzaWrap.add(pizzaDisc, crust);
      pizzaWrap.position.y = 4.6;
      pizzaWrap.rotation.z = 0.25;
      g.add(pizzaWrap);
      g.userData.animPart = pizzaWrap;
    } else if (missionType === 'icecream') {
      const partyGroup = new THREE.Group();
      const colors = [0xff49a8, 0x00e5ff, 0xffd166, 0x42f59b];
      for (let i = 0; i < 4; i++) {
        const balloon = new THREE.Mesh(
          new THREE.SphereGeometry(1.15, 12, 12),
          new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.3 })
        );
        balloon.position.set(Math.cos(i * 1.57) * 2.4, 5.4 + (i % 2) * 1.2, Math.sin(i * 1.57) * 2.4);
        partyGroup.add(balloon);
      }
      g.add(partyGroup);
      g.userData.animPart = partyGroup;
    } else if (missionType === 'robopup') {
      const pup = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 1.8, 4.0),
        new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x0077aa, emissiveIntensity: 0.5 })
      );
      body.position.y = 2.0;
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 1.7, 1.9),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      head.position.set(0, 3.1, 2.0);
      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.5), new THREE.MeshBasicMaterial({ color: 0xff49a8 }));
      earL.position.set(-0.85, 4.1, 1.9);
      const earR = earL.clone();
      earR.position.x = 0.85;
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.3, 0.4), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
      tail.position.set(0, 3.0, -2.1);
      tail.rotation.x = -0.4;
      pup.add(body, head, earL, earR, tail);
      g.add(pup);
      g.userData.animPart = pup;
    } else if (missionType === 'checkpoint' || missionType === 'roar') {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(6.8, 0.65, 12, 28),
        new THREE.MeshBasicMaterial({ color: missionType === 'roar' ? 0x42f59b : 0x00e5ff })
      );
      arch.position.y = 7.4;
      g.add(arch);
      g.userData.animPart = arch;
    }

    const baseY = obj.y !== undefined ? obj.y : Math.max(0, getTerrainHeightAt(obj.x, obj.z));
    g.position.set(obj.x, baseY, obj.z);
    return g;
  }

  function rebuildHometownMissions() {
    const st0 = hometown.streets[0] || 'Ocean Blvd';
    const st1 = hometown.streets[1] || 'Palm Avenue';
    const lm0 = hometown.landmarks[0] || `${hometown.city} Park`;

    MISSIONS = [
      {
        id: 'fire_rescue',
        code: 'F',
        codeColor: '#ff595e',
        giver: 'Chief Blaze',
        title: `Triple BBQ Fire Rescue`,
        desc: `Spray all 3 fizzy backyard blazes on ${st0} & Downtown with Fire Engine [3] Water Cannon [Z]!`,
        dialogue: `"Three backyard BBQs got super fizzy on ${st0}, Leo! Hop in the Fire Engine [3] and spray 'em down with [Z]!"`,
        recommendedVeh: 2,
        reward: 1800,
        difficulty: 1,
        districtId: 'downtown',
        type: 'fire',
        timeLimit: 0,
        objectives: [
          { x: -165, z: -20, label: `${st0} Blaze` },
          { x: 165, z: -140, label: `${st1} Blaze` },
          { x: -70, z: 185, label: `${lm0} Blaze` }
        ]
      },
      {
        id: 'pizza_rush',
        code: 'P',
        codeColor: '#ffca3a',
        giver: 'Chef Mario',
        title: `Hot Pizza Express`,
        desc: `Deliver 3 hot pizzas across Downtown & Resort Island before the timer runs out! Drive in or launch [Z]!`,
        dialogue: `"Mamma mia! Three picnic parties ordered extra-cheesy pizzas! Grab the Rocket Pizza Buggy [6] and zoom!"`,
        recommendedVeh: 5,
        reward: 2000,
        difficulty: 2,
        districtId: 'downtown',
        type: 'delivery',
        timeLimit: 110,
        objectives: [
          { x: 180, z: 120, label: 'East Plaza Picnic' },
          { x: -195, z: 150, label: 'Sunset Park Picnic' },
          { x: 0, z: 760, label: 'Resort Island Pier' }
        ]
      },
      {
        id: 'icecream_party',
        code: 'I',
        codeColor: '#ff49a8',
        giver: 'Sunny Scoops',
        title: `Beach Ice Cream Party`,
        desc: `Serve 4 cheering kid parties on Resort Island & Downtown with Ice Cream Van [5] cones [Z]!`,
        dialogue: `"It's sunny out, Leo! Ring the jingle in the Ice Cream Van [5] and toss rainbow cones [Z] to all 4 beach parties!"`,
        recommendedVeh: 4,
        reward: 2000,
        difficulty: 1,
        districtId: 'island',
        type: 'icecream',
        timeLimit: 0,
        objectives: [
          { x: -65, z: 810, label: 'West Boardwalk Kids' },
          { x: 75, z: 840, label: 'Ferris Wheel Party' },
          { x: 0, z: 920, label: 'Marina Beach Crowd' },
          { x: 0, z: 540, label: 'Causeway Overlook' }
        ]
      },
      {
        id: 'robopup_chase',
        code: 'C',
        codeColor: '#00e5ff',
        giver: 'Officer Spark',
        title: `Runaway Robo-Pups!`,
        desc: `3 playful toy Robo-Pups are zooming around Downtown! Catch all 3 in your Patrol Interceptor [2]!`,
        dialogue: `"The toy shop's Robo-Pups escaped for a game of tag! Hop in the Patrol Cruiser [2] and tag all 3!"`,
        recommendedVeh: 1,
        reward: 2200,
        difficulty: 2,
        districtId: 'downtown',
        type: 'robopup',
        timeLimit: 0,
        objectives: [
          { x: 110, z: -70, cx: 110, cz: -70, r: 58, angle: 0, spd: 0.75, label: 'Sparky Pup' },
          { x: -120, z: 75, cx: -120, cz: 75, r: 64, angle: 2.1, spd: -0.68, label: 'Bolt Pup' },
          { x: 15, z: -220, cx: 15, cz: -220, r: 54, angle: 4.2, spd: 0.82, label: 'Turbo Pup' }
        ]
      },
      {
        id: 'airport_stunt',
        code: 'A',
        codeColor: '#38bdf8',
        giver: 'Captain Sky',
        title: `Airport Stunt Show`,
        desc: `Blast through 3 neon stunt rings down the Stunt Airport runway and soar over the Jumbo Jet!`,
        dialogue: `"Welcome to Stunt Airport! Hit full turbo [SPACE] in the Comet GT [1] and fly through all 3 runway rings!"`,
        recommendedVeh: 0,
        reward: 2200,
        difficulty: 2,
        districtId: 'airport',
        type: 'checkpoint',
        timeLimit: 0,
        objectives: [
          { x: 920, z: 270, label: 'Runway Gate 1' },
          { x: 920, z: 120, label: 'Jumbo Jet Ramp' },
          { x: 920, z: -90, label: 'Hangar Finish Ring' }
        ]
      },
      {
        id: 'summit_expedition',
        code: 'M',
        codeColor: '#a78bfa',
        giver: 'Ranger Peak',
        title: `Summit Rescue Run`,
        desc: `Climb the Mountain Highway through 3 checkpoints to the +38m Summit Ski-Jump!`,
        dialogue: `"Check the mountain beacons for us, Leo! Monster Crush 4x4 [4] or Sky-Hawk Heli [7] will crush this climb!"`,
        recommendedVeh: 3,
        reward: 2400,
        difficulty: 2,
        districtId: 'mountain',
        type: 'checkpoint',
        timeLimit: 0,
        objectives: [
          { x: 0, z: -690, label: 'Foothills Gate' },
          { x: 0, z: -840, label: 'Alpine Switchback' },
          { x: 0, z: -980, y: 38, label: 'Summit Overlook (+38m)' }
        ]
      },
      {
        id: 'dino_canyon',
        code: 'D',
        codeColor: '#42f59b',
        giver: 'Dr. Dino',
        title: `Dino Canyon Roar Rally`,
        desc: `Race through 2 Red Rock Canyon arches and press [Z] to T-Rex Mega Roar at the Dino Nest!`,
        dialogue: `"Time to wake up the sleepy baby dinos! Ride Emerald Rex [9] through the canyon arches and ROAR [Z] at the nest!"`,
        recommendedVeh: 8,
        reward: 2500,
        difficulty: 2,
        districtId: 'canyon',
        type: 'roar',
        timeLimit: 0,
        objectives: [
          { x: -820, z: 120, label: 'Red Rock Arch 1' },
          { x: -910, z: 30, label: 'Red Rock Arch 2' },
          { x: -940, z: -80, needsRoar: true, label: 'Dino Nest (Press [Z] to Roar!)' }
        ]
      },
      {
        id: 'soccer_cup',
        code: 'S',
        codeColor: '#f59e0b',
        giver: 'Coach Leo',
        title: `Stadium Cup Hat-Trick`,
        desc: `Drive to the 3D Car-Soccer Arena and score 2 goals to lift the Super Leo Cup!`,
        dialogue: `"The stadium crowd is chanting your name! Push the giant soccer ball into either goal twice to win the trophy!"`,
        recommendedVeh: 0,
        reward: 2500,
        difficulty: 3,
        districtId: 'stadium',
        type: 'soccer',
        timeLimit: 0,
        objectives: [
          { x: 55, z: 42, label: 'Score Goal #1' },
          { x: 55, z: 42, label: 'Score Goal #2' }
        ]
      }
    ];
    missionIdx = missionIdx % MISSIONS.length;
    loadActiveMission(missionIdx, false);
  }

  function loadActiveMission(index, announce = true) {
    missionIdx = ((index % MISSIONS.length) + MISSIONS.length) % MISSIONS.length;
    const m = MISSIONS[missionIdx];
    clearMissionProps();
    missionTimeLeft = m.timeLimit || 0;

    activeObjectives = m.objectives.map(o => {
      const clone = Object.assign({}, o, { done: false });
      if (m.type !== 'soccer') {
        clone.mesh = createObjectiveMesh(clone, m.type);
        missionPropsGroup.add(clone.mesh);
      }
      return clone;
    });

    syncMissionUI();
    if (announce && gameStarted) {
      showDialogueSubtitle(m.giver, m.dialogue);
    }
    if (missionBoardOpen) renderMissionBoard();
  }

  function getNextActiveObjective() {
    for (let i = 0; i < activeObjectives.length; i++) {
      if (!activeObjectives[i].done) return activeObjectives[i];
    }
    return activeObjectives[0] || { x: 0, z: 0, y: 0 };
  }

  function syncMissionUI() {
    const m = MISSIONS[missionIdx];
    if (!m) return;
    const doneCount = activeObjectives.filter(o => o.done).length;
    const totalCount = Math.max(1, activeObjectives.length);
    const pct = Math.round((doneCount / totalCount) * 100);

    const codeEl = document.getElementById('missionCode');
    if (codeEl) {
      codeEl.textContent = m.code;
      codeEl.style.background = m.codeColor;
    }
    const tagEl = document.getElementById('missionTag');
    if (tagEl) tagEl.textContent = `${m.giver.toUpperCase()} • ${hometown.city.toUpperCase()}`;
    const titleEl = document.getElementById('missionTitle');
    if (titleEl) titleEl.textContent = m.title;
    const descEl = document.getElementById('missionDesc');
    const nextObj = getNextActiveObjective();
    if (descEl) {
      descEl.textContent = nextObj && nextObj.label
        ? `${m.desc} (Next: ${nextObj.label})`
        : m.desc;
    }
    const progFill = document.getElementById('missionProgFill');
    if (progFill) progFill.style.width = `${pct}%`;
    const progLabel = document.getElementById('missionProgLabel');
    if (progLabel) progLabel.textContent = `${doneCount} / ${totalCount}`;

    const recSpec = VEHICLE_CATALOG[m.recommendedVeh] || VEHICLE_CATALOG[0];
    const recBtn = document.getElementById('btnSummonRecRide');
    if (recBtn) {
      recBtn.textContent = `${recSpec.emoji} Ride [${recSpec.key}]`;
      recBtn.title = `Summon ${recSpec.name}`;
    }

    const timerEl = document.getElementById('missionTimer');
    if (timerEl) {
      if (m.timeLimit > 0) {
        const secs = Math.max(0, Math.ceil(missionTimeLeft));
        const mm = String(Math.floor(secs / 60)).padStart(2, '0');
        const ss = String(secs % 60).padStart(2, '0');
        timerEl.textContent = `${mm}:${ss}`;
        timerEl.classList.add('active');
        timerEl.classList.toggle('urgent', secs <= 15);
      } else {
        timerEl.classList.remove('active', 'urgent');
      }
    }

    if (nextObj) {
      const bY = nextObj.y !== undefined ? nextObj.y : Math.max(0, getTerrainHeightAt(nextObj.x, nextObj.z));
      beaconGroup.position.set(nextObj.x, bY, nextObj.z);
      beaconGroup.visible = true;
    }
  }

  function advanceMissionObjective(objIdx, customToast) {
    const obj = activeObjectives[objIdx];
    if (!obj || obj.done) return;
    obj.done = true;
    if (obj.mesh) {
      missionPropsGroup.remove(obj.mesh);
      obj.mesh = null;
    }

    const m = MISSIONS[missionIdx];
    if (m.timeLimit > 0) missionTimeLeft += 15; // Kid-friendly time bonus!

    addScore(350);
    heroHype = Math.min(100, heroHype + 22);
    spawnConfetti(obj.x, (obj.y || 0) + 3, obj.z);

    const remaining = activeObjectives.filter(o => !o.done).length;
    if (remaining === 0) {
      completeCurrentMission();
    } else {
      sfx.playCheckpoint();
      const doneCount = activeObjectives.length - remaining;
      showStuntBanner(customToast || `${obj.label.toUpperCase()} DONE!`, `${doneCount} / ${activeObjectives.length} COMPLETE • +$350`, false);
      syncMissionUI();
    }
  }

  // --- VICE CITY HUD & TOAST CONTROLLERS ---
  let subtitleTimer = null;
  function showDialogueSubtitle(speaker, text) {
    const el = document.getElementById('dialogueSubtitle');
    if (!el) return;
    el.innerHTML = `<span class="sub-speaker">${speaker}:</span>${text}`;
    el.classList.add('active');
    if (subtitleTimer) clearTimeout(subtitleTimer);
    subtitleTimer = setTimeout(() => el.classList.remove('active'), 4800);
  }

  let vehToastTimer = null;
  function showVehicleToast(name) {
    const el = document.getElementById('vcVehicleToast');
    if (!el) return;
    el.textContent = name.toUpperCase();
    el.classList.add('show');
    if (vehToastTimer) clearTimeout(vehToastTimer);
    vehToastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  let zoneToastTimer = null;
  function showZoneToast(name) {
    const el = document.getElementById('vcZoneToast');
    if (!el) return;
    el.textContent = name.replace(/^[^\w]+\s*/, '');
    el.classList.add('show');
    if (zoneToastTimer) clearTimeout(zoneToastTimer);
    zoneToastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  let radioToastTimer = null;
  function cycleRadioStation(silent = false) {
    sfx.init();
    sfx.radioIdx = (sfx.radioIdx + 1) % RADIO_STATIONS.length;
    sfx.radioStep = 0;
    const st = RADIO_STATIONS[sfx.radioIdx];
    if (!silent) sfx.playRadioTune();
    const banner = document.getElementById('radioBanner');
    const nameEl = document.getElementById('radioStationName');
    const subEl = document.getElementById('radioStationSub');
    const btn = document.getElementById('btnRadio');
    if (nameEl) nameEl.textContent = st.name;
    if (subEl) subEl.textContent = `${st.sub} • Press [R]`;
    if (btn) btn.textContent = st.bpm ? `📻 ${st.name} (R)` : '🔇 Radio Off (R)';
    if (banner) {
      banner.classList.add('visible');
      if (radioToastTimer) clearTimeout(radioToastTimer);
      radioToastTimer = setTimeout(() => banner.classList.remove('visible'), 3200);
    }
  }

  function updateHeroStars(animatePop = false) {
    const litCount = Math.min(6, stars);
    const starEls = document.querySelectorAll('#heroStarsRow .vc-star');
    starEls.forEach((el, idx) => {
      const isLit = idx < litCount;
      el.classList.toggle('lit', isLit);
      if (animatePop && idx === litCount - 1) {
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 350);
      }
    });
  }

  function renderMissionBoard() {
    const grid = document.getElementById('missionBoardGrid');
    const statsSub = document.getElementById('boardStatsSub');
    if (!grid) return;

    if (statsSub) {
      statsSub.textContent = `${completedMissionIds.size} / ${MISSIONS.length} MISSIONS PASSED • HERO CASH $${score.toLocaleString()} • PICK ANY ADVENTURE`;
    }

    grid.innerHTML = '';
    MISSIONS.forEach((m, idx) => {
      const isPassed = completedMissionIds.has(m.id);
      const isActive = idx === missionIdx;
      const recSpec = VEHICLE_CATALOG[m.recommendedVeh] || VEHICLE_CATALOG[0];
      const diffStars = '★'.repeat(m.difficulty) + '☆'.repeat(3 - m.difficulty);

      const card = document.createElement('div');
      card.className = 'vc-mcard' + (isActive ? ' active-mission' : '') + (isPassed ? ' passed-mission' : '');
      card.innerHTML = `
        <div class="vc-mcard-top">
          <div class="vc-mcard-giver">
            <span class="vc-mission-code" style="background:${m.codeColor}">${m.code}</span>
            <span>${m.giver}</span>
          </div>
          ${isPassed ? '<span class="vc-mcard-badge passed">PASSED</span>' : isActive ? '<span class="vc-mcard-badge active">ACTIVE</span>' : ''}
        </div>
        <div class="vc-mcard-title">${m.title}</div>
        <div class="vc-mcard-desc">${m.desc}</div>
        <div class="vc-mcard-meta">
          <span>${recSpec.emoji} ${recSpec.name.split(' ')[0]}</span>
          <span>${diffStars} &bull; +$${m.reward.toLocaleString()}</span>
        </div>
        <div class="vc-mcard-actions">
          <button class="vc-start-m-btn" data-m-idx="${idx}">▶ PLAY MISSION</button>
        </div>
      `;
      card.querySelector('.vc-start-m-btn').addEventListener('click', () => {
        sfx.init();
        toggleMissionBoard(false);
        const distIdx = WORLD_DISTRICTS.findIndex(d => d.id === m.districtId);
        if (distIdx >= 0) {
          teleportToDistrict(distIdx, false);
        }
        summonAndBoardVehicle(m.recommendedVeh, false);
        loadActiveMission(idx, true);
        sfx.playCheckpoint();
      });
      grid.appendChild(card);
    });

    const distWrap = document.getElementById('boardDistrictBtns');
    if (distWrap) {
      distWrap.innerHTML = '';
      WORLD_DISTRICTS.forEach((d, idx) => {
        const b = document.createElement('button');
        b.className = 'vc-dist-btn';
        b.textContent = d.name;
        b.addEventListener('click', () => {
          toggleMissionBoard(false);
          teleportToDistrict(idx, true);
        });
        distWrap.appendChild(b);
      });
    }
  }

  let activeModalTab = 'map';

  function updateExplorerHUD() {
    const collectedCount = collectibleStars.filter(s => s.collected).length;
    const starsEl = document.getElementById('hudExplorerStars');
    if (starsEl) starsEl.textContent = `⭐ ${collectedCount} / ${collectibleStars.length} HIDDEN STARS`;
    const lmEl = document.getElementById('hudExplorerLandmarks');
    if (lmEl) lmEl.textContent = `📍 ${discoveredLandmarks.size} / ${ISLAND_LANDMARKS.length} Landmarks Discovered • Press [M] for Map`;
  }

  function setCustomWaypoint(wx, wz, label = 'Custom Map Waypoint') {
    const wy = Math.max(0, getTerrainHeightAt(wx, wz));
    customWaypoint = { x: wx, y: wy, z: wz, label };
    waypointGroup.position.set(wx, wy, wz);
    waypointGroup.visible = true;
    sfx.playCheckpoint();
    showDialogueSubtitle('GPS Map', `Cyan waypoint set at ${label}! Follow the glowing cyan beacon!`);
    if (missionBoardOpen && activeModalTab === 'map') drawCityStreetMap();
  }

  function teleportToCoords(tx, tz, label) {
    const targetObj = activeVehicle || leo;
    const ty = Math.max(0, getTerrainHeightAt(tx, tz));
    targetObj.x = tx;
    targetObj.y = ty;
    targetObj.z = tz;
    targetObj.speed = 0;
    if (activeVehicle) {
      activeVehicle.vy = 0;
      activeVehicle.root.position.set(tx, ty, tz);
    } else {
      leo.vy = 0;
      leo.group.position.set(tx, ty, tz);
    }
    sfx.playJump();
    showZoneToast(label);
  }

  function renderLandmarkSidebar() {
    const listEl = document.getElementById('landmarkList');
    if (!listEl) return;
    listEl.innerHTML = '';
    ISLAND_LANDMARKS.forEach(lm => {
      const isFound = discoveredLandmarks.has(lm.id);
      const item = document.createElement('button');
      item.className = 'vc-lm-item' + (isFound ? ' discovered' : '');
      item.innerHTML = `
        <div>
          <div class="vc-lm-name">${lm.emoji} ${lm.name}</div>
          <div class="vc-lm-sub">${lm.sub}</div>
        </div>
        <span class="vc-lm-tag">${isFound ? '✓ FOUND' : 'GO ▶'}</span>
      `;
      item.addEventListener('click', () => {
        sfx.init();
        toggleMissionBoard(false);
        teleportToCoords(lm.x, lm.z + 18, lm.name);
      });
      listEl.appendChild(item);
    });
  }

  function drawCityStreetMap() {
    const mapCanvas = document.getElementById('cityMapCanvas');
    if (!mapCanvas) return;
    const ctx = mapCanvas.getContext('2d');
    const W = mapCanvas.width;
    const H = mapCanvas.height;
    const worldSpan = 2600; // -1300..+1300
    const toMapX = wx => ((wx + worldSpan / 2) / worldSpan) * W;
    const toMapY = wz => ((wz + worldSpan / 2) / worldSpan) * H;

    // 1. Tropical Ocean Backdrop
    ctx.fillStyle = '#0c1633';
    ctx.fillRect(0, 0, W, H);

    // Subtle map grid lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let g = 0; g < W; g += 50) {
      ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(W, g); ctx.stroke();
    }

    // 2. Mainland, Mountain, Airport, Canyon & Resort Island Shapes
    // Main City + North Mountain + West Canyon + East Airport landmass
    ctx.fillStyle = '#1b1236';
    ctx.fillRect(toMapX(-1240), toMapY(-1220), toMapX(1240) - toMapX(-1240), toMapY(230) - toMapY(-1220));
    // Ocean Bay Channel
    ctx.fillStyle = '#09244a';
    ctx.fillRect(0, toMapY(230), W, toMapY(650) - toMapY(230));
    // Resort Island Sandy Beach
    ctx.fillStyle = '#3b2d4d';
    ctx.fillRect(toMapX(-460), toMapY(650), toMapX(460) - toMapX(-460), toMapY(1150) - toMapY(650));
    // Sunset Pier
    ctx.fillStyle = '#92400e';
    ctx.fillRect(toMapX(325), toMapY(960), 10, toMapY(1180) - toMapY(960));
    // Airport Tarmac
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(toMapX(700), toMapY(-520), toMapX(1220) - toMapX(700), toMapY(460) - toMapY(-520));
    // Dino Canyon Red-Rock Tint
    ctx.fillStyle = 'rgba(194, 65, 12, 0.35)';
    ctx.fillRect(toMapX(-1220), toMapY(-420), toMapX(-660) - toMapX(-1220), toMapY(420) - toMapY(-420));

    // 3. Connected Street & Highway Network
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    roadXCoords.forEach(rx => {
      ctx.beginPath();
      ctx.moveTo(toMapX(rx), toMapY(-660));
      ctx.lineTo(toMapX(rx), toMapY(660));
      ctx.stroke();
    });
    roadZCoords.forEach(rz => {
      ctx.beginPath();
      ctx.moveTo(toMapX(-660), toMapY(rz));
      ctx.lineTo(toMapX(660), toMapY(rz));
      ctx.stroke();
    });
    // Cross-Island Expressways, Mountain Highway, Bridges & Runways
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 5;
    [-140, 100].forEach(ez => {
      ctx.beginPath(); ctx.moveTo(toMapX(-1150), toMapY(ez)); ctx.lineTo(toMapX(1150), toMapY(ez)); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(toMapX(0), toMapY(-1120)); ctx.lineTo(toMapX(0), toMapY(1080)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toMapX(-220), toMapY(220)); ctx.lineTo(toMapX(-220), toMapY(670)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toMapX(-380), toMapY(850)); ctx.lineTo(toMapX(380), toMapY(850)); ctx.stroke();
    // Airport Runways
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    [920, 1080].forEach(rwx => {
      ctx.beginPath(); ctx.moveTo(toMapX(rwx), toMapY(-490)); ctx.lineTo(toMapX(rwx), toMapY(430)); ctx.stroke();
    });

    // 4. Uncollected Hidden Golden Stars
    collectibleStars.forEach(s => {
      if (s.collected) return;
      const sx = toMapX(s.x);
      const sy = toMapY(s.z);
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(sx, sy, 3.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. All 10 Handcrafted Landmarks
    ctx.font = 'bold 10px Oswald, sans-serif';
    ctx.textAlign = 'center';
    ISLAND_LANDMARKS.forEach(lm => {
      const lx = toMapX(lm.x);
      const ly = toMapY(lm.z);
      const found = discoveredLandmarks.has(lm.id);
      ctx.fillStyle = found ? '#42f59b' : '#00e5ff';
      ctx.strokeStyle = '#090512';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lx, ly, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(lm.name.split(' ').slice(0, 2).join(' '), lx, ly - 10);
    });

    // 6. Active Mission Target Blips
    activeObjectives.forEach(o => {
      if (o.done) return;
      const mx = toMapX(o.x);
      const my = toMapY(o.z);
      ctx.fillStyle = '#ff49a8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // 7. Custom Cyan Waypoint
    if (customWaypoint) {
      const wx = toMapX(customWaypoint.x);
      const wy = toMapY(customWaypoint.z);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(wx, wy, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(wx, wy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Live Player Marker
    const pObj = activeVehicle || leo;
    const px = toMapX(pObj.x);
    const py = toMapY(pObj.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-pObj.heading + Math.PI);
    ctx.fillStyle = '#42f59b';
    ctx.strokeStyle = '#090512';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-7, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(7, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function switchModalTab(tabName) {
    activeModalTab = tabName;
    const isMap = tabName === 'map';
    const tabBtnMap = document.getElementById('tabBtnMap');
    const tabBtnMissions = document.getElementById('tabBtnMissions');
    const panelMap = document.getElementById('tabPanelMap');
    const panelMissions = document.getElementById('tabPanelMissions');
    const titleEl = document.getElementById('modalMainTitle');
    const statsEl = document.getElementById('boardStatsSub');

    if (tabBtnMap) tabBtnMap.classList.toggle('active', isMap);
    if (tabBtnMissions) tabBtnMissions.classList.toggle('active', !isMap);
    if (panelMap) panelMap.classList.toggle('active', isMap);
    if (panelMissions) panelMissions.classList.toggle('active', !isMap);
    if (titleEl) titleEl.textContent = isMap ? 'Super Leo Island Map' : 'Hero Mission Board';

    const collectedCount = collectibleStars.filter(s => s.collected).length;
    if (statsEl) {
      statsEl.textContent = `${discoveredLandmarks.size} / ${ISLAND_LANDMARKS.length} LANDMARKS • ${collectedCount} / ${collectibleStars.length} STARS • ${completedMissionIds.size} / ${MISSIONS.length} MISSIONS PASSED`;
    }

    if (isMap) {
      renderLandmarkSidebar();
      drawCityStreetMap();
    } else {
      renderMissionBoard();
    }
  }

  function toggleMissionBoard(forceState, preferredTab = null) {
    if (!gameStarted) return;
    if (preferredTab && missionBoardOpen && activeModalTab !== preferredTab && forceState !== false) {
      switchModalTab(preferredTab);
      return;
    }
    missionBoardOpen = typeof forceState === 'boolean' ? forceState : !missionBoardOpen;
    const overlay = document.getElementById('missionBoardOverlay');
    if (overlay) overlay.classList.toggle('open', missionBoardOpen);
    if (missionBoardOpen) {
      switchModalTab(preferredTab || activeModalTab || 'map');
    }
  }

  // Click anywhere on Interactive Street Map to drop a 3D Cyan Waypoint!
  const cityMapCanvasEl = document.getElementById('cityMapCanvas');
  if (cityMapCanvasEl) {
    cityMapCanvasEl.addEventListener('click', e => {
      const rect = cityMapCanvasEl.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const wx = Math.round((nx - 0.5) * 2600);
      const wz = Math.round((ny - 0.5) * 2600);
      setCustomWaypoint(wx, wz, `(${wx}m, ${wz}m)`);
    });
  }

  const tabBtnMapEl = document.getElementById('tabBtnMap');
  if (tabBtnMapEl) tabBtnMapEl.addEventListener('click', () => switchModalTab('map'));
  const tabBtnMissionsEl = document.getElementById('tabBtnMissions');
  if (tabBtnMissionsEl) tabBtnMissionsEl.addEventListener('click', () => switchModalTab('missions'));

  // --- PLAYER STATE & CONTROLS ---
  const leo = createLeoCharacter();
  let activeVehicle = worldVehicles[0];
  let gameStarted = false;
  let score = 0;
  let stars = 0;
  let nitro = 100;
  let cameraMode = 0;
  const CAM_NAMES = ['🎥 Chase (C)', '🎥 Close (C)', '🎥 Aerial (C)'];

  rebuildHometownMissions();
  updateExplorerHUD();

  const keys = {};

  window.addEventListener('keydown', e => {
    if (e.code === 'Tab' || e.code === 'Escape') {
      e.preventDefault();
      if (document.getElementById('titleOverlay').style.display !== 'none') {
        if (gameStarted) document.getElementById('titleOverlay').style.display = 'none';
        return;
      }
      toggleMissionBoard(undefined, e.code === 'Tab' ? 'missions' : null);
      return;
    }

    if (e.code === 'KeyM' && gameStarted) {
      e.preventDefault();
      toggleMissionBoard(undefined, 'map');
      return;
    }

    keys[e.code] = true;
    if (!gameStarted && (e.code === 'Enter' || e.code === 'Space')) {
      startGame();
      return;
    }
    if (missionBoardOpen) return;

    if (e.code === 'KeyG') cycleDistrictFastTravel();
    if (e.code === 'KeyR') cycleRadioStation();
    if (e.code === 'KeyC') cycleCamera();
    if (e.code === 'KeyT') cycleTimeOfDay();
    if (e.code === 'KeyE' || e.code === 'Enter') toggleEnterExitVehicle();
    if (e.code === 'KeyZ' || e.code === 'KeyF') triggerVehicleGadget();

    if (e.code.startsWith('Digit')) {
      const num = parseInt(e.code.replace('Digit', ''), 10);
      if (num >= 1 && num <= VEHICLE_CATALOG.length) {
        summonAndBoardVehicle(num - 1);
      }
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  // --- MOBILE & TABLET MULTI-TOUCH CONTROLS ---
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('touch-enabled');
  }

  document.querySelectorAll('#touchControls .t-btn[data-key]').forEach(btn => {
    const code = btn.getAttribute('data-key');
    const press = e => {
      e.preventDefault();
      sfx.init();
      keys[code] = true;
      btn.classList.add('pressed');
      if (code === 'KeyZ') triggerVehicleGadget();
    };
    const release = e => {
      e.preventDefault();
      keys[code] = false;
      btn.classList.remove('pressed');
    };
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
  });

  const touchExitBtn = document.getElementById('touchExitBtn');
  if (touchExitBtn) {
    const onHop = e => {
      e.preventDefault();
      sfx.init();
      toggleEnterExitVehicle();
    };
    touchExitBtn.addEventListener('touchstart', onHop, { passive: false });
    touchExitBtn.addEventListener('click', onHop);
  }

  // --- DISTRICT FAST-TRAVEL (G KEY OR MISSION BOARD) ---
  function teleportToDistrict(idx, showBanner = true) {
    sfx.init();
    currentDistrictIdx = idx % WORLD_DISTRICTS.length;
    const dist = WORLD_DISTRICTS[currentDistrictIdx];
    lastDetectedDistrictId = dist.id;
    const btn = document.getElementById('btnDistrict');
    if (btn) btn.textContent = `${dist.name} (G)`;

    const targetObj = activeVehicle || leo;
    targetObj.x = dist.x;
    targetObj.y = dist.y;
    targetObj.z = dist.z;
    targetObj.heading = dist.h;
    targetObj.speed = 0;
    if (activeVehicle) {
      activeVehicle.vy = 0;
      activeVehicle.root.position.set(dist.x, dist.y, dist.z);
      activeVehicle.root.rotation.y = dist.h;
    } else {
      leo.group.position.set(dist.x, dist.y, dist.z);
      leo.group.rotation.y = dist.h;
    }
    sfx.playJump();
    showZoneToast(dist.name);
    if (showBanner) showStuntBanner(dist.name.toUpperCase(), dist.desc.toUpperCase(), false);
  }

  function cycleDistrictFastTravel() {
    teleportToDistrict((currentDistrictIdx + 1) % WORLD_DISTRICTS.length, true);
  }

  const btnDistrictEl = document.getElementById('btnDistrict');
  if (btnDistrictEl) btnDistrictEl.addEventListener('click', cycleDistrictFastTravel);

  const btnMapEl = document.getElementById('btnMap');
  if (btnMapEl) btnMapEl.addEventListener('click', () => toggleMissionBoard(true, 'map'));
  const explorerHudCardEl = document.getElementById('explorerHudCard');
  if (explorerHudCardEl) explorerHudCardEl.addEventListener('click', () => toggleMissionBoard(true, 'map'));
  const btnMissionsEl = document.getElementById('btnMissions');
  if (btnMissionsEl) btnMissionsEl.addEventListener('click', () => toggleMissionBoard(true, 'missions'));
  const closeBoardBtn = document.getElementById('closeBoardBtn');
  if (closeBoardBtn) closeBoardBtn.addEventListener('click', () => toggleMissionBoard(false));
  const radarFrameEl = document.getElementById('radarFrame');
  if (radarFrameEl) radarFrameEl.addEventListener('click', () => toggleMissionBoard(true, 'map'));

  const btnRadioEl = document.getElementById('btnRadio');
  if (btnRadioEl) btnRadioEl.addEventListener('click', () => cycleRadioStation());
  const radioBannerEl = document.getElementById('radioBanner');
  if (radioBannerEl) radioBannerEl.addEventListener('click', () => cycleRadioStation());
  const vcGadgetSlotEl = document.getElementById('vcGadgetSlot');
  if (vcGadgetSlotEl) vcGadgetSlotEl.addEventListener('click', () => triggerVehicleGadget());

  const btnSummonRecRideEl = document.getElementById('btnSummonRecRide');
  if (btnSummonRecRideEl) {
    btnSummonRecRideEl.addEventListener('click', () => {
      sfx.init();
      const m = MISSIONS[missionIdx];
      if (m) summonAndBoardVehicle(m.recommendedVeh);
    });
  }

  // Build Bottom Vehicle Quick-Spawner Dock
  const dockEl = document.getElementById('vehicleDock');
  VEHICLE_CATALOG.forEach((spec, idx) => {
    const btn = document.createElement('div');
    btn.className = 'dock-item' + (idx === 0 ? ' active' : '');
    btn.innerHTML = `<span class="dock-key">[${spec.key}]</span><span class="dock-emoji">${spec.emoji}</span><span class="dock-label">${spec.name.split(' ')[0]}</span>`;
    btn.addEventListener('click', () => {
      sfx.init();
      summonAndBoardVehicle(idx);
    });
    dockEl.appendChild(btn);
  });

  function updateVehicleHUD() {
    const items = dockEl.querySelectorAll('.dock-item');
    items.forEach((el, idx) => {
      el.classList.toggle('active', activeVehicle === worldVehicles[idx]);
    });
    const slotKey = document.getElementById('vcSlotKey');
    if (activeVehicle) {
      document.getElementById('vehIcon').textContent = activeVehicle.spec.emoji;
      document.getElementById('vehName').textContent = activeVehicle.spec.name;
      if (slotKey) {
        const id = activeVehicle.spec.id;
        slotKey.textContent =
          id === 'firetruck' ? '[Z] WATER' :
          id === 'pizza' ? '[Z] PIZZA' :
          id === 'icecream' ? '[Z] CONE' :
          id === 'trex' ? '[Z] ROAR' :
          id === 'monster' ? '[Z] HOP' :
          id === 'helicopter' ? '[Z] DOWN' : '[Z] HORN';
      }
    } else {
      document.getElementById('vehIcon').textContent = '🏃';
      document.getElementById('vehName').textContent = 'Junior Mayor Leo (On Foot)';
      if (slotKey) slotKey.textContent = '[Z] JUMP';
    }
  }

  function summonAndBoardVehicle(index, showToast = true) {
    const targetVeh = worldVehicles[index];
    const refPos = activeVehicle ? activeVehicle : leo;
    targetVeh.x = refPos.x;
    targetVeh.z = refPos.z;
    targetVeh.y = Math.max(getTerrainHeightAt(refPos.x, refPos.z), refPos.y);
    targetVeh.heading = refPos.heading;
    targetVeh.speed = activeVehicle ? activeVehicle.speed * 0.7 : 0;
    targetVeh.root.position.set(targetVeh.x, targetVeh.y, targetVeh.z);
    targetVeh.root.rotation.y = targetVeh.heading;

    activeVehicle = targetVeh;
    leo.group.visible = false;
    sfx.playJump();
    if (showToast) showVehicleToast(targetVeh.spec.name);
    updateVehicleHUD();
  }

  function toggleEnterExitVehicle() {
    sfx.init();
    if (activeVehicle) {
      leo.x = activeVehicle.x - Math.cos(activeVehicle.heading) * 4.5;
      leo.z = activeVehicle.z + Math.sin(activeVehicle.heading) * 4.5;
      leo.y = Math.max(getTerrainHeightAt(leo.x, leo.z), activeVehicle.y);
      leo.heading = activeVehicle.heading;
      leo.group.position.set(leo.x, leo.y, leo.z);
      leo.group.visible = true;
      activeVehicle = null;
      sfx.playJump();
      showVehicleToast('ON FOOT • JUNIOR MAYOR LEO');
      updateVehicleHUD();
    } else {
      let best = null;
      let bestDist = 22;
      worldVehicles.forEach(v => {
        const d = Math.hypot(v.x - leo.x, v.z - leo.z);
        if (d < bestDist) {
          bestDist = d;
          best = v;
        }
      });
      if (best) {
        activeVehicle = best;
        leo.group.visible = false;
        sfx.playJump();
        showVehicleToast(best.spec.name);
        updateVehicleHUD();
      }
    }
  }

  let bannerTimeout = null;
  function showStuntBanner(mainText, subText, isMissionPassed = false) {
    const banner = document.getElementById('stuntBanner');
    document.getElementById('stuntMain').textContent = mainText;
    document.getElementById('stuntSub').textContent = subText;
    banner.classList.toggle('mission-passed', !!isMissionPassed);
    banner.classList.add('active');
    if (bannerTimeout) clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(() => {
      banner.classList.remove('active');
      banner.classList.remove('mission-passed');
    }, isMissionPassed ? 3400 : 2200);
  }

  function addScore(pts) {
    score += pts;
    const formatted = '$' + String(Math.max(0, Math.floor(score))).padStart(8, '0');
    document.getElementById('scoreVal').textContent = formatted;
  }

  function triggerVehicleGadget() {
    sfx.init();
    if (!activeVehicle) {
      leo.vy = 16;
      sfx.playJump();
      return;
    }
    const id = activeVehicle.spec.id;
    const fwdX = Math.sin(activeVehicle.heading);
    const fwdZ = Math.cos(activeVehicle.heading);

    if (id === 'firetruck') {
      sfx.playSplash();
      for (let i = 0; i < 14; i++) {
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        drop.position.set(activeVehicle.x + fwdX * 3, activeVehicle.y + 4.8, activeVehicle.z + fwdZ * 3);
        scene.add(drop);
        waterDrops.push({
          mesh: drop,
          vx: fwdX * (45 + Math.random() * 15) + (Math.random() - 0.5) * 8,
          vy: 12 + Math.random() * 6,
          vz: fwdZ * (45 + Math.random() * 15) + (Math.random() - 0.5) * 8,
          life: 1.1
        });
      }
    } else if (id === 'monster') {
      if (activeVehicle.y <= getTerrainHeightAt(activeVehicle.x, activeVehicle.z) + 1.0) {
        activeVehicle.vy = 26;
        sfx.playJump();
        showStuntBanner('HYDRAULIC MEGA-HOP!', '+$150 STUNT BONUS', false);
        addScore(150);
      }
    } else if (id === 'trex') {
      sfx.playRoar();
      showStuntBanner('T-REX MEGA ROAR!!', '+$200 DINO POWER', false);
      addScore(200);
      physicsProps.forEach(p => {
        const d = Math.hypot(p.mesh.position.x - activeVehicle.x, p.mesh.position.z - activeVehicle.z);
        if (d < 32) {
          p.vy = 18 + Math.random() * 10;
          p.vx = (p.mesh.position.x - activeVehicle.x) * 1.8;
          p.vz = (p.mesh.position.z - activeVehicle.z) * 1.8;
        }
      });
      // Check if roaring near the Dino Canyon Roar objective!
      const curM = MISSIONS[missionIdx];
      if (curM && curM.type === 'roar') {
        activeObjectives.forEach((o, i) => {
          if (!o.done && o.needsRoar && Math.hypot(o.x - activeVehicle.x, o.z - activeVehicle.z) < 42) {
            advanceMissionObjective(i, 'BABY DINOS WOKE UP!');
          }
        });
      }
    } else if (id === 'pizza' || id === 'icecream') {
      sfx.playJump();
      const isPizza = id === 'pizza';
      const proj = new THREE.Mesh(
        isPizza ? new THREE.CylinderGeometry(1.1, 1.1, 0.3, 12) : new THREE.SphereGeometry(0.9, 10, 10),
        new THREE.MeshBasicMaterial({ color: isPizza ? 0xfacc15 : 0xf472b6 })
      );
      proj.position.set(activeVehicle.x + fwdX * 4, activeVehicle.y + 3.2, activeVehicle.z + fwdZ * 4);
      scene.add(proj);
      projectiles.push({ mesh: proj, vx: fwdX * 55, vy: 10, vz: fwdZ * 55, life: 1.4, kind: id });
      addScore(50);
    } else if (id === 'police') {
      sfx.playHorn();
      // Patrol Rescue Beam tags nearby Runaway Robo-Pups!
      const curM = MISSIONS[missionIdx];
      if (curM && curM.type === 'robopup') {
        activeObjectives.forEach((o, i) => {
          if (!o.done && Math.hypot(o.x - activeVehicle.x, o.z - activeVehicle.z) < 34) {
            advanceMissionObjective(i, 'ROBO-PUP RESCUED!');
          }
        });
      }
    } else {
      sfx.playHorn();
    }
  }

  function cycleCamera() {
    cameraMode = (cameraMode + 1) % CAM_NAMES.length;
    document.getElementById('btnCam').textContent = CAM_NAMES[cameraMode];
  }
  function cycleTimeOfDay() {
    timeMode = (timeMode + 1) % TIME_PRESETS.length;
    const p = TIME_PRESETS[timeMode];
    document.getElementById('btnTime').textContent = p.name;
    scene.background.setHex(p.bg);
    scene.fog.color.setHex(p.fog);
    hemiLight.intensity = p.hemi;
    sunLight.intensity = p.sun;
    sunLight.color.setHex(p.sunCol);
    renderer.toneMappingExposure = p.exposure;
    const spotInt = timeMode === 1 ? 0.0 : timeMode === 3 ? 3.5 : 1.2;
    worldVehicles.forEach(v => {
      if (v.headSpot) v.headSpot.intensity = spotInt;
    });
  }
  function toggleMute() {
    sfx.muted = !sfx.muted;
    document.getElementById('btnMute').textContent = sfx.muted ? '🔇' : '🔊';
  }

  document.getElementById('btnCam').addEventListener('click', cycleCamera);
  document.getElementById('btnTime').addEventListener('click', cycleTimeOfDay);
  document.getElementById('btnMute').addEventListener('click', toggleMute);
  document.getElementById('interactPrompt').addEventListener('click', toggleEnterExitVehicle);

  function startGame() {
    sfx.init();
    gameStarted = true;
    document.getElementById('titleOverlay').style.display = 'none';
    sfx.playFanfare();
    updateVehicleHUD();
    showVehicleToast(activeVehicle ? activeVehicle.spec.name : 'Junior Mayor Leo');
    showZoneToast('Downtown');
    const m = MISSIONS[missionIdx];
    if (m) showDialogueSubtitle(m.giver, m.dialogue);
    // Show initial radio station toast
    const banner = document.getElementById('radioBanner');
    if (banner) {
      banner.classList.add('visible');
      if (radioToastTimer) clearTimeout(radioToastTimer);
      radioToastTimer = setTimeout(() => banner.classList.remove('visible'), 3200);
    }
  }
  document.getElementById('startBtn').addEventListener('click', startGame);

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('zone')) {
    const zName = urlParams.get('zone');
    const foundIdx = WORLD_DISTRICTS.findIndex(d => d.id === zName);
    if (foundIdx >= 0) {
      teleportToDistrict(foundIdx, false);
    }
  }
  if (urlParams.get('autostart') === '1') {
    startGame();
  }

  const confettiList = [];
  function spawnConfetti(x, y, z) {
    const colors = [0xfacc15, 0x38bdf8, 0xf43f5e, 0x4ade80, 0xa855f7];
    for (let i = 0; i < 36; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }));
      m.position.set(x, y + 3, z);
      scene.add(m);
      confettiList.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 36,
        vy: 14 + Math.random() * 20,
        vz: (Math.random() - 0.5) * 36,
        life: 1.8
      });
    }
  }

  // --- MAIN PHYSICS & GAMEPLAY LOOP ---
  const minimapCtx = document.getElementById('minimapCanvas').getContext('2d');
  let lastTime = performance.now();
  let titleOrbitAngle = 0;

  function update(dt) {
    if (ferrisWheelGroup) ferrisWheelGroup.rotation.z += dt * 0.35;
    if (airportRadarMesh) airportRadarMesh.rotation.y += dt * 1.8;
    clouds.forEach(c => {
      c.position.x += dt * 4.5;
      if (c.position.x > 1300) c.position.x = -1300;
    });
    beaconRing.scale.setScalar(1 + Math.sin(performance.now() * 0.006) * 0.14);

    const playerObj = activeVehicle || leo;

    // Update Sun Shadow Camera to follow player across the 3,000m world so shadows stay crisp everywhere!
    sunLight.position.set(playerObj.x + 160, 260, playerObj.z + 140);
    sunLight.target.position.set(playerObj.x, 0, playerObj.z);
    sunLight.target.updateMatrixWorld();

    weatherParticles.forEach(wp => {
      if (weatherType === 'clear') {
        wp.visible = false;
        return;
      }
      wp.visible = true;
      const isSnow = weatherType === 'snow';
      wp.scale.set(1, isSnow ? 1 : 4.5, 1);
      wp.position.y -= (isSnow ? 14 : 52) * dt;
      if (isSnow) wp.position.x += Math.sin(performance.now() * 0.002 + wp.position.z) * 3 * dt;
      if (wp.position.y < playerObj.y) {
        wp.position.set(
          playerObj.x + (Math.random() - 0.5) * 160,
          playerObj.y + 55 + Math.random() * 35,
          playerObj.z + (Math.random() - 0.5) * 160
        );
      }
    });

    if (!gameStarted || missionBoardOpen || document.getElementById('titleOverlay').style.display !== 'none') {
      if (!gameStarted) {
        titleOrbitAngle += dt * 0.22;
        camera.position.set(
          Math.sin(titleOrbitAngle) * 145,
          58 + Math.sin(titleOrbitAngle * 2) * 12,
          Math.cos(titleOrbitAngle) * 145 - 40
        );
        camera.lookAt(0, 18, -40);
      }
      return;
    }

    // Tick Vice City Clock (1 game minute per real second) & Kids Radio
    vcGameMinutes = (vcGameMinutes + dt) % (24 * 60);
    const clkH = String(Math.floor(vcGameMinutes / 60)).padStart(2, '0');
    const clkM = String(Math.floor(vcGameMinutes % 60)).padStart(2, '0');
    const clkEl = document.getElementById('vcClock');
    if (clkEl) clkEl.textContent = `${clkH}:${clkM}`;
    sfx.updateRadio(dt, !!activeVehicle);

    const throttle = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
    const steer = (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0) - (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0);
    const boostPressed = keys['Space'] || keys['ShiftLeft'] || keys['ShiftRight'];

    if (activeVehicle) {
      const v = activeVehicle;
      const spec = v.spec;

      if (spec.id === 'firetruck' && (keys['KeyZ'] || keys['KeyF']) && Math.random() < 0.45) {
        triggerVehicleGadget();
      }

      if (spec.isFlying) {
        v.heading += steer * spec.turnRate * dt;
        const targetSpeed = throttle * spec.maxSpeed;
        v.speed += (targetSpeed - v.speed) * 3.5 * dt;
        if (boostPressed) v.y = Math.min(220, v.y + 36 * dt);
        else if (keys['KeyZ'] || keys['KeyF']) v.y = Math.max(getTerrainHeightAt(v.x, v.z), v.y - 36 * dt);

        v.x = Math.max(-1380, Math.min(1380, v.x + Math.sin(v.heading) * v.speed * dt));
        v.z = Math.max(-1380, Math.min(1380, v.z + Math.cos(v.heading) * v.speed * dt));

        v.bodyGroup.rotation.x = (v.speed / spec.maxSpeed) * 0.26;
        v.bodyGroup.rotation.z = -steer * 0.28;
        if (v.rotorMain) v.rotorMain.rotation.y += dt * 28;
        if (v.rotorTail) v.rotorTail.rotation.x += dt * 32;
      } else {
        let maxSpd = spec.maxSpeed;
        let acc = spec.accel;
        if (boostPressed && nitro > 2) {
          maxSpd *= 1.38;
          acc *= 1.65;
          nitro = Math.max(0, nitro - 28 * dt);
          v.flameGroup.visible = true;
          if (Math.random() < 0.12) sfx.playBoost();
        } else {
          nitro = Math.min(100, nitro + 16 * dt);
          v.flameGroup.visible = false;
        }

        if (throttle !== 0) {
          v.speed += throttle * acc * dt;
        } else {
          v.speed *= Math.pow(0.22, dt);
        }
        v.speed = Math.max(-maxSpd * 0.45, Math.min(maxSpd, v.speed));

        const turnFactor = Math.abs(v.speed) > 2 ? Math.sign(v.speed) : 1;
        v.steerAngle = steer * 0.45;
        if (Math.abs(v.speed) > 0.8) {
          v.heading += steer * spec.turnRate * turnFactor * dt;
        }

        const nextX = v.x + Math.sin(v.heading) * v.speed * dt;
        const nextZ = v.z + Math.cos(v.heading) * v.speed * dt;

        // Check Building Colliders AND Ramp Back-Wall Colliders (so you never clip into the vertical back of a ramp!)
        let blocked = false;
        for (let i = 0; i < buildingColliders.length; i++) {
          const b = buildingColliders[i];
          if (nextX > b.minX && nextX < b.maxX && nextZ > b.minZ && nextZ < b.maxZ) {
            if (v.y < b.height - 2.5) {
              blocked = true;
              v.speed *= -0.35;
              break;
            }
          }
        }

        // Check Ramp Elevation & Smooth Entry / Guide-Rails / Back-Wall Protection
        let groundHeight = Math.max(0, getTerrainHeightAt(nextX, nextZ));
        for (let i = 0; i < buildingColliders.length; i++) {
          const b = buildingColliders[i];
          if (nextX > b.minX && nextX < b.maxX && nextZ > b.minZ && nextZ < b.maxZ && v.y >= b.height - 3) {
            groundHeight = Math.max(groundHeight, b.height);
          }
        }

        for (let i = 0; i < ramps.length; i++) {
          const r = ramps[i];
          const halfW = r.w / 2 + 0.9;
          const halfL = r.l / 2 + 2.2; // Includes the flush entry apron!
          const isEW = r.dir === 'E' || r.dir === 'W';
          const inX = isEW ? Math.abs(nextX - r.x) < halfL : Math.abs(nextX - r.x) < halfW;
          const inZ = isEW ? Math.abs(nextZ - r.z) < halfW : Math.abs(nextZ - r.z) < halfL;

          if (inX && inZ) {
            let t = 0;
            if (r.dir === 'N') t = (r.z + r.l / 2 - nextZ) / r.l;
            else if (r.dir === 'S') t = (nextZ - (r.z - r.l / 2)) / r.l;
            else if (r.dir === 'E') t = (nextX - (r.x - r.l / 2)) / r.l;
            else if (r.dir === 'W') t = (r.x + r.l / 2 - nextX) / r.l;
            t = Math.max(0, Math.min(1, t));

            const rampY = (r.baseY || 0) + t * r.h;

            // If hitting the tall vertical back wall from ground level, block instead of teleporting up!
            if (t > 0.85 && v.y < rampY - 3.2) {
              blocked = true;
              v.speed *= -0.35;
              break;
            }

            groundHeight = Math.max(groundHeight, rampY);

            // Launch into the sky when reaching the top of a takeoff ramp at speed!
            if (!r.noRing && t > 0.78 && Math.abs(v.speed) > 32 && v.vy <= 2) {
              // Ensure player is moving toward the ramp launch direction
              const fwdDot =
                r.dir === 'N' ? -Math.cos(v.heading) :
                r.dir === 'S' ? Math.cos(v.heading) :
                r.dir === 'E' ? Math.sin(v.heading) : -Math.sin(v.heading);
              if (fwdDot * Math.sign(v.speed) > 0.35) {
                const jumpMult = spec.id === 'monster' ? 1.45 : 1.0;
                v.vy = Math.abs(v.speed) * 0.42 * jumpMult;
                sfx.playJump();
              }
            }
          }
        }

        if (!blocked) {
          v.x = Math.max(-1350, Math.min(1350, nextX));
          v.z = Math.max(-1350, Math.min(1350, nextZ));
        }

        if (v.y > groundHeight + 0.18 || v.vy > 0) {
          v.y += v.vy * dt;
          v.vy -= 38 * dt;
          v.airTime += dt;
          if (v.y <= groundHeight) {
            v.y = groundHeight;
            v.vy = 0;
            if (v.airTime > 0.65) {
              const pts = Math.round(v.airTime * 350);
              addScore(pts);
              showStuntBanner('🚀 MEGA AIR STUNT!', `+${pts} STUNT BONUS`);
              sfx.playFanfare();
            }
            v.airTime = 0;
          }
        } else {
          v.y = groundHeight;
          v.airTime = 0;
        }

        const targetRoll = steer * Math.min(1, Math.abs(v.speed) / 40) * 0.14;
        const targetPitch = v.y > groundHeight + 0.5 ? -v.vy * 0.018 : -throttle * 0.05;
        v.bodyGroup.rotation.z += (targetRoll - v.bodyGroup.rotation.z) * 10 * dt;
        v.bodyGroup.rotation.x += (targetPitch - v.bodyGroup.rotation.x) * 10 * dt;

        v.wheels.forEach(w => {
          w.tire.rotation.x += v.speed * dt * 0.8;
          if (w.front) w.group.rotation.y = v.steerAngle;
        });

        if (spec.isDino && v.dinoLegs.length === 2) {
          const walkCycle = Math.sin(performance.now() * 0.015) * Math.min(1, Math.abs(v.speed) / 20);
          v.dinoLegs[0].rotation.x = walkCycle * 0.6;
          v.dinoLegs[1].rotation.x = -walkCycle * 0.6;
        }
      }

      v.root.position.set(v.x, v.y, v.z);
      v.root.rotation.y = v.heading;
      sfx.updateSpecialAudio(dt, spec.id, v.speed);

      const mph = Math.round(Math.abs(v.speed) * 1.6);
      document.getElementById('speedVal').textContent = mph;
      document.getElementById('nitroFill').style.width = nitro + '%';
      const turboBar = document.getElementById('vcTurboBar');
      if (turboBar) turboBar.style.width = nitro + '%';
      const hypeBar = document.getElementById('vcHypeBar');
      if (hypeBar) hypeBar.style.width = Math.min(100, heroHype) + '%';
      document.getElementById('interactPrompt').style.display = 'none';
    } else {
      const sprinting = boostPressed && throttle !== 0;
      leo.heading += steer * 3.4 * dt;
      leo.speed = throttle * (sprinting ? 38 : 24);
      leo.x = Math.max(-1320, Math.min(1320, leo.x + Math.sin(leo.heading) * leo.speed * dt));
      leo.z = Math.max(-1320, Math.min(1320, leo.z + Math.cos(leo.heading) * leo.speed * dt));
      const onPier = Math.abs(leo.x - 340) < 11 && leo.z >= 950 && leo.z <= 1180;
      const gH = onPier ? 1.1 : Math.max(0, getTerrainHeightAt(leo.x, leo.z));
      if (leo.y > gH || leo.vy > 0) {
        leo.y += leo.vy * dt;
        leo.vy -= 42 * dt;
        if (leo.y < gH) {
          leo.y = gH;
          leo.vy = 0;
        }
      } else {
        leo.y = gH;
      }
      const strideRate = sprinting ? 0.026 : 0.018;
      const swing = Math.sin(performance.now() * strideRate) * (Math.abs(leo.speed) > 1 ? (sprinting ? 0.82 : 0.6) : 0);
      leo.legL.rotation.x = swing;
      leo.legR.rotation.x = -swing;
      leo.group.position.set(leo.x, leo.y, leo.z);
      leo.group.rotation.y = leo.heading;

      document.getElementById('speedVal').textContent = Math.round(Math.abs(leo.speed));
      const turboBar = document.getElementById('vcTurboBar');
      if (turboBar) turboBar.style.width = (sprinting ? 70 : 100) + '%';

      let nearVeh = null;
      worldVehicles.forEach(v => {
        if (Math.hypot(v.x - leo.x, v.z - leo.z) < 16) nearVeh = v;
      });
      const promptEl = document.getElementById('interactPrompt');
      if (nearVeh) {
        promptEl.style.display = 'block';
        promptEl.textContent = `Press [E] or Tap to Drive ${nearVeh.spec.emoji} ${nearVeh.spec.name}!`;
      } else {
        promptEl.style.display = 'none';
      }
    }

    // --- 3D CHASE CAMERA FOLLOW ---
    const camPresets = [
      { dist: 21, height: 8.5, lookAhead: 12 },
      { dist: 14, height: 5.2, lookAhead: 16 },
      { dist: 42, height: 25.0, lookAhead: 10 }
    ];
    const cp = camPresets[cameraMode];
    const targetCamX = playerObj.x - Math.sin(playerObj.heading) * cp.dist;
    const targetCamZ = playerObj.z - Math.cos(playerObj.heading) * cp.dist;
    const targetCamY = playerObj.y + cp.height;

    camera.position.x += (targetCamX - camera.position.x) * Math.min(1, dt * 8.5);
    camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, dt * 8.5);
    camera.position.y += (targetCamY - camera.position.y) * Math.min(1, dt * 7.5);

    const targetFov = boostPressed && activeVehicle && Math.abs(activeVehicle.speed) > 40 ? 74 : 62;
    if (Math.abs(camera.fov - targetFov) > 0.2) {
      camera.fov += (targetFov - camera.fov) * dt * 6;
      camera.updateProjectionMatrix();
    }

    camera.lookAt(
      playerObj.x + Math.sin(playerObj.heading) * cp.lookAhead,
      playerObj.y + 3.2,
      playerObj.z + Math.cos(playerObj.heading) * cp.lookAhead
    );

    // --- SMASHABLE 3D PHYSICS PROPS ---
    physicsProps.forEach(p => {
      if (p.hitCooldown > 0) p.hitCooldown -= dt;
      const dx = p.mesh.position.x - playerObj.x;
      const dz = p.mesh.position.z - playerObj.z;
      if (dx * dx + dz * dz < 14 && p.hitCooldown <= 0 && Math.abs(playerObj.speed) > 6) {
        p.hitCooldown = 1.2;
        p.vx = Math.sin(playerObj.heading) * Math.abs(playerObj.speed) * 0.9 + (Math.random() - 0.5) * 14;
        p.vz = Math.cos(playerObj.heading) * Math.abs(playerObj.speed) * 0.9 + (Math.random() - 0.5) * 14;
        p.vy = 14 + Math.random() * 10;
        addScore(25);
        sfx.playSmash();
      }
      if (p.mesh.position.y > p.baseY || Math.abs(p.vx) > 0.2 || Math.abs(p.vz) > 0.2) {
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.position.y += p.vy * dt;
        p.vy -= 36 * dt;
        p.mesh.rotation.x += p.vz * dt * 0.4;
        p.mesh.rotation.z += p.vx * dt * 0.4;
        if (p.mesh.position.y <= p.baseY) {
          p.mesh.position.y = p.baseY;
          p.vy *= -0.4;
          p.vx *= 0.65;
          p.vz *= 0.65;
        }
      }
    });

    // --- 3D CAR-SOCCER BALL PHYSICS & GOAL DETECTION ---
    const bdx = soccerBall.x - playerObj.x;
    const bdz = soccerBall.z - playerObj.z;
    const bDist = Math.hypot(bdx, bdz);
    if (bDist < 6.2) {
      const pushSpd = Math.max(28, Math.abs(playerObj.speed) * 1.35);
      soccerBall.vx = (bdx / (bDist || 1)) * pushSpd;
      soccerBall.vz = (bdz / (bDist || 1)) * pushSpd;
      soccerBall.vy = 14;
      sfx.playSmash();
    }
    soccerBall.x += soccerBall.vx * dt;
    soccerBall.z += soccerBall.vz * dt;
    soccerBall.y += soccerBall.vy * dt;
    if (soccerBall.y > 2.8) {
      soccerBall.vy -= 34 * dt;
    } else {
      soccerBall.y = 2.8;
      if (Math.abs(soccerBall.vy) > 3) soccerBall.vy *= -0.55;
      else soccerBall.vy = 0;
    }
    soccerBall.vx *= Math.pow(0.45, dt);
    soccerBall.vz *= Math.pow(0.45, dt);

    if (Math.abs(soccerBall.z - 42) < 9 && (Math.abs(soccerBall.x - 17) < 4.5 || Math.abs(soccerBall.x - 93) < 4.5)) {
      addScore(1000);
      stars += 1;
      heroHype = Math.min(100, heroHype + 30);
      updateHeroStars(true);
      showStuntBanner('⚽ GOOOOOOAL!!', `+$1,000 ${hometown.city.toUpperCase()} STADIUM BONUS!`, false);
      sfx.playFanfare();
      spawnConfetti(soccerBall.x, 4, soccerBall.z);
      soccerBall.x = 55;
      soccerBall.z = 42;
      soccerBall.vx = 0;
      soccerBall.vz = 0;

      // Advance Stadium Cup mission if active
      const curM = MISSIONS[missionIdx];
      if (curM && curM.type === 'soccer') {
        const nextIdx = activeObjectives.findIndex(o => !o.done);
        if (nextIdx >= 0) advanceMissionObjective(nextIdx, 'STADIUM GOAL SCORED!');
      }
    }
    soccerBall.mesh.position.set(soccerBall.x, soccerBall.y, soccerBall.z);
    soccerBall.mesh.rotation.x += soccerBall.vz * dt * 0.35;
    soccerBall.mesh.rotation.z -= soccerBall.vx * dt * 0.35;

    // --- WATER CANNON DROPS, PROJECTILES & CONFETTI ---
    const curM = MISSIONS[missionIdx];

    for (let i = waterDrops.length - 1; i >= 0; i--) {
      const w = waterDrops[i];
      w.life -= dt;
      w.mesh.position.x += w.vx * dt;
      w.mesh.position.y += w.vy * dt;
      w.mesh.position.z += w.vz * dt;
      w.vy -= 30 * dt;

      if (curM && curM.type === 'fire') {
        for (let oi = 0; oi < activeObjectives.length; oi++) {
          const o = activeObjectives[oi];
          if (!o.done && Math.hypot(w.mesh.position.x - o.x, w.mesh.position.z - o.z) < 15) {
            advanceMissionObjective(oi, 'BLAZE EXTINGUISHED!');
            break;
          }
        }
      }
      if (w.life <= 0 || w.mesh.position.y < 0) {
        scene.remove(w.mesh);
        waterDrops.splice(i, 1);
      }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 28 * dt;

      if (curM && (curM.type === 'delivery' || curM.type === 'icecream')) {
        for (let oi = 0; oi < activeObjectives.length; oi++) {
          const o = activeObjectives[oi];
          if (!o.done && Math.hypot(p.mesh.position.x - o.x, p.mesh.position.z - o.z) < 18) {
            advanceMissionObjective(oi, curM.type === 'delivery' ? 'HOT PIZZA DELIVERED!' : 'ICE CREAM SERVED!');
            p.life = 0;
            break;
          }
        }
      }
      if (p.life <= 0 || p.mesh.position.y < 0) {
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }

    for (let i = confettiList.length - 1; i >= 0; i--) {
      const c = confettiList[i];
      c.life -= dt;
      c.mesh.position.x += c.vx * dt;
      c.mesh.position.y += c.vy * dt;
      c.mesh.position.z += c.vz * dt;
      c.vy -= 26 * dt;
      c.mesh.rotation.x += 5 * dt;
      c.mesh.rotation.y += 5 * dt;
      if (c.life <= 0) {
        scene.remove(c.mesh);
        confettiList.splice(i, 1);
      }
    }

    aiCars.forEach(ai => {
      ai.z += ai.dir * ai.speed * dt;
      if (ai.z > 650) ai.z = -650;
      if (ai.z < -650) ai.z = 650;
      ai.group.position.z = ai.z;
    });

    // --- ACTIVE MULTI-STEP MISSION ANIMATION, TIMER & PROXIMITY CHECKS ---
    const nowSec = performance.now() * 0.001;
    if (curM) {
      if (curM.timeLimit > 0) {
        missionTimeLeft -= dt;
        const timerEl = document.getElementById('missionTimer');
        if (timerEl) {
          const secs = Math.max(0, Math.ceil(missionTimeLeft));
          const mm = String(Math.floor(secs / 60)).padStart(2, '0');
          const ss = String(secs % 60).padStart(2, '0');
          timerEl.textContent = `${mm}:${ss}`;
          timerEl.classList.toggle('urgent', secs <= 15);
        }
        if (missionTimeLeft <= 0) {
          showDialogueSubtitle(curM.giver, `"Time's up! No worries, Leo — let's run it back!"`);
          loadActiveMission(missionIdx, false);
        }
      }

      for (let oi = 0; oi < activeObjectives.length; oi++) {
        const o = activeObjectives[oi];
        if (o.done) continue;

        // Animate 3D mission props
        if (curM.type === 'robopup') {
          o.angle = (o.angle || 0) + (o.spd || 0.7) * dt;
          const prevX = o.x;
          const prevZ = o.z;
          o.x = o.cx + Math.cos(o.angle) * o.r;
          o.z = o.cz + Math.sin(o.angle) * o.r;
          if (o.mesh) {
            const gY = Math.max(0, getTerrainHeightAt(o.x, o.z));
            o.mesh.position.set(o.x, gY, o.z);
            o.mesh.rotation.y = Math.atan2(o.x - prevX, o.z - prevZ);
            if (o.mesh.userData.animPart) {
              o.mesh.userData.animPart.position.y = Math.abs(Math.sin(nowSec * 9 + oi)) * 1.1;
            }
          }
        } else if (o.mesh && o.mesh.userData.animPart) {
          if (curM.type === 'fire') {
            o.mesh.userData.animPart.scale.y = 0.85 + Math.sin(nowSec * 14 + oi) * 0.22;
          } else if (curM.type === 'delivery') {
            o.mesh.userData.animPart.rotation.y += dt * 2.4;
            o.mesh.userData.animPart.position.y = 4.6 + Math.sin(nowSec * 3.5 + oi) * 0.6;
          } else if (curM.type === 'icecream') {
            o.mesh.userData.animPart.rotation.y += dt * 1.2;
            o.mesh.userData.animPart.position.y = Math.sin(nowSec * 3.2 + oi) * 0.55;
          } else if (curM.type === 'checkpoint' || curM.type === 'roar') {
            o.mesh.userData.animPart.rotation.y += dt * 1.6;
          }
        }

        // Check player interaction distance for each mission type
        if (curM.type !== 'soccer') {
          const distO = Math.hypot(o.x - playerObj.x, o.z - playerObj.z);
          const heightDiffO = Math.abs((o.y || 0) - playerObj.y);
          if (distO < 18 && heightDiffO < 24) {
            if (curM.type === 'fire') {
              // Auto-douse if driving the Fire Engine right up to the blaze, or hint to spray!
              if (activeVehicle && activeVehicle.spec.id === 'firetruck') {
                sfx.playSplash();
                advanceMissionObjective(oi, 'BLAZE EXTINGUISHED!');
              } else {
                advanceMissionObjective(oi, 'BLAZE HELPED!');
              }
            } else if (curM.type === 'roar' && o.needsRoar) {
              if (activeVehicle && activeVehicle.spec.id === 'trex') {
                sfx.playRoar();
                advanceMissionObjective(oi, 'BABY DINOS WOKE UP!');
              } else {
                advanceMissionObjective(oi, 'DINO NEST VISITED!');
              }
            } else {
              const labelMsg =
                curM.type === 'delivery' ? 'HOT PIZZA DELIVERED!' :
                curM.type === 'icecream' ? 'ICE CREAM SERVED!' :
                curM.type === 'robopup' ? 'ROBO-PUP CAUGHT!' : 'CHECKPOINT CLEARED!';
              advanceMissionObjective(oi, labelMsg);
            }
          }
        }
      }
    }

    // Track nearest active objective for compass & golden beacon
    const nextTarget = getNextActiveObjective();
    const distToMission = Math.hypot(nextTarget.x - playerObj.x, nextTarget.z - playerObj.z);
    const bY = nextTarget.y !== undefined ? nextTarget.y : Math.max(0, getTerrainHeightAt(nextTarget.x, nextTarget.z));
    beaconGroup.position.set(nextTarget.x, bY, nextTarget.z);

    const angleToTarget = Math.atan2(nextTarget.x - playerObj.x, nextTarget.z - playerObj.z) - playerObj.heading;
    const deg = -(angleToTarget * 180) / Math.PI;
    document.getElementById('compassArrow').style.transform = `rotate(${deg}deg)`;
    document.getElementById('compassDist').textContent = `${Math.round(distToMission)}m to Objective`;

    // Auto-detect district crossing for iconic Vice City pink script zone toast!
    let closestDist = WORLD_DISTRICTS[0];
    let bestD = Infinity;
    for (let i = 0; i < WORLD_DISTRICTS.length; i++) {
      const dd = Math.hypot(WORLD_DISTRICTS[i].x - playerObj.x, WORLD_DISTRICTS[i].z - playerObj.z);
      if (dd < bestD) {
        bestD = dd;
        closestDist = WORLD_DISTRICTS[i];
      }
    }
    if (closestDist && closestDist.id !== lastDetectedDistrictId && bestD < 340) {
      lastDetectedDistrictId = closestDist.id;
      showZoneToast(closestDist.name);
      const btn = document.getElementById('btnDistrict');
      if (btn) btn.textContent = `${closestDist.name} (G)`;
    }

    // --- EXPLORABLE OPEN-WORLD ANIMATIONS & INTERACTIONS (FOOT + CAR!) ---
    if (lighthouseBeam) lighthouseBeam.rotation.y += dt * 0.75;
    if (rooftopPizzaSign) rooftopPizzaSign.rotation.y += dt * 1.4;

    // 1. 24 Hidden Golden Star Collectibles
    for (let i = 0; i < collectibleStars.length; i++) {
      const s = collectibleStars[i];
      if (s.collected) continue;
      s.mesh.rotation.y += dt * 2.2;
      s.mesh.position.y = s.baseY + Math.sin(nowSec * 3.2 + i) * 0.55;
      const dx = s.x - playerObj.x;
      const dz = s.z - playerObj.z;
      const dy = Math.abs(s.mesh.position.y - (playerObj.y + 2.2));
      if (dx * dx + dz * dz < 42 && dy < 7.5) {
        s.collected = true;
        s.mesh.visible = false;
        addScore(250);
        heroHype = Math.min(100, heroHype + 18);
        sfx.playCheckpoint();
        spawnConfetti(s.x, s.baseY, s.z);
        const totalFound = collectibleStars.filter(st => st.collected).length;
        showStuntBanner(`⭐ HIDDEN STAR #${totalFound}!`, `${s.hint.toUpperCase()} • +$250`, false);
        updateExplorerHUD();
      }
    }

    // 2. 8 Bouncy Neon Jump Pads (Works BOTH on Foot as Leo AND in Vehicles!)
    for (let i = 0; i < jumpPads.length; i++) {
      const jp = jumpPads[i];
      if (jp.cooldown > 0) jp.cooldown -= dt;
      const d = Math.hypot(jp.x - playerObj.x, jp.z - playerObj.z);
      if (d < 5.5 && jp.cooldown <= 0 && playerObj.y <= jp.y + 3.5) {
        jp.cooldown = 0.85;
        playerObj.vy = activeVehicle ? jp.power * 0.9 : jp.power;
        sfx.playJump();
        addScore(100);
        showStuntBanner('⚡ SUPER BOUNCE PAD!', '+$100 EXPLORER AIR', false);
      }
    }

    // 3. 10 Handcrafted Landmark Discoveries
    for (let i = 0; i < ISLAND_LANDMARKS.length; i++) {
      const lm = ISLAND_LANDMARKS[i];
      if (discoveredLandmarks.has(lm.id)) continue;
      if (Math.hypot(lm.x - playerObj.x, lm.z - playerObj.z) < lm.radius) {
        discoveredLandmarks.add(lm.id);
        addScore(500);
        stars = Math.min(6, stars + (discoveredLandmarks.size % 2 === 1 ? 1 : 0));
        updateHeroStars(true);
        sfx.playFanfare();
        showStuntBanner(`${lm.emoji} DISCOVERED!`, `${lm.name.toUpperCase()} • +$500`, false);
        showZoneToast(lm.name);
        updateExplorerHUD();
      }
    }

    // 4. 22 Friendly Wandering Citizens (Cheer & Jump when Leo walks or waves nearby!)
    for (let i = 0; i < citizens.length; i++) {
      const c = citizens[i];
      if (c.waveCooldown > 0) c.waveCooldown -= dt;
      if (c.cheerTimer > 0) {
        c.cheerTimer -= dt;
        c.mesh.position.y = Math.abs(Math.sin(nowSec * 14 + i)) * 2.2;
      } else {
        c.angle += c.spd * dt;
        const prevX = c.x;
        const prevZ = c.z;
        c.x = c.cx + Math.cos(c.angle) * c.r;
        c.z = c.cz + Math.sin(c.angle) * c.r;
        const gY = Math.max(0, getTerrainHeightAt(c.x, c.z));
        c.mesh.position.set(c.x, gY, c.z);
        c.mesh.rotation.y = Math.atan2(c.x - prevX, c.z - prevZ);
        const sw = Math.sin(nowSec * 7 + i) * 0.5;
        c.legL.rotation.x = sw;
        c.legR.rotation.x = -sw;
      }
      const dToLeo = Math.hypot(c.x - playerObj.x, c.z - playerObj.z);
      if (dToLeo < 11 && c.waveCooldown <= 0) {
        c.waveCooldown = 8.0;
        c.cheerTimer = 1.6;
        addScore(50);
        sfx.playCheckpoint();
      }
    }

    // 5. Custom Cyan Map Waypoint Arrival Check
    if (customWaypoint) {
      wpRing.scale.setScalar(1 + Math.sin(nowSec * 6) * 0.15);
      if (Math.hypot(customWaypoint.x - playerObj.x, customWaypoint.z - playerObj.z) < 18) {
        showStuntBanner('🔷 WAYPOINT REACHED!', customWaypoint.label.toUpperCase(), false);
        sfx.playCheckpoint();
        customWaypoint = null;
        waypointGroup.visible = false;
      }
    }

    drawMinimap(playerObj, curM);
  }

  function completeCurrentMission() {
    const m = MISSIONS[missionIdx];
    const reward = m ? m.reward : 1500;
    addScore(reward);
    stars += 1;
    heroHype = 100;
    updateHeroStars(true);
    if (m) completedMissionIds.add(m.id);

    showStuntBanner('Mission Passed!', `+$${reward.toLocaleString()} • HERO FAME +`, true);
    sfx.playMissionPassed();

    const pObj = activeVehicle || leo;
    spawnConfetti(pObj.x, (pObj.y || 0) + 4, pObj.z);

    const nextIdx = (missionIdx + 1) % MISSIONS.length;
    loadActiveMission(nextIdx, false);
    setTimeout(() => {
      const nextM = MISSIONS[missionIdx];
      if (nextM && gameStarted) showDialogueSubtitle(nextM.giver, nextM.dialogue);
    }, 3400);
  }

  function drawMinimap(playerObj, mission) {
    const ctx = minimapCtx;
    const w = 168, h = 168, cx = w / 2, cy = h / 2;
    const rOuter = 78;
    ctx.clearRect(0, 0, w, h);

    // Clip to circular Vice City radar
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter + 2, 0, Math.PI * 2);
    ctx.clip();

    // Deep Miami twilight radar ocean/ground fill
    ctx.fillStyle = '#120a26';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(playerObj.heading - Math.PI);
    const scale = 0.088;

    // Subtle city block zone fill around downtown
    ctx.fillStyle = 'rgba(42, 27, 78, 0.72)';
    ctx.fillRect((-680 - playerObj.x) * scale, (-680 - playerObj.z) * scale, 1360 * scale, 1360 * scale);

    // Road network
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 2.6;
    roadXCoords.forEach(rx => {
      const x = (rx - playerObj.x) * scale;
      ctx.beginPath();
      ctx.moveTo(x, (-680 - playerObj.z) * scale);
      ctx.lineTo(x, (680 - playerObj.z) * scale);
      ctx.stroke();
    });
    roadZCoords.forEach(rz => {
      const z = (rz - playerObj.z) * scale;
      ctx.beginPath();
      ctx.moveTo((-680 - playerObj.x) * scale, z);
      ctx.lineTo((680 - playerObj.x) * scale, z);
      ctx.stroke();
    });

    // Draw nearby Uncollected Hidden Golden Stars on Radar
    collectibleStars.forEach(s => {
      if (s.collected) return;
      const sx = (s.x - playerObj.x) * scale;
      const sz = (s.z - playerObj.z) * scale;
      if (Math.hypot(sx, sz) > rOuter - 6) return;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(sx, sz, 2.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Mission Giver Letter Blips (Classic GTA Radar Letters!)
    ctx.font = 'bold 9px Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    MISSIONS.forEach((m, idx) => {
      const firstObj = m.objectives[0];
      if (!firstObj) return;
      const gx = (firstObj.x - playerObj.x) * scale;
      const gz = (firstObj.z - playerObj.z) * scale;
      if (Math.hypot(gx, gz) > rOuter - 8) return;
      ctx.save();
      ctx.translate(gx, gz);
      ctx.rotate(-(playerObj.heading - Math.PI));
      ctx.fillStyle = idx === missionIdx ? m.codeColor : 'rgba(15, 10, 32, 0.85)';
      ctx.strokeStyle = m.codeColor;
      ctx.lineWidth = 1.4;
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(m.code, 0, 0.5);
      ctx.restore();
    });

    // Draw ALL remaining Active Mission Objective Blips (clamped to rim if far)
    const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.25;
    activeObjectives.forEach(o => {
      if (o.done) return;
      const mx = (o.x - playerObj.x) * scale;
      const mz = (o.z - playerObj.z) * scale;
      const mDist = Math.hypot(mx, mz);
      const maxR = rOuter - 8;
      const clampedX = mDist > maxR ? (mx / mDist) * maxR : mx;
      const clampedZ = mDist > maxR ? (mz / mDist) * maxR : mz;

      ctx.fillStyle = '#ff49a8';
      ctx.beginPath();
      ctx.arc(clampedX, clampedZ, 5.2 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(clampedX, clampedZ, 3.0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Custom Cyan Waypoint Blip (clamped to rim if far)
    if (customWaypoint) {
      const wx = (customWaypoint.x - playerObj.x) * scale;
      const wz = (customWaypoint.z - playerObj.z) * scale;
      const wDist = Math.hypot(wx, wz);
      const maxR = rOuter - 8;
      const cwX = wDist > maxR ? (wx / wDist) * maxR : wx;
      const cwZ = wDist > maxR ? (wz / wDist) * maxR : wz;
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(cwX, cwZ, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();

    // Rotating 'N' North Badge on Radar Rim (Iconic GTA Radar Detail!)
    const northAngle = playerObj.heading - Math.PI;
    const nx = cx + Math.sin(-northAngle) * (rOuter - 7);
    const ny = cy - Math.cos(-northAngle) * (rOuter - 7);
    ctx.fillStyle = '#090512';
    ctx.beginPath();
    ctx.arc(nx, ny, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny + 0.5);

    // Center Player Chevron
    ctx.fillStyle = '#42f59b';
    ctx.strokeStyle = '#090512';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx - 6, cy + 6);
    ctx.lineTo(cx, cy + 3);
    ctx.lineTo(cx + 6, cy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();
