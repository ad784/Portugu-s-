import { lazy, Suspense } from "react";
import { Navigate, useLocation } from "react-router";

const pages = {
  discursivas: lazy(() => import("../pages/TechnicalPage.jsx")),
  concursos: lazy(() => import("../pages/TechnicalPage.jsx")),
  enade: lazy(() => import("../pages/TechnicalPage.jsx")),
  "historico-tecnico": lazy(() => import("../pages/TechnicalHistoryPage.jsx")),
  "confirmar-email": lazy(() => import("../pages/VerifyEmailPage.jsx")),
  contato: lazy(() => import("../pages/ContactPage.jsx")),
  aceite: lazy(() => import("../pages/ConsentPage.jsx")),
  termos: lazy(() => import("../pages/TermsPage.jsx")),
  index: lazy(() => import("../pages/HomePage.jsx")),
  cadastro: lazy(() => import("../pages/SignupPage.jsx")),
  nova: lazy(() => import("../pages/EditorPage.jsx")),
  resultado: lazy(() => import("../pages/ResultPage.jsx")),
  foto: lazy(() => import("../pages/PhotoPage.jsx")),
  exemplos: lazy(() => import("../pages/ExamplesPage.jsx")),
  historico: lazy(() => import("../pages/HistoryPage.jsx")),
  evolucao: lazy(() => import("../pages/ProgressPage.jsx")),
  questoes: lazy(() => import("../pages/QuestionsPage.jsx")),
  perfil: lazy(() => import("../pages/ProfilePage.jsx")),
  recuperar: lazy(() => import("../pages/RecoveryPage.jsx")),
  privacidade: lazy(() => import("../pages/PrivacyPage.jsx")),
};

export default function PageRoute() {
  const { pathname } = useLocation();
  const pageName =
    pathname.replace(/^\/+|\/+$/g, "").replace(/\.html$/, "") || "index";

  if (!pages[pageName]) return <Navigate to="/" replace />;
  const Page = pages[pageName];
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}
