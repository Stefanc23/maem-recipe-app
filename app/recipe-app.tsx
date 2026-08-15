import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "../src/router";
import { LanguageSwitch, useI18n } from "../src/i18n";
import {
  auth,
  createRecipe,
  deleteRecipe as deleteFirebaseRecipe,
  deleteRecipePhoto,
  firebaseConfigured,
  getRecipe,
  listRecipes,
  signIn,
  signOutUser,
  signUp,
  subscribeToAuth,
  updateRecipe,
  uploadRecipePhoto,
} from "../lib/firebase";

export type Recipe = {
  id: string;
  title: string;
  note: string;
  image?: string;
  photoKey?: string | null;
  createdAt: string;
};

const STORAGE_KEY = "maem-recipes-v1";
const LEGACY_STORAGE_KEY = "mise-recipes-v1";
const USER_KEY = "maem-user-v1";
const LEGACY_USER_KEY = "mise-user-v1";
const REMOTE_MODE = firebaseConfigured;
const MAX_SOURCE_PHOTO_BYTES = 12 * 1024 * 1024;
const TARGET_PHOTO_BYTES = 1.5 * 1024 * 1024;

const starterRecipes: Recipe[] = [
  {
    id: "miso-noodles",
    title: "Miso butter noodles",
    note: "Whisk white miso, butter, soy, and a splash of noodle water into a glossy sauce. Finish with scallions and sesame.",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=82",
    createdAt: "2026-08-12T09:00:00.000Z",
  },
  {
    id: "shakshuka",
    title: "Green shakshuka",
    note: "Soften leeks and greens, fold through herbs, then nestle in eggs. Serve with warm pita and a lemony yogurt.",
    image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=900&q=82",
    createdAt: "2026-08-08T09:00:00.000Z",
  },
  {
    id: "cardamom-buns",
    title: "Cardamom buns",
    note: "Twist the enriched dough around cardamom sugar, let it puff until pillowy, then bake until deeply golden.",
    image: "https://images.unsplash.com/photo-1623334044303-241021148842?auto=format&fit=crop&w=900&q=82",
    createdAt: "2026-07-28T09:00:00.000Z",
  },
  {
    id: "tomato-toast",
    title: "Late-summer tomato toast",
    note: "Rub toasted sourdough with garlic, pile on ripe tomatoes, olive oil, flaky salt, and a little basil.",
    image: "https://images.unsplash.com/photo-1603046891744-76e6300f9c0c?auto=format&fit=crop&w=900&q=82",
    createdAt: "2026-07-21T09:00:00.000Z",
  },
];

const landingFeatureImages = [
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1623334044303-241021148842?auto=format&fit=crop&w=1200&q=82",
] as const;

const landingFeatureCopy = [
  { title: "featureCaptureTitle", body: "featureCaptureBody" },
  { title: "featureNoteTitle", body: "featureNoteBody" },
  { title: "featureFindTitle", body: "featureFindBody" },
] as const;

function readRecipes(): Recipe[] {
  if (typeof window === "undefined") return starterRecipes;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved && !window.localStorage.getItem(STORAGE_KEY)) window.localStorage.setItem(STORAGE_KEY, saved);
    return saved ? JSON.parse(saved) : starterRecipes;
  } catch {
    return starterRecipes;
  }
}

