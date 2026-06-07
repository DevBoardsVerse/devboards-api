import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SuggestTaskDto } from './suggest-task.dto';

export interface SuggestTaskResult {
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
}

@Injectable()
export class AiService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly model = 'llama-3.1-8b-instant';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GROQ_API_KEY')!;
  }

  async suggestTask(dto: SuggestTaskDto): Promise<SuggestTaskResult> {
    const prompt = `You are a project management assistant. Given a task title and optional description, return a JSON object with:
- "description": a clear, concise task description (2-4 sentences, actionable)
- "priority": one of "low", "medium", "high", "urgent"
- "reason": one sentence explaining the priority choice

Task title: "${dto.title}"
${dto.description ? `Existing description: "${dto.description}"` : ''}

Respond ONLY with valid JSON. No markdown, no backticks, no extra text.`;

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    if (!response.ok) {
      throw new InternalServerErrorException('Groq API request failed');
    }

    try {
      return JSON.parse(raw) as SuggestTaskResult;
    } catch {
      throw new InternalServerErrorException('Failed to parse AI response');
    }
  }
}