'use client';

import { useEffect, useRef, useState } from 'react';

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

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: object) => {
      dispose: () => void;
      addListener: (event: string, handler: () => void) => void;
    };
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

  useEffect(() => {
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

  if (error) {
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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Попробовать снова
          </button>
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
