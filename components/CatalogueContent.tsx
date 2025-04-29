'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SmoothImage from '../app/components/SmoothImage';
import { useR2Images } from '../context/R2Context';
import { R2Image as R2ContextImage } from '../app/utils/r2-client';
import { parseFilename } from '../app/utils/filename-utils';

// Extend the R2 image type from context with parsed metadata for easier handling
interface ProcessedArtwork extends R2ContextImage {
  artworkId: string;
  title: string;
  catalogueNumber: string;
  artist: string;
  size: string;
  imageUrl: string;
}

// Define the component
export default function CatalogueContent() {
  const searchParams = useSearchParams();
  const { images: r2Images, loading: contextLoading, error: contextError, refreshImages } = useR2Images();
  
  // View and sort states
  const [viewType, setViewType] = useState('gridA');
  const [sortBy, setSortBy] = useState('catno_ASC');
  const [resultsPerPage, setResultsPerPage] = useState(50);
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  
  // State for processed and displayed artworks
  const [processedArtworks, setProcessedArtworks] = useState<ProcessedArtwork[]>([]);
  const [displayedArtworks, setDisplayedArtworks] = useState<ProcessedArtwork[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Series filter states
  const [seriesA, setSeriesA] = useState(false);
  const [seriesB, setSeriesB] = useState(false);
  
  // New filename prefix filter states
  const [filterBBB, setFilterBBB] = useState(false);
  const [filterBBC, setFilterBBC] = useState(false);
  const [filterD, setFilterD] = useState(false);
  const [filterRGG, setFilterRGG] = useState(false);
  
  // Additional category filter states
  const [filterPreBetterBadges, setFilterPreBetterBadges] = useState(false);
  const [filterPopArtKoop, setFilterPopArtKoop] = useState(false);
  const [filterCatalogs, setFilterCatalogs] = useState(false);
  const [filterZines, setFilterZines] = useState(false);

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

  // --- Client-Side Filtering, Sorting, and Pagination Logic ---
  useEffect(() => {
    if (contextLoading || !r2Images || r2Images.length === 0) {
        // If context is loading or no images, clear results
        setProcessedArtworks([]);
        setDisplayedArtworks([]);
        setTotalResults(0);
        setTotalPages(0);
        return;
    }

    // 1. Process R2 images to include parsed metadata
    const processed = r2Images.map(img => {
        // Use img.id primarily, fallback to an empty string if needed
        const filenameSource = img.id || '';
        const metadata = parseFilename(filenameSource);
        return {
            ...img,
            artworkId: img.id,
            imageUrl: img.url, // Ensure this is mapped
            title: metadata.title || 'Untitled',
            catalogueNumber: metadata.catalogNumber || 'N/A',
            artist: metadata.artist || 'Unknown',
            size: metadata.size || 'Unknown'
        };
    });

    // 2. Filter based on active filters
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    setIsSearching(!!lowerSearchTerm);

    const filtered = processed.filter(work => {
      // Keyword Search (across multiple fields)
      if (lowerSearchTerm && !(
          work.title.toLowerCase().includes(lowerSearchTerm) ||
          work.catalogueNumber.toLowerCase().includes(lowerSearchTerm) ||
          work.artist.toLowerCase().includes(lowerSearchTerm) ||
          work.id.toLowerCase().includes(lowerSearchTerm) // Search original ID too
      )) {
        return false;
      }

      // --- Apply Checkbox Filters ---
      const anyFilterActive = seriesA || seriesB || filterBBB || filterBBC || filterD || filterRGG ||
                              filterPreBetterBadges || filterPopArtKoop || filterCatalogs || filterZines;

      if (anyFilterActive) {
        let passesFilter = false;
        // Use simple startsWith checks based on catalogueNumber
        if (seriesA && work.catalogueNumber.startsWith('A')) passesFilter = true;
        // Refined check for B series (starts with B, but not BBB or BBC)
        if (seriesB && work.catalogueNumber.startsWith('B') && !work.catalogueNumber.startsWith('BBB') && !work.catalogueNumber.startsWith('BBC')) passesFilter = true;
        if (filterBBB && work.catalogueNumber.startsWith('BBB')) passesFilter = true;
        if (filterBBC && work.catalogueNumber.startsWith('BBC')) passesFilter = true;
        if (filterD && work.catalogueNumber.startsWith('D')) passesFilter = true;
        if (filterRGG && work.catalogueNumber.startsWith('RGG')) passesFilter = true;
        // Add specific checks if prefixes differ or exact match is needed
        if (filterPreBetterBadges && work.catalogueNumber.startsWith('PRE')) passesFilter = true; // Example prefix
        if (filterPopArtKoop && work.catalogueNumber.startsWith('PAK')) passesFilter = true; // Example prefix
        if (filterCatalogs && work.catalogueNumber === 'AD') passesFilter = true;
        if (filterZines && work.catalogueNumber.startsWith('FZ')) passesFilter = true;

        if (!passesFilter) return false;
      }

      // If it passed all filters, include it
      return true;
    });

    // 3. Sort based on sortBy state
    const sorted = [...filtered].sort((a, b) => {
      const [field, direction] = sortBy.split('_');
      const valA = field === 'catno' ? a.catalogueNumber : a.title;
      const valB = field === 'catno' ? b.catalogueNumber : b.title;

      const numA = parseInt(valA.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(valB.match(/\d+/)?.[0] || '0', 10);
      const prefixA = valA.replace(/\d+.*/, '') || valA;
      const prefixB = valB.replace(/\d+.*/, '') || valB;

      let comparison = 0;
      if (field === 'catno') {
         if (prefixA < prefixB) comparison = -1;
         else if (prefixA > prefixB) comparison = 1;
         else if (numA < numB) comparison = -1;
         else if (numA > numB) comparison = 1;
      } else {
          if (valA.toLowerCase() < valB.toLowerCase()) comparison = -1;
          else if (valA.toLowerCase() > valB.toLowerCase()) comparison = 1;
      }
      return direction === 'ASC' ? comparison : -comparison;
    });

    // 4. Apply Pagination
    const totalFilteredResults = sorted.length;
    const calculatedTotalPages = Math.ceil(totalFilteredResults / resultsPerPage);
    // Ensure currentPage is valid after filtering - use let now
    let adjustedCurrentPage = Math.min(currentPage, Math.max(0, calculatedTotalPages - 1));
    // If adjustedCurrentPage becomes NaN (e.g., totalPages is 0), default to 0
    if(isNaN(adjustedCurrentPage)) adjustedCurrentPage = 0;

    const startIndex = adjustedCurrentPage * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedResults = sorted.slice(startIndex, endIndex);

    // 5. Update state
    setProcessedArtworks(processed); // Keep full processed list if needed
    setDisplayedArtworks(paginatedResults);
    setTotalResults(totalFilteredResults);
    setTotalPages(calculatedTotalPages);
    if(currentPage !== adjustedCurrentPage) {
        setCurrentPage(adjustedCurrentPage); // Adjust current page if it became invalid
    }

  }, [
    r2Images, contextLoading, searchTerm,
    seriesA, seriesB, filterBBB, filterBBC, filterD, filterRGG,
    filterPreBetterBadges, filterPopArtKoop, filterCatalogs, filterZines,
    sortBy, resultsPerPage, currentPage
  ]);

  // Effect for scrolling - Keep this
  useEffect(() => {
    if (r2Images.length > 0 && !contextLoading) {
      window.scrollTo(0, 0); // Scroll back to top when page changes
    }
  }, [currentPage, r2Images, contextLoading]);

  // Process search query from URL on load - Keep this
  useEffect(() => {
    const query = searchParams.get('search');
    if (query && query !== searchTerm) {
      setSearchTerm(query);
      // No need to fetch, the main useEffect will handle the filtering
    }
     // Only run on initial mount based on searchParams
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle search submission - Update to only set state
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page on new search
    // Filtering is handled by the main useEffect
  };

  // Clear search and reset to show all results - Update to only set state
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    setCurrentPage(0);
     // Filtering is handled by the main useEffect
  };

  // Filter change handlers - Update to only set state
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
      setter(prev => !prev);
      setCurrentPage(0); // Reset page when filters change
  };

  // Series filter handlers
  const handleSeriesAChange = () => handleFilterChange(setSeriesA);
  const handleSeriesBChange = () => handleFilterChange(setSeriesB);
  const handleBBBChange = () => handleFilterChange(setFilterBBB);
  const handleBBCChange = () => handleFilterChange(setFilterBBC);
  const handleDChange = () => handleFilterChange(setFilterD);
  const handleRGGChange = () => handleFilterChange(setFilterRGG);
  const handlePreBetterBadgesChange = () => handleFilterChange(setFilterPreBetterBadges);
  const handlePopArtKoopChange = () => handleFilterChange(setFilterPopArtKoop);
  const handleCatalogsChange = () => handleFilterChange(setFilterCatalogs);
  const handleZinesChange = () => handleFilterChange(setFilterZines);

  // Calculate dynamic pagination values based on state
  const dynamicTotalResults = totalResults;
  const dynamicStartResult = dynamicTotalResults === 0 ? 0 : currentPage * resultsPerPage + 1;
  const dynamicEndResult = Math.min((currentPage + 1) * resultsPerPage, dynamicTotalResults);

  // Generate page numbers for pagination - Keep this
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

  // Mobile controls toggle handlers - Keep these
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

      {contextLoading ? (
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
      ) : contextError ? (
        <div className="error-message" style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          Error loading image data: {contextError}
          <button
            onClick={() => refreshImages()}
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Retry
          </button>
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
                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(0); }}
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
                      Flyers & Zines
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
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(0); }}
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
              RESULTS {dynamicStartResult} TO {dynamicEndResult} OF {totalResults}
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
          </div>

          <div id="indexContainer" className={viewType}>
            {displayedArtworks.length === 0 && !contextLoading ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#666' }}>
                No artworks match the current filters.
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
                      {displayedArtworks.map(work => (
                        <tr 
                          key={work.artworkId} 
                          onClick={() => window.location.href = `/catalogue/entry/${work.artworkId}`}
                          style={{ cursor: 'pointer' }}
                          className="clickable-row"
                        >
                          <td>{work.catalogueNumber === 'AD' ? 'Catalog' : 
                              work.catalogueNumber.startsWith('FZ') ? 'Flyer/Zine' : 
                              work.catalogueNumber}</td>
                          <td>{work.catalogueNumber === 'AD' ? '' : 
                              work.catalogueNumber.startsWith('FZ') ? '' : 
                              work.artist}</td>
                          <td>
                            {work.catalogueNumber === 'AD' ? (
                              <>Catalog</>
                            ) : work.catalogueNumber.startsWith('FZ') ? (
                              <>
                                {work.title.replace(/_/g, ' ')} #{work.catalogueNumber.split('_')[2]}
                              </>
                            ) : (
                              work.title
                            )}
                            {work.catalogueNumber.startsWith('FZ') && (
                              <div style={{ fontSize: '0.85em', color: '#666' }}>Flyer/Zine</div>
                            )}
                          </td>
                          <td>{work.catalogueNumber === 'AD' ? '' : 
                              work.catalogueNumber.startsWith('FZ') ? '' : 
                              work.size}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div id="catWorks" className="catWorksCont customCatWorks">
                    {displayedArtworks.map(work => (
                      <div className="item" key={work.artworkId}>
                        <div id={`work-${work.artworkId}`}></div>
                        <a href={`/catalogue/entry/${work.artworkId}`} className="image">
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
                            <a href={`/catalogue/entry/${work.artworkId}`}>
                              <div className="item_title">
                                <em>
                                  {work.catalogueNumber === 'AD' ? (
                                    <>Catalog</>
                                  ) : work.catalogueNumber.startsWith('FZ') ? (
                                    <>
                                      {work.title.replace(/_/g, ' ')} #{work.catalogueNumber.split('_')[2]}
                                    </>
                                  ) : (
                                    work.title
                                  )}
                                </em>
                              </div>
                              {work.catalogueNumber === 'AD' ? (
                                <div className="item_catnum">Catalog</div>
                              ) : work.catalogueNumber.startsWith('FZ') ? (
                                <div className="item_catnum">Flyer/Zine</div>
                              ) : (
                                <>
                                  <div className="item_date">{work.artist}</div>
                                  <div className="item_catnum">{work.catalogueNumber}, {work.size}</div>
                                </>
                              )}
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
                            onClick={() => setCurrentPage(0)}
                            className={`pagination-button ${isFirstPage ? 'disabled' : ''}`}
                            disabled={isFirstPage}
                            aria-label="First page"
                          >
                            <span aria-hidden="true">«</span>
                          </button>
                          
                          <button 
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
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
                              onClick={() => setCurrentPage(pageNum)}
                              className={`pagination-number ${pageNum === currentPage ? 'active' : ''}`}
                              aria-label={`Page ${pageNum + 1}`}
                              aria-current={pageNum === currentPage ? 'page' : undefined}
                            >
                              {pageNum + 1}
                            </button>
                          ))}
                          
                          {totalPages > 10 && currentPage < totalPages - Math.floor(10 / 2) -1 && (
                            <span className="pagination-ellipsis">…</span>
                          )}
                        </div>
                        
                        {/* Next/Last buttons */}
                        <div className="pagination-nav">
                          <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            className={`pagination-button ${isLastPage ? 'disabled' : ''}`}
                            disabled={isLastPage}
                            aria-label="Next page"
                          >
                            <span aria-hidden="true">›</span>
                          </button>
                          
                          <button 
                            onClick={() => setCurrentPage(totalPages - 1)}
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
                  
                  .clickable-row:hover {
                    background-color: #f5f5f5;
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