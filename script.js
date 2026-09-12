/**
 * Digital companion to the physical jar of 100 love notes.
 */

const LOVE_MESSAGES = [
  "I love the way your blonde hair catches the light.",
  "Watching you build legos is one of the most beautiful things I've ever seen.",
  "I love your drumming passion and your mad skills.",
  "I love your whimsical spirit—you make every ordinary day feel like a magical adventure.",
  "Your sense of humor is my favorite medicine; thank you for always making me laugh.",
  "You have the kindest heart I've ever known, always looking out for everyone else.",
  "The way you care for people (and me) is truly inspiring.",
  "Our blanket forts are my favorite place in the galaxy, because you make them so cozy.",
  "I love that you're a powerhouse with a hammer/drill and a sweetheart with a hug.",
  "You're the most beautiful carpenter I've ever seen, especially when you're covered in paint.",
  "I love the passion you pour into your drumming; it's so incredibly cool to watch.",
  "Thank you for being the most loving and supportive partner I could ever ask for.",
  "I love your funny little quirks that make you uniquely, wonderfully Brinleigh.",
  "You have a way of making everything feel sacred and special with your whimsical touch.",
  "I love how strong and capable you are, yet so gentle and caring at the same time.",
  "Every blanket fort we build is a testament to how fun and creative you are.",
  "I love your sunshine energy—it brightens up even my darkest days.",
  "You are a master of craft, whether it's building furniture or building a beautiful room.",
  "I love hearing you play the drums; your talent and energy are absolutely captivating.",
  "You're the funniest person I know, and I love that we can be absolute weirdos together.",
  "Your kindness is a light that guides me, and I'm so lucky to be loved by you.",
  "I love how you turn an ordinary day extraordinary",
  "You're my favorite whimsical wanderer, and I'm so happy to be on this journey with you.",
  "I love the way you love me—with your whole heart, fiercely and truly.",
  "I love how you make me gifts and treat me like a king, even when I feel like I don't deserve it.",
  "penis."
];

// State
let currentIndex = 0;
let autoPlayInterval = null;
let soundEnabled = true;
let favorites = [];
let discoveredNotes = new Set([0]);

// Load saved data
try {
  const savedFavs = localStorage.getItem('brinleigh_favs');
  if (savedFavs) favorites = JSON.parse(savedFavs);
  const savedDiscovered = localStorage.getItem('brinleigh_discovered');
  if (savedDiscovered) discoveredNotes = new Set(JSON.parse(savedDiscovered));
} catch (e) {
  console.warn('Storage not accessible:', e);
}

// DOM Elements
const noteTextEl = document.getElementById('message-text');
const noteNumberEl = document.getElementById('note-number');
const noteCategoryEl = document.getElementById('note-category');
const progressFillEl = document.getElementById('progress-fill');
const discoveredCounterEl = document.getElementById('discovered-counter');
const favoriteBtn = document.getElementById('fav-btn');
const copyBtn = document.getElementById('copy-btn');
const drawBtn = document.getElementById('draw-random-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const autoBtn = document.getElementById('auto-cycle-btn');
const soundBtn = document.getElementById('sound-toggle-btn');
const jarVessel = document.getElementById('jar-vessel');
const toastEl = document.getElementById('toast-notification');
const toastMessageEl = document.getElementById('toast-text');
const drawerOverlay = document.getElementById('drawer-overlay');
const drawerCloseBtn = document.getElementById('drawer-close');
const openDrawerBtn = document.getElementById('open-drawer-btn');
const drawerListEl = document.getElementById('drawer-notes-list');
const searchInput = document.getElementById('notes-search-input');
const filterAllBtn = document.getElementById('filter-all');
const filterFavsBtn = document.getElementById('filter-favs');
let activeFilter = 'all';

// Moon Phase Calculator for today
function updateMoonPhase() {
  const moonGlyphs = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  const moonNames = [
    'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
  ];
  
  // Approximate moon phase calculation
  const now = new Date();
  const lp = 2551443;
  const newMoonRef = new Date(1970, 0, 7, 20, 35, 0).getTime() / 1000;
  const currentSec = now.getTime() / 1000;
  const phaseSec = (currentSec - newMoonRef) % lp;
  let phaseIndex = Math.floor((phaseSec / lp) * 8);
  if (phaseIndex < 0) phaseIndex += 8;
  phaseIndex = phaseIndex % 8;

  const moonEl = document.getElementById('active-moon-glyph');
  const phaseLabel = document.getElementById('current-phase-name');
  if (moonEl) moonEl.textContent = moonGlyphs[phaseIndex];
  if (phaseLabel) phaseLabel.textContent = `${moonNames[phaseIndex]} Magic`;
}

// Sound Synthesizer (Harmonious chime/bell using Web Audio API)
let audioCtx = null;
function playChime(customFreq = null) {
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window['webkitAudioContext'];
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sine';
    // Pentatonic frequencies based on note index
    const chords = [528, 594, 660, 792, 880, 1056];
    const pickFreq = customFreq || chords[Math.floor(Math.random() * chords.length)];
    osc.frequency.setValueAtTime(pickFreq, audioCtx.currentTime);

    // Warm resonant bandpass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.3);
  } catch (e) {
    // Audio might be blocked until user gesture, graceful fail
  }
}

