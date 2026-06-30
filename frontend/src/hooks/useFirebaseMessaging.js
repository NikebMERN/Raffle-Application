import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging, isMessagingConfigured } from '../config/firebase';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { pushForegroundNotification } from '../store';

export function useFirebaseMessaging() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const tokenRef = useRef(null);
  const unsubscribeRef = useRef(() => {});

  useEffect(() => {
    if (!user || !isMessagingConfigured()) return undefined;

    let cancelled = false;

    async function setup() {
      try {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

        const messaging = await getFirebaseMessaging();
        if (!messaging || cancelled) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted' || cancelled) return;

        await fetch('/firebase-messaging-sw.js');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token && !cancelled) {
          tokenRef.current = token;
          await api.post('/api/v1/users/fcm-token', { token });
        }

        unsubscribeRef.current = onMessage(messaging, (payload) => {
          const title = payload.notification?.title || payload.data?.title || 'SF Raffle';
          const body = payload.notification?.body || payload.data?.body || '';
          dispatch(pushForegroundNotification({
            id: `${Date.now()}`,
            title,
            body,
            category: payload.data?.category || 'system',
            link: payload.data?.link || '/',
          }));
        });
      } catch (err) {
        console.warn('Firebase messaging setup failed:', err?.message || err);
      }
    }

    setup();

    return () => {
      cancelled = true;
      unsubscribeRef.current();
      if (tokenRef.current) {
        api.delete('/api/v1/users/fcm-token', { data: { token: tokenRef.current } }).catch(() => {});
        tokenRef.current = null;
      }
    };
  }, [user, dispatch]);
}
