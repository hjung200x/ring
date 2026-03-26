import { Link } from 'react-router-dom';
import type { NotificationDetailDto, NotificationListItemDto } from '@ring/types';

const scoreLabel = (score: number) => {
  if (score >= 0.82) return 'High';
  if (score >= 0.65) return 'Medium';
  return 'Low';
};

const scoreClass = (score: number) => {
  if (score >= 0.82) return 'score-badge score-badge-high';
  if (score >= 0.65) return 'score-badge score-badge-medium';
  return 'score-badge score-badge-low';
};

const formatDate = (value: string | null) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR');
};

const summarizeReason = (detail: NotificationDetailDto) => {
  const parts: string[] = [];

  if (detail.reason.includeHits.length > 0) {
    parts.push(`Matched keywords: ${detail.reason.includeHits.join(', ')}`);
  }
  if (detail.reason.profileSimilarity !== null) {
    parts.push(`Profile similarity ${detail.reason.profileSimilarity.toFixed(3)}`);
  }
  if (detail.reason.exampleMaxSimilarity !== null) {
    parts.push(`Example similarity ${detail.reason.exampleMaxSimilarity.toFixed(3)}`);
  }

  return parts.length > 0 ? parts.join(' ¡¤ ') : 'Matched by the current interest profile.';
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
}: {
  item: NotificationListItemDto;
  selected: boolean;
  onSelect: (id: string) => void;
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
          {isDeadlineImminent ? <span className='deadline-badge'>Closing soon</span> : null}
        </div>
        <span className='meta-date'>{formatDate(item.createdAt)}</span>
      </div>
      <h3 className='notification-card-title'>{item.title}</h3>
      <p className='notification-card-summary'>{summaryPreview(item.summary)}</p>
      <div className='notification-card-footer'>
        <span className='notification-card-period'>
          Deadline {item.applyEndAt ? formatDate(item.applyEndAt) : 'Open-ended'}
        </span>
        <span className='notification-card-action'>Open detail</span>
      </div>
    </button>
  );
};

export const NotificationDetailPanel = ({
  detail,
  backLink,
}: {
  detail: NotificationDetailDto;
  backLink?: string;
}) => (
  <section className='notification-detail-panel'>
    {backLink ? (
      <div className='notification-detail-mobile-top'>
        <Link to={backLink} className='back-link'>
          Back to notifications
        </Link>
      </div>
    ) : null}

    <div className='notification-detail-scroll'>
      <div className='detail-hero'>
        <div className='detail-hero-glow detail-hero-glow-a' />
        <div className='detail-hero-glow detail-hero-glow-b' />
        <div className='detail-badges'>
          <span className={scoreClass(detail.reason.finalScore)}>
            Recommendation {scoreLabel(detail.reason.finalScore)} {detail.reason.finalScore.toFixed(3)}
          </span>
        </div>
        <h1 className='detail-title'>{detail.title}</h1>
        <div className='detail-meta-grid'>
          <div className='detail-meta-card'>
            <span className='detail-meta-label'>Application</span>
            <strong>
              {formatDate(detail.source.applyStartAt)} - {formatDate(detail.source.applyEndAt)}
            </strong>
          </div>
          <div className='detail-meta-card'>
            <span className='detail-meta-label'>Posted</span>
            <strong>{formatDate(detail.source.postedAt)}</strong>
          </div>
        </div>
      </div>

      <div className='detail-section detail-section-accent'>
        <div className='detail-section-header'>
          <span className='detail-section-kicker'>Why ring selected this</span>
          <h2>Recommendation signal</h2>
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
          <span className='detail-section-kicker'>Notice summary</span>
          <h2>Summary</h2>
        </div>
        <p className='detail-summary'>{detail.summary}</p>
      </div>
    </div>

    <div className='detail-footer'>
      <a className='primary-action' href={detail.source.detailUrl} target='_blank' rel='noreferrer'>
        Open source notice
      </a>
      <button type='button' className='secondary-action'>
        Save as example
      </button>
    </div>
  </section>
);
