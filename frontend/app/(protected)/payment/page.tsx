'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Button,
  Card,
  CardBody,
  Spinner,
  Alert,
  useToast,
} from '@/components/ui';

// Allowed payment provider domains for security
const ALLOWED_PAYMENT_DOMAINS = [
  'kaspi.kz',
  'paybox.kz',
  'epay.kkb.kz',
  'pay.kaspi.kz',
  'test.paybox.kz',
];

/**
 * Validates payment URL to prevent XSS attacks
 * Only allows redirects to known payment provider domains
 */
function isValidPaymentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS for payment URLs
    if (parsed.protocol !== 'https:') {
      return false;
    }
    // Check if hostname ends with any allowed domain
    return ALLOWED_PAYMENT_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

interface PaymentDetails {
  id: string;
  amount: number;
  currency: string;
  paymentType: 'DIAGNOSTIC' | 'CONSULTATION' | 'SUBSCRIPTION';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentUrl?: string;
  testTitle?: string;
  subscriptionPlan?: string;
}

const paymentTypeLabels = {
  DIAGNOSTIC: 'Диагностика',
  CONSULTATION: 'Консультация',
  SUBSCRIPTION: 'Подписка',
};

const subscriptionPlans = [
  {
    id: 'BASIC',
    name: 'Базовый',
    price: 0,
    currency: 'KZT',
    features: ['1 бесплатный тест', 'Базовые результаты', 'Email поддержка'],
    popular: false,
  },
  {
    id: 'STANDARD',
    name: 'Стандартный',
    price: 3000,
    currency: 'KZT',
    features: [
      '5 тестов в месяц',
      'AI-интерпретация',
      'PDF-отчёты',
      'Приоритетная поддержка',
    ],
    popular: false,
  },
  {
    id: 'PREMIUM',
    name: 'Премиум',
    price: 5000,
    currency: 'KZT',
    features: [
      'Безлимитные тесты',
      'AI-интерпретация',
      'PDF-отчёты',
      '1 консультация в месяц',
      'Приоритетная поддержка',
      'Ранний доступ к новым тестам',
    ],
    popular: true,
  },
  {
    id: 'FAMILY',
    name: 'Семейный',
    price: 8000,
    currency: 'KZT',
    features: [
      'До 5 детей',
      'Безлимитные тесты',
      'AI-интерпретация',
      'PDF-отчёты',
      '2 консультации в месяц',
      'Семейная аналитика',
      'VIP поддержка',
    ],
    popular: false,
  },
];

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'KASPI' | 'CARD'>('KASPI');

  const testId = searchParams.get('testId');
  const consultationId = searchParams.get('consultationId');
  const subscriptionPlan = searchParams.get('plan');
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    if (subscriptionPlan) {
      setSelectedPlan(subscriptionPlan);
    }
  }, [subscriptionPlan]);

  useEffect(() => {
    if (paymentId) {
      checkPaymentStatus(paymentId);
    }
  }, [paymentId]);

  const checkPaymentStatus = async (id: string) => {
    try {
      const response = await api.get(`/payments/${id}`);
      setPayment(response.data);
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handleCreatePayment = async (type: 'DIAGNOSTIC' | 'CONSULTATION' | 'SUBSCRIPTION', relatedId: string) => {
    setLoading(true);
    try {
      const response = await api.post('/payments', {
        paymentType: type,
        relatedId,
        provider: paymentMethod,
      });

      setPayment(response.data);

      if (response.data.paymentUrl) {
        // Validate payment URL before redirect (XSS protection)
        if (isValidPaymentUrl(response.data.paymentUrl)) {
          window.location.href = response.data.paymentUrl;
        } else {
          console.error('Invalid payment URL detected:', response.data.paymentUrl);
          toast.error('Ошибка безопасности', 'Недействительный URL платёжной системы');
        }
      } else if (response.data.status === 'COMPLETED') {
        toast.success('Оплата успешна!', 'Вы можете продолжить использование сервиса');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error('Ошибка', error.response?.data?.message || 'Не удалось создать платёж');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (planId: string) => {
    handleCreatePayment('SUBSCRIPTION', planId);
  };

  const handlePayTest = () => {
    if (testId) {
      handleCreatePayment('DIAGNOSTIC', testId);
    }
  };

  const handlePayConsultation = () => {
    if (consultationId) {
      handleCreatePayment('CONSULTATION', consultationId);
    }
  };

  // Dev mode: simulate payment completion
  const handleSimulatePayment = async () => {
    if (!payment?.id) return;
    setLoading(true);
    try {
      await api.post(`/payments/${payment.id}/simulate-complete`);
      toast.success('Оплата симулирована!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Ошибка симуляции');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  // Payment status page
  if (payment && payment.status !== 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <Card>
            <CardBody className="text-center py-8">
              {payment.status === 'COMPLETED' ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Оплата успешна!</h2>
                  <p className="text-gray-600 mb-6">
                    {payment.amount.toLocaleString('ru-RU')} ₸
                  </p>
                  <Button onClick={() => router.push('/dashboard')}>
                    Перейти в кабинет
                  </Button>
                </>
              ) : payment.status === 'FAILED' ? (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка оплаты</h2>
                  <p className="text-gray-600 mb-6">
                    К сожалению, платёж не прошёл. Попробуйте ещё раз.
                  </p>
                  <Button onClick={() => setPayment(null)}>
                    Попробовать снова
                  </Button>
                </>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // Pending payment page
  if (payment && payment.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <Card>
            <CardBody className="text-center py-8">
              <Spinner size="xl" className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ожидание оплаты</h2>
              <p className="text-gray-600 mb-4">
                Сумма: {payment.amount.toLocaleString('ru-RU')} ₸
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Если вы уже оплатили, подождите несколько секунд. Страница обновится автоматически.
              </p>

              {payment.paymentUrl && isValidPaymentUrl(payment.paymentUrl) && (
                <Button
                  onClick={() => window.open(payment.paymentUrl, '_blank', 'noopener,noreferrer')}
                  className="mb-4"
                >
                  Открыть страницу оплаты
                </Button>
              )}

              {/* Dev mode button */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-gray-400 mb-2">Режим разработки</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulatePayment}
                    isLoading={loading}
                  >
                    Симулировать оплату
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // Subscription selection page (default)
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {testId ? 'Оплата теста' : consultationId ? 'Оплата консультации' : 'Выберите подписку'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {testId
              ? 'Оплатите тест для получения полного отчёта с AI-анализом'
              : consultationId
              ? 'Оплатите консультацию с психологом'
              : 'Выберите подходящий план для вашей семьи'}
          </p>
        </div>

        {/* Payment method selector */}
        {(testId || consultationId) && (
          <div className="max-w-md mx-auto mb-8">
            <Card>
              <CardBody>
                <h3 className="font-medium text-gray-900 mb-4">Способ оплаты</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('KASPI')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'KASPI'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg font-medium text-gray-900">Kaspi</div>
                    <div className="text-sm text-gray-500">Kaspi Pay / QR</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'CARD'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg font-medium text-gray-900">Карта</div>
                    <div className="text-sm text-gray-500">Visa / Mastercard</div>
                  </button>
                </div>

                <Button
                  onClick={testId ? handlePayTest : handlePayConsultation}
                  isLoading={loading}
                  className="w-full mt-6"
                >
                  Оплатить
                </Button>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Subscription plans */}
        {!testId && !consultationId && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-indigo-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-center py-1 text-sm font-medium">
                    Популярный
                  </div>
                )}
                <div className={`p-6 ${plan.popular ? 'pt-10' : ''}`}>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price === 0 ? 'Бесплатно' : `${plan.price.toLocaleString('ru-RU')} ₸`}
                    </span>
                    {plan.price > 0 && <span className="text-gray-500 ml-1">/мес</span>}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id)}
                    isLoading={loading && selectedPlan === plan.id}
                    disabled={plan.price === 0}
                  >
                    {plan.price === 0 ? 'Текущий план' : 'Выбрать'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-12 text-center">
          <Alert type="info" className="max-w-2xl mx-auto">
            <p className="text-sm">
              Все платежи защищены шифрованием. Мы не храним данные вашей карты.
              Отмена подписки возможна в любой момент.
            </p>
          </Alert>
        </div>
      </div>
    </div>
  );
}

function PaymentFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentContent />
    </Suspense>
  );
}
