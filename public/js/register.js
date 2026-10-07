document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      const p1 = document.getElementById("password")?.value;
      const p2 = document.getElementById("confirmPassword")?.value;
      if (p1 !== p2) {
        e.preventDefault();
        alert("Passwords do not match.");
        return;
      }
      const email = document.getElementById("email")?.value.trim();
      if (email) {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", email.split("@")[0]);
      }
    });
  }
});
