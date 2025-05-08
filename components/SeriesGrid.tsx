import Image from "next/image"
import Link from "next/link"
import "../app/styles/components.css"

interface SeriesItem {
  id: string
  title: string
  description: string
  imageUrl?: string
  link: string
}

interface SeriesGridProps {
  items: SeriesItem[]
}

export default function SeriesGrid({ items }: SeriesGridProps) {
  // Simpler approach with basic flexbox
  return (
    <div 
      data-testid="series-grid-component" 
      id="series-grid-container"
    >
      <h2>Series</h2>
      <div id="series-grid-items">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            id={`series-item-${item.id}`}
            className="series-item"
          >
            <Link href={item.link}>
              <div className="series-image-container">
                <Image
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.title}
                  width={100}
                  height={100}
                  className="series-image"
                  priority={index < 3} // Only prioritize first 3 items
                  quality={60} // Lower quality for faster loading
                  loading={index < 6 ? "eager" : "lazy"} // Load first 6 eagerly, lazy load the rest
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                  unoptimized={true} // Use unoptimized for direct R2 URLs
                />
              </div>
              <div>
                <h3 className="series-title">{item.title}</h3>
                <p className="series-description">{item.description}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
