import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api-client.js';

interface ProfileSummary {
  id: string;
  name: string;
  similarityThreshold: string | number;
  enabled: boolean;
}

export const ProfileListPage = () => {
  const query = useQuery({
    queryKey: ['profiles'],
    queryFn: () => apiFetch('/api/profiles') as Promise<ProfileSummary[]>,
  });

  const items = useMemo(() => query.data ?? [], [query.data]);

  return (
    <section className='panel-surface'>
      <div className='profile-list-header'>
        <div>
          <h1>{'\uAC80\uC0C9\uC870\uAC74'}</h1>
          <p className='login-subcopy'>
            {'\uAC80\uC0C9\uC870\uAC74\uC740 \uC2DC\uC2A4\uD15C \uC804\uCCB4\uC5D0 \uACF5\uD1B5\uC73C\uB85C \uC801\uC6A9\uB429\uB2C8\uB2E4. \uB4F1\uB85D\uB41C \uBAA8\uB4E0 \uACC4\uC815\uC774 \uAC19\uC740 \uAC80\uC0C9\uC870\uAC74\uC744 \uD568\uAED8 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.'}
          </p>
        </div>
      </div>

      <div className='profile-list'>
        {items.map((profile) => (
          <article key={profile.id} className='profile-card'>
            <Link to={`/profiles/${profile.id}`}>{profile.name}</Link>
            <small>
              {'\uC784\uACC4\uAC12'} {Number(profile.similarityThreshold).toFixed(2)} {' · '}
              {profile.enabled ? '\uD65C\uC131' : '\uBE44\uD65C\uC131'}
            </small>
          </article>
        ))}
      </div>

      <Link to='/profiles/new' className='profile-add-tile'>
        <span className='profile-add-icon' aria-hidden='true'>
          <svg viewBox='0 0 24 24' role='img' focusable='false'>
            <path d='M12 5v14M5 12h14' />
          </svg>
        </span>
        <span>{'\uAC80\uC0C9\uC870\uAC74 \uCD94\uAC00'}</span>
      </Link>
    </section>
  );
};

