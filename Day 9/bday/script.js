/**
 * Three.js Birthday & Friendship Celebration
 * - Cinematic Birthday Intro Sequence (with balloon wave & 3D confetti burst)
 * - 1-Second Friend Name Loop: Jadrien, Mark, Kurt, Mai, Francis, Jamma, Earl, Jerzel
 * - 2 Animated Birthday Emojis below the message
 * - In-and-Out 3D Flashcard Photo Loop for all images in the folder
 * - Three.js 3D Glossy Balloons + Moving SVG Balloon Graphics
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

  const NAME_INTERVAL_MS = 1000; // 1-second change word loop as requested

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
  const introOverlay = document.getElementById('intro-overlay');
  const openCelebrationBtn = document.getElementById('open-celebration-btn');
  const introCountdownEl = document.getElementById('intro-countdown');
  const replayIntroBtn = document.getElementById('replay-intro-btn');
  const burstBtn = document.getElementById('burst-btn');
  const folderInput = document.getElementById('folder-input');

  const friendNameEl = document.getElementById('friend-name');
  const rosterPills = Array.from(document.querySelectorAll('.roster-pill'));

  const balloonOverlay = document.getElementById('balloon-overlay');

  const activeFlashcard = document.getElementById('active-flashcard');
  const flashcardImg = document.getElementById('flashcard-img');
  const flashcardBlurBg = document.getElementById('flashcard-blur-bg');
  const flashcardLabel = document.getElementById('flashcard-label');
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

  let introOpened = false;
  let introCountdownTimer = null;
  let triggerThreeBurst = null; // Assigned by Three.js setup

  // ==================== 4. 1-SECOND FRIEND NAME LOOP ====================
  function updateFriendDisplay(nextIndex) {
    friendIndex = ((nextIndex % FRIENDS.length) + FRIENDS.length) % FRIENDS.length;
    const nextName = FRIENDS[friendIndex];

    // Update roster highlight immediately
    rosterPills.forEach((pill, idx) => {
      pill.classList.toggle('active', idx === friendIndex);
    });

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

  // ==================== 5. MOVING BALLOON SVG GRAPHICS ====================
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
    const size = options.size || Math.floor(54 + Math.random() * 44);
    const leftPct = options.left !== undefined ? options.left : Math.random() * 94;
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

    const swayWrap = document.createElement('span');
    swayWrap.className = 'floating-balloon-sway';
    swayWrap.style.width = '100%';
    swayWrap.style.height = '100%';
    swayWrap.style.animationDuration = `${swayDuration}s`;
    swayWrap.innerHTML = createBalloonSVG(palette, balloonUidCounter);

    item.appendChild(swayWrap);
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

  // Keep steady stream of moving background balloons
  function startContinuousBalloons() {
    for (let i = 0; i < 6; i++) {
      spawnFloatingBalloon({ delay: i * 0.9 });
    }
    setInterval(() => {
      if (document.hidden) return;
      spawnFloatingBalloon();
    }, 1800);
  }

  // ==================== 6. FLASHCARD IMAGE IN-AND-OUT LOOP ====================
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
    const friendDedicated = FRIENDS[currentPhotoIndex % FRIENDS.length];

    flashcardImg.src = src;
    flashcardBlurBg.style.backgroundImage = `url("${encodeURI(src)}")`;
    flashcardLabel.textContent = `Friendship Memory #${currentPhotoIndex + 1} • ✨ ${friendDedicated}`;
    flashcardCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;

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
    void activeFlashcard.offsetWidth; // Force reflow so animation restarts cleanly
    activeFlashcard.classList.add('is-entering');

    // Phase 2: Switch to gentle 3D HOLD after entrance finishes
    cardStageTimeout1 = setTimeout(() => {
      activeFlashcard.classList.remove('is-entering');
      activeFlashcard.classList.add('is-holding');
    }, CARD_ENTER_MS);

    if (!isFlashcardPlaying) return;

    // Phase 3: Animate OUT after hold duration
    cardStageTimeout2 = setTimeout(() => {
      activeFlashcard.classList.remove('is-entering', 'is-holding');
      activeFlashcard.classList.add('is-exiting');
    }, CARD_ENTER_MS + CARD_HOLD_MS);

    // Phase 4: Loop to next image after exit completes
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

  // Optional auto-discovery of extra images if served via local HTTP directory listing
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

  // Handle user adding extra photos via the "+Photos" picker
  if (folderInput) {
    folderInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      const blobUrls = files.map((file) => URL.createObjectURL(file));
      photos = [...blobUrls, ...photos];
      renderCardDots();
      jumpToCard(0);
      launchBalloonWave(8);
    });
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

  // ==================== 7. THREE.JS 3D BALLOONS & CONFETTI SCENE ====================
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
    const balloons3D = [];

    const sphereGeo = new THREE.SphereGeometry(1.1, 28, 28);
    // Stretch vertically slightly for realistic teardrop balloon silhouette
    sphereGeo.scale(1, 1.22, 1);

    const knotGeo = new THREE.ConeGeometry(0.22, 0.28, 12);
    const stringMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45
    });

    // Wavy string geometry
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -1.35, 0),
      new THREE.Vector3(-0.15, -2.2, 0.08),
      new THREE.Vector3(0.14, -3.1, -0.06),
      new THREE.Vector3(-0.08, -4.0, 0.04)
    ]);
    const stringGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(16));

    const TOTAL_3D_BALLOONS = 20;
    for (let i = 0; i < TOTAL_3D_BALLOONS; i++) {
      const group = new THREE.Group();
      const colorHex = balloonColors[i % balloonColors.length];

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

      // Distribute across 3D space (mostly around edges & depth so center card stays readable)
      const spreadX = (Math.random() - 0.5) * 34;
      const spreadY = (Math.random() - 0.5) * 32;
      const spreadZ = -12 + Math.random() * 18;
      group.position.set(spreadX, spreadY, spreadZ);

      const scale = 0.68 + Math.random() * 0.55;
      group.scale.setScalar(scale);

      scene.add(group);
      balloons3D.push({
        group,
        speedY: 0.024 + Math.random() * 0.032,
        swaySpeed: 0.8 + Math.random() * 1.4,
        swayAmp: 0.012 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        boostY: 0
      });
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

    // Explosive burst function triggered on Intro Open or "Release Balloons" button
    triggerThreeBurst = () => {
      balloons3D.forEach((b) => {
        b.boostY = 0.11 + Math.random() * 0.08;
      });
      confettiPieces.forEach((c, idx) => {
        if (idx < 110) {
          c.mesh.position.set(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 3,
            2 + Math.random() * 6
          );
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.08 + Math.random() * 0.22;
          c.velX = Math.cos(angle) * speed;
          c.velY = Math.sin(angle) * speed + 0.08;
          c.velZ = (Math.random() - 0.5) * 0.15;
        }
      });
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
        b.boostY *= 0.96; // Decay intro boost smoothly
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

        // Gravity pull back to gentle fall after burst
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

  // ==================== 8. CINEMATIC INTRO SEQUENCE ====================
  function openCelebration() {
    if (introOpened) return;
    introOpened = true;
    if (introCountdownTimer) clearInterval(introCountdownTimer);

    if (introOverlay) {
      introOverlay.classList.add('is-hidden');
    }
    document.body.classList.remove('intro-active');
    document.body.classList.add('celebration-started');

    // Launch moving balloon wave + 3D confetti & balloon burst
    launchBalloonWave(14);
    if (typeof triggerThreeBurst === 'function') {
      triggerThreeBurst();
    }

    // Start the 1-second friend name loop and flashcard loop
    startFriendNameLoop();
    runFlashcardCycle(0);
  }

  function startIntroSequence() {
    introOpened = false;
    document.body.classList.remove('celebration-started');
    document.body.classList.add('intro-active');
    if (introOverlay) {
      introOverlay.classList.remove('is-hidden');
    }

    let secondsLeft = 3;
    if (introCountdownEl) {
      introCountdownEl.textContent = `(Auto-starts in ${secondsLeft}s)`;
    }

    if (introCountdownTimer) clearInterval(introCountdownTimer);
    introCountdownTimer = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        if (introCountdownEl) {
          introCountdownEl.textContent = `(Auto-starts in ${secondsLeft}s)`;
        }
      } else {
        clearInterval(introCountdownTimer);
        openCelebration();
      }
    }, 950);
  }

  if (openCelebrationBtn) {
    openCelebrationBtn.addEventListener('click', openCelebration);
  }
  if (introOverlay) {
    introOverlay.addEventListener('click', (e) => {
      if (e.target === introOverlay) openCelebration();
    });
  }
  if (replayIntroBtn) {
    replayIntroBtn.addEventListener('click', () => {
      clearCardTimers();
      startIntroSequence();
    });
  }
  if (burstBtn) {
    burstBtn.addEventListener('click', () => {
      launchBalloonWave(12);
      if (typeof triggerThreeBurst === 'function') {
        triggerThreeBurst();
      }
    });
  }

  // ==================== 9. INITIALIZE EVERYTHING ====================
  function init() {
    // Preload first few images right away
    photos.slice(0, 4).forEach(preloadImage);
    renderCardDots();
    updateCardDOM(0);
    tryDiscoverExtraServerImages();

    initThreeBirthdayScene();
    startContinuousBalloons();
    startIntroSequence();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
