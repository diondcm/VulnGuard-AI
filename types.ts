export interface Repository {
  id: string;
  name: string;
  url: string;
  technology: string;
  version: string;
  dependencies: string; // Stored as text (user pasted package.json or list)
  lastScanned?: number;
  status: 'safe' | 'warning' | 'critical' | 'unknown' | 'scanning';
  lastReport?: string;
  groundingLinks?: { title: string; url: string }[];
  fixDelegatedAt?: number;
}

export type ScanResult = {
  status: 'safe' | 'warning' | 'critical';
  report: string;
  links: { title: string; url: string }[];
};

export interface AppSettings {
  julesApiKey: string;
  chatWebhookUrl: string;
}
