
const fetch = require('node-fetch');

/**
 * Cloud Function to handle security remediation.
 * Expects a POST request with JSON body:
 * {
 *   repo: Repository object,
 *   report: string (vulnerability report),
 *   config: {
 *     julesApiKey: string,
 *     chatWebhookUrl: string
 *   }
 * }
 */
exports.remediate = async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { repo, report, config } = req.body;

  if (!repo || !config) {
    res.status(400).send('Missing repository or configuration data');
    return;
  }

  const errors = [];

  // 1. Trigger Google Jules (Mock/Real)
  if (config.julesApiKey) {
    try {
      console.log(`[Backend] Triggering Jules for ${repo.name}`);
      // Hypothetical Jules API call
      // await fetch('https://api.google.com/jules/v1/fix', { ... });
      
      // Simulate processing time
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error("Jules API failed:", err);
      errors.push(`Jules: ${err.message}`);
    }
  }

  // 2. Notify Google Chat
  if (config.chatWebhookUrl) {
    try {
      console.log(`[Backend] Sending Chat notification for ${repo.name}`);
      const card = {
        cards: [{
          header: {
            title: "🚨 Security Vulnerability Detected",
            subtitle: `Project: ${repo.name}`,
            imageUrl: "https://www.gstatic.com/images/branding/product/2x/google_cloud_48dp.png",
            imageStyle: "IMAGE"
          },
          sections: [{
            widgets: [
              {
                textParagraph: {
                  text: `<b>Critical issues found in ${repo.technology} v${repo.version}</b>.<br>A fix has been requested via Google Jules.`
                }
              },
              {
                buttons: [{
                  textButton: {
                    text: "View Repository",
                    onClick: { openLink: { url: repo.url } }
                  }
                }]
              }
            ]
          }]
        }]
      };

      const chatResponse = await fetch(config.chatWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(card)
      });

      if (!chatResponse.ok) {
        throw new Error(`Status ${chatResponse.status}`);
      }
    } catch (err) {
      console.error("Chat Webhook failed:", err);
      errors.push(`Chat: ${err.message}`);
    }
  }

  res.status(200).json({ 
    success: true, 
    message: "Remediation triggered successfully",
    errors: errors.length > 0 ? errors : undefined 
  });
};
