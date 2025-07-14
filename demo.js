// script.js FINAL

let currentStep = 0;
const steps = document.querySelectorAll(".step");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const downloadBtn = document.getElementById("download-btn");
const shareBtn = document.getElementById("share-btn");
const countdown = document.getElementById("countdown");
const spinner = document.getElementById("spinner");
const notification = document.getElementById("notification");

const photoPreview = document.getElementById("photo-preview");
const framePreview = document.getElementById("frame-preview");
const photoInput = document.getElementById("upload-photo");
const frameInput = document.getElementById("upload-frame");

const canvas = document.getElementById("preview-canvas");
const ctx = canvas.getContext("2d");
const finalCanvas = document.getElementById("preview-canvas-final");
const finalCtx = finalCanvas.getContext("2d");

let photoImage = new Image();
let frameImage = new Image();
let scale = 1;
let position = { x: 0, y: 0 };
let isDragging = false;
let lastTouch = {};
let initialDistance = null;
let isInteracting = false;
let interactionTimeout = null;
let unsavedChanges = false;

function showNotification(message) {
  notification.textContent = message;
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 3000);
}

function updateSteps() {
  steps.forEach((s, i) => s.classList.toggle("active", i === currentStep));
  prevBtn.disabled = currentStep === 0;
  nextBtn.textContent = currentStep === steps.length - 1 ? "Muat Ulang" : "Selanjutnya";
  if (currentStep === 3) {
    finalCanvas.width = 1080;
    finalCanvas.height = 1080;
    const scaleFactor = finalCanvas.width / canvas.width;
    const adjustedScale = scale * scaleFactor;
    const adjustedPosition = {
      x: position.x * scaleFactor,
      y: position.y * scaleFactor
    };
    drawCanvas(finalCtx, finalCanvas, false, false, adjustedScale, adjustedPosition);
  }
}

function drawCanvas(ctxDraw = ctx, canvasRef = canvas, transparent = isInteracting, showWatermark = false, scaleOverride = null, positionOverride = null) {
  ctxDraw.clearRect(0, 0, canvasRef.width, canvasRef.height);
  if (photoImage.src) {
    const useScale = scaleOverride ?? scale;
    const usePosition = positionOverride ?? position;
    const drawWidth = photoImage.width * useScale;
    const drawHeight = photoImage.height * useScale;
    const offsetX = (canvasRef.width - drawWidth) / 2 + usePosition.x;
    const offsetY = (canvasRef.height - drawHeight) / 2 + usePosition.y;
    ctxDraw.drawImage(photoImage, offsetX, offsetY, drawWidth, drawHeight);
  }
  if (frameImage.src) {
    ctxDraw.globalAlpha = transparent ? 0.5 : 1.0;
    ctxDraw.drawImage(frameImage, 0, 0, canvasRef.width, canvasRef.height);
    ctxDraw.globalAlpha = 1.0;
  }
  if (showWatermark) {
    ctxDraw.fillStyle = "white";
    ctxDraw.font = `${Math.floor(canvasRef.width * 0.035)}px sans-serif`;
    ctxDraw.textAlign = "right";
    ctxDraw.textBaseline = "bottom";
    ctxDraw.fillText("#XTCODES", canvasRef.width - 20, canvasRef.height - 20);
  }
}

function renderFinalCanvas(withWatermark = false) {
  const scaleFactor = finalCanvas.width / canvas.width;
  const adjustedScale = scale * scaleFactor;
  const adjustedPosition = {
    x: position.x * scaleFactor,
    y: position.y * scaleFactor
  };
  drawCanvas(finalCtx, finalCanvas, false, withWatermark, adjustedScale, adjustedPosition);
}

function renderHDFinalCanvas(callback) {
  const hdCanvas = document.createElement("canvas");
  hdCanvas.width = 1080;
  hdCanvas.height = 1080;
  const hdCtx = hdCanvas.getContext("2d");
  const scaleFactor = hdCanvas.width / canvas.width;
  const adjustedScale = scale * scaleFactor;
  const adjustedPosition = {
    x: position.x * scaleFactor,
    y: position.y * scaleFactor
  };
  drawCanvas(hdCtx, hdCanvas, false, true, adjustedScale, adjustedPosition);
  callback(hdCanvas);
}

// Event handler untuk tombol unduh
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    spinner.style.display = "block";
    countdown.style.display = "block";
    let timeLeft = 15;
    countdown.textContent = `Mohon tunggu ${timeLeft} detik...`;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      countdown.textContent = `Mohon tunggu ${timeLeft} detik...`;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        spinner.style.display = "none";
        countdown.style.display = "none";

        renderHDFinalCanvas((hdCanvas) => {
          const link = document.createElement("a");
          link.download = "twibbon-hd.png";
          link.href = hdCanvas.toDataURL();
          link.click();

          downloadBtn.style.display = "none";
          shareBtn.style.display = "inline-block";
          unsavedChanges = false;
        });
      }
    }, 1000);
  });
}

// Event handler untuk tombol bagikan
if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    renderHDFinalCanvas(async (hdCanvas) => {
      hdCanvas.toBlob(async (blob) => {
        const file = new File([blob], "twibbon.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Bagikan Twibbon",
            text: "Lihat hasil twibbon saya!",
            files: [file]
          });
          unsavedChanges = false;
        } else {
          showNotification("Perangkat tidak mendukung Web Share API dengan file.");
        }
      });
    });
  });
}

// Pastikan render sesuai langkah
updateSteps();
