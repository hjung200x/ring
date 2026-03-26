import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api-client.js';

interface ProfileExample {
  id: string;
  sourceType: string;
  title: string;
  rawText: string;
  normalizedText: string;
  createdAt: string;
}

interface ProfileDetail {
  id: string;
  name: string;
  description: string;
  includeKeywordsJson: string[];
  excludeKeywordsJson: string[];
  similarityThreshold: number;
  enabled: boolean;
  examples: ProfileExample[];
}

const toKeywordText = (items: string[]) => items.join(', ');
const toKeywords = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const ProfileDetailPage = () => {
  const params = useParams();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [includeKeywords, setIncludeKeywords] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState('');
  const [threshold, setThreshold] = useState('0.82');
  const [enabled, setEnabled] = useState(true);
  const [exampleTitle, setExampleTitle] = useState('');
  const [exampleText, setExampleText] = useState('');
  const [status, setStatus] = useState('');

  const query = useQuery({
    queryKey: ['profile', params.profileId],
    queryFn: () => apiFetch(`/api/profiles/${params.profileId}`) as Promise<ProfileDetail>,
    enabled: Boolean(params.profileId),
  });

  useEffect(() => {
    if (!query.data) return;
    setName(query.data.name);
    setDescription(query.data.description);
    setIncludeKeywords(toKeywordText(query.data.includeKeywordsJson ?? []));
    setExcludeKeywords(toKeywordText(query.data.excludeKeywordsJson ?? []));
    setThreshold(String(query.data.similarityThreshold));
    setEnabled(query.data.enabled);
  }, [query.data]);

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
      setStatus('\uD504\uB85C\uD544\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.');
      await queryClient.invalidateQueries({ queryKey: ['profile', params.profileId] });
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: () => setStatus('\uD504\uB85C\uD544 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.'),
  });

  const addExampleMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/profiles/${params.profileId}/examples/manual-text`, {
        method: 'POST',
        body: JSON.stringify({
          title: exampleTitle,
          text: exampleText,
        }),
      }),
    onSuccess: async () => {
      setExampleTitle('');
      setExampleText('');
      setStatus('\uC608\uC2DC \uACF5\uACE0\uBB38\uC744 \uCD94\uAC00\uD588\uC2B5\uB2C8\uB2E4.');
      await queryClient.invalidateQueries({ queryKey: ['profile', params.profileId] });
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: () => setStatus('\uC608\uC2DC \uACF5\uACE0\uBB38 \uCD94\uAC00\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.'),
  });

  const deleteExampleMutation = useMutation({
    mutationFn: async (exampleId: string) =>
      apiFetch(`/api/profiles/${params.profileId}/examples/${exampleId}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      setStatus('\uC608\uC2DC \uACF5\uACE0\uBB38\uC744 \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4.');
      await queryClient.invalidateQueries({ queryKey: ['profile', params.profileId] });
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: () => setStatus('\uC608\uC2DC \uACF5\uACE0\uBB38 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.'),
  });

  if (query.isLoading) {
    return <section className='panel-surface'>{'\uD504\uB85C\uD544\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4...'}</section>;
  }

  if (query.isError || !query.data) {
    return <section className='panel-surface'>{'\uD504\uB85C\uD544\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.'}</section>;
  }

  return (
    <section className='panel-surface profile-detail-surface'>
      <Link to='/profiles' className='back-link profile-back-link'>
        {'\uD504\uB85C\uD544 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30'}
      </Link>

      <div className='profile-settings-header'>
        <div>
          <h1>{query.data.name}</h1>
          <p className='login-subcopy'>
            {'\uC0AC\uC6A9\uC790\uAC00 \uC9C1\uC811 \uBC14\uAFC0 \uC218 \uC788\uB294 \uD56D\uBAA9\uB9CC \uC124\uC815 \uD654\uBA74\uC73C\uB85C \uC81C\uACF5\uD569\uB2C8\uB2E4. \uD504\uB85C\uD544 \uADDC\uCE59, \uC784\uACC4\uAC12, \uC218\uB3D9 \uC608\uC2DC \uACF5\uACE0\uBB38\uC744 \uC218\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'}
          </p>
        </div>
        <span className={`profile-state-badge ${enabled ? 'is-enabled' : 'is-disabled'}`}>
          {enabled ? '\uD65C\uC131' : '\uBE44\uD65C\uC131'}
        </span>
      </div>

      <div className='profile-settings-grid'>
        <section className='profile-section-card'>
          <h2>{'\uAE30\uBCF8 \uC124\uC815'}</h2>
          <label className='settings-field'>
            <span>{'\uD504\uB85C\uD544 \uC774\uB984'}</span>
            <input className='panel-input' value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className='settings-field'>
            <span>{'\uC124\uBA85'}</span>
            <textarea className='panel-textarea' rows={6} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className='settings-field'>
            <span>{'\uD3EC\uD568 \uD0A4\uC6CC\uB4DC'}</span>
            <textarea className='panel-textarea' rows={3} value={includeKeywords} onChange={(event) => setIncludeKeywords(event.target.value)} />
            <small>{'\uC27C\uD45C\uB85C \uAD6C\uBD84\uD569\uB2C8\uB2E4.'}</small>
          </label>
          <label className='settings-field'>
            <span>{'\uC81C\uC678 \uD0A4\uC6CC\uB4DC'}</span>
            <textarea className='panel-textarea' rows={3} value={excludeKeywords} onChange={(event) => setExcludeKeywords(event.target.value)} />
            <small>{'\uC27C\uD45C\uB85C \uAD6C\uBD84\uD569\uB2C8\uB2E4.'}</small>
          </label>
          <div className='settings-inline-grid'>
            <label className='settings-field'>
              <span>{'\uC720\uC0AC\uB3C4 \uC784\uACC4\uAC12'}</span>
              <input className='panel-input' type='number' min='0' max='1' step='0.01' value={threshold} onChange={(event) => setThreshold(event.target.value)} />
            </label>
            <label className='settings-checkbox'>
              <input type='checkbox' checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              <span>{'\uD504\uB85C\uD544 \uD65C\uC131\uD654'}</span>
            </label>
          </div>
          <button type='button' className='panel-button' onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? '\uC800\uC7A5 \uC911...' : '\uC124\uC815 \uC800\uC7A5'}
          </button>
        </section>

        <section className='profile-section-card'>
          <h2>{'\uC218\uB3D9 \uC608\uC2DC \uACF5\uACE0\uBB38'}</h2>
          <p className='login-subcopy'>
            {'\uD55C \uD504\uB85C\uD544\uC5D0 \uC5EC\uB7EC \uAC1C\uC758 \uC608\uC2DC \uACF5\uACE0\uBB38\uC744 \uB458 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC774 \uC608\uC2DC\uB4E4\uC774 \uD574\uB2F9 \uD504\uB85C\uD544\uC758 \uB9E4\uCE6D \uC815\uD655\uB3C4\uB97C \uB192\uC5EC\uC90D\uB2C8\uB2E4.'}
          </p>
          <label className='settings-field'>
            <span>{'\uC608\uC2DC \uC81C\uBAA9'}</span>
            <input className='panel-input' value={exampleTitle} onChange={(event) => setExampleTitle(event.target.value)} />
          </label>
          <label className='settings-field'>
            <span>{'\uC608\uC2DC \uBCF8\uBB38'}</span>
            <textarea className='panel-textarea' rows={8} value={exampleText} onChange={(event) => setExampleText(event.target.value)} />
          </label>
          <button type='button' className='panel-button' onClick={() => addExampleMutation.mutate()} disabled={addExampleMutation.isPending || !exampleTitle.trim() || !exampleText.trim()}>
            {addExampleMutation.isPending ? '\uCD94\uAC00 \uC911...' : '\uC218\uB3D9 \uC608\uC2DC \uCD94\uAC00'}
          </button>

          <div className='profile-example-list'>
            {query.data.examples.map((example) => (
              <article key={example.id} className='profile-example-card'>
                <div className='profile-example-card-header'>
                  <div>
                    <strong>{example.title}</strong>
                    <small>{example.sourceType === 'manual_text' ? '\uC218\uB3D9 \uC785\uB825' : example.sourceType}</small>
                  </div>
                  <button type='button' className='profile-example-delete' onClick={() => deleteExampleMutation.mutate(example.id)} disabled={deleteExampleMutation.isPending}>
                    {'\uC0AD\uC81C'}
                  </button>
                </div>
                <p>{example.normalizedText || example.rawText}</p>
              </article>
            ))}
            {query.data.examples.length === 0 ? <p className='login-subcopy'>{'\uB4F1\uB85D\uB41C \uC608\uC2DC \uACF5\uACE0\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.'}</p> : null}
          </div>
        </section>
      </div>

      {status ? <p className='profile-status-message'>{status}</p> : null}
    </section>
  );
};
