import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

// Public site configuration (branding + raffle parameters) served dynamically by
// the backend from Firestore settings, so changes in the admin UI flow through
// without a redeploy. Sensible defaults are used until the fetch resolves.
const DEFAULT_CONFIG = {
  clubName: 'Football Club',
  currency: 'USD',
  ticketPrice: 5,
  totalTickets: 1000,
  requiredSold: 800,
  winnersCount: 10,
  maxTicketsPerUser: 100,
  features: { stripeEnabled: false },
};

const ConfigContext = createContext(DEFAULT_CONFIG);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get('/api/v1/config')
      .then((res) => {
        if (active && res?.data) {
          const next = { ...DEFAULT_CONFIG, ...res.data };
          setConfig(next);
          if (next.clubName) document.title = `${next.clubName} Raffle`;
        }
      })
      .catch(() => {
        // Keep defaults if the API is unreachable.
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ConfigContext.Provider value={{ ...config, loaded }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
