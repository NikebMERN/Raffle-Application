import { Outlet } from 'react-router-dom';

// Navigation now lives in the left sidebar (see components/common/Layout.jsx);
// this wrapper just provides the content padding for admin pages.
export default function AdminLayout() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
      <Outlet />
    </div>
  );
}
