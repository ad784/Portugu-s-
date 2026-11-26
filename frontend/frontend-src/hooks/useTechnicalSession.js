import { useEffect, useState } from "react";
export default function useTechnicalSession() {
  const [state, setState] = useState({
    owner: null,
    ready: false,
    locked: false,
    error: "",
  });
  useEffect(() => {
    let active = true,
      unsubscribe;
    (async () => {
      const { ready } = await import("../services/auth.js");
      await ready;
      const session = await window.portuguesSession.getSession();
      if (!active || !session?.user) return;
      const owner = session.user.id;
      setState({ owner, ready: true, locked: false, error: "" });
      const result = window.authClient.auth.onAuthStateChange(
        (_event, current) => {
          if (active)
            setState((value) => ({
              ...value,
              locked: current?.user?.id !== owner,
            }));
        },
      );
      unsubscribe = () => result.data.subscription.unsubscribe();
    })().catch(() => {
      if (active)
        setState((value) => ({
          ...value,
          error: "Não foi possível confirmar sua sessão. Atualize a página.",
        }));
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  return state;
}
