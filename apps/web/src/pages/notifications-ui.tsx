import { Link } from 'react-router-dom';
import type { NotificationDetailDto, NotificationListItemDto } from '@ring/types';

const scoreLabel = (score: number) => {
  if (score >= 0.82) return '\uB192\uC74C';
  if (score >= 0.65) return '\uBCF4\uD1B5';
  return '\uB0AE\uC74C';
};

const scoreClass = (score: number) => {
  if (score >= 0.82) return 'score-badge score-badge-high';
  if (score >= 0.65) return 'score-badge score-badge-medium';
  return 'score-badge score-badge-low';
};

const formatDate = (value: string | null) => {
  if (!value) return '\uBBF8\uC815';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR');
};

const summarizeReason = (detail: NotificationDetailDto) => {
  const parts: string[] = [];

  if (detail.reason.includeHits.length > 0) {
    parts.push(`\uB9E4\uCE6D \uD0A4\uC6CC\uB4DC: ${detail.reason.includeHits.join(', ')}`);
  }
  if (detail.reason.profileSimilarity !== null) {
    parts.push(`\uD504\uB85C\uD544 \uC720\uC0AC\uB3C4 ${detail.reason.profileSimilarity.toFixed(3)}`);
  }
  if (detail.reason.exampleMaxSimilarity !== null) {
    parts.push(`\uC608\uC2DC \uC720\uC0AC\uB3C4 ${detail.reason.exampleMaxSimilarity.toFixed(3)}`);
  }

  return parts.length > 0 ? parts.join(' · ') : '\uD604\uC7AC \uAD00\uC2EC \uD504\uB85C\uD544 \uAE30\uC900\uC73C\uB85C \uB9E4\uCE6D\uB41C \uACF5\uACE0\uC785\uB2C8\uB2E4.';
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
          {isDeadlineImminent ? <span className='deadline-badge'>{'\uB9C8\uAC10\uC784\uBC15'}</span> : null}
        </div>
        <span className='meta-date'>{formatDate(item.createdAt)}</span>
      </div>
      <h3 className='notification-card-title'>{item.title}</h3>
      <p className='notification-card-summary'>{summaryPreview(item.summary)}</p>
      <div className='notification-card-footer'>
        <span className='notification-card-period'>
          {'\uB9C8\uAC10'} {item.applyEndAt ? formatDate(item.applyEndAt) : '\uC0C1\uC2DC'}
        </span>
        <span className='notification-card-action'>{'\uC0C1\uC138 \uBCF4\uAE30'}</span>
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
          {'\uC54C\uB9BC \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30'}
        </Link>
      </div>
    ) : null}

    <div className='notification-detail-scroll'>
      <div className='detail-hero'>
        <div className='detail-hero-glow detail-hero-glow-a' />
        <div className='detail-hero-glow detail-hero-glow-b' />
        <div className='detail-badges'>
          <span className={scoreClass(detail.reason.finalScore)}>
            {'\uCD94\uCC9C \uC810\uC218'} {scoreLabel(detail.reason.finalScore)} {detail.reason.finalScore.toFixed(3)}
          </span>
        </div>
        <h1 className='detail-title'>{detail.title}</h1>
        <div className='detail-meta-grid'>
          <div className='detail-meta-card'>
            <span className='detail-meta-label'>{'\uC811\uC218 \uAE30\uAC04'}</span>
            <strong>
              {formatDate(detail.source.applyStartAt)} - {formatDate(detail.source.applyEndAt)}
            </strong>
          </div>
          <div className='detail-meta-card'>
            <span className='detail-meta-label'>{'\uB4F1\uB85D\uC77C'}</span>
            <strong>{formatDate(detail.source.postedAt)}</strong>
          </div>
        </div>
      </div>

      <div className='detail-section detail-section-accent'>
        <div className='detail-section-header'>
          <span className='detail-section-kicker'>{'\uC120\uC815 \uC774\uC720'}</span>
          <h2>{'\uCD94\uCC9C \uADFC\uAC70'}</h2>
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
          <span className='detail-section-kicker'>{'\uACF5\uACE0 \uC694\uC57D'}</span>
          <h2>{'\uC694\uC57D'}</h2>
        </div>
        <p className='detail-summary'>{detail.summary}</p>
      </div>
    </div>

    <div className='detail-footer'>
      <a className='primary-action' href={detail.source.detailUrl} target='_blank' rel='noreferrer'>
        {'\uC6D0\uBB38 \uACF5\uACE0 \uBCF4\uAE30'}
      </a>
    </div>
  </section>
);
