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
    const seriesAll = searchParams.get('seriesAll') === 'true' || (!seriesA && !seriesB);
    
    // Get additional filters
    const filterAAA = searchParams.get('filterAAA') === 'true';
    const filterBBB = searchParams.get('filterBBB') === 'true';
    const filterBBC = searchParams.get('filterBBC') === 'true';
    const filterD = searchParams.get('filterD') === 'true';
    const filterRGG = searchParams.get('filterRGG') === 'true';
    const filterPreBetterBadges = searchParams.get('filterPreBetterBadges') === 'true';
    const filterPopArtKoop = searchParams.get('filterPopArtKoop') === 'true';
    const filterCatalogs = searchParams.get('filterCatalogs') === 'true';
    const filterZines = searchParams.get('filterZines') === 'true';
    const filterFlyers = searchParams.get('filterFlyers') === 'true';
    
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
      return {
        id: i + 1,
        title,
        date: '',
        medium: 'Oil and Magna on canvas',
        dimensions: '68 x 56 in (172.7 x 142.2 cm)',
        location: 'Private Collection',
        catalogueNumber: catalogNumber,
        artist,
        size,
        imageUrl: image.secure_url
      };
    });
    
    // Apply series filtering
    let filteredWorks = artworks.filter(work => {
      // Check specific filename filters first
      if (filterAAA && work.imageUrl.includes('/AAA')) return true;
      if (filterBBB && work.imageUrl.includes('/BBB')) return true;
      if (filterBBC && work.imageUrl.includes('/BBC')) return true;
      if (filterD && work.imageUrl.includes('/D')) return true;
      if (filterRGG && work.imageUrl.includes('/RGG')) return true;
      
      // Check additional category filters
      if (filterPreBetterBadges && work.imageUrl.includes('/PreBetterBadges')) return true;
      if (filterPopArtKoop && work.imageUrl.includes('/PopArtKoop')) return true;
      if (filterCatalogs && work.imageUrl.includes('/Catalogs')) return true;
      if (filterZines && work.imageUrl.includes('/Zines')) return true;
      if (filterFlyers && work.imageUrl.includes('/Flyers')) return true;
      
      // If any of the specific filters are active but didn't match, filter out
      if (filterAAA || filterBBB || filterBBC || filterD || filterRGG || 
          filterPreBetterBadges || filterPopArtKoop || filterCatalogs || 
          filterZines || filterFlyers) return false;
      
      // Apply standard series filtering
      if (seriesAll) return true;
      if (seriesA && work.catalogueNumber.startsWith('A')) return true;
      if (seriesB && work.catalogueNumber.startsWith('B')) return true;
      return false;
    });
    
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