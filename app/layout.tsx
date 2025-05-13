import type { Metadata, Viewport } from "next";
import { Inter, Open_Sans, Roboto_Mono } from "next/font/google";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./styles/index.css";
import "./catalogue-styles.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { R2Provider } from '../context/R2Context';
import { AnalyticsProvider } from './analytics';
import Auth0Wrapper from './auth/auth0-wrapper';

// Define fonts
const inter = Inter({ subsets: ["latin"], display: 'swap', variable: '--font-inter' });
const openSans = Open_Sans({ subsets: ["latin"], display: 'swap', variable: '--font-open-sans' });
const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Better Badges: A Catalogue Raisonné",
  description: "Browse the Better Badges collection, featuring iconic punk and post-punk era badges, pins and memorabilia.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#f5f5f5',
    'theme-color': '#f5f5f5'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${openSans.variable} ${roboto_mono.variable}`}>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="mask-icon" href="/favicon.svg" color="#cc3534" />
        
        {/* Removed inline CSS for carousel dot positioning */}
        <link 
          rel="preload" 
          href="/fonts/OpenSans-Regular.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        
        {/* DNS prefetching */}
        <link rel="dns-prefetch" href="//r2-image-worker.aasim-ss.workers.dev" />
        <link rel="preconnect" href="https://r2-image-worker.aasim-ss.workers.dev" crossOrigin="anonymous" />
        
        {/* Cache control */}
        <meta httpEquiv="Cache-Control" content="public, max-age=3600, stale-while-revalidate=86400" />
      </head>
      <body>
        <AnalyticsProvider>
          <R2Provider>
            <Auth0Wrapper>
              <div id="mainWrapperOuter">
                <div id="mainWrapperInner">
                  <Header />
                  <div id="maincontent">
                    {children}
                  </div>
                  <Footer />
                </div>
              </div>
            </Auth0Wrapper>
          </R2Provider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
