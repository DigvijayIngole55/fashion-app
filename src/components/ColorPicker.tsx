'use client';

import { useState, useCallback } from 'react';
import { ColorCustomization } from '@/lib/customizationTypes';

interface ColorPickerProps {
  colorCustomization: ColorCustomization;
  onColorChange: (colors: ColorCustomization) => void;
}

interface ColorZone {
  key: keyof ColorCustomization['zones'];
  label: string;
  description: string;
}

const COLOR_ZONES: ColorZone[] = [
  { key: 'body', label: 'Body', description: 'Main garment body' },
  { key: 'sleeves', label: 'Sleeves', description: 'Sleeve areas' },
  { key: 'collar', label: 'Collar', description: 'Collar/neckline' },
  { key: 'cuffs', label: 'Cuffs', description: 'Sleeve cuffs' },
  { key: 'pockets', label: 'Pockets', description: 'Pocket areas' }
];

const PRESET_COLORS = [
  { name: 'Classic Blue', value: '#4A90E2' },
  { name: 'Navy', value: '#1B365D' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Gray', value: '#8E8E93' },
  { name: 'Red', value: '#FF3B30' },
  { name: 'Green', value: '#34C759' },
  { name: 'Purple', value: '#AF52DE' },
  { name: 'Orange', value: '#FF9500' },
  { name: 'Yellow', value: '#FFCC00' },
  { name: 'Pink', value: '#FF69B4' },
  { name: 'Brown', value: '#8B4513' }
];

export default function ColorPicker({ colorCustomization, onColorChange }: ColorPickerProps) {
  const [activeZone, setActiveZone] = useState<keyof ColorCustomization['zones'] | 'main' | 'accent' | 'trim'>('main');

  const handleColorChange = useCallback((color: string) => {
    const updatedColors = { ...colorCustomization };
    
    if (activeZone === 'main') {
      updatedColors.mainColor = color;
      // Update all zones to main color if they haven't been customized
      Object.keys(updatedColors.zones).forEach(zone => {
        updatedColors.zones[zone as keyof ColorCustomization['zones']] = color;
      });
    } else if (activeZone === 'accent') {
      updatedColors.accentColor = color;
    } else if (activeZone === 'trim') {
      updatedColors.trimColor = color;
    } else {
      updatedColors.zones[activeZone] = color;
    }
    
    onColorChange(updatedColors);
  }, [colorCustomization, activeZone, onColorChange]);

  const getCurrentColor = () => {
    if (activeZone === 'main') return colorCustomization.mainColor;
    if (activeZone === 'accent') return colorCustomization.accentColor || '#CCCCCC';
    if (activeZone === 'trim') return colorCustomization.trimColor || '#CCCCCC';
    return colorCustomization.zones[activeZone];
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-medium text-white mb-4">Color Customization</h3>
      
      {/* Color Zone Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Select Area to Color</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Main Colors */}
          <button
            onClick={() => setActiveZone('main')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              activeZone === 'main'
                ? 'border-purple-500 bg-purple-900/30 text-white'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-gray-500"
                style={{ backgroundColor: colorCustomization.mainColor }}
              />
              <span className="text-sm font-medium">Main</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveZone('accent')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              activeZone === 'accent'
                ? 'border-purple-500 bg-purple-900/30 text-white'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-gray-500"
                style={{ backgroundColor: colorCustomization.accentColor || '#CCCCCC' }}
              />
              <span className="text-sm font-medium">Accent</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveZone('trim')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              activeZone === 'trim'
                ? 'border-purple-500 bg-purple-900/30 text-white'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-gray-500"
                style={{ backgroundColor: colorCustomization.trimColor || '#CCCCCC' }}
              />
              <span className="text-sm font-medium">Trim</span>
            </div>
          </button>
          
          {/* Zone-specific Colors */}
          {COLOR_ZONES.map((zone) => (
            <button
              key={zone.key}
              onClick={() => setActiveZone(zone.key)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                activeZone === zone.key
                  ? 'border-purple-500 bg-purple-900/30 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-purple-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border border-gray-500"
                  style={{ backgroundColor: colorCustomization.zones[zone.key] }}
                />
                <span className="text-sm font-medium">{zone.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Current Selection Info */}
      <div className="mb-4 p-3 bg-gray-750 rounded-lg">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded border-2 border-gray-500"
            style={{ backgroundColor: getCurrentColor() }}
          />
          <div>
            <div className="text-white font-medium">
              {activeZone === 'main' ? 'Main Color' : 
               activeZone === 'accent' ? 'Accent Color' :
               activeZone === 'trim' ? 'Trim Color' :
               COLOR_ZONES.find(z => z.key === activeZone)?.label}
            </div>
            <div className="text-gray-400 text-sm">
              {activeZone === 'main' ? 'Primary garment color' :
               activeZone === 'accent' ? 'Secondary accent color' :
               activeZone === 'trim' ? 'Trim and detail color' :
               COLOR_ZONES.find(z => z.key === activeZone)?.description}
            </div>
          </div>
        </div>
      </div>
      
      {/* Color Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom Color (HEX)
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={getCurrentColor()}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-12 h-10 rounded border border-gray-600 bg-gray-700 cursor-pointer"
          />
          <input
            type="text"
            value={getCurrentColor()}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#4A90E2"
            className="flex-1 px-3 py-2 rounded border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>
      
      {/* Preset Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Preset Colors</label>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleColorChange(preset.value)}
              className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 ${
                getCurrentColor() === preset.value 
                  ? 'border-purple-500 shadow-lg' 
                  : 'border-gray-500 hover:border-gray-400'
              }`}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
            />
          ))}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => onColorChange({
            mainColor: '#4A90E2',
            zones: {
              body: '#4A90E2',
              sleeves: '#4A90E2',
              collar: '#4A90E2',
              cuffs: '#4A90E2',
              pockets: '#4A90E2'
            }
          })}
          className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
        >
          Reset to Default
        </button>
        
        <button
          onClick={() => {
            const mainColor = colorCustomization.mainColor;
            onColorChange({
              ...colorCustomization,
              zones: {
                body: mainColor,
                sleeves: mainColor,
                collar: mainColor,
                cuffs: mainColor,
                pockets: mainColor
              }
            });
          }}
          className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Apply Main to All
        </button>
      </div>
    </div>
  );
}