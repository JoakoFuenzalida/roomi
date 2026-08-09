"use server";

import { db } from "@/lib/db";
import { requireUser, assertMemberOf } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadHouseholdCover(householdId: string, formData: FormData) {
  const user = await requireUser();
  const membership = await assertMemberOf(user.id, householdId);

  if (membership.role !== "ADMIN") {
    throw new Error("Solo el admin puede cambiar la portada del hogar");
  }

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No se envió ningún archivo");

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Solo se permiten imágenes (JPG, PNG, WebP, GIF)");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("La imagen no debe pesar más de 5 MB");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Falta configurar Supabase Storage en el .env");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const fileExt = file.name.split('.').pop();
  const fileName = `household-${householdId}-${Date.now()}.${fileExt}`;

  // Convert File to Buffer for Node.js environment
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Error al subir imagen a Supabase: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  await db.household.update({
    where: { id: householdId },
    data: { coverImage: publicUrlData.publicUrl }
  });

  revalidatePath("/hogar");
  return { success: true, url: publicUrlData.publicUrl };
}
