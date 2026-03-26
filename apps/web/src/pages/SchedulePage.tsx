import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUserDto, UserScheduleUnit } from '@ring/types';
import { apiFetch } from '../lib/api-client.js';

const ranges: Record<UserScheduleUnit, { min: number; max: number; help: string }> = {
  week: { min: 1, max: 7, help: '\u0031\uC8FC\uC5D0 \uBA87 \uD68C \uC2E4\uD589\uD560\uC9C0 \uC124\uC815\uD569\uB2C8\uB2E4.' },
  day: { min: 1, max: 12, help: '\u0031\uC77C\uC5D0 \uBA87 \uD68C \uC2E4\uD589\uD560\uC9C0 \uC124\uC815\uD569\uB2C8\uB2E4.' },
  hour: { min: 1, max: 24, help: '\uBA87 \uC2DC\uAC04\uB9C8\uB2E4 \uC2E4\uD589\uD560\uC9C0 \uC124\uC815\uD569\uB2C8\uB2E4.' },
};

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('ko-KR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '\uC544\uC9C1 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.';

export const SchedulePage = () => {
  const queryClient = useQueryClient();
  const [scheduleUnit, setScheduleUnit] = useState<UserScheduleUnit>('day');
  const [scheduleValue, setScheduleValue] = useState('1');
  const [status, setStatus] = useState('');

  const sessionQuery = useQuery({
    queryKey: ['session-user'],
    queryFn: () => apiFetch('/api/me') as Promise<SessionUserDto>,
  });

  useEffect(() => {
    if (!sessionQuery.data?.schedule) return;
    if (!(sessionQuery.data.schedule.scheduleUnit in ranges)) {
      console.warn('Unexpected schedule unit from /api/me', sessionQuery.data.schedule);
      setStatus('\uC8FC\uAE30 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uB3C4\uC911 \uC608\uC0C1\uD558\uC9C0 \uBABB\uD55C \uAC12\uC744 \uBC1B\uC558\uC2B5\uB2C8\uB2E4. \uAE30\uBCF8\uAC12\uC73C\uB85C \uD45C\uC2DC\uD569\uB2C8\uB2E4.');
      return;
    }
    setScheduleUnit(sessionQuery.data.schedule.scheduleUnit);
    setScheduleValue(String(sessionQuery.data.schedule.scheduleValue));
  }, [sessionQuery.data]);

  useEffect(() => {
    if (!status.startsWith('\uC8FC\uAE30 \uC124\uC815\uC744 \uC800\uC7A5')) {
      return;
    }

    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      const result = await queryClient.fetchQuery({
        queryKey: ['session-user'],
        queryFn: () => apiFetch('/api/me') as Promise<SessionUserDto>,
      });

      if (result.schedule.lastRunAt || attempts >= 10) {
        window.clearInterval(timer);
      }
    }, 1500);

    return () => window.clearInterval(timer);
  }, [queryClient, status]);

  const activeRange = ranges[scheduleUnit] ?? ranges.day;

  const saveScheduleMutation = useMutation({
    mutationFn: async () =>
      apiFetch('/api/me/schedule', {
        method: 'PATCH',
        body: JSON.stringify({
          scheduleUnit,
          scheduleValue: Number(scheduleValue),
        }),
      }),
    onSuccess: async () => {
      setStatus('\uC8FC\uAE30 \uC124\uC815\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uBC14\uB85C \uD55C \uBC88 \uB354 \uD655\uC778\uD569\uB2C8\uB2E4.');
      await queryClient.invalidateQueries({ queryKey: ['session-user'] });
    },
    onError: (error) => {
      console.error('Failed to save schedule', error);
      setStatus('\uC8FC\uAE30 \uC124\uC815 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
    },
  });

  return (
    <section className='panel-surface'>
      <div className='profile-list-header'>
        <div>
          <h1>{'\uAC80\uC0C9\uC8FC\uAE30'}</h1>
          <p className='login-subcopy'>
            {'\uAC80\uC0C9\uC8FC\uAE30\uB294 \uC2DC\uC2A4\uD15C \uC804\uCCB4\uC5D0 \uACF5\uD1B5\uC73C\uB85C \uC801\uC6A9\uB429\uB2C8\uB2E4. \uC800\uC7A5\uD558\uBA74 \uC989\uC2DC \uD55C \uBC88 \uB354 \uD655\uC778\uD569\uB2C8\uB2E4.'}
          </p>
        </div>
      </div>

      <section className='profile-section-card schedule-card schedule-page-card'>
        <h2>{'\uACF5\uACE0 \uD655\uC778 \uC8FC\uAE30'}</h2>
        <div className='schedule-grid'>
          <label className='settings-field'>
            <span>{'\uBC18\uBCF5 \uB2E8\uC704'}</span>
            <select className='panel-input' value={scheduleUnit} onChange={(event) => setScheduleUnit(event.target.value as UserScheduleUnit)}>
              <option value='week'>{'\uC8FC'}</option>
              <option value='day'>{'\uC77C'}</option>
              <option value='hour'>{'\uC2DC\uAC04'}</option>
            </select>
          </label>
          <label className='settings-field'>
            <span>{'\uD68C\uC218 / \uAC04\uACA9'}</span>
            <input
              className='panel-input'
              type='number'
              min={activeRange.min}
              max={activeRange.max}
              step='1'
              value={scheduleValue}
              onChange={(event) => setScheduleValue(event.target.value)}
            />
            <small>{activeRange.help}</small>
            <small>{`${activeRange.min} ~ ${activeRange.max}`}</small>
          </label>
        </div>
        <div className='schedule-meta'>
          <div className='detail-meta-card'>
            <span className='detail-meta-label'>{'\uB9C8\uC9C0\uB9C9 \uC2E4\uD589'}</span>
            <strong>{formatDateTime(sessionQuery.data?.schedule?.lastRunAt ?? null)}</strong>
          </div>
          <div className='detail-meta-card'>
            <span className='detail-meta-label'>{'\uB2E4\uC74C \uC608\uC815 \uC2DC\uAC01'}</span>
            <strong>{formatDateTime(sessionQuery.data?.schedule?.nextRunAt ?? null)}</strong>
          </div>
        </div>
        <button
          type='button'
          className='panel-button schedule-save-button'
          onClick={() => saveScheduleMutation.mutate()}
          disabled={saveScheduleMutation.isPending || Number(scheduleValue) < activeRange.min || Number(scheduleValue) > activeRange.max}
        >
          {saveScheduleMutation.isPending ? '\uC800\uC7A5 \uC911...' : '\uC8FC\uAE30 \uC800\uC7A5'}
        </button>
        {status ? <p className='profile-status-message'>{status}</p> : null}
      </section>
    </section>
  );
};

