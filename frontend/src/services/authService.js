// src/services/authService.js
import { fetchJSON } from '../api';

export async function login(username, password) {
  const data = await fetchJSON('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  // server returns { token, user }
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

export function getToken() {
  return localStorage.getItem('token');
}
