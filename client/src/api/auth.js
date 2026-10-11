import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const register = async ({ username, email, password }) => {
  const response = await API.post('/auth/register', { username, email, password });
  return response.data;
};

export const login = async ({ username, password }) => {
  const response = await API.post('/auth/login', { username, password });
  return response.data;
};

export const getMe = async (token) => {
  const response = await API.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
