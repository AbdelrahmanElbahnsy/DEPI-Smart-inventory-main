import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for async confirmation modals.
 * Returns { confirm, ConfirmDialog } — call confirm() to show,
 * it returns a Promise<boolean>.
 */
export const useConfirm = () => {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    variant: 'danger', // 'danger' | 'warning'
  });

  const resolveRef = useRef(null);

  const confirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure?',
    confirmText = 'Delete',
    variant = 'danger',
  } = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ isOpen: true, title, message, confirmText, variant });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    resolveRef.current?.(true);
  }, []);

  const handleCancel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    resolveRef.current?.(false);
  }, []);

  return {
    confirm,
    confirmState: state,
    handleConfirm,
    handleCancel,
  };
};
