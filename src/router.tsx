import { createContext, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type ReactNode } from "react";

type Navigate = (to: string, options?: { replace?: boolean }) => void;

const RouterContext = createContext<{ pathname: string; navigate: Navigate } | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(() => window.location.pathname || "/");
  const navigate = useMemo<Navigate>(() => (to, options) => {
    if (options?.replace) window.history.replaceState({}, "", to);
    else window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || "/");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return <RouterContext.Provider value={{ pathname, navigate }}>{children}</RouterContext.Provider>;
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useNavigate must be used inside RouterProvider");
  return context.navigate;
}

export function usePathname() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("usePathname must be used inside RouterProvider");
  return context.pathname;
}

export function Link({ href, onClick, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const navigate = useNavigate();
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || href.startsWith("#") || href.startsWith("http")) return;
        event.preventDefault();
        navigate(href);
      }}
    >{children}</a>
  );
}
