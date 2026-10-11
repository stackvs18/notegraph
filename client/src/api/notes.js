import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getPublicNotes = async () => {
  const response = await API.get('/notes/public');
  return response.data;
};

export const getPublicNoteByNanoid = async (nanoid) => {
  const response = await API.get(`/notes/public/${nanoid}`);
  return response.data;
};

export const getMyNotes = async (token) => {
  const response = await API.get('/notes/my', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getNoteById = async (id, token) => {
  const response = await API.get(`/notes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createNote = async (data, token) => {
  const response = await API.post('/notes', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateNote = async (id, data, token) => {
  const response = await API.put(`/notes/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteNote = async (id, token) => {
  const response = await API.delete(`/notes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const renewNote = async (id, token) => {
  const response = await API.post(
    `/notes/${id}/renew`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
