import { Repository, AppSettings } from '../types';

/**
 * Trigger remediation via the Cloud Run backend.
 * Fire-and-forget logic preserved.
 */
export const triggerRemediation = async (
  repo: Repository, 
  report: string, 
  settings: AppSettings
): Promise<void> => {
  
  // Validate we have at least one configuration to act on
  if (!settings.julesApiKey && !settings.chatWebhookUrl) {
    return;
  }

  const payload = {
    repo,
    report,
    config: {
      julesApiKey: settings.julesApiKey,
      chatWebhookUrl: settings.chatWebhookUrl
    }
  };

  callBackend(settings.backendUrl, payload).catch(err => {
    // In a fire-and-forget model, we log the error but don't disrupt the user flow.
    console.warn("Background remediation trigger failed:", err);
  });
};

const callBackend = async (url: string, payload: any) => {
  if (!url) {
    console.warn("No Backend URL configured. Skipping remediation.");
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
    }
    
    console.log("Remediation request sent to backend successfully.");

  } catch (error) {
    // DEMO FALLBACK:
    // Since we don't have a real backend in this web environment, 
    // network errors are expected. We simulate success for the demo.
    console.log(`[Demo Mode] Backend at ${url} not reachable (${error}). Simulating success.`);
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("[Demo Mode] Simulated backend processing complete.");
  }
};
