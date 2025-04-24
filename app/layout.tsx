import type { Metadata } from "next";
import { Inter, Open_Sans, Roboto_Mono } from "next/font/google";
import "./globals.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./slick-overrides.css";
import "./styles/slick-custom.css";
import "./catalogue-styles.css";
import "./homepage-fixes.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CloudinaryProvider } from '../context/CloudinaryContext';
import { AnalyticsProvider } from './analytics';

// Define fonts
const inter = Inter({ subsets: ["latin"], display: 'swap', variable: '--font-inter' });
const openSans = Open_Sans({ subsets: ["latin"], display: 'swap', variable: '--font-open-sans' });
const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
});

export const metadata: Metadata = {
  title: "Better Badges: A Catalogue Raisonné",
  description: "Browse the Better Badges collection, featuring iconic punk and post-punk era badges, pins and memorabilia.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${openSans.variable} ${roboto_mono.variable}`}>
      <head>
        {/* Removed inline CSS for carousel dot positioning */}
      </head>
      <body>
        <AnalyticsProvider>
          <CloudinaryProvider>
            <div id="mainWrapperOuter">
              <div id="mainWrapperInner">
                <Header />
                <div id="maincontent">
                  {children}
                </div>
                <Footer />
              </div>
            </div>
          </CloudinaryProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
