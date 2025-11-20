import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Eye, EyeOff, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadMultipleImages, UploadResult } from '@/services/supabaseStorage';
import toast from 'react-hot-toast';

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
  uploaded?: boolean;
  url?: string;
}

interface EnhancedImageUploadProps {
  existingImages?: string[];
  onImagesChange: (images: string[]) => void;
  onUploadComplete?: (urls: string[]) => void;
  maxImages?: number;
  className?: string;
  bucket?: string;
  folder?: string;
}

const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({
  existingImages = [],
  onImagesChange,
  onUploadComplete,
  maxImages = 10,
  className = '',
  bucket = 'property-images',
  folder = 'properties'
}) => {
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + existingImages.length + imagePreviews.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    files.forEach(file => {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not a supported image format.`);
        return;
      }

      const preview = URL.createObjectURL(file);
      const newPreview: ImagePreview = {
        file,
        preview,
        id: Math.random().toString(36).substr(2, 9)
      };
      
      setImagePreviews(prev => [...prev, newPreview]);
    });
  }, [existingImages.length, imagePreviews.length, maxImages]);

  const uploadImages = async () => {
    if (imagePreviews.length === 0) return;
    
    setUploading(true);
    try {
      const files = imagePreviews.map(p => p.file);
      const results = await uploadMultipleImages(files, bucket, folder);
      
      const successfulUploads: string[] = [];
      const updatedPreviews = imagePreviews.map((preview, index) => {
        const result = results[index];
        if (result.url && !result.error) {
          successfulUploads.push(result.url);
          return { ...preview, uploaded: true, url: result.url };
        } else {
          toast.error(`Failed to upload ${preview.file.name}: ${result.error}`);
          return preview;
        }
      });
      
      setImagePreviews(updatedPreviews);
      
      if (successfulUploads.length > 0) {
        const allImages = [...existingImages, ...successfulUploads];
        onImagesChange(allImages);
        onUploadComplete?.(successfulUploads);
        toast.success(`Successfully uploaded ${successfulUploads.length} images!`);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImagePreview = useCallback((id: string) => {
    setImagePreviews(prev => {
      const preview = prev.find(p => p.id === id);
      if (preview) {
        URL.revokeObjectURL(preview.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const removeExistingImage = useCallback((index: number) => {
    const newExistingImages = existingImages.filter((_, i) => i !== index);
    onImagesChange(newExistingImages);
  }, [existingImages, onImagesChange]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const totalImages = existingImages.length + imagePreviews.length;
  const hasUnuploadedImages = imagePreviews.some(p => !p.uploaded);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Property Images</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {totalImages}/{maxImages} images
          </span>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            {showPreview ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Upload Button */}
      <div
        onClick={openFileDialog}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors"
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-600 mb-1">Click to upload images</p>
        <p className="text-sm text-gray-500">
          PNG, JPG, JPEG up to 5MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Upload Button */}
      {hasUnuploadedImages && (
        <div className="flex justify-center">
          <button
            onClick={uploadImages}
            disabled={uploading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {imagePreviews.filter(p => !p.uploaded).length} Images
              </>
            )}
          </button>
        </div>
      )}

      {/* Image Previews */}
      {showPreview && (
        <div className="space-y-4">
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Property ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Image Previews */}
          {imagePreviews.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                New Images {hasUnuploadedImages && '(Click Upload to save)'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview) => (
                  <div key={preview.id} className="relative group">
                    <img
                      src={preview.preview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {preview.uploaded && (
                      <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                          ✓ Uploaded
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImagePreview(preview.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalImages === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No images uploaded yet</p>
              <p className="text-sm">Upload images to showcase your property</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedImageUpload;
