// Import necessary routing and location hooks from React Router
import { Link, useLocation } from 'react-router-dom';
// Import icons from Heroicons library for navigation items
import {
  HomeIcon,
  UserGroupIcon,
  UserIcon,
  ClipboardIcon,
  ChartBarIcon,
  CogIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  PlusCircleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

// Define main navigation items with their routes and icons
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Doctors', href: '/doctors', icon: UserIcon },
<<<<<<< Updated upstream
  { name: 'Doctor Requests', href: '/newdoctors', icon: PlusCircleIcon },
=======
  { name: 'Add Doctors', href: '/newdoctors', icon: PlusCircleIcon },
  { name: 'Entertainment', href: '/entertainment', icon: PlayIcon },
>>>>>>> Stashed changes
  { name: 'Reports', href: '/reports', icon: ClipboardIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

// Define admin-specific navigation items
const adminManagement = [
  { name: 'Add New Admin', href: '/admin/add', icon: UserPlusIcon },
  { name: 'Manage Admins', href: '/admin/manage', icon: ShieldCheckIcon },
  { name: 'User Roles', href: '/admin/roles', icon: UserCircleIcon },
];

/**
 * Sidebar Component
 * Provides navigation for the admin dashboard
 * Features:
 * - Responsive design (hidden on mobile, visible on desktop)
 * - Active route highlighting
 * - Two sections: Main navigation and Admin Management
 * - Icon-based navigation items
 */
const Sidebar = () => {
  // Get current route location to highlight active navigation item
  const location = useLocation();

  return (
    // Main sidebar container - hidden on mobile, shown on medium screens and up
    <div className="hidden md:flex md:w-64 md:flex-col">
      {/* Sidebar layout container with scrolling */}
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200 shadow-sm">
        {/* Logo container */}
        <div className="flex items-center flex-shrink-0 px-4 pb-4 border-b border-gray-200">
          <img
            className="w-auto h-8"
            src="/logo.svg"
            alt="SafeSpace Admin"
          />
        </div>
        {/* Navigation sections container */}
        <div className="mt-5 flex-1 flex flex-col">
          {/* Main navigation */}
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {/* Main navigation section */}
            <div className="mb-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Main
              </h3>
              {/* Map through and render main navigation items */}
              {navigation.map((item) => {
                const current = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                      ${
                        current
                          ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-5 w-5 transition-colors duration-200
                        ${
                          current
                            ? 'text-indigo-500'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }
                      `}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            
            {/* Admin management section */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Admin Management
              </h3>
              {/* Map through and render admin management items */}
              {adminManagement.map((item) => {
                const current = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                      ${
                        current
                          ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-5 w-5 transition-colors duration-200
                        ${
                          current
                            ? 'text-indigo-500'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }
                      `}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;