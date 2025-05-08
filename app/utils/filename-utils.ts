/**
 * Utility function to parse filenames and extract catalog numbers and titles
 * This file can be imported by both client and server components
 */

/**
 * Parses an image URL to extract details from filename
 * Examples of R2 bucket filename patterns:
 * - "BBC22_55_Patti.Smith_Radio.Ethiopia.jpg" -> catalogNumber: "BBC22", size: "55mm", artist: "Patti Smith", title: "Radio Ethiopia"
 * - "BBC20_32_Fare.Fight.jpg" -> catalogNumber: "BBC20", size: "32mm", artist: "Fare Fight", title: "Untitled"
 * - "FZ_Punk.Zine_2.jpg" -> catalogNumber: "FZ", size: "Flyer/Zine", artist: "Flyer/Zine", title: "Punk Zine #2"
 */
export const parseFilename = (url: string): { 
  catalogNumber: string; 
  size: string;
  artist: string;
  title: string;
} => {
  // Remove the timestamp parameter if present (used for cache busting)
  const cleanUrl = url.split('?')[0];
  
  // Extract filename and remove file extension if present
  const fullFilename = cleanUrl.split('/').pop() || '';
  const filename = fullFilename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
  
  // Debug the parsing process
  // console.log(`Parsing filename: ${filename}`);
  
  const parts = filename.split('_');
  
  // Special handling for FZ catalog IDs (Flyers/Zines)
  if (parts[0] === 'FZ') {
    // Format: FZ_Title_IssueNumber
    let title = 'Unknown';
    let issueNumber = '';
    
    if (parts.length > 1) {
      title = parts[1].replace(/\./g, ' ');
    }
    
    if (parts.length > 2) {
      issueNumber = `#${parts[2]}`;
    }
    
    return {
      catalogNumber: 'FZ',
      size: 'Flyer/Zine',
      artist: 'Flyer/Zine',
      title: `${title} ${issueNumber}`.trim()
    };
  }
  
  // Handle basic or missing information
  if (parts.length < 2) {
    return { 
      catalogNumber: parts[0] || 'Unknown', 
      size: 'Unknown',
      artist: 'Unknown',
      title: 'Untitled'
    };
  }
  
  // Parse catalog number (first part)
  const catalogNumber = parts[0];
  
  // Different parsing logic based on number of parts
  if (parts.length === 2) {
    // Format with only size: "BBC22_55.jpg"
    return {
      catalogNumber,
      size: `${parts[1]}mm`,
      artist: 'Unknown',
      title: 'Untitled'
    };
  }
  else if (parts.length === 3) {
    // Format: "BBC20_32_Fare.Fight.jpg"
    // Size is second part, artist is third
    const size = `${parts[1]}mm`;
    const artist = parts[2].replace(/\./g, ' ');
    
    return {
      catalogNumber,
      size,
      artist,
      title: 'Untitled'
    };
  } else {
    // Format with size and title: "BBC22_55_Patti.Smith_Radio.Ethiopia.jpg"
    const size = `${parts[1]}mm`;
    const artist = parts[2].replace(/\./g, ' ');
    const title = parts[3].replace(/\./g, ' ');
    
    return { 
      catalogNumber, 
      size, 
      artist, 
      title 
    };
  }
}; 