'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface JitsiConfig {
  domain: string;
  roomName: string;
  configOverwrite?: object;
  interfaceConfigOverwrite?: object;
  userInfo?: {
    displayName?: string;
    email?: string;
  };
}

interface JitsiMeetProps {
  config: JitsiConfig;
  onReadyToClose?: () => void;
  onParticipantLeft?: () => void;
  onVideoConferenceJoined?: () => void;
  onVideoConferenceLeft?: () => void;
  className?: string;
}

interface MediaDeviceStatus {
  hasCamera: boolean;
  hasMicrophone: boolean;
  permissionDenied: boolean;
  errorMessage?: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: object) => {
      dispose: () => void;
      addListener: (event: string, handler: () => void) => void;
    };
  }
}

// Check if media devices (camera/microphone) are available
async function checkMediaDevices(): Promise<MediaDeviceStatus> {
  try {
    // First try to get stream to check permissions
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    // Stop all tracks immediately
    stream.getTracks().forEach(track => track.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(device => device.kind === 'videoinput' && device.deviceId);
    const hasMicrophone = devices.some(device => device.kind === 'audioinput' && device.deviceId);

    return { hasCamera, hasMicrophone, permissionDenied: false };
  } catch (err) {
    const error = err as Error;
    // Check if permission was denied
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return { hasCamera: false, hasMicrophone: false, permissionDenied: true, errorMessage: 'Доступ к камере и микрофону запрещен' };
    }
    // Check if devices not found
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return { hasCamera: false, hasMicrophone: false, permissionDenied: false, errorMessage: 'Камера или микрофон не найдены' };
    }
    // Other errors
    return { hasCamera: false, hasMicrophone: false, permissionDenied: false, errorMessage: error.message };
  }
}

export default function JitsiMeet({
  config,
  onReadyToClose,
  onParticipantLeft,
  onVideoConferenceJoined,
  onVideoConferenceLeft,
  className = '',
}: JitsiMeetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ReturnType<typeof window.JitsiMeetExternalAPI.prototype.constructor> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [deviceCheckComplete, setDeviceCheckComplete] = useState(false);

  // Generate the Jitsi room URL for QR code
  const jitsiRoomUrl = `https://${config.domain}/${config.roomName}`;

  useEffect(() => {
    // Check media devices first
    const checkDevices = async () => {
      const status = await checkMediaDevices();
      setDeviceCheckComplete(true);

      if (!status.hasCamera && !status.hasMicrophone) {
        setMediaError(status.errorMessage || 'Камера и микрофон недоступны');
        setShowQRCode(true);
        setIsLoading(false);
        return false;
      }
      return true;
    };

    // Загружаем Jitsi External API
    const loadJitsiScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = `https://${config.domain}/external_api.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi API'));
        document.head.appendChild(script);
      });
    };

    const initJitsi = async () => {
      try {
        // Check devices first
        const devicesAvailable = await checkDevices();
        if (!devicesAvailable) {
          return; // Show QR code instead
        }

        await loadJitsiScript();

        if (!containerRef.current) return;

        // Создаём экземпляр Jitsi
        const api = new window.JitsiMeetExternalAPI(config.domain, {
          roomName: config.roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: config.configOverwrite || {},
          interfaceConfigOverwrite: config.interfaceConfigOverwrite || {},
          userInfo: config.userInfo || {},
        });

        apiRef.current = api;

        // Добавляем обработчики событий
        api.addListener('readyToClose', () => {
          onReadyToClose?.();
        });

        api.addListener('participantLeft', () => {
          onParticipantLeft?.();
        });

        api.addListener('videoConferenceJoined', () => {
          setIsLoading(false);
          onVideoConferenceJoined?.();
        });

        api.addListener('videoConferenceLeft', () => {
          onVideoConferenceLeft?.();
        });
      } catch (err) {
        console.error('Error initializing Jitsi:', err);
        setError('Не удалось загрузить видеоконференцию');
        setShowQRCode(true);
        setIsLoading(false);
      }
    };

    initJitsi();

    // Cleanup
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [config, onReadyToClose, onParticipantLeft, onVideoConferenceJoined, onVideoConferenceLeft]);

  // Handle retry with QR code option
  const handleShowQRCode = () => {
    setShowQRCode(true);
  };

  const handleRetryWithDevices = async () => {
    setShowQRCode(false);
    setMediaError(null);
    setError(null);
    setIsLoading(true);
    setDeviceCheckComplete(false);
    // This will trigger the useEffect again
    window.location.reload();
  };

  // QR Code fallback view
  if (showQRCode) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center text-white max-w-md px-6">
          {/* Icon */}
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Error message */}
          {mediaError && (
            <p className="text-lg text-yellow-400 mb-4">{mediaError}</p>
          )}
          {error && !mediaError && (
            <p className="text-lg text-red-400 mb-4">{error}</p>
          )}

          {/* Instructions */}
          <h3 className="text-xl font-semibold mb-3">Подключитесь с телефона</h3>
          <p className="text-gray-400 mb-6">
            Отсканируйте QR-код камерой телефона для подключения к видеоконференции
          </p>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl inline-block mb-6">
            <QRCodeSVG
              value={jitsiRoomUrl}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Room URL */}
          <p className="text-sm text-gray-500 mb-6 break-all">
            Или перейдите по ссылке:<br />
            <a
              href={jitsiRoomUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {jitsiRoomUrl}
            </a>
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetryWithDevices}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 transition-colors"
            >
              Попробовать снова
            </button>
            <button
              onClick={onReadyToClose}
              className="rounded-lg border border-gray-600 px-6 py-3 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Закрыть
            </button>
          </div>

          {/* Tips */}
          <div className="mt-8 text-left bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-300 mb-2">Советы:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Откройте камеру телефона и наведите на QR-код</li>
              <li>• Нажмите на появившуюся ссылку</li>
              <li>• Разрешите доступ к камере и микрофону</li>
              <li>• Вы автоматически подключитесь к конференции</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (error && !showQRCode) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center text-white">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="mt-4 text-lg">{error}</p>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Попробовать снова
            </button>
            <button
              onClick={handleShowQRCode}
              className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800"
            >
              Показать QR-код
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
            <p className="mt-4">Подключение к видеоконференции...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
