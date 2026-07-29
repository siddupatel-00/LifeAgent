import React, { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {(toasts || []).map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`toast toast-${toast.type}`}
      onClick={onDismiss}
      role="alert"
    >
      <div className="toast-icon">
        {isSuccess ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      </div>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}
