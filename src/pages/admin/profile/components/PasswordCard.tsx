import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PasswordCardProps {
  changingPass: boolean;
  onSubmit: (passwords: any) => Promise<boolean>;
}

export function PasswordCard({ changingPass, onSubmit }: PasswordCardProps) {
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("Mật khẩu mới không khớp");
    }
    if (passwords.newPassword.length < 6) {
      return toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    const success = await onSubmit(passwords);
    if (success) {
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Bảo mật tài khoản</CardTitle>
            <p className="text-xs text-muted-foreground">Thay đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Mật khẩu hiện tại
                </Label>
                <Input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords(p => ({ ...p, oldPassword: e.target.value }))}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
              </div>
              
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">Quy tắc mật khẩu</h4>
                <ul className="space-y-1.5">
                  <li className="text-xs text-blue-600 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-blue-400" />
                    Tối thiểu 6 ký tự
                  </li>
                  <li className="text-xs text-blue-600 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-blue-400" />
                    Nên bao gồm cả chữ và số
                  </li>
                  <li className="text-xs text-blue-600 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-blue-400" />
                    Không nên trùng với mật khẩu cũ
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  Mật khẩu mới
                </Label>
                <Input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                  Xác nhận mật khẩu mới
                </Label>
                <Input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button 
              type="submit" 
              className="bg-slate-900 hover:bg-slate-800 text-white min-w-[160px] shadow-lg shadow-slate-200"
              disabled={changingPass || !passwords.oldPassword || !passwords.newPassword}
            >
              {changingPass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Cập nhật bảo mật
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
