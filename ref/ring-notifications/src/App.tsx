import React, { useState } from 'react';
import {
  Bell,
  Search,
  Filter,
  Clock,
  ExternalLink,
  FileText,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  BookmarkPlus,
  Inbox
} from 'lucide-react';

type Notification = {
  id: string;
  title: string;
  score: number;
  scoreLabel: '높음' | '보통' | '낮음';
  profileName: string;
  applicationPeriod: string;
  registrationDate: string;
  isRead: boolean;
  isDeadlineImminent: boolean;
  summary: string;
  matchedKeywords: string[];
  matchReason: string;
  originalLink: string;
  attachments: string[];
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: '2026년도 소재부품기술개발사업(이종기술융합형) 신규지원 대상과제 공고',
    score: 95,
    scoreLabel: '높음',
    profileName: 'AI 융합 신소재',
    applicationPeriod: '2026.04.01 ~ 2026.04.15',
    registrationDate: '2026.03.20',
    isRead: false,
    isDeadlineImminent: true,
    summary: '이종 기술 융합을 통한 첨단 소재 부품 개발을 지원하는 사업입니다. 특히 인공지능 기술을 활용한 신소재 탐색 및 공정 최적화 분야를 우대합니다. 최대 3년간 15억 원의 연구개발비를 지원합니다.',
    matchedKeywords: ['인공지능', '신소재', '공정 최적화'],
    matchReason: '사용자가 등록한 "AI 기반 소재 개발" 프로필과 핵심 키워드(인공지능, 신소재)가 정확히 일치하며, 지원 규모가 설정한 기준(10억 이상)을 충족하여 높은 점수로 추천되었습니다.',
    originalLink: '#',
    attachments: ['2026년도_소재부품기술개발사업_공고문.hwpx', '사업계획서_양식.hwp']
  },
  {
    id: '2',
    title: '2026년도 바이오산업기술개발사업 신규지원 대상과제 통합공고',
    score: 82,
    scoreLabel: '높음',
    profileName: '디지털 헬스케어',
    applicationPeriod: '2026.04.10 ~ 2026.04.30',
    registrationDate: '2026.03.22',
    isRead: false,
    isDeadlineImminent: false,
    summary: '바이오 분야의 신산업 창출 및 주력산업 고도화를 위한 기술개발을 지원합니다. 디지털 치료기기, AI 기반 진단 솔루션 등 디지털 헬스케어 분야가 주요 지원 대상에 포함되어 있습니다.',
    matchedKeywords: ['디지털 치료기기', 'AI 진단'],
    matchReason: '관심 키워드인 "디지털 헬스케어" 및 "AI 진단"이 본문에 다수 포함되어 있습니다.',
    originalLink: '#',
    attachments: ['통합공고문.pdf']
  },
  {
    id: '3',
    title: '2026년도 로봇산업핵심기술개발사업 신규지원 대상과제 공고 (제조로봇 분야)',
    score: 65,
    scoreLabel: '보통',
    profileName: '스마트 팩토리',
    applicationPeriod: '2026.03.01 ~ 2026.03.28',
    registrationDate: '2026.02.25',
    isRead: true,
    isDeadlineImminent: true,
    summary: '제조 현장의 생산성 향상 및 작업 환경 개선을 위한 첨단 제조로봇 기술개발을 지원합니다. 협동로봇, 자율주행 물류로봇 등이 포함됩니다.',
    matchedKeywords: ['자율주행', '물류로봇'],
    matchReason: '"스마트 팩토리" 프로필의 연관 키워드인 "물류로봇"이 발견되어 추천되었습니다.',
    originalLink: '#',
    attachments: ['공고문_및_안내서.zip']
  },
  {
    id: '4',
    title: '2026년도 지식서비스산업핵심기술개발사업 신규지원 대상과제 공고',
    score: 45,
    scoreLabel: '낮음',
    profileName: 'AI 융합 신소재',
    applicationPeriod: '2026.05.01 ~ 2026.05.31',
    registrationDate: '2026.03.15',
    isRead: true,
    isDeadlineImminent: false,
    summary: '지식서비스 분야의 AI, 빅데이터 적용을 통한 서비스 혁신 기술개발을 지원합니다. 에듀테크, 리걸테크 등 다양한 서비스 분야를 포괄합니다.',
    matchedKeywords: ['AI', '빅데이터'],
    matchReason: '프로필의 "AI" 키워드와 일치하나, 주력 분야(신소재)와 거리가 있어 낮은 점수로 분류되었습니다.',
    originalLink: '#',
    attachments: ['지식서비스_공고문.hwp']
  }
];

