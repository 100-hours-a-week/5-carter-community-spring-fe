BACKEND_IP_PORT = localStorage.getItem("BACKEND_IP_PORT");

const fetchWrapper = async (url, options = {}) => {
  let accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    await refreshAccessToken();
    accessToken = localStorage.getItem("accessToken");
  }
  const headers = new Headers(options.headers || {});
  headers.append("Authorization", `Bearer ${accessToken}`);

  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 403) {
      await refreshAccessToken();
      accessToken = localStorage.getItem("accessToken");
      headers.set("Authorization", `Bearer ${accessToken}`);
      const retryResponse = await fetch(url, { ...options, headers });
      return retryResponse.json();
    } else if (!response.ok) {
      throw new Error("API 요청 실패");
    }
    return response;
  } catch (error) {
    console.error("API 요청 실패:", error);
    throw error;
  }
};

async function refreshAccessToken() {
  try {
    const response = await fetch(`${BACKEND_IP_PORT}/api/auth/refresh`, {
      method: "POST",
      credentials: "include", // 쿠키를 포함하여 요청
    });

    if (!response.ok) {
      throw new Error("액세스 토큰 갱신 실패");
    }

    const data = await response.json();
    localStorage.setItem("accessToken", data.accessToken);
  } catch (error) {
    console.error("액세스 토큰 갱신 실패:", error);
    throw error;
  }
}

const board = document.getElementById("board");

const passwordInput = document.getElementById("passwordInput");
const passwordMessage = document.getElementById("passwordHelper");

const confirmPasswordInput = document.getElementById("confirmInput");
const confirmPasswordMessage = document.getElementById("confirmPasswordHelper");

const logout = async () => {
  try {
    const response = await fetchWrapper(`${BACKEND_IP_PORT}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      console.log("Logout successful");
      window.location.href = "/";
    } else {
      throw new Error("Logout failed");
    }
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

function toggleDropdown() {
  const dropdownContent = document.getElementById("menu-box");
  dropdownContent.style.display =
    dropdownContent.style.display === "none" ? "block" : "none";
}

function checkMessages() {
  const m1 = confirmPasswordMessage.textContent;
  const m2 = passwordMessage.textContent;

  if (m1 || m2) {
    modifyButton.disabled = true;
    modifyButton.style.backgroundColor = "#FFA500";
  } else {
    modifyButton.disabled = false;
    modifyButton.style.backgroundColor = "#FF8C00";
  }
}

function toast(string) {
  const toast = document.getElementById("toast");

  toast.classList.contains("reveal")
    ? (clearTimeout(removeToast),
      (removeToast = setTimeout(function () {
        document.getElementById("toast").classList.remove("reveal");
      }, 1000)))
    : (removeToast = setTimeout(function () {
        document.getElementById("toast").classList.remove("reveal");
      }, 1000));
  toast.classList.add("reveal"), (toast.innerText = string);
}

function validatePassword(password, _password, p) {
  if (password === "")
    return p == 1
      ? "* 비밀번호를 입력해주세요"
      : "* 비밀번호를 한번 더 입력해주세요";

  if (password.length < 8 || password.length > 20)
    return "* 비밀번호는 8자 이상, 20자 이하여야 합니다";

  const hasSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  const hasUppercase = /[A-Z]/;
  const hasLowercase = /[a-z]/;
  const hasNumber = /[0-9]/;

  if (
    !hasSpecialCharacter.test(password) ||
    !hasUppercase.test(password) ||
    !hasLowercase.test(password) ||
    !hasNumber.test(password)
  )
    return "* 비밀번호는 특수문자, 대소문자, 숫자를 모두 포함해야 합니다";

  if (password !== _password)
    return p == 1 ? "비밀번호 확인과 다릅니다." : "비밀번호와 다릅니다.";

  return "";
}

const pwInputChange = () => {
  const password = passwordInput.value;
  const confirm = confirmPasswordInput.value;

  passwordMessage.textContent = validatePassword(password, confirm, 1);
  confirmPasswordMessage.textContent = validatePassword(confirm, password, 2);

  checkMessages();
};

document.addEventListener("DOMContentLoaded", async () => {
  await fetchWrapper(`${BACKEND_IP_PORT}/api/users/image`, {})
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      profileImage.src = url;
    })
    .catch((error) => console.error("Error fetching image:", error));
});

document.getElementById("logout").addEventListener("click", (event) => {
  event.preventDefault();
  logout();
});

passwordInput.addEventListener("input", pwInputChange);
confirmPasswordInput.addEventListener("input", pwInputChange);

modifyButton.addEventListener("click", async () => {
  const passwordInput = document.getElementById("passwordInput");
  const password = passwordInput.value;
  const data = {
    password: password,
  };

  await fetchWrapper(`${BACKEND_IP_PORT}/api/users/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch((error) => console.error("Error updating password :", error));
  toast("수정완료");
});

board.addEventListener("click", () => {
  window.location.href = "/posts/";
});
