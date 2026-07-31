import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Privacy() {
  return (
    <div>
      <section className="hero-gradient py-16">
        <div className="container-wide text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black mb-3">Privacy Policy</h1>
            <p className="text-red-200 text-lg">Last Updated: June 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-wide max-w-4xl mx-auto">
          <div className="card p-8 md:p-12 space-y-8 text-gray-600">
            <div>
              <p className="text-lg leading-relaxed mb-8">
                Welcome to JeevaLink. Your privacy is critically important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our web application and services.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">1. Information We Collect</h2>
              <p className="leading-relaxed">
                We collect personal information that you provide to us directly, such as your name, mobile number, email address, blood group, date of birth, and government ID proof. We also collect location data to match donors with nearby emergencies efficiently.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">2. How We Use Your Information</h2>
              <p className="leading-relaxed">
                The primary purpose of collecting your data is to facilitate blood donation requests. Your location and blood group are used to notify you of nearby requests. Your contact information is shared with recipients or hospitals only when a match is confirmed or a request is accepted.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">3. Data Protection and Security</h2>
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your personal data and government ID proofs. We do not sell your personal information to third parties.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">4. Location Services</h2>
              <p className="leading-relaxed">
                JeevaLink requires access to your device's location to function correctly. You can enable or disable location tracking at any time through your browser or device settings, although disabling it may limit your ability to receive local donation alerts.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">5. Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">6. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions or concerns about this Privacy Policy, please contact us at <a href="mailto:support@jeevalink.org" className="text-primary font-bold hover:underline">support@jeevalink.org</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
