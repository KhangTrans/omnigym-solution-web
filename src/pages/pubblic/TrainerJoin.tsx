import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Dumbbell,
  LogIn,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/site/ImageUpload";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useBrands } from "@/lib/gym-store";
import { trainerApplicationAPI } from "@/api/trainerApplications";
import { branchesApi } from "@/api/branches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TrainerLevel = "junior" | "senior" | "master";
const TRAINER_LEVEL_OPTIONS: Array<{
  value: TrainerLevel;
  label: string;
  description: string;
}> = [
  { value: "junior", label: "Junior", description: "Kinh nghiệm cơ bản" },
  { value: "senior", label: "Senior", description: "Kinh nghiệm tốt" },
  { value: "master", label: "Master", description: "Chuyên gia/cấp cao" },
];
type BranchOption = {
  id: number;
  branch_name?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  status?: string | null;
};

type ApplicationCertificate = {
  cert_name: string;
  issued_by: string;
  certificate_number: string;
  image_url: string;
  issued_at: string;
  expires_at: string;
};

type TrainerApplication = {
  id: number;
  status: "draft" | "pending" | "approved" | "rejected";
  submitted_at?: string | null;
  rejection_reason?: string | null;
  bio?: string | null;
  specialization?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  address?: string | null;
  years_experience?: number | null;
  hourly_rate?: number | null;
  identity_number?: string | null;
  identity_image_url?: string | null;
  branch_id?: number | null;
  desired_level?: TrainerLevel | null;
  approved_level?: TrainerLevel | null;
  branch?: BranchOption | null;
  certificates?: Array<Partial<ApplicationCertificate>>;
};

const emptyCertificate = (): ApplicationCertificate => ({
  cert_name: "",
  issued_by: "",
  certificate_number: "",
  image_url: "",
  issued_at: "",
  expires_at: "",
});

