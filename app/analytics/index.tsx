'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Define the analytics context type
interface AnalyticsContextType {
  trackPageView: (url: string) => void;
  trackEvent: (category: string, action: string, label?: string, value?: number) => void;
}

// Create the context with default values
const AnalyticsContext = createContext<AnalyticsContextType>({
  trackPageView: () => {},
  trackEvent: () => {},
});

// Provider component
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  // Implementation for tracking page views
  const trackPageView = (url: string) => {
    // This would integrate with your analytics service
    console.log(`Page view tracked: ${url}`);
  };

  // Implementation for tracking events
  const trackEvent = (
    category: string,
    action: string,
    label?: string,
    value?: number
  ) => {
    // This would integrate with your analytics service
    console.log(`Event tracked: ${category} / ${action} / ${label} / ${value}`);
  };

  const value = {
    trackPageView,
    trackEvent,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Custom hook for using the analytics context
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return context;
} 