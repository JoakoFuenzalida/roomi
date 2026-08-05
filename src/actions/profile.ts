"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function uploadAvatar(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file") as File | null;
  
  if (!file) throw new Error("No se envió ningún archivo");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Falta configurar Supabase Storage en el .env");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

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

  await db.user.update({
    where: { id: user.id },
    data: { image: publicUrlData.publicUrl }
  });

  revalidatePath("/", "layout");
  return { success: true, url: publicUrlData.publicUrl };
}

export async function updateProfileName(
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  const name = formData.get("name") as string;

  if (!name || name.trim().length < 2) {
    return { error: "El nombre es muy corto" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { name: name.trim() },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
