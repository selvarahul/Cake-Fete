// src/components/Login.jsx
import React, { useState } from 'react';
import { login } from '../services/authService';

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      setMsg('Logged in');
      if (onSuccess) onSuccess(data.user);
    } catch (err) {
      setMsg('Login failed: ' + (err.message || err));
    }
  };

  return (
    <form onSubmit={submit} className="max-w-sm">
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" className="border p-2 w-full mb-2" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" className="border p-2 w-full mb-2" />
      <button className="bg-green-600 text-white px-4 py-2 rounded">Login</button>
      <div className="text-sm mt-2">{msg}</div>
    </form>
  );
}
