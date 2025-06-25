export interface ImageEditRequest {
  image: File;
  style: string;
}

export interface ImageEditResponse {
  output_url: string | null;
  description?: string;
  id: string;
  type?: string;
}

export const editImageWithStyle = async (request: ImageEditRequest): Promise<ImageEditResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', request.image);
    formData.append('prompt', request.style);

    const response = await fetch('/api/generate-sketch', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Sketch generation error:', error);
    throw error;
  }
};

export const STYLE_PRESETS = [
  'vintage retro style',
  'modern minimalist style', 
  'artistic watercolor style',
  'professional studio lighting',
  'high fashion editorial style',
  'casual street style',
  'elegant formal style',
  'bohemian aesthetic',
  'urban grunge style',
  'classic black and white',
  'bright colorful style',
  'matte film photography',
];