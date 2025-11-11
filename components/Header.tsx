
import React from 'react';
import { Bell, Search } from 'lucide-react';

const Header: React.FC = () => {
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
        <div className="flex items-center">
            <img 
                className="h-9 w-9 rounded-full" 
                src="https://picsum.photos/100/100" 
                alt="User avatar" 
            />
            <div className="ml-3 hidden lg:block">
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-gray-400">Brand Inc.</p>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
