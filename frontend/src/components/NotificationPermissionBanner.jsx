import React, { useState, useEffect } from 'react';
import { BellRing, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { requestNotificationPermission, removeNotificationToken } from '../services/firebaseMessaging';

const STATUS_STATES = {
  UNSUPPORTED: 'unsupported',
  NOT_REQUESTED: 'permission_not_requested',
  GRANTED: 'permission_granted',
  DENIED: 'permission_denied',
  TOKEN_FAILED: 'token_generation_failed',
  SW_FAILED: 'service_worker_failed',
  SAVE_FAILED: 'token_save_failed',
  LOADING: 'loading'
};

export default function NotificationPermissionBanner({ onPermissionGranted }) {
  const [status, setStatus] = useState(STATUS_STATES.LOADING);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus(STATUS_STATES.UNSUPPORTED);
      return;
    }

    if (Notification.permission === 'granted') {
      setStatus(STATUS_STATES.GRANTED);
    } else if (Notification.permission === 'denied') {
      setStatus(STATUS_STATES.DENIED);
    } else {
      setStatus(STATUS_STATES.NOT_REQUESTED);
    }
  };

  const handleEnableNotifications = async () => {
    setStatus(STATUS_STATES.LOADING);
    setErrorMsg('');
    
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setStatus(STATUS_STATES.GRANTED);
        if (onPermissionGranted) {
          onPermissionGranted(token);
        }
      } else {
        // If no token but permission not denied, token generation failed
        if (Notification.permission === 'denied') {
          setStatus(STATUS_STATES.DENIED);
        } else {
          setStatus(STATUS_STATES.TOKEN_FAILED);
          setErrorMsg('Could not generate notification token.');
        }
      }
    } catch (err) {
      console.error(err);
      if (err.message?.includes('service worker')) {
        setStatus(STATUS_STATES.SW_FAILED);
      } else if (err.response) {
        setStatus(STATUS_STATES.SAVE_FAILED);
      } else {
        setStatus(STATUS_STATES.TOKEN_FAILED);
      }
      setErrorMsg(err.message || 'An unknown error occurred.');
    }
  };

  if (status === STATUS_STATES.GRANTED) {
    return null; // Don't show banner if already granted
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
        <BellRing className="w-5 h-5 text-blue-600" />
      </div>
      
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-blue-900">Enable Notifications</h3>
        <p className="text-sm text-blue-700 mt-1">
          {status === STATUS_STATES.UNSUPPORTED && "Your browser doesn't support push notifications."}
          {status === STATUS_STATES.DENIED && "Notifications are blocked. Please enable them in your browser settings."}
          {(status === STATUS_STATES.NOT_REQUESTED || status === STATUS_STATES.LOADING) && "Get notified when an urgent blood request matches your blood group."}
          {status === STATUS_STATES.TOKEN_FAILED && `Failed to setup notifications: ${errorMsg}`}
          {status === STATUS_STATES.SW_FAILED && `Service worker error: ${errorMsg}`}
          {status === STATUS_STATES.SAVE_FAILED && `Failed to save token to server: ${errorMsg}`}
        </p>
      </div>

      <div className="shrink-0">
        {(status === STATUS_STATES.NOT_REQUESTED || status === STATUS_STATES.TOKEN_FAILED || status === STATUS_STATES.SW_FAILED || status === STATUS_STATES.SAVE_FAILED) && (
          <button
            onClick={handleEnableNotifications}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Enable
          </button>
        )}
        
        {status === STATUS_STATES.LOADING && (
          <button disabled className="px-4 py-2 bg-blue-400 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Enabling...
          </button>
        )}

        {status === STATUS_STATES.DENIED && (
          <div className="px-4 py-2 bg-slate-200 text-slate-500 text-sm font-semibold rounded-xl flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Blocked
          </div>
        )}
      </div>
    </div>
  );
}