function writeRecipes(recipes: Recipe[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function getInitials() {
  if (typeof window === "undefined") return "M";
  const email = window.localStorage.getItem(USER_KEY) || window.localStorage.getItem(LEGACY_USER_KEY) || "maker@maem.app";
  return email.slice(0, 1).toUpperCase();
}

function formatDate(date: string, language: "en" | "id") {
  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

function ImageOrPlaceholder({ recipe, large = false }: { recipe: Recipe; large?: boolean }) {
  return recipe.image ? (
    <img src={recipe.image} alt="" className={large ? "detail-photo" : undefined} />
  ) : (
    <span aria-hidden="true">✳</span>
  );
}

function MaemLogo({ href = "/" }: { href?: string }) {
  const { t } = useI18n();
  return (
    <Link className="brand" href={href} aria-label={t("maemHome")}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" focusable="false">
          <path d="M8 15h20" />
          <path d="M10 18c1.7 6.5 4.3 9.5 8 9.5s6.3-3 8-9.5" />
          <path d="M14 11c-1.7-2.2 2.2-3.3.5-6M22 11c-1.7-2.2 2.2-3.3.5-6" />
        </svg>
      </span>
      <span className="brand-word">maem</span>
    </Link>
  );
}

export function LandingPage() {
  const { t } = useI18n();
  const landingRef = useRef<HTMLElement>(null);
  const featureRef = useRef<HTMLElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    if (!landingRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    let cancelMotion = () => undefined;
    async function setupMotion() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (disposed || !landingRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      let media: { add: (query: string, callback: () => void) => void; revert: () => void } | null = null;
      const context = gsap.context(() => {
        gsap.fromTo(".hero-copy-block", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" });
        gsap.fromTo(".hero-visual", { opacity: 0, y: 34, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1.05, delay: 0.08, ease: "power3.out" });
        gsap.to(".hero-photo", {
          scale: 0.82,
          opacity: 0.25,
          filter: "saturate(.65) contrast(.94)",
          ease: "none",
          scrollTrigger: { trigger: landingRef.current, start: "top top", end: "45% top", scrub: true },
        });

        media = gsap.matchMedia();
        media.add("(min-width: 801px)", () => {
          if (!featureRef.current) return;
          ScrollTrigger.create({ trigger: featureRef.current, start: "top top+=90", end: "bottom bottom-=100", pin: ".feature-intro", pinSpacing: false });
          gsap.utils.toArray<HTMLElement>(".feature-panel-image").forEach((image) => {
            gsap.fromTo(image, { scale: 0.82, opacity: 0.45 }, {
              scale: 1,
              opacity: 1,
              ease: "none",
              scrollTrigger: { trigger: image, start: "top 92%", end: "top 42%", scrub: true },
            });
          });
        });
      }, landingRef);
      cancelMotion = () => { media?.revert(); context.revert(); };
    }
    setupMotion();
    return () => { disposed = true; cancelMotion(); };
  }, []);

  return (
    <main ref={landingRef} className="landing">
      <nav className="topbar" aria-label={t("mainNavigation")}>
        <MaemLogo />
        <div className="topbar-links"><a href="#how-it-works">{t("howItWorks")}</a><Link href="/auth">{t("signIn")}</Link><Link className="button button-primary button-small" href="/auth">{t("startYourBox")} <span>↗</span></Link><LanguageSwitch /></div>
      </nav>
      <section className="hero">
        <div className="hero-copy-block">
          <span className="eyebrow"><span className="eyebrow-dot" /> {t("littleRecipeBox")}</span>
          <h1 className="serif">{t("goodFoodLine1")} <span className="headline-image" aria-hidden="true" /><br /><em>{t("goodFoodLine2")}</em></h1>
          <p className="hero-copy">{t("landingDescription")}</p>
          <div className="hero-actions"><Link className="button button-primary" href="/auth">{t("makeRecipeBox")} <span>→</span></Link><a className="button button-quiet" href="#how-it-works">{t("seeHowItWorks")} <span>↓</span></a></div>
          <div className="hero-note"><span className="hero-note-mark">✓</span> {t("freeToStart")}</div>
        </div>
        <div className="hero-visual" aria-label={t("bowlOfNoodles")}>
          <div className="hero-photo"><div className="photo-label"><strong>{t("sampleRecipe")}</strong><span>{t("savedTwoMinutes")}</span></div></div>
        </div>
      </section>
      <section ref={featureRef} className="landing-features" id="how-it-works">
        <div className="feature-intro">
          <span className="eyebrow"><span className="eyebrow-dot" /> {t("featureEyebrow")}</span>
          <h2 className="serif">{t("featureHeading")}</h2>
          <p>{t("featureDescription")}</p>
          <span className="feature-hint">{t("featureHint")}</span>
        </div>
        <div className="feature-rail">
          {landingFeatureCopy.map((feature, index) => (
            <button
              type="button"
              className={`feature-panel feature-panel-${index} ${activeFeature === index ? "active" : ""}`}
              key={feature.title}
              onClick={() => setActiveFeature(index)}
              onMouseEnter={() => setActiveFeature(index)}
              onFocus={() => setActiveFeature(index)}
            >
              <span className="feature-panel-image" style={{ backgroundImage: `url(${landingFeatureImages[index]})` }} aria-hidden="true" />
              <span className="feature-panel-scrim" aria-hidden="true" />
              <span className="feature-panel-content"><strong>{t(feature.title)}</strong><span>{t(feature.body)}</span></span>
            </button>
          ))}
        </div>
      </section>
      <section className="landing-marquee" aria-label={t("marqueeAria")}>
        <div className="marquee-track" aria-hidden="true">
          {[0, 1].map((group) => <span className="marquee-group" key={group}><span>{t("snapDish")}</span><b>✦</b><span>{t("addLittleNote")}</span><b>✦</b><span>{t("findItLater")}</span><b>✦</b></span>)}
        </div>
      </section>
      <section className="landing-action">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> {t("actionEyebrow")}</span><h2 className="serif">{t("actionHeading")}</h2><p>{t("actionBody")}</p></div>
        <Link className="button button-primary" href="/auth">{t("actionCta")} <span>↗</span></Link>
      </section>
      <footer className="landing-footer"><span>maem</span><span>{t("footerNote")}</span></footer>
    </main>
  );
}

export function AuthPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!REMOTE_MODE) {
      const savedUser = window.localStorage.getItem(USER_KEY) || window.localStorage.getItem(LEGACY_USER_KEY);
      if (savedUser) {
        window.localStorage.setItem(USER_KEY, savedUser);
        navigate("/recipes", { replace: true });
      }
      return;
    }
    let active = true;
    const unsubscribe = subscribeToAuth((user) => {
      if (!active || !user) return;
      window.localStorage.setItem(USER_KEY, user.email || "maker@maem.app");
      navigate("/recipes", { replace: true });
    });
    return () => { active = false; unsubscribe(); };
  }, [navigate]);

  function friendlyAuthError(reason: unknown) {
    const code = typeof reason === "object" && reason && "code" in reason ? String(reason.code) : "";
    if (code.includes("email-already-in-use")) return t("authErrorEmailExists");
    if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return t("authErrorCredentials");
    if (code.includes("weak-password")) return t("authErrorWeakPassword");
    if (code.includes("invalid-email")) return t("authErrorEmail");
    return t("authErrorGeneral");
  }

  async function submitAuth(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) { setError(t("authErrorRequired")); return; }
    setBusy(true); setError("");
    try {
      if (!REMOTE_MODE) {
        window.localStorage.setItem(USER_KEY, email.trim());
        navigate("/recipes");
        return;
      }
      const user = mode === "signup" ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
      window.localStorage.setItem(USER_KEY, user.email || email.trim());
      navigate("/recipes");
    } catch (reason) {
      setError(friendlyAuthError(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-layout">
        <aside className="auth-aside">
          <MaemLogo />
          <div><div className="auth-doodle" aria-hidden="true">✳</div><h1 className="serif">{t("keepGoodStuff")}<br />{t("goodStuff")}</h1><p>{t("ownQuietCorner")}</p></div>
          <span style={{ fontSize: 12, opacity: .7 }}>{t("homeForBites")}</span>
        </aside>
        <div className="auth-card">
          <div className="auth-card-top"><span className="eyebrow"><span className="eyebrow-dot" /> {t("welcomeToMaem")}</span><LanguageSwitch /></div>
          <h2>{t("setTable")}</h2>
          <p className="auth-card-sub">{t("authSub")}</p>
          {!REMOTE_MODE && <p className="form-error" role="status">{t("firebaseWarning")}</p>}
          {!mode ? <div className="auth-actions"><button className="button button-primary" onClick={() => setMode("signup")}>{t("createRecipeBox")} <span>→</span></button><button className="button button-outline" onClick={() => setMode("signin")}>{t("signInToMaem")}</button></div> : <form className="auth-form" onSubmit={submitAuth}><div className="field"><label htmlFor="auth-email">{t("emailAddress")}</label><input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div><div className="field"><label htmlFor="auth-password">{t("password")}</label><input id="auth-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("passwordPlaceholder")} minLength={6} required /></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" type="submit" disabled={busy}>{busy ? t("oneMoment") : mode === "signup" ? t("createRecipeBox") : t("signInToMaem")} <span>→</span></button><button className="button button-quiet" type="button" onClick={() => { setMode(null); setError(""); }}>{t("backChoices")}</button></form>}
          <div className="auth-divider">{t("fewGoodThings")}</div>
          <ul className="auth-bullets"><li>{t("bulletPhoto")}</li><li>{t("bulletSearch")}</li><li>{t("bulletOwn")}</li></ul>
          <Link className="auth-back" href="/">{t("backHome")}</Link>
        </div>
      </section>
    </main>
  );
}

type RecipeFilter = "all" | "photo" | "note";

export function RecipeLibrary() {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const [recipes, setRecipes] = useState<Recipe[]>(() => REMOTE_MODE ? [] : readRecipes());
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<RecipeFilter>("all");

  useEffect(() => {
    if (!REMOTE_MODE) return;
    let active = true;
    const unsubscribe = subscribeToAuth((user) => {
      if (!user) { navigate("/auth"); return; }
      window.localStorage.setItem(USER_KEY, user.email || "maker@maem.app");
      listRecipes(user).then((items) => {
        if (!active) return;
        setRecipes(items.map((item) => ({ ...item, photoKey: item.photoPath })));
      }).catch(() => undefined);
    });
    return () => { active = false; unsubscribe(); };
  }, [navigate]);

  const visibleRecipes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesQuery = !normalized || `${recipe.title} ${recipe.note}`.toLowerCase().includes(normalized);
      const matchesFilter = activeFilter === "all" || (activeFilter === "photo" ? Boolean(recipe.image) : !recipe.image);
      return matchesQuery && matchesFilter;
    });
  }, [recipes, query, activeFilter]);

  const filters: Array<{ id: RecipeFilter; label: string }> = [
    { id: "all", label: t("allRecipes") },
    { id: "photo", label: t("withPhotos") },
    { id: "note", label: t("notesOnly") },
  ];

  async function signOut() {
    if (REMOTE_MODE) {
      await signOutUser().catch(() => undefined);
      window.localStorage.removeItem(USER_KEY);
      window.localStorage.removeItem(LEGACY_USER_KEY);
      navigate("/");
      return;
    }
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(LEGACY_USER_KEY);
    navigate("/");
  }

  return (
    <main className="library-page">
      <header className="library-header">
        <div className="library-nav"><MaemLogo /><div className="library-nav-right"><LanguageSwitch /><button className="button button-quiet button-small" onClick={signOut}>{t("signOut")}</button><span className="avatar" aria-label={t("account")}>{getInitials()}</span></div></div>
        <div className="library-intro"><div><span className="eyebrow"><span className="eyebrow-dot" /> {t("recipeBox")}</span><h1 className="serif">{t("goodOnes")}</h1><p>{t("recipesSaved", { count: recipes.length })}</p></div><button className="button button-primary" onClick={() => navigate("/recipes/new")}>{t("addRecipe")} <span>+</span></button></div>
        <div className="search-wrap"><span className="search-icon" aria-hidden="true">⌕</span><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchRecipes")} />{query && <button className="clear-search" onClick={() => setQuery("")} aria-label={t("clearSearch")}>×</button>}</div>
        <div className="filter-row" role="group" aria-label={t("recipeFilters")}>{filters.map((filter) => <button className={`filter-chip ${activeFilter === filter.id ? "active" : ""}`} key={filter.id} onClick={() => setActiveFilter(filter.id)}>{filter.label}</button>)}</div>
        {visibleRecipes.length > 0 ? <div className="recipe-grid">{visibleRecipes.map((recipe, index) => <button className="recipe-card" key={recipe.id} onClick={() => navigate(`/recipes/${recipe.id}`)}><div className={`recipe-card-image ${!recipe.image ? "no-image" : ""}`}>{recipe.image ? <ImageOrPlaceholder recipe={recipe} /> : <ImageOrPlaceholder recipe={recipe} />}<span className="recipe-badge">{index === 0 && !query ? t("recentlySaved") : recipe.image ? t("withPhoto") : t("noteOnly")}</span></div><div className="recipe-card-body"><h3>{recipe.title}</h3><p>{recipe.note}</p><div className="recipe-card-meta"><span>{t("saved", { date: formatDate(recipe.createdAt, language) })}</span><span className="card-arrow">↗</span></div></div></button>)}</div> : <div className="empty-state"><div className="empty-icon">⌕</div><h2>{t("noRecipes")}</h2><p>{t("noRecipesBody")}</p><button className="button button-outline button-small" onClick={() => { setQuery(""); setActiveFilter("all"); }}>{t("clearFilters")}</button></div>}
      </header>
      <button className="floating-add" type="button" aria-label={t("addRecipe")} title={t("addRecipe")} onClick={() => navigate("/recipes/new")}><span aria-hidden="true">+</span></button>
    </main>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read compressed image"));
    reader.readAsDataURL(blob);
  });
}

