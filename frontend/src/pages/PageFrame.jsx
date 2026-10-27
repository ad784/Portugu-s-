import { useEffect } from "react";
import { scriptsByPage } from "../pageScripts.js";

export default function PageFrame({
  name,
  title,
  lang = "pt-BR",
  bodyClass,
  children,
}) {
  useEffect(() => {
    document.title = title;
    document.documentElement.lang = lang;
    document.body.className = bodyClass;

    let active = true;
    Promise.all((scriptsByPage[name] || []).map((loadScript) => loadScript()))
      .then(() => {
        if (!active) return;
        document.dispatchEvent(new Event("DOMContentLoaded"));
        window.dispatchEvent(new Event("load"));
      })
      .catch((error) =>
        console.error(
          `Não foi possível carregar os recursos da página ${name}:`,
          error,
        ),
      );

    return () => {
      active = false;
      document.body.className = "";
    };
  }, [bodyClass, lang, name, title]);

  return <>{children}</>;
}
