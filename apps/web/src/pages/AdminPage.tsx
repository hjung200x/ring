import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { AdminUserDto } from '@ring/types';
import { apiFetch } from '../lib/api-client.js';

export const AdminPage = () => {
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiFetch('/api/admin/users') as Promise<AdminUserDto[]>,
  });

  const users = usersQuery.data ?? [];

  return (
    <section className='panel-surface admin-surface'>
      <div className='profile-list-header'>
        <div>
          <h1>Admin</h1>
          <p className='login-subcopy'>계정 목록을 보고, 새 계정을 추가하거나 기존 계정을 수정합니다.</p>
        </div>
      </div>

      <section className='profile-section-card'>
        <h2>계정 목록</h2>
        <div className='admin-user-list'>
          {users.map((user) => (
            <Link key={user.id} to={`/admin/users/${user.id}`} className='admin-user-card admin-user-link'>
              <strong>{user.name}</strong>
              <span>{user.username}</span>
              <small>{user.email}</small>
              <small>{user.isActive ? '활성' : '비활성'}</small>
            </Link>
          ))}
          {users.length === 0 ? <p className='login-subcopy'>등록된 계정이 없습니다.</p> : null}
        </div>
      </section>

      <Link to='/admin/users/new' className='profile-add-tile'>
        <span className='profile-add-icon' aria-hidden='true'>
          <svg viewBox='0 0 24 24'>
            <path d='M12 5v14M5 12h14' />
          </svg>
        </span>
        <span>계정 추가</span>
      </Link>

      <Link to='/notifications' className='back-link'>공고알림으로 돌아가기</Link>
    </section>
  );
};
