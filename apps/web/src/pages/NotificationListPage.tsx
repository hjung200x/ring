import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationDetailDto, NotificationListItemDto } from '@ring/types';
import { apiFetch } from '../lib/api-client.js';
import { NotificationDetailPanel, NotificationListCard } from './notifications-ui.js';

interface NotificationListResponse {
  page: number;
  items: NotificationListItemDto[];
}

export const NotificationListPage = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => {
      const suffix = filter === 'all' ? '' : `?isRead=${filter === 'read'}`;
      return apiFetch(`/api/notifications${suffix}`) as Promise<NotificationListResponse>;
    },
  });

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const detailQuery = useQuery({
    queryKey: ['notification', selectedId],
    queryFn: () => apiFetch(`/api/notifications/${selectedId}`) as Promise<NotificationDetailDto>,
    enabled: Boolean(selectedId),
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) =>
      apiFetch(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
    onSuccess: async (_, deletedId) => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notification', deletedId] });
      if (selectedId === deletedId) {
        setSelectedId(null);
      }
    },
  });

  const handleDelete = (notificationId: string) => {
    if (!window.confirm('이 공고알림을 삭제하시겠습니까?')) return;
    deleteMutation.mutate(notificationId);
  };

  return (
    <section className='notifications-shell'>
      <header className='notifications-header'>
        <div className='notifications-brand'>
          <span className='notifications-brand-mark'>R</span>
          <div>
            <h1>{'\uC54C\uB9BC'}</h1>
            <p>{'\uB4F1\uB85D\uB41C \uACF5\uD1B5 \uAC80\uC0C9\uC870\uAC74\uC5D0 \uB9DE\uB294 KEIT \uACF5\uACE0\uB9CC \uC120\uBCC4\uD574\uC11C \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.'}</p>
          </div>
        </div>
        <div className='notifications-filterbar'>
          <button type='button' className={`filter-chip ${filter === 'all' ? 'is-active' : ''}`} onClick={() => setFilter('all')}>
            {'\uC804\uCCB4'}
          </button>
          <button type='button' className={`filter-chip ${filter === 'unread' ? 'is-active' : ''}`} onClick={() => setFilter('unread')}>
            {'\uC548\uC77D\uC74C'}
          </button>
          <button type='button' className={`filter-chip ${filter === 'read' ? 'is-active' : ''}`} onClick={() => setFilter('read')}>
            {'\uC77D\uC74C'}
          </button>
        </div>
      </header>

      <div className='notifications-main'>
        <div className='notifications-list-pane'>
          <div className='notifications-list-chrome'>
            <div>
              <strong>{items.length}</strong>
              <span>{'\uAC1C\uC758 \uACF5\uD1B5 \uB9E4\uCE6D \uACF5\uACE0'}</span>
            </div>
            <span className='list-hint'>{'\uCD5C\uC2E0\uC21C'}</span>
          </div>

          {listQuery.isLoading ? <div className='empty-state'>{'\uC54C\uB9BC\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4...'}</div> : null}
          {listQuery.isError ? <div className='empty-state'>{'\uC54C\uB9BC\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.'}</div> : null}
          {!listQuery.isLoading && !listQuery.isError && items.length === 0 ? (
            <div className='empty-state empty-state-illustrated'>
              <p>{'\uAC80\uC0C9 \uC870\uAC74\uC5D0 \uB9DE\uB294 \uACF5\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.'}</p>
            </div>
          ) : null}

          <div className='notifications-list'>
            {items.map((item) => (
              <NotificationListCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={setSelectedId}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        <div className='notifications-detail-pane'>
          {detailQuery.isLoading ? <div className='empty-detail'>{'\uC0C1\uC138 \uB0B4\uC6A9\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4...'}</div> : null}
          {detailQuery.isError ? <div className='empty-detail'>{'\uC0C1\uC138 \uB0B4\uC6A9\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.'}</div> : null}
          {!selectedId && !detailQuery.isLoading ? (
            <div className='empty-detail empty-state-illustrated'>
              <p>{'\uBAA9\uB85D\uC5D0\uC11C \uACF5\uACE0\uB97C \uC120\uD0DD\uD558\uBA74 \uC0C1\uC138 \uB0B4\uC6A9\uC744 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.'}</p>
            </div>
          ) : null}
          {detailQuery.data ? <NotificationDetailPanel detail={detailQuery.data} onDelete={handleDelete} /> : null}
        </div>
      </div>
    </section>
  );
};

