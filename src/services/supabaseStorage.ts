/**
 * Legacy Supabase Storage wrapper
 * 
 * This file is maintained for backward compatibility.
 * All storage operations now use the centralized storageService.ts
 * 
 * @deprecated Use storageService.ts instead
 */

import storageService, { UploadResult } from './storageService';

// Re-export UploadResult type for backward compatibility
export type { UploadResult };

/**
 * Upload a file to Supabase Storage
 * @deprecated Use storageService.uploadFile instead
 */
export const uploadToSupabaseStorage = async (
  file: File,
  bucket: string = 'property-images',
  folder: string = 'properties'
): Promise<UploadResult> => {
  return storageService.uploadFile(file, bucket, folder);
};

/**
 * Upload multiple files to Supabase Storage
 * @deprecated Use storageService.uploadMultipleFiles instead
 */
export const uploadMultipleImages = async (
  files: File[],
  bucket: string = 'property-images',
  folder: string = 'properties'
): Promise<UploadResult[]> => {
  return storageService.uploadMultipleFiles(files, bucket, folder);
};

/**
 * Delete a file from Supabase Storage
 * @deprecated Use storageService.deleteFile instead
 */
export const deleteFromSupabaseStorage = async (
  path: string,
  bucket: string = 'property-images'
): Promise<boolean> => {
  return storageService.deleteFile(path, bucket);
};
