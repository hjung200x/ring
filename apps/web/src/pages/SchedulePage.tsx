import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionUserDto, SmsRecipientCreateInput, SmsRecipientDto, UserScheduleUnit } from "@ring/types";
import { apiFetch } from "../lib/api-client.js";

const ranges: Record<UserScheduleUnit, { min: number; max: number; help: string }> = {
  week: { min: 1, max: 7, help: "\u0031\uC8FC\uC5D0 \uBA87 \uD68C \uC2E4\uD589\uD560\uC9C0 \uC124\uC815\uD569\uB2C8\uB2E4. \uBAA8\uB4E0 \uC2E4\uD589\uC740 \uC624\uD6C4 4\uC2DC\uC5D0 \uC9C4\uD589\uB429\uB2C8\uB2E4." },
  day: { min: 1, max: 30, help: "\uBA87 \uC77C\uB9C8\uB2E4 \uC2E4\uD589\uD560\uC9C0 \uC124\uC815\uD569\uB2C8\uB2E4. \uBAA8\uB4E0 \uC2E4\uD589\uC740 \uC624\uD6C4 4\uC2DC\uC5D0 \uC9C4\uD589\uB429\uB2C8\uB2E4." },
  hour: { min: 1, max: 24, help: "\uAE30\uC874 \uC2A4\uCF00\uC904 \uD638\uD658\uC6A9 \uAC12\uC785\uB2C8\uB2E4." },
};

type RecipientDraft = {
  name: string;
  phoneNumber: string;
  enabled: boolean;
};

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "\uC544\uC9C1 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.";

const normalizePhoneNumber = (value: string) => value.replace(/[^0-9]/g, "");

const formatPhoneNumber = (value: string) => {
  const digits = normalizePhoneNumber(value);
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
};

const recipientDraftFromDto = (recipient: SmsRecipientDto): RecipientDraft => ({
  name: recipient.name,
  phoneNumber: recipient.phoneNumber,
  enabled: recipient.enabled,
});

