/**
 * JeevaLink AI Companion Service
 * Routes AI query requests securely through Laravel Backend (/api/v1/ai/chat)
 * powered by Groq API, with robust fallback response generator for blood,
 * technical architecture, and project feature queries.
 */

import api from '../store/api.js';

function getSmartFallbackReply(query) {
  const q = query.toLowerCase();

  // 1. Technical & Architecture Questions
  if (q.includes('tech') || q.includes('stack') || q.includes('architecture') || q.includes('built with') || q.includes('framework') || q.includes('database') || q.includes('backend') || q.includes('frontend')) {
    return `**JeevaLink Technical Architecture & Stack (Built by Trawbit Technologies):**\n\n- **Frontend**: React 18 with Vite, Vanilla CSS + TailwindCSS, Framer Motion for animations, and Lucide icon system.\n- **Backend**: Laravel RESTful API with structured controllers, Sanctum/JWT token authentication, and RBAC middleware.\n- **Database**: Relational SQLite / PostgreSQL database managing Users, Blood Requests, Campaigns, and Technical Reports.\n- **AI Engine**: Groq LPU API delivering high-speed natural language processing.\n- **Messaging**: Firebase Cloud Messaging (FCM) for push alerts & direct WhatsApp SOS integration.`;
  }

  if (q.includes('trawbit') || q.includes('developer') || q.includes('who built') || q.includes('team') || q.includes('company')) {
    return `**About Trawbit Technologies:**\nTrawbit Technologies is the core technology partner and engineering team behind JeevaLink. They design and maintain the web platform, mobile PWA, database infrastructure, Groq AI integrations, and emergency broadcast systems for voluntary blood donation.`;
  }

  // 2. Platform Features & Modules
  if (q.includes('jeevapoint') || q.includes('points') || q.includes('badge') || q.includes('reward')) {
    return `**JeevaPoints & Recognition System:**\n\n- **Donation Credits**: Donating blood earns 100 JeevaPoints per successful milestone.\n- **Volunteer Credits**: Meghala & Block volunteers receive 20 points for coordinating verified donations.\n- **Badges & Certificates**: Earn digital certificates of appreciation and ranking on the regional Leaderboard.`;
  }

  if (q.includes('hierarchy') || q.includes('role') || q.includes('meghala') || q.includes('block') || q.includes('admin')) {
    return `**JeevaLink Role Hierarchy & Structure:**\n\n1. **User / Donor**: Posts requests, self-assesses eligibility, donates blood.\n2. **Unit Squad**: Local grassroots camp and donor registration squad.\n3. **Meghala Volunteer Committee**: Local community coordinator managing donor dispatch & verification.\n4. **Block Committee Admin**: Higher block-level administration verifying volunteers & handling escalations.\n5. **District Super Admin**: District-wide analytics, hospital requests, and governance.\n6. **Technical Admin (Trawbit Technologies)**: System health, bug tracking, and code maintenance.`;
  }

  if (q.includes('sos') || q.includes('emergency') || q.includes('request blood') || q.includes('urgent')) {
    return `**Emergency Blood Request & SOS Workflow:**\n\n1. **Create Request**: Fill out patient name, required blood group, units, hospital, and bystander contact.\n2. **Instant Match Broadcast**: The system filters donors by blood compatibility, district proximity, and cooldown readiness.\n3. **SOS Action**: Generate an automated poster and share directly to WhatsApp groups or call bystanders with 1 tap.`;
  }

  if (q.includes('eligib') || q.includes('health check') || q.includes('weight') || q.includes('age') || q.includes('malayalam')) {
    return `**Health & Donor Eligibility Guidelines:**\n\n- **Age**: 18 to 65 years.\n- **Weight**: Minimum 50 kg (110 lbs).\n- **Donation Interval**: 90 days (3 months) cooldown between donations.\n- **Tattoos/Piercings**: 6-month wait period.\n- **Current Health**: Free from fever, active infection, and off antibiotics.\n- **Language**: The Health Eligibility Test on JeevaLink supports full **Malayalam (മലയാളം)** and English with a top switcher.`;
  }

  if (q.includes('complaint') || q.includes('support') || q.includes('contact') || q.includes('human')) {
    return `**3-Tier Help & Complaints Structure:**\n\n1. **Technical Support**: Bug reports & system issues handled directly by **Technical Admin (Trawbit Technologies)**.\n2. **Blood Donation / Receive Issues**: Handled directly by your local **Meghala Committee**.\n3. **Complaint Against Meghala**: Escalated above Meghala level to the **Block Committee Admin** for fair review.\n\n*Switch to the "Human Helpdesk" tab to access direct contacts or file a report.*`;
  }

  return `**JeevaLink Assistant:**\nI can answer questions regarding:\n- **Blood Donation**: Compatibility, eligibility, donation cooldown, emergency requests.\n- **Project Technical Architecture**: React/Vite, Laravel backend, Groq AI LPU, Trawbit Technologies.\n- **Platform Features**: JeevaPoints, Volunteer Directory, Malayalam health test, and 3-Tier support.\n\nHow can I assist you with these topics?`;
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
