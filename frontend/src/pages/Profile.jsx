import { useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Edit3, History, QrCode, LogOut, Calendar, Award, Scale, Loader2, Copy, CheckCheck, BadgeCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getStorageUrl } from '../store/api.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const donationHistory = [];

export default function Profile() {
  const { user, updateProfile, logout } = useAuthStore();
  const { triggerToast } = useAppStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('edit');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const handleCopyEmployeeId = () => {
    const id = user?.jeevalink_id;
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    }).catch(() => {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea');
      el.value = id;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    });
  };

  const { register, handleSubmit } = useForm({
    defaultValues: {
      primaryName: user?.primaryName || '',
      secondaryName: user?.secondaryName || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
      secondaryContactNumber: user?.secondaryContactNumber || '',
      district: user?.district || '',
      city: user?.city || '',
      bloodGroup: user?.bloodGroup || 'B+',
      weight: user?.weight || 70,
      lastDonated: user?.lastDonated || '',
      address: user?.address || '',
      sex: user?.sex || '',
      dob: user?.dob || '',
      pincode: user?.pincode || '',
    }
  });

  const onSubmit = async (data) => {
    setIsSaving(true);
    const payload = {
      ...data,
      secondary_name: data.secondaryName,
      secondary_phone: data.secondaryContactNumber
    };
    const res = await updateProfile(payload);
    setIsSaving(false);
    if (res.success) triggerToast('Profile updated successfully!', 'success');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      triggerToast('File is too large. Max size is 1MB.', 'warning');
      return;
    }

    setIsUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      const res = await updateProfile({ profilePicture: base64Data });
      setIsUploadingPhoto(false);
      if (res.success) {
        triggerToast('Profile photo updated successfully!', 'success');
      } else {
        triggerToast('Failed to update photo.', 'error');
      }
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      triggerToast('Error reading file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const qrData = JSON.stringify({ n: user?.primaryName, b: user?.bloodGroup, p: user?.mobile, c: user?.city, v: 'JeevaLink' });

  const handleDownload = () => {
    const svgEl = document.querySelector('.qr-container svg');
    if (!svgEl) {
      triggerToast('Unable to find QR Code element.', 'error');
      return;
    }

    try {
      const svgString = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 380;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');

        // Draw background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 500);
        grad.addColorStop(0, '#111827'); // gray-900
        grad.addColorStop(1, '#030712'); // gray-950
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 380, 500);

        // Draw card accent bar
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(20, 20, 340, 4);

        // Draw Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('JEEVALINK DONOR PASSPORT', 190, 55);

        // Draw QR code background card
        ctx.fillStyle = '#ffffff';
        const qrSize = 180;
        const qrX = 100;
        const qrY = 85;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(qrX, qrY, qrSize, qrSize, 20);
        } else {
          ctx.rect(qrX, qrY, qrSize, qrSize);
        }
        ctx.fill();

        // Draw the QR code image
        ctx.drawImage(image, qrX + 20, qrY + 20, qrSize - 40, qrSize - 40);

        // Draw User Details
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.fillText(user?.primaryName || 'Blood Donor', 190, 305);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '500 13px system-ui, sans-serif';
        ctx.fillText(`${user?.city || 'Bengaluru'}, ${user?.district || 'Bengaluru Urban'}`, 190, 328);

        // Draw bottom stats separator
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, 360);
        ctx.lineTo(350, 360);
        ctx.stroke();

        // Columns info
        ctx.textAlign = 'left';
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.fillText('BLOOD GROUP', 40, 390);
        ctx.fillStyle = '#dc2626';
        ctx.font = '900 24px system-ui, sans-serif';
        ctx.fillText(user?.bloodGroup || 'B+', 40, 425);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.fillText('DONATIONS', 190, 390);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px system-ui, sans-serif';
        ctx.fillText((user?.totalDonations ?? 0).toString(), 190, 425);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.fillText('STATUS', 340, 390);
        ctx.fillStyle = user?.availableForDonation ? '#4ade80' : '#fbbf24';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText(user?.availableForDonation ? '● Available' : '○ Busy', 340, 418);

        // Draw footer brand tag
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4b5563';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.fillText('SAVING LIVES EVERY DAY WITH JEEVALINK', 190, 470);

        // Download output trigger
        const dataURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataURL;
        downloadLink.download = `${(user?.primaryName || 'donor').toLowerCase().replace(/\s+/g, '_')}_passport.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobURL);
        triggerToast('Donor Passport downloaded successfully!', 'success');
      };
      image.src = blobURL;
    } catch (err) {
      console.error(err);
      triggerToast('Download failed. Please try again.', 'error');
    }
  };

  const isUserRole = user?.role === 'user';

  const allTabs = [
    { id: 'edit', label: 'Edit Profile', icon: Edit3 },
    { id: 'card', label: 'QR Passport', icon: QrCode },
    { id: 'history', label: 'History', icon: History },
  ];
  const tabs = isUserRole ? allTabs : [allTabs[0]];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {isUserRole ? 'User Profile' : 
             user?.role === 'volunteer' ? 'Volunteer Profile' : 
             user?.role === 'super_admin' ? 'Super Admin Profile' : 
             user?.role === 'technical_admin' ? 'Technical Admin Profile' : 
             'Admin Profile'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account information and credentials</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 border border-red-100 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Profile overview card */}
      <div className="card p-5 flex items-center gap-4">
        <div className="relative group w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-lg shadow-red-200 border border-slate-100 bg-slate-50 flex items-center justify-center">
          {isUploadingPhoto && (
            <div className="absolute inset-0 bg-slate-100/80 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
          {user?.profilePicture ? (
            <img src={getStorageUrl(user.profilePicture)} alt="Avatar" className={`w-full h-full object-cover ${isUploadingPhoto ? 'opacity-50' : ''}`} />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br from-primary to-red-700 flex items-center justify-center text-white font-black text-2xl ${isUploadingPhoto ? 'opacity-50' : ''}`}>
              {user?.primaryName?.[0]}
            </div>
          )}
          <label htmlFor="avatar-file-top" className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-black uppercase z-20">
            Edit
          </label>
          <input
            type="file"
            id="avatar-file-top"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            disabled={isUploadingPhoto}
          />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="mb-1">
            <h3 className="text-lg font-black text-gray-900">
              {user?.primaryName}
              {user?.secondaryName && (!user?.primaryName || !user.primaryName.toLowerCase().includes(user.secondaryName.toLowerCase())) && ` & ${user.secondaryName}`}
            </h3>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              {user?.mobile}
              {user?.secondaryContactNumber && ` | ${user.secondaryContactNumber}`}
            </p>
          </div>
          {(user?.jeevalink_id || user?.employee_id) && (
            <div className="flex items-center gap-2 mt-1 mb-0.5">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-lg px-2.5 py-1">
                <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-black text-primary tracking-wide font-mono">
                  {user.jeevalink_id || user.employee_id}
                </span>
              </div>
              <button
                onClick={handleCopyEmployeeId}
                title="Copy Employee ID"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer border"
                style={idCopied
                  ? { color: '#059669', background: '#ecfdf5', borderColor: '#a7f3d0' }
                  : { color: '#64748b', background: '#f8fafc', borderColor: '#e2e8f0' }}
              >
                {idCopied
                  ? <><CheckCheck className="w-3 h-3" /> Copied!</>
                  : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
          )}
          <p className="text-sm text-gray-500">{user?.city ? `${user.city}, ${user.district}` : user?.district || 'System Role'}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {isUserRole ? (
              <>
                <span className="text-xs font-black text-primary bg-red-50 px-2.5 py-1 rounded-xl border border-red-100">{user?.bloodGroup || 'N/A'}</span>
                <span className="text-xs text-gray-500 font-semibold">{user?.totalDonations || 0} donations</span>
                <span className="text-xs text-amber-600 font-semibold flex items-center gap-1"><Award className="w-3 h-3" />{user?.rewardPoints || 0} pts</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                  user?.eligibilityStatus === 'Eligible'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : user?.eligibilityStatus === 'Ineligible'
                    ? 'text-red-700 bg-red-50 border-red-100'
                    : 'text-gray-650 bg-slate-50 border-slate-200'
                }`}>
                  {user?.eligibilityStatus || 'Pending Check'}
                </span>
              </>
            ) : (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border uppercase ${
                user?.role === 'volunteer' ? 'text-purple-700 bg-purple-50 border-purple-100' :
                user?.role === 'super_admin' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                user?.role === 'technical_admin' ? 'text-red-700 bg-red-50 border-red-100' :
                'text-blue-700 bg-blue-50 border-blue-100'
              }`}>
                {(user?.role || 'Admin').replace('_', ' ')} Role
              </span>
            )}
          </div>
        </div>
        {isUserRole && (
          <div className="ml-auto shrink-0 hidden sm:flex items-center gap-3">
            <div className="text-center">
              <p className="text-2xl font-black text-gray-900">{user?.livesSaved ?? 0}</p>
              <p className="text-[10px] text-gray-400 font-semibold">Lives Saved</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      )}

      {/* Tab: Edit Profile */}
      {tab === 'edit' && (
        <div className="card p-6 text-left">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Explicit Photo Upload Option in Edit Profile */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200/50 rounded-2xl mb-4">
              <div className="relative group w-16 h-16 rounded-2xl overflow-hidden shadow-md border border-white shrink-0 flex items-center justify-center bg-slate-200">
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-slate-100/80 flex items-center justify-center z-10 backdrop-blur-[1px]">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                )}
                {user?.profilePicture ? (
                  <img src={getStorageUrl(user.profilePicture)} alt="Avatar" className={`w-full h-full object-cover ${isUploadingPhoto ? 'opacity-50' : ''}`} />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br from-primary to-red-700 flex items-center justify-center text-white font-black text-2xl ${isUploadingPhoto ? 'opacity-50' : ''}`}>
                    {user?.primaryName?.[0]}
                  </div>
                )}
                <label htmlFor="avatar-file-form" className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-[9px] font-bold uppercase z-20">
                  Change
                </label>
                <input
                  type="file"
                  id="avatar-file-form"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploadingPhoto}
                />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
                <h4 className="text-xs font-bold text-gray-800">Profile Picture</h4>
                <p className="text-[10px] text-gray-400">Click to upload a square JPEG or PNG image (max 1MB).</p>
                <label htmlFor="avatar-file-form-btn" className={`inline-block px-3 py-1.5 bg-white border border-slate-200 text-gray-700 hover:bg-slate-50 rounded-xl text-[10px] font-bold cursor-pointer transition-colors shadow-sm mt-1 ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isUploadingPhoto ? 'Uploading...' : 'Choose Image File'}
                </label>
                <input
                  type="file"
                  id="avatar-file-form-btn"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploadingPhoto}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Primary Name</label>
                <input type="text" {...register('primaryName', { required: true })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
              </div>
              {!isUserRole && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Secondary Name</label>
                  <input type="text" {...register('secondaryName')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address</label>
                <input type="email" {...register('email')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mobile Number (Primary)</label>
                <input type="tel" {...register('mobile')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
              </div>
              {!isUserRole && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Secondary Number</label>
                  <input type="tel" {...register('secondaryContactNumber')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
                </div>
              )}
              
              {isUserRole && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Blood Group</label>
                  <select {...register('bloodGroup')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900">
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              )}

              {isUserRole && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Sex / Gender</label>
                  <select {...register('sex')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900">
                    <option value="">Select Sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="transgender">Transgender</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">City / Place</label>
                <input type="text" {...register('city')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">District</label>
                <input type="text" {...register('district')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Pincode</label>
                <input type="text" {...register('pincode')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
              </div>

              {isUserRole && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date of Birth
                    </label>
                    <input type="date" {...register('dob')}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Weight (kg)
                    </label>
                    <input type="number" {...register('weight')}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Last Donated
                    </label>
                    <input type="date" {...register('lastDonated')}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
                  </div>
                </>
              )}
            </div>
            <button type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-xl shadow-red-200 transition-all text-sm mt-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Tab: QR Passport */}
      {tab === 'card' && (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-full max-w-sm bg-gradient-to-b from-gray-900 to-gray-950 text-white rounded-3xl p-7 shadow-2xl text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-red-900/30 px-3 py-1.5 rounded-full border border-red-800/30">
              JeevaLink Donor Passport
            </span>
            <div className="bg-white p-4 rounded-2xl inline-block mt-6 mb-4 shadow-lg qr-container">
              <QRCodeSVG value={qrData} size={140} fgColor="#111111" bgColor="#ffffff" level="M" />
            </div>
            <h3 className="font-bold text-lg">{user?.primaryName}</h3>
            {user?.jeevalink_id && (
              <p className="text-sm font-black text-primary tracking-wider mt-0.5">{user.jeevalink_id}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">{user?.city}, {user?.district}</p>
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-800 text-left">
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase">Group</p>
                <p className="text-xl font-black text-primary mt-0.5">{user?.bloodGroup}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase">Donations</p>
                <p className="text-xl font-black mt-0.5">{user?.totalDonations}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase">Status</p>
                <p className={`text-sm font-bold mt-1 ${user?.availableForDonation ? 'text-green-400' : 'text-amber-400'}`}>
                  {user?.availableForDonation ? '● Available' : '○ Busy'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="w-full max-w-sm py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl shadow-red-200 transition-all text-sm cursor-pointer"
          >
            Download Passport PNG
          </button>
        </div>
      )}

      {/* Tab: History */}
      {tab === 'history' && (
        <div className="space-y-3">
          {donationHistory.map((item, i) => (
            <div key={i} className="card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-900">{item.hospital}</p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full mt-2 inline-block">{item.status}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Reward</p>
                <p className="text-sm font-black text-amber-500">+{item.points} pts</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
