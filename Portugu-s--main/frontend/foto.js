const video = document.getElementById('camera');
const canvas = document.getElementById('snapshot');
const ctx = canvas.getContext('2d');

async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
  } catch (err) {
    alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    console.error(err);
  }
}

function takePhoto() {
  if (!video.srcObject) {
    alert('Câmera não iniciada. Atualize a página e tente novamente.');
    return;
  }

  const limite = 1600;
  const escala = Math.min(1, limite / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * escala);
  canvas.height = Math.round(video.videoHeight * escala);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.style.display = 'block';
  video.style.display = 'none';
}

function resetPhoto() {
  canvas.style.display = 'none';
  video.style.display = 'block';
}

async function salvarFoto() {
  if (canvas.style.display !== 'block') {
    alert('Tire uma foto antes de salvar.');
    return;
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  localStorage.setItem('redacaoFoto', dataUrl);

  const botao = document.getElementById('salvar-foto');
  const status = document.getElementById('foto-status');
  botao.disabled = true;
  botao.textContent = 'Enviando para correcao...';
  status.textContent = 'A foto esta sendo lida e corrigida. Aguarde...';

  try {
    const resposta = await fetch('http://localhost:3000/corrigir-foto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagem: dataUrl })
    });
    const dados = await resposta.json();
    if (!resposta.ok || !dados.resultado) {
      throw new Error(dados.erro || 'Nao foi possivel corrigir a foto.');
    }

    localStorage.setItem('resultado', dados.resultado);
    window.location.href = 'resultado.html';
    return;
  } catch (erro) {
    console.error(erro);
    alert(erro.message || 'Erro ao enviar a foto para correcao.');
    botao.disabled = false;
    botao.textContent = 'Salvar e Corrigir Foto';
    status.textContent = 'Nao foi possivel enviar. Verifique a conexao e tente novamente.';
    return;
  }
  alert('Foto salva localmente. Você pode voltar para a redação ou enviar manualmente.');
}

window.onload = initCamera;
