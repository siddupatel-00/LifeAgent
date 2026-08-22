import Modal from './Modal';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: 'blue-btn' | 'contrast-btn' | 'secondary-btn';
  isLoading?: boolean;
  icon?: 'warning' | 'danger' | 'info';
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  confirmClass = 'contrast-btn',
  isLoading = false,
  icon = 'warning'
}: ConfirmModalProps) {
  const Icon = icon === 'danger' ? AlertTriangle : icon === 'info' ? CheckCircle2 : AlertTriangle;
  const iconColor = icon === 'danger' ? 'var(--orange)' : icon === 'info' ? 'var(--accent-blue)' : 'var(--accent-orange)';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="confirm-modal">
        <div className="confirm-icon" style={{ color: iconColor }}>
          <Icon size={32} />
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button onClick={onClose} className="secondary-btn" disabled={isLoading}>
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`${confirmClass} ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}