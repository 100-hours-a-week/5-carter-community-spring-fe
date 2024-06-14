BACKEND_IP_PORT = localStorage.getItem("backend-ip-port");

const mainTitle = document.getElementById("mainTitle");

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

const getUserId = async () => {
  try {
    const response = await fetchWrapper(`${BACKEND_IP_PORT}/users/userId`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data.userId;
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

async function displayPostDetail(data) {
  postTitle.textContent =
    data.title.length > 26 ? data.title.slice(0, 26) + "..." : data.title;

  postDate.textContent = data.date;
  postContent.textContent = data.content;
  views.textContent = transformNumber(data.views);
  authorName.textContent = data.nickname;

  comments.textContent = transformNumber(data.comment_count);
  authorId = data.userId;

  await fetchWrapper(`${BACKEND_IP_PORT}/users/${authorId}/image`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      authorProfile.src = url;
    });

  await fetchWrapper(`${BACKEND_IP_PORT}/posts/${postId}/image`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      postImageSrc.src = url;
    });

  await fetchWrapper(`${BACKEND_IP_PORT}/users/${authorId}/image`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      authorProfile.src = url;
    });
}

async function displayComments(data) {
  const postContainer = document.getElementById("commentContainer");
  postContainer.innerHTML = "";

  for (const [index, reply] of data.entries()) {
    const container = document.createElement("div");
    container.classList.add("my-box");

    container.style.top = `calc(300px + ${index * 180}px)`;

    let nickname;
    let imageUrl;

    await fetchWrapper(`${BACKEND_IP_PORT}/users/${reply.userId}/nickname`)
      .then((response) => response.json())
      .then((data) => {
        nickname = data;
      });

    await fetchWrapper(`${BACKEND_IP_PORT}/users/${reply.userId}/image`)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        imageUrl = url;
      });

    container.innerHTML = `
      <div id="commentsContainer">
          <div>
              <div style="display:flex;align-items:center;">
                  <img class="replyImage" src=${imageUrl}></image>
                  <div class="replyNickname">${nickname}</div>
              </div>
              <div class="replyContent" id=${index}content>${reply.content}</div>
          </div>
      <div class="replyDate">${reply.date}</div>
      <button class="replyEdit" data-comment-id="${reply.commentId}" data-user-id="${reply.userId}" >수정</button>
      <button class="cmodalOpenButton" data-comment-id="${reply.commentId}" data-user-id="${reply.userId}">삭제</button>
      `;
    postContainer.appendChild(container);
  }

  document.addEventListener("click", async (event) => {
    const buttons = document.querySelectorAll(".replyEdit");
    for (let index = 0; index < buttons.length; index++) {
      const button = buttons[index];
      if (button === event.target) {
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
    fetchWrapper(`${BACKEND_IP_PORT}/posts/comments/${commentToDeleteId}`, {
      method: "DELETE",
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchWrapper(`${BACKEND_IP_PORT}/users/image`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      profileImage.src = url;
    });

  await fetchWrapper(`${BACKEND_IP_PORT}/posts/${postId}/increment-view`, {
    method: "PATCH",
  });

  await fetchWrapper(`${BACKEND_IP_PORT}/posts/${postId}`)
    .then((response) => response.json())
    .then((data) => {
      displayPostDetail(data);
    })
    .catch((error) => console.error("Error fetching posts:", error));

  await fetchWrapper(`${BACKEND_IP_PORT}/posts/comments/${postId}`)
    .then((response) => response.json())
    .then((data) => {
      displayComments(data);
    })
    .catch((error) => console.error("Error fetching data:", error));
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
  fetchWrapper(`${BACKEND_IP_PORT}/posts/${postId}`, {
    method: "DELETE",
  });
  window.location.href = "/posts";
});

inputComment.addEventListener("input", () => {
  const value = inputComment.value;
  if (!value) {
    submitCommentButton.disabled = true;
    submitCommentButton.style.backgroundColor = "#ACA0EB";
  } else {
    submitCommentButton.disabled = false;
    submitCommentButton.style.backgroundColor = "#7F6AEE";
  }
});

submitCommentButton.addEventListener("click", async () => {
  location.reload();
  if (submitCommentButton.textContent === "댓글 등록") {
    const data = {
      postId: postId,
      content: inputComment.value,
    };
    await fetchWrapper(`${BACKEND_IP_PORT}/posts/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } else if (submitCommentButton.textContent === "댓글 수정") {
    await fetchWrapper(
      `${BACKEND_IP_PORT}/posts/comments/${selectedCommentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: inputComment.value }),
      },
    );
  }
});

postModifyButton.addEventListener("click", async () => {
  if (await postAuth()) {
    window.location.href = `/posts/modify/${postId}`;
  } else {
    alert("수정 권한이 없습니다");
  }
});

mainTitle.addEventListener("click", () => {
  window.location.href = "/posts/";
});
