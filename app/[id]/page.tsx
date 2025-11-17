import { catalogSeries } from "@/data/catalogSeries";
import { notFound } from "next/navigation";
import SeriesPageClient from "./SeriesPageClient";

// Define the page props to include params with the id
interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

// This generates static pages at build time for all series
export function generateStaticParams() {
  return catalogSeries.map((series) => ({
    id: series.id,
  }));
}

// Add metadata export for better SEO
export async function generateMetadata({ params }: SeriesPageProps) {
  const { id } = await params;
  const series = catalogSeries.find((s) => s.id === id);
  
  if (!series) {
    return {
      title: 'Series Not Found',
      description: 'The requested series could not be found.',
    };
  }
  
  return {
    title: `${series.title} | Better Badges`,
    description: series.description,
  };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  // Find the series data based on the URL parameter
  const { id } = await params;
  const series = catalogSeries.find((series) => series.id === id);

  // If series not found, return 404
  if (!series) {
    notFound();
  }

  return <SeriesPageClient series={series} />;
} 