export const SchedulePage = () => {
  const queryClient = useQueryClient();
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [scheduleUnit, setScheduleUnit] = useState<UserScheduleUnit>("day");
  const [scheduleValue, setScheduleValue] = useState("1");
  const [status, setStatus] = useState("");
  const [recipientStatus, setRecipientStatus] = useState("");
  const [recipientDrafts, setRecipientDrafts] = useState<Record<string, RecipientDraft>>({});
  const [newRecipient, setNewRecipient] = useState<Pick<SmsRecipientCreateInput, "name" | "phoneNumber">>({
    name: "",
    phoneNumber: "",
  });

  const sessionQuery = useQuery({
    queryKey: ["session-user"],
    queryFn: () => apiFetch("/api/me") as Promise<SessionUserDto>,
  });

  const recipientsQuery = useQuery({
    queryKey: ["sms-recipients"],
    queryFn: () => apiFetch("/api/sms-recipients") as Promise<SmsRecipientDto[]>,
  });

  useEffect(() => {
    if (!sessionQuery.data?.schedule) return;
    if (!(sessionQuery.data.schedule.scheduleUnit in ranges)) {
      console.warn("Unexpected schedule unit from /api/me", sessionQuery.data.schedule);
      setStatus(
        "\uC8FC\uAE30 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uB3C4\uC911 \uC608\uC0C1\uD558\uC9C0 \uBABB\uD55C \uAC12\uC744 \uBC1B\uC558\uC2B5\uB2C8\uB2E4. \uAE30\uBCF8\uAC12\uC73C\uB85C \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
      );
      return;
    }
    setScheduleEnabled(sessionQuery.data.schedule.scheduleEnabled);
    setSmsEnabled(sessionQuery.data.schedule.smsEnabled);
    if (sessionQuery.data.schedule.scheduleUnit === "hour") {
      setScheduleUnit("day");
      setScheduleValue("1");
      setStatus(
        "\uAE30\uC874 \uC2DC\uAC04 \uAE30\uC900 \uC2A4\uCF00\uC904\uC740 \uC0C8 \uD654\uBA74\uC5D0\uC11C \uC77C \uAE30\uC900\uC73C\uB85C \uD45C\uC2DC\uD569\uB2C8\uB2E4. \uB2E4\uC2DC \uC800\uC7A5\uD558\uBA74 \uC624\uD6C4 4\uC2DC \uAE30\uC900 \uC2A4\uCF00\uC904\uB85C \uC804\uD658\uB429\uB2C8\uB2E4.",
      );
      return;
    }
    setScheduleUnit(sessionQuery.data.schedule.scheduleUnit);
    setScheduleValue(String(sessionQuery.data.schedule.scheduleValue));
  }, [sessionQuery.data]);

  useEffect(() => {
    if (!recipientsQuery.data) {
      return;
    }
    setRecipientDrafts(
      recipientsQuery.data.reduce<Record<string, RecipientDraft>>((acc, recipient) => {
        acc[recipient.id] = recipientDraftFromDto(recipient);
        return acc;
      }, {}),
    );
  }, [recipientsQuery.data]);

  useEffect(() => {
    if (!status.startsWith("\uC8FC\uAE30 \uC124\uC815\uC744 \uC800\uC7A5")) {
      return;
    }

    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      const result = await queryClient.fetchQuery({
        queryKey: ["session-user"],
        queryFn: () => apiFetch("/api/me") as Promise<SessionUserDto>,
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
      apiFetch("/api/me/schedule", {
        method: "PATCH",
        body: JSON.stringify({
          scheduleEnabled,
          smsEnabled,
          scheduleUnit,
          scheduleValue: Number(scheduleValue),
        }),
      }),
    onSuccess: async () => {
      setStatus(
        scheduleEnabled
          ? "\uC8FC\uAE30 \uC124\uC815\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uBC14\uB85C \uD55C \uBC88 \uB354 \uD655\uC778\uD569\uB2C8\uB2E4."
          : "\uC8FC\uAE30\uC801 \uAC80\uC0C9\uC744 \uBE44\uD65C\uC131\uD654\uD588\uC2B5\uB2C8\uB2E4."
      );
      await queryClient.invalidateQueries({ queryKey: ["session-user"] });
    },
    onError: (error) => {
      console.error("Failed to save schedule", error);
      setStatus("\uC8FC\uAE30 \uC124\uC815 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    },
  });

  const refreshRecipients = async () => {
    await queryClient.invalidateQueries({ queryKey: ["sms-recipients"] });
  };

  const createRecipientMutation = useMutation({
    mutationFn: async (payload: SmsRecipientCreateInput) =>
      apiFetch("/api/sms-recipients", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      setRecipientStatus("\uBB38\uC790 \uC218\uC2E0\uC790\uB97C \uCD94\uAC00\uD588\uC2B5\uB2C8\uB2E4.");
      setNewRecipient({ name: "", phoneNumber: "" });
      await refreshRecipients();
    },
    onError: (error) => {
      console.error("Failed to create SMS recipient", error);
      setRecipientStatus("\uBB38\uC790 \uC218\uC2E0\uC790 \uCD94\uAC00\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    },
  });

  const updateRecipientMutation = useMutation({
    mutationFn: async ({ recipientId, payload }: { recipientId: string; payload: RecipientDraft }) =>
      apiFetch(`/api/sms-recipients/${recipientId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: payload.name,
          phoneNumber: payload.phoneNumber,
          enabled: payload.enabled,
        }),
      }),
    onSuccess: async () => {
      setRecipientStatus("\uBB38\uC790 \uC218\uC2E0\uC790 \uC815\uBCF4\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.");
      await refreshRecipients();
    },
    onError: (error) => {
      console.error("Failed to update SMS recipient", error);
      setRecipientStatus("\uBB38\uC790 \uC218\uC2E0\uC790 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    },
  });

  const deleteRecipientMutation = useMutation({
    mutationFn: async (recipientId: string) =>
      apiFetch(`/api/sms-recipients/${recipientId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      setRecipientStatus("\uBB38\uC790 \uC218\uC2E0\uC790\uB97C \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4.");
      await refreshRecipients();
    },
    onError: (error) => {
      console.error("Failed to delete SMS recipient", error);
      setRecipientStatus("\uBB38\uC790 \uC218\uC2E0\uC790 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    },
  });

  const canCreateRecipient = useMemo(() => {
    return (
      newRecipient.name.trim().length > 0 &&
      normalizePhoneNumber(newRecipient.phoneNumber).length >= 10 &&
      !createRecipientMutation.isPending
    );
  }, [createRecipientMutation.isPending, newRecipient.name, newRecipient.phoneNumber]);

  return (
    <section className="panel-surface schedule-page-surface">
      <div className="profile-list-header">
        <div>
          <h1>{"\uAC80\uC0C9\uC8FC\uAE30"}</h1>
          <p className="login-subcopy">
            {
              "\uAC80\uC0C9\uC8FC\uAE30\uB294 \uC2DC\uC2A4\uD15C \uC804\uCCB4\uC5D0 \uACF5\uD1B5\uC73C\uB85C \uC801\uC6A9\uB429\uB2C8\uB2E4. \uC800\uC7A5\uD558\uBA74 \uC989\uC2DC \uD55C \uBC88 \uB354 \uD655\uC778\uD569\uB2C8\uB2E4."
            }
          </p>
        </div>
      </div>

      <div className="schedule-page-grid">
        <section className="profile-section-card schedule-card">
          <h2>{"\uACF5\uACE0 \uD655\uC778 \uC8FC\uAE30"}</h2>
          <label className="schedule-toggle-row">
            <span className="schedule-toggle-copy">
              <strong>{"\uC8FC\uAE30\uC801 \uAC80\uC0C9 \uD65C\uC131\uD654"}</strong>
              <small>
                {
                  "\uBE44\uD65C\uC131\uD654\uD558\uBA74 \uC790\uB3D9 \uAC80\uC0C9\uC774 \uBA48\uCD94\uACE0 \uB2E4\uC74C \uC608\uC815 \uC2DC\uAC01\uB3C4 \uBE44\uC6CC\uC9D1\uB2C8\uB2E4."
                }
              </small>
            </span>
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(event) => setScheduleEnabled(event.target.checked)}
            />
          </label>
          <label className="schedule-toggle-row">
            <span className="schedule-toggle-copy">
              <strong>{"\uBB38\uC790 \uBC1C\uC1A1 \uD65C\uC131\uD654"}</strong>
              <small>
                {
                  "\uBE44\uD65C\uC131\uD654\uD558\uBA74 \uC0C8 \uACF5\uACE0\uC54C\uB9BC\uC774 \uC0DD\uACA8\uB3C4 \uBB38\uC790\uB294 \uBCF4\uB0B4\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
                }
              </small>
            </span>
            <input type="checkbox" checked={smsEnabled} onChange={(event) => setSmsEnabled(event.target.checked)} />
          </label>
          <div className="schedule-grid">
            <label className="settings-field">
              <span>{"\uBC18\uBCF5 \uB2E8\uC704"}</span>
              <select
                className="panel-input"
                value={scheduleUnit}
                onChange={(event) => setScheduleUnit(event.target.value as UserScheduleUnit)}
                disabled={!scheduleEnabled}
              >
                <option value="week">{"\uC8FC"}</option>
                <option value="day">{"\uC77C"}</option>
              </select>
            </label>
            <label className="settings-field">
              <span>{"\uD68C\uC218 / \uAC04\uACA9"}</span>
              <input
                className="panel-input"
                type="number"
                min={activeRange.min}
                max={activeRange.max}
                step="1"
                value={scheduleValue}
                onChange={(event) => setScheduleValue(event.target.value)}
                disabled={!scheduleEnabled}
              />
              <small>{activeRange.help}</small>
              <small>{"\uAE30\uC900 \uC2E4\uD589 \uC2DC\uAC01: \uC624\uD6C4 4:00"}</small>
              <small>{`${activeRange.min} ~ ${activeRange.max}`}</small>
            </label>
          </div>
          <div className="schedule-meta">
            <div className="detail-meta-card">
              <span className="detail-meta-label">{"\uB9C8\uC9C0\uB9C9 \uC2E4\uD589"}</span>
              <strong>{formatDateTime(sessionQuery.data?.schedule?.lastRunAt ?? null)}</strong>
            </div>
            <div className="detail-meta-card">
              <span className="detail-meta-label">{"\uB2E4\uC74C \uC608\uC815 \uC2DC\uAC01"}</span>
              <strong>{formatDateTime(sessionQuery.data?.schedule?.nextRunAt ?? null)}</strong>
            </div>
          </div>
          <button
            type="button"
            className="panel-button schedule-save-button"
            onClick={() => saveScheduleMutation.mutate()}
            disabled={
              saveScheduleMutation.isPending ||
              (scheduleEnabled &&
                (Number(scheduleValue) < activeRange.min || Number(scheduleValue) > activeRange.max))
            }
          >
            {saveScheduleMutation.isPending ? "\uC800\uC7A5 \uC911..." : "\uC8FC\uAE30 \uC800\uC7A5"}
          </button>
          {status ? <p className="profile-status-message">{status}</p> : null}
        </section>

        <section className="profile-section-card sms-recipient-card">
          <h2>{"\uBB38\uC790 \uC218\uC2E0\uC790"}</h2>
          <p className="login-subcopy">
            {
              "\uC0C8 \uACF5\uACE0\uC54C\uB9BC\uC774 \uC0DD\uAE30\uBA74 \uD65C\uC131 \uC218\uC2E0\uC790\uC5D0\uAC8C \uBB38\uC790 \u0031\uAC74\uC744 \uBCF4\uB0C5\uB2C8\uB2E4."
            }
          </p>

          <div className="sms-recipient-list">
            {recipientsQuery.data?.length ? (
              recipientsQuery.data.map((recipient) => {
                const draft = recipientDrafts[recipient.id] ?? recipientDraftFromDto(recipient);
                return (
                  <article key={recipient.id} className="sms-recipient-item">
                    <div className="sms-recipient-item-header">
                      <strong>{recipient.name}</strong>
                      <label className="sms-recipient-toggle">
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={(event) =>
                            setRecipientDrafts((current) => ({
                              ...current,
                              [recipient.id]: { ...draft, enabled: event.target.checked },
                            }))
                          }
                        />
                        <span>{draft.enabled ? "\uD65C\uC131" : "\uBE44\uD65C\uC131"}</span>
                      </label>
                    </div>
                    <div className="sms-recipient-edit-grid">
                      <label className="settings-field">
                        <span>{"\uC774\uB984"}</span>
                        <input
                          className="panel-input"
                          value={draft.name}
                          onChange={(event) =>
                            setRecipientDrafts((current) => ({
                              ...current,
                              [recipient.id]: { ...draft, name: event.target.value },
                            }))
                          }
                        />
                      </label>
                      <label className="settings-field">
                        <span>{"\uC804\uD654\uBC88\uD638"}</span>
                        <input
                          className="panel-input"
                          value={draft.phoneNumber}
                          onChange={(event) =>
                            setRecipientDrafts((current) => ({
                              ...current,
                              [recipient.id]: { ...draft, phoneNumber: event.target.value },
                            }))
                          }
                        />
                        <small>{formatPhoneNumber(draft.phoneNumber)}</small>
                      </label>
                    </div>
                    <div className="admin-action-row">
                      <button
                        type="button"
                        className="panel-button"
                        onClick={() => updateRecipientMutation.mutate({ recipientId: recipient.id, payload: draft })}
                        disabled={
                          updateRecipientMutation.isPending ||
                          draft.name.trim().length === 0 ||
                          normalizePhoneNumber(draft.phoneNumber).length < 10
                        }
                      >
                        {"\uC800\uC7A5"}
                      </button>
                      <button
                        type="button"
                        className="panel-button admin-delete-button"
                        onClick={() => {
                          if (!window.confirm("\uC774 \uC218\uC2E0\uC790\uB97C \uC0AD\uC81C\uD560\uAE4C\uC694?")) {
                            return;
                          }
                          deleteRecipientMutation.mutate(recipient.id);
                        }}
                        disabled={deleteRecipientMutation.isPending}
                      >
                        {"\uC0AD\uC81C"}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="sms-recipient-empty">
                {"\uC544\uC9C1 \uB4F1\uB85D\uB41C \uBB38\uC790 \uC218\uC2E0\uC790\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
              </div>
            )}
          </div>

          <div className="sms-recipient-create">
            <h3>{"\uC218\uC2E0\uC790 \uCD94\uAC00"}</h3>
            <div className="sms-recipient-edit-grid">
              <label className="settings-field">
                <span>{"\uC774\uB984"}</span>
                <input
                  className="panel-input"
                  value={newRecipient.name}
                  onChange={(event) =>
                    setNewRecipient((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="settings-field">
                <span>{"\uC804\uD654\uBC88\uD638"}</span>
                <input
                  className="panel-input"
                  value={newRecipient.phoneNumber}
                  onChange={(event) =>
                    setNewRecipient((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                />
                <small>{formatPhoneNumber(newRecipient.phoneNumber)}</small>
              </label>
            </div>
            <button
              type="button"
              className="panel-button"
              onClick={() =>
                createRecipientMutation.mutate({
                  ...newRecipient,
                  phoneNumber: normalizePhoneNumber(newRecipient.phoneNumber),
                  enabled: true,
                })
              }
              disabled={!canCreateRecipient}
            >
              {createRecipientMutation.isPending ? "\uCD94\uAC00 \uC911..." : "\uC218\uC2E0\uC790 \uCD94\uAC00"}
            </button>
          </div>

          {recipientStatus ? <p className="profile-status-message">{recipientStatus}</p> : null}
        </section>
      </div>
    </section>
  );
};
