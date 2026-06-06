import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/';

export const login = async (username: string, password: string) => {
  const res = await axios.post(`${BASE_URL}token/`, { username, password });

  localStorage.setItem('accessToken', res.data.access);
  localStorage.setItem('refreshToken', res.data.refresh);

  return res.data;
};

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('username');
};