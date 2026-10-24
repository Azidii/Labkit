(function() {
  const htmlEl = document.documentElement;
  const urlParams = new URLSearchParams(window.location.search);
  const paramTheme = urlParams.get('theme');

  if (paramTheme === 'dark') {
    htmlEl.classList.add('dark');
    return;
  }
  if (paramTheme === 'light') {
    htmlEl.classList.remove('dark');
    return;
  }

  // Dark mode feature is only available for accounts that are LOGGED IN
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
