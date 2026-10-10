(function() {
  // Dark mode feature is only available for accounts that are LOGGED IN
  const htmlEl = document.documentElement;
  const isServerAuth = htmlEl.getAttribute('data-auth') === 'true';
  const hasUserSession = isServerAuth || (htmlEl.getAttribute('data-auth') !== 'false' && !!localStorage.getItem('userEmail'));

  if (!hasUserSession) {
    // If not logged in, enforce light mode and clean any residual theme
    htmlEl.classList.remove('dark');
    localStorage.removeItem('theme');
    return;
  }

  // If logged in, apply the account's saved theme preference
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    htmlEl.classList.add('dark');
  } else {
    htmlEl.classList.remove('dark');
  }
})();
