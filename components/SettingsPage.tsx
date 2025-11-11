import React, { useState, useEffect } from 'react';
import { Save, Key, Mail, Server } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: '587',
    username: '',
    password: '',
    secure: false
  });
  const [senderSettings, setSenderSettings] = useState({
    defaultFromName: '',
    defaultFromEmail: '',
    defaultReplyTo: ''
  });
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (data.smtp) {
        setSmtpSettings(data.smtp);
      }
      if (data.sender) {
        setSenderSettings(data.sender);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveStatus('');
    
    try {
      await fetch('/api/settings/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: smtpSettings })
      });
      
      await fetch('/api/settings/sender', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: senderSettings })
      });
      
      setSaveStatus('Settings saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your email sending settings</p>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Server className="h-5 w-5 text-brand-blue mr-2" />
          <h2 className="text-lg font-semibold text-white">SMTP Configuration</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">SMTP Host</label>
              <input
                type="text"
                value={smtpSettings.host}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="smtp.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Port</label>
              <input
                type="text"
                value={smtpSettings.port}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="587"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
              <input
                type="text"
                value={smtpSettings.username}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, username: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="your-username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={smtpSettings.password}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="secure"
              checked={smtpSettings.secure}
              onChange={(e) => setSmtpSettings({ ...smtpSettings, secure: e.target.checked })}
              className="h-4 w-4 text-brand-blue bg-gray-700 border-gray-600 rounded focus:ring-brand-blue"
            />
            <label htmlFor="secure" className="ml-2 text-sm text-gray-300">
              Use secure connection (TLS/SSL)
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Mail className="h-5 w-5 text-brand-blue mr-2" />
          <h2 className="text-lg font-semibold text-white">Default Sender Settings</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Default From Name</label>
            <input
              type="text"
              value={senderSettings.defaultFromName}
              onChange={(e) => setSenderSettings({ ...senderSettings, defaultFromName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Your Company Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Default From Email</label>
            <input
              type="email"
              value={senderSettings.defaultFromEmail}
              onChange={(e) => setSenderSettings({ ...senderSettings, defaultFromEmail: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="hello@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Default Reply-To Email</label>
            <input
              type="email"
              value={senderSettings.defaultReplyTo}
              onChange={(e) => setSenderSettings({ ...senderSettings, defaultReplyTo: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="support@example.com"
            />
          </div>
        </div>
      </div>

      {saveStatus && (
        <div className={`p-4 rounded-lg ${saveStatus.includes('success') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          {saveStatus}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex items-center px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-colors disabled:opacity-50"
        >
          <Save className="h-5 w-5 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
