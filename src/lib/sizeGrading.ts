// Enhanced Size Grading and POM Data Processing Utilities
// Supports multiple size systems (US/EU/UK) with configurable grading rules

export interface POMData {
  code: string;
  description: string;
  measurement: number;
}

export interface SizeChart {
  [size: string]: {
    [pomCode: string]: number;
  };
}

export interface GradingRules {
  [pomCode: string]: number;
}

export interface SizeSystemConfig {
  name: string;
  sizes: readonly string[];
  defaultGradingRules: GradingRules;
  sizeType: 'letter' | 'numeric';
}

// Size System Configurations
export const SIZE_SYSTEMS: Record<string, SizeSystemConfig> = {
  US: {
    name: 'US (Letter)',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    sizeType: 'letter',
    defaultGradingRules: {
      // Length measurements (vertical) - cm per size grade
      A: 2.5,    // Front Length From Shoulder
      F: 2.0,    // Sleeve Length
      G: 0.3,    // Collar Height
      H1: 1.0,   // Front Pocket Length
      I: 0.3,    // Cuff Height
      J: 0.3,    // Bottom Hem Height
      
      // Width measurements (horizontal) - cm per size grade
      B: 4.0,    // ½ Chest (most important grade)
      C: 3.0,    // ½ Bottom Width
      D: 1.5,    // ½ Biceps
      E: 2.0,    // Arm Hole (Curve)
      H2: 0.5,   // Front Pocket Width
      K: 2.0,    // Shoulder to Shoulder
      L: 1.0,    // Cuff Relax Width
    }
  },
  
  EU: {
    name: 'EU (Numeric)',
    sizes: ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52'],
    sizeType: 'numeric',
    defaultGradingRules: {
      // EU grading is typically smaller increments due to more size options
      A: 2.0,    // Front Length From Shoulder
      F: 1.5,    // Sleeve Length
      G: 0.25,   // Collar Height
      H1: 0.8,   // Front Pocket Length
      I: 0.25,   // Cuff Height
      J: 0.25,   // Bottom Hem Height
      
      B: 3.0,    // ½ Chest (smaller increments, more sizes)
      C: 2.5,    // ½ Bottom Width
      D: 1.2,    // ½ Biceps
      E: 1.5,    // Arm Hole (Curve)
      H2: 0.4,   // Front Pocket Width
      K: 1.5,    // Shoulder to Shoulder
      L: 0.8,    // Cuff Relax Width
    }
  },
  
  UK: {
    name: 'UK (Numeric)',
    sizes: ['4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24'],
    sizeType: 'numeric',
    defaultGradingRules: {
      // UK grading similar to EU but slightly different increments
      A: 2.2,    // Front Length From Shoulder
      F: 1.8,    // Sleeve Length
      G: 0.3,    // Collar Height
      H1: 0.9,   // Front Pocket Length
      I: 0.3,    // Cuff Height
      J: 0.3,    // Bottom Hem Height
      
      B: 3.5,    // ½ Chest
      C: 2.8,    // ½ Bottom Width
      D: 1.3,    // ½ Biceps
      E: 1.8,    // Arm Hole (Curve)
      H2: 0.45,  // Front Pocket Width
      K: 1.8,    // Shoulder to Shoulder
      L: 0.9,    // Cuff Relax Width
    }
  }
};

export type SizeSystemType = keyof typeof SIZE_SYSTEMS;
export type SizeValue = string;

// Default measurement type suggestions for auto-grading
export const MEASUREMENT_TYPE_SUGGESTIONS: Record<string, { type: 'length' | 'width' | 'small'; defaultUS: number; defaultEU: number; defaultUK: number }> = {
  length: { type: 'length', defaultUS: 2.5, defaultEU: 2.0, defaultUK: 2.2 },
  width: { type: 'width', defaultUS: 4.0, defaultEU: 3.0, defaultUK: 3.5 },
  small: { type: 'small', defaultUS: 0.5, defaultEU: 0.4, defaultUK: 0.45 },
};

/**
 * Parse POM input string into structured data
 * Supports multiple formats: "A - Front Length From Shoulder - 66" or table format
 */
