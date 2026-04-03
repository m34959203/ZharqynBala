'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const publicApi = axios.create({ baseURL: `${API_URL}/api/v1` });

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  completed: boolean;
}

interface GroupTestInfo {
  id: string;
  token: string;
  testName: string;
  testNameKz: string;
  testDescription: string;
  testDescriptionKz: string;
  category: string;
  durationMinutes: number;
  questionCount: number;
  schoolName: string;
  className: string;
  deadline: string | null;
  isExpired: boolean;
  completedCount: number;
  totalCount: number;
  students: StudentInfo[];
}

interface AnswerOption {
  id: string;
  optionTextRu: string;
  optionTextKz: string;
  order: number;
}

interface Question {
  id: string;
  questionTextRu: string;
  questionTextKz: string;
  questionType: string;
  order: number;
  isRequired: boolean;
  options: AnswerOption[];
}

interface TestData {
  testId: string;
  testName: string;
  testNameKz: string;
  durationMinutes: number;
  questions: Question[];
}

interface TestResult {
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  message: string;
}

type Step = 'loading' | 'select-student' | 'taking-test' | 'submitting' | 'result' | 'error';

export default function TakeTestPage() {
  const params = useParams();
  const token = params.token as string;

  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState('');
  const [groupTest, setGroupTest] = useState<GroupTestInfo | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [testData, setTestData] = useState<TestData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TestResult | null>(null);

  // Fetch group test info
  useEffect(() => {
    const fetchGroupTest = async () => {
      try {
        const res = await publicApi.get(`/group-tests/by-token/${token}`);
        setGroupTest(res.data);
        setStep('select-student');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Тестирование не найдено');
        setStep('error');
      }
    };
    if (token) fetchGroupTest();
  }, [token]);

  // Start test for selected student
  const handleStartTest = useCallback(async () => {
    if (!selectedStudent) return;
    try {
      const res = await publicApi.post(`/group-tests/by-token/${token}/start`, {
        studentId: selectedStudent,
      });
      setTestData(res.data);
      setCurrentQuestion(0);
      setAnswers({});
      setStep('taking-test');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при начале теста');
      setStep('error');
    }
  }, [token, selectedStudent]);

  // Submit all answers
  const handleSubmit = useCallback(async () => {
    if (!testData) return;
    setStep('submitting');
    try {
      const answersArray = Object.entries(answers).map(([questionId, answerOptionId]) => ({
        questionId,
        answerOptionId,
      }));
      const res = await publicApi.post(`/group-tests/by-token/${token}/complete`, {
        studentId: selectedStudent,
        answers: answersArray,
      });
      setResult(res.data);
      setStep('result');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке ответов');
      setStep('error');
    }
  }, [token, selectedStudent, answers, testData]);

  const selectAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const totalQuestions = testData?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const currentQ = testData?.questions[currentQuestion];

  // ============================================
  // LOADING
  // ============================================
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка теста...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // SELECT STUDENT
  // ============================================
  if (step === 'select-student' && groupTest) {
    const availableStudents = groupTest.students.filter((s) => !s.completed);
    const completedStudents = groupTest.students.filter((s) => s.completed);

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{groupTest.testName}</h1>
            <p className="mt-2 text-gray-500">{groupTest.testDescription}</p>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Школа</span>
                <p className="font-medium text-gray-900">{groupTest.schoolName}</p>
              </div>
              <div>
                <span className="text-gray-500">Класс</span>
                <p className="font-medium text-gray-900">{groupTest.className}</p>
              </div>
              <div>
                <span className="text-gray-500">Вопросов</span>
                <p className="font-medium text-gray-900">{groupTest.questionCount}</p>
              </div>
              <div>
                <span className="text-gray-500">Время</span>
                <p className="font-medium text-gray-900">{groupTest.durationMinutes} мин</p>
              </div>
            </div>
            {groupTest.deadline && (
              <div className="mt-3 pt-3 border-t text-sm">
                <span className="text-gray-500">Дедлайн: </span>
                <span className={`font-medium ${groupTest.isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                  {new Date(groupTest.deadline).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {groupTest.isExpired && ' (истёк)'}
                </span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t text-sm">
              <span className="text-gray-500">Прошли: </span>
              <span className="font-medium text-gray-900">
                {groupTest.completedCount} / {groupTest.totalCount} учеников
              </span>
            </div>
          </div>

          {groupTest.isExpired ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700 font-medium">Срок тестирования истёк</p>
            </div>
          ) : (
            <>
              {groupTest.anonymous ? (
                /* Anonymous Mode */
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Анонимное тестирование</h2>
                  <p className="text-gray-500 text-sm mb-1">Ваши ответы полностью анонимны.</p>
                  <p className="text-gray-500 text-sm">Результаты видны только психологу школы в обобщённом виде.</p>
                </div>
              ) : (
                /* Named Mode — Student Selection */
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Выберите своё имя</h2>
                  {availableStudents.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Все ученики уже прошли тест</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableStudents.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudent(student.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                            selectedStudent === student.id
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <span className="font-medium text-gray-900">
                            {student.lastName} {student.firstName}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {completedStudents.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-400 mb-2">Уже прошли тест:</p>
                      <div className="flex flex-wrap gap-1">
                        {completedStudents.map((s) => (
                          <span key={s.id} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                            {s.lastName} {s.firstName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={() => {
                  if (groupTest.anonymous) {
                    setSelectedStudent(`anon-${Date.now()}`);
                    handleStartTest();
                  } else {
                    handleStartTest();
                  }
                }}
                disabled={!groupTest.anonymous && !selectedStudent}
                className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-colors"
              >
                {groupTest.anonymous ? 'Начать анонимный тест' : 'Начать тест'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // TAKING TEST
  // ============================================
  if ((step === 'taking-test' || step === 'submitting') && testData && currentQ) {
    const progressPercent = Math.round(((currentQuestion + 1) / totalQuestions) * 100);
    const isLastQuestion = currentQuestion === totalQuestions - 1;
    const currentAnswer = answers[currentQ.id];

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>{testData.testName}</span>
              <span>
                {currentQuestion + 1} / {totalQuestions}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="mb-6">
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                Вопрос {currentQuestion + 1}
              </span>
              <h2 className="mt-3 text-lg font-semibold text-gray-900">
                {currentQ.questionTextRu}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectAnswer(currentQ.id, option.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    currentAnswer === option.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-gray-900">{option.optionTextRu}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Назад
            </button>

            <span className="text-sm text-gray-400">
              Отвечено: {answeredCount} / {totalQuestions}
            </span>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={answeredCount < totalQuestions || step === 'submitting'}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {step === 'submitting' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Отправка...
                  </>
                ) : (
                  'Завершить тест'
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700"
              >
                Далее
              </button>
            )}
          </div>

          {/* Question dots navigation */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {testData.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                  idx === currentQuestion
                    ? 'bg-indigo-600 text-white'
                    : answers[q.id]
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RESULT
  // ============================================
  if (step === 'result' && result) {
    const getResultColor = (pct: number) => {
      if (pct >= 70) return { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-500' };
      if (pct >= 40) return { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-500' };
      return { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-500' };
    };
    const colors = getResultColor(result.percentage);

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{result.message}</h1>
          <p className="text-gray-500 mb-8">{result.studentName}</p>

          <div className={`${colors.bg} rounded-2xl p-6 mb-6`}>
            <div className={`text-5xl font-bold ${colors.text} mb-2`}>
              {result.percentage}%
            </div>
            <p className="text-gray-600">
              {result.score} / {result.maxScore} баллов
            </p>
          </div>

          <p className="text-sm text-gray-400">
            Вы можете закрыть эту страницу. Результаты сохранены.
          </p>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
