'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import SmoothImage from '../app/components/SmoothImage';
import { useR2Images } from '../context/R2Context';
import { R2Image as R2ContextImage } from '../app/utils/r2-client';
import { parseFilename } from '../app/utils/filename-utils';
import '../app/styles/components.css';

// Custom dropdown component for mobile view
interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, label, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the currently selected option
  const selectedOption = options.find(option => option.value === value) || options[0];

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };



  // Handle option selection
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Create button props to satisfy strict linters
  const buttonProps = {
    type: "button" as const,
    id,
    className: "custom-dropdown-button",
    onClick: toggleDropdown,
    "aria-haspopup": "listbox" as const,
    "aria-expanded": isOpen,
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <label htmlFor={id} className="custom-dropdown-label">{label}</label>
      <div className="custom-dropdown">
        <button {...buttonProps}>
          <span className="selected-value">{selectedOption.label}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        
        {isOpen && (
          <div 
            className="custom-dropdown-menu" 
            aria-labelledby={id}
            aria-label={`${label} options`}
          >
            {options.map(option => {
              const optionProps = {
                className: `dropdown-item ${option.value === value ? 'selected' : ''}`,
                onClick: () => handleSelect(option.value),
                role: "option" as const,
                "aria-selected": option.value === value,
              };
              return (
                <div key={option.value} {...optionProps}>
                  {option.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

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
  const { images: r2Images, loading: contextLoading, error: contextError, refreshImages, preloadNextImages } = useR2Images();
  
  // Add refresh button loading state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  
  // View and sort states
  const [viewType, setViewType] = useState('gridA');
  const [sortBy, setSortBy] = useState('catno_ASC');
  const [resultsPerPage, setResultsPerPage] = useState(50);
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  
  // State for displayed artworks
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
  const [filterBBA, setFilterBBA] = useState(false);
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
      const anyFilterActive = seriesA || seriesB || filterBBB || filterBBC || filterBBA || filterD || filterRGG ||
                              filterPreBetterBadges || filterPopArtKoop || filterCatalogs || filterZines;

      if (anyFilterActive) {
        let passesFilter = false;
        // Use simple startsWith checks based on catalogueNumber
        if (seriesA && work.catalogueNumber.startsWith('A')) passesFilter = true;
        // Refined check for B series (starts with B, but not BBB, BBC, or BBA)
        if (seriesB && work.catalogueNumber.startsWith('B') && !work.catalogueNumber.startsWith('BBB') && !work.catalogueNumber.startsWith('BBC') && !work.catalogueNumber.startsWith('BBA')) passesFilter = true;
        if (filterBBB && work.catalogueNumber.startsWith('BBB')) passesFilter = true;
        if (filterBBC && work.catalogueNumber.startsWith('BBC')) passesFilter = true;
        if (filterBBA && work.catalogueNumber.startsWith('BBA')) passesFilter = true;
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
    setDisplayedArtworks(paginatedResults);
    setTotalResults(totalFilteredResults);
    setTotalPages(calculatedTotalPages);
    if(currentPage !== adjustedCurrentPage) {
        setCurrentPage(adjustedCurrentPage); // Adjust current page if it became invalid
    }

  }, [
    r2Images, contextLoading, searchTerm,
    seriesA, seriesB, filterBBB, filterBBC, filterBBA, filterD, filterRGG,
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
    const query = searchParams?.get('search');
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
  const handleBBAChange = () => handleFilterChange(setFilterBBA);
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

  const renderGridAView = () => {
    if (contextLoading && !displayedArtworks.length) {
      return <div className="loading-indicator">Loading catalogue...</div>;
    }

    if (contextError) {
      return <div className="error-message">Error loading catalogue: {contextError}</div>;
    }

    if (displayedArtworks.length === 0) {
      return <div className="no-results">No artwork found matching your criteria.</div>;
    }

    return (
      <div id="catWorks" className="catWorksCont">
        {displayedArtworks.map((artwork, index) => (
          <article
            key={`${artwork.artworkId}-${index}`}
            className="item"
          >
            <a href={`/catalogue/artwork?id=${encodeURIComponent(artwork.artworkId)}`} title={artwork.title}>
              <div className="image">
                <SmoothImage
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  width={500}
                  height={600}
                  quality={85}
                  cacheKey={artwork.artworkId}
                  preload={index < 9} // Preload first 9 images immediately
                  fadeIn={true}
                  preventRerender={true}
                  unoptimized={true}
                  lazyBoundary="500px"
                  onLoad={() => {
                    // Preload next batch when current image loads
                    if (index % 3 === 0) {
                      const startIdx = Math.min(displayedArtworks.length - 1, index + 9);
                      const count = Math.min(5, displayedArtworks.length - startIdx);
                      if (count > 0) {
                        preloadNextImages(startIdx, count);
                      }
                    }
                  }}
                />
              </div>
              <div className="item_catDetails">
                <div className="item_title">{artwork.title}</div>
                <div className="item_catnum">{artwork.catalogueNumber}, {artwork.size}</div>
              </div>
            </a>
          </article>
        ))}
      </div>
    );
  };

  // Add a function to handle the refresh with visual feedback
  const handleRefreshImages = async () => {
    try {
      // Reset success state if it was showing
      setRefreshSuccess(false);
      setIsRefreshing(true);
      await refreshImages();
      // Show success message and hide after a delay
      setIsRefreshing(false);
      setRefreshSuccess(true);
      setTimeout(() => {
        setRefreshSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error refreshing images:', error);
      setIsRefreshing(false);
    }
  };

  // Render the appropriate view based on viewType
  return (
    <div id="mainBody">
      <div id="pageTopMatter">
        <h1>Browse the Works</h1>
      </div>

      {contextLoading ? (
        // Center loading indicator while waiting for images
        <div className="catalogue-loading-container">
          <div>
            <div className="catalogue-loading-text">
              Loading catalogue...
            </div>
            <div className="catalogue-loading-spinner"></div>
          </div>
        </div>
      ) : contextError ? (
        <div className="error-message">
          Error loading image data: {contextError}
          <button
            onClick={() => refreshImages()}
            className="clear-search-button"
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
                    <form action="" method="post" id="minisearchForm_mobile" autoComplete="off" onSubmit={handleSearch}>
                      <input
                        type="text"
                        name="searchbox" 
                        id="searchbox_mobile" 
                        placeholder="Search by keyword" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <input 
                        name="seachBoxButton" 
                        type="submit" 
                        id="seachBoxButton_mobile" 
                        value="search" 
                      />
                    </form>
                  </div>
                </div>
                
                {/* Series Filter */}
                <div className="filter-section">
                  <h3 className="mobile-filter-title">Series</h3>
                  <div className="mobile-filter-grid">
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={seriesA}
                        onChange={handleSeriesAChange}
                        className="filter-checkbox"
                      />
                      A
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={seriesB}
                        onChange={handleSeriesBChange}
                        className="filter-checkbox"
                      />
                      B
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterBBA}
                        onChange={handleBBAChange}
                        className="filter-checkbox"
                      />
                      BBA
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterBBB}
                        onChange={handleBBBChange}
                        className="filter-checkbox"
                      />
                      BBB
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterBBC}
                        onChange={handleBBCChange}
                        className="filter-checkbox"
                      />
                      BBC
                    </label>

                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterD}
                        onChange={handleDChange}
                        className="filter-checkbox"
                      />
                      D
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterRGG}
                        onChange={handleRGGChange}
                        className="filter-checkbox"
                      />
                      RGG
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterPreBetterBadges}
                        onChange={handlePreBetterBadgesChange}
                        className="filter-checkbox"
                      />
                      Pre Better Badges
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterPopArtKoop}
                        onChange={handlePopArtKoopChange}
                        className="filter-checkbox"
                      />
                      Pop Art Koop
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterCatalogs}
                        onChange={handleCatalogsChange}
                        className="filter-checkbox"
                      />
                      Catalogs
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterZines}
                        onChange={handleZinesChange}
                        className="filter-checkbox"
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
                  <CustomDropdown
                    id="sortSelect"
                    label="Sort by:"
                    options={[
                      { value: 'catno_ASC', label: 'Catalogue number (ascending)' },
                      { value: 'catno_DESC', label: 'Catalogue number (descending)' },
                      { value: 'cattitle_ASC', label: 'Title (A to Z)' },
                      { value: 'cattitle_DESC', label: 'Title (Z to A)' }
                    ]}
                    value={sortBy}
                    onChange={(value) => { setSortBy(value); setCurrentPage(0); }}
                  />
                </div>

                <div className="option-group">
                  <CustomDropdown
                    id="viewSelect"
                    label="View as:"
                    options={[
                      { value: 'gridA', label: 'Grid' },
                      { value: 'list', label: 'List' }
                    ]}
                    value={viewType}
                    onChange={(value) => setViewType(value)}
                  />
                </div>

                <div className="option-group">
                  <CustomDropdown
                    id="numDisplaySelect"
                    label="Results per page:"
                    options={[
                      { value: '50', label: '50 per page' },
                      { value: '75', label: '75 per page' },
                      { value: '100', label: '100 per page' }
                    ]}
                    value={resultsPerPage.toString()}
                    onChange={(value) => {
                      setResultsPerPage(Number(value));
                      setCurrentPage(0);
                    }}
                  />
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
                    />
                    <input 
                      name="seachBoxButton" 
                      type="submit" 
                      id="seachBoxButton" 
                      value="search" 
                    />
                  </form>
                </div>
                
                {/* Desktop Series Filter */}
                <div className="filter-section">
                  <h3>Series</h3>
                  <div className="filter-grid">
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={seriesA}
                        onChange={handleSeriesAChange}
                        className="filter-checkbox"
                      />
                      A
                    </label>

                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={seriesB}
                        onChange={handleSeriesBChange}
                        className="filter-checkbox"
                      />
                      B
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterBBA}
                        onChange={handleBBAChange}
                        className="filter-checkbox"
                      />
                      BBA
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterBBB}
                        onChange={handleBBBChange}
                        className="filter-checkbox"
                      />
                      BBB
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterBBC}
                        onChange={handleBBCChange}
                        className="filter-checkbox"
                      />
                      BBC
                    </label>

                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterD}
                        onChange={handleDChange}
                        className="filter-checkbox"
                      />
                      D
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterRGG}
                        onChange={handleRGGChange}
                        className="filter-checkbox"
                      />
                      RGG
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterPreBetterBadges}
                        onChange={handlePreBetterBadgesChange}
                        className="filter-checkbox"
                      />
                      Pre Better Badges
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterPopArtKoop}
                        onChange={handlePopArtKoopChange}
                        className="filter-checkbox"
                      />
                      Pop Art Koop
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterCatalogs}
                        onChange={handleCatalogsChange}
                        className="filter-checkbox"
                      />
                      Catalogs
                    </label>
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={filterZines}
                        onChange={handleZinesChange}
                        className="filter-checkbox"
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
                  className="sort-select"
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
                  className="view-select"
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
                  className="results-per-page-select"
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
                  <span className="search-term">(Filtered by: &ldquo;{searchTerm}&rdquo;)</span>
                  <button 
                    onClick={clearSearch} 
                    className="clear-search-button"
                  >
                    Clear Search
                  </button>
                </>
              )}
              <button 
                onClick={handleRefreshImages} 
                className={`refresh-button ${isRefreshing ? 'refreshing' : ''} ${refreshSuccess ? 'success' : ''}`}
                disabled={isRefreshing}
              >
                {refreshSuccess ? (
                  <React.Fragment>
                    <span className="success-checkmark">✓</span>
                    Updated!
                  </React.Fragment>
                ) : isRefreshing ? (
                  <React.Fragment>
                    <span className="refresh-spinner"></span>
                    Refreshing...
                  </React.Fragment>
                ) : (
                  '↻ Refresh Images'
                )}
              </button>
            </div>
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
                  {displayedArtworks.map(work => (
                    <tr 
                      key={work.artworkId} 
                      onClick={() => window.location.href = `/catalogue/artwork?id=${encodeURIComponent(work.artworkId)}`}
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
                          <div className="flyer-zine-note">Flyer/Zine</div>
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
              renderGridAView()
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
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 