export const fetchWrapper = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: "include",
  });
};
