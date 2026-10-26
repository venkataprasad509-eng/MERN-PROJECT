/**
 * Lightweight toast notification utility.
 * Uses a simple DOM-based approach – no external library required.
 */

let toastContainer = null;

const getContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const colors = {
  success: { bg: '#10b981', icon: '✓' },
  error: { bg: '#ef4444', icon: '✕' },
  info: { bg: '#3b82f6', icon: 'ℹ' },
  warning: { bg: '#f59e0b', icon: '⚠' },
};

const show = (message, type = 'info', duration = 3500) => {
  const container = getContainer();
  const { bg, icon } = colors[type] || colors.info;

  const el = document.createElement('div');
  el.style.cssText = `
    background: ${bg};
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    max-width: 320px;
    pointer-events: auto;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    cursor: pointer;
  `;
  el.innerHTML = `<span style="font-weight:700;font-size:1rem">${icon}</span><span>${message}</span>`;
  container.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(0)';
  });

  const remove = () => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
  };

  el.addEventListener('click', remove);
  setTimeout(remove, duration);
};

export const toast = {
  success: (msg, d) => show(msg, 'success', d),
  error: (msg, d) => show(msg, 'error', d),
  info: (msg, d) => show(msg, 'info', d),
  warning: (msg, d) => show(msg, 'warning', d),
};
