/**
 * JeevaLink AI Companion Service
 * Routes AI query requests securely through Laravel Backend (/api/v1/ai/chat)
 * powered by Google Gemini 2.5 Flash.
 */

const JEEVALINK_KNOWLEDGE = {
  platform: 'JeevaLink is Kerala’s official voluntary blood sourcing platform, connecting patients in urgent need with verified donors across all 14 districts, supported by regional DYFI Block Committee coordinators.',
  districts: [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
    'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode',
    'Wayanad', 'Kannur', 'Kasaragod'
  ],
  compatibility: {
    'O-': 'O- Negative is a universal RBC donor! Can donate to O-, O+, A-, A+, B-, B+, AB-, AB+.',
    'O+': 'O+ Positive can donate to O+, A+, B+, AB+. Can receive from O- and O+.',
    'A-': 'A- Negative can donate to A-, A+, AB-, AB+. Can receive from O- and A-.',
    'A+': 'A+ Positive can donate to A+ and AB+. Can receive from O-, O+, A-, A+.',
    'B-': 'B- Negative can donate to B-, B+, AB-, AB+. Can receive from O- and B-.',
    'B+': 'B+ Positive can donate to B+ and AB+. Can receive from O-, O+, B-, B+.',
    'AB-': 'AB- Negative can donate to AB- and AB+. Can receive from O-, A-, B-, AB-.',
    'AB+': 'AB+ Positive is the universal RBC recipient! Can receive from all blood groups and donate to AB+.',
  },
  eligibility: {
    age: '18 to 65 years old',
    weight: 'Minimum 45 kg',
    hemoglobin: 'At least 12.5 g/dL',
    tattoo: 'Wait 6 months after getting a tattoo/piercing at a registered medical studio (12 months if performed elsewhere).',
    interval: 'Men can donate whole blood every 90 days (3 months), women every 120 days (4 months). Platelets can be donated every 14 days.',
    alcohol: 'Avoid alcohol for at least 24 hours prior to donation.',
    vaccine: 'Wait 14 days after receiving non-live vaccines if symptom-free.',
  },
  emergency: 'Submit an Emergency SOS request on JeevaLink. Local DYFI Block Committee officers verify the request authenticity and alert nearby active donors in a 15km radius immediately.',
  helplines: 'State Emergency Healthcare Helpline: 104 / 1910. Local DYFI Block Coordinators can be contacted via the Block Committee Directory.',
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generate AI Response via Secure Backend Proxy (/api/v1/ai/chat)
 * with graceful fallback to JeevaLink Neural Knowledge Engine.
 */
export async function queryJeevaLinkAI(userQuery) {
  const query = (userQuery || '').trim();
  if (!query) return 'Hello! How can Captain Jeeva assist you today?';

  // 1. Attempt secure call via Laravel Backend API endpoint (/api/v1/ai/chat)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.reply) {
        return data.reply;
      }
    }
  } catch {
    // Offline or network fallback
  }

  // 2. Offline JeevaLink Trained Knowledge Engine Fallback Intent Matcher
  const lowerQuery = query.toLowerCase();

  for (const [bg, info] of Object.entries(JEEVALINK_KNOWLEDGE.compatibility)) {
    if (lowerQuery.includes(bg.toLowerCase()) || lowerQuery.includes(bg.replace(/[-+]/, '').toLowerCase())) {
      if (lowerQuery.includes('donor') || lowerQuery.includes('give') || lowerQuery.includes('receive') || lowerQuery.includes('compatible') || lowerQuery.includes('blood')) {
        return info;
      }
    }
  }

  if (lowerQuery.includes('tattoo') || lowerQuery.includes('piercing')) {
    return JEEVALINK_KNOWLEDGE.eligibility.tattoo;
  }
  if (lowerQuery.includes('age') || lowerQuery.includes('weight') || lowerQuery.includes('eligible') || lowerQuery.includes('rule')) {
    return `To donate blood, you must be ${JEEVALINK_KNOWLEDGE.eligibility.age}, weigh at least ${JEEVALINK_KNOWLEDGE.eligibility.weight}, and have hemoglobin ${JEEVALINK_KNOWLEDGE.eligibility.hemoglobin}.`;
  }
  if (lowerQuery.includes('interval') || lowerQuery.includes('often') || lowerQuery.includes('gap') || lowerQuery.includes('month') || lowerQuery.includes('days')) {
    return JEEVALINK_KNOWLEDGE.eligibility.interval;
  }
  if (lowerQuery.includes('emergency') || lowerQuery.includes('sos') || lowerQuery.includes('urgent') || lowerQuery.includes('hospital')) {
    return JEEVALINK_KNOWLEDGE.emergency;
  }
  if (lowerQuery.includes('district') || lowerQuery.includes('kerala') || lowerQuery.includes('location') || lowerQuery.includes('city')) {
    return `JeevaLink covers all 14 Kerala districts: ${JEEVALINK_KNOWLEDGE.districts.join(', ')}. Registered donors and DYFI block officers are active in your area.`;
  }
  if (lowerQuery.includes('phone') || lowerQuery.includes('helpline') || lowerQuery.includes('contact') || lowerQuery.includes('call') || lowerQuery.includes('number')) {
    return JEEVALINK_KNOWLEDGE.helplines;
  }
  if (lowerQuery.includes('alcohol') || lowerQuery.includes('drink') || lowerQuery.includes('food') || lowerQuery.includes('eat')) {
    return `${JEEVALINK_KNOWLEDGE.eligibility.alcohol} Drink plenty of water and eat an iron-rich meal prior to donation.`;
  }

  return "Greetings Hero! JeevaLink connects voluntary blood donors and patients across all 14 districts of Kerala. You can search for donors by blood group, post emergency requests, or call helpline 104 / 1910 anytime!";
}
