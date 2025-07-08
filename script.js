const photoInput = document.getElementById('upload-photo');
const frameInput = document.getElementById('upload-frame');
const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download-btn');

let photoImage = new Image();
let frameImage = new Image();

photoInput.addEventListener('change', function() {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      photoImage.onload = drawCanvas;
      photoImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

frameInput.addEventListener('change', function() {
  const file = this.files[0];
  if (file && file.type === 'image/png') {
    const reader = new FileReader();
    reader.onload = function(e) {
      frameImage.onload = drawCanvas;
      frameImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (photoImage.src) {
    ctx.drawImage(photoImage, 0, 0, canvas.width, canvas.height);
  }

  if (frameImage.src) {
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  }
}

downloadBtn.addEventListener('click', function() {
  const link = document.createElement('a');
  link.download = 'twibbon.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
