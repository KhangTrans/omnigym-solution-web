import { Dumbbell } from "lucide-react";
import type { ReactNode } from "react";
import heroImg from "../assets/hero-gym.jpg";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  badge: string;
}

export function AuthShell({ title, subtitle, children, footer, badge }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground">
      {/* Left: form */}
      <div className="flex flex-col px-6 py-10 sm:px-10 lg:px-16 overflow-y-auto">
        <div className="flex items-center gap-2 font-bold text-lg w-fit">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gradient-primary)] text-white shadow-[var(--shadow-card)]">
            <Dumbbell className="h-5 w-5" />
          </span>
          <span className="tracking-tight">OmniGym</span>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {badge}
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

            <div className="mt-8">{children}</div>

            <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} OmniGym. All rights reserved.
        </p>
      </div>

      {/* Right: visual */}
      <div className="relative hidden lg:block overflow-hidden bg-primary/10">
        <img
          src={heroImg}
          alt="Athletes training at OmniGym gym"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/70 via-primary/30 to-transparent" />
        <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-40" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-end p-16 text-center">
          <div className="max-w-md space-y-8 backdrop-blur-md bg-white/10 p-8 rounded-2xl border border-white/20 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Unlock your potential
              </h2>
              <p className="text-white/80 text-lg">
                Join our premium community and reach your fitness goals faster.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Active Members', value: '12K+' },
                { label: 'Expert Coaches', value: '50+' },
                { label: 'Daily Classes', value: '100+' },
                { label: 'Success Stories', value: '98%' },
              ].map((stat, i) => (
                <div key={i} className="text-left p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60 uppercase tracking-wider font-semibold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
