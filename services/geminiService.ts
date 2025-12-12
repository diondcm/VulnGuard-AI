import { GoogleGenAI } from "@google/genai";
import { Repository, ScanResult } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeRepository = async (url: string): Promise<Partial<Repository>> => {
  const ai = getClient();
  const model = "gemini-3-pro-preview";

  const prompt = `
    You are a developer assistant. I will provide a GitHub repository URL. 
    You must use Google Search to find details about this repository.
    
    URL: ${url}
    
    Task:
    1. Identify the Project Name (usually the repo name or title).
    2. Identify the main Technology Stack (e.g. React, Node.js, Python, Go, Rust).
    3. Identify the Core Version (The version of the main framework or the project version. e.g. 18.2.0. If unknown, say 'Latest').
    4. List the Dependencies (A list of key dependencies found in package.json, requirements.txt, go.mod, etc.).

    Respond using this EXACT format (do not use markdown formatting like ** or ##):
    Name: [Project Name]
    Technology: [Technology Name]
    Version: [Version Number]
    Dependencies: [Comma separated list of dependencies or JSON structure]
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType is NOT allowed with googleSearch
      },
    });

    const text = response.text || "";
    
    // Parse the response
    const nameMatch = text.match(/Name:\s*(.+)/i);
    const techMatch = text.match(/Technology:\s*(.+)/i);
    const versionMatch = text.match(/Version:\s*(.+)/i);
    // Capture everything after "Dependencies:" until the end or double newline
    const depMatch = text.match(/Dependencies:\s*([\s\S]+?)(?=$)/i);

    return {
      name: nameMatch ? nameMatch[1].trim() : "",
      technology: techMatch ? techMatch[1].trim() : "",
      version: versionMatch ? versionMatch[1].trim() : "1.0.0",
      dependencies: depMatch ? depMatch[1].trim() : "",
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const scanRepository = async (repo: Repository): Promise<ScanResult> => {
  const ai = getClient();
  
  // Using gemini-3-pro-preview for advanced reasoning and search capabilities
  const model = "gemini-3-pro-preview";

  const prompt = `
    You are a Senior Security Engineer. Perform a vulnerability assessment for the following project.
    
    Project Name: ${repo.name}
    Repository URL: ${repo.url}
    Technology Stack: ${repo.technology}
    Core Version: ${repo.version}
    
    Dependencies List:
    ${repo.dependencies}
    
    Task:
    1. Analyze the provided technology stack, version, and dependencies.
    2. Use Google Search to find RECENT (last 12 months) and CRITICAL security vulnerabilities (CVEs) associated with these specific versions.
    3. Ignore minor or patched vulnerabilities unless the version listed is outdated and vulnerable.
    4. Provide a concise report in Markdown format.
    5. Determine the overall status: 'safe', 'warning' (minor issues), or 'critical' (high severity CVEs found).
    
    Report Structure:
    - **Overall Status**: [SAFE/WARNING/CRITICAL]
    - **Summary**: Brief executive summary.
    - **Findings**: List specific CVEs or risks found with links if available.
    - **Recommendations**: Immediate actions required.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType is NOT allowed with googleSearch
        // responseSchema is NOT allowed with googleSearch
      },
    });

    const text = response.text || "No report generated.";
    
    // Extract grounding chunks (links)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = chunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri)
      .map((web: any) => ({ title: web.title || 'Source', url: web.uri }));

    // Simple heuristic to parse status from text since we can't use JSON schema
    let status: 'safe' | 'warning' | 'critical' = 'unknown' as any;
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("**overall status**: critical") || lowerText.includes("status: critical")) {
      status = 'critical';
    } else if (lowerText.includes("**overall status**: warning") || lowerText.includes("status: warning")) {
      status = 'warning';
    } else if (lowerText.includes("**overall status**: safe") || lowerText.includes("status: safe")) {
      status = 'safe';
    } else {
      // Fallback
      status = 'warning';
    }

    return {
      status,
      report: text,
      links
    };

  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw error;
  }
};
