import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Terms() {
  return (
    <div>
      <section className="hero-gradient py-16">
        <div className="container-wide text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black mb-3">Terms of Service</h1>
            <p className="text-red-200 text-lg">Last Updated: June 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-wide max-w-4xl mx-auto">
          <div className="card p-8 md:p-12 space-y-8 text-gray-600">
            <div>
              <p className="text-lg leading-relaxed mb-8">
                Welcome to JeevaLink. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By creating an account and using JeevaLink, you confirm that you are at least 18 years old and capable of forming a binding contract. If you do not agree to these terms, you must not use our services.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">2. User Accounts</h2>
              <p className="leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">3. Blood Donation and Requests</h2>
              <p className="leading-relaxed">
                JeevaLink acts as a facilitator to connect donors with recipients. We do not guarantee the availability, quality, or safety of any blood donations. All medical procedures and donations should be conducted at certified hospitals or blood banks under medical supervision.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">4. Prohibited Conduct</h2>
              <p className="leading-relaxed">
                You agree not to use the platform for any unlawful purpose, to solicit payment for blood donations, or to provide false medical information. Any violation may result in immediate account suspension.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">5. Limitation of Liability</h2>
              <p className="leading-relaxed">
                JeevaLink is provided "as is" without any warranties. We shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use our platform or from any blood donation activities.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">6. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions or concerns about these Terms, please contact us at <a href="mailto:support@jeevalink.org" className="text-primary font-bold hover:underline">support@jeevalink.org</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
