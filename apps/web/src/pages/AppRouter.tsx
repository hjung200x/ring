import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { SessionUserDto } from '@ring/types';
import { apiFetch } from '../lib/api-client.js';
import { AdminPage } from './AdminPage.js';
import { AdminUserDetailPage } from './AdminUserDetailPage.js';
import { ChangePasswordPage } from './ChangePasswordPage.js';
import { LoginPage } from './LoginPage.js';
import { NotificationListPage } from './NotificationListPage.js';
import { NotificationDetailPage } from './NotificationDetailPage.js';
import { ProfileListPage } from './ProfileListPage.js';
import { ProfileDetailPage } from './ProfileDetailPage.js';
import { SchedulePage } from './SchedulePage.js';

const useSessionUser = () =>
  useQuery({
    queryKey: ['session-user'],
    queryFn: async (): Promise<SessionUserDto | null> => {
      const response = await fetch('/api/me', {
        credentials: 'include',
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`request failed: ${response.status}`);
      }

      return response.json() as Promise<SessionUserDto>;
    },
  });

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionQuery = useSessionUser();

  const onLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    await queryClient.invalidateQueries({ queryKey: ['session-user'] });
    navigate('/login');
  };

  return (
    <div className='app-shell'>
      <div className='app-shell-orb app-shell-orb-a' />
      <div className='app-shell-orb app-shell-orb-b' />
      <header className='app-header'>
        <div className='app-logo'>
          <span className='app-logo-mark'>RING</span>
          <p>R&amp;D INformation Guard</p>
        </div>
        <nav className='app-nav'>
          <Link to='/notifications'>공고알림</Link>
          <Link to='/profiles'>검색조건</Link>
          <Link to='/schedule'>검색주기</Link>
          {sessionQuery.data?.isAdmin ? <Link to='/admin'>Admin</Link> : null}
          {sessionQuery.data && !sessionQuery.data.isAdmin ? <Link to='/account/password'>비밀번호 변경</Link> : null}
          {sessionQuery.data ? (
            <>
              <span className='app-nav-user'>{sessionQuery.data.name}</span>
              <button type='button' className='app-nav-button' onClick={onLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <Link to='/login'>로그인</Link>
          )}
        </nav>
      </header>
      <main className='app-main'>{children}</main>
    </div>
  );
};

const RootRedirect = () => {
  const sessionQuery = useSessionUser();

  if (sessionQuery.isLoading) {
    return null;
  }

  return <Navigate to={sessionQuery.data ? '/notifications' : '/login'} replace />;
};

const ProtectedRoutes = () => {
  const location = useLocation();
  const sessionQuery = useSessionUser();

  if (sessionQuery.isLoading) {
    return null;
  }

  if (!sessionQuery.data) {
    return <Navigate to='/login' replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

const AdminOnlyRoute = () => {
  const sessionQuery = useSessionUser();

  if (sessionQuery.isLoading) {
    return null;
  }

  if (!sessionQuery.data?.isAdmin) {
    return <Navigate to='/notifications' replace />;
  }

  return <Outlet />;
};

const NonAdminOnlyRoute = () => {
  const sessionQuery = useSessionUser();

  if (sessionQuery.isLoading) {
    return null;
  }

  if (!sessionQuery.data || sessionQuery.data.isAdmin) {
    return <Navigate to='/notifications' replace />;
  }

  return <Outlet />;
};

export const AppRouter = () => (
  <Layout>
    <Routes>
      <Route path='/' element={<RootRedirect />} />
      <Route path='/login' element={<LoginPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route path='/notifications' element={<NotificationListPage />} />
        <Route path='/notifications/:notificationId' element={<NotificationDetailPage />} />
        <Route path='/profiles' element={<ProfileListPage />} />
        <Route path='/profiles/new' element={<ProfileDetailPage />} />
        <Route path='/profiles/:profileId' element={<ProfileDetailPage />} />
        <Route path='/schedule' element={<SchedulePage />} />
        <Route element={<NonAdminOnlyRoute />}>
          <Route path='/account/password' element={<ChangePasswordPage />} />
        </Route>
        <Route element={<AdminOnlyRoute />}>
          <Route path='/admin' element={<AdminPage />} />
          <Route path='/admin/users/:userId' element={<AdminUserDetailPage />} />
        </Route>
      </Route>
    </Routes>
  </Layout>
);
