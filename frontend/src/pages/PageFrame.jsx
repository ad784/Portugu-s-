import { useEffect, useState } from "react";
import { scriptsByPage } from "../pageScripts.js";

export default function PageFrame({
  name,
  title,
  lang = "pt-BR",
  bodyClass,
  children,
}) {
  const [loadError, setLoadError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    const connection = () => setOffline(navigator.onLine === false);
    const storage = () => setStorageUnavailable(true);
    const expired = () => setSessionExpired(true);
    connection(); setStorageUnavailable(Boolean(window.portuguesStorageUnavailable));
    window.addEventListener('online', connection); window.addEventListener('offline', connection);
    window.addEventListener('portugues:storage-unavailable', storage);
    window.addEventListener('portugues:session-expired', expired);
    return () => { window.removeEventListener('online', connection); window.removeEventListener('offline', connection); window.removeEventListener('portugues:storage-unavailable', storage); window.removeEventListener('portugues:session-expired', expired); };
  }, []);
  useEffect(() => {
    setLoadError(false);
    document.title = title;
    document.documentElement.lang = lang;
    document.body.className = bodyClass;

    let active = true;
    (async () => {
      for (const loadScript of scriptsByPage[name] || []) {
        if (!active) return;
        const resource = await loadScript();
        if (resource.ready) await resource.ready;
      }
      const protectedPages = ["nova", "resultado", "foto", "historico", "evolucao", "perfil"];
      if (protectedPages.includes(name) && !window.portuguesSession?.userId()) {
        active = false;
        window.location.replace("/");
        return;
      }
      if (["nova", "foto"].includes(name)) {
        const response = await window.portuguesSession.request('/api/termos');
        const receipt = await response.json();
        if (!response.ok) throw new Error(receipt.erro || 'Não foi possível consultar seu aceite.');
        if (!receipt.accepted) {
          active = false;
          window.location.replace(`/aceite?retorno=${name}`);
          return;
        }
      }
    })().then(() => {
        if (!active) return;
        // These legacy page modules are loaded after React has mounted, so the
        // browser's original ready events have already fired. Notify listeners
        // registered on either target that their page is ready.
        document.dispatchEvent(new Event("DOMContentLoaded"));
        window.dispatchEvent(new Event("DOMContentLoaded"));
        window.dispatchEvent(new Event("load"));
      })
      .catch((error) => {
        if (active) setLoadError(true);
        console.error(
          `Não foi possível carregar os recursos da página ${name}:`,
          error,
        );
      });

    return () => {
      active = false;
      document.body.className = "";
    };
  }, [bodyClass, lang, name, title]);

  return <>{sessionExpired && <div className="resource-error" role="alert">Sua sessão expirou. <a href="/" target="_blank" rel="noopener noreferrer">Entre novamente em outra aba</a> na mesma conta para continuar, mantendo seu trabalho nesta página.</div>}{offline && <div className="resource-error" role="status">Você está sem conexão. Mantenha esta página aberta e tente novamente quando a internet voltar.</div>}{storageUnavailable && <div className="resource-error" role="alert">O navegador não conseguiu salvar os dados neste dispositivo. Copie seu texto e guarde a foto antes de atualizar ou sair: o conteúdo pode existir apenas nesta aba.</div>}{loadError && <div className="resource-error" role="alert">Não foi possível carregar todos os recursos desta página. Verifique sua conexão. <button type="button" onClick={() => window.location.reload()}>Tentar novamente</button></div>}{children}<div className="legal-links"><a href="/termos">Termos de uso</a><a href="/privacidade">Privacidade</a><a href="mailto:portuguesmais02@gmail.com">Contato</a></div></>;
}
