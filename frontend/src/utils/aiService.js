/**
 * iDonate AI Companion Service
 * Routes AI query requests securely through Laravel Backend (/api/v1/ai/chat)
 * powered by Groq API, with robust fallback response generator for blood,
 * technical architecture, and project feature queries.
 */

import api from '../store/api.js';

function getSmartFallbackReply(query) {
  const q = query.toLowerCase();

  // 1. Technical & Architecture Questions
  if (q.includes('tech') || q.includes('stack') || q.includes('architecture') || q.includes('built with') || q.includes('framework') || q.includes('database') || q.includes('backend') || q.includes('frontend')) {
    return `**💻 iDonate Technology Stack:**\n\n- **Frontend**: React 18 & Vite (Fast, modern user interface)\n- **Backend**: Laravel REST API (Secure and robust backend)\n- **Database**: Relational SQLite / PostgreSQL database\n- **AI Engine**: Groq LPU (Ultra-fast support assistant)\n- **Notifications**: Firebase Cloud Messaging & WhatsApp SOS\n\n*Built and maintained by **Trawbit Technologies**.*`;
  }

  if (q.includes('trawbit') || q.includes('developer') || q.includes('who built') || q.includes('team') || q.includes('company')) {
    return `**👨‍💻 About Trawbit Technologies:**\n\n**Trawbit Technologies** is the core software development team behind iDonate. They created and maintain the web platform, mobile app, database, and emergency blood donation network.`;
  }

  // 2. Platform Features & Modules
  if (q.includes('jeevapoint') || q.includes('points') || q.includes('badge') || q.includes('reward')) {
    return `**🏆 JeevaPoints & Rewards:**\n\n- **Donating Blood**: Earn **100 points** for each donation milestone.\n- **Volunteering**: Earn **20 points** for verifying or coordinating blood donations.\n- **Certificates**: Unlock digital certificates of appreciation and rise on the Leaderboard!`;
  }

  if (q.includes('hierarchy') || q.includes('role') || q.includes('meghala') || q.includes('block') || q.includes('admin')) {
    return `**👥 iDonate Roles & Structure:**\n\n1. **User / Donor**: Donates blood and requests emergency units.\n2. **Meghala Committee**: Local village/ward volunteer coordinators.\n3. **Block Committee Admin**: Oversees local committees and resolves complaints.\n4. **District Super Admin**: Manages district-wide blood camps and hospitals.\n5. **Tech Admin (Trawbit)**: Fixes bugs and manages application servers.`;
  }

  if (q.includes('sos') || q.includes('emergency') || q.includes('request blood') || q.includes('urgent')) {
    return `**🚨 How to Request Emergency Blood:**\n\n1. **Click 'Request Blood'**: Enter patient name, hospital, and blood group needed.\n2. **Instant SOS**: The system alerts matching eligible donors nearby immediately.\n3. **Share Poster**: Generate an instant WhatsApp poster to share across groups.`;
  }

  if (q.includes('eligib') || q.includes('health check') || q.includes('weight') || q.includes('age') || q.includes('malayalam')) {
    return `**🩸 Blood Donation Eligibility Rules:**\n\n- **Age**: 18 to 65 years\n- **Weight**: Minimum **50 kg**\n- **Interval**: **90 days (3 months)** gap between donations\n- **Health**: Must be healthy, free from fever/infection, and not taking antibiotics\n- **Tattoos/Piercings**: Wait 6 months\n\n💡 *Take the quick Health Eligibility Test in Malayalam or English from your dashboard!*`;
  }

  if (q.includes('complaint') || q.includes('support') || q.includes('contact') || q.includes('human')) {
    return `**🤝 Need Help or Want to Report an Issue?**\n\n- **Technical Bug**: Handled by **Trawbit Tech Team** (support@trawbit.com)\n- **Blood Donation Issue**: Handled by your local **Meghala Committee** (Hotline: 1910)\n- **File a Formal Complaint**: Click the **'Report / Complaint'** button to submit a ticket for admin investigation.`;
  }

  return `**👋 iDonate Support AI:**\n\nI can help you with:\n- 🩸 **Blood Donation**: Eligibility rules, compatibility, donation gap\n- 🛠️ **Technical Support**: Login issues, OTP, bugs, or features\n- 🚨 **Complaints**: Reporting fake requests or suspicious users\n\n*How can I help you today? (English, മലയാളം, or Manglish)*`;
}

/**
 * Send user query & conversation history to Laravel Backend API endpoint (/api/v1/ai/chat)
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

  try {
    const response = await api.post('/ai/chat', payload, {
      timeout: 12000,
    });

    if (response.data && response.data.success && response.data.reply) {
      return response.data.reply;
    }

    // Fallback if reply is missing in payload
    return getSmartFallbackReply(query);
  } catch (error) {
    console.warn('[AI Frontend Service] Remote AI call unavailable, using smart local assistant fallback:', error);
    // Return high quality knowledge base reply rather than failing
    return getSmartFallbackReply(query);
  }
}

export const queryIdonateAI = queryJeevaLinkAI;
