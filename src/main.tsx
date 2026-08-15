import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import { AuthPage, LandingPage, RecipeDetail, RecipeForm, RecipeLibrary } from "../app/recipe-app";
import { I18nProvider, useI18n } from "./i18n";
import { RouterProvider, usePathname } from "./router";

function NotFound() {
  const { t } = useI18n();
  return <main className="empty-state" style={{ width: "min(520px, calc(100% - 36px))", margin: "80px auto" }}><div className="empty-icon">✳</div><h2>{t("pageNotFound")}</h2><p>{t("pageMoved")}</p></main>;
}

function AppRoutes() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "") return <LandingPage />;
  if (pathname === "/auth") return <AuthPage />;
  if (pathname === "/recipes") return <RecipeLibrary />;
  if (pathname === "/recipes/new") return <RecipeForm />;
  const editMatch = pathname.match(/^\/recipes\/([^/]+)\/edit\/?$/);
  if (editMatch) return <RecipeForm recipeId={decodeURIComponent(editMatch[1])} />;
  const detailMatch = pathname.match(/^\/recipes\/([^/]+)\/?$/);
  if (detailMatch) return <RecipeDetail recipeId={decodeURIComponent(detailMatch[1])} />;
  return <NotFound />;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider><RouterProvider><AppRoutes /></RouterProvider></I18nProvider>
  </StrictMode>,
);
