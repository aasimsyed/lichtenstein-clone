import { Suspense } from 'react';
import ArtworkClientWrapper from '../../../components/ArtworkClientWrapper';

export default function ArtworkPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '15px', fontSize: '16px' }}>
          Loading artwork details...
        </div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3', 
          borderTop: '4px solid #333', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    }>
      <ArtworkClientWrapper />
    </Suspense>
  );
} 