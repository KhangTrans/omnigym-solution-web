import { Dumbbell } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 font-bold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Dumbbell className="h-4 w-4" />
          </span>
          OmniGym
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} OmniGym. Tập luyện chăm chỉ, sống khỏe mạnh hơn.</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Bảo mật</a>
          <a href="#" className="hover:text-foreground transition-colors">Điều khoản</a>
          <a href="#contact" className="hover:text-foreground transition-colors">Liên hệ</a>
        </div>
      </div>
    </footer>
  );
}
