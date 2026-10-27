import stylesheetUrl from "../styles/style.css?url";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router";

export const links = () => [{ rel: "stylesheet", href: stylesheetUrl }];
export const meta = () => [{ title: "Português+" }];

export function Layout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f4f8f6" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function HydrateFallback() {
  return <main className="app-loading" aria-busy="true" />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Não foi possível abrir esta página.";

  return (
    <main className="policy-main" role="alert">
      <h1>Algo deu errado</h1>
      <p>{message}</p>
      <a href="/index.html">Voltar ao início</a>
    </main>
  );
}
