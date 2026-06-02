import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { SpeechService } from './speech.service';

@Module({
  controllers: [AiController],
  providers: [SpeechService],
})
export class AiModule {}
