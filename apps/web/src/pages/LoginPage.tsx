import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api-client.js';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('change-me-now');
  const [status, setStatus] = useState('');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('');

    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStatus('Logged in');
      navigate('/notifications');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'login failed');
    }
  };

  return (
    <section className='login-panel'>
      <h1>Login</h1>
      <p className='login-subcopy'>Use the seeded account to review matched KEIT notices and saved profiles.</p>
      <form onSubmit={onSubmit} className='login-form'>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder='Email' />
        <input
          type='password'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder='Password'
        />
        <button type='submit'>Sign in</button>
        {status ? <p className='login-subcopy'>{status}</p> : null}
      </form>
    </section>
  );
};
