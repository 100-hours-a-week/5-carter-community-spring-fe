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
    if (response.status === 401) {
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

const mainTitle = document.getElementById("mainTitle");

const cButton = document.getElementById("completeButton");
const helperText = document.getElementById("helperText");
const fileInput = document.getElementById("fileInput");
const inputTitle = document.getElementById("inputTitle");
const inputContent = document.getElementById("inputContent");

const postId = getPostIdFromUrl();

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
  const inputTitle = document.getElementById("inputTitle");
  const inputContent = document.getElementById("inputContent");
  if (inputTitle.value !== "" && inputContent.value !== "") {
    cButton.style.backgroundColor = "#7F6AEE";
    completeButton.disabled = false;
    helperText.textContent = "";
  } else {
    cButton.style.backgroundColor = "#ACA0EB";
    completeButton.disabled = true;
    helperText.textContent = "* 제목, 내용을 모두 작성해주세요";
  }
}

function getPostIdFromUrl() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1];
}

document.addEventListener("DOMContentLoaded", async function () {
  await fetchWrapper(`${BACKEND_IP_PORT}/api/users/image`, {})
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      profileImage.src = url;
    })
    .catch((error) => console.error("Error fetching image:", error));

  await fetchWrapper(`${BACKEND_IP_PORT}/api/posts/${postId}`, {})
    .then((response) => response.json())
    .then((post) => {
      inputTitle.value = post.title;
      inputContent.value = post.content;
      checkTitleContent();
    })
    .catch((error) => console.error("Error fetching post:", error));
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

fileInput.addEventListener("change", () => {
  const selectedFile = fileInput.files[0];
  const fileName = selectedFile ? selectedFile.name : "파일을 선택해주세요.";
  const existingFileNameElement = document.getElementById("existingFileName");
  existingFileNameElement.textContent = fileName;
});

completeButton.addEventListener("click", async () => {
  const title = document.getElementById("inputTitle").value;
  const content = document.getElementById("inputContent").value;
  const fileInput = document.getElementById("fileInput").files[0];

  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);
  formData.append("file", fileInput);
  await fetchWrapper(`${BACKEND_IP_PORT}/api/posts/${postId}`, {
    method: "PUT",
    body: formData,
  }).catch((error) => console.error("Error updating post :", error));
  window.location.href = `/posts/detail/:${postId}`;
});

mainTitle.addEventListener("click", () => {
  window.location.href = "/posts/";
});
