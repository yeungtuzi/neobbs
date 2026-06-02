import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpeechService } from './speech.service';

@Controller('ai')
export class AiController {
  constructor(private readonly speechService: SpeechService) {}

  @Post('speech')
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    const text = await this.speechService.transcribe(file.buffer);
    return { text };
  }
}
