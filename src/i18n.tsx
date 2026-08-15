import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "id";

const STORAGE_KEY = "maem-language-v1";
const LEGACY_STORAGE_KEY = "mise-language-v1";

const translations = {
  en: {
    maemHome: "Maem home",
    mainNavigation: "Main navigation",
    howItWorks: "How it works",
    signIn: "Sign in",
    startYourBox: "Start your box",
    littleRecipeBox: "your little recipe box",
    goodFoodLine1: "Good food is",
    goodFoodLine2: "worth remembering.",
    landingDescription: "Maem is a pocket-sized place for the dishes you make, the ones you want to make again, and the stories in between.",
    makeRecipeBox: "Make your recipe box",
    seeHowItWorks: "See how it works",
    freeToStart: "Free to start · private by default",
    bowlOfNoodles: "A bowl of noodles",
    stickerMadeTo: "made to",
    stickerBeShared: "be shared",
    stickerWithYourself: "with yourself",
    sampleRecipe: "Miso butter noodles",
    savedTwoMinutes: "saved 2 minutes ago",
    keepGoodOnes: "Everything you need to keep the good ones close.",
    snapDish: "Snap a dish",
    addLittleNote: "Add the little note",
    findItLater: "Find it later",
    featureEyebrow: "A little system for good food.",
    featureHeading: "Keep the good ones close.",
    featureDescription: "Capture the dish, leave yourself a clue, and find it when the craving returns.",
    featureHint: "Tap a panel to open it",
    featureCaptureTitle: "Catch the moment",
    featureCaptureBody: "A quick photo gives future-you somewhere to start.",
    featureNoteTitle: "Leave a clue",
    featureNoteBody: "The shortcut, the swap, the person who asked for seconds.",
    featureFindTitle: "Return to it",
    featureFindBody: "Search the note, not just the name, when dinner is close.",
    marqueeAria: "Maem recipe habits",
    actionEyebrow: "Your future self will thank you.",
    actionHeading: "Make room for the recipes you’ll want again.",
    actionBody: "Private by default, ready whenever you are.",
    actionCta: "Open your recipe box",
    footerNote: "A quiet place for good food.",
    keepGoodStuff: "Keep the",
    goodStuff: "good stuff.",
    ownQuietCorner: "Your own quiet corner for recipes worth making twice.",
    homeForBites: "A little home for your best bites.",
    welcomeToMaem: "welcome to maem",
    setTable: "Let’s set the table.",
    authSub: "Create a private recipe box, or pick up where you left off.",
    firebaseWarning: "Add your Firebase web app values to enable account sign-in.",
    createRecipeBox: "Create your recipe box",
    signInToMaem: "Sign in to Maem",
    emailAddress: "Email address",
    password: "Password",
    passwordPlaceholder: "At least 6 characters",
    oneMoment: "One moment…",
    backChoices: "← Back to choices",
    fewGoodThings: "a few good things",
    bulletPhoto: "Save a photo with the story behind it",
    bulletSearch: "Search your notes when dinner time comes",
    bulletOwn: "Your recipes stay yours, always",
    backHome: "← Back to home",
    authErrorEmailExists: "That email already has a recipe box. Try signing in.",
    authErrorCredentials: "That email or password doesn’t look right.",
    authErrorWeakPassword: "Choose a password with at least six characters.",
    authErrorEmail: "Enter a valid email address.",
    authErrorGeneral: "We couldn’t complete that request. Check your connection and try again.",
    authErrorRequired: "Enter your email and password to continue.",
    recipeBox: "your recipe box",
    goodOnes: "The good ones.",
    recipesSaved: "{count} recipes saved for later.",
    signOut: "Sign out",
    account: "Your account",
    addRecipe: "Add a recipe",
    searchPlaceholder: "Search your recipes...",
    searchRecipes: "Search recipes",
    clearSearch: "Clear search",
    recipeFilters: "Recipe filters",
    allRecipes: "All recipes",
    withPhotos: "With photos",
    notesOnly: "Notes only",
    recentlySaved: "recently saved",
    withPhoto: "with photo",
    noteOnly: "note only",
    saved: "Saved {date}",
    noRecipes: "No recipes found",
    noRecipesBody: "Try a different word, or save a new dish for your future self.",
    clearFilters: "Clear filters",
    editRecipe: "edit recipe",
    newRecipe: "new recipe",
    tellAboutLine1: "Tell me about",
    tellAboutLine2: "this one.",
    formIntro: "A photo helps you remember. A little note makes it yours.",
    cancel: "Cancel",
    dishPreview: "Your dish preview",
    replacePhoto: "Replace photo",
    remove: "Remove",
    gotPhoto: "Got a photo?",
    photoPrompt: "Take a quick snap, choose one from your library, or skip it for now.",
    takePhoto: "Take a photo",
    chooseFromLibrary: "Choose from library",
    yourDishPreview: "Your dish preview",
    recipeTitle: "Recipe title",
    yourNote: "Your note",
    titlePlaceholder: "e.g. Sunday sauce",
    notePlaceholder: "What should you remember next time? Ingredients, a shortcut, who loved it...",
    invalidPhotoType: "Please choose a JPEG, PNG, or WebP image.",
    photoTooLarge: "That image is a little too large. Please choose one under 12 MB.",
    photoCompressError: "We couldn’t compress that photo. Try a smaller image.",
    titleRequired: "Give this recipe a title first.",
    noteRequired: "Add a note so future-you knows how to make it.",
    saveError: "We couldn’t save this recipe. Check your connection and try again.",
    saveChanges: "Save changes",
    saveRecipe: "Save recipe",
    saving: "Saving…",
    allRecipesBack: "← All recipes",
    savedAt: "saved {date}",
    editNote: "Edit note",
    share: "Share",
    deleteRecipe: "Delete recipe",
    recipeNotFound: "Recipe not found",
    recipeUnavailable: "It may have been removed or is waiting for a connection.",
    backToRecipes: "Back to recipes",
    detailFooter: "Made with care, saved for the next craving.",
    justChecking: "just checking",
    removeThis: "Remove this recipe?",
    removeConfirm: "“{title}” will be removed from your recipe box. This can’t be undone.",
    keepIt: "Keep it",
    removeRecipe: "Remove recipe",
    recipeLinkCopied: "Recipe link copied",
    pageNotFound: "Page not found",
    pageMoved: "That page has moved somewhere else.",
    languageLabel: "Display language",
    languageEnglish: "English",
    languageIndonesian: "Bahasa Indonesia",
  },
  id: {
    maemHome: "Beranda Maem",
    mainNavigation: "Navigasi utama",
    howItWorks: "Cara kerja",
    signIn: "Masuk",
    startYourBox: "Mulai kotak resepmu",
    littleRecipeBox: "kotak resep kecilmu",
    goodFoodLine1: "Masakan enak",
    goodFoodLine2: "pantas diingat.",
    landingDescription: "Maem adalah tempat mungil untuk menyimpan masakan yang ingin kamu buat lagi—beserta cerita kecil di baliknya.",
    makeRecipeBox: "Buat kotak resepmu",
    seeHowItWorks: "Lihat cara kerjanya",
    freeToStart: "Gratis untuk mulai · resep tetap privat",
    bowlOfNoodles: "Semangkuk mi",
    stickerMadeTo: "untuk",
    stickerBeShared: "disimpan",
    stickerWithYourself: "buat dirimu",
    sampleRecipe: "Mi mentega miso",
    savedTwoMinutes: "disimpan 2 menit lalu",
    keepGoodOnes: "Semua yang kamu butuhkan untuk menyimpan resep favorit tetap dekat.",
    snapDish: "Foto masakan",
    addLittleNote: "Tambahkan catatan kecil",
    findItLater: "Temukan lagi nanti",
    featureEyebrow: "Sistem kecil untuk masakan enak.",
    featureHeading: "Simpan resep favorit tetap dekat.",
    featureDescription: "Foto masakannya, tinggalkan petunjuk kecil, lalu temukan lagi saat ingin membuatnya.",
    featureHint: "Ketuk panel untuk membukanya",
    featureCaptureTitle: "Tangkap momennya",
    featureCaptureBody: "Foto singkat memberi dirimu di masa depan titik awal.",
    featureNoteTitle: "Tinggalkan petunjuk",
    featureNoteBody: "Jalan pintas, bahan pengganti, atau siapa yang minta tambah.",
    featureFindTitle: "Temukan lagi",
    featureFindBody: "Cari catatannya, bukan hanya judulnya, saat waktu makan tiba.",
    marqueeAria: "Kebiasaan resep Maem",
    actionEyebrow: "Dirimu di masa depan akan berterima kasih.",
    actionHeading: "Sediakan tempat untuk resep yang ingin kamu buat lagi.",
    actionBody: "Privat sejak awal, siap kapan pun kamu membutuhkannya.",
    actionCta: "Buka kotak resepmu",
    footerNote: "Ruang tenang untuk masakan enak.",
    keepGoodStuff: "Simpan yang",
    goodStuff: "berharga.",
    ownQuietCorner: "Ruang kecil milikmu untuk resep yang layak dibuat lagi.",
    homeForBites: "Rumah kecil untuk masakan terbaikmu.",
    welcomeToMaem: "selamat datang di maem",
    setTable: "Mari mulai.",
    authSub: "Buat kotak resep pribadi, atau lanjutkan dari terakhir kali.",
    firebaseWarning: "Tambahkan konfigurasi Firebase untuk mengaktifkan akun.",
    createRecipeBox: "Buat kotak resep",
    signInToMaem: "Masuk ke Maem",
    emailAddress: "Alamat email",
    password: "Kata sandi",
    passwordPlaceholder: "Minimal 6 karakter",
    oneMoment: "Sebentar…",
    backChoices: "← Kembali ke pilihan",
    fewGoodThings: "beberapa hal baik",
    bulletPhoto: "Simpan foto beserta cerita di baliknya",
    bulletSearch: "Cari catatanmu saat waktunya makan",
    bulletOwn: "Resepmu tetap milikmu",
    backHome: "← Kembali ke beranda",
    authErrorEmailExists: "Email itu sudah punya kotak resep. Coba masuk.",
    authErrorCredentials: "Email atau kata sandinya belum benar.",
    authErrorWeakPassword: "Buat kata sandi minimal 6 karakter.",
    authErrorEmail: "Masukkan alamat email yang valid.",
    authErrorGeneral: "Kami belum bisa menyelesaikan permintaan itu. Periksa koneksi lalu coba lagi.",
    authErrorRequired: "Masukkan email dan kata sandi untuk melanjutkan.",
    recipeBox: "kotak resepmu",
    goodOnes: "Yang enak-enak.",
    recipesSaved: "{count} resep tersimpan untuk nanti.",
    signOut: "Keluar",
    account: "Akunmu",
    addRecipe: "Tambah resep",
    searchPlaceholder: "Cari resepmu...",
    searchRecipes: "Cari resep",
    clearSearch: "Hapus pencarian",
    recipeFilters: "Filter resep",
    allRecipes: "Semua resep",
    withPhotos: "Dengan foto",
    notesOnly: "Tanpa foto",
    recentlySaved: "baru disimpan",
    withPhoto: "dengan foto",
    noteOnly: "catatan saja",
    saved: "Disimpan {date}",
    noRecipes: "Resep tidak ditemukan",
    noRecipesBody: "Coba kata lain, atau simpan masakan baru untuk dirimu di masa depan.",
    clearFilters: "Hapus filter",
    editRecipe: "edit resep",
    newRecipe: "resep baru",
    tellAboutLine1: "Ceritakan tentang",
    tellAboutLine2: "masakan ini.",
    formIntro: "Foto membantu mengingat. Catatan kecil membuatnya benar-benar milikmu.",
    cancel: "Batal",
    dishPreview: "Pratinjau masakanmu",
    replacePhoto: "Ganti foto",
    remove: "Hapus",
    gotPhoto: "Ada fotonya?",
    photoPrompt: "Ambil foto, pilih dari galeri, atau lewati dulu.",
    takePhoto: "Ambil foto",
    chooseFromLibrary: "Pilih dari galeri",
    yourDishPreview: "Pratinjau masakanmu",
    recipeTitle: "Judul resep",
    yourNote: "Catatanmu",
    titlePlaceholder: "contoh: saus andalan hari Minggu",
    notePlaceholder: "Apa yang perlu kamu ingat lain kali? Bahan, jalan pintas, atau siapa yang menyukainya...",
    invalidPhotoType: "Pilih gambar JPEG, PNG, atau WebP.",
    photoTooLarge: "Ukuran gambar terlalu besar. Pilih gambar di bawah 12 MB.",
    photoCompressError: "Foto itu belum bisa kami kompres. Coba gambar yang lebih kecil.",
    titleRequired: "Beri judul resep ini dulu.",
    noteRequired: "Tambahkan catatan agar kamu tahu cara membuatnya lagi.",
    saveError: "Resep belum bisa disimpan. Periksa koneksi lalu coba lagi.",
    saveChanges: "Simpan perubahan",
    saveRecipe: "Simpan resep",
    saving: "Menyimpan…",
    allRecipesBack: "← Semua resep",
    savedAt: "tersimpan {date}",
    editNote: "Edit catatan",
    share: "Bagikan",
    deleteRecipe: "Hapus resep",
    recipeNotFound: "Resep tidak ditemukan",
    recipeUnavailable: "Resep ini mungkin sudah dihapus atau belum tersedia tanpa koneksi.",
    backToRecipes: "Kembali ke resep",
    detailFooter: "Dibuat dengan perhatian, disimpan untuk saat ingin membuatnya lagi.",
    justChecking: "sekadar memastikan",
    removeThis: "Hapus resep ini?",
    removeConfirm: "“{title}” akan dihapus dari kotak resepmu. Tindakan ini tidak bisa dibatalkan.",
    keepIt: "Biarkan",
    removeRecipe: "Hapus resep",
    recipeLinkCopied: "Tautan resep disalin",
    pageNotFound: "Halaman tidak ditemukan",
    pageMoved: "Halaman itu sudah berpindah.",
    languageLabel: "Bahasa tampilan",
    languageEnglish: "English",
    languageIndonesian: "Bahasa Indonesia",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

function detectLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (saved && !window.localStorage.getItem(STORAGE_KEY)) window.localStorage.setItem(STORAGE_KEY, saved);
  if (saved === "en" || saved === "id") return saved;
  const locales = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  return locales.some((locale) => locale.toLowerCase().startsWith("id")) ? "id" : "en";
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (vars && key in vars ? String(vars[key]) : match));
}

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };
  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key, vars) => interpolate(translations[language][key], vars),
  }), [language]);

  useEffect(() => {
    document.documentElement.lang = language === "id" ? "id" : "en";
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n();
  return (
    <div className="language-switch" role="group" aria-label={t("languageLabel")}>
      <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"} aria-label={t("languageEnglish")}>EN</button>
      <span aria-hidden="true">·</span>
      <button type="button" className={language === "id" ? "active" : ""} onClick={() => setLanguage("id")} aria-pressed={language === "id"} aria-label={t("languageIndonesian")}>ID</button>
    </div>
  );
}
