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

const modalOpenButton = document.getElementById("modalOpenButton");
const modalCloseButton = document.getElementById("modalCloseButton");
const modal = document.getElementById("modalContainer");

const inputComment = document.getElementById("commentInput");
const submitCommentButton = document.getElementById("submitComment");

const postId = getPostIdFromUrl();

const postTitle = document.getElementById("postTitle");
const postDate = document.getElementById("postDate");
const postImageSrc = document.getElementById("postImageSrc");
const postContent = document.getElementById("postContent");
const views = document.getElementById("views");
const comments = document.getElementById("comments");
const authorProfile = document.getElementById("authorProfile");
const authorName = document.getElementById("authorName");

let authorId;
let selectedCommentId;

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

const getUserId = async () => {
  try {
    const response = await fetchWrapper(
      `${BACKEND_IP_PORT}/api/users/userId`,
      {},
    );
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error("Failed to fetch user ID");
    }
  } catch (error) {
    console.error("Error fetching user ID:", error);
    return null;
  }
};

async function postAuth() {
  const userId = await getUserId();
  return parseInt(userId) === parseInt(authorId);
}

async function commentAuth(id) {
  const userId = await getUserId();
  return parseInt(userId) === parseInt(id);
}

function toggleDropdown() {
  const dropdownContent = document.getElementById("menu-box");
  dropdownContent.style.display =
    dropdownContent.style.display === "none" ? "block" : "none";
}

function getPostIdFromUrl() {
  const parts = window.location.pathname.split(":");
  return parts[parts.length - 1];
}

function transformNumber(number) {
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

async function displayPostDetail(data) {
  postTitle.textContent =
    data.title.length > 26 ? data.title.slice(0, 26) + "..." : data.title;

  postDate.textContent = formatDate(data.date);
  postContent.textContent = data.content;
  views.textContent = transformNumber(data.views);
  authorId = data.userId;

  await fetchWrapper(
    `${BACKEND_IP_PORT}/api/posts/${data.postId}/comments/count`,
    {},
  )
    .then((response) => response.json())
    .then((data) => {
      comments.textContent = transformNumber(data);
    })
    .catch((error) => console.error("Error fetching count:", error));

  await fetchWrapper(`${BACKEND_IP_PORT}/api/users/${authorId}/nickname`, {})
    .then((response) => response.text())
    .then((data) => {
      authorName.textContent = data;
    })
    .catch((error) => console.error("Error fetching nickname:", error));

  await fetchWrapper(`${BACKEND_IP_PORT}/api/users/${authorId}/image`, {})
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      authorProfile.src = url;
    })
    .catch((error) => console.error("Error fetching image:", error));

  await fetchWrapper(`${BACKEND_IP_PORT}/api/posts/${postId}/image`, {})
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      postImageSrc.src = url;
    })
    .catch((error) => console.error("Error fetching image:", error));
}

