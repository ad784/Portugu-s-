import { lazy, Suspense } from "react";
import { Navigate, useLocation } from "react-router";

const pages = {
  cadastro: lazy(() => import("../pages/content/SignupPage.jsx")),
  nova: lazy(() => import("../pages/content/EditorPage.jsx")),
  resultado: lazy(() => import("../pages/content/ResultPage.jsx")),
  foto: lazy(() => import("../pages/content/PhotoPage.jsx")),
  exemplos: lazy(() => import("../pages/content/ExamplesPage.jsx")),
  historico: lazy(() => import("../pages/content/HistoryPage.jsx")),
  evolucao: lazy(() => import("../pages/content/ProgressPage.jsx")),
  perfil: lazy(() => import("../pages/content/ProfilePage.jsx")),
  recuperar: lazy(() => import("../pages/content/RecoveryPage.jsx")),
  privacidade: lazy(() => import("../pages/content/PrivacyPage.jsx")),
};

export default function PageRoute() {
  const { pathname } = useLocation();
  const pageName =
    pathname.replace(/^\/+|\/+$/g, "").replace(/\.html$/, "") || "index";

  if (!pages[pageName]) return <Navigate to="/index.html" replace />;
  const Page = pages[pageName];
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}
