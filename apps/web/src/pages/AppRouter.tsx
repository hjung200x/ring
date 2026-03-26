import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api-client.js';
import { LoginPage } from './LoginPage.js';
import { NotificationListPage } from './NotificationListPage.js';
import { NotificationDetailPage } from './NotificationDetailPage.js';
import { ProfileListPage } from './ProfileListPage.js';
import { ProfileDetailPage } from './ProfileDetailPage.js';

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

const useSessionUser = () =>
  useQuery({
    queryKey: ['session-user'],
    queryFn: async (): Promise<SessionUser | null> => {
      const response = await fetch('/api/me', {
        credentials: 'include',
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`request failed: ${response.status}`);
      }

      return response.json() as Promise<SessionUser>;
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
          <Link to='/notifications'>{'\uACF5\uACE0\uC54C\uB9BC'}</Link>
          <Link to='/profiles'>{'\uAC80\uC0C9\uC870\uAC74'}</Link>
          {sessionQuery.data ? (
            <>
              <span className='app-nav-user'>{sessionQuery.data.name}</span>
              <button type='button' className='app-nav-button' onClick={onLogout}>
                {'\uB85C\uADF8\uC544\uC6C3'}
              </button>
            </>
          ) : (
            <Link to='/login'>{'\uB85C\uADF8\uC778'}</Link>
          )}
        </nav>
      </header>
      <main className='app-main'>{children}</main>
    </div>
  );
};

export const AppRouter = () => (
  <Layout>
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/notifications' element={<NotificationListPage />} />
      <Route path='/notifications/:notificationId' element={<NotificationDetailPage />} />
      <Route path='/profiles' element={<ProfileListPage />} />
      <Route path='/profiles/new' element={<ProfileDetailPage />} />
      <Route path='/profiles/:profileId' element={<ProfileDetailPage />} />
    </Routes>
  </Layout>
);
