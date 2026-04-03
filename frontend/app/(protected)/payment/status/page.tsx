'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Button, Card, CardBody, Spinner } from '@/components/ui';

interface PaymentStatus {
  id: string;
  amount: number;
  currency: string;
  paymentType: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  provider: string;
  createdAt: string;
}

const paymentTypeLabels: Record<string, string> = {
  DIAGNOSTIC: 'Диагностика',
  CONSULTATION: 'Консультация',
  SUBSCRIPTION: 'Подписка',
};

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('id');

  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!paymentId) {
      setError('ID платежа не указан');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/payments/status/${paymentId}`);
      setPayment(response.data);

      // If still pending, poll again (max 20 attempts = 60 sec)
      if (response.data.status === 'PENDING') {
        setPollCount(prev => {
          if (prev >= 20) {
            setTimedOut(true);
            return prev;
          }
          setTimeout(() => fetchStatus(), 3000);
          return prev + 1;
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Платёж не найден');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <Card>
            <CardBody className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>
                Вернуться
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardBody className="text-center py-8">
            {payment?.status === 'COMPLETED' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Оплата успешна!</h2>
                <p className="text-gray-500 text-sm mb-1">
                  {paymentTypeLabels[payment.paymentType] || payment.paymentType}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-6">
                  {payment.amount.toLocaleString('ru-RU')} ₸
                </p>
                <Button onClick={() => router.push('/dashboard')} className="w-full">
                  Перейти в кабинет
                </Button>
              </>
            )}

            {payment?.status === 'PENDING' && (
              <>
                {timedOut ? (
                  <>
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Оплата не подтверждена</h2>
                    <p className="text-sm text-gray-500 mb-6">
                      Статус платежа не обновился. Возможно, оплата ещё обрабатывается. Попробуйте обновить или повторить.
                    </p>
                    <div className="flex flex-col gap-3 w-full">
                      <Button onClick={() => { setTimedOut(false); setPollCount(0); fetchStatus(); }} className="w-full">
                        Проверить снова
                      </Button>
                      <Button variant="outline" onClick={() => router.back()} className="w-full">
                        Вернуться
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Spinner size="xl" className="mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ожидание оплаты</h2>
                    <p className="text-gray-500 text-sm mb-1">
                      {paymentTypeLabels[payment.paymentType] || payment.paymentType}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mb-4">
                      {payment.amount.toLocaleString('ru-RU')} ₸
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      Если вы уже оплатили, подождите несколько секунд. Страница обновится автоматически.
                    </p>
                    <Button variant="outline" onClick={() => router.push('/payment')} className="w-full">
                      Вернуться
                    </Button>
                  </>
                )}
              </>
            )}

            {(payment?.status === 'FAILED' || payment?.status === 'CANCELLED') && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {payment.status === 'CANCELLED' ? 'Оплата отменена' : 'Ошибка оплаты'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {payment.status === 'CANCELLED'
                    ? 'Вы отменили платёж.'
                    : 'К сожалению, платёж не прошёл. Попробуйте ещё раз.'}
                </p>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => router.push('/payment')} className="w-full">
                    Попробовать снова
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
                    Вернуться
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
