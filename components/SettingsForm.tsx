import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { X, Save, Settings, Key, MessageSquare } from 'lucide-react';

interface SettingsFormProps {
  initialSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onCancel: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ initialSettings, onSave, onCancel }) => {
  const [formData, setFormData] = useState<AppSettings>({
    julesApiKey: '',
    chatWebhookUrl: ''
  });

  useEffect(() => {
    setFormData(initialSettings);
  }, [initialSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-white/10 w-full max-w-lg rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings size={20} />
            Integration Settings
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <Key size={16} /> Jules API Key
            </label>
            <input
              type="password"
              value={formData.julesApiKey}
              onChange={(e) => setFormData({...formData, julesApiKey: e.target.value})}
              className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder-gray-700"
              placeholder="Enter your Google Jules API Key"
            />
            <p className="text-xs text-gray-500 mt-1">Used to automatically generate PRs for fixes.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <MessageSquare size={16} /> Google Chat Webhook URL
            </label>
            <input
              type="url"
              value={formData.chatWebhookUrl}
              onChange={(e) => setFormData({...formData, chatWebhookUrl: e.target.value})}
              className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder-gray-700"
              placeholder="https://chat.googleapis.com/v1/spaces/..."
            />
            <p className="text-xs text-gray-500 mt-1">Used to send notifications when vulnerabilities are detected.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsForm;
