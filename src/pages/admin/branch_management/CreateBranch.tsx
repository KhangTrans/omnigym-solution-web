import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, ArrowLeft, Loader2, Upload, ImageIcon } from "lucide-react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { branchesApi } from "@/api/branches";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { toast } from "sonner";
import { useProvinces } from "@/lib/vn-locations";
import { authApi } from "@/api/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const branchSchema = z.object({
  partner_id: z.number().min(1, "Partner ID is required"),
  branch_name: z.string().min(2, "Tên chi nhánh phải có ít nhất 2 ký tự"),
  address: z.string().min(5, "Địa chỉ phải có ít nhất 5 ký tự"),
  province: z.string().min(1, "Tỉnh/Thành phố là bắt buộc"),
  district: z.string().min(1, "Quận/Huyện là bắt buộc"),
  hotline: z.string().min(10, "Hotline không hợp lệ"),
  opening_house: z.string().min(1, "Giờ mở cửa là bắt buộc"),
  image_url: z.string().min(1, "Ảnh chính là bắt buộc"),
  images: z.array(z.object({
    image_url: z.string(),
    is_cover: z.boolean(),
    sort_order: z.number(),
  })),
  facilities: z.array(z.object({
    facility_name: z.string().min(1, "Tên tiện ích không được để trống"),
    description: z.string().optional(),
    icon_url: z.string().optional(),
  })),
});

type BranchFormValues = z.infer<typeof branchSchema>;

export default function CreateBranch() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null); // 'main' or index
  const { provinces, loading: loadingProvinces } = useProvinces();

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      partner_id: 0, 
      branch_name: "",
      address: "",
      province: "",
      district: "",
      hotline: "",
      opening_house: "06:00 - 22:00",
      image_url: "",
      images: [],
      facilities: [],
    },
  });

  useEffect(() => {
    const fetchPartnerProfile = async () => {
      try {
        const response = await authApi.getMe();
        const user = response.data.user || response.data;
        if (user.partner?.id) {
          form.setValue("partner_id", Number(user.partner.id));
        } else {
          console.warn("User is not a partner or partner info missing");
          form.setValue("partner_id", 1);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        form.setValue("partner_id", 1);
      }
    };
    fetchPartnerProfile();
  }, [form]);

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const { fields: facilityFields, append: appendFacility, remove: removeFacility } = useFieldArray({
    control: form.control,
    name: "facilities",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadKey = index !== undefined ? `detail-${index}` : 'main';

    try {
      setIsUploading(uploadKey);
      const url = await uploadImageToCloudinary(file);
      
      if (index !== undefined) {
        form.setValue(`images.${index}.image_url`, url);
      } else {
        form.setValue("image_url", url);
      }
      toast.success("Upload ảnh thành công");
    } catch (err) {
      console.error(err);
      toast.error("Upload ảnh thất bại. Kiểm tra cấu hình Cloudinary!");
    } finally {
      setIsUploading(null);
    }
  };

  const onSubmit = async (values: BranchFormValues) => {
    try {
      setIsSubmitting(true);
      await branchesApi.create(values); 
      toast.success("Tạo chi nhánh thành công!");
      navigate("/admin/branch-management");
    } catch (err: unknown) {
      console.error("Create branch error:", err);
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || "Đã có lỗi xảy ra khi tạo chi nhánh";
      if (axiosError.response?.status === 401) {
        toast.error("Vui lòng đăng nhập lại để thực hiện tác vụ này");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Thêm chi nhánh mới</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Các thông tin bắt buộc để định danh chi nhánh</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="branch_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên chi nhánh*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: OmniGym Quận 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tỉnh/Thành phố*</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("district", "");
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingProvinces ? "Đang tải..." : "Chọn tỉnh thành"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {provinces.map((p) => (
                            <SelectItem key={p.code} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => {
                    const selectedProvince = provinces.find(
                      (p) => p.name === form.watch("province"),
                    );
                    return (
                      <FormItem>
                        <FormLabel>Quận/Huyện*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!form.watch("province")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn quận huyện" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedProvince?.districts.map((d) => (
                              <SelectItem key={d.code} value={d.name}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ cụ thể*</FormLabel>
                    <FormControl>
                      <Input placeholder="Số 123, Đường ABC..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="hotline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hotline*</FormLabel>
                      <FormControl>
                        <Input placeholder="0901234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="opening_house"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giờ mở cửa*</FormLabel>
                      <FormControl>
                        <Input placeholder="06:00 - 22:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh chi nhánh</CardTitle>
              <CardDescription>Ảnh đại diện và thư viện ảnh chi tiết</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Ảnh đại diện chính</FormLabel>
                    <div className="flex items-center gap-4">
                      {field.value && (
                        <img
                          src={field.value}
                          alt="Preview"
                          className="h-20 w-32 rounded-md object-cover border"
                        />
                      )}
                      <div className="relative">
                        <Button variant="outline" type="button" disabled={!!isUploading} className="relative">
                          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          Upload ảnh
                          <input
                            type="file"
                            className="absolute inset-0 cursor-pointer opacity-0"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e)}
                          />
                        </Button>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Thư viện ảnh</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendImage({ image_url: "", is_cover: false, sort_order: imageFields.length + 1 })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Thêm ảnh
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {imageFields.map((field, index) => (
                    <div key={field.id} className="relative rounded-md border p-4 space-y-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 text-destructive"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-3">
                        {form.watch(`images.${index}.image_url`) && (
                          <img
                            src={form.watch(`images.${index}.image_url`)}
                            alt=""
                            className="h-16 w-16 rounded object-cover"
                          />
                        )}
                        <div className="relative flex-1">
                          <Button variant="outline" size="sm" type="button" disabled={!!isUploading} className="w-full">
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Chọn ảnh"}
                            <input
                              type="file"
                              className="absolute inset-0 cursor-pointer opacity-0"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, index)}
                            />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`cover-${index}`}
                          {...form.register(`images.${index}.is_cover`)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`cover-${index}`} className="text-sm">Ảnh bìa thư viện</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiện ích chi nhánh</CardTitle>
              <CardDescription>Các dịch vụ và tiện ích có tại chi nhánh</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {facilityFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 items-start gap-4 rounded-md border p-4 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <FormField
                        control={form.control}
                        name={`facilities.${index}.facility_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Tên tiện ích (Bể bơi, Wifi...)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="md:col-span-6">
                      <FormField
                        control={form.control}
                        name={`facilities.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Mô tả ngắn" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end md:col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeFacility(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => appendFacility({ facility_name: "", description: "", icon_url: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Thêm tiện ích
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo chi nhánh
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
