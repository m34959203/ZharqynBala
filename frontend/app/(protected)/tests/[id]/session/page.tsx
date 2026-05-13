'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { TestSession as TestSessionComponent } from '@/components/tests/TestSession';
import { TestSession, Question } from '@/lib/types';
import api from '@/lib/api';

interface AnswerHistoryEntry {
  questionId: string;
  answerOptionId: string;
  textAnswer?: string;
  question: Question;
}

function TestSessionContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const testId = params.id as string;
  const sessionId = searchParams.get('sessionId');

  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Completion screen state
  const [completed, setCompleted] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);

  // Answer history for back navigation
  const [answerHistory, setAnswerHistory] = useState<AnswerHistoryEntry[]>([]);

  // Review mode: viewing a previous question (read-only)
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  // Timer countdown
  useEffect(() => {
    if (testSession?.durationMinutes && timeLeft === null) {
      setTimeLeft(testSession.durationMinutes * 60);
    }
  }, [testSession?.durationMinutes]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft !== null && timeLeft > 0]);

  // BUG-043: время вышло — мягкий финиш вместо разрушающего setError.
  // Пытаемся форсированно завершить сессию на сервере, чтобы ребёнок
  // увидел итог по уже отвеченным вопросам, а не «Произошла ошибка».
  // Если эндпоинта /complete нет — fall back на простой переход
  // в список результатов: ответы и так сохранены пошагово.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (timeLeft !== 0 || completed || timedOut) return;
    setTimedOut(true);
    let cancelled = false;
    (async () => {
      try {
        const res = await api.post(`/tests/sessions/${sessionId}/complete`);
        if (cancelled) return;
        if (res.data?.resultId) {
          setResultId(res.data.resultId);
          setCompleted(true);
          return;
        }
      } catch {
        // нет force-complete на бэке — просто переведём на список результатов
      }
      if (!cancelled) {
        router.push('/results?expired=1');
      }
    })();
    return () => { cancelled = true; };
  }, [timeLeft, completed, timedOut, sessionId, router]);

  const fetchSession = async () => {
    try {
      const response = await api.get(`/tests/sessions/${sessionId}`);
      setTestSession(response.data);
    } catch (err: any) {
      setError('Не удалось загрузить сессию');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (
    questionId: string,
    answerOptionId: string,
    textAnswer?: string
  ) => {
    if (!sessionId || !testSession?.currentQuestion) return;

    // Save to answer history before submitting
    setAnswerHistory((prev) => [
      ...prev,
      {
        questionId,
        answerOptionId,
        textAnswer,
        question: testSession.currentQuestion!,
      },
    ]);

    try {
      setSubmitting(true);
      const response = await api.post(`/tests/sessions/${sessionId}/answer`, {
        questionId,
        answerOptionId: answerOptionId || undefined,
        textAnswer,
      });

      if (response.data.isComplete) {
        // Test completed — show completion screen instead of immediate redirect
        setResultId(response.data.resultId);
        setCompleted(true);
      } else {
        // Update session with next question
        setTestSession((prev) =>
          prev
            ? {
                ...prev,
                currentQuestionIndex: prev.currentQuestionIndex + 1,
                progress: response.data.progress,
                currentQuestion: response.data.nextQuestion,
              }
            : null
        );
      }
    } catch (err: any) {
      // Remove the last history entry since the answer failed
      setAnswerHistory((prev) => prev.slice(0, -1));
      setError('Не удалось отправить ответ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = useCallback(() => {
    if (reviewIndex !== null) {
      // Currently reviewing — go back to current question
      setReviewIndex(null);
    } else if (answerHistory.length > 0) {
      // Go to review mode for the previous question
      setReviewIndex(answerHistory.length - 1);
    }
  }, [reviewIndex, answerHistory.length]);

  const handleGoBackFromReview = useCallback(() => {
    // Return to current (live) question
    setReviewIndex(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка теста...</p>
        </div>
      </div>
    );
  }

  if (error || !testSession || !testSession.currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            {error || 'Произошла ошибка'}
          </h2>
          <button
            onClick={() => router.push('/tests')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Вернуться к тестам
          </button>
        </div>
      </div>
    );
  }

  // Completion screen
  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Тест завершён!</h2>
          <p className="text-gray-600 mb-8">Ваши ответы сохранены. Результаты готовы.</p>
          <button
            onClick={() => router.push(`/results/${resultId}`)}
            className="w-full bg-blue-600 text-white rounded-xl py-4 font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Посмотреть результаты
          </button>
        </div>
      </div>
    );
  }

  // Determine what to display: review mode or current question
  const isReviewMode = reviewIndex !== null;
  const displayQuestion = isReviewMode
    ? answerHistory[reviewIndex].question
    : testSession.currentQuestion;
  const displayIndex = isReviewMode ? reviewIndex : testSession.currentQuestionIndex;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <TestSessionComponent
        question={displayQuestion}
        currentIndex={displayIndex}
        totalQuestions={testSession.totalQuestions}
        progress={testSession.progress}
        onAnswer={handleAnswer}
        isSubmitting={submitting}
        timeLeft={timeLeft}
        answerHistory={answerHistory}
        onGoBack={isReviewMode ? handleGoBackFromReview : handleGoBack}
        reviewMode={isReviewMode}
      />
    </div>
  );
}

function SessionFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка теста...</p>
      </div>
    </div>
  );
}

export default function TestSessionPage() {
  return (
    <Suspense fallback={<SessionFallback />}>
      <TestSessionContent />
    </Suspense>
  );
}
