import { useEffect, useMemo } from "react";
import parse from "html-react-parser";
import { templates } from "../templates.js";
import { scriptsByPage } from "../legacyScripts.js";

function readTemplate(name) {
  const source = templates[name];
  const body = source.match(/<body\b([^>]*)>([\s\S]*?)<\/body>/i);
  const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const lang = source.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1] || "pt-BR";
  const pageClass = body?.[1].match(/\bclass=["']([^"']*)["']/i)?.[1] || "";

  return {
    title: title || "Português+",
    lang,
    pageClass,
    content: body?.[2] || ""
  };
}

export default function LegacyPage({ name }) {
  const page = useMemo(() => readTemplate(name), [name]);
  const content = useMemo(() => parse(page.content, {
    replace(node) {
      if (node.type === "script" || (node.type === "tag" && node.name === "link")) {
        return <></>;
      }
    }
  }), [page.content]);

  useEffect(() => {
    document.title = page.title;
    document.documentElement.lang = page.lang;
    document.body.className = page.pageClass;

    let active = true;
    Promise.all((scriptsByPage[name] || []).map((loadScript) => loadScript()))
      .then(() => {
        if (!active) return;
        document.dispatchEvent(new Event("DOMContentLoaded"));
        window.dispatchEvent(new Event("load"));
      })
      .catch((error) => console.error(`Não foi possível carregar os recursos da página ${name}:`, error));

    return () => {
      active = false;
      document.body.className = "";
    };
  }, [name, page]);

  return <>{content}</>;
}
