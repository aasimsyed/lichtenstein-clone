'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SmoothImage from '../app/components/SmoothImage';
import { parseFilename } from '../app/utils/filename-utils';
import { useCloudinaryImages } from '../context/CloudinaryContext';

// Define the Artwork interface
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

// Define the component
export default function CatalogueContent() {
  const searchParams = useSearchParams();
  // Get Cloudinary images from context instead of local state
  const { images: cloudinaryImages, loading, error, refreshImages } = useCloudinaryImages();
  
  // View and sort states
  const [viewType, setViewType] = useState('gridA');
  const [sortBy, setSortBy] = useState('catno_ASC');
  const [resultsPerPage, setResultsPerPage] = useState(50);
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  
  // State for search results
  const [filteredWorks, setFilteredWorks] = useState<Artwork[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Use router for navigation
  const router = useRouter();

  // Series filter states
  const [seriesA, setSeriesA] = useState(false);
  const [seriesB, setSeriesB] = useState(false);
  const [seriesAll, setSeriesAll] = useState(true); // Default to All selected
  
  // New filename prefix filter states
  const [filterAAA, setFilterAAA] = useState(false);
  const [filterBBB, setFilterBBB] = useState(false);
  const [filterBBC, setFilterBBC] = useState(false);
  const [filterD, setFilterD] = useState(false);
  const [filterRGG, setFilterRGG] = useState(false);
  
  // Additional category filter states
  const [filterPreBetterBadges, setFilterPreBetterBadges] = useState(false);
  const [filterPopArtKoop, setFilterPopArtKoop] = useState(false);
  const [filterCatalogs, setFilterCatalogs] = useState(false);
  const [filterZines, setFilterZines] = useState(false);
  const [filterFlyers, setFilterFlyers] = useState(false);

  // Fix touch interaction to prevent unwanted window movement
  useEffect(() => {
    // Get references to the elements we want to control
    const catalogWorks = document.getElementById('catWorks');
    
    // Handler for touch start position
    let startX = 0;
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    
    // More precise touch move handler that only prevents horizontal swipes
    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      
      const deltaX = Math.abs(e.touches[0].clientX - startX);
      const deltaY = Math.abs(e.touches[0].clientY - startY);
      
      // If horizontal movement is dominant and significant, prevent default
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
      }
    };
    
    // Apply event listeners only to the catalogue works container
    if (catalogWorks) {
      catalogWorks.addEventListener('touchstart', handleTouchStart, { passive: true });
      catalogWorks.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    
    return () => {
      // Clean up
      if (catalogWorks) {
        catalogWorks.removeEventListener('touchstart', handleTouchStart);
        catalogWorks.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [viewType]); // Only re-apply when the view type changes

  // Create mock artwork data with dynamic Cloudinary images
  const mockWorks: Artwork[] = useMemo(() => {
    if (cloudinaryImages.length === 0) {
      // Return empty array instead of placeholder data
      return [];
    }
    
    // Use the real Cloudinary images without repetition
    const sortedWorks = cloudinaryImages.map((image, i) => {
      const { catalogNumber, title, artist, size } = parseFilename(image.url);
      return {
        id: i + 1,
        title: title,
        date: '',  // No year information
        medium: 'Oil and Magna on canvas',
        dimensions: '68 x 56 in (172.7 x 142.2 cm)',
        location: 'Private Collection',
        catalogueNumber: catalogNumber,
        artist: artist,
        size: size,
        imageUrl: image.url
      };
    });
    
    // Get the appropriate sort comparator based on the sortBy value
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
    
    // Sort works based on the selected sort option
    return sortedWorks.sort(getSortComparator(sortBy));
  }, [cloudinaryImages, sortBy]);

  // Apply series filtering first
  const seriesFilteredWorks = mockWorks.filter(work => {
    // First check if any of the specific filename filters are active
    if (filterAAA && work.imageUrl.includes('/AAA')) return true;
    if (filterBBB && work.imageUrl.includes('/BBB')) return true;
    if (filterBBC && work.imageUrl.includes('/BBC')) return true;
    if (filterD && work.imageUrl.includes('/D')) return true;
    if (filterRGG && work.imageUrl.includes('/RGG')) return true;
    
    // Check for additional category filters
    if (filterPreBetterBadges && work.imageUrl.includes('/PreBetterBadges')) return true;
    if (filterPopArtKoop && work.imageUrl.includes('/PopArtKoop')) return true;
    if (filterCatalogs && work.imageUrl.includes('/Catalogs')) return true;
    if (filterZines && work.imageUrl.includes('/Zines')) return true;
    if (filterFlyers && work.imageUrl.includes('/Flyers')) return true;
    
    // If any of the specific filters are active but didn't match, filter out
    if (filterAAA || filterBBB || filterBBC || filterD || filterRGG || 
        filterPreBetterBadges || filterPopArtKoop || filterCatalogs || filterZines || filterFlyers) return false;
    
    // Otherwise apply the standard series filtering
    if (seriesAll) return true;
    if (seriesA && work.catalogueNumber.startsWith('A')) return true;
    if (seriesB && work.catalogueNumber.startsWith('B')) return true;
    return false;
  });

  // Process search query from URL on load
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      // Only update searchTerm if it's different from current value
      if (searchTerm !== query) {
        setSearchTerm(query);
      }
      
      // Only trigger search if we have images and aren't already searching with the same term
      if (cloudinaryImages.length > 0 && (!isSearching || searchTerm !== query)) {
        const searchTermLower = query.toLowerCase();
        const results = seriesFilteredWorks.filter(work => 
          work.title.toLowerCase().includes(searchTermLower) ||
          work.medium.toLowerCase().includes(searchTermLower) ||
          work.catalogueNumber.toLowerCase().includes(searchTermLower) ||
          work.artist.toLowerCase().includes(searchTermLower) ||
          work.size.toLowerCase().includes(searchTermLower)
        );
        setFilteredWorks(results);
        setIsSearching(true);
        setCurrentPage(0);
      }
    }
  }, [searchParams, cloudinaryImages, seriesFilteredWorks, searchTerm, isSearching]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page on new search
    
    // Filter works based on search term
    if (searchTerm.trim() === '') {
      setFilteredWorks([]);
      setIsSearching(false);
      // Remove search parameter from URL when search is cleared
      router.push('/catalogue');
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      // Apply search on top of series filtering
      const results = seriesFilteredWorks.filter(work => 
        work.title.toLowerCase().includes(searchTermLower) ||
        work.medium.toLowerCase().includes(searchTermLower) ||
        work.catalogueNumber.toLowerCase().includes(searchTermLower) ||
        work.artist.toLowerCase().includes(searchTermLower) ||
        work.size.toLowerCase().includes(searchTermLower)
      );
      setFilteredWorks(results);
      setIsSearching(true);
      // Update URL with search parameter
      router.push(`/catalogue?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Series filter handlers
  const handleSeriesAChange = () => {
    const newValue = !seriesA;
    // Clear all filename filters when selecting a series
    setFilterAAA(false);
    setFilterBBB(false);
    setFilterBBC(false);
    setFilterD(false);
    setFilterRGG(false);
    setFilterPreBetterBadges(false);
    setFilterPopArtKoop(false);
    setFilterCatalogs(false);
    setFilterZines(false);
    setFilterFlyers(false);
    
    if (newValue && seriesB) {
      // If both A and B are now selected, select All instead
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(true);
    } else {
      // Otherwise toggle A and ensure All is unselected
      setSeriesA(newValue);
      setSeriesAll(false);
    }
    setCurrentPage(0); // Reset to first page when changing filters
  };

  const handleSeriesBChange = () => {
    const newValue = !seriesB;
    // Clear all filename filters when selecting a series
    setFilterAAA(false);
    setFilterBBB(false);
    setFilterBBC(false);
    setFilterD(false);
    setFilterRGG(false);
    setFilterPreBetterBadges(false);
    setFilterPopArtKoop(false);
    setFilterCatalogs(false);
    setFilterZines(false);
    setFilterFlyers(false);
    
    if (newValue && seriesA) {
      // If both A and B are now selected, select All instead
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(true);
    } else {
      // Otherwise toggle B and ensure All is unselected
      setSeriesB(newValue);
      setSeriesAll(false);
    }
    setCurrentPage(0); // Reset to first page when changing filters
  };

  const handleSeriesAllChange = () => {
    const newValue = !seriesAll;
    // Clear all filename filters when selecting All
    setFilterAAA(false);
    setFilterBBB(false);
    setFilterBBC(false);
    setFilterD(false);
    setFilterRGG(false);
    setFilterPreBetterBadges(false);
    setFilterPopArtKoop(false);
    setFilterCatalogs(false);
    setFilterZines(false);
    setFilterFlyers(false);
    
    // If All is selected, unselect A and B
    if (newValue) {
      setSeriesA(false);
      setSeriesB(false);
    }
    setSeriesAll(newValue);
    setCurrentPage(0); // Reset to first page when changing filters
  };

  // Handle the new filename filters
  const handleAAAChange = () => {
    setFilterAAA(!filterAAA);
    if (!filterAAA) {
      setFilterBBB(false);
      setFilterBBC(false);
      setFilterD(false);
      setFilterRGG(false);
      setFilterPreBetterBadges(false);
      setFilterPopArtKoop(false);
      setFilterCatalogs(false);
      setFilterZines(false);
      setFilterFlyers(false);
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(false);
    }
    setCurrentPage(0);
  };

  const handleBBBChange = () => {
    setFilterBBB(!filterBBB);
    if (!filterBBB) {
      setFilterAAA(false);
      setFilterBBC(false);
      setFilterD(false);
      setFilterRGG(false);
      setFilterPreBetterBadges(false);
      setFilterPopArtKoop(false);
      setFilterCatalogs(false);
      setFilterZines(false);
      setFilterFlyers(false);
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(false);
    }
    setCurrentPage(0);
  };

  const handleBBCChange = () => {
    setFilterBBC(!filterBBC);
    if (!filterBBC) {
      setFilterAAA(false);
      setFilterBBB(false);
      setFilterD(false);
      setFilterRGG(false);
      setFilterPreBetterBadges(false);
      setFilterPopArtKoop(false);
      setFilterCatalogs(false);
      setFilterZines(false);
      setFilterFlyers(false);
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(false);
    }
    setCurrentPage(0);
  };

  const handleDChange = () => {
    setFilterD(!filterD);
    if (!filterD) {
      setFilterAAA(false);
      setFilterBBB(false);
      setFilterBBC(false);
      setFilterRGG(false);
      setFilterPreBetterBadges(false);
      setFilterPopArtKoop(false);
      setFilterCatalogs(false);
      setFilterZines(false);
      setFilterFlyers(false);
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(false);
    }
    setCurrentPage(0);
  };

  const handleRGGChange = () => {
    setFilterRGG(!filterRGG);
    if (!filterRGG) {
      setFilterAAA(false);
      setFilterBBB(false);
      setFilterBBC(false);
      setFilterD(false);
      setFilterPreBetterBadges(false);
      setFilterPopArtKoop(false);
      setFilterCatalogs(false);
      setFilterZines(false);
      setFilterFlyers(false);
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(false);
    }
    setCurrentPage(0);
  };

  // Add handlers for new filter options
  const handlePreBetterBadgesChange = () => {
    setFilterPreBetterBadges(!filterPreBetterBadges);
    if (!filterPreBetterBadges) {
      // Clear all other filters
      setFilterAAA(false);
      setFilterBBB(false);
      setFilterBBC(false);
      setFilterD(false);
      setFilterRGG(false);
      setFilterPopArtKoop(false);
      setFilterCatalogs(false);
      setFilterZines(false);
      setFilterFlyers(false);
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(false);
    }
    setCurrentPage(0);
  };

  const handlePopArtKoopChange = () => {
    setFilterPopArtKoop(!filterPopArtKoop);
    if (!filterPopArtKoop) {
      // Clear all other filters
      setFilterAAA(false);
      setFilterBBB(false);
      setFilterBBC(false);
      setFilterD(false);
      setFilterRGG(false);
      setFilterPreBetterBadges(false);
      setFilterCatalogs(false);
      setFilterZines(false);
      setFilterFlyers(false);
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(false);
    }
    setCurrentPage(0);
  };

  const handleCatalogsChange = () => {
    setFilterCatalogs(!filterCatalogs);
    if (!filterCatalogs) {
      // Clear all other filters
      setFilterAAA(false);
      setFilterBBB(false);
      setFilterBBC(false);
      setFilterD(false);
      setFilterRGG(false);
      setFilterPreBetterBadges(false);
      setFilterPopArtKoop(false);
      setFilterZines(false);
      setFilterFlyers(false);
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(false);
    }
    setCurrentPage(0);
  };

  const handleZinesChange = () => {
    setFilterZines(!filterZines);
    if (!filterZines) {
      // Clear all other filters
      setFilterAAA(false);
      setFilterBBB(false);
      setFilterBBC(false);
      setFilterD(false);
      setFilterRGG(false);
      setFilterPreBetterBadges(false);
      setFilterPopArtKoop(false);
      setFilterCatalogs(false);
      setFilterFlyers(false);
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(false);
    }
    setCurrentPage(0);
  };

  const handleFlyersChange = () => {
    setFilterFlyers(!filterFlyers);
    if (!filterFlyers) {
      // Clear all other filters
      setFilterAAA(false);
      setFilterBBB(false);
      setFilterBBC(false);
      setFilterD(false);
      setFilterRGG(false);
      setFilterPreBetterBadges(false);
      setFilterPopArtKoop(false);
      setFilterCatalogs(false);
      setFilterZines(false);
      setSeriesA(false);
      setSeriesB(false);
      setSeriesAll(false);
    }
    setCurrentPage(0);
  };

  // Calculate dynamic pagination values based on actual number of items
  const displayedWorks = isSearching ? filteredWorks : seriesFilteredWorks;
  const dynamicTotalResults = displayedWorks.length;
  const dynamicStartResult = dynamicTotalResults === 0 ? 0 : currentPage * resultsPerPage + 1;
  const dynamicEndResult = Math.min((currentPage + 1) * resultsPerPage, dynamicTotalResults);

  // Generate page numbers for pagination
  const generatePageNumbers = useCallback(() => {
    const totalPages = Math.ceil(dynamicTotalResults / resultsPerPage);
    const maxVisiblePages = 10;
    
    if (totalPages <= maxVisiblePages) {
      return [...Array(totalPages).keys()]; // [0, 1, 2, ..., totalPages-1]
    }
    
    // Complex case - many pages
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage >= totalPages) {
      endPage = totalPages - 1;
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    return [...Array(endPage - startPage + 1).keys()].map(i => i + startPage);
  }, [currentPage, dynamicTotalResults, resultsPerPage]);

  // Clear search and reset to show all results
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    setFilteredWorks([]);
    setCurrentPage(0);
    
    // Update URL to remove search parameter
    router.push('/catalogue');
  };

  // Mobile controls toggle handlers
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);

  const toggleMobileFilters = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowMobileFilters(!showMobileFilters);
    setShowMobileOptions(false);
  };

  const toggleMobileOptions = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowMobileOptions(!showMobileOptions);
    setShowMobileFilters(false);
  };

  return (
    <div id="mainBody">
      <div id="pageTopMatter">
        <h1>Browse the Works</h1>
      </div>

      {loading ? (
        // Center loading indicator while waiting for images
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '50px 0',
          fontSize: '16px'
        }}>
          <div>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              Loading catalogue...
            </div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3', 
              borderTop: '4px solid #333', 
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </div>
      ) : (
        <>
          <div id="browseSectionTools">
            {/* Mobile controls - hidden on desktop */}
            <div id="browseMobileControls">
              <a href="#" onClick={toggleMobileFilters}>Filters</a> 
              <a href="#" onClick={toggleMobileOptions}>Sort/View Options</a>
            </div>

            {/* Conditional display of filters when the Filters button is clicked */}
            {showMobileFilters && (
              <div id="mobileFiltersPanel" className="mobilePanel">
                <div id="searchBoxesWrapper">
                  <div id="searcWrapper">
                    <form action="" method="post" id="minisearchForm" autoComplete="off" onSubmit={handleSearch}>
                      <input
                        type="text"
                        name="searchbox" 
                        id="searchbox" 
                        placeholder="Search by keyword" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingRight: "40px" }}
                      />
                      <input 
                        name="seachBoxButton" 
                        type="submit" 
                        id="seachBoxButton" 
                        value="search" 
                        style={{ right: "5px" }}
                      />
                    </form>
                  </div>
                </div>
                
                {/* Series Filter */}
                <div className="filter-section">
                  <h3 style={{ fontSize: '16px', margin: '15px 0 10px 0' }}>Series</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={seriesAll}
                        onChange={handleSeriesAllChange}
                        style={{ marginRight: '8px' }}
                      />
                      All
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={seriesA}
                        onChange={handleSeriesAChange}
                        style={{ marginRight: '8px' }}
                      />
                      A
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={seriesB}
                        onChange={handleSeriesBChange}
                        style={{ marginRight: '8px' }}
                      />
                      B
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={filterAAA}
                        onChange={handleAAAChange}
                        style={{ marginRight: '8px' }}
                      />
                      AAA
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={filterBBB}
                        onChange={handleBBBChange}
                        style={{ marginRight: '8px' }}
                      />
                      BBB
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={filterBBC}
                        onChange={handleBBCChange}
                        style={{ marginRight: '8px' }}
                      />
                      BBC
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={filterD}
                        onChange={handleDChange}
                        style={{ marginRight: '8px' }}
                      />
                      D
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={filterRGG}
                        onChange={handleRGGChange}
                        style={{ marginRight: '8px' }}
                      />
                      RGG
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={filterPreBetterBadges}
                        onChange={handlePreBetterBadgesChange}
                        style={{ marginRight: '8px' }}
                      />
                      Pre Better Badges
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={filterPopArtKoop}
                        onChange={handlePopArtKoopChange}
                        style={{ marginRight: '8px' }}
                      />
                      Pop Art Koop
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={filterCatalogs}
                        onChange={handleCatalogsChange}
                        style={{ marginRight: '8px' }}
                      />
                      Catalogs
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={filterZines}
                        onChange={handleZinesChange}
                        style={{ marginRight: '8px' }}
                      />
                      Zines
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={filterFlyers}
                        onChange={handleFlyersChange}
                        style={{ marginRight: '8px' }}
                      />
                      Flyers
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional display of options when the Sort/View Options button is clicked */}
            {showMobileOptions && (
              <div id="mobileOptionsPanel" className="mobilePanel">
                <div className="option-group">
                  <label htmlFor="sortSelect">Sort by:</label>
                  <select 
                    id="sortSelect"
                    aria-label="Sort results by"
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ 
                      width: "100%",
                      height: "40px",
                      padding: "8px 25px 8px 8px",
                      fontSize: "14px",
                      lineHeight: "24px"
                    }}
                  >
                    <option value="catno_ASC">Catalogue number (ascending)</option>
                    <option value="catno_DESC">Catalogue number (descending)</option>
                    <option value="cattitle_ASC">Title (A to Z)</option>
                    <option value="cattitle_DESC">Title (Z to A)</option>
                  </select>
                </div>

                <div className="option-group">
                  <label htmlFor="viewSelect">View as:</label>
                  <select 
                    id="viewSelect"
                    aria-label="Change view type"
                    value={viewType}
                    onChange={(e) => setViewType(e.target.value)}
                    style={{ 
                      width: "100%",
                      height: "40px",
                      padding: "8px 25px 8px 8px",
                      fontSize: "14px",
                      lineHeight: "24px"
                    }}
                  >
                    <option value="gridA">Grid</option>
                    <option value="list">List</option>
                  </select>
                </div>

                <div className="option-group">
                  <label htmlFor="numDisplaySelect">Results per page:</label>
                  <select 
                    id="numDisplaySelect"
                    aria-label="Number of results per page"
                    value={resultsPerPage} 
                    onChange={(e) => {
                      setResultsPerPage(Number(e.target.value));
                      setCurrentPage(0); // Reset to first page when changing results per page
                    }}
                    style={{ 
                      width: "100%",
                      height: "40px",
                      padding: "8px 25px 8px 8px",
                      fontSize: "14px",
                      lineHeight: "24px"
                    }}
                  >
                    <option value="50">50 per page</option>
                    <option value="75">75 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                </div>
              </div>
            )}

            {/* Desktop search boxes - hide in mobile view */}
            <div id="searchFilterWrapper" className="desktopOnly">
              <div id="searchBoxesWrapper">
                <div id="searcWrapper">
                  <form action="" method="post" id="minisearchForm" autoComplete="off" onSubmit={handleSearch}>
                    <input
                      type="text"
                      name="searchbox" 
                      id="searchbox" 
                      placeholder="Search by keyword" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingRight: "40px" }}
                    />
                    <input 
                      name="seachBoxButton" 
                      type="submit" 
                      id="seachBoxButton" 
                      value="search" 
                      style={{ right: "5px" }}
                    />
                  </form>
                </div>
                
                {/* Desktop Series Filter */}
                <div className="filter-section" style={{ marginTop: '20px', marginBottom: '10px', width: '100%' }}>
                  <h3 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Series</h3>
                  <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: '10px', width: '100%' }}>
                    {/* First row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, auto)', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={seriesAll}
                          onChange={handleSeriesAllChange}
                          style={{ marginRight: '8px' }}
                        />
                        All
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={seriesA}
                          onChange={handleSeriesAChange}
                          style={{ marginRight: '8px' }}
                        />
                        A
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={seriesB}
                          onChange={handleSeriesBChange}
                          style={{ marginRight: '8px' }}
                        />
                        B
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={filterAAA}
                          onChange={handleAAAChange}
                          style={{ marginRight: '8px' }}
                        />
                        AAA
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={filterBBB}
                          onChange={handleBBBChange}
                          style={{ marginRight: '8px' }}
                        />
                        BBB
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={filterBBC}
                          onChange={handleBBCChange}
                          style={{ marginRight: '8px' }}
                        />
                        BBC
                      </label>
                    </div>
                    
                    {/* Second row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto auto auto auto', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={filterD}
                          onChange={handleDChange}
                          style={{ marginRight: '8px' }}
                        />
                        D
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={filterRGG}
                          onChange={handleRGGChange}
                          style={{ marginRight: '8px' }}
                        />
                        RGG
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={filterPreBetterBadges}
                          onChange={handlePreBetterBadgesChange}
                          style={{ marginRight: '8px' }}
                        />
                        Pre Better Badges
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={filterPopArtKoop}
                          onChange={handlePopArtKoopChange}
                          style={{ marginRight: '8px' }}
                        />
                        Pop Art Koop
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={filterCatalogs}
                          onChange={handleCatalogsChange}
                          style={{ marginRight: '8px' }}
                        />
                        Catalogs
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={filterZines}
                          onChange={handleZinesChange}
                          style={{ marginRight: '8px' }}
                        />
                        Zines
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={filterFlyers}
                          onChange={handleFlyersChange}
                          style={{ marginRight: '8px' }}
                        />
                        Flyers
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Options row */}
            <div className="options-row desktopOnly">
              <div className="option-group">
                <label htmlFor="sortSelect">Sort by:</label>
                <select 
                  id="sortSelect"
                  aria-label="Sort results by"
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    minWidth: "280px", 
                    height: "auto", 
                    padding: "4px 8px",
                    lineHeight: "1.5"
                  }}
                >
                  <option value="catno_ASC">Catalogue number (ascending)</option>
                  <option value="catno_DESC">Catalogue number (descending)</option>
                  <option value="cattitle_ASC">Title (A to Z)</option>
                  <option value="cattitle_DESC">Title (Z to A)</option>
                </select>
              </div>

              <div className="option-group">
                <label htmlFor="viewSelect">View as:</label>
                <select 
                  id="viewSelect"
                  aria-label="Change view type"
                  value={viewType}
                  onChange={(e) => setViewType(e.target.value)}
                  style={{ 
                    minWidth: "150px", 
                    height: "auto", 
                    padding: "4px 8px",
                    lineHeight: "1.5",
                    verticalAlign: "middle"
                  }}
                >
                  <option value="gridA">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>

              <div className="option-group">
                <label htmlFor="numDisplaySelect">Results per page:</label>
                <select 
                  id="numDisplaySelect"
                  aria-label="Number of results per page"
                  value={resultsPerPage} 
                  onChange={(e) => {
                    setResultsPerPage(Number(e.target.value));
                    setCurrentPage(0); // Reset to first page when changing results per page
                  }}
                  style={{ 
                    minWidth: "150px", 
                    height: "auto", 
                    padding: "4px 8px",
                    lineHeight: "1.5",
                    verticalAlign: "middle"
                  }}
                >
                  <option value="50">50 per page</option>
                  <option value="75">75 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
            </div>
          </div>

          <div id="restulsFiltersWrapper">
            <div id="restulsCont">
              RESULTS {dynamicStartResult} TO {dynamicEndResult} OF {dynamicTotalResults}
              {isSearching && (
                <>
                  <span> (Filtered by: &ldquo;{searchTerm}&rdquo;)</span>
                  <button 
                    onClick={clearSearch} 
                    style={{ 
                      marginLeft: '10px', 
                      background: 'none', 
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      padding: '2px 5px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Search
                  </button>
                </>
              )}
              <button 
                onClick={() => {
                  refreshImages();
                }} 
                style={{ 
                  marginLeft: '15px', 
                  background: '#f0f0f0', 
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ↻ Refresh Images
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>

          <div id="indexContainer" className={viewType}>
            {viewType === 'list' ? (
              <table className="list-view-table">
                <thead>
                  <tr>
                    <th>Catalogue No.</th>
                    <th>Artist</th>
                    <th>Title</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedWorks
                    .slice(currentPage * resultsPerPage, (currentPage + 1) * resultsPerPage)
                    .map(work => (
                    <tr key={work.id}>
                      <td>{work.catalogueNumber}</td>
                      <td>{work.artist}</td>
                      <td><a href={`/catalogue/entry/${work.id}`}>{work.title}</a></td>
                      <td>{work.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div id="catWorks" className="catWorksCont customCatWorks">
                {displayedWorks
                  .slice(currentPage * resultsPerPage, (currentPage + 1) * resultsPerPage)
                  .map(work => (
                  <div className="item" key={work.id}>
                    <div id={`work-${work.id}`}></div>
                    <a href={`/catalogue/entry/${work.id}`} className="image">
                      <SmoothImage
                        src={work.imageUrl}
                        alt={work.title}
                        width={170}
                        height={170}
                        style={{
                          objectFit: 'cover',
                          width: '100%',
                          height: 'auto',
                          aspectRatio: '1',
                          display: 'block'
                        }}
                      />
                    </a>
                    {viewType === 'gridA' && (
                      <div className="item_catDetails">
                        <a href={`/catalogue/entry/${work.id}`}>
                          <div className="item_title"><em>{work.title}</em></div>
                          <div className="item_date">{work.artist}</div>
                          <div className="item_catnum">{work.catalogueNumber}, {work.size}</div>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {Math.ceil(dynamicTotalResults / resultsPerPage) > 1 && (
              <div id="paginationBottom">
                <div id="pagiWrapper">
                  <div id="pagiContentTop">
                    {/* Calculate pagination flags */}
                    {(() => {
                      const isFirstPage = currentPage === 0;
                      const isLastPage = currentPage >= Math.ceil(dynamicTotalResults / resultsPerPage) - 1;
                      
                      return (
                        <>
                          {/* Only show First/Previous when not on first page */}
                          {!isFirstPage && (
                            <>
                              <span className="nextprevspan pageFirst">
                                <a 
                                  href="#" 
                                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { 
                                    e.preventDefault(); 
                                    setCurrentPage(0); 
                                  }} 
                                  className="nextprev" 
                                  id="first" 
                                  title="first"
                                >
                                  <span className="arrow-first">◀◀</span>first
                                </a>
                              </span>
                              <span className="nextprevspan pagePrev">
                                <a 
                                  href="#" 
                                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { 
                                    e.preventDefault(); 
                                    setCurrentPage(currentPage - 1); 
                                  }} 
                                  className="nextprev" 
                                  id="prev" 
                                  title="previous"
                                >
                                  <span className="arrow-left">◀</span>previous
                                </a>
                              </span>
                            </>
                          )}

                          {/* Always show page numbers */}
                          &nbsp;
                          <span className="pagenos">
                            {generatePageNumbers().map((pageNum) => (
                              pageNum === currentPage ? (
                                <span className="pageLinkCurrent" key={pageNum}>{pageNum + 1}</span>
                              ) : (
                                <a 
                                  href="#" 
                                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { 
                                    e.preventDefault(); 
                                    setCurrentPage(pageNum); 
                                  }} 
                                  className="pageLink" 
                                  key={pageNum}
                                >
                                  {pageNum + 1}
                                </a>
                              )
                            ))}
                          </span>
                          {dynamicTotalResults > resultsPerPage * 10 && <span className="pagenosDots">&nbsp;...</span>}

                          {/* Only show Next/Last when not on last page */}
                          {!isLastPage && (
                            <>
                              <span className="nextprevspan pageNext">
                                <a 
                                  href="#" 
                                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { 
                                    e.preventDefault(); 
                                    setCurrentPage(currentPage + 1); 
                                  }} 
                                  className="nextprev" 
                                  id="next" 
                                  title="next"
                                >
                                  next<span className="arrow-right">▶</span>
                                </a>
                              </span>
                              <span className="nextprevspan pageLast">
                                <a 
                                  href="#" 
                                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { 
                                    e.preventDefault(); 
                                    setCurrentPage(Math.ceil(dynamicTotalResults / resultsPerPage) - 1); 
                                  }} 
                                  className="nextprev" 
                                  id="last" 
                                  title="last"
                                >
                                  last<span className="arrow-last">▶▶</span>
                                </a>
                              </span>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 