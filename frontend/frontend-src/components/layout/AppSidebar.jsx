import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/nova", label: "Redação ENEM", page: "nova", icon: "pen" },
  { href: "/foto", label: "Correção por foto", page: "foto", icon: "photo" },
  {
    href: "/discursivas",
    label: "ENADE e concursos",
    page: "discursivas",
    icon: "book",
  },
  {
    href: "/questoes",
    label: "Questões e treinos",
    page: "questoes",
    icon: "list",
  },
  {
    href: "/historico",
    label: "Minhas redações",
    page: "historico",
    icon: "clock",
  },
  {
    href: "/historico-tecnico",
    label: "Histórico técnico",
    page: "historico-tecnico",
    icon: "folder",
  },
  {
    href: "/evolucao",
    label: "Minha evolução",
    page: "evolucao",
    icon: "chart",
  },
  {
    href: "/exemplos",
    label: "Exemplos de notas",
    page: "exemplos",
    icon: "book",
  },
  { href: "/perfil", label: "Meu perfil", page: "perfil", icon: "user" },
];
export function SidebarIcon({ name }) {
  const paths = {
    pen: "m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z",
    photo: "M4 5h16v14H4zM8 10h.01M4 16l5-5 4 4 3-3 4 4",
    book: "M5 3h13a1 1 0 0 1 1 1v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2M4 17h15M8 7h7M8 11h6",
    list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
    clock: "M12 7v5l3 2M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    folder: "M3 6h7l2 2h9v12H3V6ZM7 12h10M7 16h7",
    chart: "M4 4v16h16M7 15l4-5 4 3 5-7",
    user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
    logout: "M9 4H4v16h5M10 12h11m-4-4 4 4-4 4",
    collapse: "M4 4h16v16H4zM9 4v16m7-12-4 4 4 4",
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "m6 6 12 12M18 6 6 18",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.book} />
    </svg>
  );
}

export default function AppSidebar({ page, collapsed, onToggle }) {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");
  const sidebar = useRef(null),
    mobileToggle = useRef(null);
  useEffect(() => {
    let active = true,
      unsubscribe;
    import("../../services/auth.js")
      .then(async ({ ready }) => {
        await ready;
        if (!active) return;
        setSignedIn(Boolean(window.portuguesSession?.userId()));
        const result = window.authClient?.auth.onAuthStateChange(
          (_event, session) => {
            if (active) setSignedIn(Boolean(session?.user));
          },
        );
        unsubscribe = () => result?.data.subscription.unsubscribe();
      })
      .catch(() => {});
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      [...sidebar.current.querySelectorAll("a,button")].filter(
        (node) => node.getClientRects().length && !node.disabled,
      );
    focusable()[0]?.focus();
    const keyboard = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        mobileToggle.current?.focus();
      }
      if (event.key !== "Tab") return;
      const nodes = focusable(),
        first = nodes[0],
        last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keyboard);
    };
  }, [open]);
  async function logout() {
    setError("");
    try {
      await window.portuguesSession.signOut();
    } catch {
      setError("Não foi possível sair agora. Tente novamente.");
    }
  }
  return (
    <>
      <div className="app-mobile-bar">
        <button
          ref={mobileToggle}
          className="app-mobile-toggle nav-menu-toggle"
          type="button"
          aria-label="Abrir menu lateral"
          aria-expanded={open}
          aria-controls="app-sidebar"
          onClick={() => setOpen(true)}
        >
          <SidebarIcon name="menu" />
        </button>
        <a href="/nova" className="app-mobile-brand">
          <img src="/images/logo-portugues-mais.png" alt="" />
          Português<span>+</span>
        </a>
      </div>
      {open && (
        <button
          className="app-sidebar-backdrop"
          type="button"
          aria-label="Fechar menu lateral"
          onClick={() => {
            setOpen(false);
            mobileToggle.current?.focus();
          }}
        />
      )}
      <aside
        id="app-sidebar"
        ref={sidebar}
        className={`app-sidebar ${open ? "is-mobile-open" : ""}`}
        aria-label="Menu da aplicação"
      >
        <a
          href="/nova"
          className="app-sidebar-brand"
          aria-label="Português+: página de redação"
        >
          <img src="/images/logo-portugues-mais.png" alt="" />
          <span className="sidebar-label">
            <strong>
              Português<span>+</span>
            </strong>
            <small>Seu espaço de prática</small>
          </span>
        </a>
        <button
          className="app-sidebar-toggle"
          type="button"
          onClick={onToggle}
          aria-label={
            collapsed ? "Expandir menu lateral" : "Recolher menu lateral"
          }
          aria-expanded={!collapsed}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <SidebarIcon name="collapse" />
        </button>
        <button
          className="app-mobile-close"
          type="button"
          aria-label="Fechar menu lateral"
          onClick={() => {
            setOpen(false);
            mobileToggle.current?.focus();
          }}
        >
          <SidebarIcon name="close" />
        </button>
        <span className="app-menu-label sidebar-label">MENU</span>
        <nav className="app-sidebar-nav" aria-label="Páginas da plataforma">
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              aria-current={
                page === item.page ||
                (page === "resultado" && item.page === "historico")
                  ? "page"
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              <span className="app-nav-icon">
                <SidebarIcon name={item.icon} />
              </span>
              <span className="sidebar-label">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="app-sidebar-bottom">
          <p className="sidebar-label">Um passo de cada vez.</p>
          <nav className="app-sidebar-help" aria-label="Ajuda e informações">
            <a
              href="/contato"
              aria-current={page === "contato" ? "page" : undefined}
              title="Contato"
            >
              <SidebarIcon name="user" />
              <span className="sidebar-label">Contato</span>
            </a>
            <a href="/termos" title="Termos e privacidade">
              <SidebarIcon name="book" />
              <span className="sidebar-label">Termos e privacidade</span>
            </a>
          </nav>
          {error && (
            <p className="app-sidebar-error" role="alert">
              {error}
            </p>
          )}
          {signedIn ? (
            <button
              className="app-sidebar-logout"
              type="button"
              onClick={logout}
              title="Sair da conta"
            >
              <SidebarIcon name="logout" />
              <span className="sidebar-label">Sair da conta</span>
            </button>
          ) : (
            <a className="app-sidebar-logout" href="/" title="Entrar na conta">
              <SidebarIcon name="logout" />
              <span className="sidebar-label">Entrar na conta</span>
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
