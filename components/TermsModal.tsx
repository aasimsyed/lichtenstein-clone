'use client';

import React, { useState, useEffect } from 'react';

export default function TermsModal() {
  const [isOpen, setIsOpen] = useState(true);
  
  const acceptTerms = () => {
    localStorage.setItem('termsAccepted', 'true');
    setIsOpen(false);
  };
  
  const scrollToBottom = () => {
    const modalContent = document.getElementById('terms-content');
    if (modalContent) {
      modalContent.scrollTop = modalContent.scrollHeight;
    }
  };
  
  useEffect(() => {
    const termsAccepted = localStorage.getItem('termsAccepted');
    if (termsAccepted === 'true') {
      setIsOpen(false);
    }
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div className="terms-modal-overlay">
      <div className="terms-modal">
        <div className="terms-modal-header">
          <h2>Terms and Conditions</h2>
        </div>
        <div className="terms-modal-content" id="terms-content">
          <p>Welcome to Roy Lichtenstein: A Catalogue Raisonné.</p>
          
          <p>By accessing this website, you agree to be bound by these Terms and Conditions of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
          
          <p>The materials contained in this website are protected by applicable copyright and trademark law.</p>
          
          <h3>Use License</h3>
          
          <p>Permission is granted to temporarily access the materials on Roy Lichtenstein Foundation&apos;s website for personal, non-commercial viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          
          <ul>
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>attempt to decompile or reverse engineer any software contained on Roy Lichtenstein Foundation&apos;s website;</li>
            <li>remove any copyright or other proprietary notations from the materials;</li>
            <li>transfer the materials to another person or &quot;mirror&quot; the materials on any other server.</li>
          </ul>
          
          <p>This license shall automatically terminate if you violate any of these restrictions and may be terminated by Roy Lichtenstein Foundation at any time.</p>
          
          <h3>Disclaimer</h3>
          
          <p>The materials on Roy Lichtenstein Foundation&apos;s website are provided &quot;as is&quot;. Roy Lichtenstein Foundation makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          
          <p>Further, Roy Lichtenstein Foundation does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.</p>
        </div>
        <div className="terms-modal-footer">
          <button onClick={scrollToBottom} className="scroll-button">
            Scroll to Bottom
          </button>
          <button onClick={acceptTerms} className="accept-button">
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
} 