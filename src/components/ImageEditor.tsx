'use client';

import { useState, useCallback } from 'react';
import { UploadedImage } from '@/types';
import { editImageWithStyle, STYLE_PRESETS, ImageEditResponse } from '@/lib/deepaiApi';

interface ImageEditorProps {
  images: UploadedImage[];
}

interface EditedImage {
  id: string;
  originalId: string;
  originalName: string;
  style: string;
  editedUrl: string;
  timestamp: Date;
}

export default function ImageEditor({ images }: ImageEditorProps) {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [customStyle, setCustomStyle] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedImages, setEditedImages] = useState<EditedImage[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  const handleImageSelect = useCallback((imageId: string) => {
    setSelectedImage(imageId);
  }, []);

  const handleStyleSelect = useCallback((style: string) => {
    setSelectedStyle(style);
    setCustomStyle('');
  }, []);

  const handleCustomStyleChange = useCallback((value: string) => {
    setCustomStyle(value);
    setSelectedStyle('');
  }, []);

  const editImage = useCallback(async () => {
    if (!selectedImage) {
      alert('Please select an image to edit');
      return;
    }

    const styleToUse = customStyle.trim() || selectedStyle;
    if (!styleToUse) {
      alert('Please select a style or enter a custom style');
      return;
    }

    const image = images.find(img => img.id === selectedImage);
    if (!image) return;

    setIsEditing(true);
    setCurrentProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setCurrentProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response: ImageEditResponse = await editImageWithStyle({
        image: image.file,
        style: styleToUse
      });

      clearInterval(progressInterval);
      setCurrentProgress(100);

      const newEditedImage: EditedImage = {
        id: Math.random().toString(36).substr(2, 9),
        originalId: selectedImage,
        originalName: image.name,
        style: styleToUse,
        editedUrl: response.output_url || '',
        timestamp: new Date(),
      };

      setEditedImages(prev => [newEditedImage, ...prev]);
      
      setTimeout(() => {
        setCurrentProgress(0);
        setIsEditing(false);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to edit image:', error);
      alert('Failed to edit image. Please try again.');
      setIsEditing(false);
      setCurrentProgress(0);
    }
  }, [selectedImage, selectedStyle, customStyle, images]);

  const downloadImage = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `edited_${filename}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download image');
    }
  }, []);

  const clearResults = useCallback(() => {
    setEditedImages([]);
  }, []);

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-purple-400 mb-4">🎨</div>
        <h3 className="text-lg font-semibold text-white">No Images to Edit</h3>
        <p className="text-gray-400">Upload some images first to start editing</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Image Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Select Image to Edit</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`
                relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all bg-gray-800
                ${selectedImage === image.id
                  ? 'border-purple-500 ring-2 ring-purple-500/30'
                  : 'border-gray-600 hover:border-purple-400'
                }
              `}
              onClick={() => handleImageSelect(image.id)}
            >
              <img
                src={image.preview}
                alt={image.name}
                className="w-full h-24 object-cover"
              />
              <div className="p-2">
                <p className="text-xs font-medium truncate text-white">{image.name}</p>
              </div>
              {selectedImage === image.id && (
                <div className="absolute top-1 right-1 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Style Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Choose Style</h3>
        
        {/* Preset Styles */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-300 mb-3">Preset Styles</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {STYLE_PRESETS.map((style) => (
              <button
                key={style}
                onClick={() => handleStyleSelect(style)}
                className={`
                  p-3 rounded-lg border transition-all text-left
                  ${selectedStyle === style
                    ? 'border-purple-500 bg-purple-900/30 text-purple-300'
                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-purple-400'
                  }
                `}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Style */}
        <div>
          <h4 className="text-md font-medium text-gray-300 mb-3">Custom Style Description</h4>
          <textarea
            value={customStyle}
            onChange={(e) => handleCustomStyleChange(e.target.value)}
            placeholder="Enter your custom style description (e.g., 'cyberpunk neon aesthetic with dark colors')"
            className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Edit Button */}
      <div className="flex items-center space-x-4">
        <button
          onClick={editImage}
          disabled={isEditing || !selectedImage || (!selectedStyle && !customStyle.trim())}
          className={`
            px-6 py-3 rounded-lg font-medium transition-colors
            ${isEditing || !selectedImage || (!selectedStyle && !customStyle.trim())
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
            }
          `}
        >
          {isEditing ? 'Editing Image...' : 'Edit Image'}
        </button>
        
        {editedImages.length > 0 && (
          <button
            onClick={clearResults}
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800"
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isEditing && (
        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Processing image...</span>
            <span>{Math.round(currentProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Edited Images */}
      {editedImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Edited Images</h3>
          <div className="space-y-6">
            {editedImages.map((editedImage) => {
              const originalImage = images.find(img => img.id === editedImage.originalId);
              
              return (
                <div key={editedImage.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Original Image */}
                    <div className="flex-1">
                      <h4 className="text-md font-medium text-white mb-2">Original</h4>
                      {originalImage && (
                        <img
                          src={originalImage.preview}
                          alt={`Original ${editedImage.originalName}`}
                          className="w-full max-w-sm h-64 object-cover rounded-lg"
                        />
                      )}
                    </div>

                    {/* Edited Image */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-medium text-white">Edited</h4>
                        <button
                          onClick={() => downloadImage(editedImage.editedUrl, editedImage.originalName)}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          Download
                        </button>
                      </div>
                      <img
                        src={editedImage.editedUrl}
                        alt={`Edited ${editedImage.originalName}`}
                        className="w-full max-w-sm h-64 object-cover rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Style Info */}
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Style Applied:</span> {editedImage.style}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Edited: {editedImage.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}