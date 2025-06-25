// Garment Customization Types and Interfaces
// Stage 2: Advanced Design Customization System

export interface ColorCustomization {
  mainColor: string;
  accentColor?: string;
  trimColor?: string;
  zones: {
    body: string;
    sleeves: string;
    collar: string;
    cuffs: string;
    pockets: string;
  };
}

export interface FabricCustomization {
  fabricType: FabricType;
  customFabricUrl?: string;
  scale: number; // 0.5 - 2.0
  rotation: number; // 0 - 360 degrees
  zones: {
    body: boolean;
    sleeves: boolean;
    collar: boolean;
    cuffs: boolean;
    pockets: boolean;
  };
}

export interface LogoCustomization {
  logoUrl: string;
  position: LogoPosition;
  size: LogoSize;
  style: LogoStyle;
  coordinates?: { x: number; y: number }; // For custom positioning
}

export interface TextCustomization {
  text: string;
  font: FontFamily;
  size: TextSize;
  color: string;
  position: LogoPosition; // Same positioning system as logos
  style: TextStyle;
  coordinates?: { x: number; y: number }; // For custom positioning
}

export interface GarmentCustomization {
  id: string;
  sketchId: string; // Reference to the original sketch
  colors?: ColorCustomization;
  fabric?: FabricCustomization;
  logos: LogoCustomization[];
  texts: TextCustomization[];
  timestamp: Date;
}

export interface CustomizedSketch {
  id: string;
  originalSketchId: string;
  customizationId: string;
  customizedImageUrl: string | null;
  customization: GarmentCustomization;
  timestamp: Date;
}

// Predefined Types
export type FabricType = 
  | 'cotton'
  | 'denim'
  | 'leather'
  | 'wool'
  | 'silk'
  | 'polyester'
  | 'linen'
  | 'canvas'
  | 'fleece'
  | 'mesh'
  | 'custom';

export type LogoPosition = 
  | 'chest-left'
  | 'chest-center'
  | 'chest-right'
  | 'back-upper'
  | 'back-center'
  | 'back-lower'
  | 'sleeve-left'
  | 'sleeve-right'
  | 'pocket-left'
  | 'pocket-right'
  | 'custom';

export type LogoSize = 'small' | 'medium' | 'large' | 'custom';

export type LogoStyle = 
  | 'embroidered'
  | 'printed'
  | 'applique'
  | 'heat-transfer'
  | 'screen-print'
  | 'vinyl';

export type FontFamily = 
  | 'sans-serif'
  | 'serif'
  | 'script'
  | 'display'
  | 'monospace';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';

export type TextStyle = 
  | 'normal'
  | 'bold'
  | 'italic'
  | 'outline'
  | 'shadow'
  | 'curved';

// Predefined Fabric Library
export const FABRIC_LIBRARY: Record<FabricType, { name: string; description: string; textureUrl?: string }> = {
  cotton: {
    name: 'Cotton',
    description: 'Soft, breathable natural fiber',
    textureUrl: '/textures/cotton.jpg'
  },
  denim: {
    name: 'Denim',
    description: 'Durable cotton twill weave',
    textureUrl: '/textures/denim.jpg'
  },
  leather: {
    name: 'Leather',
    description: 'Premium natural leather',
    textureUrl: '/textures/leather.jpg'
  },
  wool: {
    name: 'Wool',
    description: 'Warm natural fiber',
    textureUrl: '/textures/wool.jpg'
  },
  silk: {
    name: 'Silk',
    description: 'Luxurious smooth fabric',
    textureUrl: '/textures/silk.jpg'
  },
  polyester: {
    name: 'Polyester',
    description: 'Durable synthetic fabric',
    textureUrl: '/textures/polyester.jpg'
  },
  linen: {
    name: 'Linen',
    description: 'Lightweight breathable fabric',
    textureUrl: '/textures/linen.jpg'
  },
  canvas: {
    name: 'Canvas',
    description: 'Heavy duty cotton fabric',
    textureUrl: '/textures/canvas.jpg'
  },
  fleece: {
    name: 'Fleece',
    description: 'Soft insulating fabric',
    textureUrl: '/textures/fleece.jpg'
  },
  mesh: {
    name: 'Mesh',
    description: 'Breathable athletic fabric',
    textureUrl: '/textures/mesh.jpg'
  },
  custom: {
    name: 'Custom',
    description: 'Upload your own fabric pattern'
  }
};