export default function App() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_NOTIFICATIONS[0].id);

  const filteredNotifications = MOCK_NOTIFICATIONS.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const selectedNotification = MOCK_NOTIFICATIONS.find(n => n.id === selectedId);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800';
    if (score >= 60) return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Notifications</h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">관심 기준에 맞는 공고만 선별해 보여줍니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                전체
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${filter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                안읽음
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)]">
        
        {/* List Pane */}
        <div className={`w-full lg:w-[45%] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between sm:hidden">
             <div className="flex bg-slate-100 p-1 rounded-lg w-full">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                전체
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${filter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                안읽음
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Inbox className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">현재 관심 기준에 맞는 공고가 없습니다.</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  프로필 키워드나 설명을 조정해보세요. 새로운 공고가 등록되면 이곳에 표시됩니다.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => setSelectedId(notification.id)}
                    className={`p-5 cursor-pointer transition-all hover:bg-slate-50 group relative
                      ${!notification.isRead ? 'bg-blue-50/20' : ''}
                      ${selectedId === notification.id ? 'bg-slate-50 ring-1 ring-inset ring-slate-200' : ''}
                    `}
                  >
                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"></div>
                    )}

                    <div className="flex justify-between items-start mb-2.5 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${getScoreColor(notification.score)}`}>
                          {notification.scoreLabel} {notification.score}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-md">
                          {notification.profileName}
                        </span>
                        {notification.isDeadlineImminent && (
                          <span className="px-2 py-0.5 text-[11px] font-bold bg-red-50 text-red-600 rounded-md flex items-center gap-1 border border-red-100">
                            <Clock className="w-3 h-3" /> 마감임박
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-400 shrink-0 mt-0.5">
                        {notification.registrationDate}
                      </span>
                    </div>

                    <h3 className={`text-[15px] leading-snug mb-2 line-clamp-2 pr-4 ${!notification.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {notification.title}
                    </h3>

                    <p className={`text-sm line-clamp-2 mb-3 ${!notification.isRead ? 'text-slate-600' : 'text-slate-500'}`}>
                      {notification.summary}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-wrap gap-1.5">
                        {notification.matchedKeywords.slice(0, 3).map(kw => (
                          <span key={kw} className="px-1.5 py-0.5 bg-indigo-50/50 border border-indigo-100/50 text-indigo-600 text-[11px] font-medium rounded">
                            {kw}
                          </span>
                        ))}
                        {notification.matchedKeywords.length > 3 && (
                          <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 text-[11px] font-medium rounded">
                            +{notification.matchedKeywords.length - 3}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs font-medium text-slate-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        상세보기 <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Pane */}
        {selectedNotification ? (
          <div className={`w-full lg:w-[55%] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
            {/* Mobile Back Button */}
            <div className="lg:hidden p-4 border-b border-slate-100 flex items-center">
              <button 
                onClick={() => setSelectedId(null)}
                className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> 목록으로 돌아가기
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${getScoreColor(selectedNotification.score)}`}>
                    추천 점수: {selectedNotification.scoreLabel} {selectedNotification.score}점
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
                    프로필: {selectedNotification.profileName}
                  </span>
                  {selectedNotification.isDeadlineImminent && (
                    <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-md flex items-center gap-1 border border-red-100">
                      <Clock className="w-3.5 h-3.5" /> 마감임박
                    </span>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 leading-snug mb-5">
                  {selectedNotification.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>접수기간: <strong className="text-slate-800 font-semibold">{selectedNotification.applicationPeriod}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>등록일: <strong className="text-slate-800 font-semibold">{selectedNotification.registrationDate}</strong></span>
                  </div>
                </div>
              </div>

              {/* Match Reason */}
              <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-xl p-5 mb-8">
                <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  추천 사유
                </h3>
                <p className="text-[15px] text-indigo-900/80 leading-relaxed mb-4">
                  {selectedNotification.matchReason}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedNotification.matchedKeywords.map(kw => (
                    <span key={kw} className="px-2.5 py-1 bg-white border border-indigo-200/60 text-indigo-700 text-xs font-bold rounded-md shadow-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="mb-8">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  공고 요약
                </h3>
                <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-line bg-white">
                  {selectedNotification.summary}
                </p>
              </div>

              {/* Attachments */}
              <div className="mb-8">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-400" />
                  첨부 파일
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedNotification.attachments.map(att => (
                    <a href="#" key={att} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 truncate">{att}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 mt-auto">
              <button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                원문 공고 보기 <ExternalLink className="w-4 h-4" />
              </button>
              <button className="sm:w-32 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                <BookmarkPlus className="w-4 h-4" /> 저장
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex w-[55%] flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-200 border-dashed text-center p-8">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-slate-300">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">공고를 선택해주세요</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              왼쪽 목록에서 공고를 선택하면 상세 내용과 추천 사유를 확인할 수 있습니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
