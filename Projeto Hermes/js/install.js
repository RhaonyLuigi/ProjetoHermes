const Install = {
  prompt: null,
  update() {
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    document.querySelectorAll('[data-install]').forEach(btn => { btn.hidden = !isSecureContext || Boolean(standalone); });
  }
};

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  Install.prompt = event;
  Install.update();
});
window.addEventListener('appinstalled', () => {
  Install.prompt = null;
  Install.update();
});
document.addEventListener('click', async event => {
  if (!event.target.closest('[data-install]')) return;
  if (Install.prompt) {
    const pending = Install.prompt;
    Install.prompt = null;
    await pending.prompt();
    return;
  }
  document.getElementById('install-help').showModal();
});
window.addEventListener('load', () => {
  if (isSecureContext && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
});
