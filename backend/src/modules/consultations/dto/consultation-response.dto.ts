export class ConsultationResponseDto {
  id: string;
  psychologistId: string;
  psychologistName: string;
  psychologistAvatarUrl: string | null;
  clientId: string;
  clientName: string;
  childId: string | null;
  childName: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  status: string;
  roomUrl: string | null;
  price: number;
  paymentStatus: string;
  notes: string | null;
  cancelReason: string | null;
  rating: number | null;
  review: string | null;
  createdAt: Date;
}

export class ConsultationListResponseDto {
  consultations: ConsultationResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class ConsultationDetailResponseDto extends ConsultationResponseDto {
  roomName: string | null;
}
