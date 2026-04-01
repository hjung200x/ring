import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { NotificationDetailDto } from '@ring/types';
import { apiFetch } from '../lib/api-client.js';
import { NotificationDetailPanel } from './notifications-ui.js';

export const NotificationDetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification', params.notificationId],
    queryFn: () => apiFetch(`/api/notifications/${params.notificationId}`) as Promise<NotificationDetailDto>,
    enabled: Boolean(params.notificationId),
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) =>
      apiFetch(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
    onSuccess: async (_, deletedId) => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notification', deletedId] });
      navigate('/notifications');
    },
  });

  const handleDelete = (notificationId: string) => {
    if (!window.confirm('이 공고알림을 삭제하시겠습니까?')) return;
    deleteMutation.mutate(notificationId);
  };

  if (query.isLoading) {
    return <div className='empty-detail standalone-detail'>상세 내용을 불러오는 중입니다...</div>;
  }

  if (query.isError || !query.data) {
    return <div className='empty-detail standalone-detail'>상세 내용을 불러오지 못했습니다.</div>;
  }

  return (
    <div className='standalone-detail'>
      <NotificationDetailPanel detail={query.data} backLink='/notifications' onDelete={handleDelete} />
    </div>
  );
};
