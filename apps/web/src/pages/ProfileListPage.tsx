import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api-client.js';

interface ProfileSummary {
  id: string;
  name: string;
  similarityThreshold: string | number;
}

export const ProfileListPage = () => {
  const query = useQuery({
    queryKey: ['profiles'],
    queryFn: () => apiFetch('/api/profiles') as Promise<ProfileSummary[]>,
  });

  return (
    <section className='panel-surface'>
      <h1>Profiles</h1>
      <p className='login-subcopy'>Interest profiles define which notices ring keeps and ranks for you.</p>
      <div className='profile-list'>
        {query.data?.map((profile) => (
          <article key={profile.id} className='profile-card'>
            <Link to={`/profiles/${profile.id}`}>{profile.name}</Link>
            <small>Threshold {Number(profile.similarityThreshold).toFixed(2)}</small>
          </article>
        ))}
      </div>
    </section>
  );
};
