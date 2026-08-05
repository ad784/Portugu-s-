const video = document.getElementById('camera');
const canvas = document.getElementById('snapshot');
const ctx = canvas.getContext('2d');
let cameraStream = null;

function setPhotoStatus(message) {
  const status = document.getElementById('foto-status');
  if (status) status.textContent = message;
}

function stopCamera() {
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  video.srcObject = null;
}

async function initCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setPhotoStatus('Esta pagina precisa ser aberta por HTTPS para usar a camera.');
    return;
  }

  stopCamera();
  setPhotoStatus('Solicitando acesso a camera...');
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
      setPhotoStatus('Nao foi possivel acessar a camera. Verifique as permissoes do navegador.');
      return;
    }
  }

  video.srcObject = cameraStream;
  await video.play();
  setPhotoStatus('Camera pronta. Posicione a redacao e tire a foto.');
}

function takePhoto() {
  if (!cameraStream || !video.videoWidth || !video.videoHeight) {
    setPhotoStatus('Aguarde a camera carregar antes de tirar a foto.');
    return;
  }

  const limit = 1600;
  const scale = Math.min(1, limit / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.style.display = 'block';
  video.style.display = 'none';
  setPhotoStatus('Foto pronta para envio.');
}

function resetPhoto() {
  canvas.style.display = 'none';
  video.style.display = 'block';
  if (!cameraStream) initCamera();
  else setPhotoStatus('Camera pronta. Tire outra foto quando desejar.');
}

async function salvarFoto() {
  if (canvas.style.display !== 'block') {
    setPhotoStatus('Tire uma foto antes de enviar.');
    return;
  }

  const button = document.getElementById('salvar-foto');
  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
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
    const data = await response.json();
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
window.addEventListener('DOMContentLoaded', initCamera);
