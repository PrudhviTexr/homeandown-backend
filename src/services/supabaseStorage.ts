import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ajymffxpunxoqcmunohx.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqeW1mZnhwdW54b3FjbXVub2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4MDAsImV4cCI6MjA1MDU1MDgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export const uploadToSupabaseStorage = async (
  file: File,
  bucket: string = 'property-images',
  folder: string = 'properties'
): Promise<UploadResult> => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return { url: '', path: '', error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: '', path: '', error: 'Upload failed' };
  }
};

export const uploadMultipleImages = async (
  files: File[],
  bucket: string = 'property-images',
  folder: string = 'properties'
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (const file of files) {
    const result = await uploadToSupabaseStorage(file, bucket, folder);
    results.push(result);
  }
  
  return results;
};

export const deleteFromSupabaseStorage = async (
  path: string,
  bucket: string = 'property-images'
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    return !error;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};
