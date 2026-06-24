import { useState, useEffect } from "react";
import { Menu, X, Dumbbell, Globe, LogOut, User as UserIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import logoOmnigym from "@/assets/logo-omnigym.png";
import { NotificationBell } from "../NotificationBell";

const useLang = () => ({
  lang: "vi",
  setLang: (l: string) => console.log(l),
  t: (key: string) => {
    const translations: Record<string, string> = {
      "nav.home": "Trang chủ",
      "nav.pricing": "Bảng giá",
      "nav.contact": "Liên hệ",
      "nav.gyms": "Phòng tập",
      "nav.blog": "Blog",
      "nav.faq": "FAQ",
      "nav.signin": "Đăng nhập",
      "nav.join": "Tham gia ngay",
      "nav.signout": "Đăng xuất",
    };
    return translations[key] || key;
  },
});

const useCurrentUser = () => {
  const [user, setUser] = useState<{ avatar_url?: string; full_name?: string; email?: string; role?: string; role_id?: number } | null>(null);

  const checkUser = () => {
    const userData = localStorage.getItem("user");
    if (userData && userData !== "undefined" && userData !== "null") {
      try {
        const parsedUser = JSON.parse(userData);
        const avatar = parsedUser.avatar_url && parsedUser.avatar_url !== "null" && parsedUser.avatar_url !== ""
          ? parsedUser.avatar_url
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(parsedUser.full_name || 'User')}&background=4F8A74&color=fff`;

        setUser({
          avatar_url: avatar,
          full_name: parsedUser.full_name || "Người dùng",
          email: parsedUser.email,
          role: parsedUser.role,
          role_id: parsedUser.role_id
        });
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('user-login', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('user-login', checkUser);
    };
  }, []);

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      window.location.href = "/";
    }
  };

  return { user, signOut };
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const { user, signOut } = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("#home");

  const links = [
    { label: t("nav.home"), href: "#home" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: t("nav.contact"), href: "#contact" },
    { label: t("nav.faq"), href: "#faq" },
  ];

  // Helper to determine if a link is active
  const isActive = (href: string) => {
    if (href.startsWith("/")) {
      return location.pathname === href || location.pathname.startsWith(href + "/");
    }
    if (location.pathname === "/") {
      return activeSection === href;
    }
    return false;
  };

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sectionIds = ["home", "pricing", "contact", "faq"];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(`#${id}`);
            break;
          }
        }
      }
    };

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0.1,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  // Handle initial hash scrolling
  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      setActiveSection(location.hash);
      const element = document.querySelector(location.hash);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, location.hash]);

  const goToSection = (href: string) => {
    setOpen(false);

    if (location.pathname !== "/") {
      navigate({ pathname: "/", hash: href });
      return;
    }

    window.history.replaceState(null, "", href);
    setActiveSection(href);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="navbar-blur-in sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => goToSection("#home")} className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white shadow-md">
            <img src={logoOmnigym} alt="OmniGym logo" className="h-full w-full object-cover" />
          </span>
          <span className="tracking-tight">OmniGym</span>
        </button>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <button
                key={l.href}
                type="button"
                onClick={() => goToSection(l.href)}
                className={`group relative inline-flex items-center justify-center rounded-full px-3 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5 ${
                  active ? "text-primary font-medium" : "text-muted-foreground font-normal hover:text-foreground"
                }`}
              >
                <span
                  className={`absolute bottom-1.5 left-1/2 h-px -translate-x-1/2 bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-300 ${
                    active ? "w-[70%]" : "w-0 group-hover:w-[70%]"
                  }`}
                  aria-hidden
                />
                <span className="relative">{l.label}</span>
              </button>
            );
          })}
          <Link
            to="/gyms"
            className={`group relative inline-flex items-center justify-center rounded-full px-3 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5 ${
              isActive("/gyms") ? "text-primary font-medium" : "text-muted-foreground font-normal hover:text-foreground"
            }`}
          >
            <span
              className={`absolute bottom-1.5 left-1/2 h-px -translate-x-1/2 bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-300 ${
                isActive("/gyms") ? "w-[70%]" : "w-0 group-hover:w-[70%]"
              }`}
              aria-hidden
            />
            <span className="relative">{t("nav.gyms")}</span>
          </Link>
          <Link
            to="/blog"
            className={`group relative inline-flex items-center justify-center rounded-full px-3 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5 ${
              isActive("/blog") ? "text-primary font-medium" : "text-muted-foreground font-normal hover:text-foreground"
            }`}
          >
            <span
              className={`absolute bottom-1.5 left-1/2 h-px -translate-x-1/2 bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-300 ${
                isActive("/blog") ? "w-[70%]" : "w-0 group-hover:w-[70%]"
              }`}
              aria-hidden
            />
            <span className="relative">{t("nav.blog")}</span>
          </Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <div className="inline-flex items-center gap-0.5 rounded-xl border border-primary/15 bg-white/55 p-0.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-xl">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/5 text-primary">
              <Globe className="h-3 w-3" />
            </span>
            <button onClick={() => setLang("en")} className={`rounded-lg px-2 py-1 transition-all ${lang === "en" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-primary"}`}>EN</button>
            <button onClick={() => setLang("vi")} className={`rounded-lg px-2 py-1 transition-all ${lang === "vi" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-primary"}`}>VI</button>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="group relative flex cursor-pointer items-center gap-2">
                <img src={user.avatar_url} alt={user.full_name} referrerPolicy="no-referrer" className="h-9 w-9 rounded-full border border-white/20 object-cover ring-2 ring-transparent transition-colors group-hover:ring-white/20" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=4F8A74&color=fff`;
                }} />
                <div className="absolute right-0 top-[100%] z-50 hidden w-56 pt-2 group-hover:block">
                  <div className="overflow-hidden rounded-xl bg-background py-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-muted/30 px-4 py-3">
                      <p className="truncate text-sm font-bold text-foreground">{user.full_name}</p>
                      <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary">
                        <UserIcon className="h-4 w-4" />
                        <span className="font-medium">Hồ sơ cá nhân</span>
                      </Link>
                      {(user.role === 'Admin' || [1, 2].includes(user?.role_id ?? 0)) ? (
                        <Link to="/admin" className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary">
                          <Dumbbell className="h-4 w-4" />
                          <span className="font-medium">Trang quản trị</span>
                        </Link>
                      ) : (user.role === 'BranchManager' || user.role === 'Staff' || user.role === 'Partner' || user.role === 'Gym' || [3, 4].includes(user?.role_id ?? 0)) ? (
                        <Link to="/branchmanager" className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary">
                          <Dumbbell className="h-4 w-4" />
                          <span className="font-medium">Khu vực làm việc</span>
                        </Link>
                      ) : null}
                    </div>
                    <div className="mt-1 py-1">
                      <button onClick={signOut} type="button" className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-50 hover:text-red-600">
                        <LogOut className="h-4 w-4" />
                        {t("nav.signout")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">{t("nav.signin")}</Link>
              <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.03]">
                {t("nav.join")}
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          {user && <NotificationBell />}
          <button aria-label="Toggle menu" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col gap-3 px-4 py-4 text-foreground">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <button
                  key={l.href}
                  type="button"
                  onClick={() => goToSection(l.href)}
                  className={`py-2 text-left text-sm font-medium transition-colors ${
                    active ? "text-primary font-semibold" : "text-foreground/85 hover:text-primary"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
            <Link
              to="/gyms"
              onClick={() => setOpen(false)}
              className={`py-2 text-sm font-medium transition-colors ${
                isActive("/gyms") ? "text-primary font-semibold" : "text-foreground/85 hover:text-primary"
              }`}
            >
              {t("nav.gyms")}
            </Link>
            <Link
              to="/blog"
              onClick={() => setOpen(false)}
              className={`py-2 text-sm font-medium transition-colors ${
                isActive("/blog") ? "text-primary font-semibold" : "text-foreground/85 hover:text-primary"
              }`}
            >
              {t("nav.blog")}
            </Link>
            {user ? (
              <div className="mt-2 flex flex-col gap-3 border-t border-border py-2">
                <div className="flex items-center gap-3">
                  <img src={user.avatar_url} alt={user.full_name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full border border-border" onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=4F8A74&color=fff`;
                  }} />
                  <div>
                    <p className="text-sm font-semibold">{user.full_name}</p>
                    <Link to="/profile" onClick={() => setOpen(false)} className="mt-2 flex w-full items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      <UserIcon className="h-4 w-4" />Hồ sơ cá nhân
                    </Link>
                    <button onClick={signOut} type="button" className="mt-2 flex w-full items-center gap-2 py-2 text-sm font-medium text-rose-300">
                      <LogOut className="h-4 w-4" />{t("nav.signout")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-center text-sm font-medium">{t("nav.signin")}</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">{t("nav.join")}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
