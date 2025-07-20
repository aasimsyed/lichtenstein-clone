import { NextRequest, NextResponse } from 'next/server';

// Type for artwork content
interface ArtworkContent {
  [artworkId: string]: string;
}

// R2 worker base URL
const R2_WORKER_BASE_URL = 'https://r2-image-worker.aasim-ss.workers.dev';
const CONTENT_FILE_KEY = 'artwork-content.json';

// Helper function to fetch content from R2
async function fetchContentFromR2(): Promise<ArtworkContent> {
  try {
    const response = await fetch(`${R2_WORKER_BASE_URL}/${CONTENT_FILE_KEY}`);
    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      // File doesn't exist yet, return empty object
      return {};
    } else {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error fetching content from R2:', error);
    return {};
  }
}

// Helper function to save content to R2
async function saveContentToR2(content: ArtworkContent): Promise<void> {
  try {
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(content, null, 2)], { 
      type: 'application/json' 
    });
    formData.append('file', jsonBlob, CONTENT_FILE_KEY);

    const response = await fetch(`${R2_WORKER_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to save content: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error saving content to R2:', error);
    throw error;
  }
}

// GET endpoint - fetch content for specific artwork
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artworkId = decodeURIComponent(id);
    
    const allContent = await fetchContentFromR2();
    const content = allContent[artworkId] || '';
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error in GET /api/artwork-content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// POST endpoint - save content for specific artwork
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artworkId = decodeURIComponent(id);
    const { content } = await request.json();
    
    // Fetch existing content
    const allContent = await fetchContentFromR2();
    
    // Update content for this artwork
    if (content && content.trim()) {
      allContent[artworkId] = content.trim();
    } else {
      // Remove empty content
      delete allContent[artworkId];
    }
    
    // Save back to R2
    await saveContentToR2(allContent);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/artwork-content:', error);
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    );
  }
} 