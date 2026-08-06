import { useState } from 'react';
import Modal from './Modal.jsx';
import { useAppStore } from '../store/appStore.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = ['Moderate', 'Immediate', 'Critical', 'Standard'];

export default function EditRequestModal({ isOpen, onClose, request }) {
  const { updateRequest, triggerToast } = useAppStore();

  const [prevRequest, setPrevRequest] = useState(null);
  const [form, setForm] = useState({
    patientName: '',
    bloodGroup: 'B+',
    hospitalName: '',
    city: '',
    unitsRequired: 1,
    urgencyLevel: 'Moderate',
    contactNumber: '',
    status: 'Pending',
  });

  if (request !== prevRequest) {
    setPrevRequest(request);
    if (request) {
      setForm({
        patientName: request.patient_name || request.patientName || '',
        bloodGroup: request.blood_group || request.bloodGroup || 'B+',
        hospitalName: request.hospital_name || request.hospitalName || '',
        city: request.city || request.location || '',
        unitsRequired: request.units_required || request.unitsRequired || 1,
        urgencyLevel: request.urgency_level || request.urgencyLevel || 'Moderate',
        contactNumber: request.contact_number || request.contactNumber || request.contact_phone || '',
        status: request.status || 'Pending',
      });
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) return null;

  const reqId = request.id || request._id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospitalName) {
      triggerToast('Please fill all required fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await updateRequest(reqId, {
      patientName: form.patientName,
      bloodGroup: form.bloodGroup,
      hospitalName: form.hospitalName,
      city: form.city,
      location: form.city,
      unitsRequired: Number(form.unitsRequired),
      urgencyLevel: form.urgencyLevel,
      contactNumber: form.contactNumber,
      status: form.status,
    });
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Blood Request">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Blood Group */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">BLOOD GROUP *</label>
          <select
            value={form.bloodGroup}
            onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
          >
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Hospital Name */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">HOSPITAL NAME *</label>
          <input
            type="text"
            required
            value={form.hospitalName}
            onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Apollo Hospital, Bengaluru"
          />
        </div>

        {/* Row 3: City & Units Required */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CITY</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Bengaluru"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UNITS REQUIRED</label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.unitsRequired}
              onChange={(e) => setForm({ ...form, unitsRequired: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
            />
          </div>
        </div>

        {/* Row 4: Urgency & Contact Number */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URGENCY</label>
            <select
              value={form.urgencyLevel}
              onChange={(e) => setForm({ ...form, urgencyLevel: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {URGENCIES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CONTACT NUMBER</label>
            <input
              type="tel"
              value={form.contactNumber}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="9878787676"
            />
          </div>
        </div>

        {/* Row 5: Request Status */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">REQUEST STATUS</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900 font-bold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="Pending">🟡 Pending (New)</option>
            <option value="Waiting">🔵 Waiting (Accepting Donors)</option>
            <option value="Accepted">🔵 Accepted (Target Reached)</option>
            <option value="Fulfilled">🟢 Fulfilled</option>
            <option value="Cancelled">🔴 Cancelled</option>
            <option value="Expired">🔴 Expired</option>
          </select>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-gray-700 font-semibold rounded-2xl text-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl text-sm shadow-xl shadow-red-200 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
