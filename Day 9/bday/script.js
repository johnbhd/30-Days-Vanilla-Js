/**
 * Three.js Birthday & Friendship Celebration
 * - Immediate Celebration Start (No Intro Blocker)
 * - 1-Second Friend Name Loop: Jadrien, Mark, Kurt, Mai, Francis, Jamma, Earl, Jerzel
 * - 2 Animated Birthday Emojis below the message
 * - In-and-Out 3D Flashcard Photo Loop for all 12 images in the folder
 * - Clickable / Poppable Three.js 3D Balloons & Moving SVG Balloons (Pop Boom Explosion + Sound!)
 */

(() => {
  'use strict';

  // ==================== 1. CONFIGURATION & DATA ====================
  const FRIENDS = [
    'Jadrien',
    'Mark',
    'Kurt',
    'Mai',
    'Francis',
    'Jamma',
    'Earl',
    'Jerzel'
  ];

  const NAME_INTERVAL_MS = 1000; // 1-second change word loop

  // Flashcard timing (ms): Enter (580ms) + Hold (1700ms) + Exit (520ms) = ~2.8s per card loop
  const CARD_ENTER_MS = 580;
  const CARD_HOLD_MS = 1700;
  const CARD_EXIT_MS = 520;

  const BALLOON_PALETTE = [
    { main: '#ff4d8d', dark: '#b81d58', light: '#ff9ebb' },
    { main: '#ffd166', dark: '#c99318', light: '#fff0b8' },
    { main: '#4cc9f0', dark: '#1b8aad', light: '#b8eeff' },
    { main: '#06d6a0', dark: '#048c68', light: '#9bfbe1' },
    { main: '#9b5de5', dark: '#5e2ca5', light: '#d6b8ff' },
    { main: '#ff9f1c', dark: '#c46d00', light: '#ffd294' },
    { main: '#f72585', dark: '#a30b52', light: '#ff99c8' }
  ];

  const BOOM_WORDS = ['Pogi si JB', 'Cute si JB'];

  // Default fallback list from images-manifest.js (all 12 JPEGs in Day 9/bday)
  const DEFAULT_IMAGES = Array.isArray(window.FOLDER_IMAGES) && window.FOLDER_IMAGES.length > 0
    ? [...window.FOLDER_IMAGES]
    : [
        'Messenger_creation_1068577195033636_010226.jpeg',
        'received_1087501246910628_010232.jpeg',
        'received_1109348757543550_010244.jpeg',
        'received_1146174753836750_010236.jpeg',
        'received_1176296670866369_010259.jpeg',
        'received_1179340050417377_010302.jpeg',
        'received_1357101109036963_010305.jpeg',
        'received_1513053686029179_010307.jpeg',
        'received_1571478061400438_010217.jpeg',
        'received_2666329427173998_010223.jpeg',
        'received_448776394892894_010250.jpeg',
        'received_575015498740391_010254.jpeg'
      ];

  // ==================== 2. DOM ELEMENTS ====================
  const burstBtn = document.getElementById('burst-btn');
  const friendNameEl = document.getElementById('friend-name');
  const balloonOverlay = document.getElementById('balloon-overlay');

  const activeFlashcard = document.getElementById('active-flashcard');
  const flashcardImg = document.getElementById('flashcard-img');
  const flashcardBlurBg = document.getElementById('flashcard-blur-bg');
  const flashcardCounter = document.getElementById('flashcard-counter');
  const cardDotsContainer = document.getElementById('card-dots');
  const prevCardBtn = document.getElementById('prev-card-btn');
  const nextCardBtn = document.getElementById('next-card-btn');
  const togglePlayBtn = document.getElementById('toggle-play-btn');

  // ==================== 3. STATE ====================
  let friendIndex = 0;
  let nameIntervalId = null;

  let photos = [...DEFAULT_IMAGES];
  let currentPhotoIndex = 0;
  let isFlashcardPlaying = true;
  let cardLoopTimer = null;
  let cardStageTimeout1 = null;
  let cardStageTimeout2 = null;

  let triggerThreeBurst = null; // Assigned by Three.js setup
  let audioCtx = null;

  // ==================== 4. BALLOON POP / BOOM SOUND & VISUAL EXPLOSION ====================
  function playBalloonPopBoomSound() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;

      // 1. Sharp Balloon Snap / Burst Noise
      const bufferSize = Math.floor(audioCtx.sampleRate * 0.14);
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.24));
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(950, now);
      bandpass.Q.setValueAtTime(0.9, now);

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.65, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);

      whiteNoise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      whiteNoise.start(now);

      // 2. Deep Punchy "Boom" Oscillator Thump
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);

      oscGain.gain.setValueAtTime(0.75, now);
      oscGain.gain.exponentialRampToValueAtTime(0.008, now + 0.19);

      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (_) {
      // Ignore if audio is blocked
    }
  }

  function createBoomExplosion(clientX, clientY, primaryColor = '#ff4d8d') {
    playBalloonPopBoomSound();

    const boom = document.createElement('div');
    boom.className = 'balloon-boom';
    boom.style.left = `${clientX}px`;
    boom.style.top = `${clientY}px`;
    boom.style.setProperty('--boom-color', primaryColor);

    // Core Flash + Shockwave Ring
    const flash = document.createElement('div');
    flash.className = 'boom-flash';
    boom.appendChild(flash);

    const ring = document.createElement('div');
    ring.className = 'boom-ring';
    boom.appendChild(ring);

    // Flying Rubber & Confetti Shards
    const shardCount = 18;
    for (let i = 0; i < shardCount; i++) {
      const shard = document.createElement('span');
      shard.className = 'boom-shard';
      const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const dist = 48 + Math.random() * 88;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const rot = -280 + Math.random() * 560;
      const color = i % 2 === 0
        ? primaryColor
        : BALLOON_PALETTE[i % BALLOON_PALETTE.length].main;

      shard.style.setProperty('--tx', `${tx.toFixed(1)}px`);
      shard.style.setProperty('--ty', `${ty.toFixed(1)}px`);
      shard.style.setProperty('--rot', `${rot.toFixed(0)}deg`);
      shard.style.setProperty('--shard-color', color);
      shard.style.setProperty('--shard-w', `${Math.round(7 + Math.random() * 9)}px`);
      shard.style.setProperty('--shard-h', `${Math.round(5 + Math.random() * 6)}px`);
      boom.appendChild(shard);
    }

    // Comic "💥 BOOM!" / "🎉 POP!" Floating Text
    const label = document.createElement('div');
    label.className = 'boom-text';
    label.textContent = BOOM_WORDS[Math.floor(Math.random() * BOOM_WORDS.length)];
    boom.appendChild(label);

    document.body.appendChild(boom);
    setTimeout(() => {
      if (boom.parentNode) boom.parentNode.removeChild(boom);
    }, 750);
  }

  // ==================== 5. 1-SECOND FRIEND NAME LOOP ====================
  function updateFriendDisplay(nextIndex) {
    friendIndex = ((nextIndex % FRIENDS.length) + FRIENDS.length) % FRIENDS.length;
    const nextName = FRIENDS[friendIndex];

    // Animate old name out, then pop new name in within the 1-second window
    friendNameEl.classList.remove('name-enter');
    friendNameEl.classList.add('name-exit');

    setTimeout(() => {
      friendNameEl.textContent = nextName;
      friendNameEl.setAttribute('data-index', String(friendIndex));
      friendNameEl.classList.remove('name-exit');
      friendNameEl.classList.add('name-enter');
    }, 170);
  }

  function startFriendNameLoop() {
    if (nameIntervalId) clearInterval(nameIntervalId);
    nameIntervalId = setInterval(() => {
      updateFriendDisplay(friendIndex + 1);
    }, NAME_INTERVAL_MS);
  }

  // ==================== 6. MOVING & POPPABLE BALLOON SVG GRAPHICS ====================
  function createBalloonSVG(palette, uid) {
    return `
      <svg viewBox="0 0 100 165" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bGrad-${uid}" cx="35%" cy="30%" r="68%">
            <stop offset="0%" stop-color="${palette.light}" />
            <stop offset="45%" stop-color="${palette.main}" />
            <stop offset="100%" stop-color="${palette.dark}" />
          </radialGradient>
        </defs>
        <!-- Wavy Hanging String -->
        <path d="M50 104 Q43 122 52 138 T47 163" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Balloon Knot -->
        <polygon points="45,103 55,103 50,96" fill="${palette.dark}" />
        <!-- Main Balloon Body -->
        <path d="M50 6 C78 6 92 28 92 54 C92 78 68 97 50 99 C32 97 8 78 8 54 C8 28 22 6 50 6 Z" fill="url(#bGrad-${uid})" />
        <!-- Glossy Specular Highlight -->
        <ellipse cx="33" cy="32" rx="9" ry="17" transform="rotate(-24 33 32)" fill="rgba(255,255,255,0.48)" />
        <circle cx="26" cy="52" r="3.5" fill="rgba(255,255,255,0.38)" />
      </svg>
    `;
  }

  let balloonUidCounter = 0;

  function spawnFloatingBalloon(options = {}) {
    if (!balloonOverlay) return;
    balloonUidCounter += 1;
    const palette = BALLOON_PALETTE[Math.floor(Math.random() * BALLOON_PALETTE.length)];
    const size = options.size || Math.floor(56 + Math.random() * 44);
    const leftPct = options.left !== undefined ? options.left : Math.random() * 92;
    const duration = options.duration || (8.5 + Math.random() * 6.5);
    const swayDuration = 2.2 + Math.random() * 1.8;
    const delay = options.delay || 0;

    const item = document.createElement('div');
    item.className = 'floating-balloon-item';
    item.style.width = `${size}px`;
    item.style.height = `${Math.round(size * 1.65)}px`;
    item.style.left = `${leftPct}%`;
    item.style.animationDuration = `${duration}s`;
    item.style.animationDelay = `${delay}s`;
    item.title = 'Click to Pop! 💥';

    const swayWrap = document.createElement('span');
    swayWrap.className = 'floating-balloon-sway';
    swayWrap.style.width = '100%';
    swayWrap.style.height = '100%';
    swayWrap.style.animationDuration = `${swayDuration}s`;
    swayWrap.innerHTML = createBalloonSVG(palette, balloonUidCounter);

    item.appendChild(swayWrap);

    // Click / Tap on this SVG balloon -> POP BOOM EXPLODE!
    item.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const rect = item.getBoundingClientRect();
      const popX = e.clientX || (rect.left + rect.width / 2);
      const popY = e.clientY || (rect.top + rect.height * 0.4);
      createBoomExplosion(popX, popY, palette.main);
      if (item.parentNode) item.parentNode.removeChild(item);
      // Spawn a replacement balloon from bottom so the party keeps going
      setTimeout(() => spawnFloatingBalloon(), 300);
    });

    balloonOverlay.appendChild(item);

    const totalMs = (duration + delay + 0.5) * 1000;
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, totalMs);
  }

  function launchBalloonWave(count = 12) {
    for (let i = 0; i < count; i++) {
      spawnFloatingBalloon({
        left: (i / count) * 92 + (Math.random() * 6),
        duration: 6.5 + Math.random() * 4.5,
        delay: i * 0.12,
        size: 58 + Math.random() * 42
      });
    }
  }

  function startContinuousBalloons() {
    for (let i = 0; i < 7; i++) {
      spawnFloatingBalloon({ delay: i * 0.7 });
    }
    setInterval(() => {
      if (document.hidden) return;
      spawnFloatingBalloon();
    }, 1600);
  }

  // ==================== 7. FLASHCARD IMAGE IN-AND-OUT LOOP ====================
  function preloadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  function renderCardDots() {
    if (!cardDotsContainer) return;
    cardDotsContainer.innerHTML = '';
    photos.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `card-dot${idx === currentPhotoIndex ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Show photo ${idx + 1}`);
      dot.addEventListener('click', () => {
        jumpToCard(idx);
      });
      cardDotsContainer.appendChild(dot);
    });
  }

  function updateCardDOM(index) {
    currentPhotoIndex = ((index % photos.length) + photos.length) % photos.length;
    const src = photos[currentPhotoIndex];

    flashcardImg.src = src;
    flashcardBlurBg.style.backgroundImage = `url("${encodeURI(src)}")`;
    if (flashcardCounter) {
      flashcardCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;
    }

    const dots = cardDotsContainer.querySelectorAll('.card-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentPhotoIndex);
    });

    // Preload next photo in background for zero flicker
    const nextIdx = (currentPhotoIndex + 1) % photos.length;
    preloadImage(photos[nextIdx]);
  }

  function clearCardTimers() {
    if (cardLoopTimer) clearTimeout(cardLoopTimer);
    if (cardStageTimeout1) clearTimeout(cardStageTimeout1);
    if (cardStageTimeout2) clearTimeout(cardStageTimeout2);
  }

  function runFlashcardCycle(targetIndex = currentPhotoIndex) {
    clearCardTimers();
    updateCardDOM(targetIndex);

    // Phase 1: Animate IN
    activeFlashcard.classList.remove('is-holding', 'is-exiting');
    void activeFlashcard.offsetWidth; // Force reflow
    activeFlashcard.classList.add('is-entering');

    // Phase 2: Gentle 3D HOLD
    cardStageTimeout1 = setTimeout(() => {
      activeFlashcard.classList.remove('is-entering');
      activeFlashcard.classList.add('is-holding');
    }, CARD_ENTER_MS);

    if (!isFlashcardPlaying) return;

    // Phase 3: Animate OUT
    cardStageTimeout2 = setTimeout(() => {
      activeFlashcard.classList.remove('is-entering', 'is-holding');
      activeFlashcard.classList.add('is-exiting');
    }, CARD_ENTER_MS + CARD_HOLD_MS);

    // Phase 4: Loop to next image
    cardLoopTimer = setTimeout(() => {
      runFlashcardCycle(currentPhotoIndex + 1);
    }, CARD_ENTER_MS + CARD_HOLD_MS + CARD_EXIT_MS);
  }

  function jumpToCard(targetIndex) {
    clearCardTimers();
    activeFlashcard.classList.remove('is-entering', 'is-holding');
    activeFlashcard.classList.add('is-exiting');
    setTimeout(() => {
      runFlashcardCycle(targetIndex);
    }, 240);
  }

  async function tryDiscoverExtraServerImages() {
    if (window.location.protocol === 'file:') return;
    try {
      const res = await fetch('./');
      if (!res.ok) return;
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = Array.from(doc.querySelectorAll('a'))
        .map((a) => decodeURIComponent(a.getAttribute('href') || ''))
        .filter((href) => /\.(jpe?g|png|webp|gif)$/i.test(href) && !href.startsWith('http'));

      if (links.length > 0) {
        const merged = Array.from(new Set([...photos, ...links]));
        if (merged.length !== photos.length) {
          photos = merged;
          renderCardDots();
          updateCardDOM(currentPhotoIndex);
        }
      }
    } catch (_) {
      // Ignore when directory listing is disabled
    }
  }

  if (prevCardBtn) {
    prevCardBtn.addEventListener('click', () => jumpToCard(currentPhotoIndex - 1));
  }
  if (nextCardBtn) {
    nextCardBtn.addEventListener('click', () => jumpToCard(currentPhotoIndex + 1));
  }
  if (togglePlayBtn) {
    togglePlayBtn.addEventListener('click', () => {
      isFlashcardPlaying = !isFlashcardPlaying;
      togglePlayBtn.textContent = isFlashcardPlaying ? '⏸' : '▶';
      if (isFlashcardPlaying) {
        runFlashcardCycle(currentPhotoIndex + 1);
      } else {
        clearCardTimers();
        activeFlashcard.classList.remove('is-entering', 'is-exiting');
        activeFlashcard.classList.add('is-holding');
      }
    });
  }

  // ==================== 8. THREE.JS 3D BALLOONS (CLICK TO POP!) & CONFETTI ====================
  function initThreeBirthdayScene() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0, 26);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Lighting for glossy 3D balloons
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d0, 1.15);
    keyLight.position.set(12, 22, 18);
    scene.add(keyLight);

    const pinkPointLight = new THREE.PointLight(0xff4d8d, 1.4, 60);
    pinkPointLight.position.set(-14, 8, 12);
    scene.add(pinkPointLight);

    const cyanPointLight = new THREE.PointLight(0x4cc9f0, 1.2, 60);
    cyanPointLight.position.set(14, -8, 10);
    scene.add(cyanPointLight);

    // 3D Balloons Group
    const balloonColors = [0xff4d8d, 0xffd166, 0x4cc9f0, 0x06d6a0, 0x9b5de5, 0xff9f1c, 0xf72585];
    const balloonCssColors = ['#ff4d8d', '#ffd166', '#4cc9f0', '#06d6a0', '#9b5de5', '#ff9f1c', '#f72585'];
    const balloons3D = [];
    const clickableMeshes = [];

    const sphereGeo = new THREE.SphereGeometry(1.15, 28, 28);
    sphereGeo.scale(1, 1.22, 1);

    const knotGeo = new THREE.ConeGeometry(0.22, 0.28, 12);
    const stringMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45
    });

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -1.35, 0),
      new THREE.Vector3(-0.15, -2.2, 0.08),
      new THREE.Vector3(0.14, -3.1, -0.06),
      new THREE.Vector3(-0.08, -4.0, 0.04)
    ]);
    const stringGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(16));

    const TOTAL_3D_BALLOONS = 22;
    for (let i = 0; i < TOTAL_3D_BALLOONS; i++) {
      const group = new THREE.Group();
      const colorIdx = i % balloonColors.length;
      const colorHex = balloonColors[colorIdx];
      const cssColor = balloonCssColors[colorIdx];

      const mat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        roughness: 0.18,
        metalness: 0.08,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        transparent: true,
        opacity: 0.92
      });

      const bodyMesh = new THREE.Mesh(sphereGeo, mat);
      group.add(bodyMesh);

      const knotMesh = new THREE.Mesh(knotGeo, mat);
      knotMesh.position.y = -1.36;
      group.add(knotMesh);

      const stringLine = new THREE.Line(stringGeo, stringMaterial);
      group.add(stringLine);

      const spreadX = (Math.random() - 0.5) * 34;
      const spreadY = (Math.random() - 0.5) * 32;
      const spreadZ = -12 + Math.random() * 18;
      group.position.set(spreadX, spreadY, spreadZ);

      const baseScale = 0.72 + Math.random() * 0.55;
      group.scale.setScalar(baseScale);

      scene.add(group);
      const balloonRecord = {
        group,
        bodyMesh,
        cssColor,
        baseScale,
        speedY: 0.024 + Math.random() * 0.032,
        swaySpeed: 0.8 + Math.random() * 1.4,
        swayAmp: 0.012 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        boostY: 0
      };
      bodyMesh.userData.balloonRecord = balloonRecord;
      balloons3D.push(balloonRecord);
      clickableMeshes.push(bodyMesh);
    }

    // 3D Confetti Particles
    const CONFETTI_COUNT = 220;
    const confettiPieces = [];
    const confettiGeo = new THREE.PlaneGeometry(0.28, 0.16);

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: balloonColors[i % balloonColors.length],
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(confettiGeo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 36,
        (Math.random() - 0.5) * 30,
        -8 + Math.random() * 18
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(mesh);

      confettiPieces.push({
        mesh,
        velX: (Math.random() - 0.5) * 0.02,
        velY: -(0.02 + Math.random() * 0.035),
        velZ: (Math.random() - 0.5) * 0.015,
        rotX: (Math.random() - 0.5) * 0.08,
        rotY: (Math.random() - 0.5) * 0.08,
        rotZ: (Math.random() - 0.5) * 0.06
      });
    }

    // Burst 3D confetti at a specific 3D position when a 3D balloon is popped!
    let burstCursor = 0;
    function spawn3DConfettiAt(pos3D) {
      for (let i = 0; i < 36; i++) {
        const c = confettiPieces[(burstCursor + i) % confettiPieces.length];
        c.mesh.position.copy(pos3D);
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        const speed = 0.14 + Math.random() * 0.28;
        c.velX = Math.cos(theta) * Math.cos(phi) * speed;
        c.velY = Math.sin(phi) * speed + 0.08;
        c.velZ = Math.sin(theta) * Math.cos(phi) * speed;
      }
      burstCursor = (burstCursor + 36) % confettiPieces.length;
    }

    // Raycaster so clicking any 3D balloon in the background pops & explodes it!
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    window.addEventListener('pointerdown', (e) => {
      // Ignore if clicking a control button
      if (e.target && e.target.closest('button')) return;

      pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(pointerNDC, camera);
      const intersects = raycaster.intersectObjects(clickableMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const record = hitMesh.userData.balloonRecord;
        if (record) {
          // 1. Trigger 3D confetti explosion at balloon's 3D world position
          spawn3DConfettiAt(record.group.position);
          // 2. Trigger screen-space BOOM visual + POP sound
          createBoomExplosion(e.clientX, e.clientY, record.cssColor);
          // 3. Respawn the popped 3D balloon at the bottom of the scene
          record.group.position.y = -20 - Math.random() * 5;
          record.group.position.x = (Math.random() - 0.5) * 34;
          record.boostY = 0.06;
        }
      }
    });

    // Global burst function for "Release Balloons" button
    triggerThreeBurst = () => {
      balloons3D.forEach((b) => {
        b.boostY = 0.11 + Math.random() * 0.08;
      });
      spawn3DConfettiAt(new THREE.Vector3(0, 2, 4));
    };

    // Subtle mouse / touch parallax
    let targetCamX = 0;
    let targetCamY = 0;
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      targetCamX = nx * 1.4;
      targetCamY = ny * 0.9;
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation Loop
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      camera.position.x += (targetCamX - camera.position.x) * 0.04;
      camera.position.y += (targetCamY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Update 3D Balloons
      for (let i = 0; i < balloons3D.length; i++) {
        const b = balloons3D[i];
        b.group.position.y += b.speedY + b.boostY;
        b.boostY *= 0.96;
        b.group.position.x += Math.sin(elapsed * b.swaySpeed + b.phase) * b.swayAmp;
        b.group.rotation.z = Math.sin(elapsed * b.swaySpeed + b.phase) * 0.12;
        b.group.rotation.y = Math.cos(elapsed * 0.5 + b.phase) * 0.25;

        if (b.group.position.y > 19) {
          b.group.position.y = -19;
          b.group.position.x = (Math.random() - 0.5) * 34;
        }
      }

      // Update 3D Confetti
      for (let i = 0; i < confettiPieces.length; i++) {
        const c = confettiPieces[i];
        c.mesh.position.x += c.velX + Math.sin(elapsed * 1.5 + i) * 0.008;
        c.mesh.position.y += c.velY;
        c.mesh.position.z += c.velZ;

        c.velX *= 0.985;
        c.velZ *= 0.985;
        if (c.velY > -0.03) {
          c.velY -= 0.0032;
        }

        c.mesh.rotation.x += c.rotX;
        c.mesh.rotation.y += c.rotY;
        c.mesh.rotation.z += c.rotZ;

        if (c.mesh.position.y < -17) {
          c.mesh.position.y = 17;
          c.mesh.position.x = (Math.random() - 0.5) * 36;
          c.velY = -(0.02 + Math.random() * 0.035);
        }
      }

      renderer.render(scene, camera);
    }

    animate();
  }

  if (burstBtn) {
    burstBtn.addEventListener('click', () => {
      launchBalloonWave(12);
      if (typeof triggerThreeBurst === 'function') {
        triggerThreeBurst();
      }
    });
  }

  // ==================== 9. INITIALIZE IMMEDIATELY ====================
  function init() {
    document.body.classList.add('celebration-started');
    photos.slice(0, 4).forEach(preloadImage);
    renderCardDots();
    updateCardDOM(0);
    tryDiscoverExtraServerImages();

    initThreeBirthdayScene();
    startContinuousBalloons();
    launchBalloonWave(10);
    startFriendNameLoop();
    runFlashcardCycle(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
