import React, { useState, useEffect } from 'react';
import { Repository } from '../types';
import { X, Save, Search, Loader2 } from 'lucide-react';
import { analyzeRepository } from '../services/geminiService';

interface RepoFormProps {
  initialData?: Repository | null;
  onSave: (repo: Repository) => void;
  onCancel: () => void;
}

const RepoForm: React.FC<RepoFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Repository>({
    id: crypto.randomUUID(),
    name: '',
    url: '',
    technology: '',
    version: '',
    dependencies: '',
    status: 'unknown'
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setHasAnalyzed(true); // Skip step 1 if editing
    }
  }, [initialData]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url) return;

    setIsAnalyzing(true);
    try {
      const data = await analyzeRepository(formData.url);
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        technology: data.technology || prev.technology,
        version: data.version || prev.version,
        dependencies: data.dependencies || prev.dependencies,
      }));
      setHasAnalyzed(true);
    } catch (error) {
      alert("Could not analyze repository. Please fill details manually.");
      setHasAnalyzed(true); // Allow manual entry on fail
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {initialData ? 'Edit Repository' : 'Add New Project'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {!hasAnalyzed ? (
          /* Step 1: URL Input */
          <form onSubmit={handleAnalyze} className="p-8 space-y-6">
            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                <Search size={32} />
              </div>
              <h3 className="text-lg font-medium text-white">Enter Repository URL</h3>
              <p className="text-gray-400 text-sm">
                We'll use Gemini to automatically detect the technology stack and dependencies.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">GitHub URL</label>
              <input
                required
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder-gray-600"
                placeholder="https://github.com/facebook/react"
              />
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !formData.url}
              className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing Repository...
                </>
              ) : (
                <>
                  Analyze Repository
                </>
              )}
            </button>
            
            <div className="text-center">
               <button 
                 type="button" 
                 onClick={() => setHasAnalyzed(true)}
                 className="text-xs text-gray-500 hover:text-gray-300 underline"
               >
                 Skip analysis and enter manually
               </button>
            </div>
          </form>
        ) : (
          /* Step 2: Full Form Review */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 animate-in slide-in-from-right-4 duration-300">
             <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 flex items-start gap-3">
               <div className="text-primary mt-1"><Search size={16} /></div>
               <div>
                 <p className="text-sm text-primary font-medium">Analysis Complete</p>
                 <p className="text-xs text-primary/80">Please review the detected details below before saving.</p>
               </div>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">GitHub URL</label>
                <input
                  required
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Technology Stack</label>
                <input
                  required
                  type="text"
                  value={formData.technology}
                  onChange={(e) => setFormData({...formData, technology: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Core Version</label>
                <input
                  required
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Dependencies 
              </label>
              <textarea
                required
                rows={6}
                value={formData.dependencies}
                onChange={(e) => setFormData({...formData, dependencies: e.target.value})}
                className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
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
                Save Repository
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RepoForm;
