import { createClient } from "@supabase/supabase-js";

type UploadProductImageInput = {
  uri: string;
  sku?: string;
  productName?: string;
  fileName?: string;
  mimeType?: string;
};

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const PRODUCT_IMAGE_BUCKET = (process.env.EXPO_PUBLIC_SUPABASE_BUCKET_PRODUCTS ?? "product-images").trim();

const safeSegment = (value?: string) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const getExtFromName = (fileName?: string) => {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return ext.replace(/[^a-z0-9]/g, "");
};

const getExtFromMime = (mimeType?: string) => {
  if (!mimeType || !mimeType.includes("/")) return null;
  const ext = mimeType.split("/")[1]?.toLowerCase();
  if (!ext) return null;
  if (ext === "jpeg") return "jpg";
  return ext.replace(/[^a-z0-9]/g, "");
};

const buildImagePath = (input: UploadProductImageInput) => {
  const baseName = safeSegment(input.sku) || safeSegment(input.productName) || "product";
  const ext = getExtFromName(input.fileName) || getExtFromMime(input.mimeType) || "jpg";
  const random = Math.random().toString(36).slice(2, 8);
  return `products/${baseName}/${Date.now()}-${random}.${ext}`;
};

const getClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Thiếu cấu hình Supabase. Vui lòng set EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};

export const uploadProductImageToSupabase = async (input: UploadProductImageInput) => {
  const client = getClient();
  const path = buildImagePath(input);

  const response = await fetch(input.uri);
  if (!response.ok) {
    throw new Error("Không thể đọc file ảnh từ thiết bị.");
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = input.mimeType || "image/jpeg";

  const { error: uploadError } = await client.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload ảnh thất bại: ${uploadError.message}`);
  }

  const { data } = client.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error("Không lấy được public URL sau khi upload ảnh.");
  }

  return data.publicUrl;
};