async function resizeImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not read image"));
    });

    let maxDimension = 1600;
    let quality = 0.82;
    let compressed: Blob | null = null;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare image");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!compressed) throw new Error("Could not compress image");
      if (compressed.size <= TARGET_PHOTO_BYTES) return blobToDataUrl(compressed);
      quality = Math.max(0.48, quality - 0.1);
      maxDimension = Math.max(900, Math.round(maxDimension * 0.86));
    }
    if (!compressed || compressed.size > TARGET_PHOTO_BYTES) throw new Error("Photo is too detailed to compress");
    return blobToDataUrl(compressed);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function RecipeForm({ recipeId }: { recipeId?: string }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [recipes] = useState<Recipe[]>(() => REMOTE_MODE ? [] : readRecipes());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const existingRecipe = recipeId ? recipes.find((item) => item.id === recipeId) : undefined;
  const [image, setImage] = useState<string | undefined>(() => existingRecipe?.image);
  const [title, setTitle] = useState(() => existingRecipe?.title || "");
  const [note, setNote] = useState(() => existingRecipe?.note || "");
  const [remotePhotoKey, setRemotePhotoKey] = useState<string | null>(() => existingRecipe?.photoKey || null);

  useEffect(() => {
    if (!REMOTE_MODE) return;
    let active = true;
    const unsubscribe = subscribeToAuth((user) => {
      if (!user) { navigate("/auth"); return; }
      if (!recipeId) return;
      getRecipe(user, recipeId).then((item) => {
        if (!active || !item) return;
        setTitle(item.title);
        setNote(item.note);
        setRemotePhotoKey(item.photoPath);
        setImage(item.image);
      }).catch(() => undefined);
    });
    return () => { active = false; unsubscribe(); };
  }, [navigate, recipeId]);

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) { setError(t("invalidPhotoType")); return; }
    if (file.size > MAX_SOURCE_PHOTO_BYTES) { setError(t("photoTooLarge")); return; }
    setError(""); setBusy(true);
    try { setImage(await resizeImage(file)); } catch { setError(t("photoCompressError")); }
    finally { setBusy(false); }
  }

  async function saveRecipe(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError(t("titleRequired")); return; }
    if (!note.trim()) { setError(t("noteRequired")); return; }
    setBusy(true);
    if (REMOTE_MODE) {
      const uploadUser = auth?.currentUser;
      if (!uploadUser) { setBusy(false); navigate("/auth"); return; }
      let uploadedPhotoPath: string | null = null;
      let savedId: string | null = null;
      let photoPath: string | null = image ? remotePhotoKey : null;
      try {
        if (image?.startsWith("data:")) {
          const compressedBlob = await (await fetch(image)).blob();
          const upload = await uploadRecipePhoto(uploadUser, new File([compressedBlob], "recipe-photo.jpg", { type: "image/jpeg" }));
          photoPath = upload.path;
          uploadedPhotoPath = upload.path;
        }
        const saved = recipeId
          ? await updateRecipe(uploadUser, recipeId, { title: title.trim(), note: note.trim(), photoPath })
          : await createRecipe(uploadUser, { title: title.trim(), note: note.trim(), photoPath });
        savedId = saved.id;
      } catch {
        if (uploadedPhotoPath) await deleteRecipePhoto(uploadUser, uploadedPhotoPath).catch(() => undefined);
        setError(t("saveError"));
        setBusy(false);
        return;
      }
      if (recipeId && remotePhotoKey && remotePhotoKey !== photoPath) await deleteRecipePhoto(uploadUser, remotePhotoKey).catch(() => undefined);
      setBusy(false);
      if (savedId) navigate(`/recipes/${savedId}`);
      return;
    }
    const next: Recipe = { id: recipeId || `recipe-${Date.now()}`, title: title.trim(), note: note.trim(), image, createdAt: recipeId ? (recipes.find((item) => item.id === recipeId)?.createdAt || new Date().toISOString()) : new Date().toISOString() };
    const nextRecipes = recipeId ? recipes.map((item) => item.id === recipeId ? next : item) : [next, ...recipes];
    writeRecipes(nextRecipes); setBusy(false); navigate(`/recipes/${next.id}`);
  }

  return (
    <main className="form-page"><header className="simple-header"><MaemLogo href="/recipes" /><Link className="back-link" href="/recipes">{t("cancel")}</Link></header><form className="form-card" onSubmit={saveRecipe}><span className="eyebrow"><span className="eyebrow-dot" /> {recipeId ? t("editRecipe") : t("newRecipe")}</span><h1 className="serif">{t("tellAboutLine1")}<br />{t("tellAboutLine2")}</h1><p className="form-card-intro">{t("formIntro")}</p><div className={`capture-zone ${image ? "has-image" : ""}`}>{image ? <><img className="capture-image" src={image} alt={t("yourDishPreview")} /><div className="capture-actions"><button type="button" className="button button-outline button-small" onClick={() => fileRef.current?.click()}>{t("replacePhoto")}</button><button type="button" className="button button-quiet button-small" onClick={() => { setImage(undefined); }}>{t("remove")}</button></div></> : <div className="capture-placeholder"><span className="capture-placeholder-icon">◎</span><strong>{t("gotPhoto")}</strong><span>{t("photoPrompt")}</span><div className="capture-actions"><button type="button" className="button button-primary button-small" onClick={() => fileRef.current?.click()}>{t("takePhoto")}</button><button type="button" className="button button-outline button-small" onClick={() => fileRef.current?.click()}>{t("chooseFromLibrary")}</button></div></div>}<input ref={fileRef} className="file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => handleFile(event.target.files?.[0])} /></div><div className="field"><label htmlFor="recipe-title">{t("recipeTitle")} <span>*</span></label><input id="recipe-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("titlePlaceholder")} maxLength={100} /></div><div className="field"><label htmlFor="recipe-note">{t("yourNote")} <span>*</span></label><textarea id="recipe-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("notePlaceholder")} maxLength={2000} /></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-submit"><button type="button" className="button button-quiet" onClick={() => navigate("/recipes")}>{t("cancel")}</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? t("saving") : recipeId ? t("saveChanges") : t("saveRecipe")} <span>→</span></button></div></form></main>
  );
}

