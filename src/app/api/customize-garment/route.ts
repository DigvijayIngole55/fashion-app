import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const baseImage = formData.get('baseImage') as File;
    const color = formData.get('color') as string | null;
    const textureImage = formData.get('textureImage') as File | null;
    const logoImage = formData.get('logoImage') as File | null;

    console.log('🎨 [GARMENT CUSTOMIZATION] Request received:', {
      hasBaseImage: !!baseImage,
      hasColor: !!color,
      hasTexture: !!textureImage,
      hasLogo: !!logoImage,
      color: color || 'none'
    });

    if (!baseImage) {
      return NextResponse.json(
        { error: 'Base image is required' },
        { status: 400 }
      );
    }

    // Check if at least one customization is provided
    if (!color && !textureImage && !logoImage) {
      return NextResponse.json(
        { error: 'At least one customization option (color, texture, or logo) is required' },
        { status: 400 }
      );
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: ["Text", "Image"]
      } as any
    });

    // Convert base image to base64
    const baseImageBuffer = await baseImage.arrayBuffer();
    const baseImageBase64 = Buffer.from(baseImageBuffer).toString('base64');

    const baseImagePart = {
      inlineData: {
        mimeType: baseImage.type,
        data: baseImageBase64,
      },
    };

    // Prepare content parts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentParts: any[] = [];

    // Build customization prompt
    let customizationPrompt = `Transform this garment image with the following customizations:

ORIGINAL GARMENT: The base garment shown in the image.

CUSTOMIZATIONS TO APPLY:`;

    // Add color customization
    if (color) {
      customizationPrompt += `\n\n1. COLOR CHANGE:
- Change the main garment color to: ${color}
- Apply this color to the primary fabric areas (body, sleeves, main panels)
- Keep original garment structure and details
- Maintain realistic fabric appearance with the new color`;
      
      console.log('🎨 [CUSTOMIZATION] Color change requested:', color);
    }

    // Add texture customization
    if (textureImage) {
      const textureBuffer = await textureImage.arrayBuffer();
      const textureBase64 = Buffer.from(textureBuffer).toString('base64');
      
      const texturePart = {
        inlineData: {
          mimeType: textureImage.type,
          data: textureBase64,
        },
      };
      
      contentParts.push(texturePart);
      
      customizationPrompt += `\n\n2. FABRIC TEXTURE:
- Apply the fabric texture pattern shown in the texture reference image
- Replace the garment's fabric with this new texture/pattern
- Maintain the garment's shape and structure
- Make the texture appear realistic on the garment surface
- Scale the texture appropriately for the garment size`;
      
      console.log('🧵 [CUSTOMIZATION] Texture application requested');
    }

    // Add logo customization
    if (logoImage) {
      const logoBuffer = await logoImage.arrayBuffer();
      const logoBase64 = Buffer.from(logoBuffer).toString('base64');
      
      const logoPart = {
        inlineData: {
          mimeType: logoImage.type,
          data: logoBase64,
        },
      };
      
      contentParts.push(logoPart);
      
      customizationPrompt += `\n\n3. LOGO PLACEMENT:
- Add the logo shown in the logo image to the garment
- Place the logo in an appropriate location (chest area, prominent but not overpowering)
- Size the logo appropriately for the garment (not too large, not too small)
- Make it look like the logo is applied to the fabric (embroidered, printed, or sewn-on appearance)
- Ensure the logo maintains good visibility and professional appearance`;
      
      console.log('🏷️ [CUSTOMIZATION] Logo placement requested');
    }

    customizationPrompt += `\n\nOUTPUT REQUIREMENTS:
- Generate a new image showing the garment with all requested customizations applied
- Maintain the original garment's style, fit, and structure
- Make customizations look realistic and professionally applied
- Ensure high quality and clear details
- The result should look like a real customized garment photo

Apply these customizations to create a new version of the garment.`;

    console.log('📝 [CUSTOMIZATION] Generated prompt preview:', customizationPrompt.substring(0, 300) + '...');

    // Prepare final content array
    const finalContent = [
      { text: customizationPrompt },
      baseImagePart,
      ...contentParts
    ];

    console.log('🤖 [CUSTOMIZATION] Sending request to Gemini with', finalContent.length, 'content parts');

    // Generate customized garment
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: finalContent
      }]
    });

    const response = result.response;
    console.log('📨 [CUSTOMIZATION] Gemini response received');

    // Check for image in response
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
            console.log('✅ [CUSTOMIZATION] Generated image found, returning success');
            
            // Convert to data URL for frontend
            const imageDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            
            return NextResponse.json({
              success: true,
              customizedImageUrl: imageDataUrl,
              customizations: {
                color: color || null,
                hasTexture: !!textureImage,
                hasLogo: !!logoImage
              },
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    // If no image found, check for text response
    const text = response.text();
    console.log('⚠️ [CUSTOMIZATION] No image generated, text response:', text.substring(0, 200));
    
    return NextResponse.json(
      { error: 'AI could not generate customized image. Please try again with different customizations.' },
      { status: 500 }
    );

  } catch (error) {
    console.error('💥 [CUSTOMIZATION] Error:', error);
    return NextResponse.json(
      { error: 'Failed to customize garment. Please try again.' },
      { status: 500 }
    );
  }
}