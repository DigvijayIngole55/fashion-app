'use client';

import { useState, useCallback } from 'react';
import { editImageWithStyle } from '@/lib/deepaiApi';
import { AI_PROMPTS, getPomLabelingPrompt, EXAMPLE_POM_LABELS } from '@/lib/prompts';
import { 
  parsePOMInput, 
  generateSizeChart, 
  extractPOMForLabeling, 
  formatSizeChartForDisplay,
  exportSizeChartAsCSV,
  getDefaultGradingRules,
  getSuggestedIncrement,
  validateGradingRules,
  createComprehensiveExport,
  SIZE_SYSTEMS,
  type SizeSystemType,
  type SizeValue,
  type POMData,
  type SizeChart,
  type GradingRules 
} from '@/lib/sizeGrading';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
}

interface GeneratedSketch {
  id: string;
  originalName: string;
  sketchUrl: string | null;
  description?: string;
  timestamp: Date;
  type?: string;
}

interface LabeledSketch {
  id: string;
  sketchId: string;
  labeledImageUrl: string | null;
  measurements?: string;
  timestamp: Date;
}

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSketches, setGeneratedSketches] = useState<GeneratedSketch[]>([]);
  const [labeledSketches, setLabeledSketches] = useState<LabeledSketch[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isLabeling, setIsLabeling] = useState(false);
  const [pomLabels, setPomLabels] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<'visual' | 'no_desc' | 'steps'>('visual');
  const [sizeSystem, setSizeSystem] = useState<SizeSystemType>('US');
  const [baseSize, setBaseSize] = useState<SizeValue>('S');
  const [parsedPOMData, setParsedPOMData] = useState<POMData[]>([]);
  const [sizeChart, setSizeChart] = useState<SizeChart>({});
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [customGradingRules, setCustomGradingRules] = useState<GradingRules>({});
  const [showGradingEditor, setShowGradingEditor] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    const newImage: UploadedImage = {
      id: Math.random().toString(36).substring(2, 11),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    };

    setUploadedImage(newImage);
  }, []);

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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          processFile(file);
          break;
        }
      }
    }
  }, [processFile]);

  const generateSketch = useCallback(async () => {
    if (!uploadedImage) {
      alert('Please upload an image first');
      return;
    }

    setIsGenerating(true);
    setCurrentProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setCurrentProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await editImageWithStyle({
        image: uploadedImage.file,
        style: AI_PROMPTS.TECHNICAL_SKETCH.CLIENT_PROMPT
      });

      clearInterval(progressInterval);
      setCurrentProgress(100);

      const newSketch: GeneratedSketch = {
        id: Math.random().toString(36).substring(2, 11),
        originalName: uploadedImage.name,
        sketchUrl: response.output_url,
        description: response.description,
        timestamp: new Date(),
        type: response.type,
      };

      setGeneratedSketches(prev => [newSketch, ...prev]);
      
      setTimeout(() => {
        setCurrentProgress(0);
        setIsGenerating(false);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to generate sketch:', error);
      alert('Failed to generate sketch. Please try again.');
      setIsGenerating(false);
      setCurrentProgress(0);
    }
  }, [uploadedImage]);

  const downloadSketch = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `sketch_${filename}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download sketch:', error);
      alert('Failed to download sketch');
    }
  }, []);

  // Parse POM input and generate size chart
  const handlePOMInputChange = useCallback((value: string) => {
    setPomLabels(value);
    
    if (value.trim()) {
      try {
        const parsed = parsePOMInput(value);
        setParsedPOMData(parsed);
        
        if (parsed.length > 0) {
          const activeGradingRules = Object.keys(customGradingRules).length > 0 
            ? customGradingRules 
            : undefined;
          const chart = generateSizeChart(parsed, baseSize, sizeSystem, activeGradingRules);
          setSizeChart(chart);
          setShowSizeChart(true);
        } else {
          setShowSizeChart(false);
        }
      } catch (error) {
        console.error('Error parsing POM data:', error);
        setShowSizeChart(false);
      }
    } else {
      setParsedPOMData([]);
      setSizeChart({});
      setShowSizeChart(false);
    }
  }, [baseSize, sizeSystem, customGradingRules]);

  // Handle base size change
  const handleBaseSizeChange = useCallback((newBaseSize: SizeValue) => {
    setBaseSize(newBaseSize);
    
    if (parsedPOMData.length > 0) {
      const activeGradingRules = Object.keys(customGradingRules).length > 0 
        ? customGradingRules 
        : undefined;
      const chart = generateSizeChart(parsedPOMData, newBaseSize, sizeSystem, activeGradingRules);
      setSizeChart(chart);
    }
  }, [parsedPOMData, sizeSystem, customGradingRules]);

  // Handle size system change
  const handleSizeSystemChange = useCallback((newSizeSystem: SizeSystemType) => {
    setSizeSystem(newSizeSystem);
    
    // Reset to default size for new system
    const defaultSize = SIZE_SYSTEMS[newSizeSystem].sizes[1]; // Usually S/38/10
    setBaseSize(defaultSize);
    
    // Reset custom grading rules
    setCustomGradingRules({});
    
    if (parsedPOMData.length > 0) {
      const chart = generateSizeChart(parsedPOMData, defaultSize, newSizeSystem);
      setSizeChart(chart);
    }
  }, [parsedPOMData]);

  // Export size chart as CSV
  const exportSizeChart = useCallback(() => {
    if (parsedPOMData.length > 0) {
      const csvContent = exportSizeChartAsCSV(sizeChart, parsedPOMData, sizeSystem, baseSize);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `size-chart-${sizeSystem}-${baseSize}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [sizeChart, parsedPOMData, sizeSystem, baseSize]);

  // Update grading rule for a specific POM code
  const updateGradingRule = useCallback((pomCode: string, increment: number) => {
    const newRules = { ...customGradingRules, [pomCode]: increment };
    setCustomGradingRules(newRules);
    
    if (parsedPOMData.length > 0) {
      const chart = generateSizeChart(parsedPOMData, baseSize, sizeSystem, newRules);
      setSizeChart(chart);
    }
  }, [customGradingRules, parsedPOMData, baseSize, sizeSystem]);

  // Reset to default grading rules
  const resetGradingRules = useCallback(() => {
    setCustomGradingRules({});
    
    if (parsedPOMData.length > 0) {
      const chart = generateSizeChart(parsedPOMData, baseSize, sizeSystem);
      setSizeChart(chart);
    }
  }, [parsedPOMData, baseSize, sizeSystem]);

  // Comprehensive export function
  const exportComprehensivePackage = useCallback(async () => {
    if (parsedPOMData.length === 0) {
      alert('Please enter POM data first to generate a comprehensive export.');
      return;
    }

    setIsExporting(true);
    
    try {
      console.log('🎁 [COMPREHENSIVE EXPORT] Starting comprehensive export...');
      
      const zipBlob = await createComprehensiveExport(
        parsedPOMData,
        sizeSystem,
        baseSize,
        generatedSketches,
        labeledSketches,
        uploadedImage ? { name: uploadedImage.name, preview: uploadedImage.preview } : undefined,
        Object.keys(customGradingRules).length > 0 ? customGradingRules : undefined
      );
      
      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fashion-project-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ [COMPREHENSIVE EXPORT] Export completed successfully');
      
    } catch (error) {
      console.error('💥 [COMPREHENSIVE EXPORT] Export failed:', error);
      alert('Failed to create comprehensive export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [
    parsedPOMData, 
    sizeSystem, 
    baseSize, 
    generatedSketches, 
    labeledSketches, 
    uploadedImage, 
    customGradingRules
  ]);

  const labelSketch = useCallback(async (sketchUrl: string, sketchId: string) => {
    console.log('🎯 [POM LABELING] Function called with:', { sketchUrl, sketchId, pomLabels, selectedStrategy });
    console.log('🎯 [POM LABELING] POM Labels length:', pomLabels.length);
    console.log('🎯 [POM LABELING] Selected strategy:', selectedStrategy);
    console.log('🎯 [POM LABELING] Current isLabeling state:', isLabeling);
    
    if (!pomLabels.trim()) {
      console.log('❌ [POM LABELING] No POM labels provided');
      alert('Please enter POM labels first');
      return;
    }

    console.log('🚀 [POM LABELING] Starting labeling process...');
    setIsLabeling(true);
    setCurrentProgress(0);

    try {
      console.log('📥 [POM LABELING] Step 1: Fetching sketch from URL:', sketchUrl);
      
      // Convert sketch URL to blob
      const response = await fetch(sketchUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sketch: ${response.status}`);
      }
      const blob = await response.blob();
      
      console.log('✅ [POM LABELING] Step 2: Converted to blob, size:', blob.size, 'bytes');
      
      const progressInterval = setInterval(() => {
        setCurrentProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          console.log('📊 [POM LABELING] Progress:', newProgress + '%');
          return newProgress;
        });
      }, 500);

      // Fetch reference image from public folder
      console.log('📋 [POM LABELING] Step 2.5: Fetching reference image...');
      const referenceResponse = await fetch('/refernce.png');
      if (!referenceResponse.ok) {
        console.warn('⚠️ [POM LABELING] Reference image not found, proceeding without it');
      }
      const referenceBlob = referenceResponse.ok ? await referenceResponse.blob() : null;
      
      // Create form data with the sketch image and reference
      const formData = new FormData();
      formData.append('image', blob, 'sketch.png');
      if (referenceBlob) {
        formData.append('reference', referenceBlob, 'reference.png');
        console.log('📋 [POM LABELING] Reference image added, size:', referenceBlob.size, 'bytes');
      }
      // Use parsed POM data for labeling (without measurements)
      const pomForLabeling = parsedPOMData.length > 0 
        ? extractPOMForLabeling(parsedPOMData)
        : pomLabels; // Fallback to original input if parsing failed
      const promptText = getPomLabelingPrompt(pomForLabeling, selectedStrategy);
      formData.append('prompt', promptText);

      console.log('📤 [POM LABELING] Step 3: Sending request to API...');
      console.log('📤 [POM LABELING] FormData contents:', {
        imageSize: blob.size,
        imageName: 'sketch.png',
        promptLength: promptText.length,
        pomLabelsPreview: pomLabels.substring(0, 100) + '...',
        strategy: selectedStrategy
      });
      console.log('📝 [POM LABELING] Full POM Labels being sent:');
      console.log(pomLabels);
      console.log('📝 [POM LABELING] Full Prompt being sent:');
      console.log(promptText.substring(0, 500) + (promptText.length > 500 ? '...[truncated]' : ''));

      const apiResponse = await fetch('/api/generate-sketch', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setCurrentProgress(100);

      console.log('📨 [POM LABELING] Step 4: API response received, status:', apiResponse.status);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('❌ [POM LABELING] API Error:', errorData);
        throw new Error(`API Error: ${apiResponse.status} - ${errorData.error}`);
      }

      const data = await apiResponse.json();
      console.log('✅ [POM LABELING] Step 5: API response data received:', {
        hasOutputUrl: !!data.output_url,
        hasDescription: !!data.description,
        type: data.type,
        id: data.id
      });

      const newLabeledSketch: LabeledSketch = {
        id: Math.random().toString(36).substring(2, 11),
        sketchId: sketchId,
        labeledImageUrl: data.output_url,
        measurements: data.description,
        timestamp: new Date(),
      };

      console.log('💾 [POM LABELING] Step 6: Adding labeled sketch to state');
      setLabeledSketches(prev => {
        const updated = [newLabeledSketch, ...prev];
        console.log('💾 [POM LABELING] Updated labeled sketches count:', updated.length);
        return updated;
      });
      
      console.log('🎉 [POM LABELING] Success! Cleaning up...');
      setTimeout(() => {
        setCurrentProgress(0);
        setIsLabeling(false);
        console.log('🧹 [POM LABELING] Cleanup complete');
      }, 1000);
      
    } catch (error) {
      console.error('💥 [POM LABELING] Error occurred:', error);
      console.error('💥 [POM LABELING] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert('Failed to label sketch. Please try again.');
      setIsLabeling(false);
      setCurrentProgress(0);
    }
  }, [pomLabels, parsedPOMData, isLabeling, selectedStrategy]);

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold text-white">
                Fashion Technical Sketch Generator
              </h1>
              <p className="mt-2 text-lg text-purple-300">
                Upload garment photos and generate professional technical flat sketches
              </p>
            </div>
            
            {/* Comprehensive Export Button */}
            {(parsedPOMData.length > 0 || generatedSketches.length > 0) && (
              <div className="mt-4 lg:mt-0">
                <button
                  onClick={exportComprehensivePackage}
                  disabled={isExporting}
                  className={`
                    px-6 py-3 rounded-lg font-medium text-white transition-all duration-200
                    ${isExporting
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105 shadow-lg'
                    }
                  `}
                >
                  {isExporting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Exporting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Export Complete Package
                    </div>
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  Includes all size charts (US/EU/UK) + sketches
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Image Upload */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-6">
              Upload Garment Image
            </h2>
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
                accept="image/*"
                onChange={handleFileSelect}
              />
              
              <div className="space-y-4">
                <div className="text-6xl text-purple-400">👗</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Upload Garment Photo
                  </h3>
                  <p className="text-gray-300 mt-2">
                    Drag and drop image here, paste from clipboard, or{' '}
                    <label 
                      htmlFor="file-upload" 
                      className="text-purple-400 hover:text-purple-300 cursor-pointer font-medium"
                    >
                      click to browse
                    </label>
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  <p>Supports: JPG, PNG, GIF, WebP</p>
                </div>
              </div>
            </div>

            {uploadedImage && (
              <div className="mt-6">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={uploadedImage.preview}
                      alt={uploadedImage.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{uploadedImage.name}</h4>
                      <p className="text-sm text-gray-400">Ready to generate sketch</p>
                    </div>
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Generate Button */}
          <section>
            <button
              onClick={generateSketch}
              disabled={!uploadedImage || isGenerating}
              className={`
                w-full px-6 py-4 rounded-lg font-medium text-lg transition-colors
                ${!uploadedImage || isGenerating
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                }
              `}
            >
              {isGenerating ? 'Generating Technical Sketch...' : 'Generate Technical Sketch'}
            </button>

            {/* Progress Bar */}
            {isGenerating && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Processing garment image...</span>
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
          </section>

          {/* POM Labels Input */}
          {generatedSketches.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-white mb-6">
                Enter POM Labels
              </h2>
              
              {/* Strategy Selector */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-4">
                <label className="block text-sm font-medium text-white mb-3">
                  Labeling Strategy
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedStrategy('visual')}
                    className={`
                      p-3 rounded-lg border text-left transition-colors
                      ${selectedStrategy === 'visual'
                        ? 'border-purple-500 bg-purple-900/30 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-purple-400'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">Visual</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Comprehensive visual labeling with references
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedStrategy('no_desc')}
                    className={`
                      p-3 rounded-lg border text-left transition-colors
                      ${selectedStrategy === 'no_desc'
                        ? 'border-purple-500 bg-purple-900/30 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-purple-400'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">No Description</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Label placement without detailed descriptions
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedStrategy('steps')}
                    className={`
                      p-3 rounded-lg border text-left transition-colors
                      ${selectedStrategy === 'steps'
                        ? 'border-purple-500 bg-purple-900/30 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-purple-400'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">Steps</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Step-by-step labeling process
                    </div>
                  </button>
                  
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Selected strategy: <span className="text-purple-400 font-medium">{selectedStrategy}</span>
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                  <label htmlFor="pom-labels" className="block text-sm font-medium text-white">
                    POM (Point of Measure) Specifications
                  </label>
                  
                  {/* Size System and Base Size Selectors */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">System:</span>
                      <select
                        value={sizeSystem}
                        onChange={(e) => handleSizeSystemChange(e.target.value as SizeSystemType)}
                        className="px-3 py-1 rounded border border-gray-600 bg-gray-700 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      >
                        {Object.entries(SIZE_SYSTEMS).map(([key, system]) => (
                          <option key={key} value={key}>{system.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">Base Size:</span>
                      <select
                        value={baseSize}
                        onChange={(e) => handleBaseSizeChange(e.target.value)}
                        className="px-3 py-1 rounded border border-gray-600 bg-gray-700 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      >
                        {SIZE_SYSTEMS[sizeSystem].sizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      onClick={() => setShowGradingEditor(!showGradingEditor)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      {showGradingEditor ? 'Hide' : 'Edit'} Rules
                    </button>
                  </div>
                </div>
                
                <textarea
                  id="pom-labels"
                  value={pomLabels}
                  onChange={(e) => handlePOMInputChange(e.target.value)}
                  placeholder={`Enter your POM data with measurements, for example:
A - Front Length From Shoulder - 66
B - ½ Chest - 54
C - ½ Bottom Width - 44

Or in table format:
POM Code    Description    Size (cm)
A    Front Length From Shoulder    66
B    ½ Chest    54`}
                  className="w-full h-32 p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                  rows={6}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Enter measurements for your base size ({baseSize}). Format: "Code - Description - Measurement" or table format.
                </p>
                
                {/* Grading Rules Editor */}
                {showGradingEditor && (
                  <div className="mt-6 p-4 bg-gray-750 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-medium text-white">Grading Rules ({SIZE_SYSTEMS[sizeSystem].name})</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={resetGradingRules}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                        >
                          Reset to Default
                        </button>
                      </div>
                    </div>
                    
                    {parsedPOMData.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {parsedPOMData.map((item) => {
                          const currentIncrement = customGradingRules[item.code] || 
                            SIZE_SYSTEMS[sizeSystem].defaultGradingRules[item.code] || 
                            getSuggestedIncrement(item.code, sizeSystem);
                          
                          return (
                            <div key={item.code} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                              <span className="text-white font-mono text-sm w-8">{item.code}</span>
                              <input
                                type="number"
                                value={currentIncrement}
                                onChange={(e) => updateGradingRule(item.code, parseFloat(e.target.value) || 0)}
                                step="0.1"
                                min="0"
                                max="10"
                                className="w-16 px-2 py-1 text-sm border border-gray-600 bg-gray-600 text-white rounded focus:border-purple-500"
                              />
                              <span className="text-gray-400 text-xs">cm</span>
                              <span className="text-gray-400 text-xs flex-1 truncate">{item.description}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Enter POM data above to configure grading rules</p>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-3">
                      Adjust increment values (cm per size grade). Changes apply immediately to the size chart.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Size Chart Table */}
              {showSizeChart && parsedPOMData.length > 0 && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">
                      Generated Size Chart - {SIZE_SYSTEMS[sizeSystem].name}
                    </h3>
                    <button
                      onClick={exportSizeChart}
                      className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-2 px-3 text-gray-300 font-medium">POM Code</th>
                          <th className="text-left py-2 px-3 text-gray-300 font-medium">Description</th>
                          <th className="text-center py-2 px-3 text-gray-300 font-medium">Grade</th>
                          {SIZE_SYSTEMS[sizeSystem].sizes.map(size => (
                            <th key={size} className={`text-center py-2 px-3 font-medium ${
                              size === baseSize ? 'text-purple-400 bg-purple-900/20' : 'text-gray-300'
                            }`}>
                              {size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPOMData.map((item, index) => {
                          const gradeIncrement = customGradingRules[item.code] || 
                            SIZE_SYSTEMS[sizeSystem].defaultGradingRules[item.code] || 
                            getSuggestedIncrement(item.code, sizeSystem);
                          
                          return (
                            <tr key={item.code} className={`border-b border-gray-700 ${
                              index % 2 === 0 ? 'bg-gray-750' : 'bg-gray-800'
                            }`}>
                              <td className="py-2 px-3 text-white font-mono">{item.code}</td>
                              <td className="py-2 px-3 text-gray-300">{item.description}</td>
                              <td className="py-2 px-3 text-center text-blue-400 text-xs">+{gradeIncrement}</td>
                              {SIZE_SYSTEMS[sizeSystem].sizes.map(size => (
                                <td key={size} className={`text-center py-2 px-3 ${
                                  size === baseSize ? 'text-purple-400 font-medium bg-purple-900/20' : 'text-gray-300'
                                }`}>
                                  {sizeChart[size]?.[item.code]?.toFixed(1)} cm
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-3">
                    Base size ({baseSize}) measurements are highlighted. Grade column shows increment per size step. 
                    {Object.keys(customGradingRules).length > 0 && " Custom grading rules are active."}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Generated Sketches */}
          {generatedSketches.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-white mb-6">
                Generated Technical Sketches
              </h2>
              <div className="space-y-6">
                {generatedSketches.map((sketch) => (
                  <div key={sketch.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Original Image */}
                      {uploadedImage && (
                        <div className="flex-1">
                          <h4 className="text-md font-medium text-white mb-2">Original Garment</h4>
                          <img
                            src={uploadedImage.preview}
                            alt={`Original ${sketch.originalName}`}
                            className="w-full max-w-sm h-64 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Generated Sketch or Analysis */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-md font-medium text-white">
                            {sketch.type === 'generated_image' ? 'Technical Sketch' : 'AI Analysis'}
                          </h4>
                          {sketch.sketchUrl && (
                            <button
                              onClick={() => sketch.sketchUrl && downloadSketch(sketch.sketchUrl, sketch.originalName)}
                              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                            >
                              Download
                            </button>
                          )}
                        </div>
                        
                        {sketch.sketchUrl ? (
                          <div>
                            <img
                              src={sketch.sketchUrl}
                              alt={`Technical sketch of ${sketch.originalName}`}
                              className="w-full max-w-sm h-64 object-contain bg-white rounded-lg mb-3"
                            />
                            <button
                              onClick={() => labelSketch(sketch.sketchUrl!, sketch.id)}
                              disabled={isLabeling}
                              className={`
                                w-full px-3 py-2 rounded text-sm font-medium transition-colors
                                ${isLabeling
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                                }
                              `}
                            >
                              {isLabeling ? 'Adding Labels...' : 'Add POM Labels'}
                            </button>
                          </div>
                        ) : (
                          <div className="w-full max-w-sm h-64 bg-gray-700 rounded-lg p-4 overflow-y-auto">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">
                              {sketch.description || 'No analysis available'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-400">
                        Generated: {sketch.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Labeled Sketches */}
          {labeledSketches.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-white mb-6">
                POM Labeled Technical Sketches
              </h2>
              <div className="space-y-6">
                {labeledSketches.map((labeled) => {
                  const originalSketch = generatedSketches.find(s => s.id === labeled.sketchId);
                  
                  return (
                    <div key={labeled.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Original Sketch */}
                        {originalSketch?.sketchUrl && (
                          <div className="flex-1">
                            <h4 className="text-md font-medium text-white mb-2">Original Sketch</h4>
                            <img
                              src={originalSketch.sketchUrl}
                              alt="Original technical sketch"
                              className="w-full max-w-sm h-64 object-contain bg-white rounded-lg"
                            />
                          </div>
                        )}

                        {/* Labeled Sketch */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-md font-medium text-white">POM Labeled Sketch</h4>
                            {labeled.labeledImageUrl && (
                              <button
                                onClick={() => labeled.labeledImageUrl && downloadSketch(labeled.labeledImageUrl, `labeled_${originalSketch?.originalName || 'sketch'}`)}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                              >
                                Download
                              </button>
                            )}
                          </div>
                          
                          {labeled.labeledImageUrl ? (
                            <img
                              src={labeled.labeledImageUrl}
                              alt="POM labeled technical sketch"
                              className="w-full max-w-sm h-64 object-contain bg-white rounded-lg"
                            />
                          ) : (
                            <div className="w-full max-w-sm h-64 bg-gray-700 rounded-lg p-4 overflow-y-auto">
                              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                {labeled.measurements || 'No measurements available'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* POM Reference */}
                      <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                        <h5 className="text-sm font-medium text-white mb-2">POM Reference:</h5>
                        <div className="text-xs text-gray-300 whitespace-pre-wrap">
                          {pomLabels || 'No POM labels specified'}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Labeled: {labeled.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
