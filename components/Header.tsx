'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import '../app/styles/header.css';

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

  const handleGlobalSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // Make API call without waiting for the result
      fetch('/api/catalogue', {
        method: 'GET',
      }).catch(error => {
        console.error('Error calling catalogue API:', error);
      });
      
      // Navigate to catalogue page without query parameters
      router.push('/catalogue');
      setSearchOpen(false); // Close search box after submitting
      setSearchValue(''); // Clear the input
    } catch (error) {
      console.error('Error in global search:', error);
      // Still navigate even if there's an error
      router.push('/catalogue');
      setSearchOpen(false);
      setSearchValue('');
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
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keyup', handleEscKey);
    
    // Prevent scrolling when mobile menu is open
    if (mobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    
    return () => {
      document.removeEventListener('keyup', handleEscKey);
      document.body.classList.remove('menu-open');
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
        <div id="headerMain">
          <div className="logo">
            <Link href="/">
              <Image src="/img/logo.svg" alt="Better Badges: Image as Virus" width={550} height={40} priority />
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
              <Image src="/img/logo.svg" alt="Better Badges: Image as Virus" width={320} height={20} />
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
              <li style={{ '--item-index': 0 } as React.CSSProperties}>
                <Link href="/catalogue" onClick={() => setMobileMenuOpen(false)}>
                  Browse the Works
                </Link>
              </li>
              {/* Add more menu items as needed */}
            </ul>
          </div>
        </div>
      </header>
    </>
  );
} 