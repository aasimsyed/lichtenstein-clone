import HomeCarousel from '../components/HomeCarousel';
import SelectionsCarousel from '../components/SelectionsCarousel';
import HomeSeriesGridClient from "@/components/HomeSeriesGridClient";
import { getEnv } from './utils/env';

// Add a debug component to check environment variables
const EnvDebug = () => {
  if (getEnv('NODE_ENV') !== 'production') {
    return null;
  }
  
  return (
    <div style={{ margin: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
      <h3>Environment Debug</h3>
      <p>AUTH0_DOMAIN: {getEnv('NEXT_PUBLIC_AUTH0_DOMAIN') ? 'Set' : 'Not Set'}</p>
      <p>AUTH0_CLIENT_ID: {getEnv('NEXT_PUBLIC_AUTH0_CLIENT_ID') ? 'Set' : 'Not Set'}</p>
      <p>NODE_ENV: {getEnv('NODE_ENV')}</p>
      <p>ORIGIN: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
    </div>
  );
};

export default function Home() {
  return (
    <div id="homepage">
      <div id="mainBody" className="homepage">
        <EnvDebug />
        <HomeCarousel />
        <SelectionsCarousel />
        <HomeSeriesGridClient />
      </div>
    </div>
  );
}
