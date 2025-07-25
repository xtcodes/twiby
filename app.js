const canvas = document.getElementById('twibbonCanvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const resetBtn = document.getElementById('resetBtn');
const twibbonInputBtn = document.getElementById('twibbonInputBtn');
const processingOverlay = document.getElementById('processingOverlay');
const spinner = document.getElementById('spinner');
const countdownEl = document.getElementById('countdown');
const manualDownload = document.getElementById('manualDownload');
const downloadNote = document.getElementById('downloadNote');
const buttonText = document.getElementById('buttonText');
const actions = document.getElementById('actions');

let userImage = null;
let twibbonImage = null;
let isDragging = false;
let lastTouchDist = null;
let offsetX = 0;
let offsetY = 0;
let scale = 1;
let startX, startY;

const placeholderImage = new Image();
placeholderImage.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="%23ccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%23666">Belum ada gambar</text></svg>';

const defaultTwibbon = new Image();
defaultTwibbon.src = 'twibbon.png';
defaultTwibbon.onload = () => {
  twibbonImage = defaultTwibbon;
  drawCanvas();
};

function drawCanvas(isInteracting = false, includeWatermark = false) {
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

  if (includeWatermark && userImage) {
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('twibbon.app', canvas.width - 10, canvas.height - 10);
  }
}

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    startX = e.touches[0].clientX - offsetX;
    startY = e.touches[0].clientY - offsetY;
  } else if (e.touches.length === 2) {
    lastTouchDist = getTouchDistance(e.touches);
  }
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    offsetX = e.touches[0].clientX - startX;
    offsetY = e.touches[0].clientY - startY;
    drawCanvas(true);
  } else if (e.touches.length === 2) {
    const dist = getTouchDistance(e.touches);
    if (lastTouchDist) {
      const zoom = dist / lastTouchDist;
      scale *= zoom;
      lastTouchDist = dist;
      drawCanvas(true);
    }
  }
});

canvas.addEventListener('touchend', () => {
  isDragging = false;
  lastTouchDist = null;
  drawCanvas();
});

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      userImage = img;
      offsetX = 0;
      offsetY = 0;
      scale = 1;
      drawCanvas();
      actions.style.display = 'flex';
      downloadBtn.style.display = 'inline-block';
      twibbonInputBtn.style.display = 'inline-block';
      imageInput.style.display = 'none';
      buttonText.style.display = 'none';
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

twibbonInputBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png';
  input.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        // Validasi alpha channel (transparansi)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, img.width, img.height).data;
        let hasTransparency = false;
        for (let i = 3; i < imageData.length; i += 4) {
          if (imageData[i] < 255) {
            hasTransparency = true;
            break;
          }
        }
        if (!hasTransparency) {
          alert('Twibbon harus memiliki ruang transparan (.png transparan).');
          return;
        }
        twibbonImage = img;
        drawCanvas();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  input.click();
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

      drawCanvas(false, true); // gambar watermark dulu
      const dataURL = canvas.toDataURL('image/png');
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

      drawCanvas(); // hapus watermark dari canvas tampilan
    }
  }, 1000);
});

resetBtn.addEventListener('click', () => {
  userImage = null;
  offsetX = 0;
  offsetY = 0;
  scale = 1;
  actions.style.display = 'none';
  downloadNote.style.display = 'none';
  shareBtn.style.display = 'none';
  resetBtn.style.display = 'none';
  imageInput.value = '';
  imageInput.style.display = 'block';
  buttonText.style.display = 'block';
  drawCanvas();
});

shareBtn.addEventListener('click', async () => {
  try {
    const backupCanvas = document.createElement('canvas');
    backupCanvas.width = canvas.width;
    backupCanvas.height = canvas.height;
    const backupCtx = backupCanvas.getContext('2d');
    backupCtx.drawImage(canvas, 0, 0);

    drawCanvas(false, true); // gambar watermark

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/png')
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

    // Kembalikan canvas ke kondisi semula (tanpa watermark)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backupCanvas, 0, 0);
  } catch (error) {
    console.error('Gagal membagikan:', error);
    alert('Terjadi kesalahan atau Anda membatalkan proses bagikan.');
    drawCanvas(); // fallback
  }
});

drawCanvas();
