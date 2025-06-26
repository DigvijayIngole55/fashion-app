'use client';

import { useState, useCallback } from 'react';

interface CustomizationOptions {
  color?: string;
  textureImage?: File;
  logoImage?: File;
}

interface GarmentCustomizerProps {
  originalImageUrl: string;
  originalImageName: string;
  onCustomize: (options: CustomizationOptions) => void;
  isCustomizing: boolean;
}

export default function GarmentCustomizer({ 
  originalImageUrl, 
  originalImageName, 
  onCustomize, 
  isCustomizing 
}: GarmentCustomizerProps) {
  const [selectedColor, setSelectedColor] = useState<string>('#4A90E2');
  const [textureImage, setTextureImage] = useState<File | null>(null);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [texturePreview, setTexturePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleTextureUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setTextureImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setTexturePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleCustomize = useCallback(() => {
    const options: CustomizationOptions = {};
    
    if (selectedColor !== '#4A90E2') {
      options.color = selectedColor;
    }
    
    if (textureImage) {
      options.textureImage = textureImage;
    }
    
    if (logoImage) {
      options.logoImage = logoImage;
    }

    // Only proceed if user selected at least one customization
    if (Object.keys(options).length > 0) {
      onCustomize(options);
    } else {
      alert('Please select at least one customization option (color, texture, or logo).');
    }
  }, [selectedColor, textureImage, logoImage, onCustomize]);

  const resetCustomizations = useCallback(() => {
    setSelectedColor('#4A90E2');
    setTextureImage(null);
    setLogoImage(null);
    setTexturePreview(null);
    setLogoPreview(null);
  }, []);

  const hasCustomizations = selectedColor !== '#4A90E2' || textureImage || logoImage;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white">Customize Garment</h3>
        <span className="text-sm text-gray-400">Stage 2: Design Customization</span>
      </div>

      {/* Original Image Preview */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Original Garment</label>
        <div className="flex items-center gap-4">
          <img
            src={originalImageUrl}
            alt={originalImageName}
            className="w-20 h-20 object-cover rounded-lg border border-gray-600"
          />
          <div>
            <div className="text-white text-sm font-medium">{originalImageName}</div>
            <div className="text-gray-400 text-xs">Ready for customization</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Change Color (Optional)
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-12 h-10 rounded border border-gray-600 bg-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                placeholder="#4A90E2"
                className="flex-1 px-3 py-2 rounded border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-purple-500 text-sm"
              />
            </div>
            <div className="text-xs text-gray-400">
              {selectedColor === '#4A90E2' ? 'Default color' : 'Custom color selected'}
            </div>
          </div>
        </div>

        {/* Texture Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Add Fabric Texture (Optional)
          </label>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleTextureUpload}
              className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-700 text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700"
            />
            {texturePreview && (
              <div className="relative">
                <img
                  src={texturePreview}
                  alt="Texture preview"
                  className="w-full h-16 object-cover rounded border border-gray-600"
                />
                <button
                  onClick={() => {
                    setTextureImage(null);
                    setTexturePreview(null);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            )}
            <div className="text-xs text-gray-400">
              Upload fabric sample to apply texture
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Add Logo (Optional)
          </label>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-700 text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
            />
            {logoPreview && (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-16 object-contain rounded border border-gray-600 bg-white"
                />
                <button
                  onClick={() => {
                    setLogoImage(null);
                    setLogoPreview(null);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            )}
            <div className="text-xs text-gray-400">
              Upload logo to add to garment
            </div>
          </div>
        </div>
      </div>

      {/* Customization Summary */}
      {hasCustomizations && (
        <div className="mb-6 p-4 bg-gray-750 rounded-lg border border-gray-600">
          <h4 className="text-sm font-medium text-white mb-2">Selected Customizations:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedColor !== '#4A90E2' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedColor }}></div>
                Color: {selectedColor}
              </span>
            )}
            {textureImage && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded">
                🎨 Texture: {textureImage.name}
              </span>
            )}
            {logoImage && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                🏷️ Logo: {logoImage.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCustomize}
          disabled={!hasCustomizations || isCustomizing}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            !hasCustomizations
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : isCustomizing
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
          }`}
        >
          {isCustomizing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating Custom Design...
            </div>
          ) : (
            'Generate Customized Garment'
          )}
        </button>

        {hasCustomizations && !isCustomizing && (
          <button
            onClick={resetCustomizations}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Select any combination of color, texture, and logo to customize your garment
      </p>
    </div>
  );
}