import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePatientNoteDto, UpdatePatientNoteDto, PatientNoteResponseDto } from './dto/patient-note.dto';

@Injectable()
export class PatientNotesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePatientNoteDto): Promise<PatientNoteResponseDto> {
    // Get psychologist by userId
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!psychologist) {
      throw new ForbiddenException('Только психологи могут создавать заметки о пациентах');
    }

    // Verify the client exists
    const client = await this.prisma.user.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    // Verify child if provided
    if (dto.childId) {
      const child = await this.prisma.child.findUnique({
        where: { id: dto.childId },
      });
      if (!child) {
        throw new NotFoundException('Ребёнок не найден');
      }
    }

    // Verify consultation if provided
    if (dto.consultationId) {
      const consultation = await this.prisma.consultation.findFirst({
        where: {
          id: dto.consultationId,
          psychologistId: psychologist.id,
        },
      });
      if (!consultation) {
        throw new NotFoundException('Консультация не найдена или не принадлежит вам');
      }
    }

    const note = await this.prisma.patientNote.create({
      data: {
        psychologistId: psychologist.id,
        clientId: dto.clientId,
        childId: dto.childId,
        consultationId: dto.consultationId,
        title: dto.title,
        content: dto.content,
        chiefComplaint: dto.chiefComplaint,
        historyOfIllness: dto.historyOfIllness,
        mentalStatus: dto.mentalStatus,
        diagnosis: dto.diagnosis,
        recommendations: dto.recommendations,
        treatmentPlan: dto.treatmentPlan,
        additionalData: dto.additionalData as Prisma.InputJsonValue,
        isPrivate: dto.isPrivate ?? true,
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    return this.mapToResponse(note);
  }

  async findAllForPsychologist(userId: string, clientId?: string): Promise<PatientNoteResponseDto[]> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    if (!psychologist) {
      throw new ForbiddenException('Только психологи могут просматривать заметки');
    }

    const notes = await this.prisma.patientNote.findMany({
      where: {
        psychologistId: psychologist.id,
        ...(clientId && { clientId }),
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return notes.map((note) => this.mapToResponse(note));
  }

  async findByConsultation(userId: string, consultationId: string): Promise<PatientNoteResponseDto[]> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    if (!psychologist) {
      throw new ForbiddenException('Только психологи могут просматривать заметки');
    }

    // Verify consultation belongs to this psychologist
    const consultation = await this.prisma.consultation.findFirst({
      where: {
        id: consultationId,
        psychologistId: psychologist.id,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Консультация не найдена или не принадлежит вам');
    }

    const notes = await this.prisma.patientNote.findMany({
      where: {
        consultationId,
        psychologistId: psychologist.id,
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return notes.map((note) => this.mapToResponse(note));
  }

  async findOne(userId: string, noteId: string): Promise<PatientNoteResponseDto> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    if (!psychologist) {
      throw new ForbiddenException('Только психологи могут просматривать заметки');
    }

    const note = await this.prisma.patientNote.findFirst({
      where: {
        id: noteId,
        psychologistId: psychologist.id,
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    if (!note) {
      throw new NotFoundException('Заметка не найдена');
    }

    return this.mapToResponse(note);
  }

  async update(userId: string, noteId: string, dto: UpdatePatientNoteDto): Promise<PatientNoteResponseDto> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    if (!psychologist) {
      throw new ForbiddenException('Только психологи могут редактировать заметки');
    }

    const existingNote = await this.prisma.patientNote.findFirst({
      where: {
        id: noteId,
        psychologistId: psychologist.id,
      },
    });

    if (!existingNote) {
      throw new NotFoundException('Заметка не найдена');
    }

    const note = await this.prisma.patientNote.update({
      where: { id: noteId },
      data: {
        title: dto.title,
        content: dto.content,
        chiefComplaint: dto.chiefComplaint,
        historyOfIllness: dto.historyOfIllness,
        mentalStatus: dto.mentalStatus,
        diagnosis: dto.diagnosis,
        recommendations: dto.recommendations,
        treatmentPlan: dto.treatmentPlan,
        additionalData: dto.additionalData as Prisma.InputJsonValue,
        isPrivate: dto.isPrivate,
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    return this.mapToResponse(note);
  }

  async delete(userId: string, noteId: string): Promise<void> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    if (!psychologist) {
      throw new ForbiddenException('Только психологи могут удалять заметки');
    }

    const existingNote = await this.prisma.patientNote.findFirst({
      where: {
        id: noteId,
        psychologistId: psychologist.id,
      },
    });

    if (!existingNote) {
      throw new NotFoundException('Заметка не найдена');
    }

    await this.prisma.patientNote.delete({
      where: { id: noteId },
    });
  }

  private mapToResponse(note: any): PatientNoteResponseDto {
    return {
      id: note.id,
      psychologistId: note.psychologistId,
      psychologistName: `${note.psychologist.user.firstName} ${note.psychologist.user.lastName}`,
      clientId: note.clientId,
      clientName: `${note.client.firstName} ${note.client.lastName}`,
      childId: note.childId,
      childName: note.child ? `${note.child.firstName} ${note.child.lastName}` : undefined,
      consultationId: note.consultationId,
      title: note.title,
      content: note.content,
      chiefComplaint: note.chiefComplaint,
      historyOfIllness: note.historyOfIllness,
      mentalStatus: note.mentalStatus,
      diagnosis: note.diagnosis,
      recommendations: note.recommendations,
      treatmentPlan: note.treatmentPlan,
      additionalData: note.additionalData as Record<string, unknown>,
      isPrivate: note.isPrivate,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
