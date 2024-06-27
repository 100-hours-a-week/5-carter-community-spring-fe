const BACKEND_IP_PORT = "http://localhost:8081"; // 백엔드 IP와 포트 설정

export const fetchWrapper = async (url, options = {}) => {
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

export async function refreshAccessToken() {
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
