
import React from 'react';
import { LayoutDashboard, BarChart3, Mail, Users, Settings, LifeBuoy } from 'lucide-react';

type PageType = 'dashboard' | 'campaigns' | 'templates' | 'subscribers' | 'settings';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const navItems: { icon: any; label: string; page: PageType }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
    { icon: BarChart3, label: 'Campaigns', page: 'campaigns' },
    { icon: Mail, label: 'Templates', page: 'templates' },
    { icon: Users, label: 'Subscribers', page: 'subscribers' },
    { icon: Settings, label: 'Settings', page: 'settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-800 border-r border-gray-700">
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        </svg>
        <h1 className="text-xl font-bold ml-2 text-white">DeliverAI</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-brand-blue text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-700">
         <a href="#" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200">
             <LifeBuoy className="h-5 w-5 mr-3" />
             Support
         </a>
      </div>
    </aside>
  );
};

export default Sidebar;