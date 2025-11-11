import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, Copy, Eye } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  createdAt: string;
}

const TemplatesList: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', htmlContent: '', textContent: '' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setNewTemplate({ name: '', subject: '', htmlContent: '', textContent: '' });
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error adding template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDuplicateTemplate = async (id: string) => {
    try {
      await fetch(`/api/templates/${id}/duplicate`, { method: 'POST' });
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Templates</h1>
          <p className="text-gray-400 mt-1">Create and manage reusable email templates</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Template
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-brand-blue transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-400 truncate">{template.subject}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDuplicateTemplate(template.id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="px-3 py-2 bg-red-900 text-red-200 rounded-lg hover:bg-red-800 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No templates found
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full m-4">
            <h2 className="text-xl font-bold text-white mb-4">Create New Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="Welcome Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject Line *</label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="Welcome to our platform!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">HTML Content *</label>
                <textarea
                  value={newTemplate.htmlContent}
                  onChange={(e) => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono text-sm"
                  placeholder="<html><body>Hello!</body></html>"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Plain Text (optional)</label>
                <textarea
                  value={newTemplate.textContent}
                  onChange={(e) => setNewTemplate({ ...newTemplate, textContent: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="Plain text version..."
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
                onClick={handleAddTemplate}
                className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-colors"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesList;
