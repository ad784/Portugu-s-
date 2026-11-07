const video = document.getElementById('camera');
const canvas = document.getElementById('snapshot');
const ctx = canvas.getContext('2d');
let cameraStream = null;
let sendingPhoto = false;
let retryTimer;
const PHOTO_DRAFT_KEY = 'rascunho-foto-v1';
let photoSelection = 0;
function preparedPhoto() {
  let image = canvas.toDataURL('image/jpeg', 0.88);
  if (image.length > 4 * 1024 * 1024) image = canvas.toDataURL('image/jpeg', 0.65);
  return image;
}
function preservePhoto() {
  try { window.userStorage.setItem(PHOTO_DRAFT_KEY, preparedPhoto()); }
  catch { setPhotoStatus('A foto continua nesta página, mas não foi possível guardar uma cópia. Não atualize antes de concluir.'); }
}

function updateRetryButton() {
  const button = document.getElementById('salvar-foto');
  const seconds = Math.max(0, Math.ceil((Number(button.dataset.retryUntil || 0) - Date.now()) / 1000));
  button.disabled = sendingPhoto || seconds > 0;
  button.setAttribute('aria-busy', String(sendingPhoto));
  for (const id of ['reset-photo', 'take-photo', 'foto-arquivo', 'foto-tema']) {
    const control = document.getElementById(id); if (control) control.disabled = sendingPhoto;
  }
  button.textContent = sendingPhoto ? 'Enviando para correção...' : seconds > 0
    ? `Aguarde ${seconds >= 3600 ? `${Math.ceil(seconds / 3600)} h` : seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds} s`}`
    : 'Enviar e corrigir';
  clearTimeout(retryTimer);
  if (seconds > 0) retryTimer = setTimeout(updateRetryButton, 1000);
}

// Mantem a orientacao natural da camera. A pre-visualizacao tambem nao e
// espelhada, entao a captura corresponde ao que o estudante esta vendo.
function drawPortraitImage(source, sourceWidth, sourceHeight) {
  const limit = 1600;
  const scale = Math.min(1, limit / Math.max(sourceWidth, sourceHeight));

  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
}

async function sair(event) {
  event?.preventDefault();
  return window.portuguesSession.signOut();
}

window.sair = sair;
document.getElementById('reset-photo')?.addEventListener('click', resetPhoto);
document.getElementById('take-photo')?.addEventListener('click', takePhoto);
document.getElementById('salvar-foto')?.addEventListener('click', salvarFoto);
document.getElementById('back-to-editor')?.addEventListener('click', () => { window.location.href = "/nova"; });

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
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1080 },
        height: { ideal: 1440 },
        aspectRatio: { ideal: 0.75 }
      },
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
  video.style.transform = 'none';
  try {
    await video.play();
  } catch (error) {
    console.error('Não foi possível iniciar a pré-visualização da câmera:', error);
    stopCamera();
    setPhotoStatus('A câmera foi acessada, mas não iniciou a pré-visualização. Tente novamente ou selecione uma foto do dispositivo.');
    setCameraIndicator('Pré-visualização indisponível');
    return;
  }
  setPhotoStatus('Câmera pronta. Posicione a redação e tire a foto.');
  setCameraIndicator('Câmera ativa', true);
}

function takePhoto() {
  if (sendingPhoto) return;
  if (!cameraStream || !video.videoWidth || !video.videoHeight) {
    setPhotoStatus('Aguarde a camera carregar antes de tirar a foto.');
    return;
  }

  drawPortraitImage(video, video.videoWidth, video.videoHeight);
  canvas.style.display = 'block';
  video.style.display = 'none';
  setPhotoStatus('Foto pronta para envio.');
  setCameraIndicator('Foto capturada');
  preservePhoto();
}

function resetPhoto() {
  if (sendingPhoto) return;
  photoSelection++;
  window.userStorage.removeItem(PHOTO_DRAFT_KEY);
  canvas.style.display = 'none';
  video.style.display = 'block';
  if (!cameraStream) initCamera();
  else setPhotoStatus('Câmera pronta. Tire outra foto quando desejar.');
}

function loadPhoto(file) {
  if (sendingPhoto) return;
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) { setPhotoStatus('Selecione uma foto de até 20 MB.'); return; }
  if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
    setPhotoStatus('Escolha uma imagem PNG, JPG ou WEBP.');
    return;
  }
  const image = new Image();
  const reader = new FileReader();
  const selected = ++photoSelection;
  reader.onerror = () => setPhotoStatus('Não foi possível abrir o arquivo. Escolha outra foto. A foto anterior, se houver, continua disponível.');
  image.onerror = () => setPhotoStatus('O arquivo não pôde ser lido como imagem. Escolha outra foto JPG, PNG ou WEBP.');
  reader.onload = () => {
    image.onload = () => {
      if (selected !== photoSelection) return;
      drawPortraitImage(image, image.width, image.height);
      canvas.style.display = 'block';
      video.style.display = 'none';
      stopCamera();
      setPhotoStatus('Foto selecionada e pronta para envio.');
      setCameraIndicator('Foto selecionada');
      preservePhoto();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

async function salvarFoto() {
  if (sendingPhoto) return;
  if (canvas.style.display !== 'block') {
    setPhotoStatus('Tire uma foto antes de enviar.');
    return;
  }

  const button = document.getElementById('salvar-foto');
  // Preserva a nitidez da escrita manuscrita para a leitura pela IA.
  if (Number(button.dataset.retryUntil || 0) > Date.now()) { setPhotoStatus('Aguarde o prazo informado antes de enviar novamente.'); return; }
  const dataUrl = preparedPhoto();
  if (dataUrl.length > 4 * 1024 * 1024) { setPhotoStatus('A imagem ainda está muito grande. Selecione uma foto menor.'); return; }
  const tema = document.getElementById('foto-tema')?.value.trim() || '';
  preservePhoto();
  sendingPhoto = true;
  updateRetryButton();
  setPhotoStatus('Lendo e avaliando a foto. Isso pode levar até um minuto. Sua foto permanece disponível durante a espera.');

  try {
    const response = await window.portuguesSession.request('/api/corrigir-foto', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imagem: dataUrl, tema })
    });
    const body = await response.text();
    let data;
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      throw new Error('O servidor esta indisponivel no momento. Tente novamente em instantes.');
    }
    if (response.status === 429 && data.retryAfterSeconds) button.dataset.retryUntil = String(Date.now() + data.retryAfterSeconds * 1000);
    if (!response.ok || !data.resultado) throw new Error(data.erro || 'Nao foi possivel corrigir a foto.');

    window.userStorage.setItem('resultado', data.resultado);
    if (data.aviso) {
      console.warn('A redação por foto não foi sincronizada com o histórico:', data.aviso);
      if (!data.salvo) window.portuguesSession.savePending({ resultado: data.resultado, hash: data.hash, tema, tipo: 'foto', nota: Number(data.resultado.match(/^Nota: (\d+)/m)?.[1]), conteudo: data.resultado.split(/\nRedacao:\n/i)[1]?.trim() || null });
      window.userStorage.setItem('resultado-aviso', data.aviso);
    } else {
      window.userStorage.removeItem('resultado-aviso');
    }
    stopCamera();
    window.userStorage.removeItem(PHOTO_DRAFT_KEY);
    if (window.portuguesSession.presentResult?.(data.resultado, data.aviso || '')) {
      setPhotoStatus('Avaliação concluída. O resultado está disponível abaixo nesta página.'); return;
    }
    window.location.href = "/resultado";
  } catch (error) {
    console.error(error);
    setPhotoStatus((error.name === 'TimeoutError' || error.name === 'AbortError' ? 'A leitura demorou além do esperado. Tente novamente.' : error.name === 'TypeError' ? 'Não foi possível conectar ao serviço. Confira sua internet.' : error.message || 'Não foi possível enviar a foto.') + ' A foto foi mantida para uma nova tentativa.');
  } finally {
    sendingPhoto = false;
    updateRetryButton();
  }
}

window.addEventListener('pagehide', () => { stopCamera(); clearTimeout(retryTimer); });
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('foto-arquivo')?.addEventListener('change', (event) => loadPhoto(event.target.files?.[0]));
  document.getElementById('foto-tema').value = window.userStorage.getItem('tema-foto') || '';
  document.getElementById('foto-tema')?.addEventListener('input', event => window.userStorage.setItem('tema-foto', event.target.value));
  const saved = window.userStorage.getItem(PHOTO_DRAFT_KEY);
  if (saved) {
    const image = new Image();
    image.onload = () => {
      drawPortraitImage(image, image.width, image.height);
      canvas.style.display = 'block'; video.style.display = 'none';
      setCameraIndicator('Foto recuperada');
      setPhotoStatus('Recuperamos a foto pendente desta conta. Você pode enviá-la ou tirar outra.');
    };
    image.onerror = () => { window.userStorage.removeItem(PHOTO_DRAFT_KEY); initCamera(); };
    image.src = saved;
  } else initCamera();
});
