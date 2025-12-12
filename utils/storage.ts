import { Repository, AppSettings } from '../types';

const STORAGE_KEY = 'vulnguard_repos';
const SETTINGS_KEY = 'vulnguard_settings';

export const getRepositories = (): Repository[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRepository = (repo: Repository): void => {
  const repos = getRepositories();
  const existingIndex = repos.findIndex((r) => r.id === repo.id);
  
  if (existingIndex >= 0) {
    repos[existingIndex] = repo;
  } else {
    repos.push(repo);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(repos));
};

export const deleteRepository = (id: string): void => {
  const repos = getRepositories();
  const filtered = repos.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const updateRepositoryStatus = (id: string, updates: Partial<Repository>): void => {
  const repos = getRepositories();
  const index = repos.findIndex(r => r.id === id);
  if (index !== -1) {
    repos[index] = { ...repos[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repos));
  }
};

export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : { julesApiKey: '', chatWebhookUrl: '' };
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
