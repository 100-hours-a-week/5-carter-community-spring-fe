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

const profileImage = document.getElementById("profileImage");
const writeButton = document.getElementById("writeButton");

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

function transformLikes(number) {
  if (number >= 100000) {
    return "100k";
  } else if (number >= 10000) {
    return "10k";
  } else if (number >= 1000) {
    return "1k";
  } else return number;
}

function displayPosts(posts) {
  const postContainer = document.getElementById("post-container");
  posts.forEach(async (post, index) => {
    const container = document.createElement("div");

    container.classList.add("my-box");
    container.postId = post.postId;
    container.style.top = `calc(300px + ${index * 180}px)`;
    post.likes = transformLikes(post.likes);
    post.views = transformLikes(post.views);

    await fetchWrapper(
      `${BACKEND_IP_PORT}/api/posts/${post.postId}/comments/count`,
      {},
    )
      .then((response) => response.json())
      .then((count) => {
        post.count_comment = transformLikes(count);
      })
      .catch((error) => console.error("Error fetching count:", error));

    let nickname;
    await fetchWrapper(
      `${BACKEND_IP_PORT}/api/users/${post.userId}/nickname`,
      {},
    )
      .then((response) => response.text())
      .then((data) => {
        nickname = data;
      })
      .catch((error) => console.error("Error fetching nickname:", error));

    let url;
    await fetchWrapper(`${BACKEND_IP_PORT}/api/users/${post.userId}/image`, {})
      .then((response) => response.blob())
      .then((blob) => {
        url = URL.createObjectURL(blob);
      })
      .catch((error) => console.error("Error fetching image:", error));

    container.innerHTML = `
      <div class="title">${post.title}</div>
      <div class="like">좋아요 ${post.likes} 댓글 ${post.count_comment} 조회수 ${post.views}</div>
      <div class="date">${post.date}</div>
      <hr />
      <div class="user"><img class="profile" src="${url}" /> <div class="author">${nickname}</div></div>
    `;

    container.addEventListener("click", async () => {
      window.location.href = `/posts/detail/:${container.postId}`;
    });

    postContainer.appendChild(container);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchWrapper(`${BACKEND_IP_PORT}/api/users/image`, {})
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      profileImage.src = url;
    })
    .catch((error) => console.error("Error fetching image:", error));

  await fetchWrapper(`${BACKEND_IP_PORT}/api/posts`, {})
    .then((response) => response.json())
    .then((data) => {
      displayPosts(data);
    })
    .catch((error) => console.error("Error fetching posts:", error));
});

document.getElementById("logout").addEventListener("click", (event) => {
  event.preventDefault();
  logout();
});

writeButton.onmouseover = () => (writeButton.style.backgroundColor = "#7F6AEE");
writeButton.onmouseout = () => (writeButton.style.backgroundColor = "#ACA0EB");
writeButton.addEventListener("click", () => {
  window.location.href = `/posts/register`;
});
