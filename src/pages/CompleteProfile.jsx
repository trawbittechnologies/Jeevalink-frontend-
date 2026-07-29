import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { motion } from 'framer-motion';
import { UserCheck, Save } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function CompleteProfile() {
  const { user, updateProfile } = useAuthStore();
  const { triggerToast } = useAppStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [city, setCity] = useState(user?.city || '');
  const [district, setDistrict] = useState(user?.district || '');

  // Check if profile is already complete
  const isNonDonorRole = ['technical_admin', 'super_admin', 'admin', 'volunteer', 'unit_squad', 'hospital'].includes(user?.role);
  
  const isComplete = () => {
    if (!user) return false;
    if (isNonDonorRole) return true;
    const basicComplete = !!(user.city && user.district);
    return basicComplete && !!user.bloodGroup && user.bloodGroup !== 'N/A';
  };

  if (!user) return <Navigate to="/login" replace />;
  if (isComplete()) {
    const redirect =
      user.role === 'technical_admin' ? '/technical-admin' :
      user.role === 'super_admin' ? '/super-admin' :
      user.role === 'admin' ? '/admin/dashboard' :
      user.role === 'volunteer' ? '/volunteer/dashboard' :
      user.role === 'unit_squad' ? '/volunteer/users' :
      user.role === 'hospital' ? '/hospital/dashboard' :
      '/donor/dashboard';
    return <Navigate to={redirect} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!city || !district) {
      triggerToast('City and District are required.', 'warning');
      return;
    }

    if (!isVolunteer && !isHospitalOrAdmin && (!bloodGroup || bloodGroup === 'N/A')) {
      triggerToast('Blood Group is required for donors.', 'warning');
      return;
    }

    setLoading(true);
    const updates = { city, district };
    if (!isVolunteer && !isHospitalOrAdmin) {
      updates.bloodGroup = bloodGroup;
    }

    const res = await updateProfile(updates);
    setLoading(false);
    if (res.success) {
      triggerToast('Profile completed successfully!', 'success');
      const redirect =
        user.role === 'admin' ? '/admin/dashboard' :
        user.role === 'volunteer' ? '/volunteer/dashboard' :
        user.role === 'hospital' ? '/hospital/dashboard' :
        '/donor/dashboard';
      navigate(redirect);
    } else {
      triggerToast(res.error || 'Failed to update profile.', 'error');
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full p-8"
      >
        <div className="w-16 h-16 bg-red-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <UserCheck className="w-8 h-8" />
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Complete Profile</h2>
          <p className="text-sm text-gray-500">Please provide the missing details to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isVolunteer && !isHospitalOrAdmin && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Blood Group *</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bg)}
                    className={`py-2 rounded-xl text-sm font-bold border transition-colors ${
                      bloodGroup === bg 
                        ? 'bg-primary border-primary text-white shadow-md shadow-red-200' 
                        : 'bg-white border-slate-200 text-gray-700 hover:border-red-200'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">City *</label>
            <input 
              type="text" 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20" 
              placeholder="E.g., Kochi" 
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">District *</label>
            <input 
              type="text" 
              value={district} 
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20" 
              placeholder="E.g., Ernakulam" 
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Saving...' : <><Save className="w-5 h-5" /> Save & Continue</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
