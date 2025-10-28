import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { validateFileSize, isFileTypeAllowed } from '@/utils/imageUpload';
import toast from 'react-hot-toast';

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
}

interface ImageUploadProps {
  existingImages?: string[];
  onImagesChange: (images: string[]) => void;
  onNewImagesChange: (files: File[]) => void;
  maxImages?: number;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  existingImages = [],
  onImagesChange,
  onNewImagesChange,
  maxImages = 10,
  className = ''
}) => {
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + existingImages.length + imagePreviews.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    files.forEach(file => {
      if (!validateFileSize(file)) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }
      
      if (!isFileTypeAllowed(file)) {
        toast.error(`File ${file.name} is not a supported format.`);
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

    // Notify parent component about new files
    onNewImagesChange(files);
  }, [existingImages.length, imagePreviews.length, maxImages, onNewImagesChange]);

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
              <h4 className="text-sm font-medium text-gray-700 mb-2">New Images</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview) => (
                  <div key={preview.id} className="relative group">
                    <img
                      src={preview.preview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
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

export default ImageUpload;
