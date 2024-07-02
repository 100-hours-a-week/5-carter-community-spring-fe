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

function formatDate(dateString) {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}:${seconds}`;
}

async function displayPosts(posts) {
  const postContainer = document.getElementById("post-container");

  const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const postElements = await Promise.all(
    sortedPosts.map(async (post, index) => {
      const container = document.createElement("div");

      container.classList.add("my-box");
      container.postId = post.postId;
      post.likes = transformLikes(post.likes);
      post.views = transformLikes(post.views);

      try {
        const countResponse = await fetchWrapper(
          `${BACKEND_IP_PORT}/api/posts/${post.postId}/comments/count`,
          {},
        );
        const count = await countResponse.json();
        post.count_comment = transformLikes(count);
      } catch (error) {
        console.error("Error fetching count:", error);
        post.count_comment = "0";
      }

      let nickname;
      try {
        const nicknameResponse = await fetchWrapper(
          `${BACKEND_IP_PORT}/api/users/${post.userId}/nickname`,
          {},
        );
        nickname = await nicknameResponse.text();
      } catch (error) {
        console.error("Error fetching nickname:", error);
        nickname = "Unknown";
      }

      let url;
      try {
        const imageResponse = await fetchWrapper(
          `${BACKEND_IP_PORT}/api/users/${post.userId}/image`,
          {},
        );
        const blob = await imageResponse.blob();
        url = URL.createObjectURL(blob);
      } catch (error) {
        console.error("Error fetching image:", error);
        url = "/path/to/default/image.png"; // Default image in case of error
      }

      container.innerHTML = `
      <div class="title">${post.title}</div>
      <div class="like">좋아요 ${post.likes} 댓글 ${post.count_comment} 조회수 ${post.views}</div>
      <div class="date">${formatDate(post.date)}</div>
      <hr />
      <div class="user"><img class="profile" src="${url}" /> <div class="author">${nickname}</div></div>
    `;

      container.addEventListener("click", async () => {
        window.location.href = `/posts/detail/:${container.postId}`;
      });

      return container;
    }),
  );

  // 모든 비동기 작업이 완료된 후에 DOM에 추가
  postElements.forEach((container) => {
    postContainer.appendChild(container);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  document.addEventListener("DOMContentLoaded", () => {
    function adjustOverlayHeight() {
      const body = document.body;
      const html = document.documentElement;
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
      );
      document.getElementById("overlay").style.height = `${height}px`;
    }

    window.addEventListener("load", adjustOverlayHeight);
    window.addEventListener("resize", adjustOverlayHeight);
  });

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

writeButton.addEventListener("click", () => {
  window.location.href = `/posts/register`;
});
