import React, { useState, useEffect } from 'react';
import { DashboardData } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SubscribersList from './components/SubscribersList';
import TemplatesList from './components/TemplatesList';
import CampaignsList from './components/CampaignsList';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';

// Mock data generation
const generateMockData = (): DashboardData => ({
  kpis: [
    { title: 'Delivery Rate', value: '99.2%', change: '+0.1%', changeType: 'increase', period: 'vs last 7d' },
    { title: 'Hard Bounce Rate', value: '0.45%', change: '-0.05%', changeType: 'decrease', period: 'vs last 7d' },
    { title: 'Complaint Rate', value: '0.08%', change: '+0.02%', changeType: 'increase', period: 'vs last 7d' },
    { title: 'Unsubscribe Rate', value: '0.15%', change: '0.00%', changeType: 'neutral', period: 'vs last 7d' },
  ],
  gmailSpamRate: 0.12, // In the "warn" threshold
  domainPerformance: [
    { name: 'Gmail', deliveryRate: 99.1, complaintRate: 0.12, spamRate: 0.12 },
    { name: 'Yahoo', deliveryRate: 99.5, complaintRate: 0.09, spamRate: 0.08 },
    { name: 'Outlook', deliveryRate: 98.8, complaintRate: 0.15, spamRate: 0.18 },
    { name: 'Other', deliveryRate: 97.5, complaintRate: 0.20, spamRate: 0.25 },
  ],
  complianceChecklist: [
    { id: 'spf', name: 'SPF Alignment', status: 'pass', details: 'SPF record is valid and aligned.', fixLink: '#' },
    { id: 'dkim', name: 'DKIM Alignment', status: 'pass', details: 'DKIM signatures are valid and aligned.', fixLink: '#' },
    { id: 'dmarc', name: 'DMARC Policy', status: 'warn', details: 'p=none policy detected. Consider tightening to quarantine/reject.', fixLink: '#' },
    { id: 'list_unsub', name: 'One-Click Unsubscribe', status: 'pass', details: 'List-Unsubscribe headers are correctly implemented.', fixLink: '#' },
    { id: 'tls', name: 'TLS Encryption', status: 'pass', details: '100% of mail sent over TLS.', fixLink: '#' },
    { id: 'fbl', name: 'Feedback Loops', status: 'fail', details: 'Yahoo CFL not configured. Complaints may be missed.', fixLink: '#' },
  ],
});

type PageType = 'dashboard' | 'campaigns' | 'templates' | 'subscribers' | 'settings';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        fetchDashboardData(token);
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setLoading(false);
    }
  };

  const handleLogin = (token: string, userData: any) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    fetchDashboardData(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setData(null);
    setCurrentPage('dashboard'); // Reset to dashboard after logout
  };

  const fetchDashboardData = async (token?: string) => {
    const authToken = token || localStorage.getItem('authToken');
    if (!authToken) {
        setLoading(false);
        return;
    }

    setLoading(true); // Ensure loading is true when fetching
    try {
      const response = await fetch('/api/dashboard', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!response.ok) {
        console.warn('Dashboard API returned error:', response.status);
        if (response.status === 401) {
            handleLogout(); // Log out if unauthorized
            return;
        }
        setData(generateMockData()); // Use mock data on error if not 401
        return;
      }
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(generateMockData()); // Use mock data on catch
    } finally {
      setLoading(false);
    }
  };

  // Handle fetching data for other pages if needed, passing the token
  const fetchCampaignsData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const response = await fetch('/api/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        console.error('Failed to fetch campaigns data');
        if (response.status === 401) handleLogout();
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching campaigns data:', error);
      return null;
    }
  };

  const fetchTemplatesData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const response = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        console.error('Failed to fetch templates data');
        if (response.status === 401) handleLogout();
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching templates data:', error);
      return null;
    }
  };

  const fetchSubscribersData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const response = await fetch('/api/subscribers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        console.error('Failed to fetch subscribers data');
        if (response.status === 401) handleLogout();
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching subscribers data:', error);
      return null;
    }
  };


  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        if (loading) {
          return (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          );
        }
        if (!data) {
          return (
            <div className="text-center text-gray-400 p-8">
              Failed to load dashboard data. Please refresh the page.
            </div>
          );
        }
        return <Dashboard data={data} />;
      case 'campaigns':
        // In a real app, you would fetch campaigns data here and pass it to CampaignsList
        // For now, we'll render the component, assuming it handles its own fetching or uses mock data
        return <CampaignsList />;
      case 'templates':
        return <TemplatesList />;
      case 'subscribers':
        return <SubscribersList />;
      case 'settings':
        return <SettingsPage />;
      default:
        if (loading) {
          return (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          );
        }
        if (!data) {
          return (
            <div className="text-center text-gray-400 p-8">
              Failed to load dashboard data. Please refresh the page.
            </div>
          );
        }
        return <Dashboard data={data} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onLogout={handleLogout} />
        <main className="flex-1 p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;