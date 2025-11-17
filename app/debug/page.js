'use client';

import { useEffect, useState } from 'react';
import { getEnv, getAuth0Config } from '../utils/env';

export default function DebugPage() {
  const [envVars, setEnvVars] = useState({
    loading: true,
    auth0Domain: '',
    auth0ClientId: '',
    nodeEnv: '',
    windowEnvData: null,
    processEnvData: null,
    origin: ''
  });

  useEffect(() => {
    // Get environment variables
    const auth0Config = getAuth0Config();
    
    setEnvVars({
      loading: false,
      auth0Domain: getEnv('NEXT_PUBLIC_AUTH0_DOMAIN'),
      auth0ClientId: getEnv('NEXT_PUBLIC_AUTH0_CLIENT_ID'),
      nodeEnv: getEnv('NODE_ENV'),
      windowEnvData: typeof window !== 'undefined' && window.__ENV__ ? JSON.stringify(window.__ENV__) : 'Not available',
      processEnvData: process.env.NEXT_PUBLIC_AUTH0_DOMAIN ? 'NEXT_PUBLIC_AUTH0_DOMAIN is available in process.env' : 'NEXT_PUBLIC_AUTH0_DOMAIN is NOT available in process.env',
      origin: typeof window !== 'undefined' ? window.location.origin : 'SSR',
      auth0Config: JSON.stringify(auth0Config)
    });
  }, []);

  if (envVars.loading) {
    return <div>Loading environment data...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Debug Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
        <h2>Auth0 Configuration</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{envVars.auth0Config}</pre>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
        <h2>Environment Variables</h2>
        <p><strong>AUTH0_DOMAIN:</strong> {envVars.auth0Domain}</p>
        <p><strong>AUTH0_CLIENT_ID:</strong> {envVars.auth0ClientId}</p>
        <p><strong>NODE_ENV:</strong> {envVars.nodeEnv}</p>
        <p><strong>ORIGIN:</strong> {envVars.origin}</p>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
        <h2>Process Environment Check</h2>
        <p>{envVars.processEnvData}</p>
      </div>
      
      <div style={{ padding: '10px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
        <h2>Window.__ENV__ Check</h2>
        <p>{envVars.windowEnvData}</p>
      </div>
    </div>
  );
} 