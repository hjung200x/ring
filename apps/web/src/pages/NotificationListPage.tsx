import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  return (
    <section className='notifications-shell'>
      <header className='notifications-header'>
        <div className='notifications-brand'>
          <span className='notifications-brand-mark'>R</span>
          <div>
            <h1>Notifications</h1>
            <p>Interest-matched KEIT notices, ranked and ready to review.</p>
          </div>
        </div>
        <div className='notifications-filterbar'>
          <button
            type='button'
            className={`filter-chip ${filter === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type='button'
            className={`filter-chip ${filter === 'unread' ? 'is-active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
          <button
            type='button'
            className={`filter-chip ${filter === 'read' ? 'is-active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read
          </button>
        </div>
      </header>

      <div className='notifications-main'>
        <div className='notifications-list-pane'>
          <div className='notifications-list-chrome'>
            <div>
              <strong>{items.length}</strong>
              <span> matched notices</span>
            </div>
            <span className='list-hint'>Newest first</span>
          </div>

          {listQuery.isLoading ? <div className='empty-state'>Loading notifications...</div> : null}
          {listQuery.isError ? <div className='empty-state'>Failed to load notifications.</div> : null}
          {!listQuery.isLoading && !listQuery.isError && items.length === 0 ? (
            <div className='empty-state empty-state-illustrated'>
              <p>No notices matched the current profile yet.</p>
            </div>
          ) : null}

          <div className='notifications-list'>
            {items.map((item) => (
              <NotificationListCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        </div>

        <div className='notifications-detail-pane'>
          {detailQuery.isLoading ? <div className='empty-detail'>Loading detail...</div> : null}
          {detailQuery.isError ? <div className='empty-detail'>Failed to load detail.</div> : null}
          {!selectedId && !detailQuery.isLoading ? (
            <div className='empty-detail empty-state-illustrated'>
              <p>Select a notice to inspect it.</p>
            </div>
          ) : null}
          {detailQuery.data ? <NotificationDetailPanel detail={detailQuery.data} /> : null}
        </div>
      </div>
    </section>
  );
};
