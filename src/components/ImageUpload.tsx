'use client';

import { useState, useCallback } from 'react';
import { UploadedImage } from '@/types';

interface ImageUploadProps {
  onImagesUploaded: (images: UploadedImage[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function ImageUpload({ 
  onImagesUploaded, 
  maxFiles = 5, 
  maxSizeMB = 10 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const processFiles = useCallback((files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= maxSizeMB * 1024 * 1024;
      return isImage && isValidSize;
    });

    if (validFiles.length === 0) {
      alert('Please select valid image files under ' + maxSizeMB + 'MB');
      return;
    }

    const newImages: UploadedImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    const updatedImages = [...uploadedImages, ...newImages].slice(0, maxFiles);
    setUploadedImages(updatedImages);
    onImagesUploaded(updatedImages);
  }, [uploadedImages, onImagesUploaded, maxFiles, maxSizeMB]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      const fileList = new DataTransfer();
      files.forEach(file => fileList.items.add(file));
      processFiles(fileList.files);
    }
  }, [processFiles]);

  const removeImage = useCallback((id: string) => {
    const updatedImages = uploadedImages.filter(img => img.id !== id);
    setUploadedImages(updatedImages);
    onImagesUploaded(updatedImages);
  }, [uploadedImages, onImagesUploaded]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-purple-500 bg-purple-900/20' 
            : 'border-gray-600 hover:border-purple-500'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
        />
        
        <div className="space-y-4">
          <div className="text-6xl text-purple-400">📸</div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Upload Images for Testing
            </h3>
            <p className="text-gray-300 mt-2">
              Drag and drop images here, paste from clipboard, or{' '}
              <label 
                htmlFor="file-upload" 
                className="text-purple-400 hover:text-purple-300 cursor-pointer font-medium"
              >
                click to browse
              </label>
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <p>Maximum {maxFiles} files • Up to {maxSizeMB}MB each</p>
            <p>Supports: JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      </div>

      {uploadedImages.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-4 text-white">
            Uploaded Images ({uploadedImages.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedImages.map((image) => (
              <div 
                key={image.id} 
                className="relative bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700"
              >
                <img
                  src={image.preview}
                  alt={image.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h5 className="font-medium truncate text-white">{image.name}</h5>
                  <p className="text-sm text-gray-400">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}