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
      <h1>{'\uD504\uB85C\uD544'}</h1>
      <p className='login-subcopy'>
        {'\uD504\uB85C\uD544\uC740 \uC5EC\uB7EC \uAC1C \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD504\uB85C\uD544\uB9C8\uB2E4 \uD0A4\uC6CC\uB4DC, \uC124\uBA85, \uC608\uC2DC \uACF5\uACE0\uBB38\uC744 \uB530\uB85C \uAC00\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'}
      </p>
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
    </section>
  );
};
