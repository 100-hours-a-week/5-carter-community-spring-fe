async function fetchConfig() {
  const response = await fetch("/config");
  const config = await response.json();
  return config.BACKEND_IP_PORT;
}

document.addEventListener("DOMContentLoaded", async () => {
  const BACKEND_IP_PORT = await fetchConfig();

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const helperText = document.getElementById("helpingText");
  const loginButton = document.getElementById("submitLogin");

  async function validateAccount() {
    const email = emailInput.value;
    const password = passwordInput.value;
    const data = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    };

    try {
      const response = await fetch(`${BACKEND_IP_PORT}/api/auth/login`, data);
      if (!response.ok) {
        throw new Error("Login failed");
      }
      return true;
    } catch (error) {
      console.error("Error:", error);
      return false;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    validateAccount().then((result) => {
      if (result) {
        loginButton.style.backgroundColor = "#7F6AEE";

        setTimeout(() => {
          window.location.href = "/posts";
        }, 3000);
      } else {
        helperText.textContent = "* 입력하신 계정 정보가 정확하지 않았습니다.";
      }
    });
  });
});
