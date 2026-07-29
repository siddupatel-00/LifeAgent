// Global Modal Stack & Body Scroll Manager for React Portal Modals
let openModalsCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';
const activeModalStack = [];

export function registerModal(modalId, onCloseCallback) {
  // Add to stack
  activeModalStack.push({ id: modalId, onClose: onCloseCallback });
  openModalsCount++;

  if (openModalsCount === 1) {
    // Save original styles
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;

    // Measure scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
}

export function unregisterModal(modalId) {
  const index = activeModalStack.findIndex((m) => m.id === modalId);
  if (index !== -1) {
    activeModalStack.splice(index, 1);
  }

  openModalsCount = Math.max(0, openModalsCount - 1);

  if (openModalsCount === 0) {
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
  }
}

export function updateModalCallback(modalId, newOnCloseCallback) {
  const modal = activeModalStack.find((m) => m.id === modalId);
  if (modal) {
    modal.onClose = newOnCloseCallback;
  }
}

// Global keydown listener for Escape key (attached once)
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeModalStack.length > 0) {
      const topModal = activeModalStack[activeModalStack.length - 1];
      if (topModal && typeof topModal.onClose === 'function') {
        e.preventDefault();
        topModal.onClose();
      }
    }
  });
}
