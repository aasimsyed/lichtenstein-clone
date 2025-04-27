'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SmoothImage from '../app/components/SmoothImage';
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

// API response interface
interface SearchResponse {
  works: Artwork[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
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
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

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

  // Function to fetch search results from API
  const fetchSearchResults = useCallback(async (page = 0) => {
    try {
      setIsLoadingResults(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add search term if present
      if (searchTerm.trim()) {
        params.set('query', searchTerm.trim());
      }
      
      // Add filter parameters
      params.set('seriesA', seriesA.toString());
      params.set('seriesB', seriesB.toString());
      params.set('seriesAll', seriesAll.toString());
      params.set('filterAAA', filterAAA.toString());
      params.set('filterBBB', filterBBB.toString());
      params.set('filterBBC', filterBBC.toString());
      params.set('filterD', filterD.toString());
      params.set('filterRGG', filterRGG.toString());
      params.set('filterPreBetterBadges', filterPreBetterBadges.toString());
      params.set('filterPopArtKoop', filterPopArtKoop.toString());
      params.set('filterCatalogs', filterCatalogs.toString());
      params.set('filterZines', filterZines.toString());
      params.set('filterFlyers', filterFlyers.toString());
      
      // Add sorting and pagination
      params.set('sortBy', sortBy);
      params.set('page', page.toString());
      params.set('limit', resultsPerPage.toString());
      
      // Make the API request
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      
      const data: SearchResponse = await response.json();
      
      // Update state with results
      setFilteredWorks(data.works);
      setTotalResults(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setIsLoadingResults(false);
      
      // Set isSearching based on whether we have a search term
      setIsSearching(!!searchTerm.trim());
    } catch (error) {
      console.error('Error fetching search results:', error);
      setIsLoadingResults(false);
    }
  }, [searchTerm, seriesA, seriesB, seriesAll, filterAAA, filterBBB, filterBBC, filterD, filterRGG, 
       filterPreBetterBadges, filterPopArtKoop, filterCatalogs, filterZines, filterFlyers, 
       sortBy, resultsPerPage]);

  // Fetch initial data when component mounts
  useEffect(() => {
    // Only fetch if we have cloudinary images
    if (cloudinaryImages.length > 0 && !loading) {
      fetchSearchResults(currentPage);
    }
  }, [cloudinaryImages, loading, fetchSearchResults, currentPage]);

  // Fetch new results when filters change
  useEffect(() => {
    if (cloudinaryImages.length > 0 && !loading) {
      setCurrentPage(0); // Reset to first page when filters change
      fetchSearchResults(0);
    }
  }, [cloudinaryImages, loading, fetchSearchResults]);

  // Effect for handling pagination changes
  useEffect(() => {
    if (cloudinaryImages.length > 0 && !loading) {
      window.scrollTo(0, 0); // Scroll back to top when page changes
    }
  }, [currentPage, cloudinaryImages, loading]);

  // Process search query from URL on load (just to initialize the search term)
  useEffect(() => {
    const query = searchParams.get('search');
    if (query && query !== searchTerm) {
      setSearchTerm(query);
    }
  }, [searchParams, searchTerm]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page on new search
    fetchSearchResults(0);
  };

  // Clear search and reset to show all results
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    setCurrentPage(0);
    fetchSearchResults(0);
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
  };

  // Calculate dynamic pagination values based on API response
  const dynamicTotalResults = totalResults;
  const dynamicStartResult = dynamicTotalResults === 0 ? 0 : currentPage * resultsPerPage + 1;
  const dynamicEndResult = Math.min((currentPage + 1) * resultsPerPage, dynamicTotalResults);

  // Generate page numbers for pagination
  const generatePageNumbers = useCallback(() => {
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
  }, [currentPage, totalPages]);

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
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '10px', 
                    width: '100%'
                  }}>
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
            {isLoadingResults ? (
              // Show loading indicator
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '4px solid #f3f3f3', 
                  borderTop: '4px solid #333', 
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            ) : (
              <>
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
                      {filteredWorks.map(work => (
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
                    {filteredWorks.map(work => (
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
              </>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div id="paginationBottom">
                <div className="pagination-container">
                  {(() => {
                    const isFirstPage = currentPage === 0;
                    const isLastPage = currentPage >= totalPages - 1;
                    
                    return (
                      <>
                        {/* First/Previous buttons */}
                        <div className="pagination-nav">
                          <button 
                            onClick={() => { 
                              setCurrentPage(0);
                              fetchSearchResults(0);
                            }} 
                            className={`pagination-button ${isFirstPage ? 'disabled' : ''}`}
                            disabled={isFirstPage}
                            aria-label="First page"
                          >
                            <span aria-hidden="true">«</span>
                          </button>
                          
                          <button 
                            onClick={() => { 
                              const newPage = currentPage - 1;
                              setCurrentPage(newPage);
                              fetchSearchResults(newPage);
                            }} 
                            className={`pagination-button ${isFirstPage ? 'disabled' : ''}`}
                            disabled={isFirstPage}
                            aria-label="Previous page"
                          >
                            <span aria-hidden="true">‹</span>
                          </button>
                        </div>
                        
                        {/* Page numbers */}
                        <div className="pagination-pages">
                          {generatePageNumbers().map((pageNum) => (
                            <button 
                              key={pageNum}
                              onClick={() => { 
                                setCurrentPage(pageNum);
                                fetchSearchResults(pageNum);
                              }} 
                              className={`pagination-number ${pageNum === currentPage ? 'active' : ''}`}
                              aria-label={`Page ${pageNum + 1}`}
                              aria-current={pageNum === currentPage ? 'page' : undefined}
                            >
                              {pageNum + 1}
                            </button>
                          ))}
                          
                          {totalPages > 10 && (
                            <span className="pagination-ellipsis">…</span>
                          )}
                        </div>
                        
                        {/* Next/Last buttons */}
                        <div className="pagination-nav">
                          <button 
                            onClick={() => { 
                              const newPage = currentPage + 1;
                              if (newPage < totalPages) {
                                setCurrentPage(newPage);
                                fetchSearchResults(newPage);
                              }
                            }} 
                            className={`pagination-button ${isLastPage ? 'disabled' : ''}`}
                            disabled={isLastPage}
                            aria-label="Next page"
                          >
                            <span aria-hidden="true">›</span>
                          </button>
                          
                          <button 
                            onClick={() => { 
                              const lastPage = totalPages - 1;
                              setCurrentPage(lastPage);
                              fetchSearchResults(lastPage);
                            }} 
                            className={`pagination-button ${isLastPage ? 'disabled' : ''}`}
                            disabled={isLastPage}
                            aria-label="Last page"
                          >
                            <span aria-hidden="true">»</span>
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* Add pagination summary */}
                <div className="pagination-summary">
                  Page {currentPage + 1} of {totalPages}
                </div>

                {/* Add inline styles for pagination */}
                <style jsx global>{`
                  .pagination-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 2rem 0;
                    gap: 8px;
                  }
                  
                  .pagination-nav {
                    display: flex;
                    gap: 4px;
                  }
                  
                  .pagination-pages {
                    display: flex;
                    gap: 4px;
                    align-items: center;
                  }
                  
                  .pagination-button, .pagination-number {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 36px;
                    height: 36px;
                    padding: 0 8px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 4px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: #333;
                  }
                  
                  .pagination-button:hover, .pagination-number:hover {
                    background-color: #f5f5f5;
                    border-color: #ccc;
                  }
                  
                  .pagination-number.active {
                    background-color: #ededed;
                    color: #333;
                    border-color: #333;
                    font-weight: 500;
                  }
                  
                  .pagination-button.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    pointer-events: none;
                  }
                  
                  .pagination-ellipsis {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 36px;
                    height: 36px;
                    color: #666;
                  }
                  
                  .pagination-summary {
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 1rem;
                  }
                  
                  @media (max-width: 768px) {
                    .pagination-container {
                      flex-wrap: wrap;
                    }
                    
                    .pagination-button, .pagination-number {
                      min-width: 32px;
                      height: 32px;
                      font-size: 13px;
                    }
                  }
                `}</style>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 