import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissForegroundNotification } from '../../store';

export default function ForegroundNotificationBanner() {
  const dispatch = useDispatch();
  const foreground = useSelector((state) => state.notifications.foreground);

  useEffect(() => {
    if (!foreground.length) return undefined;
    const timers = foreground.map((item) => (
      setTimeout(() => dispatch(dismissForegroundNotification(item.id)), 6000)
    ));
    return () => timers.forEach(clearTimeout);
  }, [foreground, dispatch]);

  if (!foreground.length) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {foreground.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto bg-white border border-slate-200 shadow-lg rounded-xl p-4 animate-slide-in"
          role="alert"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-600 mt-1">{item.body}</p>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              onClick={() => dispatch(dismissForegroundNotification(item.id))}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
