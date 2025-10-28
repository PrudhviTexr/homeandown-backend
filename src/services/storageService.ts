/**
 * Centralized Supabase Storage Service
 * 
 * This service provides a unified interface for uploading, deleting, and listing files
 * in Supabase Storage. It supports multiple buckets as per the project requirements:
 * - property-images: Property listing images
 * - profile-images: User profile pictures
 * - documents: Legal and verification documents
 * - images: General images
 * - uploads: General file uploads
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[StorageService] Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export interface FileListItem {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  size: number;
}

/**
 * Upload a single file to Supabase Storage
 * @param file - File to upload
 * @param bucket - Bucket name (default: 'property-images')
 * @param folder - Folder path within bucket (default: '')
 * @returns Upload result with URL and path
 */
export const uploadFile = async (
  file: File,
  bucket: string = 'property-images',
  folder: string = ''
): Promise<UploadResult> => {
  try {
    if (!file) {
      return { url: '', path: '', error: 'No file provided' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log(`[StorageService] Uploading file to ${bucket}/${filePath}`);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[StorageService] Upload error:', error);
      return { url: '', path: '', error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`[StorageService] Upload successful: ${urlData.publicUrl}`);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error: any) {
    console.error('[StorageService] Upload error:', error);
    return { url: '', path: '', error: error.message || 'Upload failed' };
  }
};

/**
 * Upload multiple files to Supabase Storage
 * @param files - Array of files to upload
 * @param bucket - Bucket name (default: 'property-images')
 * @param folder - Folder path within bucket (default: '')
 * @returns Array of upload results
 */
export const uploadMultipleFiles = async (
  files: File[],
  bucket: string = 'property-images',
  folder: string = ''
): Promise<UploadResult[]> => {
  try {
    if (!files || files.length === 0) {
      return [];
    }

    console.log(`[StorageService] Uploading ${files.length} files to ${bucket}/${folder}`);

    const uploadPromises = files.map(file => uploadFile(file, bucket, folder));
    const results = await Promise.all(uploadPromises);

    const successCount = results.filter(r => !r.error).length;
    console.log(`[StorageService] Uploaded ${successCount}/${files.length} files successfully`);

    return results;
  } catch (error: any) {
    console.error('[StorageService] Multiple upload error:', error);
    return files.map(() => ({ url: '', path: '', error: error.message || 'Upload failed' }));
  }
};

/**
 * Delete a file from Supabase Storage
 * @param path - File path to delete
 * @param bucket - Bucket name (default: 'property-images')
 * @returns True if successful, false otherwise
 */
export const deleteFile = async (
  path: string,
  bucket: string = 'property-images'
): Promise<boolean> => {
  try {
    if (!path) {
      console.error('[StorageService] No path provided for deletion');
      return false;
    }

    console.log(`[StorageService] Deleting file: ${bucket}/${path}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('[StorageService] Delete error:', error);
      return false;
    }

    console.log(`[StorageService] File deleted successfully: ${path}`);
    return true;
  } catch (error) {
    console.error('[StorageService] Delete error:', error);
    return false;
  }
};

/**
 * List files in a bucket/folder
 * @param bucket - Bucket name (default: 'property-images')
 * @param folder - Folder path within bucket (default: '')
 * @returns Array of files
 */
export const listFiles = async (
  bucket: string = 'property-images',
  folder: string = ''
): Promise<FileListItem[]> => {
  try {
    console.log(`[StorageService] Listing files in ${bucket}/${folder}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('[StorageService] List files error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[StorageService] List files error:', error);
    return [];
  }
};

/**
 * Get public URL for a file
 * @param path - File path
 * @param bucket - Bucket name (default: 'property-images')
 * @returns Public URL
 */
export const getPublicUrl = (
  path: string,
  bucket: string = 'property-images'
): string => {
  if (!path) return '';
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

// Export the service as default
export default {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  listFiles,
  getPublicUrl
};
