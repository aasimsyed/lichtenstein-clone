/**
 * Utility function to parse filenames and extract catalog numbers and titles
 * This file can be imported by both client and server components
 */

/**
 * Parses a Cloudinary image URL to extract details from filename
 * Examples: 
 * - For URL ending with "B1_55_Patti.Smith_Radio.Ethiopia_bswh94",
 *   returns { catalogNumber: "B1", size: "55mm", artist: "Patti Smith", title: "Radio Ethiopia" }
 * - For URL ending with "B20_32_Fare.Fight_lh0dzb",
 *   returns { catalogNumber: "B20", size: "32mm", artist: "Fare Fight", title: "Untitled" }
 * - For URL ending with "B19_Portobello.Rd_jsir0z.jpg",
 *   returns { catalogNumber: "B19", size: "Unknown", artist: "Portobello Rd", title: "Untitled" }
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
  const filename = fullFilename.replace(/\.(jpg|jpeg|png|gif)$/i, '');
  
  const parts = filename.split('_');
  
  // Special handling for FZ catalog IDs (Flyers/Zines)
  if (parts[0] === 'FZ') {
    // Format: FZ_Title_IssueNumber
    return {
      catalogNumber: filename, // Use the full filename as the catalogNumber to preserve for display
      size: 'Flyer/Zine',
      artist: 'Flyer/Zine',
      title: parts.length > 1 ? parts[1].replace(/\./g, ' ') : 'Unknown'
    };
  }
  
  // Handle different filename patterns
  if (parts.length < 3) {
    return { 
      catalogNumber: 'Unknown', 
      size: 'Unknown',
      artist: 'Unknown',
      title: filename 
    };
  }
  
  // Parse catalog number (first part)
  const catalogNumber = parts[0];
  
  // Different parsing logic based on number of parts
  if (parts.length === 3) {
    // Format: B19_Portobello.Rd_jsir0z
    // Size is missing, 3rd part is an identifier
    const artist = parts[1].replace(/\./g, ' ');
    
    return {
      catalogNumber,
      size: 'Unknown',
      artist,
      title: 'Untitled'
    };
  } else {
    // Format with size: B1_55_Patti.Smith_Radio.Ethiopia_bswh94
    // or Format with size but no title: B20_32_Fare.Fight_lh0dzb
    
    // Parse size (second part) and add 'mm'
    const size = `${parts[1]}mm`;
    
    // Parse artist (third part) - replace dots with spaces
    const artist = parts[2].replace(/\./g, ' ');
    
    // Parse title (fourth part) - replace dots with spaces
    // If there's no fourth part or it's the last part (likely an identifier), use "Untitled"
    const title = (parts.length >= 5 && parts[3]) ? parts[3].replace(/\./g, ' ') : 'Untitled';
    
    return { catalogNumber, size, artist, title };
  }
}; 