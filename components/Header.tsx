'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleGlobalSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchValue.trim()) {
      // Navigate to catalogue page with search param
      router.push(`/catalogue?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false); // Close search box after submitting
      setSearchValue(''); // Clear the input
    }
  };

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      // Focus the search input when the search box is opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }

    // Add escape key event handler
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('keyup', handleEscKey);
    
    // Prevent scrolling when mobile menu is open
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('keyup', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [searchOpen, mobileMenuOpen]);

  return (
    <>
      <div id="globalSeaBox" className={searchOpen ? 'visible' : ''}>
        <a href="#" id="globalSearachClose" onClick={(e) => { e.preventDefault(); toggleSearch(); }}>X</a>
        <form id="globalsearchForm" autoComplete="off" onSubmit={handleGlobalSearch}>
          <input 
            id="search" 
            name="search" 
            type="text" 
            placeholder="Search the entire site..." 
            ref={searchInputRef}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <input name="globalSearchButton" type="submit" id="globalSearchButton" value="search" />
        </form>
      </div>
      
      <header>
        <div id="headerTopBand">
          <div id="login_bookmarks" style={{ opacity: searchOpen ? 0 : 1, visibility: searchOpen ? 'hidden' : 'visible' }}>
            <a href="#" id="globalSearachTrigger" onClick={(e) => { e.preventDefault(); toggleSearch(); }}>Search</a>
          </div>
        </div>
        
        <div id="headerMain">
          <div className="logo">
            <Link href="/">
              <img src="/img/logo.svg" alt="Better Badges: A Catalogue Raisonné" width="280" height="40" />
            </Link>
          </div>
          
          <nav className="NAVIGATION">
            <ul>
              <li>
                <Link href="/catalogue">Browse the Works</Link>
              </li>
            </ul>
          </nav>
        </div>
        
        <div id="headerMoble">
          <div className="mobile-logo">
            <Link href="/">
              <img src="/img/logo.svg" alt="Better Badges: A Catalogue Raisonné" width="160" height="24" />
            </Link>
          </div>
          <div className="mobile-toggle" onClick={toggleMobileMenu}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        <div id="headerMobleDrawer" className={mobileMenuOpen ? 'open' : ''}>
          <div className="behind" onClick={toggleMobileMenu}></div>
          <div className="middle">
            <ul>
              <li>
                <Link href="/catalogue">Browse the Works</Link>
              </li>
            </ul>
          </div>
        </div>
      </header>
    </>
  );
} 