// Display Note with silky transition
function displayNote(index, direction = 'next') {
  if (index < 0) index = LOVE_MESSAGES.length - 1;
  if (index >= LOVE_MESSAGES.length) index = 0;
  currentIndex = index;

  // Track discovered
  discoveredNotes.add(index);
  try {
    localStorage.setItem('brinleigh_discovered', JSON.stringify(Array.from(discoveredNotes)));
  } catch (e) {}

  // Update progress
  updateProgressUI();

  // Animation transition
  const exitClass = direction === 'prev' ? 'anim-exit-prev' : 'anim-exit';
  const enterClass = direction === 'prev' ? 'anim-enter-prev' : 'anim-enter';

  noteTextEl.classList.remove('anim-active', 'anim-enter', 'anim-enter-prev');
  noteTextEl.classList.add(exitClass);

  setTimeout(() => {
    noteTextEl.textContent = LOVE_MESSAGES[index];
    noteNumberEl.textContent = `Note #${index + 1} of ${LOVE_MESSAGES.length}`;

    // Thematic tags based on index
    const themes = [
      '🍂 Vibrant Leaf', '💎 Silver Quartz', '🍂 Russet Dream',
      '💎 Crystal Frost', '🍂 Golden Grove', '💎 Shimmering Stone', '🍂 Amber Whisper'
    ];
    noteCategoryEl.textContent = themes[index % themes.length];

    // Favorite state
    updateFavButtonUI();

    noteTextEl.classList.remove('anim-exit', 'anim-exit-prev');
    noteTextEl.classList.add(enterClass);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        noteTextEl.classList.remove(enterClass);
        noteTextEl.classList.add('anim-active');
      });
    });
  }, 220);

  playChime();
  triggerJarSparkles();
}

// Random Note Drawer (shuffles without immediate repetition)
let shuffledBag = [];
function drawRandomNote() {
  if (shuffledBag.length === 0) {
    shuffledBag = Array.from({ length: LOVE_MESSAGES.length }, (_, i) => i)
      .filter(i => i !== currentIndex)
      .sort(() => Math.random() - 0.5);
  }
  const nextIdx = shuffledBag.pop();
  displayNote(nextIdx, 'next');
}

// Progress and Stats
function updateProgressUI() {
  const count = discoveredNotes.size;
  if (discoveredCounterEl) {
    discoveredCounterEl.textContent = `${count} of ${LOVE_MESSAGES.length} Whispers Discovered`;
  }
  if (progressFillEl) {
    const percent = Math.min(100, (count / LOVE_MESSAGES.length) * 100);
    progressFillEl.style.width = `${percent}%`;
  }
}

// Favorite toggle
function toggleFavorite() {
  const isFav = favorites.includes(currentIndex);
  if (isFav) {
    favorites = favorites.filter(id => id !== currentIndex);
    showToast('Removed from sacred favorites ☽');
  } else {
    favorites.push(currentIndex);
    showToast('Saved to your sacred favorites ✨💖');
  }
  try {
    localStorage.setItem('brinleigh_favs', JSON.stringify(favorites));
  } catch (e) {}
  updateFavButtonUI();
  if (drawerOverlay.classList.contains('open')) renderDrawerList();
}

function updateFavButtonUI() {
  const isFav = favorites.includes(currentIndex);
  if (isFav) {
    favoriteBtn.classList.add('favorited');
    favoriteBtn.setAttribute('title', 'Remove from favorites');
  } else {
    favoriteBtn.classList.remove('favorited');
    favoriteBtn.setAttribute('title', 'Save to favorites');
  }
}

