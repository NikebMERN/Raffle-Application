import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

// Branding/config pulled live from the backend (Firestore settings) so the admin
// shell reflects the same club name configured for the public site.
const DEFAULT_CONFIG = {
  clubName: 'Football Club',
  currency: 'USD',
  features: { stripeEnabled: false },
};

const ConfigContext = createContext(DEFAULT_CONFIG);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    let active = true;
    api
      .get('/api/v1/config')
      .then((res) => {
        if (active && res?.data) {
          const next = { ...DEFAULT_CONFIG, ...res.data };
          setConfig(next);
          if (next.clubName) document.title = `${next.clubName} Raffle — Admin`;
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export const useConfig = () => useContext(ConfigContext);
