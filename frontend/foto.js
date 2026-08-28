const video = document.getElementById('camera');
const canvas = document.getElementById('snapshot');
const ctx = canvas.getContext('2d');
let cameraStream = null;

function setCameraIndicator(text, active = false) {
  const indicator = document.getElementById('camera-status');
  if (!indicator) return;
  indicator.classList.toggle('is-active', active);
  indicator.lastChild.textContent = text;
}

function setPhotoStatus(message) {
  const status = document.getElementById('foto-status');
  if (status) status.textContent = message;
}

function stopCamera() {
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  video.srcObject = null;
  setCameraIndicator('Câmera pausada');
}

async function initCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setPhotoStatus('A câmera não está disponível neste navegador. Selecione uma foto do dispositivo abaixo.');
    setCameraIndicator('Câmera indisponível');
    return;
  }

  stopCamera();
  setPhotoStatus('Solicitando acesso à câmera...');
  setCameraIndicator('Solicitando acesso');
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
  } catch (error) {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch (fallbackError) {
      console.error(fallbackError);
      setPhotoStatus('Não foi possível acessar a câmera. Verifique a permissão do navegador ou selecione uma foto abaixo.');
      setCameraIndicator('Câmera indisponível');
      return;
    }
  }

  video.srcObject = cameraStream;
  await video.play();
  setPhotoStatus('Câmera pronta. Posicione a redação e tire a foto.');
  setCameraIndicator('Câmera ativa', true);
}

function takePhoto() {
  if (!cameraStream || !video.videoWidth || !video.videoHeight) {
    setPhotoStatus('Aguarde a camera carregar antes de tirar a foto.');
    return;
  }

  const limit = 1280;
  const scale = Math.min(1, limit / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.style.display = 'block';
  video.style.display = 'none';
  setPhotoStatus('Foto pronta para envio.');
  setCameraIndicator('Foto capturada');
}

function resetPhoto() {
  canvas.style.display = 'none';
  video.style.display = 'block';
  if (!cameraStream) initCamera();
  else setPhotoStatus('Câmera pronta. Tire outra foto quando desejar.');
}

function loadPhoto(file) {
  if (!file) return;
  if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
    setPhotoStatus('Escolha uma imagem PNG, JPG ou WEBP.');
    return;
  }
  const image = new Image();
  const reader = new FileReader();
  reader.onload = () => {
    image.onload = () => {
      const limit = 1280;
      const scale = Math.min(1, limit / Math.max(image.width, image.height));
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.style.display = 'block';
      video.style.display = 'none';
      stopCamera();
      setPhotoStatus('Foto selecionada e pronta para envio.');
      setCameraIndicator('Foto selecionada');
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

async function salvarFoto() {
  if (canvas.style.display !== 'block') {
    setPhotoStatus('Tire uma foto antes de enviar.');
    return;
  }

  const button = document.getElementById('salvar-foto');
  const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
  button.disabled = true;
  button.textContent = 'Enviando para correcao...';
  setPhotoStatus('A foto esta sendo salva e corrigida. Aguarde...');

  try {
    if (!window.supabaseClient) throw new Error('O servico de autenticacao ainda esta carregando.');
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return;
    }

    const response = await fetch('/api/corrigir-foto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ imagem: dataUrl })
    });
    const body = await response.text();
    let data;
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      throw new Error('O servidor esta indisponivel no momento. Tente novamente em instantes.');
    }
    if (!response.ok || !data.resultado) throw new Error(data.erro || 'Nao foi possivel corrigir a foto.');

    localStorage.setItem('resultado', data.resultado);
    stopCamera();
    window.location.href = 'resultado.html';
  } catch (error) {
    console.error(error);
    setPhotoStatus(error.message || 'Nao foi possivel enviar a foto. Tente novamente.');
    button.disabled = false;
    button.textContent = 'Enviar e corrigir';
  }
}

window.addEventListener('pagehide', stopCamera);
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('foto-arquivo')?.addEventListener('change', (event) => loadPhoto(event.target.files?.[0]));
  initCamera();
});
