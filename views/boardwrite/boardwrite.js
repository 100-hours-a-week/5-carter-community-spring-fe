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

const inputTitle = document.getElementById("inputTitle");
const inputContent = document.getElementById("inputContent");
const cButton = document.getElementById("completeButton");
const helperText = document.getElementById("helperText");
const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");

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

function checkTitleContent() {
  if (inputTitle.value !== "" && inputContent.value !== "") {
    cButton.style.backgroundColor = "#FF8C00";
    helperText.textContent = "";
    completeButton.disabled = false;
  } else {
    cButton.style.backgroundColor = "#FFA500";
    completeButton.disabled = true;
    helperText.textContent = "* 제목, 내용을 모두 작성해주세요";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  fetchWrapper(`${BACKEND_IP_PORT}/api/users/image`)
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

inputTitle.addEventListener("input", () => {
  checkTitleContent();
});

inputContent.addEventListener("input", () => {
  checkTitleContent();
});

completeButton.addEventListener("click", async () => {
  const title = document.getElementById("inputTitle").value;
  const content = document.getElementById("inputContent").value;
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);
  formData.append("image", file);

  await fetchWrapper(`${BACKEND_IP_PORT}/api/posts`, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      window.location.href = `/posts`;
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
});

fileInput.addEventListener("change", () => {
  const fileName = fileInput.files[0].name;
  fileNameDisplay.textContent = fileName;
});

board.addEventListener("click", () => {
  window.location.href = "/posts/";
});
