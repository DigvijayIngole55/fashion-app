// AI Prompts Configuration - Alternative Strategies
// Different approaches to prevent descriptive text in POM labeling

export const AI_PROMPTS = {
  // Technical Sketch Generation (keeping what works)
  TECHNICAL_SKETCH: {
    CLIENT_PROMPT: `Create a clean technical flat sketch of this garment showing BOTH front and back views. Black line art on white background with all construction details.`,
    
    API_ENHANCEMENT: `Create a technical flat sketch with BOTH front and back views:

LAYOUT: Two views side by side - front view (left) and back view (right)

REQUIREMENTS:
- Black line art on white background only
- Show all construction details: seams, darts, topstitching, pockets, zippers
- Both views must be included even if source shows only front
- Infer back view construction based on garment type and front details
- Clean fashion industry CAD style drawing
- Flat 2D representation
- Consistent line weights, no shading or textures`
  },

  // Strategy 1: Format the input differently - remove descriptions entirely
  POM_LABELING_NO_DESC: {
    TEMPLATE: (pomLabels: string) => {
      // Extract only the letters without descriptions
      const lettersOnly = pomLabels
        .split('\n')
        .map(line => line.split(' - ')[0])
        .filter(letter => letter.trim())
        .join(', ');
      
      return `Add measurement lines labeled: ${lettersOnly}

Draw black lines with tick marks. Place only these letter codes on the image. No other text.`;
    }
  },

  // Strategy 2: Visual instruction emphasis
  POM_LABELING_VISUAL: {
    TEMPLATE: (pomLabels: string) => `VISUAL TASK: Add measurement annotations.

WHAT TO DRAW:
✓ Thin black lines
✓ Small tick marks at line ends
✓ Single letters: A B C D E F G H1 H2 I J K L

WHAT NOT TO DRAW:
✗ NO words
✗ NO descriptions
✗ NO text except single letters

Reference:
${pomLabels}

Remember: ONLY LETTERS on the image!`
  },

  // Strategy 3: Step instruction
  POM_LABELING_STEPS: {
    TEMPLATE: () => `Follow these exact steps:

Step 1: Draw measurement line for front length (vertical line) - Label it "A"
Step 2: Draw chest measurement line (horizontal at chest) - Label it "B"
Step 3: Draw bottom width line (horizontal at hem) - Label it "C"
Step 4: Draw bicep line (horizontal on sleeve) - Label it "D"
Step 5: Draw armhole curve - Label it "E"
Step 6: Draw sleeve length line - Label it "F"
Step 7: Draw collar height line - Label it "G"
Step 8: Draw front pocket length - Label it "H1"
Step 9: Draw front pocket width - Label it "H2"
Step 10: Draw cuff height - Label it "I"
Step 11: Draw hem height - Label it "J"
Step 12: Draw shoulder line - Label it "K"
Step 13: Draw cuff width - Label it "L"

Use ONLY the letter labels shown above.`
  },

};

// Helper function to get the complete technical sketch prompt
export const getTechnicalSketchPrompt = (basePrompt: string) => {
  return `${basePrompt} 

${AI_PROMPTS.TECHNICAL_SKETCH.API_ENHANCEMENT}`;
};

// Helper function to try different strategies
export const getPomLabelingPrompt = (pomLabels: string, strategy = 'visual') => {
  switch(strategy) {
    case 'no_desc':
      return AI_PROMPTS.POM_LABELING_NO_DESC.TEMPLATE(pomLabels);
    case 'visual':
      return AI_PROMPTS.POM_LABELING_VISUAL.TEMPLATE(pomLabels);
    case 'steps':
      return AI_PROMPTS.POM_LABELING_STEPS.TEMPLATE();
    default:
      return AI_PROMPTS.POM_LABELING_VISUAL.TEMPLATE(pomLabels);
  }
};

// Example POM labels for reference
export const EXAMPLE_POM_LABELS = `A - Front Length From Shoulder - 66
B - ½ Chest - 54
C - ½ Bottom Width - 44
D - ½ Biceps - 21
E - Arm Hole (Curve) - 26
F - Sleeve Length - 65
G - Collar Height - 7
H1 - Front Pocket Length - 17
H2 - Front Pocket Width - 2
I - Cuff Height - 6.5
J - Bottom Hem Height - 6.5
K - Shoulder to Shoulder - 47
L - Cuff Relax Width - 9.5`;

// Usage examples:
// Try different strategies to see which works best with Flash 2.0:
// const pomPrompt1 = getPomLabelingPrompt(EXAMPLE_POM_LABELS, 'no_desc');
// const pomPrompt2 = getPomLabelingPrompt(EXAMPLE_POM_LABELS, 'visual');
// const pomPrompt3 = getPomLabelingPrompt(EXAMPLE_POM_LABELS, 'steps');