import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Send, Calendar, Eye } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  fromName: string;
  fromEmail: string;
  lists: string[];
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
}

const CampaignsList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    templateId: '',
    fromName: '',
    fromEmail: '',
    lists: ''
  });

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleAddCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCampaign,
          templateId: newCampaign.templateId || null,
          lists: newCampaign.lists.split(',').map(l => l.trim()).filter(Boolean)
        })
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setNewCampaign({ name: '', subject: '', templateId: '', fromName: '', fromEmail: '', lists: '' });
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error adding campaign:', error);
    }
  };

  const handleSendCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to send this campaign?')) return;
    
    try {
      const response = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
      const result = await response.json();
      alert(result.message || 'Campaign sent successfully!');
      fetchCampaigns();
    } catch (error) {
      console.error('Error sending campaign:', error);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      draft: 'bg-gray-700 text-gray-300',
      scheduled: 'bg-blue-900 text-blue-200',
      sending: 'bg-yellow-900 text-yellow-200',
      sent: 'bg-green-900 text-green-200',
      failed: 'bg-red-900 text-red-200'
    };
    return statusStyles[status] || statusStyles.draft;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-gray-400 mt-1">Create and manage email campaigns</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Campaign
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Lists</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">{campaign.name}</div>
                      <div className="text-xs text-gray-400">{campaign.subject}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div>{campaign.fromName}</div>
                    <div className="text-xs text-gray-500">{campaign.fromEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {campaign.lists.length > 0 ? campaign.lists.join(', ') : 'All'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleSendCampaign(campaign.id)}
                          className="text-green-400 hover:text-green-300"
                          title="Send campaign"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCampaigns.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No campaigns found
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full m-4">
            <h2 className="text-xl font-bold text-white mb-4">Create New Campaign</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="Monthly Newsletter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject Line *</label>
                <input
                  type="text"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="Check out what's new this month"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Template (optional)</label>
                <select
                  value={newCampaign.templateId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, templateId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">No template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">From Name *</label>
                  <input
                    type="text"
                    value={newCampaign.fromName}
                    onChange={(e) => setNewCampaign({ ...newCampaign, fromName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">From Email *</label>
                  <input
                    type="email"
                    value={newCampaign.fromEmail}
                    onChange={(e) => setNewCampaign({ ...newCampaign, fromEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    placeholder="hello@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Target Lists (comma-separated, leave empty for all)</label>
                <input
                  type="text"
                  value={newCampaign.lists}
                  onChange={(e) => setNewCampaign({ ...newCampaign, lists: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="newsletter, marketing"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCampaign}
                className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-colors"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsList;
