'use client';

import { useState } from 'react';
import { Question, AnswerOption } from '@/lib/types';

interface TestSessionProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  progress: number;
  onAnswer: (questionId: string, answerOptionId: string, textAnswer?: string) => void;
  isSubmitting: boolean;
}

export function TestSession({
  question,
  currentIndex,
  totalQuestions,
  progress,
  onAnswer,
  isSubmitting,
}: TestSessionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Вопрос {currentIndex + 1} из {totalQuestions}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {question.questionTextRu}
        </h2>

        {/* Options */}
        {question.questionType === 'TEXT' ? (
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            placeholder="Введите ваш ответ..."
          />
        ) : (
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  selectedOption === option.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedOption === option.id
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedOption === option.id && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-900">{option.optionTextRu}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            canSubmit && !isSubmitting
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
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
      </div>
    </div>
  );
}
