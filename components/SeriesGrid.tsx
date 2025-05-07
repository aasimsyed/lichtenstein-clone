import Image from "next/image"
import Link from "next/link"

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
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '24px' }}>
        Series
      </h2>
      <div 
        id="series-grid-items"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
        }}
      >
        {items.map((item, index) => (
          <div 
            key={item.id} 
            id={`series-item-${item.id}`}
            style={{
              width: '250px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Link 
              href={item.link} 
              style={{
                textDecoration: 'none',
                color: 'inherit',
                textAlign: 'center',
                width: '100%',
              }}
            >
              <div 
                style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 15px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  backgroundColor: '#f8f8f8',
                }}
              >
                <Image
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.title}
                  width={100}
                  height={100}
                  style={{
                    objectFit: 'contain',
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                  priority={index < 3} // Only prioritize first 3 items
                  quality={60} // Lower quality for faster loading
                  loading={index < 6 ? "eager" : "lazy"} // Load first 6 eagerly, lazy load the rest
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                  unoptimized={true} // Use unoptimized for direct R2 URLs
                />
              </div>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}>{item.title}</h3>
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                }}>{item.description}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
