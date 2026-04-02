import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api-client.js';

interface ProfileDetail {
  id: string;
  name: string;
  description: string;
  includeKeywordsJson: string[];
  excludeKeywordsJson: string[];
  similarityThreshold: number;
  enabled: boolean;
}

const DEFAULT_THRESHOLD = '0.60';

const toKeywordText = (items: string[]) => items.join(', ');
const toKeywords = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const ProfileDetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !params.profileId || params.profileId === 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [includeKeywords, setIncludeKeywords] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState('');
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState('');

  const query = useQuery({
    queryKey: ['profile', params.profileId],
    queryFn: () => apiFetch(`/api/profiles/${params.profileId}`) as Promise<ProfileDetail>,
    enabled: !isNew && Boolean(params.profileId),
  });

  useEffect(() => {
    if (isNew) {
      setName('');
      setDescription('');
      setIncludeKeywords('');
      setExcludeKeywords('');
      setThreshold(DEFAULT_THRESHOLD);
      setEnabled(true);
      return;
    }

    if (!query.data) return;
    setName(query.data.name);
    setDescription(query.data.description);
    setIncludeKeywords(toKeywordText(query.data.includeKeywordsJson ?? []));
    setExcludeKeywords(toKeywordText(query.data.excludeKeywordsJson ?? []));
    setThreshold(String(query.data.similarityThreshold));
    setEnabled(query.data.enabled);
  }, [isNew, query.data]);

  const createMutation = useMutation({
    mutationFn: async () =>
      (apiFetch('/api/profiles', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          includeKeywords: toKeywords(includeKeywords),
          excludeKeywords: toKeywords(excludeKeywords),
          similarityThreshold: Number(threshold),
          enabled,
        }),
      }) as Promise<ProfileDetail>),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      navigate(`/profiles/${created.id}`);
    },
    onError: () => setStatus('검색조건 추가에 실패했습니다.'),
  });

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/profiles/${params.profileId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description,
          includeKeywords: toKeywords(includeKeywords),
          excludeKeywords: toKeywords(excludeKeywords),
          similarityThreshold: Number(threshold),
          enabled,
        }),
      }),
    onSuccess: async () => {
      setStatus('검색조건을 저장했습니다.');
      await queryClient.invalidateQueries({ queryKey: ['profile', params.profileId] });
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: () => setStatus('검색조건 저장에 실패했습니다.'),
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/profiles/${params.profileId}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.removeQueries({ queryKey: ['profile', params.profileId] });
      navigate('/profiles');
    },
    onError: () => setStatus('검색조건 삭제에 실패했습니다.'),
  });

  const pageTitle = useMemo(
    () => (isNew ? '새 검색조건' : query.data?.name ?? '검색조건'),
    [isNew, query.data?.name],
  );

  if (!isNew && query.isLoading) {
    return <section className='panel-surface'>{'검색조건을 불러오는 중입니다...'}</section>;
  }

  if (!isNew && (query.isError || !query.data)) {
    return <section className='panel-surface'>{'검색조건을 불러오지 못했습니다.'}</section>;
  }

  return (
    <section className='panel-surface profile-detail-surface'>
      <Link to='/profiles' className='back-link profile-back-link'>
        {'검색조건 목록으로 돌아가기'}
      </Link>

      <div className='profile-settings-header'>
        <div>
          <h1>{pageTitle}</h1>
          <p className='login-subcopy'>
            {isNew
              ? '새 검색조건을 만들고 관심 주제를 따로 관리할 수 있습니다.'
              : '검색조건 설명과 키워드만으로 공고를 판정합니다. 수동 예시 공고문은 사용하지 않습니다.'}
          </p>
        </div>
        {!isNew ? (
          <span className={`profile-state-badge ${enabled ? 'is-enabled' : 'is-disabled'}`}>
            {enabled ? '활성' : '비활성'}
          </span>
        ) : null}
      </div>

      <div className='profile-settings-grid profile-settings-grid-single'>
        <section className='profile-section-card'>
          <h2>{'기본 설정'}</h2>
          <label className='settings-field'>
            <span>{'검색조건 이름'}</span>
            <input className='panel-input' value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className='settings-field'>
            <span>{'설명'}</span>
            <textarea
              className='panel-textarea'
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <label className='settings-field'>
            <span>{'포함 키워드'}</span>
            <textarea
              className='panel-textarea'
              rows={3}
              value={includeKeywords}
              onChange={(event) => setIncludeKeywords(event.target.value)}
            />
            <small>{'쉼표로 구분합니다.'}</small>
          </label>
          <label className='settings-field'>
            <span>{'제외 키워드'}</span>
            <textarea
              className='panel-textarea'
              rows={3}
              value={excludeKeywords}
              onChange={(event) => setExcludeKeywords(event.target.value)}
            />
            <small>{'쉼표로 구분합니다.'}</small>
          </label>
          <div className='settings-inline-grid'>
            <label className='settings-field'>
              <span>{'유사도 임계값'}</span>
              <input
                className='panel-input'
                type='number'
                min='0'
                max='1'
                step='0.01'
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
              />
            </label>
            <label className='settings-checkbox'>
              <input type='checkbox' checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              <span>{'검색조건 활성화'}</span>
            </label>
          </div>
          <button
            type='button'
            className='panel-button'
            onClick={() => (isNew ? createMutation.mutate() : saveMutation.mutate())}
            disabled={(isNew ? createMutation.isPending : saveMutation.isPending) || !name.trim() || !description.trim()}
          >
            {isNew
              ? createMutation.isPending
                ? '추가 중...'
                : '검색조건 추가'
              : saveMutation.isPending
                ? '저장 중...'
                : '설정 저장'}
          </button>
          {!isNew ? (
            <button
              type='button'
              className='secondary-action profile-delete-button'
              onClick={() => {
                if (!window.confirm(`"${name}" 검색조건을 삭제하시겠습니까?`)) return;
                deleteProfileMutation.mutate();
              }}
              disabled={deleteProfileMutation.isPending}
            >
              {deleteProfileMutation.isPending ? '삭제 중...' : '검색조건 삭제'}
            </button>
          ) : null}
        </section>
      </div>

      {status ? <p className='profile-status-message'>{status}</p> : null}
    </section>
  );
};
