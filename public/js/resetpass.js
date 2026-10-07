document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("A reset link has been dispatched to your email address.");
      window.location.href = "/login";
    });
  }
});
