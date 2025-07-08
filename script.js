// Ambil semua elemen step dan tombol
const steps = document.querySelectorAll('.step');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// State navigasi step
let currentStep = 0;

function showStep(index) {
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === index);
  });

  // Atur tombol
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === steps.length - 1 ? 'Selesai' : 'Selanjutnya';
}

// Tombol navigasi
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

// Tampilkan langkah pertama
showStep(currentStep);

// ====== LOGIKA TWIBBON & PRATINJAU ======

const photoInput = document.getElementById('upload-photo');
const frameInput = document.getElementById('upload-frame');
const photoPreview = document.getElementById('photo-preview');
const framePreview = document.getElementById('frame-preview');

const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download-btn');

let photoImage = new Image();
let frameImage = new Image();

// Step 1: Upload Foto
photoInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      photoPreview.src = e.target.result;
      photoPreview.style.display = 'block';

      photoImage.onload = drawCanvas;
      photoImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Step 2: Upload Twibbon PNG
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

// Step 3: Gabungkan gambar
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (photoImage.src) {
    ctx.drawImage(photoImage, 0, 0, canvas.width, canvas.height);
  }
  if (frameImage.src) {
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  }
}

// Step 4: Unduh hasil
downloadBtn.addEventListener('click', function () {
  const link = document.createElement('a');
  link.download = 'twibbon.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
