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

// Placeholder
const placeholderImage = new Image();
placeholderImage.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="%23ccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%23666">Belum ada gambar</text></svg>';

// Default twibbon
const defaultTwibbon = new Image();
defaultTwibbon.src = 'twibbon.png';
defaultTwibbon.onload = () => {
  twibbonImage = defaultTwibbon;
  drawCanvas();
};

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

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
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
  input.accept = 'image/*';
  input.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, img.width, img.height).data;
        let hasAlpha = false;
        for (let i = 3; i < imageData.length; i += 4) {
          if (imageData[i] < 255) {
            hasAlpha = true;
            break;
          }
        }
        if (!hasAlpha) {
          alert('Twibbon harus memiliki ruang transparan (PNG dengan alpha channel).');
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

      // Tambah watermark
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
      tempCtx.font = 'bold 16px sans-serif';
      tempCtx.fillStyle = 'white';
      tempCtx.textAlign = 'right';
      tempCtx.fillText('TwibbonApp', tempCanvas.width - 10, tempCanvas.height - 10);

      const dataURL = tempCanvas.toDataURL('image/png');
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
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    const drawWidth = userImage.width * scale;
    const drawHeight = userImage.height * scale;

    if (userImage) {
      tempCtx.drawImage(userImage, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      tempCtx.drawImage(placeholderImage, 0, 0, tempCanvas.width, tempCanvas.height);
    }

    if (twibbonImage && userImage) {
      tempCtx.drawImage(twibbonImage, 0, 0, tempCanvas.width, tempCanvas.height);
    }

    // Watermark saat bagikan
    if (userImage) {
      tempCtx.font = 'bold 16px sans-serif';
      tempCtx.fillStyle = 'white';
      tempCtx.textAlign = 'right';
      tempCtx.fillText('#TwibbonApp', tempCanvas.width - 10, tempCanvas.height - 10);
    }

    const blob = await new Promise((resolve) =>
      tempCanvas.toBlob(resolve, 'image/png')
    );
    const file = new File([blob], 'twibbon.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Twibbon Saya',
        text: 'Lihat hasil Twibbon saya!',
      });
    } else {
      alert('Perangkat ini tidak mendukung berbagi file.');
    }
  } catch (error) {
    console.error('Gagal membagikan:', error);
    alert('Terjadi kesalahan saat membagikan.');
  }
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

drawCanvas();
