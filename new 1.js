Const IMAGE_SRCS = [
"https://raw.githubusercontent.com/asdas8644-sketch/skayrim1/refs/heads/main/t1.jpg",
"https://raw.githubusercontent.com/asdas8644-sketch/skayrim1/refs/heads/main/T2.jpg",
"https://raw.githubusercontent.com/asdas8644-sketch/skayrim1/refs/heads/main/T3.jpg",
"https://raw.githubusercontent.com/asdas8644-sketch/skayrim1/refs/heads/main/T4.jpg",
"https://raw.githubusercontent.com/asdas8644-sketch/skayrim1/refs/heads/main/T5.jpg",
"https://raw.githubusercontent.com/asdas8644-sketch/skayrim1/refs/heads/main/T6.jpg",
];
Const IMAGE_ASPECTS = [1, 1, 1, 1, 1, 1];
Const FACE_NAMES = [
  «Тамриель 1»,
  «Тамриель 2»,
  «Тамриель 3»,
  «Тамриель 4»,
  «Тамриель 5»,
  «Тамриель 6»
];
Const SWAP_RADIUS = 3;

Const N = IMAGE_SRCS.length;
Const STOPS = buildStops(N);

Const stopIndex = (s) => Math.min(N – 1, Math.floor(s * (N – 1)));

Function faceAtStop(i) {
  If (i < 6) return i;
  Return 1 + ((i – 2) % 4);
}

Function buildStops(n) {
  Const base = [
    { rx: 90, ry: 0 },
    { rx: 0, ry: 0 },
    { rx: 0, ry: -90 },
    { rx: 0, ry: -180 },
    { rx: 0, ry: -270 },
    { rx: -90, ry: -360 }
  ];
  Const out = base.slice(0, Math.min(n, 6));
  For (let i = 6; i < n; i++) {
    Out.push({ rx: 0, ry: -360 – (i – 6) * 90 });
  }
  Return out;
}

Const dom = {
  Cube: document.getElementById(«cube»),
  Faces: […document.querySelectorAll(«.face»)],
  scrollEl: document.getElementById(«scroll_container»),
  strip: document.getElementById(«scene_strip»),
  upbarPct: document.getElementById(«upbar_pct»),
  progFill: document.getElementById(«prog_fill»),
  sceneName: document.getElementById(«scene_name»),
  captionNum: document.getElementById(«face_caption_num»),
  captionName: document.getElementById(«face_caption_name»),
  themeToggle: document.getElementById(«theme_toggle»)
};

For (let i = dom.scrollEl.querySelectorAll(«section»).length; i < N; i++) {
  Const sec = document.createElement(«section»);
  Sec.id = s${i};
  Dom.scrollEl.appendChild(sec);
}

Dom.strip.innerHTML = «»;
For (let i = 0; i < N; i++) {
  Const a = document.createElement(«a»);
  a.href = #s${i};
  a.className = «scene-dot» + (i === 0 ? «active» : «»);
  dom.strip.appendChild(a);
}

