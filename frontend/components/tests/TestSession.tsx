'use client';

import { useState } from 'react';
import { Question, AnswerOption } from '@/lib/types';

interface AnswerHistoryEntry {
  questionId: string;
  answerOptionId: string;
  textAnswer?: string;
  question: Question;
}

interface TestSessionProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  progress: number;
  onAnswer: (questionId: string, answerOptionId: string, textAnswer?: string) => void;
  isSubmitting: boolean;
  timeLeft?: number | null;
  answerHistory: AnswerHistoryEntry[];
  onGoBack?: () => void;
  reviewMode?: boolean;
}

export function TestSession({
  question,
  currentIndex,
  totalQuestions,
  progress,
  onAnswer,
  isSubmitting,
  timeLeft,
  answerHistory,
  onGoBack,
  reviewMode = false,
}: TestSessionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');

  // In review mode, find the previously selected answer
  const reviewEntry = reviewMode
    ? answerHistory.find((h) => h.questionId === question.id)
    : null;
  const displaySelectedOption = reviewMode ? (reviewEntry?.answerOptionId || null) : selectedOption;

  const handleSubmit = () => {
    if (question.questionType === 'TEXT') {
      if (textAnswer.trim()) {
        onAnswer(question.id, '', textAnswer);
        setTextAnswer('');
      }
    } else if (selectedOption) {
      onAnswer(question.id, selectedOption);
      setSelectedOption(null);
    }
  };

  const canSubmit =
    question.questionType === 'TEXT'
      ? textAnswer.trim().length > 0
      : selectedOption !== null;

  const canGoBack = onGoBack && currentIndex > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header: question counter + timer */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">
          Вопрос {currentIndex + 1} из {totalQuestions}
        </span>
        {timeLeft !== undefined && timeLeft !== null && (
          <div
            className={`text-sm font-mono px-3 py-1 rounded-lg ${
              timeLeft < 60
                ? 'text-red-600 bg-red-50 font-bold'
                : timeLeft < 300
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-500 bg-gray-100'
            }`}
          >
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Review mode banner */}
      {reviewMode && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          Просмотр предыдущего ответа (только чтение)
        </div>
      )}

      {/* Question */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {question.questionTextRu}
        </h2>

        {/* Options */}
        {question.questionType === 'TEXT' ? (
          <textarea
            value={reviewMode ? (reviewEntry?.textAnswer || '') : textAnswer}
            onChange={(e) => !reviewMode && setTextAnswer(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            rows={4}
            placeholder="Введите ваш ответ..."
            readOnly={reviewMode}
          />
        ) : (
          <div className="space-y-3">
            {question.options.map((option) => {
              const isSelected = displaySelectedOption === option.id;
              const hasSelection = displaySelectedOption !== null;

              return (
                <button
                  key={option.id}
                  onClick={() => !reviewMode && setSelectedOption(option.id)}
                  disabled={reviewMode}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-500'
                      : hasSelection
                        ? 'border-gray-200 opacity-60 hover:opacity-80'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${reviewMode ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={isSelected ? 'text-purple-900 font-medium' : 'text-gray-900'}>
                      {option.optionTextRu}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between">
        {canGoBack ? (
          <button
            onClick={onGoBack}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </span>
          </button>
        ) : (
          <div />
        )}

        {!reviewMode && (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              canSubmit && !isSubmitting
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Отправка...
              </span>
            ) : currentIndex + 1 === totalQuestions ? (
              'Завершить тест'
            ) : (
              'Следующий вопрос'
            )}
          </button>
        )}

        {reviewMode && (
          <button
            onClick={onGoBack}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-purple-600 text-white hover:bg-purple-700"
          >
            <span className="flex items-center">
              Вернуться к текущему вопросу
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
