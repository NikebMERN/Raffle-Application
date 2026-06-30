import { useFirebaseMessaging } from '../../hooks/useFirebaseMessaging';
import ForegroundNotificationBanner from './ForegroundNotificationBanner';

export default function NotificationProvider({ children }) {
  useFirebaseMessaging();

  return (
    <>
      {children}
      <ForegroundNotificationBanner />
    </>
  );
}