Const sceneDots = […document.querySelectorAll(«.scene-dot»)];
Const sections = […document.querySelectorAll(«#scroll_container section»)];

Const faceImgIdx = new Array(6).fill(-1);
Let currentStop = -1;

Const imagePromises = new Map();

Const isDark = () =>
  Document.documentElement.getAttribute(«data-theme») === «dark»;

Const getDarkSrc = (src) => src.replace(/\.webp$/, «-dark.webp»);

Const getActiveSrc = (imgIdx) => {
  Const src = IMAGE_SRCS[imgIdx];
  Return isDark() ? getDarkSrc(src) : src;
};

Const preloadImage = (src) => {
  If (imagePromises.has(src)) return imagePromises.get(src);
  Const p = (async () => {
    Const img = new Image();
    Img.src = src;
    Await img.decode().catch(() => {});
    Return img;
  })();
  imagePromises.set(src, p);
  return p;
};

IMAGE_SRCS.forEach((src) => {
  preloadImage(src);
  preloadImage(getDarkSrc(src));
});

Async function setFaceImage(faceIdx, imgIdx, force = false) {
  If (!force && faceIdx === faceAtStop(currentStop)) return;
  If (!force && faceImgIdx[faceIdx] === imgIdx) return;
  faceImgIdx[faceIdx] = imgIdx;

  const src = getActiveSrc(imgIdx);
  const face = dom.faces[faceIdx];

  await preloadImage(src);

  if (faceImgIdx[faceIdx] !== imgIdx) return;

  let img = face.querySelector(«img»);
  if (!img) {
    img = new Image();
    face.appendChild(img);
  }
  Img.alt = FACE_NAMES[imgIdx] ?? «»;
  Img.src = src;
  Img.style.objectFit = (IMAGE_ASPECTS[imgIdx] ?? 1) !== 1 ? «contain» : «»;
}

Const refreshFaceImages = () => {
  Const snapshot = […faceImgIdx];
  faceImgIdx.fill(-1);
  snapshot.forEach((imgIdx, faceIdx) => {
    if (imgIdx !== -1) setFaceImage(faceIdx, imgIdx, true);
  });
};

For (let i = 0; i < Math.min(N, 6); i++) {
  If (IMAGE_SRCS[i]) setFaceImage(i, i, true);
}

Function checkImageSwaps(smooth) {
  Const base = stopIndex(smooth);
  For (let offset = -SWAP_RADIUS; offset <= SWAP_RADIUS; offset++) {
    If (offset === 0) continue;
    Const si = base + offset;
    If (si < 0  si >= N) continue;
    setFaceImage(faceAtStop(si), si);
  }
}

Let lastFaceIdx = -1;

Const updateUPBAR = (s) => {
  Const p = Math.round(s * 100);
  Const si = sectionIndexFromScroll(scrollY);
  currentStop = si;
  dom.upbarPct.textContent = String(p).padStart(3, «0») + «%»;
  dom.progFill.style.width = `${p}%`;
  if (si !== lastFaceIdx) {
    lastFaceIdx = si;
    const name = FACE_NAMES[si] ?? «»;
    dom.sceneName.textContent = name;
    dom.captionNum.textContent = String(si + 1).padStart(2, «0»);
    dom.captionName.textContent = name;
    sceneDots.forEach((d, i) => d.classList.toggle(«active», i === si));
  }
};

Const easeIO = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 – 2 * t) * t);

Const setCubeTransform = (s) => {
  If (N < 2  STOPS.length < 2) return;
  Const t = s * (N – 1);
  Const i = Math.min(Math.floor(t), N – 2);
  Const f = easeIO(t – i);
  Const a = STOPS[i];
  Const b = STOPS[i + 1];
  Const rx = a.rx + (b.rx – a.rx) * f;
  Const ry = a.ry + (b.ry – a.ry) * f;
  Dom.cube.style.transform = rotateX(${rx}deg) rotateY(${ry}deg);
};

Let sectionTops = [];

Const buildSectionTops = () => {
  sectionTops = sections.map(
    (s) => s.getBoundingClientRect().top + window.scrollY
  );
};

Const sectionIndexFromScroll = (y) => {
  Const mid = y + innerHeight * 0.5;
  Let idx = 0;
  For (let i = 0; i < sectionTops.length; i++) {
    If (mid >= sectionTops[i]) idx = i;
  }
  Return Math.min(idx, N – 1);
};

Const mq = window.matchMedia(«(prefers-color-scheme: dark)»);
Const getSystemTheme = () => (mq.matches ? «dark» : «light»);

Const applyTheme = (theme) => {
  Document.documentElement.setAttribute(«data-theme», theme);
  Document.documentElement.style.colorScheme = theme;
  refreshFaceImages();
};

applyTheme(getSystemTheme());
mq.addEventListener(«change», € => applyTheme(e.matches ? «dark» : «light»));

dom.themeToggle.addEventListener(«click», () => {
  const cur =
    document.documentElement.getAttribute(«data-theme») || getSystemTheme();
  applyTheme(cur === «dark» ? «light» : «dark»);
});

Const mqSmall = window.matchMedia(«(max-width: 56.25em)»);

Let maxScroll = 1;
Let lastScrollHeight = 0;
Let lastInnerHeight = 0;

Const resize = () => {
  Const h = document.documentElement.scrollHeight;
  Const vh = innerHeight;
  If (h === lastScrollHeight && vh === lastInnerHeight) return;
  lastScrollHeight = h;
  lastInnerHeight = vh;
  maxScroll = Math.max(1, h – vh);
  buildSectionTops();
};

Resize();

Let tgt = 0;
Let smooth = 0;
Let velocity = 0;

Const ease = 0.1;
Const dynamicFriction = (v) => (Math.abs(v) > 200 ? 0.8 : 0.9);

