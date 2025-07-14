// Versi lengkap script.js

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

prevBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    updateSteps();
  }
});

nextBtn.addEventListener("click", () => {
  if (nextBtn.textContent === "Muat Ulang") return location.reload();
  if (currentStep === 0 && !photoImage.src) return showNotification("Unggah foto terlebih dahulu!");
  if (currentStep === 1 && !frameImage.src) return showNotification("Unggah twibbon terlebih dahulu!");
  if (currentStep < steps.length - 1) {
    currentStep++;
    updateSteps();
  }
});

document.getElementById("drop-photo").addEventListener("click", () => photoInput.click());
photoInput.addEventListener("change", e => delayedLoadImage(e.target.files[0], photoImage, photoPreview));
document.getElementById("drop-photo").addEventListener("drop", e => {
  e.preventDefault();
  delayedLoadImage(e.dataTransfer.files[0], photoImage, photoPreview);
});
document.getElementById("drop-photo").addEventListener("dragover", e => e.preventDefault());

document.getElementById("drop-frame").addEventListener("click", () => frameInput.click());
frameInput.addEventListener("change", e => delayedLoadImage(e.target.files[0], frameImage, framePreview, true));
document.getElementById("drop-frame").addEventListener("drop", e => {
  e.preventDefault();
  delayedLoadImage(e.dataTransfer.files[0], frameImage, framePreview, true);
});
document.getElementById("drop-frame").addEventListener("dragover", e => e.preventDefault());

function delayedLoadImage(file, imageEl, previewEl, checkTransparency = false) {
  spinner.style.display = "block";
  setTimeout(() => {
    loadImage(file, imageEl, previewEl, checkTransparency);
    spinner.style.display = "none";
  }, 3000);
}

function loadImage(file, imageEl, previewEl, checkTransparency = false) {
  const reader = new FileReader();
  reader.onload = () => {
    imageEl.onload = () => {
      if (checkTransparency && !hasTransparency(imageEl)) {
        showNotification("Twibbon harus berupa file PNG dengan latar belakang transparan!");
        frameInput.value = "";
        framePreview.style.display = "none";
        frameImage.src = "";
        return;
      }
      previewEl.src = reader.result;
      unsavedChanges = true;
      previewEl.style.display = "block";
      drawCanvas();
    };
    imageEl.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function hasTransparency(img) {
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  tempCtx.drawImage(img, 0, 0);
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  for (let i = 3; i < imageData.data.length; i += 4) {
    if (imageData.data[i] < 255) return true;
  }
  return false;
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

function getTouchPos(touch) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
}

function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function startInteraction() {
  isInteracting = true;
  drawCanvas();
  clearTimeout(interactionTimeout);
}

function endInteraction() {
  clearTimeout(interactionTimeout);
  interactionTimeout = setTimeout(() => {
    isInteracting = false;
    drawCanvas();
  }, 300);
}

canvas.addEventListener("mousedown", e => {
  isDragging = true;
  lastTouch = { x: e.offsetX, y: e.offsetY };
  startInteraction();
});
canvas.addEventListener("mousemove", e => {
  if (isDragging) {
    const dx = e.offsetX - lastTouch.x;
    const dy = e.offsetY - lastTouch.y;
    position.x += dx;
    position.y += dy;
    lastTouch = { x: e.offsetX, y: e.offsetY };
    drawCanvas();
  }
});
canvas.addEventListener("mouseup", () => { isDragging = false; endInteraction(); });
canvas.addEventListener("mouseleave", () => { isDragging = false; endInteraction(); });

canvas.addEventListener("wheel", e => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.05 : -0.05;
  scale = Math.max(0.1, Math.min(5, scale + delta));
  startInteraction();
  drawCanvas();
  endInteraction();
});

canvas.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    isDragging = true;
    lastTouch = getTouchPos(e.touches[0]);
  } else if (e.touches.length === 2) {
    initialDistance = getDistance(e.touches);
  }
  startInteraction();
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    const touch = getTouchPos(e.touches[0]);
    const dx = touch.x - lastTouch.x;
    const dy = touch.y - lastTouch.y;
    position.x += dx;
    position.y += dy;
    lastTouch = touch;
    drawCanvas();
  } else if (e.touches.length === 2 && initialDistance !== null) {
    const newDistance = getDistance(e.touches);
    const zoom = newDistance / initialDistance;
    scale = Math.max(0.1, Math.min(5, scale * zoom));
    initialDistance = newDistance;
    drawCanvas();
  }
}, { passive: false });

canvas.addEventListener("touchend", () => {
  isDragging = false;
  initialDistance = null;
  endInteraction();
});

updateSteps();
