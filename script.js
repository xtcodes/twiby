const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.style.touchAction = "none";

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const twibbonImg = document.getElementById("twibbon");
const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");
const spinner = document.getElementById("spinner");

let userImg = null;
let imageLoaded = false;
let hideContent = false;

const state = {
  scale: 1,
  x: 0,
  y: 0,
  lastX: 0,
  lastY: 0,
  pointers: [],
  startDist: 0,
  initialScale: 1,
  initialX: 0,
  initialY: 0,
  zoomAnchor: { x: 0, y: 0 }
};

let twibbonOpacity = 1.0;
let targetOpacity = 1.0;
const FADE_SPEED = 0.05;
let hideTimeout = null;

let typingText = "Sedang diproses...";
let typedLength = 0;
let typingSpeed = 150;
let lastTypingTime = 0;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (hideContent) {
    ctx.fillStyle = "#ccc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (Date.now() - lastTypingTime > typingSpeed && typedLength < typingText.length) {
      typedLength++;
      lastTypingTime = Date.now();
    }
    const displayText = typingText.substring(0, typedLength);
    ctx.fillStyle = "#444";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
    return;
  }
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (userImg) {
    const w = userImg.width * state.scale;
    const h = userImg.height * state.scale;
    ctx.drawImage(userImg, state.x, state.y, w, h);
  }
  if (imageLoaded) {
    twibbonOpacity += (targetOpacity - twibbonOpacity) * FADE_SPEED;
  } else {
    twibbonOpacity = 1.0;
  }
  ctx.globalAlpha = twibbonOpacity;
  ctx.drawImage(twibbonImg, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;
}

function animate() {
  draw();
  requestAnimationFrame(animate);
}

function getDistance(p1, p2) {
  const dx = p2.clientX - p1.clientX;
  const dy = p2.clientY - p1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getMidpoint(p1, p2) {
  return {
    x: (p1.clientX + p2.clientX) / 2,
    y: (p1.clientY + p2.clientY) / 2
  };
}

function triggerTwibbonFade() {
  if (!imageLoaded) return;
  targetOpacity = 0.4;
  if (hideTimeout) clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => targetOpacity = 1.0, 300);
}

function loadImageFromFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      userImg = img;
      imageLoaded = true;
      const scaleRatio = canvas.width / img.width;
      state.scale = scaleRatio;
      state.x = (canvas.width - img.width * scaleRatio) / 2;
      state.y = (canvas.height - img.height * scaleRatio) / 2;
      downloadBtn.disabled = false;
      shareBtn.disabled = !navigator.canShare;
      canvas.style.display = "block";
      dropZone.querySelector("p").style.display = "none";
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

fileInput.addEventListener("change", (e) => {
  loadImageFromFile(e.target.files[0]);
});

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  loadImageFromFile(e.dataTransfer.files[0]);
});

canvas.addEventListener("pointerdown", (e) => {
  if (!imageLoaded) return;
  canvas.setPointerCapture(e.pointerId);
  state.pointers.push(e);
  if (state.pointers.length === 1) {
    state.lastX = e.clientX;
    state.lastY = e.clientY;
  } else if (state.pointers.length === 2) {
    state.startDist = getDistance(state.pointers[0], state.pointers[1]);
    state.initialScale = state.scale;
    state.initialX = state.x;
    state.initialY = state.y;
    const midpoint = getMidpoint(state.pointers[0], state.pointers[1]);
    const rect = canvas.getBoundingClientRect();
    state.zoomAnchor = {
      x: (midpoint.x - rect.left - state.x) / state.scale,
      y: (midpoint.y - rect.top - state.y) / state.scale
    };
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!imageLoaded) return;
  for (let i = 0; i < state.pointers.length; i++) {
    if (state.pointers[i].pointerId === e.pointerId) {
      state.pointers[i] = e;
      break;
    }
  }
  if (state.pointers.length === 1) {
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.x += dx;
    state.y += dy;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
  } else if (state.pointers.length === 2) {
    const newDist = getDistance(state.pointers[0], state.pointers[1]);
    const scaleFactor = newDist / state.startDist;
    const newScale = state.initialScale * scaleFactor;
    state.scale = newScale;
    state.x = state.initialX - state.zoomAnchor.x * (newScale - state.initialScale);
    state.y = state.initialY - state.zoomAnchor.y * (newScale - state.initialScale);
  }
  triggerTwibbonFade();
});

canvas.addEventListener("pointerup", (e) => {
  if (!imageLoaded) return;
  state.pointers = state.pointers.filter(p => p.pointerId !== e.pointerId);
});

canvas.addEventListener("pointercancel", (e) => {
  if (!imageLoaded) return;
  state.pointers = state.pointers.filter(p => p.pointerId !== e.pointerId);
});

downloadBtn.addEventListener("click", () => {
  if (!userImg) return alert("Silakan unggah gambar terlebih dahulu.");
  spinner.style.display = "block";
  hideContent = true;
  typedLength = 0;
  lastTypingTime = Date.now();

  setTimeout(() => {
    hideContent = false;
    draw(); // pastikan canvas menggambar ulang sebelum diunduh
    spinner.style.display = "none";
    const link = document.createElement("a");
    link.download = "twibbon.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, 15000);
});

shareBtn.addEventListener("click", async () => {
  if (!userImg) return alert("Silakan unggah gambar terlebih dahulu.");
  canvas.toBlob(async (blob) => {
    const file = new File([blob], "twibbon.png", { type: "image/png" });
    try {
      await navigator.share({
        files: [file],
        title: "Twibbon Saya",
        text: "Lihat twibbon buatan saya!",
      });
    } catch (err) {
      alert("Gagal membagikan: " + err.message);
    }
  });
});

animate();
