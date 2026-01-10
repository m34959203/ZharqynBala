import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

/**
 * Сервис для работы с Jitsi Meet
 * Jitsi Meet - бесплатное open-source решение для видеозвонков
 * Работает в браузере без установки приложений
 * Используем 8x8.vc - официальный хостинг Jitsi без требования авторизации
 */
@Injectable()
export class JitsiService {
  private readonly jitsiDomain: string;

  constructor(private readonly configService: ConfigService) {
    // 8x8.vc - официальный бесплатный сервер от команды Jitsi без требования авторизации
    this.jitsiDomain = this.configService.get<string>('JITSI_DOMAIN') || '8x8.vc';
  }

  /**
   * Генерация уникального имени комнаты для консультации
   */
  generateRoomName(consultationId: string): string {
    // Формат: zharqynbala-{короткий ID консультации}-{случайный токен}
    const shortId = consultationId.slice(0, 8);
    const randomToken = randomBytes(4).toString('hex');
    return `zharqynbala-${shortId}-${randomToken}`;
  }

  /**
   * Получение URL комнаты для видеозвонка
   */
  getRoomUrl(roomName: string): string {
    return `https://${this.jitsiDomain}/${roomName}`;
  }

  /**
   * Создание комнаты для консультации
   * Jitsi автоматически создаёт комнату при первом входе
   */
  async createRoom(consultationId: string): Promise<{ roomName: string; roomUrl: string }> {
    const roomName = this.generateRoomName(consultationId);
    const roomUrl = this.getRoomUrl(roomName);

    return {
      roomName,
      roomUrl,
    };
  }

  /**
   * Получение настроек для встраивания Jitsi в iframe
   * Эти настройки передаются на фронтенд для инициализации JitsiMeetExternalAPI
   */
  getEmbedConfig(roomName: string, userName: string, userEmail?: string) {
    return {
      domain: this.jitsiDomain,
      roomName,
      configOverwrite: {
        // Настройки безопасности и приватности
        disableDeepLinking: true,
        prejoinPageEnabled: false, // Сразу заходим в комнату без предпросмотра
        enableNoisyMicDetection: true,

        // Отключаем lobby для свободного входа
        enableLobby: false,
        hideLobbyButton: true,

        // Настройки интерфейса
        defaultLanguage: 'ru',
        disableThirdPartyRequests: true,

        // Ограничения для консультаций
        startWithAudioMuted: false,
        startWithVideoMuted: false,

        // Отключаем ненужные функции
        enableWelcomePage: false,
        enableClosePage: false,

        // Разрешаем подключение без модератора
        startAudioOnly: false,
        disableModeratorIndicator: true,
      },
      interfaceConfigOverwrite: {
        // Брендинг
        APP_NAME: 'Zharqyn Bala',
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_LOGO_URL: '',
        DEFAULT_WELCOME_PAGE_LOGO_URL: '',

        // Панель инструментов
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'hangup',
          'chat',
          'settings',
          'videoquality',
          'tileview',
        ],

        // Настройки отображения
        DISABLE_VIDEO_BACKGROUND: false,
        HIDE_INVITE_MORE_HEADER: true,
        MOBILE_APP_PROMO: false,
      },
      userInfo: {
        displayName: userName,
        email: userEmail,
      },
    };
  }
}
