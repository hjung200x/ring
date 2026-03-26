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
      setStatus('\uB85C\uADF8\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');
      navigate('/notifications');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
    }
  };

  return (
    <section className='login-panel'>
      <h1>{'\uB85C\uADF8\uC778'}</h1>
      <p className='login-subcopy'>
        {'\uB4F1\uB85D\uB41C \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD558\uBA74 \uAD00\uC2EC \uACF5\uACE0 \uC54C\uB9BC\uACFC \uD504\uB85C\uD544 \uC124\uC815\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'}
      </p>
      <form onSubmit={onSubmit} className='login-form'>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={'\uC774\uBA54\uC77C'} />
        <input
          type='password'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={'\uBE44\uBC00\uBC88\uD638'}
        />
        <button type='submit'>{'\uB85C\uADF8\uC778'}</button>
        {status ? <p className='login-subcopy'>{status}</p> : null}
      </form>
    </section>
  );
};
