BACKEND_IP_PORT = localStorage.getItem("backend-ip-port");

const mainTitle = document.getElementById("mainTitle");

const inputTitle = document.getElementById("inputTitle");
const inputContent = document.getElementById("inputContent");
const cButton = document.getElementById("completeButton");
const helperText = document.getElementById("helperText");
const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");

const fetchWrapper = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: "include",
  });
};

const logout = async () => {
  try {
    const response = await fetchWrapper(`${BACKEND_IP_PORT}/users/logout`, {
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
    cButton.style.backgroundColor = "#7F6AEE";
    helperText.textContent = "";
    completeButton.disabled = false;
  } else {
    cButton.style.backgroundColor = "#ACA0EB";
    completeButton.disabled = true;
    helperText.textContent = "* 제목, 내용을 모두 작성해주세요";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  fetchWrapper(`${BACKEND_IP_PORT}/users/image`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      profileImage.src = url;
    });
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
  formData.append("file", file);

  fetchWrapper(`${BACKEND_IP_PORT}/posts`, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
  window.location.href = `/posts`;
});

fileInput.addEventListener("change", () => {
  const fileName = fileInput.files[0].name;
  fileNameDisplay.textContent = fileName;
});

mainTitle.addEventListener("click", () => {
  window.location.href = "/posts/";
});
