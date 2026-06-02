import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import sharp from 'sharp';

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/ogg', 'audio/wav',
  'application/pdf',
  'text/plain', 'application/zip',
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(file: Express.Multer.File, userId: string) {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      throw new BadRequestException(`File type not allowed: ${file.mimetype}`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds 20MB limit');
    }

    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const dateDir = new Date().toISOString().slice(0, 7); // YYYY-MM
    const dir = path.join(process.env.UPLOAD_DIR || './uploads', dateDir);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), file.buffer);

    const isImage = file.mimetype.startsWith('image/');
    let imageWidth: number | null = null;
    let imageHeight: number | null = null;
    let thumbnailPath: string | null = null;

    if (isImage) {
      try {
        const meta = await sharp(file.buffer).metadata();
        imageWidth = meta.width || null;
        imageHeight = meta.height || null;

        // Generate thumbnail (max 400px wide)
        const thumbFilename = `thumb_${filename}`;
        await sharp(file.buffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .toFile(path.join(dir, thumbFilename));
        thumbnailPath = path.join(dateDir, thumbFilename);
      } catch {
        // Non-critical: proceed without thumbnail
      }
    }

    const storagePath = path.join(dateDir, filename);

    const attachment = await this.prisma.attachment.create({
      data: {
        userId,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        storagePath,
        isImage,
        imageWidth,
        imageHeight,
        thumbnailPath,
      },
    });

    return {
      id: attachment.id,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: Number(attachment.sizeBytes),
      isImage: attachment.isImage,
      imageWidth: attachment.imageWidth,
      imageHeight: attachment.imageHeight,
      url: `/uploads/${storagePath}`,
    };
  }
}
