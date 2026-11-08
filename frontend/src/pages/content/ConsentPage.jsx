import { useEffect, useState } from 'react';
import PageFrame from '../PageFrame.jsx';
import legal from '../../../../shared/legal.json';
export default function ConsentPage() {
  const [documents, setDocuments] = useState(legal);
  const [terms, setTerms] = useState(false), [ai, setAi] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [ready, setReady] = useState(false);
  useEffect(() => {
    import('../../../scripts/supabase.js').then(async module => {
      await module.ready;
      if (!window.portuguesSession.userId()) return window.location.replace('/');
      const response = await window.portuguesSession.request('/api/termos');
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Não foi possível consultar seu aceite.');
      setDocuments({ termsVersion: data.termsVersion, privacyVersion: data.privacyVersion });
      if (data.accepted) {
        const destination = new URLSearchParams(window.location.search).get('retorno');
        window.location.replace(destination === 'foto' ? '/foto' : '/nova');
        return;
      }
      setReady(true);
    }).catch(error => setMessage(error.message || 'Não foi possível carregar sua sessão. Atualize a página.'));
  }, []);
  async function accept(event) {
    if (busy) { event.preventDefault(); return; }
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await window.portuguesSession.request('/api/termos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...documents, acceptTerms: terms, aiConsent: ai }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro);
      const destination = new URLSearchParams(window.location.search).get('retorno');
      window.location.replace(destination === 'foto' ? '/foto' : '/nova');
    } catch (error) { setMessage(error.message || 'Não foi possível registrar o aceite.'); }
    finally { setBusy(false); }
  }
  return <PageFrame name="aceite" title="Seu aceite | Português+" bodyClass="policy-page consent-page">
    <header className="site-header"><a className="brand" href="/">Português+</a><nav className="site-nav"><a href="/perfil">Meu perfil</a></nav></header>
    <main className="policy-main consent-main"><span className="eyebrow">SUA CONTA, SEUS DADOS</span><h1>Vamos confirmar seu aceite</h1><p>Esta etapa aparece quando sua conta ainda não possui um aceite válido. Quem já aceitou no cadastro segue direto para a plataforma.</p>
      <form className="consent-card" onSubmit={accept} aria-label="Aceite dos termos e autorização de IA">
        <h2>Confira antes de continuar</h2><p>Usamos a Groq para gerar o feedback por IA. Quando a leitura pelo Google Cloud Vision estiver ativada, a foto é enviada ao Google para extrair a escrita e o texto lido segue para a Groq. Você pode revogar essa autorização no perfil. Sem ela, o histórico e seus dados continuam acessíveis, mas novas correções ficam bloqueadas.</p>
        <label className="consent-field"><input type="checkbox" required checked={terms} onChange={event => setTerms(event.target.checked)} /><span>Li e aceito os <a href="/termos" target="_blank" rel="noopener noreferrer">Termos de uso</a> e li a <a href="/privacidade" target="_blank" rel="noopener noreferrer">Política de privacidade</a>.</span></label>
        <label className="consent-field"><input type="checkbox" required checked={ai} onChange={event => setAi(event.target.checked)} /><span>Autorizo o processamento das redações pela Groq e das fotos pelo serviço de leitura configurado (Groq ou Google Cloud Vision), conforme a Política de privacidade. Posso revogar esta autorização no perfil.</span></label>
        <p role="status" aria-live="polite" className="form-message">{message}</p>
        <button className="primary-action" disabled={!ready || busy || !terms || !ai}>{busy ? 'Registrando...' : 'Aceitar e continuar'}</button>
      </form><p className="consent-alternative"><a href="/perfil">Agora não: acessar meu perfil e meus dados</a></p>
    </main>
  </PageFrame>;
}
