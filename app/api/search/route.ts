import { NextRequest, NextResponse } from 'next/server';
import { fetchCloudinaryImages } from '../../utils/cloudinary-server';
import { parseFilename } from '../../utils/filename-utils';

// Define Artwork interface
interface Artwork {
  id: number;
  title: string;
  date: string;
  medium: string;
  dimensions: string;
  location: string;
  catalogueNumber: string;
  artist: string;
  size: string;
  imageUrl: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get search term from URL query parameters
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('query')?.toLowerCase() || '';
    
    // Get filter parameters
    const seriesA = searchParams.get('seriesA') === 'true';
    const seriesB = searchParams.get('seriesB') === 'true';
    
    // Get additional filters
    const filterBBB = searchParams.get('filterBBB') === 'true';
    const filterBBC = searchParams.get('filterBBC') === 'true';
    const filterD = searchParams.get('filterD') === 'true';
    const filterRGG = searchParams.get('filterRGG') === 'true';
    const filterPreBetterBadges = searchParams.get('filterPreBetterBadges') === 'true';
    const filterPopArtKoop = searchParams.get('filterPopArtKoop') === 'true';
    const filterCatalogs = searchParams.get('filterCatalogs') === 'true';
    const filterZines = searchParams.get('filterZines') === 'true';
    
    // Check if any filters are active
    const anyFilterActive = seriesA || seriesB || filterBBB || 
                            filterBBC || filterD || filterRGG || filterPreBetterBadges || 
                            filterPopArtKoop || filterCatalogs || filterZines;
    
    // Get sorting parameters
    const sortBy = searchParams.get('sortBy') || 'catno_ASC';
    
    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Fetch all images from Cloudinary
    const images = await fetchCloudinaryImages();
    
    // Map to artwork objects
    const artworks: Artwork[] = images.map((image, i) => {
      const { catalogNumber, title, artist, size } = parseFilename(image.secure_url);
      
      // Special handling for FZ items (Flyers/Zines)
      let processedTitle = title;
      if (catalogNumber.startsWith('FZ_')) {
        // Extract title from the catalog ID format: FZ_Title_IssueNumber
        const parts = catalogNumber.split('_');
        if (parts.length >= 2) {
          processedTitle = parts[1].replace(/\./g, ' ');
        }
      }
      
      return {
        id: i + 1,
        title: processedTitle,
        date: '',
        medium: catalogNumber.startsWith('FZ_') ? 'Flyer/Zine' : 'Oil and Magna on canvas',
        dimensions: '68 x 56 in (172.7 x 142.2 cm)',
        location: 'Private Collection',
        catalogueNumber: catalogNumber,
        artist,
        size,
        imageUrl: image.secure_url
      };
    });
    
    // Apply filtering with union logic (show items matching ANY selected filter)
    let filteredWorks = artworks;
    
    if (anyFilterActive) {
      filteredWorks = artworks.filter(work => {
        // Array to collect all filter match results - explicitly typed as boolean[]
        const filterMatches: boolean[] = [];
        
        // Add results for each filter check
        if (seriesA) {
          filterMatches.push(/^A\d+$/.test(work.catalogueNumber) || work.catalogueNumber === 'A');
        }
        
        if (seriesB) {
          filterMatches.push(/^B\d+$/.test(work.catalogueNumber) || work.catalogueNumber === 'B');
        }
        
        if (filterBBB) {
          filterMatches.push(work.catalogueNumber.startsWith('BBB'));
        }
        
        if (filterBBC) {
          filterMatches.push(work.catalogueNumber.startsWith('BBC'));
        }
        
        if (filterD) {
          filterMatches.push(work.catalogueNumber.startsWith('D'));
        }
        
        if (filterRGG) {
          filterMatches.push(work.catalogueNumber.startsWith('JAH'));
        }
        
        if (filterPreBetterBadges) {
          filterMatches.push(work.catalogueNumber.startsWith('FF'));
        }
        
        if (filterPopArtKoop) {
          filterMatches.push(work.catalogueNumber.startsWith('BIG'));
        }
        
        if (filterCatalogs) {
          filterMatches.push(work.catalogueNumber.startsWith('AD'));
        }
        
        if (filterZines) {
          filterMatches.push(work.catalogueNumber.startsWith('FZ'));
        }
        
        // If any filter matched (union/OR logic), include this artwork
        return filterMatches.some(match => match === true);
      });
    }
    
    // Apply search term filtering if search term exists
    if (searchTerm) {
      filteredWorks = filteredWorks.filter(work => 
        work.title.toLowerCase().includes(searchTerm) ||
        work.medium.toLowerCase().includes(searchTerm) ||
        work.catalogueNumber.toLowerCase().includes(searchTerm) ||
        work.artist.toLowerCase().includes(searchTerm) ||
        work.size.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    const getSortComparator = (sortOption: string) => {
      switch (sortOption) {
        case 'catno_ASC':
          return (a: Artwork, b: Artwork) => 
            a.catalogueNumber.localeCompare(b.catalogueNumber, undefined, { numeric: true, sensitivity: 'base' });
        
        case 'catno_DESC':
          return (a: Artwork, b: Artwork) => 
            b.catalogueNumber.localeCompare(a.catalogueNumber, undefined, { numeric: true, sensitivity: 'base' });
        
        case 'cattitle_ASC':
          return (a: Artwork, b: Artwork) => 
            a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        
        case 'cattitle_DESC':
          return (a: Artwork, b: Artwork) => 
            b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
        
        default:
          return (a: Artwork, b: Artwork) => 
            a.catalogueNumber.localeCompare(b.catalogueNumber, undefined, { numeric: true, sensitivity: 'base' });
      }
    };
    
    filteredWorks.sort(getSortComparator(sortBy));
    
    // Calculate pagination
    const totalResults = filteredWorks.length;
    const startIndex = page * limit;
    const endIndex = Math.min(startIndex + limit, totalResults);
    const paginatedWorks = filteredWorks.slice(startIndex, endIndex);
    
    // Add cache headers - cache for 5 minutes
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300');
    
    return NextResponse.json({
      works: paginatedWorks,
      pagination: {
        total: totalResults,
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit)
      }
    }, { headers });
    
  } catch (error) {
    console.error('Error searching artworks:', error);
    return NextResponse.json(
      { error: 'Failed to search artworks' },
      { status: 500 }
    );
  }
} 