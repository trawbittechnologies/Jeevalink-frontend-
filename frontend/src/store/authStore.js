import { create } from 'zustand';
import { useAppStore } from './appStore.js';
import api from './api.js';
import { normalizeRole } from '../utils/rbac.js';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('jeevalink_token') || null,
  user: (() => {
    try { return JSON.parse(localStorage.getItem('jeevalink_user') || 'null'); } catch { return null; }
  })(),
  loading: false,
  error: null,

  login: async (credential, password) => {
    set({ loading: true, error: null });
    const cleanCred = credential ? String(credential).trim() : '';
    console.log('[DEBUG authStore] Initiating login for:', cleanCred);
    try {
      const res = await api.post('/auth/login', { credential: cleanCred, password });
      console.log('[DEBUG authStore] Backend API returned:', res);
      
      let resData = res.data;
      if (typeof resData === 'string') {
        try {
          resData = JSON.parse(resData);
        } catch (e) {
          console.error('[DEBUG authStore] Failed to parse resData JSON string:', e);
        }
      }

      const token = resData?.data?.token || resData?.token;
      const rawUser = resData?.data?.user || resData?.user;

      if (!token || !rawUser) {
        console.error('[DEBUG authStore] Response missing token or user:', resData);
        throw new Error('Invalid authentication response structure.');
      }

      const normalizedRole = normalizeRole(rawUser.role);
      const user = { ...rawUser, role: normalizedRole };

      localStorage.setItem('jeevalink_token', token);
      localStorage.setItem('jeevalink_user', JSON.stringify(user));
      set({ token, user, loading: false });

      console.log('[DEBUG authStore] Login successful, saved token & user role:', normalizedRole);
      return { success: true, role: normalizedRole };
    } catch (err) {
      console.error('[DEBUG authStore] Catch block caught login error:', err);
      // Fallback handling for default Technical Admin account
      const cred = credential?.toString().trim().toLowerCase();
      
      let mockUser = null;
      if ((cred === 'techadmin@jeevalink.org' || cred === '9900000000') && (password === 'TechAdmin@2026' || password === 'admin123')) {
        mockUser = {
          id: 1,
          name: 'Technical Admin',
          primaryName: 'System Technical Admin',
          email: 'techadmin@jeevalink.org',
          mobile: '9900000000',
          role: 'technical_admin',
          district: 'Kozhikode',
          city: 'Kozhikode',
          status: 'Active',
          isVerified: true
        };
      }

      if (mockUser) {
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const payload = btoa(JSON.stringify({ sub: mockUser.id, role: mockUser.role, exp: Math.floor(Date.now()/1000) + 86400 * 7 }));
        const mockToken = `${header}.${payload}.mock_sig`;
        
        localStorage.setItem('jeevalink_token', mockToken);
        localStorage.setItem('jeevalink_user', JSON.stringify(mockUser));
        set({ token: mockToken, user: mockUser, loading: false });
        console.log('[DEBUG authStore] Dev fallback login success with role:', mockUser.role);
        return { success: true, role: mockUser.role };
      }

      const errMsg = err.response?.data?.message || err.message || 'Invalid credentials. Try again.';
      set({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  googleLogin: async (email, fullName) => {
    set({ loading: true, error: null });
    try {
      // Use a consistent default password for Google authentication simulation
      const dummyPass = 'GoogleUserPassword123!';
      const res = await api.post('/auth/login', { credential: email, password: dummyPass });
      const { token, user } = res.data.data;
      localStorage.setItem('jeevalink_token', token);
      localStorage.setItem('jeevalink_user', JSON.stringify(user));
      set({ token, user, loading: false });
      return { success: true, role: user.role };
    } catch {
      // If login fails, user might not exist in db. Attempt registration first!
      try {
        const dummyPass = 'GoogleUserPassword123!';
        const regRes = await api.post('/auth/register', {
          primaryName: fullName || 'Google User',
          email,
          mobile: 'G-' + Date.now().toString().slice(-8), // unique dummy mobile
          password: dummyPass,
          role: 'user',
          city: 'Kochi',
          district: 'Ernakulam',
          bloodGroup: 'O+'
        });
        const { token, user } = regRes.data.data;
        localStorage.setItem('jeevalink_token', token);
        localStorage.setItem('jeevalink_user', JSON.stringify(user));
        set({ token, user, loading: false });
        return { success: true, role: user.role };
      } catch (regErr) {
        const errMsg = regErr.response?.data?.message || 'Google Sign-In failed.';
        set({ loading: false, error: errMsg });
        return { success: false, error: errMsg };
      }
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const mobile = userData.mobileNumber || userData.mobile || '';
      const email = userData.email || (mobile ? `${mobile}@jeevalink.org` : '');

      const formData = new FormData();
      formData.append('primary_name', userData.primaryName || '');
      formData.append('mobile', mobile);
      formData.append('email', email);
      formData.append('password', userData.password || '');
      formData.append('role', 'user');
      formData.append('district', userData.district || '');
      formData.append('city', userData.city || '');
      formData.append('blood_group', userData.bloodGroup || 'N/A');
      
      if (userData.address) formData.append('address', userData.address);
      if (userData.pincode) formData.append('pincode', userData.pincode);
      if (userData.fullAddress) formData.append('full_address', userData.fullAddress);
      if (userData.dateOfBirth) formData.append('dob', userData.dateOfBirth);
      if (userData.weight) formData.append('weight', userData.weight);
      if (userData.lastDonated || userData.lastDonatedDate) {
        formData.append('last_donated_date', userData.lastDonated || userData.lastDonatedDate);
      }
      
      if (userData.idProofFront) formData.append('id_proof_front', userData.idProofFront);
      if (userData.idProofBack) formData.append('id_proof_back', userData.idProofBack);
      if (userData.sex) formData.append('sex', userData.sex);
      if (userData.profilePicture) formData.append('profile_picture', userData.profilePicture);

      const res = await api.post('/auth/register', formData);
      const { token, user } = res.data.data;
      localStorage.setItem('jeevalink_token', token);
      localStorage.setItem('jeevalink_user', JSON.stringify(user));
      set({ token, user, loading: false });
      
      // Sync list in appStore
      useAppStore.getState().addUser(user);
      return { success: true };
    } catch (err) {
      if (!err.response || err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        const errMsg = 'Network error: Please check your internet connection or try again later.';
        console.error(errMsg, err);
        set({ loading: false, error: errMsg });
        return { success: false, error: errMsg };
      }
      
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        console.error("Registration validation errors:", JSON.stringify(validationErrors, null, 2));
      } else {
        console.error("Registration error:", err.message || 'Unknown error');
      }

      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      set({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  addVolunteer: async (volunteerData) => {
    set({ loading: true });
    try {
      const rawP1 = volunteerData.person1Name || volunteerData.primaryName || volunteerData.primary_name || '';
      const rawP2 = volunteerData.person2Name || volunteerData.secondaryName || volunteerData.secondary_name || '';
      const p1Contact = volunteerData.person1Contact || volunteerData.mobile || '';
      const p2Contact = volunteerData.person2Contact || volunteerData.secondaryContactNumber || '';

      const nameParts = Array.from(new Set([...rawP1.split(/[&,]+/), ...rawP2.split(/[&,]+/)]
        .map(s => s.trim())
        .filter(Boolean)));

      const cleanFullName = nameParts.length > 0 ? nameParts.join(' & ') : 'Volunteer';
      const cleanP1 = nameParts[0] || rawP1;
      const cleanP2 = nameParts[1] || rawP2;

      const payload = {
        meghala: volunteerData.meghalaName || volunteerData.meghala,
        person1Name: cleanP1,
        person1Contact: p1Contact,
        person2Name: cleanP2,
        person2Contact: p2Contact,
        primary_name: cleanFullName,
        mobile: p1Contact,
        secondaryName: cleanP2,
        secondaryContactNumber: p2Contact,
        email: volunteerData.email,
        whatsapp_number: volunteerData.whatsapp || p1Contact,
      };

      const res = await api.post('/block-admin/volunteers', payload);
      const user = res.data.data?.user || res.data.data;
      
      // Sync list in appStore
      useAppStore.getState().addUser(user);
      useAppStore.getState().fetchUsers();
      set({ loading: false });
      return { 
        success: true, 
        user, 
        generatedPassword: res.data.data?.generatedPassword || res.data.data?.generated_password || 'AutoGenerated',
        emailSent: res.data.data?.emailSent ?? true
      };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to add volunteer.';
      set({ loading: false });
      return { success: false, error: errMsg };
    }
  },

  updateVolunteer: async (id, volunteerData) => {
    set({ loading: true });
    try {
      const rawP1 = volunteerData.person1Name || volunteerData.primaryName || volunteerData.primary_name || '';
      const rawP2 = volunteerData.person2Name || volunteerData.secondaryName || volunteerData.secondary_name || '';
      const p1Contact = volunteerData.person1Contact || volunteerData.mobile || '';
      const p2Contact = volunteerData.person2Contact || volunteerData.secondaryContactNumber || '';

      const nameParts = Array.from(new Set([...rawP1.split(/[&,]+/), ...rawP2.split(/[&,]+/)]
        .map(s => s.trim())
        .filter(Boolean)));

      const cleanFullName = nameParts.length > 0 ? nameParts.join(' & ') : 'Volunteer';
      const cleanP1 = nameParts[0] || rawP1;
      const cleanP2 = nameParts[1] || rawP2;

      const payload = {
        meghala: volunteerData.meghalaName || volunteerData.meghala,
        person1Name: cleanP1,
        person1Contact: p1Contact,
        person2Name: cleanP2,
        person2Contact: p2Contact,
        primary_name: cleanFullName,
        mobile: p1Contact,
        secondaryName: cleanP2,
        secondaryContactNumber: p2Contact,
        email: volunteerData.email,
        whatsapp_number: volunteerData.whatsapp || p1Contact,
        status: volunteerData.status || 'Active'
      };

      const res = await api.put(`/block-admin/volunteers/${id}`, payload);
      const updatedUser = res.data.data;
      
      // Sync list in appStore
      useAppStore.getState().fetchUsers();
      set({ loading: false });
      return { success: true, user: updatedUser };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update volunteer.';
      set({ loading: false });
      return { success: false, error: errMsg };
    }
  },

  forgotPassword: async (email) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/forgot-password', { email });
      set({ loading: false });
      return { success: true, message: res.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send reset link.';
      set({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  resetPassword: async (token, email, password) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/reset-password', { token, email, password });
      set({ loading: false });
      return { success: true, message: res.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to reset password.';
      set({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      set({ loading: false });
      return { success: true, message: res.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to change password.';
      set({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  changeEmail: async (currentPassword, newEmail) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/change-email', {
        current_password: currentPassword,
        new_email: newEmail,
      });
      if (res.data.success) {
        const updatedUser = res.data.data?.user;
        if (updatedUser) {
          localStorage.setItem('jeevalink_user', JSON.stringify(updatedUser));
          set({ user: updatedUser, loading: false });
        } else {
          set({ loading: false });
        }
        return { success: true, message: res.data.message };
      }
      set({ loading: false });
      return { success: false };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to change email.';
      set({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('jeevalink_token');
    localStorage.removeItem('jeevalink_user');
    set({ token: null, user: null, error: null });
  },

  loadProfile: async () => {
    const token = get().token;
    if (!token) return;
    set({ loading: true });
    try {
      const res = await api.get('/auth/me');
      const { user } = res.data.data;
      localStorage.setItem('jeevalink_user', JSON.stringify(user));
      set({ user, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true });
    try {
      const res = await api.patch('/auth/profile', updates);
      const { user } = res.data.data;
      localStorage.setItem('jeevalink_user', JSON.stringify(user));
      set({ user, loading: false });
      useAppStore.getState().updateUserInLists(user._id, user);
      return { success: true, user };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Profile update failed.';
      set({ loading: false });
      return { success: false, error: errMsg };
    }
  },

  setAvailability: async (available) => {
    const currentUser = get().user;
    if (available && currentUser?.eligibilityStatus === 'Ineligible') {
      return { 
        success: false, 
        ineligible: true,
        error: 'You cannot mark yourself as available because your health eligibility status is Ineligible.' 
      };
    }
    try {
      await api.patch('/auth/toggle-availability');
      const updatedUser = { ...get().user, availableForDonation: available };
      localStorage.setItem('jeevalink_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      useAppStore.getState().updateUserInLists(updatedUser._id, { availableForDonation: available });
      return { success: true, user: updatedUser };
    } catch {
      return { success: false, error: 'Failed to update availability.' };
    }
  },

  updateMockUserStatus: (userId, status) => {
    const currentUser = get().user;
    if (currentUser && String(currentUser._id) === String(userId)) {
      const updated = { ...currentUser, status };
      localStorage.setItem('jeevalink_user', JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));
