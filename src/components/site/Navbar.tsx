import { useState, useEffect } from "react";
import { Menu, X, Dumbbell, Globe, LogOut, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth";

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
        // Ưu tiên dùng avatar_url trực tiếp từ object user
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
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUser();
    // Lắng nghe sự thay đổi của localStorage và sự kiện đăng nhập
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

  const links = [
    { label: t("nav.home"), href: "#home" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: t("nav.contact"), href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md">
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
            to="/gyms"
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

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 group cursor-pointer relative">
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 rounded-full border border-primary/20 hover:border-primary/50 transition-colors object-cover ring-2 ring-transparent group-hover:ring-primary/20"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=4F8A74&color=fff`;
                  }}
                />
                <div className="hidden group-hover:block absolute top-[100%] right-0 pt-2 w-56 z-50">
                  <div className="bg-background rounded-xl shadow-xl py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 bg-muted/30">
                      <p className="text-sm font-bold text-foreground truncate">{user.full_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-medium">{user.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                      >
                        <UserIcon className="h-4 w-4" />
                        <span className="font-medium">Hồ sơ cá nhân</span>
                      </Link>
                      
                      {/* Thêm link Quản trị nếu là Admin, Staff hoặc Partner */}
                      {(user.role === 'Admin' || user.role === 'Staff' || user.role === 'Partner' || user.role === 'Gym' || [1, 2, 3].includes(user?.role_id)) && (
                        <Link
                          to="/admin"
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                        >
                          <Dumbbell className="h-4 w-4" />
                          <span className="font-medium">Trang quản trị</span>
                        </Link>
                      )}
                    </div>

                    <div className="mt-1 py-1">
                      <button
                        onClick={signOut}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-all font-medium"
                      >
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
              <Link to="/login" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                {t("nav.signin")}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-md transition-transform hover:scale-[1.03]"
              >
                {t("nav.join")}
              </Link>
            </>
          )}
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

            {user ? (
              <div className="flex flex-col gap-3 py-2 border-t border-border mt-2">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 rounded-full border border-border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=4F8A74&color=fff`;
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold">{user.full_name}</p>
                    <Link 
                      to="/profile" 
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-2 w-full py-2 hover:text-primary transition-colors"
                    >
                      <UserIcon className="h-4 w-4" />
                      Hồ sơ cá nhân
                    </Link>
                    <button
                      onClick={signOut}
                      type="button"
                      className="text-sm font-medium text-rose-600 flex items-center gap-2 mt-2 w-full py-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("nav.signout")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
                  {t("nav.signin")}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm"
                >
                  {t("nav.join")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