export function parsePOMInput(pomInput: string): POMData[] {
  const lines = pomInput.trim().split('\n').filter(line => line.trim());
  const pomData: POMData[] = [];

  for (const line of lines) {
    // Skip header lines
    if (line.toLowerCase().includes('pom code') || line.toLowerCase().includes('description')) {
      continue;
    }

    // Try different separators: " - " or multiple spaces/tabs
    let parts: string[];
    
    if (line.includes(' - ')) {
      parts = line.split(' - ').map(part => part.trim());
    } else {
      // Handle table format with multiple spaces/tabs
      parts = line.split(/\s{2,}|\t+/).map(part => part.trim()).filter(part => part);
    }

    if (parts.length >= 3) {
      const code = parts[0];
      const description = parts[1];
      const measurementStr = parts[2];
      
      // Extract numeric value (remove "cm", spaces, etc.)
      const measurement = parseFloat(measurementStr.replace(/[^\d.]/g, ''));
      
      if (code && description && !isNaN(measurement) && measurement > 0) {
        pomData.push({
          code,
          description,
          measurement
        });
      }
    }
  }

  return pomData;
}

/**
 * Generate size chart from base measurements with configurable rules
 */
export function generateSizeChart(
  basePOMData: POMData[], 
  baseSize: SizeValue, 
  sizeSystem: SizeSystemType,
  customGradingRules?: GradingRules
): SizeChart {
  const systemConfig = SIZE_SYSTEMS[sizeSystem];
  const sizes = systemConfig.sizes;
  const gradingRules = customGradingRules || systemConfig.defaultGradingRules;
  
  const baseSizeIndex = sizes.indexOf(baseSize);
  if (baseSizeIndex === -1) {
    throw new Error(`Base size ${baseSize} not found in ${sizeSystem} system`);
  }
  
  const sizeChart: SizeChart = {};

  // Initialize all sizes
  for (const size of sizes) {
    sizeChart[size] = {};
  }

  // Calculate measurements for each size
  for (const pomItem of basePOMData) {
    const { code, measurement: baseMeasurement } = pomItem;
    const gradeIncrement = gradingRules[code] || getSuggestedIncrement(code, sizeSystem);

    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      const sizeGradeOffset = i - baseSizeIndex; // How many sizes away from base
      const adjustedMeasurement = baseMeasurement + (sizeGradeOffset * gradeIncrement);
      
      // Round to 1 decimal place and ensure positive values
      sizeChart[size][code] = Math.max(0.1, Math.round(adjustedMeasurement * 10) / 10);
    }
  }

  return sizeChart;
}

/**
 * Get suggested increment for unknown POM codes based on naming patterns
 */
export function getSuggestedIncrement(pomCode: string, sizeSystem: SizeSystemType): number {
  const systemConfig = SIZE_SYSTEMS[sizeSystem];
  const defaultRules = systemConfig.defaultGradingRules;
  
  // Try to find a similar measurement
  const codeUpper = pomCode.toUpperCase();
  
  // Check if it's a known code
  if (defaultRules[pomCode]) {
    return defaultRules[pomCode];
  }
  
  // Suggest based on measurement type patterns
  if (codeUpper.includes('LENGTH') || codeUpper.includes('HEIGHT')) {
    return MEASUREMENT_TYPE_SUGGESTIONS.length[`default${sizeSystem}` as keyof typeof MEASUREMENT_TYPE_SUGGESTIONS.length];
  } else if (codeUpper.includes('WIDTH') || codeUpper.includes('CHEST') || codeUpper.includes('HIP')) {
    return MEASUREMENT_TYPE_SUGGESTIONS.width[`default${sizeSystem}` as keyof typeof MEASUREMENT_TYPE_SUGGESTIONS.width];
  } else {
    return MEASUREMENT_TYPE_SUGGESTIONS.small[`default${sizeSystem}` as keyof typeof MEASUREMENT_TYPE_SUGGESTIONS.small];
  }
}

/**
 * Extract POM codes and descriptions for labeling (without measurements)
 */
export function extractPOMForLabeling(pomData: POMData[]): string {
  return pomData
    .map(item => `${item.code} - ${item.description}`)
    .join('\n');
}

/**
 * Format size chart for display with size system context
 */
export function formatSizeChartForDisplay(
  sizeChart: SizeChart, 
  pomData: POMData[], 
  sizeSystem: SizeSystemType
) {
  const systemConfig = SIZE_SYSTEMS[sizeSystem];
  const headers = ['POM Code', 'Description', ...systemConfig.sizes];
  const rows = pomData.map(item => [
    item.code,
    item.description,
    ...systemConfig.sizes.map(size => `${sizeChart[size][item.code]} cm`)
  ]);

  return { headers, rows, systemName: systemConfig.name };
}

