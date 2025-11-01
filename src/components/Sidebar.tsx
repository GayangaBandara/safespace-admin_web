import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  UserIcon,
  ClipboardIcon,
  ChartBarIcon,
  CogIcon,
  UserPlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Doctors', href: '/doctors', icon: UserIcon },
  { name: 'Reports', href: '/reports', icon: ClipboardIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

const adminManagement = [
  { name: 'Add New Admin', href: '/admin/add', icon: UserPlusIcon },
  { name: 'Manage Admins', href: '/admin/manage', icon: ShieldCheckIcon },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200 shadow-sm">
        <div className="flex items-center flex-shrink-0 px-4 pb-4 border-b border-gray-200">
          <img
            className="w-auto h-8"
            src="/logo.svg"
            alt="SafeSpace Admin"
          />
        </div>
        <div className="mt-5 flex-1 flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            <div className="mb-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Main
              </h3>
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
            
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Admin Management
              </h3>
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