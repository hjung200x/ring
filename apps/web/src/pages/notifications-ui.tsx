import { Link } from 'react-router-dom';
import type { NotificationDetailDto, NotificationListItemDto } from '@ring/types';

const scoreLabel = (score: number) => {
  if (score >= 0.68) return '높음';
  if (score >= 0.55) return '보통';
  return '낮음';
};

const scoreClass = (score: number) => {
  if (score >= 0.7) return 'score-badge score-badge-high';
  if (score >= 0.58) return 'score-badge score-badge-medium';
  return 'score-badge score-badge-low';
};

const formatDate = (value: string | null) => {
  if (!value) return '미정';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR');
};

const summarizeReason = (detail: NotificationDetailDto) => {
  const parts: string[] = [];

  if (detail.reason.includeHits.length > 0) {
    parts.push(`매칭 키워드: ${detail.reason.includeHits.join(', ')}`);
  }
  if (detail.reason.profileSimilarity !== null) {
    parts.push(`검색조건 유사도 ${detail.reason.profileSimilarity.toFixed(3)}`);
  }

  return parts.length > 0 ? parts.join(' · ') : '현재 검색조건 기준으로 매칭된 공고입니다.';
};

const summaryPreview = (text: string) => {
  const singleLine = text.replace(/\s+/g, ' ').trim();
  return singleLine.length > 180 ? `${singleLine.slice(0, 180)}...` : singleLine;
};

export const notificationListMeta = {
  scoreLabel,
  scoreClass,
  formatDate,
  summaryPreview,
};

export const NotificationListCard = ({
  item,
  selected,
  onSelect,
  onDelete,
}: {
  item: NotificationListItemDto;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const isDeadlineImminent =
    item.applyEndAt !== null && new Date(item.applyEndAt).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 7;

  return (
    <button
      type='button'
      className={`notification-card ${selected ? 'is-selected' : ''} ${item.isRead ? 'is-read' : 'is-unread'}`}
      onClick={() => onSelect(item.id)}
    >
      <span className='notification-card-rail' />
      <div className='notification-card-meta'>
        <div className='notification-card-badges'>
          <span className={scoreClass(item.finalScore)}>
            {scoreLabel(item.finalScore)} {item.finalScore.toFixed(3)}
          </span>
          <span className='profile-badge'>{item.profileName}</span>
          {isDeadlineImminent ? <span className='deadline-badge'>{'마감임박'}</span> : null}
        </div>
        <div className='notification-card-meta-side'>
          <span className='meta-date'>{formatDate(item.createdAt)}</span>
          <button
            type='button'
            className='icon-action-button'
            aria-label='알림 삭제'
            title='알림 삭제'
            onClick={(event) => {
              event.stopPropagation();
              onDelete(item.id);
            }}
          >
            <svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
              <path d='M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm1 11a2 2 0 0 1-2-2V7h12v11a2 2 0 0 1-2 2H8Z' />
            </svg>
          </button>
        </div>
      </div>
      <h3 className='notification-card-title'>{item.title}</h3>
      <p className='notification-card-summary'>{summaryPreview(item.summary)}</p>
      <div className='notification-card-footer'>
        <span className='notification-card-period'>
          {'마감'} {item.applyEndAt ? formatDate(item.applyEndAt) : '상시'}
        </span>
        <span className='notification-card-action'>{'상세 보기'}</span>
      </div>
    </button>
  );
};

export const NotificationDetailPanel = ({
  detail,
  backLink,
  onDelete,
}: {
  detail: NotificationDetailDto;
  backLink?: string;
  onDelete?: (id: string) => void;
}) => (
  <section className='notification-detail-panel'>
    {backLink ? (
      <div className='notification-detail-mobile-top'>
        <Link to={backLink} className='back-link'>
          {'알림 목록으로 돌아가기'}
        </Link>
      </div>
    ) : null}

    <div className='notification-detail-scroll'>
      <div className='detail-hero'>
        <div className='detail-hero-glow detail-hero-glow-a' />
        <div className='detail-hero-glow detail-hero-glow-b' />
        <div className='detail-hero-top'>
          <div className='detail-badges'>
            <span className={scoreClass(detail.reason.finalScore)}>
              {'추천 점수'} {scoreLabel(detail.reason.finalScore)} {detail.reason.finalScore.toFixed(3)}
            </span>
          </div>
          {onDelete ? (
            <button
              type='button'
              className='icon-action-button detail-delete-button'
              aria-label='알림 삭제'
              title='알림 삭제'
              onClick={() => onDelete(detail.id)}
            >
              <svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
                <path d='M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm1 11a2 2 0 0 1-2-2V7h12v11a2 2 0 0 1-2 2H8Z' />
              </svg>
            </button>
          ) : null}
        </div>
        <h1 className='detail-title'>{detail.title}</h1>
        <div className='detail-meta-grid'>
          <div className='detail-meta-card'>
            <span className='detail-meta-label'>{'접수 기간'}</span>
            <strong>
              {formatDate(detail.source.applyStartAt)} - {formatDate(detail.source.applyEndAt)}
            </strong>
          </div>
          <div className='detail-meta-card'>
            <span className='detail-meta-label'>{'등록일'}</span>
            <strong>{formatDate(detail.source.postedAt)}</strong>
          </div>
        </div>
      </div>

      <div className='detail-section detail-section-accent'>
        <div className='detail-section-header'>
          <span className='detail-section-kicker'>{'선정 이유'}</span>
          <h2>{'추천 근거'}</h2>
        </div>
        <p className='detail-lead'>{summarizeReason(detail)}</p>
        {detail.reason.includeHits.length > 0 ? (
          <div className='keyword-row'>
            {detail.reason.includeHits.map((keyword) => (
              <span key={keyword} className='keyword-pill'>
                {keyword}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className='detail-section'>
        <div className='detail-section-header'>
          <span className='detail-section-kicker'>{'공고 요약'}</span>
          <h2>{'요약'}</h2>
        </div>
        <p className='detail-summary'>{detail.summary}</p>
      </div>
    </div>

    <div className='detail-footer'>
      <a className='primary-action' href={detail.source.detailUrl} target='_blank' rel='noreferrer'>
        {'원문 공고 보기'}
      </a>
    </div>
  </section>
);
