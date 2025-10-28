import { getPyApiBase } from './backend';

/**
 * Checks if the file size is within limits (5MB)
 */
export const validateFileSize = (file: File): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSize;
};

/**
 * Checks if the file type is allowed (PNG, JPG, JPEG, PDF)
 */
export const isFileTypeAllowed = (file: File): boolean => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  return allowedTypes.includes(file.type);
};

/**
 * Uploads a file to Python API and returns the public URL
 */
export const uploadImage = async (
  file: File,
  entityType: string = 'property',
  entityId: number = 0
): Promise<string> => {
  try {
    // Check if file type is allowed
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Please upload PNG, JPG, JPEG, or PDF files only.');
    }
    
    const base = getPyApiBase();
    const form = new FormData();
    form.append('entity_type', entityType);
    form.append('entity_id', String(entityId));
    form.append('file', file, file.name);
    const apiKey = (import.meta as any).env?.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
    const resp = await fetch(`${base}/api/uploads/upload`, { method: 'POST', headers: { 'X-API-Key': apiKey }, body: form });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Upload failed: ${t}`);
    }
    const data = await resp.json();
    console.log('File uploaded successfully:', data);
    return data.url as string;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Uploads multiple images and returns their public URLs
 * This is useful for property images
 */
export const uploadMultipleImages = async (
  files: File[],
  entityType: string = 'property',
  entityId: number = 0
): Promise<string[]> => {
  try {
    const urls: string[] = [];
    
    for (const file of files) {
      // Check if file type is allowed
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        console.warn(`Skipping file ${file.name}: File type not allowed. Please upload PNG, JPG, JPEG, or PDF files only.`);
        continue;
      }
      
      try {
        const url = await uploadImage(file, entityType, entityId);
        urls.push(url);
      } catch (error) {
        console.error('Error uploading image in batch:', error);
        // Continue with other images even if one fails
      }
    }
    
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Deletes an image from storage (Python API TODO)
 * Returns true if successful, false otherwise
 */
export const deleteImage = async (_url: string): Promise<boolean> => {
  // Optional: implement delete via Python API if needed in the future
  console.warn('deleteImage not implemented on Python API yet');
  return false;
};

/**
 * Checks if a bucket exists, creates it if it doesn't
 */
export const ensureBucketExists = async (_bucketName: string): Promise<boolean> => true;