// Copy to clipboard
function copyCurrentNote() {
  const text = `"${LOVE_MESSAGES[currentIndex]}" — For Brinleigh ✨`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied love note to clipboard! 📜✨');
  }).catch(() => {
    // fallback
    showToast(`Note #${currentIndex + 1} chosen ✨`);
  });
}

// Toast notification
let toastTimer = null;
function showToast(message) {
  if (!toastEl || !toastMessageEl) return;
  toastMessageEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2600);
}

// Auto Cycle Mode
function toggleAutoCycle() {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
    autoBtn.classList.remove('active');
    autoBtn.innerHTML = `
      <svg viewBox="0 0 24 24" class="btn-icon"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      <span>Auto-Play</span>
    `;
    showToast('Auto-cycle paused ⏸️');
  } else {
    autoPlayInterval = setInterval(() => {
      drawRandomNote();
    }, 7000);
    autoBtn.classList.add('active');
    autoBtn.innerHTML = `
      <svg viewBox="0 0 24 24" class="btn-icon"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
      <span>Pause</span>
    `;
    showToast('Auto-cycle flowing every 7s ✨');
  }
}

// Sparkle Burst on Jar
function triggerJarSparkles() {
  if (!jarVessel) return;
  const jarRect = jarVessel.getBoundingClientRect();
  const centerX = jarRect.left + jarRect.width / 2;
  const centerY = jarRect.top + jarRect.height * 0.35;

  for (let i = 0; i < 8; i++) {
    createSparkleParticle(centerX, centerY);
  }
}

function createSparkleParticle(x, y) {
  const particle = document.createElement('div');
  particle.className = 'sparkle-mote';
  document.body.appendChild(particle);

  const angle = Math.random() * Math.PI * 2;
  const dist = 30 + Math.random() * 80;
  const endX = x + Math.cos(angle) * dist;
  const endY = y + Math.sin(angle) * dist - 30;

  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  particle.style.position = 'fixed';
  particle.style.zIndex = '99';
  particle.style.pointerEvents = 'none';
  particle.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
  particle.style.opacity = '1';

  requestAnimationFrame(() => {
    particle.style.transform = `translate(${endX - x}px, ${endY - y}px) scale(${0.5 + Math.random()})`;
    particle.style.opacity = '0';
  });

  setTimeout(() => particle.remove(), 850);
}

// Drawer: All Notes / Archive
function openDrawer() {
  drawerOverlay.classList.add('open');
  renderDrawerList();
}

function closeDrawer() {
  drawerOverlay.classList.remove('open');
}

function renderDrawerList() {
  if (!drawerListEl) return;
  const query = (searchInput.value || '').toLowerCase();
  drawerListEl.innerHTML = '';

  const filtered = LOVE_MESSAGES.map((msg, idx) => ({ msg, idx })).filter(({ msg, idx }) => {
    const matchesSearch = msg.toLowerCase().includes(query) || `note #${idx + 1}`.includes(query);
    if (!matchesSearch) return false;
    if (activeFilter === 'favs') return favorites.includes(idx);
    return true;
  });

  if (filtered.length === 0) {
    drawerListEl.innerHTML = `
      <div style="text-align: center; color: var(--color-starlight-muted); padding: 3rem 1rem; font-family: var(--font-witchy);">
        ${activeFilter === 'favs' ? 'No sacred favorites yet. Click the heart on any note to keep it here ✨' : 'No whispers match your search ✨'}
      </div>
    `;
    return;
  }

  filtered.forEach(({ msg, idx }) => {
    const isCurrent = idx === currentIndex;
    const isFav = favorites.includes(idx);
    const item = document.createElement('div');
    item.className = `drawer-note-item ${isCurrent ? 'current' : ''}`;
    item.innerHTML = `
      <div class="item-top">
        <span>Note #${idx + 1} ${isFav ? '💖' : ''}</span>
        <span style="opacity: 0.7;">${discoveredNotes.has(idx) ? 'Discovered ✦' : 'Hidden ☾'}</span>
      </div>
      <div class="item-text">${msg}</div>
    `;
    item.addEventListener('click', () => {
      displayNote(idx);
      closeDrawer();
    });
    drawerListEl.appendChild(item);
  });
}