/**
 * Export size chart as CSV with system information
 */
export function exportSizeChartAsCSV(
  sizeChart: SizeChart, 
  pomData: POMData[], 
  sizeSystem: SizeSystemType,
  baseSize: SizeValue
): string {
  const { headers, rows, systemName } = formatSizeChartForDisplay(sizeChart, pomData, sizeSystem);
  
  const csvContent = [
    `# Size Chart - ${systemName} (Base Size: ${baseSize})`,
    `# Generated on ${new Date().toLocaleDateString()}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Save custom grading rules to localStorage
 */
export function saveCustomGradingRules(sizeSystem: SizeSystemType, rules: GradingRules, name: string): void {
  const key = `custom-grading-rules-${sizeSystem}`;
  const existing = JSON.parse(localStorage.getItem(key) || '{}');
  existing[name] = rules;
  localStorage.setItem(key, JSON.stringify(existing));
}

/**
 * Load custom grading rules from localStorage
 */
export function loadCustomGradingRules(sizeSystem: SizeSystemType): Record<string, GradingRules> {
  const key = `custom-grading-rules-${sizeSystem}`;
  return JSON.parse(localStorage.getItem(key) || '{}');
}

/**
 * Get default grading rules for a size system
 */
export function getDefaultGradingRules(sizeSystem: SizeSystemType): GradingRules {
  return { ...SIZE_SYSTEMS[sizeSystem].defaultGradingRules };
}

/**
 * Validate grading rules (ensure all values are positive numbers)
 */
export function validateGradingRules(rules: GradingRules): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [code, increment] of Object.entries(rules)) {
    if (typeof increment !== 'number' || isNaN(increment)) {
      errors.push(`${code}: Must be a valid number`);
    } else if (increment < 0) {
      errors.push(`${code}: Must be positive`);
    } else if (increment > 10) {
      errors.push(`${code}: Seems too large (>10cm per size)`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Generate size charts for all size systems
 */
export function generateAllSizeCharts(
  pomData: POMData[], 
  baseSizeSystem: SizeSystemType,
  baseSize: SizeValue,
  customGradingRules?: GradingRules
): Record<SizeSystemType, { chart: SizeChart; systemConfig: SizeSystemConfig }> {
  const result: Record<string, any> = {};
  
  for (const [systemKey, systemConfig] of Object.entries(SIZE_SYSTEMS)) {
    const sizeSystem = systemKey as SizeSystemType;
    
    // Use custom rules only for the base system, defaults for others
    const gradingRules = (sizeSystem === baseSizeSystem && customGradingRules) 
      ? customGradingRules 
      : undefined;
    
    // Map base size to equivalent size in target system
    const targetBaseSize = mapSizeAcrossSystems(baseSize, baseSizeSystem, sizeSystem);
    
    const chart = generateSizeChart(pomData, targetBaseSize, sizeSystem, gradingRules);
    
    result[sizeSystem] = {
      chart,
      systemConfig
    };
  }
  
  return result as Record<SizeSystemType, { chart: SizeChart; systemConfig: SizeSystemConfig }>;
}

/**
 * Map a size from one system to equivalent size in another system
 * This is a simplified mapping - in reality, this would need more sophisticated conversion
 */
function mapSizeAcrossSystems(size: SizeValue, fromSystem: SizeSystemType, toSystem: SizeSystemType): SizeValue {
  if (fromSystem === toSystem) return size;
  
  const fromSizes = SIZE_SYSTEMS[fromSystem].sizes;
  const toSizes = SIZE_SYSTEMS[toSystem].sizes;
  
  const fromIndex = fromSizes.indexOf(size);
  if (fromIndex === -1) return toSizes[1]; // Default to second size
  
  // Simple proportional mapping
  const proportion = fromIndex / (fromSizes.length - 1);
  const targetIndex = Math.round(proportion * (toSizes.length - 1));
  
  return toSizes[Math.min(targetIndex, toSizes.length - 1)];
}

/**
 * Convert image URL to blob for ZIP packaging
 */
export async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return response.blob();
}

/**
 * Generate a comprehensive project summary
 */
export function generateProjectSummary(
  pomData: POMData[],
  baseSizeSystem: SizeSystemType,
  baseSize: SizeValue,
  originalImageName?: string,
  customGradingRules?: GradingRules
): string {
  const timestamp = new Date().toLocaleString();
  const activeCustomRules = customGradingRules && Object.keys(customGradingRules).length > 0;
  
  return `# Fashion Technical Sketch Project Summary

## Project Details
- Generated: ${timestamp}
- Original Image: ${originalImageName || 'Unknown'}
- Base Size System: ${SIZE_SYSTEMS[baseSizeSystem].name}
- Base Size: ${baseSize}
- Custom Grading Rules: ${activeCustomRules ? 'Yes' : 'No'}

## Point of Measure (POM) Specifications
Total Measurements: ${pomData.length}

${pomData.map(item => `${item.code} - ${item.description}: ${item.measurement} cm`).join('\n')}

## Size Systems Generated
- US (Letter): XS, S, M, L, XL, XXL, XXXL
- EU (Numeric): 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52
- UK (Numeric): 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24

## Grading Rules Applied
${activeCustomRules ? 'Custom grading rules were used for the base system.' : 'Industry standard grading rules were used.'}

${activeCustomRules ? Object.entries(customGradingRules!).map(([code, increment]) => 
  `${code}: +${increment}cm per size grade`
).join('\n') : ''}

## File Contents
- project-summary.txt: This summary file
- size-charts/: Size charts for all systems (US, EU, UK)
- sketches/: Technical sketches and labeled images
- original/: Original uploaded image

---
Generated by Fashion Technical Sketch Generator
`;
}

/**
 * Create comprehensive export package with all size charts and images
 */
export async function createComprehensiveExport(
  pomData: POMData[],
  baseSizeSystem: SizeSystemType,
  baseSize: SizeValue,
  generatedSketches: Array<{ id: string; originalName: string; sketchUrl: string | null }>,
  labeledSketches: Array<{ id: string; sketchId: string; labeledImageUrl: string | null }>,
  originalImage?: { name: string; preview: string },
  customGradingRules?: GradingRules
): Promise<Blob> {
  // Dynamically import JSZip to avoid SSR issues
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  // Generate all size charts
  const allSizeCharts = generateAllSizeCharts(pomData, baseSizeSystem, baseSize, customGradingRules);
  
  // Add project summary
  const summary = generateProjectSummary(pomData, baseSizeSystem, baseSize, originalImage?.name, customGradingRules);
  zip.file('project-summary.txt', summary);
  
  // Add size charts for all systems
  const sizeChartsFolder = zip.folder('size-charts');
  if (sizeChartsFolder) {
    for (const [systemKey, { chart, systemConfig }] of Object.entries(allSizeCharts)) {
      const sizeSystem = systemKey as SizeSystemType;
      const csvContent = exportSizeChartAsCSV(chart, pomData, sizeSystem, mapSizeAcrossSystems(baseSize, baseSizeSystem, sizeSystem));
      sizeChartsFolder.file(`${systemKey}-size-chart.csv`, csvContent);
    }
  }
  
  // Add original image if available
  if (originalImage) {
    const originalFolder = zip.folder('original');
    if (originalFolder) {
      try {
        const imageBlob = await urlToBlob(originalImage.preview);
        originalFolder.file(originalImage.name, imageBlob);
      } catch (error) {
        console.warn('Failed to add original image to export:', error);
      }
    }
  }
  
  // Add generated sketches
  if (generatedSketches.length > 0) {
    const sketchesFolder = zip.folder('sketches');
    if (sketchesFolder) {
      for (const sketch of generatedSketches) {
        if (sketch.sketchUrl) {
          try {
            const sketchBlob = await urlToBlob(sketch.sketchUrl);
            const fileName = `technical-sketch-${sketch.originalName}.png`;
            sketchesFolder.file(fileName, sketchBlob);
          } catch (error) {
            console.warn(`Failed to add sketch ${sketch.id} to export:`, error);
          }
        }
      }
    }
  }
  
  // Add labeled sketches
  if (labeledSketches.length > 0) {
    const labeledFolder = zip.folder('labeled-sketches');
    if (labeledFolder) {
      for (const labeled of labeledSketches) {
        if (labeled.labeledImageUrl) {
          try {
            const labeledBlob = await urlToBlob(labeled.labeledImageUrl);
            const fileName = `labeled-sketch-${labeled.id}.png`;
            labeledFolder.file(fileName, labeledBlob);
          } catch (error) {
            console.warn(`Failed to add labeled sketch ${labeled.id} to export:`, error);
          }
        }
      }
    }
  }
  
  // Generate and return ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}