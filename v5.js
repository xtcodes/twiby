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
let twibbonReady = false;
let isDragging = false;
let lastTouchDist = null;
let offsetX = 0;
let offsetY = 0;
let scale = 1;
let startX, startY;

const placeholderImage = new Image();
placeholderImage.src = 'https://picsum.photos/1000';

const defaultTwibbon = new Image();
defaultTwibbon.src = 'twibbon.png';
defaultTwibbon.onload = () => {
  validateTransparency(defaultTwibbon, () => {
    twibbonImage = defaultTwibbon;
    drawCanvas();
  });
};

function drawCanvas(isInteracting = false, withWatermark = false) {
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

  if (withWatermark && userImage) {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText('© TwibbonKu', canvas.width - 10, canvas.height - 10);
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
        validateTransparency(img, () => {
          twibbonImage = img;
          drawCanvas();
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  input.click();
});

function showNotification(message, duration = 3000) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, duration);
}


function validateTransparency(image, onValid) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = image.width;
  tempCanvas.height = image.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(image, 0, 0);
  const imageData = tempCtx.getImageData(0, 0, image.width, image.height).data;

  let hasTransparent = false;
  for (let i = 3; i < imageData.length; i += 4) {
    if (imageData[i] < 255) {
      hasTransparent = true;
      break;
    }
  }

  if (!hasTransparent) {
  //  alert("Twibbon harus memiliki latar transparan (format PNG dengan transparansi).");
    showNotification('Twibbon harus memiliki latar transparan.');
    return;
  }

  onValid();
}

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

      drawCanvas(false, true);
      const dataURL = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.download = 'twibbon.png';
      link.href = dataURL;
      link.click();

      drawCanvas(false, false); // bersihkan watermark dari canvas utama

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
    // Buat canvas offscreen untuk menggambar versi dengan watermark
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    // Gambar gambar pengguna
    if (userImage) {
      const drawWidth = userImage.width * scale;
      const drawHeight = userImage.height * scale;
      exportCtx.drawImage(userImage, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Gambar twibbon
    if (twibbonImage && userImage) {
      exportCtx.drawImage(twibbonImage, 0, 0, canvas.width, canvas.height);
    }

    // Tambahkan watermark
    if (userImage) {
      exportCtx.font = '16px sans-serif';
      exportCtx.fillStyle = 'white';
      exportCtx.textAlign = 'right';
      exportCtx.fillText('© TwibbonKu', canvas.width - 10, canvas.height - 10);
    }

    const blob = await new Promise((resolve) =>
      exportCanvas.toBlob(resolve, 'image/png')
    );

    const file = new File([blob], 'twibbon.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Twibbon Saya',
        text: 'Lihat hasil Twibbon saya!',
      });
    } else {
     //  alert('Perangkat ini tidak mendukung fitur bagikan file. Silakan unduh manual.');
      showNotification('Perangkat ini tidak mendukung fitur bagikan file. Silakan unduh manual.');

    }
  } catch (error) {
    console.error('Gagal membagikan:', error);
  //  alert('Terjadi kesalahan saat membagikan gambar.');
    showNotification('Terjadi kesalahan saat membagikan gambar.');
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
