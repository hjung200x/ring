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
    return <div className='empty-detail standalone-detail'>상세 내용을 불러오는 중입니다...</div>;
  }

  if (query.isError || !query.data) {
    return <div className='empty-detail standalone-detail'>상세 내용을 불러오지 못했습니다.</div>;
  }

  return (
    <div className='standalone-detail'>
      <NotificationDetailPanel detail={query.data} backLink='/notifications' />
    </div>
  );
};
