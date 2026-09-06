import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach the JWT token to every request, if we have one
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("quill_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// If the backend says the token is invalid/expired, clear it
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("quill_token");
      localStorage.removeItem("quill_user");
    }
    return Promise.reject(error);
  }
);

export default apiClient;