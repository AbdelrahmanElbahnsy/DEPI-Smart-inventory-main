import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18, delay: 0.05 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 22, stiffness: 350, mass: 0.6 },
  },
  exit: {
    opacity: 0,
    scale: 0.88,
    y: 12,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

const iconVariants = {
  hidden: { rotate: 0 },
  visible: {
    rotate: [0, -8, 8, -4, 4, 0],
    transition: { delay: 0.2, duration: 0.5, ease: 'easeInOut' },
  },
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const variantClass = variant === 'warning' ? 'confirm-warning' : 'confirm-danger';

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay confirm-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onCancel}
        >
          <motion.div
            className={`modal confirm-modal ${variantClass}`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="confirm-modal-icon"
              variants={iconVariants}
              initial="hidden"
              animate="visible"
            >
              <AlertTriangle size={28} />
            </motion.div>
            <h3 className="confirm-modal-title">{title}</h3>
            <p className="confirm-modal-message">{message}</p>
            <div className="confirm-modal-actions">
              <button className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button
                className={`btn ${variant === 'warning' ? 'btn-warning-solid' : 'btn-danger-solid'}`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
            <button className="modal-close confirm-close" onClick={onCancel}>
              <X size={16} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
