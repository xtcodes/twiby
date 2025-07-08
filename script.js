// ==== Navigasi Step ====
const steps = document.querySelectorAll('.step');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
let currentStep = 0;

function showStep(index) {
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === index);
  });

  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === steps.length - 1 ? 'Selesai' : 'Selanjutnya';

  // ✅ Gambar ulang canvas saat masuk ke langkah ke-4
  if (index === 3) {
    drawCanvas();
  }
}

prevBtn.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
});

nextBtn.addEventListener('click', () => {
  if (currentStep < steps.length - 1) {
    currentStep++;
    showStep(currentStep);
  } else {
    alert('Twibbon selesai dibuat!');
  }
});

showStep(currentStep);

// ==== Upload & Pratinjau ====
const photoInput = document.getElementById('upload-photo');
const frameInput = document.getElementById('upload-frame');
const photoPreview = document.getElementById('photo-preview');
const framePreview = document.getElementById('frame-preview');

const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download-btn');

let photoImage = new Image();
let frameImage = new Image();

// ==== Transformasi Interaktif ====
let scale = 1;
let pos = { x: 0, y: 0 };
let isDragging = false;
let last = { x: 0, y: 0 };

// Mouse Events (Desktop)
canvas.addEventListener('mousedown', e => {
  isDragging = true;
  last = { x: e.offsetX, y: e.offsetY };
});

canvas.addEventListener('mousemove', e => {
  if (isDragging) {
    const dx = e.offsetX - last.x;
    const dy = e.offsetY - last.y;
    pos.x += dx;
    pos.y += dy;
    last = { x: e.offsetX, y: e.offsetY };
    drawCanvas();
  }
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

// Zoom scroll (desktop)
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.05 : 0.05;
  scale = Math.max(0.1, scale + delta);
  drawCanvas();
});

// Touch Events (Mobile)
let initialDistance = null;

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    initialDistance = getDistance(e.touches[0], e.touches[1]);
  } else if (e.touches.length === 1) {
    isDragging = true;
    last = getTouchPos(canvas, e.touches[0]);
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 2 && initialDistance !== null) {
    const newDistance = getDistance(e.touches[0], e.touches[1]);
    const scaleChange = (newDistance - initialDistance) / 200;
    scale = Math.max(0.1, scale + scaleChange);
    initialDistance = newDistance;
    drawCanvas();
  } else if (e.touches.length === 1 && isDragging) {
    const touchPos = getTouchPos(canvas, e.touches[0]);
    const dx = touchPos.x - last.x;
    const dy = touchPos.y - last.y;
    pos.x += dx;
    pos.y += dy;
    last = touchPos;
    drawCanvas();
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  initialDistance = null;
  isDragging = false;
});

function getDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchPos(canvas, touch) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
}

// ==== Upload Foto ====
photoInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      photoPreview.src = e.target.result;
      photoPreview.style.display = 'block';

      photoImage.onload = () => {
        scale = 1;
        pos = { x: 0, y: 0 };
        drawCanvas();
      };
      photoImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// ==== Upload Twibbon ====
frameInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file && file.type === 'image/png') {
    const reader = new FileReader();
    reader.onload = function (e) {
      framePreview.src = e.target.result;
      framePreview.style.display = 'block';

      frameImage.onload = drawCanvas;
      frameImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// ==== Menggambar ke Canvas ====
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (photoImage.src && photoImage.complete && photoImage.naturalWidth > 0) {
    const w = canvas.width * scale;
    const h = canvas.height * scale;
    const x = (canvas.width - w) / 2 + pos.x;
    const y = (canvas.height - h) / 2 + pos.y;
    ctx.drawImage(photoImage, x, y, w, h);
  }

  if (frameImage.src && frameImage.complete && frameImage.naturalWidth > 0) {
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  }

  // Debug log
  // console.log("Canvas redrawn", { scale, pos });
}

// ==== Unduh Gambar ====
downloadBtn.addEventListener('click', function () {
  drawCanvas(); // Pastikan canvas terakhir digambar ulang
  const link = document.createElement('a');
  link.download = 'twibbon.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
