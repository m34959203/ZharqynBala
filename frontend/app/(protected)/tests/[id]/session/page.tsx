'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { TestSession as TestSessionComponent } from '@/components/tests/TestSession';
import { TestSession, Question } from '@/lib/types';
import api from '@/lib/api';

export default function TestSessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const testId = params.id as string;
  const sessionId = searchParams.get('sessionId');

  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

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
    if (!sessionId) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/tests/sessions/${sessionId}/answer`, {
        questionId,
        answerOptionId: answerOptionId || undefined,
        textAnswer,
      });

      if (response.data.isComplete) {
        // Test completed, redirect to results
        router.push(`/results/${response.data.resultId}`);
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
      setError('Не удалось отправить ответ');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <TestSessionComponent
        question={testSession.currentQuestion}
        currentIndex={testSession.currentQuestionIndex}
        totalQuestions={testSession.totalQuestions}
        progress={testSession.progress}
        onAnswer={handleAnswer}
        isSubmitting={submitting}
      />
    </div>
  );
}
