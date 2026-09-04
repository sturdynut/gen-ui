import Anthropic from '@anthropic-ai/sdk';
import type { Handler, HandlerEvent } from '@netlify/functions';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8888',
  'http://localhost:9999',
];

function corsHeaders(origin: string | undefined) {
  const allowed =
    origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.netlify.app'))
      ? origin
      : ALLOWED_ORIGINS[0]!;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, x-anthropic-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers['origin'];

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(origin), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(origin), body: 'Method not allowed' };
  }

  const apiKey = event.headers['x-anthropic-key'];
  if (!apiKey) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing x-anthropic-key header' }),
    };
  }

  let messages: Anthropic.MessageParam[];
  let systemPrompt: string;

  try {
    const body = JSON.parse(event.body ?? '{}') as {
      messages?: Anthropic.MessageParam[];
      systemPrompt?: string;
    };
    messages = body.messages ?? [];
    systemPrompt = body.systemPrompt ?? '';
  } catch {
    return {
      statusCode: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!messages.length) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'messages array is empty' }),
    };
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    return {
      statusCode: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = (err as { status?: number }).status ?? 500;

    return {
      statusCode: status,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message }),
    };
  }
};