// Background Twinkling Stars & Drifting Fireflies (Canvas)
function initStarCanvas() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const stars = [];
  const starCount = Math.min(140, Math.floor((width * height) / 8000));

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.4,
      alpha: Math.random(),
      twinkleSpeed: 0.006 + Math.random() * 0.018,
      speedY: -(0.05 + Math.random() * 0.15),
      speedX: (Math.random() - 0.5) * 0.08,
      color: Math.random() > 0.4 ? '#ffffff' : (Math.random() > 0.5 ? '#bdc3c7' : '#d35400')
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    stars.forEach(star => {
      star.alpha += star.twinkleSpeed;
      if (star.alpha > 1 || star.alpha < 0.1) {
        star.twinkleSpeed = -star.twinkleSpeed;
      }

      star.y += star.speedY;
      star.x += star.speedX;

      if (star.y < 0) {
        star.y = height;
        star.x = Math.random() * width;
      }
      if (star.x < 0) star.x = width;
      if (star.x > width) star.x = 0;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, star.alpha));
      ctx.fillStyle = star.color;
      ctx.shadowBlur = star.radius * 3.5;
      ctx.shadowColor = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(render);
  }

  render();
}

// Mouse Interactive Sparkles
let lastSparkleTime = 0;
document.addEventListener('pointermove', (e) => {
  const now = Date.now();
  if (now - lastSparkleTime < 140) return;
  lastSparkleTime = now;

  if (Math.random() > 0.6) {
    const spark = document.createElement('div');
    spark.className = 'sparkle-mote';
    spark.style.position = 'fixed';
    spark.style.left = `${e.clientX}px`;
    spark.style.top = `${e.clientY}px`;
    spark.style.pointerEvents = 'none';
    spark.style.zIndex = '90';
    spark.style.transform = `scale(${0.3 + Math.random() * 0.8})`;
    document.body.appendChild(spark);

    setTimeout(() => {
      spark.style.transition = 'all 0.6s ease-out';
      spark.style.transform += ` translate(${(Math.random() - 0.5) * 30}px, ${-15 - Math.random() * 20}px)`;
      spark.style.opacity = '0';
    }, 10);

    setTimeout(() => spark.remove(), 650);
  }
});

// Setup Event Listeners
function setupEvents() {
  if (drawBtn) drawBtn.addEventListener('click', drawRandomNote);
  if (jarVessel) {
    const handleJarTrigger = () => {
      drawRandomNote();
      showToast('A whisper was pulled from the jar ✨');
    };
    jarVessel.addEventListener('click', handleJarTrigger);
    jarVessel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleJarTrigger();
      }
    });
  }
  if (prevBtn) prevBtn.addEventListener('click', () => displayNote(currentIndex - 1, 'prev'));
  if (nextBtn) nextBtn.addEventListener('click', () => displayNote(currentIndex + 1, 'next'));
  if (autoBtn) autoBtn.addEventListener('click', toggleAutoCycle);
  if (favoriteBtn) favoriteBtn.addEventListener('click', toggleFavorite);
  if (copyBtn) copyBtn.addEventListener('click', copyCurrentNote);

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundBtn.classList.toggle('active', soundEnabled);
      showToast(soundEnabled ? 'Celestial chimes enabled 🔔✨' : 'Celestial chimes muted 🔕');
    });
  }

  // Drawer
  if (openDrawerBtn) openDrawerBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', (e) => {
      if (e.target === drawerOverlay) closeDrawer();
    });
  }

  if (filterAllBtn) {
    filterAllBtn.textContent = `All (${LOVE_MESSAGES.length})`;
    filterAllBtn.addEventListener('click', () => {
      activeFilter = 'all';
      filterAllBtn.classList.add('active');
      filterFavsBtn.classList.remove('active');
      renderDrawerList();
    });
  }

  if (filterFavsBtn) {
    filterFavsBtn.addEventListener('click', () => {
      activeFilter = 'favs';
      filterFavsBtn.classList.add('active');
      filterAllBtn.classList.remove('active');
      renderDrawerList();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => renderDrawerList());
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (drawerOverlay.classList.contains('open')) {
      if (e.key === 'Escape') closeDrawer();
      return;
    }
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'k') {
      displayNote(currentIndex + 1, 'next');
    } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'j') {
      displayNote(currentIndex - 1, 'prev');
    } else if (e.code === 'Space') {
      e.preventDefault();
      drawRandomNote();
    } else if (e.key.toLowerCase() === 'f') {
      toggleFavorite();
    } else if (e.key.toLowerCase() === 'c') {
      copyCurrentNote();
    }
  });

  const closingNote = document.getElementById('footer-closing-jar-trigger');
  if (closingNote) {
    const handleFooterJar = () => {
      drawRandomNote();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    closingNote.addEventListener('click', handleFooterJar);
    closingNote.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFooterJar();
      }
    });
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupEvents();
  // Start with note 0 or random
  displayNote(0);
});
