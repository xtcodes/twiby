const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const twibbonInput = document.getElementById('twibbonInput');
const twibbonInputBtn = document.getElementById('twibbonInputBtn');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const resetBtn = document.getElementById('resetBtn');
const manualDownload = document.getElementById('manualDownload');
const downloadNote = document.getElementById('downloadNote');
const processingOverlay = document.getElementById('processingOverlay');
const countdownEl = document.getElementById('countdown');
const spinner = document.getElementById('spinner');

let userImage = null;
let twibbonImage = null;
let placeholderImage = new Image();
placeholderImage.src = 'placeholder.png'; // Pastikan ada file ini

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let lastTouchDistance = null;
let isDragging = false;
let dragStart = { x: 0, y: 0 };

function drawCanvas(isInteracting = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (userImage) {
    const drawWidth = userImage.width * scale;
    const drawHeight = userImage.height * scale;
    ctx.drawImage(userImage, offsetX, offsetY, drawWidth, drawHeight);
  } else {
    ctx.drawImage(placeholderImage, 0, 0, canvas.width, canvas.height);
  }

  if (twibbonImage && userImage) {
    ctx.globalAlpha = isInteracting ? 0.5 : 1;
    ctx.drawImage(twibbonImage, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
  }
}

function drawFinalCanvas(includeWatermark = false) {
  const offscreen = document.createElement('canvas');
  offscreen.width = canvas.width;
  offscreen.height = canvas.height;
  const offCtx = offscreen.getContext('2d');

  if (userImage) {
    const drawWidth = userImage.width * scale;
    const drawHeight = userImage.height * scale;
    offCtx.drawImage(userImage, offsetX, offsetY, drawWidth, drawHeight);
  }

  if (twibbonImage && userImage) {
    offCtx.drawImage(twibbonImage, 0, 0, canvas.width, canvas.height);
  }

  if (includeWatermark) {
    offCtx.font = '16px sans-serif';
    offCtx.fillStyle = 'white';
    offCtx.textAlign = 'right';
    offCtx.fillText('© TwibbonKu', canvas.width - 10, canvas.height - 10);
  }

  return offscreen;
}

imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const img = new Image();
    img.onload = () => {
      userImage = img;
      scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      offsetX = (canvas.width - img.width * scale) / 2;
      offsetY = (canvas.height - img.height * scale) / 2;
      drawCanvas();
      twibbonInputBtn.style.display = 'inline-block';
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

twibbonInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    // Validasi transparansi
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
    let hasTransparency = false;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 255) {
        hasTransparency = true;
        break;
      }
    }
    if (!hasTransparency) {
      alert("Twibbon harus memiliki ruang transparan!");
      return;
    }

    twibbonImage = img;
    drawCanvas();
  };
  const reader = new FileReader();
  reader.onload = evt => {
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

downloadBtn.addEventListener('click', () => {
  processingOverlay.style.display = 'flex';
  spinner.style.display = 'block';
  let count = 15;
  countdownEl.textContent = count;
  const countdown = setInterval(() => {
    count--;
    countdownEl.textContent = count;
    if (count <= 0) {
      clearInterval(countdown);
      spinner.style.display = 'none';
      processingOverlay.style.display = 'none';

      const finalCanvas = drawFinalCanvas(true);
      const dataURL = finalCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'twibbon.png';
      link.href = dataURL;
      link.click();

      manualDownload.href = dataURL;
      downloadNote.style.display = 'block';
      shareBtn.style.display = 'inline-block';
      resetBtn.style.display = 'inline-block';
      downloadBtn.style.display = 'none';
      twibbonInputBtn.style.display = 'none';
    }
  }, 1000);
});

shareBtn.addEventListener('click', async () => {
  try {
    const finalCanvas = drawFinalCanvas(true);
    const blob = await new Promise(resolve =>
      finalCanvas.toBlob(resolve, 'image/png')
    );
    const file = new File([blob], 'twibbon.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Twibbon Saya',
        text: 'Lihat hasil Twibbon saya!',
      });
    } else {
      alert('Perangkat ini tidak mendukung fitur bagikan file. Silakan unduh manual.');
    }
  } catch (error) {
    console.error('Gagal membagikan:', error);
    alert('Terjadi kesalahan saat membagikan gambar.');
  }
});

resetBtn.addEventListener('click', () => {
  location.reload();
});

// Gesture Zoom & Drag
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    isDragging = true;
    dragStart.x = e.touches[0].clientX;
    dragStart.y = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastTouchDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    dragStart.x = e.touches[0].clientX;
    dragStart.y = e.touches[0].clientY;
    offsetX += dx;
    offsetY += dy;
    drawCanvas(true);
  } else if (e.touches.length === 2) {
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const zoom = currentDistance / lastTouchDistance;
    scale *= zoom;
    lastTouchDistance = currentDistance;
    drawCanvas(true);
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  isDragging = false;
  drawCanvas(false);
});

drawCanvas();
