import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTechnicalSketchPrompt } from '@/lib/prompts';

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
    const image = formData.get('image') as File;
    const reference = formData.get('reference') as File | null;
    const prompt = formData.get('prompt') as string;

    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Missing image or prompt parameter' },
        { status: 400 }
      );
    }

    console.log('🚀 [API] Generating sketch with Google Gemini...');
    console.log('📊 [API] Request Details:', {
      imageSize: image.size,
      imageType: image.type,
      imageName: image.name,
      hasReference: !!reference,
      referenceSize: reference?.size,
      referenceType: reference?.type,
      promptLength: prompt.length,
      timestamp: new Date().toISOString()
    });
    console.log('📝 [API] Prompt Preview:', prompt.substring(0, 200) + (prompt.length > 200 ? '...[truncated]' : ''));
    
    // Check if this is a POM labeling request (contains specific markers)
    const isPomLabeling = prompt.includes('ROLE') && prompt.includes('Technical Apparel Designer');
    console.log('🏷️ [API] Request Type:', isPomLabeling ? 'POM LABELING' : 'TECHNICAL SKETCH');
    
    if (isPomLabeling) {
      console.log('📏 [API] POM Labeling Request Detected');
      const annotationStart = prompt.indexOf('Annotation List:');
      if (annotationStart !== -1) {
        const annotationSection = prompt.substring(annotationStart, annotationStart + 300);
        console.log('📏 [API] Annotation List Preview:', annotationSection);
      }
    }

    // Initialize Google Generative AI - use different models for different operations
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    
    // Use Gemini 2.0 Flash for both POM labeling and sketch generation
    const modelName = "gemini-2.0-flash-exp";
    console.log('🤖 [API] Using model:', modelName, 'for', isPomLabeling ? 'POM LABELING' : 'TECHNICAL SKETCH');
    
    // Configure model based on operation type
    const modelConfig = {
      model: modelName,
      ...(modelName === "gemini-2.0-flash-exp" ? {
        generationConfig: {
          responseModalities: ["Text", "Image"]
        }
      } : {})
    };
    
    const model = genAI.getGenerativeModel(modelConfig);

    // Convert image to base64 for Gemini API
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // Create the image part for Gemini
    const imagePart = {
      inlineData: {
        mimeType: image.type,
        data: imageBase64,
      },
    };

    // Convert reference image to base64 if provided
    let referencePart = null;
    if (reference) {
      const referenceBuffer = await reference.arrayBuffer();
      const referenceBase64 = Buffer.from(referenceBuffer).toString('base64');
      referencePart = {
        inlineData: {
          mimeType: reference.type,
          data: referenceBase64,
        },
      };
      console.log('📋 [API] Reference image converted to base64');
    }

    // Enhanced prompt for technical sketch conversion using centralized prompts
    const technicalSketchPrompt = getTechnicalSketchPrompt(prompt);

    try {
      console.log('Sending request to Gemini 2.0 Flash...');
      
      // Prepare content parts - include reference image if available
      const contentParts = [
        { text: technicalSketchPrompt },
        imagePart
      ];
      
      if (referencePart) {
        contentParts.push(referencePart);
        console.log('📋 [API] Including reference image in request');
      }

      // Generate content with Gemini 2.0 Flash image generation (proper format)
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: contentParts
        }]
      });

      const response = result.response;
      console.log('Gemini response received, checking for content...');
      
      // Debug: Log the entire response structure
      console.log('Response candidates:', response.candidates?.length);
      
      // Check if we got a response with content
      if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        const content = response.candidates[0].content;
        console.log('Content parts found:', content.parts?.length);
        
        let textResponse = '';
        const imageGenerated = false;
        
        // Look through all parts of the response
        for (const part of content.parts) {
          console.log('Processing part:', Object.keys(part));
          
          if (part.inlineData) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            const dataUrl = `data:${mimeType};base64,${imageData}`;
            
            console.log('✅ Gemini generated technical sketch image!');

            return NextResponse.json({
              output_url: dataUrl,
              id: Math.random().toString(36).substring(2, 11),
              type: 'generated_image'
            });
          }
          
          // Collect text response
          if (part.text) {
            textResponse += part.text;
            console.log('Text part found:', part.text.substring(0, 100) + '...');
          }
        }
        
        // If we got text but no image, return the text analysis
        if (textResponse && !imageGenerated) {
          console.log('📝 [API RESPONSE] Gemini returned text analysis instead of image');
          const responseData = {
            output_url: null,
            description: textResponse,
            id: Math.random().toString(36).substring(2, 11),
            type: 'text_analysis'
          };
          console.log('📤 [API RESPONSE] Sending text analysis response:', {
            hasDescription: !!responseData.description,
            descriptionLength: responseData.description?.length,
            type: responseData.type,
            id: responseData.id
          });
          return NextResponse.json(responseData);
        }
      }

      // Fallback if no content was generated
      console.log('❌ [API RESPONSE] No content generated by Gemini');
      const errorResponseData = {
        output_url: null,
        description: 'No content generated. This may be due to content policies or the experimental nature of the feature.',
        id: Math.random().toString(36).substring(2, 11),
        type: 'error'
      };
      console.log('📤 [API RESPONSE] Sending error response:', errorResponseData);
      return NextResponse.json(errorResponseData);

    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError);
      return NextResponse.json(
        { error: `Gemini API Error: ${geminiError}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}