export default function TrainerJoin() {
  const { brands } = useBrands();
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [application, setApplication] = useState<TrainerApplication | null>(
    null,
  );
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const brand = brands.find((b) => b.id === "omnigym") ?? brands[0] ?? null;

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    avatar_url: "",
    phone_number: "",
    bio: "",
    specialization: "",
    address: "",
    branch_id: "",
    desired_level: "junior" as TrainerLevel,
    years_experience: 0,
    hourly_rate: 0,
    identity_number: "",
    identity_image_url: "",
    certificates: [emptyCertificate()],
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    async function fetchBranches() {
      try {
        setLoadingBranches(true);
        const response = await branchesApi.getAll({ status: "active" });
        const raw = response.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.branches)
              ? raw.branches
              : Array.isArray(raw?.data?.branches)
                ? raw.data.branches
                : Array.isArray(raw?.items)
                  ? raw.items
                  : [];
        setBranches(list.filter((branch: BranchOption) => branch?.id));
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Không thể tải danh sách chi nhánh.",
        );
      } finally {
        setLoadingBranches(false);
      }
    }
    fetchBranches();
  }, []);

  useEffect(() => {
    if (!form.branch_id && branches.length === 1) {
      setField("branch_id", String(branches[0].id));
    }
  }, [branches, form.branch_id]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      full_name:
        f.full_name ||
        user.full_name ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: f.email || user.email || "",
      phone_number: f.phone_number || user.phone_number || user.phone || "",
      avatar_url: f.avatar_url || user.avatar_url || user.avatar || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!loaded || !user) return;

    async function fetchApplication() {
      try {
        setCheckingApplication(true);
        const response = await trainerApplicationAPI.getMe();
        const app = response.data.data as TrainerApplication | null;
        setApplication(app);

        if (app && (app.status === "draft" || app.status === "rejected")) {
          prefillFromApplication(app);
        }
      } catch {
        setApplication(null);
      } finally {
        setCheckingApplication(false);
      }
    }

    fetchApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, user]);

  function prefillFromApplication(app: TrainerApplication) {
    setForm((f) => ({
      ...f,
      avatar_url: app.avatar_url || f.avatar_url,
      phone_number: app.phone_number || f.phone_number,
      bio: app.bio || "",
      specialization: app.specialization || "",
      address: app.address || "",
      branch_id: app.branch_id ? String(app.branch_id) : f.branch_id,
      desired_level: app.desired_level || f.desired_level,
      years_experience: Number(app.years_experience) || 0,
      hourly_rate: Number(app.hourly_rate) || 0,
      identity_number: app.identity_number || "",
      identity_image_url: app.identity_image_url || "",
      certificates: app.certificates?.length
        ? app.certificates.map((cert) => ({
            cert_name: cert.cert_name || "",
            issued_by: cert.issued_by || "",
            certificate_number: cert.certificate_number || "",
            image_url: cert.image_url || "",
            issued_at: cert.issued_at
              ? String(cert.issued_at).slice(0, 10)
              : "",
            expires_at: cert.expires_at
              ? String(cert.expires_at).slice(0, 10)
              : "",
          }))
        : f.certificates,
    }));
  }

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setCertificateField<K extends keyof ApplicationCertificate>(
    index: number,
    key: K,
    value: ApplicationCertificate[K],
  ) {
    setForm((f) => ({
      ...f,
      certificates: f.certificates.map((cert, i) =>
        i === index ? { ...cert, [key]: value } : cert,
      ),
    }));
  }

  function addCertificate() {
    setForm((f) => ({
      ...f,
      certificates: [...f.certificates, emptyCertificate()],
    }));
  }

  function removeCertificate(index: number) {
    setForm((f) => ({
      ...f,
      certificates:
        f.certificates.length === 1
          ? f.certificates
          : f.certificates.filter((_, i) => i !== index),
    }));
  }

  function buildDraftPayload() {
    return {
      branch_id: form.branch_id ? Number(form.branch_id) : undefined,
      desired_level: form.desired_level,
      bio: form.bio.trim(),
      specialization: form.specialization.trim(),
      avatar_url: form.avatar_url || undefined,
      phone_number: form.phone_number.trim(),
      address: form.address.trim(),
      years_experience: Number(form.years_experience) || 0,
      hourly_rate: Number(form.hourly_rate) || 0,
      identity_number: form.identity_number.trim(),
      identity_image_url: form.identity_image_url || undefined,
      certificates: form.certificates.map((cert) => ({
        cert_name: cert.cert_name.trim(),
        issued_by: cert.issued_by.trim(),
        certificate_number: cert.certificate_number.trim(),
        image_url: cert.image_url || undefined,
        issued_at: cert.issued_at || null,
        expires_at: cert.expires_at || null,
      })),
    };
  }

  async function saveDraft() {
    if (savingDraft || submitting) return;

    if (!user) return toast.error("Please sign in to save draft.");

    try {
      setSavingDraft(true);
      const response =
        await trainerApplicationAPI.saveDraft(buildDraftPayload());
      setApplication(response.data.data);
      toast.success("Draft saved.");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Could not save trainer draft.";
      toast.error(message);
    } finally {
      setSavingDraft(false);
    }
  }

  async function submit() {
    if (submitting) return;

    if (!user) return toast.error("Please sign in to apply.");
    if (!brand) return toast.error("No gym is available right now.");
    if (!form.branch_id)
      return toast.error("Vui lòng chọn chi nhánh muốn ứng tuyển.");
    if (!form.desired_level)
      return toast.error("Vui lòng chọn level muốn ứng tuyển.");
    if (!form.full_name.trim()) return toast.error("Full name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.avatar_url) return toast.error("Profile photo is required");
    if (!form.phone_number.trim())
      return toast.error("Phone number is required");
    if (!form.specialization.trim())
      return toast.error("Specialization is required");
    if (!form.address.trim()) return toast.error("Address is required");
    if (!form.identity_number.trim())
      return toast.error("Identity number is required");
    if (!form.identity_image_url)
      return toast.error("Identity image is required");

    for (const [index, cert] of form.certificates.entries()) {
      const label = `Certificate #${index + 1}`;
      if (!cert.cert_name.trim())
        return toast.error(`${label}: certificate name is required`);
      if (!cert.issued_by.trim())
        return toast.error(`${label}: issuing organization is required`);
      if (!cert.certificate_number.trim())
        return toast.error(`${label}: certificate number is required`);
      if (!cert.expires_at)
        return toast.error(`${label}: expiry date is required`);
      if (!cert.image_url)
        return toast.error(`${label}: certificate image is required`);
    }

    const payload = {
      branch_id: Number(form.branch_id),
      desired_level: form.desired_level,
      bio: form.bio.trim(),
      specialization: form.specialization.trim(),
      avatar_url: form.avatar_url,
      phone_number: form.phone_number.trim(),
      address: form.address.trim(),
      years_experience: Number(form.years_experience) || 0,
      hourly_rate: Number(form.hourly_rate) || 0,
      identity_number: form.identity_number.trim(),
      identity_image_url: form.identity_image_url,
      certificates: form.certificates.map((cert) => ({
        cert_name: cert.cert_name.trim(),
        issued_by: cert.issued_by.trim(),
        certificate_number: cert.certificate_number.trim(),
        image_url: cert.image_url,
        issued_at: cert.issued_at || null,
        expires_at: cert.expires_at,
      })),
    };

    try {
      setSubmitting(true);
      const response = await trainerApplicationAPI.submit(payload);
      setApplication(response.data.data);
      toast.success(
        "Application submitted. Staff will review your trainer profile soon.",
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Could not submit trainer application.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const showForm =
    !application ||
    application.status === "draft" ||
    application.status === "rejected";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>

        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Đăng Ký Trở Thành Huấn Luyện Viên Cá Nhân
          </h1>
          <p className="mt-2 text-muted-foreground">
            Gửi đơn đăng ký và chứng chỉ huấn luyện viên của bạn. Sau khi nhân
            viên phê duyệt, hồ sơ huấn luyện viên của bạn sẽ được kích hoạt.
          </p>
        </div>

        {loaded && !user ? (
          <Card className="mt-10">
            <CardContent className="space-y-4 p-8 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-muted">
                <LogIn className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Sign in first</h2>
              <p className="text-sm text-muted-foreground">
                You need an account before applying as a trainer.
              </p>
              <div className="flex justify-center gap-2">
                <Button asChild variant="outline">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  <Link to="/register">Create account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : checkingApplication ? (
          <LoadingApplicationCard />
        ) : application?.status === "pending" ? (
          <Card className="mt-10 border-border/80 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <CardContent className="p-8">
              <div className="mx-auto max-w-xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Đang chờ duyệt
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  Hồ sơ Trainer đã được gửi
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  OmniGym đang kiểm tra thông tin và chứng chỉ của bạn. Trong
                  thời gian này, bạn không cần gửi lại hồ sơ.
                </p>

                <div className="mt-6 space-y-3 rounded-2xl bg-muted/40 p-5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Mã hồ sơ</span>
                    <span className="font-medium">#{application.id}</span>
                  </div>
                  {application.submitted_at && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Ngày gửi</span>
                      <span className="font-medium">
                        {new Date(application.submitted_at).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Nếu hồ sơ cần bổ sung, staff sẽ từ chối kèm lý do để bạn chỉnh
                  sửa và gửi lại.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : application?.status === "approved" ? (
          <StatusCard
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="Bạn đã được duyệt Trainer"
            description="Tài khoản Trainer của bạn đã được kích hoạt. Dashboard Trainer sẽ được kết nối ở bước tiếp theo."
            tone="success"
          >
            <Button onClick={() => navigate("/")}>Tạm quay về trang chủ</Button>
          </StatusCard>
        ) : showForm ? (
          <Card className="mt-10 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <CardContent className="space-y-8 p-6">
              {application?.status === "rejected" && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <XCircle className="h-4 w-4" /> Đơn của bạn đã bị từ chối
                  </div>
                  <p className="mt-1">
                    Lý do:{" "}
                    {application.rejection_reason || "Không có lý do cụ thể."}
                  </p>
                  <p className="mt-1">
                    Vui lòng cập nhật thông tin và gửi lại hồ sơ.
                  </p>
                </div>
              )}

              {brand && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-10 w-10 rounded-md object-cover border border-border"
                  />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Applying to
                    </div>
                    <div className="font-semibold">{brand.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Chọn chi nhánh cụ thể bên dưới
                    </div>
                  </div>
                </div>
              )}

              <Section
                title="Account contact"
                description="Thông tin cơ bản được sao chép từ tài khoản người dùng của bạn."
              >
                <div className="sm:col-span-2">
                  <Label>Avatar / profile photo *</Label>
                  <div className="mt-1.5">
                    <ImageUpload
                      value={form.avatar_url}
                      onChange={(v) => setField("avatar_url", v)}
                    />
                  </div>
                </div>
                <Field label="Full name *">
                  <Input
                    value={form.full_name}
                    onChange={(e) => setField("full_name", e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </Field>
                <Field label="Phone number *">
                  <Input
                    value={form.phone_number}
                    onChange={(e) => setField("phone_number", e.target.value)}
                    placeholder="09xx xxx xxx"
                  />
                </Field>
                <Field label="Email *" full>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="you@email.com"
                  />
                </Field>
              </Section>

              <Section
                title="Trainer application"
                description="These fields map to trainer_applications."
              >
                <Field label="Chi nhánh muốn ứng tuyển *" full>
                  <Select
                    value={form.branch_id}
                    onValueChange={(value) => setField("branch_id", value)}
                    disabled={loadingBranches}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingBranches
                            ? "Đang tải chi nhánh..."
                            : "Chọn chi nhánh OmniGym"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.length ? (
                        branches.map((branch) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.branch_name || `Chi nhánh #${branch.id}`}
                            {branch.district || branch.province
                              ? ` - ${[branch.district, branch.province].filter(Boolean).join(", ")}`
                              : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-branches" disabled>
                          Chưa có chi nhánh active
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {!loadingBranches && branches.length === 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      Chưa tìm thấy chi nhánh active. Vui lòng tạo/kích hoạt chi
                      nhánh trong trang quản trị.
                    </p>
                  )}
                </Field>
                <Field label="Level muốn ứng tuyển *" full>
                  <Select
                    value={form.desired_level}
                    onValueChange={(value) =>
                      setField("desired_level", value as TrainerLevel)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn level mong muốn" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINER_LEVEL_OPTIONS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label} - {level.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Đây là level mong muốn. Level chính thức sẽ do quản lý chi
                    nhánh duyệt.
                  </p>
                </Field>
                <Field label="Specialization *" full>
                  <Input
                    value={form.specialization}
                    onChange={(e) => setField("specialization", e.target.value)}
                    placeholder="Strength training, Weight loss, Yoga..."
                  />
                </Field>
                <Field label="Bio" full>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setField("bio", e.target.value)}
                    placeholder="Tell members about your coaching style and experience."
                    rows={3}
                  />
                </Field>
                <Field label="Address *" full>
                  <Input
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Street, district, city"
                  />
                </Field>
                <Field label="Years of experience">
                  <Input
                    type="number"
                    min={0}
                    value={form.years_experience}
                    onChange={(e) =>
                      setField(
                        "years_experience",
                        Number(e.target.value) as never,
                      )
                    }
                  />
                </Field>
                <Field label="Hourly rate">
                  <Input
                    type="number"
                    min={0}
                    value={form.hourly_rate}
                    onChange={(e) =>
                      setField("hourly_rate", Number(e.target.value) as never)
                    }
                  />
                </Field>
              </Section>

              <Section
                title="Identity verification"
                description="These fields map to identity_number and identity_image_url."
              >
                <Field label="Identity / passport number *">
                  <Input
                    value={form.identity_number}
                    onChange={(e) =>
                      setField("identity_number", e.target.value)
                    }
                    placeholder="0123456789"
                  />
                </Field>
                <Field label="Identity image *">
                  <ImageUpload
                    value={form.identity_image_url}
                    onChange={(v) => setField("identity_image_url", v)}
                  />
                </Field>
              </Section>

              <section className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Certificates</h2>
                    <p className="text-sm text-muted-foreground">
                      These records will be saved into
                      trainer_application_certificates.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCertificate}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add certificate
                  </Button>
                </div>

                <div className="space-y-5">
                  {form.certificates.map((cert, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border bg-muted/20 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-semibold">
                          Certificate #{index + 1}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertificate(index)}
                          disabled={form.certificates.length === 1}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Certificate name *">
                          <Input
                            value={cert.cert_name}
                            onChange={(e) =>
                              setCertificateField(
                                index,
                                "cert_name",
                                e.target.value,
                              )
                            }
                            placeholder="NASM-CPT"
                          />
                        </Field>
                        <Field label="Issued by *">
                          <Input
                            value={cert.issued_by}
                            onChange={(e) =>
                              setCertificateField(
                                index,
                                "issued_by",
                                e.target.value,
                              )
                            }
                            placeholder="NASM"
                          />
                        </Field>
                        <Field label="Certificate number *">
                          <Input
                            value={cert.certificate_number}
                            onChange={(e) =>
                              setCertificateField(
                                index,
                                "certificate_number",
                                e.target.value,
                              )
                            }
                            placeholder="Cert ID"
                          />
                        </Field>
                        <Field label="Issued date">
                          <Input
                            type="date"
                            value={cert.issued_at}
                            onChange={(e) =>
                              setCertificateField(
                                index,
                                "issued_at",
                                e.target.value,
                              )
                            }
                          />
                        </Field>
                        <Field label="Expiry date *" full>
                          <Input
                            type="date"
                            value={cert.expires_at}
                            onChange={(e) =>
                              setCertificateField(
                                index,
                                "expires_at",
                                e.target.value,
                              )
                            }
                          />
                        </Field>
                        <Field label="Certificate image *" full>
                          <ImageUpload
                            value={cert.image_url}
                            onChange={(v) =>
                              setCertificateField(index, "image_url", v)
                            }
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  disabled={savingDraft || submitting}
                  className="bg-background text-foreground hover:bg-background hover:text-foreground hover:border-input"
                >
                  {savingDraft ? "Saving draft..." : "Save draft"}
                </Button>
                <Button
                  onClick={submit}
                  disabled={submitting || savingDraft}
                  className="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  {submitting
                    ? "Submitting..."
                    : application?.status === "rejected"
                      ? "Resubmit application"
                      : "Submit application"}
                  {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

function LoadingApplicationCard() {
  return (
    <Card className="mt-10 border-0 shadow-none animate-in fade-in-0 duration-300">
      <CardContent className="p-10 text-center">
        <div className="mx-auto h-9 w-9 rounded-full border-2 border-muted border-t-foreground/70 animate-spin" />
        <p className="mt-4 text-sm text-muted-foreground">
          Đang tải trạng thái hồ sơ...
        </p>
      </CardContent>
    </Card>
  );
}

function StatusCard({
  icon,
  title,
  description,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "muted" | "warning" | "success";
  children?: React.ReactNode;
}) {
  const toneClass =
    tone === "warning"
      ? "bg-yellow-100 text-yellow-700"
      : tone === "success"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-muted text-muted-foreground";
  return (
    <Card className="mt-10 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <CardContent className="space-y-4 p-8 text-center">
        <div
          className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${toneClass}`}
        >
          {icon}
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {children}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
