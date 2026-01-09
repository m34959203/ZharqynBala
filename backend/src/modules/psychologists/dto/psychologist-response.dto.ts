export class PsychologistResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  specialization: string[];
  experienceYears: number;
  education: string;
  bio: string | null;
  hourlyRate: number;
  rating: number;
  totalConsultations: number;
  isAvailable: boolean;
}

export class PsychologistDetailResponseDto extends PsychologistResponseDto {
  certificateUrl: string | null;
  availability: PsychologistAvailabilityDto[];
}

export class PsychologistAvailabilityDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export class PsychologistListResponseDto {
  psychologists: PsychologistResponseDto[];
  total: number;
  page: number;
  limit: number;
}
