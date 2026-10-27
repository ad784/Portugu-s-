import { Navigate, useLocation } from "react-router";
import LegacyPage from "../pages/LegacyPage.jsx";

const pageNames = new Set([
  "index", "cadastro", "nova", "resultado", "foto", "exemplos",
  "historico", "evolucao", "perfil", "recuperar", "privacidade"
]);

export default function PageRoute() {
  const { pathname } = useLocation();
  const pageName = pathname.replace(/^\/+|\/+$/g, "").replace(/\.html$/, "") || "index";

  if (!pageNames.has(pageName)) return <Navigate to="/index.html" replace />;
  return <LegacyPage name={pageName} />;
}
