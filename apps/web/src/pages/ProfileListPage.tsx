import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api-client.js';

interface ProfileSummary {
  id: string;
  name: string;
  similarityThreshold: string | number;
  enabled: boolean;
  examples: Array<{ id: string }>;
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
            {'\uAC80\uC0C9\uC870\uAC74\uC740 \uC5EC\uB7EC \uAC1C \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uAC01 \uAC80\uC0C9\uC870\uAC74\uB9C8\uB2E4 \uD0A4\uC6CC\uB4DC, \uC124\uBA85, \uC608\uC2DC \uACF5\uACE0\uBB38\uC744 \uB530\uB85C \uAC00\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'}
          </p>
        </div>
      </div>

      <div className='profile-list'>
        {items.map((profile) => (
          <article key={profile.id} className='profile-card'>
            <Link to={`/profiles/${profile.id}`}>{profile.name}</Link>
            <small>
              {'\uC784\uACC4\uAC12'} {Number(profile.similarityThreshold).toFixed(2)} {' · '}
              {profile.enabled ? '\uD65C\uC131' : '\uBE44\uD65C\uC131'} {' · '}
              {'\uC608\uC2DC'} {profile.examples.length}{'\uAC1C'}
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
