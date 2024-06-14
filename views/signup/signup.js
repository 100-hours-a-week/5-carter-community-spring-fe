BACKEND_IP_PORT = localStorage.getItem("backend-ip-port");

const profileInput = document.getElementById("fileInput");
const profileMessage = document.getElementById("profileHelpingText");

const emailInput = document.getElementById("input-email");
const emailMessage = document.getElementById("emailHelper");

const passwordInput = document.getElementById("input-pw");
const passwordMessage = document.getElementById("passwordHelper");

const confirmInput = document.getElementById("confirm-pw");
const confirmMessage = document.getElementById("confirmPasswordHelper");

const nicknameInput = document.getElementById("input-nickname");
const nicknameMessage = document.getElementById("nicknameHelper");

const fetchWrapper = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: "include",
  });
};

const pwInputChange = () => {
  const password = passwordInput.value;
  const confirm = confirmInput.value;
  passwordMessage.textContent = validatePassword(password, 1);
  confirmMessage.textContent = validatePassword(confirm, 2);
  if (password !== confirm) {
    passwordMessage.textContent = "* 비밀번호가 다릅니다.";
    confirmMessage.textContent = "* 비밀번호가 다릅니다.";
  }

  checkMessages();
};

async function addImage() {
  const file = profileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target.result;
      document.getElementById("uploadButton").style.backgroundImage =
        `url('${imageDataUrl}')`;
      document.getElementById("profileHelpingText").textContent = "";
    };
    reader.readAsDataURL(file);
    return;
  }
  document.getElementById("uploadButton").style.backgroundImage = "none";
  document.getElementById("profileHelpingText").textContent =
    "* 프로필 사진을 추가해주세요.";
}

function validateEmailFormat(email) {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function checkMessages() {
  const m1 = profileMessage.textContent;
  const m2 = emailMessage.textContent;
  const m3 = passwordMessage.textContent;
  const m4 = confirmMessage.textContent;
  const m5 = nicknameMessage.textContent;
  if (m1 || m2 || m3 || m4 || m5) {
    signupButton.disabled = true;
    signupButton.style.backgroundColor = "#ACA0EB";
  } else {
    signupButton.disabled = false;
    signupButton.style.backgroundColor = "#7F6AEE";
  }
}

function validatePassword(password, p) {
  if (password === "")
    return p == 1
      ? "* 비밀번호를 입력해주세요"
      : "* 비밀번호를 한번더 입력해주세요";

  if (password.length < 8 || password.length > 20) {
    return "* 비밀번호는 8자 이상, 20자 이하여야 합니다";
  }

  const hasSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  const hasUppercase = /[A-Z]/;
  const hasLowercase = /[a-z]/;
  const hasNumber = /[0-9]/;

  if (
    !hasSpecialCharacter.test(password) ||
    !hasUppercase.test(password) ||
    !hasLowercase.test(password) ||
    !hasNumber.test(password)
  ) {
    return "* 비밀번호는 특수문자, 대소문자, 숫자를 모두 포함해야 합니다";
  }

  return "";
}

profileInput.addEventListener("change", async () => {
  await addImage();
  checkMessages();
});

emailInput.addEventListener("input", async () => {
  const email = emailInput.value;

  if (!email) {
    emailHelper.textContent = "*이메일을 입력해주세요";
  } else if (!validateEmailFormat(email)) {
    emailHelper.textContent =
      "*올바른 이메일 주소 형식을 입력해주세요. (예:example@example.com)";
  } else {
    await fetchWrapper(`${BACKEND_IP_PORT}/users/email/${email}`)
      .then((response) => response.json())
      .then((result) => {
        emailHelper.textContent = result.isDuplicate
          ? "*중복된 이메일입니다."
          : "";
      });
  }
  checkMessages();
});

passwordInput.addEventListener("input", pwInputChange);
confirmInput.addEventListener("input", pwInputChange);

nicknameInput.addEventListener("input", async () => {
  const nickname = nicknameInput.value;

  if (!nickname) nicknameMessage.textContent = "* 닉네임을 입력해주세요";
  else if (nickname.includes(" "))
    nicknameMessage.textContent = "* 띄어쓰기를 없애주세요";
  else if (nickname.length > 10)
    nicknameMessage.textContent = "* 닉네임은 최대 10자 까지 작성 가능합니다";
  else {
    await fetchWrapper(`${BACKEND_IP_PORT}/users/nickname/${nickname}`)
      .then((response) => response.json())
      .then((result) => {
        nicknameMessage.textContent = result.isDuplicate
          ? "* 중복된 닉네임입니다."
          : "";
      });
  }

  checkMessages();
});

signupButton.addEventListener("click", async (event) => {
  event.preventDefault();

  const email = document.getElementById("input-email").value;
  const nickname = document.getElementById("input-nickname").value;
  const password = document.getElementById("input-pw").value;
  const file = document.getElementById("fileInput").files[0];
  const formData = new FormData();

  formData.append("email", email);
  formData.append("nickname", nickname);
  formData.append("password", password);
  formData.append("file", file);

  await fetchWrapper(`${BACKEND_IP_PORT}/users`, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        alert("회원가입이 완료되었습니다.");
        window.location.href = "/";
      } else {
        alert("회원가입에 실패하였습니다!");
      }
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
});

document.getElementById("uploadButton").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});
