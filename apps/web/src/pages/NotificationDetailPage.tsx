import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import type { NotificationDetailDto } from '@ring/types';
import { apiFetch } from '../lib/api-client.js';
import { NotificationDetailPanel } from './notifications-ui.js';

export const NotificationDetailPage = () => {
  const params = useParams();
  const query = useQuery({
    queryKey: ['notification', params.notificationId],
    queryFn: () => apiFetch(`/api/notifications/${params.notificationId}`) as Promise<NotificationDetailDto>,
    enabled: Boolean(params.notificationId),
  });

  if (query.isLoading) {
    return <div className='empty-detail standalone-detail'>Loading detail...</div>;
  }

  if (query.isError || !query.data) {
    return <div className='empty-detail standalone-detail'>Failed to load detail.</div>;
  }

  return (
    <div className='standalone-detail'>
      <NotificationDetailPanel detail={query.data} backLink='/notifications' />
    </div>
  );
};
