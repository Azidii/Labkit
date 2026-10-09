document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      const email = document.getElementById("email")?.value.trim();
      if (email) {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", email.split("@")[0]);
      }
    });
  }
});
