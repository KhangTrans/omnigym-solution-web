import { useState } from "react";
import { Menu, X, Dumbbell, Globe } from "lucide-react";
import { Link } from "react-router-dom";

// Mocking the i18n and user store for now
const useLang = () => ({
  lang: "vi",
  setLang: (l: string) => console.log(l),
  t: (key: string) => {
    const translations: Record<string, string> = {
      "nav.home": "Trang chủ",
      "nav.pricing": "Bảng giá",
      "nav.contact": "Liên hệ",
      "nav.gyms": "Phòng tập",
      "nav.signin": "Đăng nhập",
      "nav.join": "Tham gia ngay",
    };
    return translations[key] || key;
  },
});

const useCurrentUser = () => ({
  user: null, // Mocking no user logged in
  signOut: () => console.log("Đăng xuất"),
});

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  // const { user, signOut } = useCurrentUser(); // Removed for now to avoid lint errors since user is null

  const links = [
    { label: t("nav.home"), href: "#home" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: t("nav.contact"), href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-2 font-bold text-lg text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md">
            <Dumbbell className="h-5 w-5" />
          </span>
          <span className="tracking-tight">OmniGym</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("nav.gyms")}
          </Link>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5 text-xs font-semibold">
            <Globe className="ml-2 mr-1 h-3.5 w-3.5 text-muted-foreground" />
            <button
              onClick={() => setLang("en")}
              className={`rounded-full px-2.5 py-1 transition-colors ${lang === "en" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-muted-foreground hover:text-foreground"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("vi")}
              className={`rounded-full px-2.5 py-1 transition-colors ${lang === "vi" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-muted-foreground hover:text-foreground"}`}
            >
              VI
            </button>
          </div>

          <Link to="/login" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            {t("nav.signin")}
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-md transition-transform hover:scale-[1.03]"
          >
            {t("nav.join")}
          </Link>
        </div>
        <button
          aria-label="Toggle menu"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="flex flex-col px-4 py-4 gap-3 text-foreground">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium"
              >
                {l.label}
              </a>
            ))}
            <Link to="/login" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
              {t("nav.gyms")}
            </Link>
            <Link to="/login" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
              {t("nav.signin")}
            </Link>
            <Link to="/register" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
              Tham gia ngay
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
