import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api-client.js';

export const ProfileDetailPage = () => {
  const params = useParams();
  const query = useQuery({
    queryKey: ['profile', params.profileId],
    queryFn: () => apiFetch(`/api/profiles/${params.profileId}`) as Promise<Record<string, unknown>>,
    enabled: Boolean(params.profileId),
  });

  return (
    <section className='panel-surface'>
      <h1>Profile detail</h1>
      <pre>{JSON.stringify(query.data, null, 2)}</pre>
    </section>
  );
};
