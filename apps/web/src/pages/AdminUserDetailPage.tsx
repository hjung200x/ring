import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { AdminUserDto } from '@ring/types';
import { apiFetch } from '../lib/api-client.js';

interface AdminUserFormState {
  email: string;
  name: string;
  isActive: boolean;
}

const emptyCreateState = {
  username: '',
  email: '',
  password: '',
  name: '',
  isActive: true,
};

export const AdminUserDetailPage = () => {
  const { userId } = useParams();
  const isNew = userId === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [createForm, setCreateForm] = useState({ ...emptyCreateState });
  const [editForm, setEditForm] = useState<AdminUserFormState>({ email: '', name: '', isActive: true });
  const [newPassword, setNewPassword] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiFetch('/api/admin/users') as Promise<AdminUserDto[]>,
  });

  const users = usersQuery.data ?? [];
  const selectedUser = useMemo(
    () => (isNew ? null : users.find((user) => user.id === userId) ?? null),
    [isNew, userId, users],
  );

  useEffect(() => {
    if (!selectedUser) {
      setEditForm({ email: '', name: '', isActive: true });
      setNewPassword('');
      return;
    }
    setEditForm({
      email: selectedUser.email,
      name: selectedUser.name,
      isActive: selectedUser.isActive,
    });
    setNewPassword('');
  }, [selectedUser]);

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    await queryClient.invalidateQueries({ queryKey: ['session-user'] });
  };

  const createDisabledReason = !createForm.username.trim()
    ? '로그인 아이디를 입력하세요.'
    : !createForm.name.trim()
      ? '이름을 입력하세요.'
      : !createForm.email.trim()
        ? '이메일을 입력하세요.'
        : createForm.password.length < 8
          ? '비밀번호는 8자 이상이어야 합니다.'
          : '';

  const updateDisabledReason = !editForm.name.trim()
    ? '이름을 입력하세요.'
    : !editForm.email.trim()
      ? '이메일을 입력하세요.'
      : newPassword.length > 0 && newPassword.length < 8
        ? '새 비밀번호는 8자 이상이어야 합니다.'
        : '';

  const createMutation = useMutation({
    mutationFn: async () =>
      apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(createForm),
      }) as Promise<AdminUserDto>,
    onSuccess: async (user) => {
      setStatus('계정을 추가했습니다.');
      await refreshUsers();
      navigate(`/admin/users/${user.id}`);
    },
    onError: () => setStatus('계정 추가에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;
      return apiFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          email: editForm.email,
          name: editForm.name,
          isActive: editForm.isActive,
          password: newPassword.trim() ? newPassword : undefined,
        }),
      });
    },
    onSuccess: async () => {
      setStatus(newPassword.trim() ? '계정 정보와 비밀번호를 저장했습니다.' : '계정 정보를 저장했습니다.');
      setNewPassword('');
      await refreshUsers();
    },
    onError: () => setStatus('계정 저장에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;
      return apiFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: async () => {
      setStatus('계정을 삭제했습니다.');
      await refreshUsers();
      navigate('/admin');
    },
    onError: () => setStatus('계정 삭제에 실패했습니다.'),
  });

  if (!isNew && usersQuery.isSuccess && !selectedUser) {
    return (
      <section className='panel-surface admin-surface admin-detail-surface'>
        <h1>계정을 찾을 수 없습니다.</h1>
        <Link to='/admin' className='back-link'>계정 목록으로 돌아가기</Link>
      </section>
    );
  }

  return (
    <section className='panel-surface admin-surface admin-detail-surface'>
      <div className='profile-list-header'>
        <div>
          <h1>{isNew ? '계정 추가' : '계정 수정'}</h1>
          <p className='login-subcopy'>
            {isNew ? '새 계정의 로그인 아이디, 이름, 이메일, 비밀번호를 등록합니다.' : '선택한 계정의 정보를 수정합니다. 로그인 아이디는 생성 후 변경할 수 없습니다.'}
          </p>
        </div>
      </div>

      <section className='profile-section-card'>
        {isNew ? (
          <>
            <label className='settings-field'>
              <span>로그인 아이디</span>
              <input className='panel-input' value={createForm.username} onChange={(event) => { setStatus(''); setCreateForm((prev) => ({ ...prev, username: event.target.value })); }} />
            </label>
            <label className='settings-field'>
              <span>이름</span>
              <input className='panel-input' value={createForm.name} onChange={(event) => { setStatus(''); setCreateForm((prev) => ({ ...prev, name: event.target.value })); }} />
            </label>
            <label className='settings-field'>
              <span>이메일</span>
              <input className='panel-input' value={createForm.email} onChange={(event) => { setStatus(''); setCreateForm((prev) => ({ ...prev, email: event.target.value })); }} />
              <small>로그인에는 쓰지 않지만 계정 식별과 연락처 용도로 저장합니다.</small>
            </label>
            <label className='settings-field'>
              <span>비밀번호</span>
              <input className='panel-input' type='password' value={createForm.password} onChange={(event) => { setStatus(''); setCreateForm((prev) => ({ ...prev, password: event.target.value })); }} />
              <small>8자 이상 입력하세요.</small>
            </label>
            <label className='settings-checkbox'>
              <input type='checkbox' checked={createForm.isActive} onChange={(event) => { setStatus(''); setCreateForm((prev) => ({ ...prev, isActive: event.target.checked })); }} />
              <span>계정 활성화</span>
            </label>
            {createDisabledReason ? <p className='form-hint-message'>{createDisabledReason}</p> : null}
            <button type='button' className='panel-button' disabled={createMutation.isPending || Boolean(createDisabledReason)} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? '추가 중...' : '계정 추가'}
            </button>
          </>
        ) : selectedUser ? (
          <div className='admin-detail-grid'>
            <div>
              <label className='settings-field'>
                <span>로그인 아이디</span>
                <input className='panel-input is-readonly' value={selectedUser.username} readOnly disabled />
                <small>로그인 아이디는 생성 후 변경할 수 없습니다.</small>
              </label>
              <label className='settings-field'>
                <span>이름</span>
                <input className='panel-input' value={editForm.name} onChange={(event) => { setStatus(''); setEditForm((prev) => ({ ...prev, name: event.target.value })); }} />
              </label>
              <label className='settings-field'>
                <span>이메일</span>
                <input className='panel-input' value={editForm.email} onChange={(event) => { setStatus(''); setEditForm((prev) => ({ ...prev, email: event.target.value })); }} />
              </label>
              <label className='settings-checkbox'>
                <input type='checkbox' checked={editForm.isActive} onChange={(event) => { setStatus(''); setEditForm((prev) => ({ ...prev, isActive: event.target.checked })); }} />
                <span>계정 활성화</span>
              </label>
            </div>
            <div>
              <label className='settings-field'>
                <span>새 비밀번호</span>
                <input className='panel-input' type='password' value={newPassword} onChange={(event) => { setStatus(''); setNewPassword(event.target.value); }} />
                <small>입력하면 비밀번호도 함께 변경됩니다. 비워두면 기존 비밀번호를 유지합니다.</small>
              </label>
              {updateDisabledReason ? <p className='form-hint-message'>{updateDisabledReason}</p> : null}
              <div className='admin-action-row'>
                <button type='button' className='panel-button' disabled={updateMutation.isPending || Boolean(updateDisabledReason)} onClick={() => updateMutation.mutate()}>
                  {updateMutation.isPending ? '저장 중...' : '저장'}
                </button>
                <button type='button' className='secondary-action admin-delete-button' disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                  {deleteMutation.isPending ? '삭제 중...' : '계정 삭제'}
                </button>
              </div>
              <div className='admin-meta-box'>
                <strong>생성일</strong>
                <span>{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selectedUser.createdAt))}</span>
                <strong>수정일</strong>
                <span>{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selectedUser.updatedAt))}</span>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {status ? <p className='profile-status-message'>{status}</p> : null}
      <Link to='/admin' className='back-link'>계정 목록으로 돌아가기</Link>
    </section>
  );
};
