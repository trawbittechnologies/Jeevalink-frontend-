/**
 * JeevaLink AI Companion Service
 * Routes AI query requests securely through Laravel Backend (/api/v1/ai/chat)
 * powered by Google Gemini API.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Send user query & conversation history to Laravel Backend API endpoint (/api/v1/ai/chat)
 * Returns actual Gemini response or throws error on failure.
 *
 * @param {string} userQuery
 * @param {Array<{sender: string, text: string}>} history
 * @returns {Promise<string>}
 */
export async function queryJeevaLinkAI(userQuery, history = []) {
  const query = (userQuery || '').trim();
  if (!query) {
    throw new Error('Query text cannot be empty.');
  }

  const payload = {
    query,
    history: history.map((msg) => ({
      sender: msg.sender,
      text: msg.text,
    })),
  };

  console.log('[AI Frontend Service] Sending API Request to Backend:', payload);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    console.log('[AI Frontend Service] Received API Response from Backend:', {
      status: response.status,
      data,
    });

    if (response.ok && data.success && data.reply) {
      return data.reply;
    }

    const errorMessage = data.error || data.message || `Backend returned HTTP status ${response.status}`;
    throw new Error(errorMessage);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[AI Frontend Service] Request failed:', error);
    if (error.name === 'AbortError') {
      throw new Error('Gemini API request timed out after 15 seconds.');
    }
    throw error;
  }
}