// Position Coordinates (relative to garment)
export const POSITION_COORDINATES: Record<LogoPosition, { x: number; y: number; description: string }> = {
  'chest-left': { x: 0.25, y: 0.3, description: 'Left chest area' },
  'chest-center': { x: 0.5, y: 0.3, description: 'Center chest area' },
  'chest-right': { x: 0.75, y: 0.3, description: 'Right chest area' },
  'back-upper': { x: 0.5, y: 0.2, description: 'Upper back area' },
  'back-center': { x: 0.5, y: 0.4, description: 'Center back area' },
  'back-lower': { x: 0.5, y: 0.7, description: 'Lower back area' },
  'sleeve-left': { x: 0.15, y: 0.4, description: 'Left sleeve' },
  'sleeve-right': { x: 0.85, y: 0.4, description: 'Right sleeve' },
  'pocket-left': { x: 0.3, y: 0.6, description: 'Left pocket area' },
  'pocket-right': { x: 0.7, y: 0.6, description: 'Right pocket area' },
  'custom': { x: 0.5, y: 0.5, description: 'Custom position' }
};

// Size Mappings
export const LOGO_SIZE_MAP: Record<LogoSize, { width: number; height: number; description: string }> = {
  small: { width: 40, height: 40, description: '2" x 2"' },
  medium: { width: 60, height: 60, description: '3" x 3"' },
  large: { width: 80, height: 80, description: '4" x 4"' },
  custom: { width: 60, height: 60, description: 'Custom size' }
};

export const TEXT_SIZE_MAP: Record<TextSize, { fontSize: number; description: string }> = {
  xs: { fontSize: 12, description: 'Extra Small' },
  sm: { fontSize: 16, description: 'Small' },
  md: { fontSize: 20, description: 'Medium' },
  lg: { fontSize: 24, description: 'Large' },
  xl: { fontSize: 32, description: 'Extra Large' },
  custom: { fontSize: 20, description: 'Custom size' }
};

// Default Customization
export const createDefaultCustomization = (sketchId: string): GarmentCustomization => ({
  id: Math.random().toString(36).substring(2, 11),
  sketchId,
  colors: {
    mainColor: '#4A90E2',
    zones: {
      body: '#4A90E2',
      sleeves: '#4A90E2',
      collar: '#4A90E2',
      cuffs: '#4A90E2',
      pockets: '#4A90E2'
    }
  },
  fabric: {
    fabricType: 'cotton',
    scale: 1.0,
    rotation: 0,
    zones: {
      body: true,
      sleeves: true,
      collar: false,
      cuffs: false,
      pockets: false
    }
  },
  logos: [],
  texts: [],
  timestamp: new Date()
});

// Validation Functions
export function validateCustomization(customization: GarmentCustomization): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate colors
  if (customization.colors) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(customization.colors.mainColor)) {
      errors.push('Main color must be a valid hex color');
    }
  }
  
  // Validate logos
  customization.logos.forEach((logo, index) => {
    if (!logo.logoUrl) {
      errors.push(`Logo ${index + 1} is missing image URL`);
    }
    if (logo.position === 'custom' && !logo.coordinates) {
      errors.push(`Logo ${index + 1} has custom position but no coordinates`);
    }
  });
  
  // Validate texts
  customization.texts.forEach((text, index) => {
    if (!text.text.trim()) {
      errors.push(`Text ${index + 1} is empty`);
    }
  });
  
  return { isValid: errors.length === 0, errors };
}