async function displayComments(comments) {
  const commentContainer = document.getElementById("commentContainer");
  commentContainer.innerHTML = "";

  const sortedComments = comments.sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  const commentElements = await Promise.all(
    sortedComments.map(async (comment, index) => {
      const container = document.createElement("div");
      container.classList.add("my-box");

      let nickname;
      let imageUrl;

      await fetchWrapper(
        `${BACKEND_IP_PORT}/api/users/${comment.userId}/nickname`,
        {},
      )
        .then((response) => response.text())
        .then((data) => {
          nickname = data;
        })
        .catch((error) => console.error("Error fetching nickname:", error));

      await fetchWrapper(
        `${BACKEND_IP_PORT}/api/users/${comment.userId}/image`,
        {},
      )
        .then((response) => response.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          imageUrl = url;
        })
        .catch((error) => console.error("Error fetching image:", error));

      container.innerHTML = `
          <div id="commentsContainer">
              <div>
                  <div style="display:flex;align-items:center;">
                      <img class="replyImage" src=${imageUrl}></image>
                      <div class="replyNickname">${nickname}</div>
                  </div>
                  <div class="replyContent" id=${index}content>${comment.content}</div>
              </div>
          <div class="replyDate">${formatDate(comment.date)}</div>
          <button class="replyEdit" data-comment-id="${comment.commentId}" data-user-id="${comment.userId}" >수정</button>
          <button class="cmodalOpenButton" data-comment-id="${comment.commentId}" data-user-id="${comment.userId}">삭제</button>
          `;
      return container;
    }),
  );
  commentElements.forEach((container) => {
    commentContainer.appendChild(container);
  });

  document.addEventListener("click", async (event) => {
    const buttons = document.querySelectorAll(".replyEdit");
    for (let index = 0; index < buttons.length; index++) {
      const button = buttons[index];
      if (button === event.target) {
        submitCommentButton.disabled = true;
        submitCommentButton.style.backgroundColor = "#FF8C00";
        const eB = event.target.closest(".replyEdit");
        const id = eB.dataset.userId;

        if (await commentAuth(id)) {
          const content = document.getElementById(`${index}content`);
          const comment = document.getElementById("commentInput");
          const submitComment = document.getElementById("submitComment");
          comment.textContent = content.textContent;
          submitComment.textContent = "댓글 수정";
          selectedCommentId = eB.dataset.commentId;
        } else {
          alert("수정 권한이 없습니다");
        }
      }
    }
  });

  let commentToDeleteId;
  const cmodalOpenButtons = document.querySelectorAll(".cmodalOpenButton");
  const cmodalContainer = document.getElementById("cmodalContainer");
  const cmodalCloseButton = document.getElementById("cmodalCloseButton");
  const cagreeButton = document.getElementById("cagreeButton");

  cmodalOpenButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.userId;
      if (await commentAuth(id)) {
        commentToDeleteId = button.dataset.commentId;
        cmodalContainer.classList.remove("hidden");
      } else {
        alert("삭제 권한이 없습니다");
      }
    });
  });

  cmodalCloseButton.addEventListener("click", () => {
    cmodalContainer.classList.add("hidden");
  });

  cagreeButton.addEventListener("click", () => {
    location.reload();
    fetchWrapper(`${BACKEND_IP_PORT}/api/comments/${commentToDeleteId}`, {
      method: "DELETE",
    }).catch((error) => console.error("Error deleting comment :", error));
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

  await fetchWrapper(`${BACKEND_IP_PORT}/api/posts/${postId}/increment-view`, {
    method: "PUT",
  }).catch((error) => console.error("Error increasing view :", error));

  await fetchWrapper(`${BACKEND_IP_PORT}/api/posts/${postId}`, {})
    .then((response) => response.json())
    .then((data) => {
      displayPostDetail(data);
    })
    .catch((error) => console.error("Error fetching posts:", error));

  await fetchWrapper(`${BACKEND_IP_PORT}/api/comments/${postId}`, {})
    .then((response) => response.json())
    .then((data) => {
      displayComments(data);
    })
    .catch((error) => console.error("Error fetching comments:", error));
});

document.getElementById("logout").addEventListener("click", (event) => {
  event.preventDefault();
  logout();
});

modalOpenButton.addEventListener("click", async () => {
  if (await postAuth()) {
    modal.classList.remove("hidden");
  } else {
    alert("삭제 권한이 없습니다");
  }
});

modalCloseButton.addEventListener("click", () => {
  modal.classList.add("hidden");
});

const agreeButton = document.getElementById("agreeButton");
agreeButton.addEventListener("click", async function () {
  fetchWrapper(`${BACKEND_IP_PORT}/api/posts/${postId}`, {
    method: "DELETE",
  }).catch((error) => console.error("Error deleting post :", error));
  window.location.href = "/posts";
});

inputComment.addEventListener("input", () => {
  const value = inputComment.value;
  if (!value) {
    submitCommentButton.disabled = true;
    submitCommentButton.style.backgroundColor = "#FF8C00";
  } else {
    submitCommentButton.disabled = false;
    submitCommentButton.style.backgroundColor = "#FF6F00";
  }
});

submitCommentButton.addEventListener("click", async () => {
  location.reload();
  if (submitCommentButton.textContent === "댓글 등록") {
    const data = {
      postId: postId,
      content: inputComment.value,
    };
    await fetchWrapper(`${BACKEND_IP_PORT}/api/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).catch((error) => console.error("Error posting comment :", error));
  } else if (submitCommentButton.textContent === "댓글 수정") {
    await fetchWrapper(`${BACKEND_IP_PORT}/api/comments/${selectedCommentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: inputComment.value }),
    }).catch((error) => console.error("Error updating comment :", error));
  }
});

postModifyButton.addEventListener("click", async () => {
  if (await postAuth()) {
    window.location.href = `/posts/modify/${postId}`;
  } else {
    alert("수정 권한이 없습니다");
  }
});

board.addEventListener("click", () => {
  window.location.href = "/posts/";
});
