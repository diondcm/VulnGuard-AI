import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  Plus, 
  Trash2, 
  Edit, 
  ExternalLink, 
  RefreshCw, 
  Search,
  Activity,
  Github,
  Settings as SettingsIcon,
  Bot
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Repository } from './types';
import * as storage from './utils/storage';
import * as geminiService from './services/geminiService';
import * as integrationService from './services/integrationService';
import RepoForm from './components/RepoForm';
import SettingsForm from './components/SettingsForm';

const App: React.FC = () => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);

  useEffect(() => {
    setRepos(storage.getRepositories());
  }, []);

  const handleSaveRepo = (repo: Repository) => {
    storage.saveRepository(repo);
    setRepos(storage.getRepositories());
    setIsFormOpen(false);
    setEditingRepo(null);
  };

  const handleSaveSettings = (settings: any) => {
    storage.saveSettings(settings);
    setIsSettingsOpen(false);
  };

  const handleDeleteRepo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this repository configuration?')) {
      storage.deleteRepository(id);
      setRepos(storage.getRepositories());
      if (selectedRepoId === id) setSelectedRepoId(null);
    }
  };

  const handleEditRepo = (repo: Repository, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRepo(repo);
    setIsFormOpen(true);
  };

  const handleScan = async (repo: Repository, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setScanningId(repo.id);
    
    // Optimistic update
    const updated = { ...repo, status: 'scanning' as const };
    storage.saveRepository(updated);
    setRepos(storage.getRepositories());

    try {
      const result = await geminiService.scanRepository(repo);
      
      // Check if we need to trigger auto-fix
      let fixDelegatedAt = repo.fixDelegatedAt;
      
      // If critical or warning, trigger integrations
      if (result.status === 'critical' || result.status === 'warning') {
        const settings = storage.getSettings();
        if (settings.julesApiKey || settings.chatWebhookUrl) {
          // Fire and forget
          integrationService.triggerRemediation(repo, result.report, settings);
          // Update timestamp to show in UI
          fixDelegatedAt = Date.now();
        }
      }

      const finishedRepo: Repository = {
        ...repo,
        status: result.status,
        lastReport: result.report,
        groundingLinks: result.links,
        lastScanned: Date.now(),
        fixDelegatedAt
      };
      
      storage.saveRepository(finishedRepo);
      setRepos(storage.getRepositories());
      
    } catch (error) {
      console.error("Scan failed", error);
      const failedRepo: Repository = { ...repo, status: 'unknown' };
      storage.saveRepository(failedRepo);
      setRepos(storage.getRepositories());
      alert('Scan failed. Please check your API Key and internet connection.');
    } finally {
      setScanningId(null);
    }
  };

  const handleScanAll = async () => {
    // Sequential scanning to avoid rate limits and better UX flow
    for (const repo of repos) {
      await handleScan(repo);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-success border-success/20 bg-success/10';
      case 'warning': return 'text-warning border-warning/20 bg-warning/10';
      case 'critical': return 'text-danger border-danger/20 bg-danger/10';
      case 'scanning': return 'text-primary border-primary/20 bg-primary/10';
      default: return 'text-gray-400 border-gray-700 bg-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <ShieldCheck size={20} />;
      case 'warning': return <ShieldAlert size={20} />;
      case 'critical': return <ShieldAlert size={20} />;
      case 'scanning': return <RefreshCw size={20} className="animate-spin" />;
      default: return <Shield size={20} />;
    }
  };

  const selectedRepo = repos.find(r => r.id === selectedRepoId);

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans flex flex-col md:flex-row">
      {/* Sidebar / List */}
      <aside className="w-full md:w-96 bg-surface border-r border-white/5 flex flex-col h-screen overflow-hidden sticky top-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Activity size={24} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                VulnGuard
              </h1>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
              title="Settings"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => { setEditingRepo(null); setIsFormOpen(true); }}
              className="flex-1 bg-primary hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Plus size={16} /> New Project
            </button>
            <button 
              onClick={handleScanAll}
              disabled={!!scanningId || repos.length === 0}
              className="bg-surface hover:bg-white/5 border border-white/10 text-gray-300 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
              title="Scan All"
            >
              <RefreshCw size={16} className={scanningId ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {repos.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p className="mb-2">No repositories configured.</p>
              <p className="text-sm">Add a project to start monitoring.</p>
            </div>
          )}
          
          {repos.map(repo => (
            <div 
              key={repo.id}
              onClick={() => setSelectedRepoId(repo.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                selectedRepoId === repo.id 
                  ? 'bg-white/5 border-primary/50 shadow-lg shadow-black/20' 
                  : 'bg-background border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white truncate pr-2">{repo.name}</h3>
                <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(repo.status)}`}>
                  {getStatusIcon(repo.status)}
                  {repo.status === 'scanning' ? 'SCANNING' : repo.status}
                </div>
              </div>
              
              <p className="text-xs text-gray-400 mb-3 truncate">{repo.url}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{repo.technology} v{repo.version}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleEditRepo(repo, e)}
                    className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteRepo(repo.id, e)}
                    className="p-1.5 hover:bg-red-500/20 rounded text-gray-300 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {repo.fixDelegatedAt && repo.status !== 'safe' && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-primary/80">
                  <Bot size={12} />
                  <span>Jules Fix Initiated</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-background p-6 md:p-10">
        {selectedRepo ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{selectedRepo.name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <a href={selectedRepo.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Github size={16} /> {selectedRepo.url}
                  </a>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span>Last scanned: {selectedRepo.lastScanned ? new Date(selectedRepo.lastScanned).toLocaleString() : 'Never'}</span>
                </div>
              </div>
              <button 
                onClick={(e) => handleScan(selectedRepo, e)}
                disabled={selectedRepo.status === 'scanning'}
                className="bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                {selectedRepo.status === 'scanning' ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Run Security Scan
                  </>
                )}
              </button>
            </div>

            {/* Status & Auto-fix info */}
            {selectedRepo.fixDelegatedAt && selectedRepo.status !== 'safe' && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                 <div className="p-3 bg-primary/20 rounded-full text-primary">
                    <Bot size={24} />
                 </div>
                 <div>
                    <h4 className="font-bold text-white">Automated Remediation Active</h4>
                    <p className="text-sm text-gray-300">
                      We've delegated a fix request to Google Jules and notified your chat channel at {new Date(selectedRepo.fixDelegatedAt).toLocaleTimeString()}.
                    </p>
                 </div>
              </div>
            )}

            {/* Report Area */}
            {selectedRepo.lastReport ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-6 rounded-xl border mb-6 ${getStatusColor(selectedRepo.status)} bg-opacity-5`}>
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(selectedRepo.status)}
                    <h3 className="text-lg font-bold uppercase">Security Assessment: {selectedRepo.status}</h3>
                  </div>
                  <p className="opacity-80">
                    Based on the analysis of {selectedRepo.technology} v{selectedRepo.version} and dependencies.
                  </p>
                </div>

                <div className="bg-surface border border-white/5 rounded-xl p-8 shadow-xl">
                  <div className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-a:text-primary prose-strong:text-white prose-li:text-gray-300 text-gray-300">
                    <ReactMarkdown>{selectedRepo.lastReport}</ReactMarkdown>
                  </div>
                </div>

                {/* Grounding Links */}
                {selectedRepo.groundingLinks && selectedRepo.groundingLinks.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Sources & References</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedRepo.groundingLinks.map((link, i) => (
                        <a 
                          key={i} 
                          href={link.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-between p-3 bg-surface border border-white/5 rounded-lg hover:border-primary/50 hover:bg-white/5 transition-all group"
                        >
                          <span className="text-sm text-gray-300 truncate pr-4">{link.title}</span>
                          <ExternalLink size={14} className="text-gray-500 group-hover:text-primary" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <Shield size={64} className="mb-4 opacity-20" />
                <p className="text-xl font-medium mb-2">No Scan Report Available</p>
                <p className="text-sm opacity-60">Run a security scan to analyze vulnerabilities.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
             <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Activity size={40} className="text-primary opacity-80" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-2">Welcome to VulnGuard AI</h2>
             <p className="max-w-md text-center opacity-60">
               Select a repository from the sidebar or add a new one to start monitoring security vulnerabilities in your projects.
             </p>
          </div>
        )}
      </main>

      {isFormOpen && (
        <RepoForm 
          initialData={editingRepo} 
          onSave={handleSaveRepo} 
          onCancel={() => { setIsFormOpen(false); setEditingRepo(null); }} 
        />
      )}

      {isSettingsOpen && (
        <SettingsForm 
          initialSettings={storage.getSettings()}
          onSave={handleSaveSettings}
          onCancel={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