Window.addEventListener(«resize», () => {
  Resize();
  Tgt = maxScroll > 0 ? scrollY / maxScroll : 0;
  Smooth = tgt;
});

Let resizePending = false;
Const ro = new ResizeObserver(() => {
  If (resizePending) return;
  resizePending = true;
  requestAnimationFrame(() => {
    resize();
    tgt = maxScroll > 0 ? scrollY / maxScroll : 0;
    smooth = tgt;
    resizePending = false;
  });
});
Ro.observe(document.documentElement);

Window.addEventListener(
  «scroll»,
  () => {
    Tgt = maxScroll > 0 ? scrollY / maxScroll : 0;
    Tgt = Math.max(0, Math.min(1, tgt));
  },
  { passive: true }
);

Window.addEventListener(
  «wheel»,
  € => {
    e.preventDefault();
    const linePx = 16;
    const pagePx = innerHeight * 0.9;
    const delta =
      e.deltaMode === 1
        ? e.deltaY * linePx
        : e.deltaMode === 2
        ? e.deltaY * pagePx
        : e.deltaY;
    If (Math.abs(delta) < 5) return;
    stopAnchorAnim();
    velocity += delta;
    velocity = Math.max(-600, Math.min(600, velocity));
  },
  { passive: false }
);

Const revealEls = [
  …document.querySelectorAll(
    «.tag, h1, h2, .body-text, .button, .button-back»
  )
];

Const io = new IntersectionObserver(
  (entries) =>
    Entries.forEach(€ => {
      If (e.isIntersecting) {
        e.target.classList.add(«visible»);
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.1 }
);
revealEls.forEach((el) => io.observe(el));

let lastNow = performance.now();

const frame = (now) => {
  requestAnimationFrame(frame);

  if (document.hidden) {
    lastNow = now;
    return;
  }

  Const dt = Math.min((now – lastNow) / 1000, 0.05);
  lastNow = now;

  velocity *= Math.pow(dynamicFriction(velocity), dt * 60);
  if (Math.abs(velocity) < 0.01) velocity = 0;

  if (Math.abs(velocity) > 0.2) {
    const next = Math.max(0, Math.min(scrollY + velocity * ease, maxScroll));
    window.scrollTo(0, next);
    tgt = next / maxScroll;
  }

  Smooth += (tgt – smooth) * (1 – Math.exp(-dt * 8));
  Smooth = Math.max(0, Math.min(1, smooth));

  updateUPBAR(smooth);
  checkImageSwaps(smooth);
  setCubeTransform(smooth);
};

requestAnimationFrame(frame);

let anchorAnim = null;
let isAnchorScrolling = false;

const stopAnchorAnim = () => {
  if (anchorAnim) {
    cancelAnimationFrame(anchorAnim);
    anchorAnim = null;
  }
  isAnchorScrolling = false;
};

Const easeInOutCubic = (t) =>
  T < 0.5 ? 4 * t * t * t : 1 – Math.pow(-2 * t + 2, 3) / 2;

Const smoothScrollToY = (targetY, duration = 900) => {
  stopAnchorAnim();
  velocity = 0;
  isAnchorScrolling = true;
  const startY = window.scrollY;
  const diff = targetY – startY;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now – start) / duration);
    const y = startY + diff * easeInOutCubic(p);
    window.scrollTo(0, y);
    tgt = y / maxScroll;
    smooth = tgt;
    if (p < 1) {
      anchorAnim = requestAnimationFrame(tick);
    } else {
      anchorAnim = null;
      isAnchorScrolling = false;
    }
  };
  anchorAnim = requestAnimationFrame(tick);
};

Window.addEventListener(«touchstart», stopAnchorAnim, { passive: true });
Window.addEventListener(«mousedown», stopAnchorAnim, { passive: true });
Window.addEventListener(«keydown», stopAnchorAnim);

Document.addEventListener(«click», € => {
  Const a = e.target.closest('a[href^=»#s»]');
  If (!a) return;
  Const target = document.querySelector(a.getAttribute(«href»));
  If (!target) return;
  e.preventDefault();
  const isHero = a.getAttribute(«href») === «#s0»;
  const idx = sections.indexOf(target);
  const baseY =
    idx >= 0
      ? sectionTops[idx]
      : target.getBoundingClientRect().top + window.scrollY;
  Const extraOffset =
    mqSmall.matches && !isHero
      ? Math.max(0, target.offsetHeight – innerHeight)
      : 0;
  smoothScrollToY(Math.max(0, baseY + extraOffset));
});
