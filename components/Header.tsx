import React from 'react';
import { Bell, Search, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  // Placeholder for user data and logout function. In a real app, these would come from an auth context.
  const user = { name: 'Admin User', email: 'admin@brand.com' }; 
  const onLogout = () => { 
    console.log("Logging out..."); 
    // In a real app, you would clear tokens and redirect to login
  };

  return (
    <header className="flex items-center justify-between h-16 bg-gray-800 border-b border-gray-700 px-4 sm:px-6 lg:px-8">
      <div>
        <h2 className="text-xl font-semibold text-white">Deliverability Dashboard</h2>
        <p className="text-sm text-gray-400">7-day rolling performance overview</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            className="bg-gray-700 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <button className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
          <Bell className="h-6 w-6" />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-xs text-gray-400">{user.email}</div>
            </div>
            <div className="h-8 w-8 bg-brand-blue rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            title="Logout"
          >
            <LogOut className="h-6 w-6" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;