export function RecipeDetail({ recipeId }: { recipeId: string }) {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const [recipe, setRecipe] = useState<Recipe | null>(() => REMOTE_MODE ? null : readRecipes().find((item) => item.id === recipeId) || null);
  const [showDelete, setShowDelete] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!REMOTE_MODE) return;
    let active = true;
    const unsubscribe = subscribeToAuth((user) => {
      if (!user) { navigate("/auth"); return; }
      getRecipe(user, recipeId).then((item) => {
        if (!active || !item) return;
        setRecipe({ ...item, photoKey: item.photoPath });
      }).catch(() => undefined);
    });
    return () => { active = false; unsubscribe(); };
  }, [navigate, recipeId]);

  async function deleteRecipe() {
    if (!recipe) return;
    if (REMOTE_MODE) {
      const user = auth?.currentUser;
      if (!user) { navigate("/auth"); return; }
      await deleteFirebaseRecipe(user, recipe.id);
      navigate("/recipes");
      return;
    }
    writeRecipes(readRecipes().filter((item) => item.id !== recipe.id)); navigate("/recipes");
  }
  function shareRecipe() {
    if (navigator.share && recipe) navigator.share({ title: recipe.title, text: recipe.note, url: window.location.href });
    else { navigator.clipboard?.writeText(window.location.href); setToast(t("recipeLinkCopied")); window.setTimeout(() => setToast(""), 2400); }
  }
  if (!recipe) return <main className="detail-page"><header className="simple-header"><MaemLogo href="/recipes" /></header><div className="empty-state" style={{ width: "min(520px, calc(100% - 36px))", margin: "80px auto" }}><div className="empty-icon">✳</div><h2>{t("recipeNotFound")}</h2><p>{t("recipeUnavailable")}</p><Link className="button button-outline button-small" href="/recipes">{t("backToRecipes")}</Link></div></main>;
  return <main className="detail-page"><header className="simple-header"><MaemLogo href="/recipes" /><Link className="back-link" href="/recipes">{t("allRecipesBack")}</Link></header><div className="detail-wrap"><div className="detail-hero"><div className={`detail-image ${!recipe.image ? "no-image" : ""}`}>{recipe.image ? <ImageOrPlaceholder recipe={recipe} large /> : <ImageOrPlaceholder recipe={recipe} />}</div><div className="detail-copy"><span className="eyebrow"><span className="eyebrow-dot" /> {t("savedAt", { date: formatDate(recipe.createdAt, language) })}</span><h1>{recipe.title}</h1><p>{recipe.note}</p><div className="detail-actions"><button className="button button-primary button-small" onClick={() => navigate(`/recipes/${recipe.id}/edit`)}>{t("editNote")} <span>✎</span></button><button className="button button-outline button-small" onClick={shareRecipe}>{t("share")} <span>↗</span></button></div><button className="button button-quiet button-small" style={{ marginTop: 10, color: "#a45a4a" }} onClick={() => setShowDelete(true)}>{t("deleteRecipe")}</button></div></div><div className="detail-note">{t("detailFooter")}</div></div>{showDelete && <div className="modal-backdrop" role="presentation"><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><span className="eyebrow"><span className="eyebrow-dot" /> {t("justChecking")}</span><h2 id="delete-title">{t("removeThis")}</h2><p>{t("removeConfirm", { title: recipe.title })}</p><div className="form-submit"><button className="button button-quiet" onClick={() => setShowDelete(false)}>{t("keepIt")}</button><button className="button button-danger" onClick={deleteRecipe}>{t("removeRecipe")}</button></div></div></div>}{toast && <div className="toast" role="status">{toast}</div>}</main>;
}
