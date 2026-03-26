import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api-client.js';

export const ChangePasswordPage = () => {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: async () =>
      apiFetch('/api/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      }),
    onSuccess: async () => {
      setStatus('비밀번호를 변경했습니다. 다시 로그인해 주세요.');
      setPassword('');
      await queryClient.invalidateQueries({ queryKey: ['session-user'] });
    },
    onError: () => setStatus('비밀번호 변경에 실패했습니다.'),
  });

  return (
    <section className='panel-surface admin-surface admin-detail-surface'>
      <div className='profile-list-header'>
        <div>
          <h1>비밀번호 변경</h1>
          <p className='login-subcopy'>현재 로그인한 계정의 비밀번호를 변경합니다.</p>
        </div>
      </div>

      <section className='profile-section-card'>
        <label className='settings-field'>
          <span>새 비밀번호</span>
          <input className='panel-input' type='password' value={password} onChange={(event) => { setStatus(''); setPassword(event.target.value); }} />
          <small>8자 이상 입력하세요.</small>
        </label>
        <button type='button' className='panel-button' disabled={changePasswordMutation.isPending || password.length < 8} onClick={() => changePasswordMutation.mutate()}>
          {changePasswordMutation.isPending ? '변경 중...' : '비밀번호 변경'}
        </button>
      </section>

      {status ? <p className='profile-status-message'>{status}</p> : null}
      <Link to='/notifications' className='back-link'>공고알림으로 돌아가기</Link>
    </section>
  );
};
