/**
 * JeevaLink AI Companion Service
 * Routes AI query requests securely through Laravel Backend (/api/v1/ai/chat)
 * powered by Google Gemini API.
 */

import api from '../store/api.js';

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

  try {
    const response = await api.post('/ai/chat', payload, {
      timeout: 15000,
    });

    console.log('[AI Frontend Service] Received API Response from Backend:', response.data);

    if (response.data && response.data.success && response.data.reply) {
      return response.data.reply;
    }

    const errorMessage = response.data?.error || response.data?.message || 'Unexpected response from AI service.';
    throw new Error(errorMessage);
  } catch (error) {
    console.error('[AI Frontend Service] Request failed:', error);

    if (error.code === 'ECONNABORTED' || (typeof error.message === 'string' && error.message.includes('timeout'))) {
      throw new Error('Gemini API request timed out after 15 seconds. Please try again.');
    }

    const data = error.response?.data;
    let backendErr = null;

    if (typeof data === 'string' && data.trim()) {
      backendErr = data.trim();
    } else if (data && typeof data === 'object') {
      backendErr = data.error || data.message;
      if (typeof backendErr === 'object') {
        try {
          backendErr = JSON.stringify(backendErr);
        } catch {
          backendErr = null;
        }
      }
    }

    if (!backendErr && typeof error.message === 'string') {
      backendErr = error.message;
    }

    const finalMessage = (typeof backendErr === 'string' && backendErr.trim())
      ? backendErr
      : 'Failed to connect to AI companion.';

    throw new Error(finalMessage);
  }
}


