const BASE_URL = 'https://gen.pollinations.ai';
let _apiKey = '';

export function configureAI(apiKey: string): void {
  _apiKey = apiKey;
}

export function isAIConfigured(): boolean {
  return _apiKey.length > 0;
}

const ELEMENT_NAMES: Record<number, string> = {
  [0]: 'neutral',
  [1]: 'eld',
  [2]: 'jord',
  [3]: 'vind',
  [4]: 'vatten',
  [5]: 'magma',
  [6]: 'obsidian',
  [7]: 'eldstorm',
  [8]: 'het luft',
  [9]: 'ång',
  [10]: 'varma källor',
  [11]: 'sand',
  [12]: 'erosion',
  [13]: 'lera',
  [14]: 'växt',
  [15]: 'is',
  [16]: 'storm',
  [17]: 'vulkanstorm',
  [18]: 'elektrifierad lera',
  [19]: 'vitrifierad storm',
  [20]: 'ljus',
  [21]: 'mörker',
};

const ELEMENT_ADJECTIVES: Record<number, string> = {
  [1]: 'eldande',
  [2]: 'jordbundet',
  [3]: 'virvelande',
  [4]: 'strömmande',
  [5]: 'slitande',
  [6]: 'mörk',
  [7]: 'stormande',
  [8]: 'het',
  [9]: 'ång',
  [10]: 'värme',
  [11]: 'sandig',
  [12]: 'erosiv',
  [13]: 'klämd',
  [14]: 'växande',
  [15]: 'fryst',
  [16]: 'åska',
  [17]: 'vulkanisk',
  [18]: 'elektrisk',
  [19]: 'glasig',
  [20]: 'ljus',
  [21]: 'skymningsfylld',
};

async function postJSON(url: string, body: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_apiKey) headers['Authorization'] = `Bearer ${_apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchText(url: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (_apiKey) headers['Authorization'] = `Bearer ${_apiKey}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const SYSTEM_PROMPT = 'Du är en spelare i ett episkt fantasy-kortspel. Svara alltid på svenska. Håll svaret kort och dramatiskt (max 2-3 meningar). Använd en målande, episk ton. Bygg vidare på spelets elementära magi- och fantasyvärld. Svara alltid i karaktär.';

export interface ChatResponse {
  text: string;
  model: string;
  tokens?: { input: number; output: number };
}

export async function generateNLPDialogue(
  characterName: string,
  characterPersonality: string,
  playerInput: string,
  conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [],
  model: string = 'openai'
): Promise<string | null> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `Du är "${characterName}". Din personlighet: ${characterPersonality}` },
    ...conversationHistory,
    { role: 'user', content: playerInput },
  ];

  try {
    const data = await postJSON(`${BASE_URL}/v1/chat/completions`, {
      model,
      messages,
      temperature: 0.8,
      max_tokens: 300,
    }) as any;
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.warn('[AI] Dialogue generation failed:', error);
    return null;
  }
}

export async function* streamNLPDialogue(
  characterName: string,
  characterPersonality: string,
  playerInput: string,
  conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [],
  model: string = 'openai'
): AsyncGenerator<string, void, unknown> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `Du är "${characterName}". Din personlighet: ${characterPersonality}` },
    ...conversationHistory,
    { role: 'user', content: playerInput },
  ];

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (_apiKey) headers['Authorization'] = `Bearer ${_apiKey}`;
    const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.8, stream: true, max_tokens: 300 }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader = res.body?.getReader();
    if (!reader) return;

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += new TextDecoder().decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const json = line.slice(6);
          if (json === '[DONE]') return;
          try {
            const parsed = JSON.parse(json);
            const text = parsed.choices?.[0]?.delta?.content || '';
            if (text) yield text;
          } catch { /* ignore parse errors in stream */ }
        }
      }
    }
  } catch (error) {
    console.warn('[AI] Stream dialogue failed:', error);
    yield '...';
  }
}

export async function generateEventCardContent(
  element: number,
  roundLevel: number,
  playerLevel: number,
  model: string = 'openai'
): Promise<{ title: string; description: string } | null> {
  const elementName = ELEMENT_NAMES[element] || 'neutral';
  const adjective = ELEMENT_ADJECTIVES[element] || 'mystisk';

  const prompt = `Skriv ett kort händelsekort för ett fantasy-kortspel. Element: ${elementName} (${adjective}), Omgång: ${roundLevel}, Spelarnivå: ${playerLevel}.
Ge ENDAST ett JSON-objekt med två fält: "title" (kort titel, max 30 tecken) och "description" (2-3 meningar, max 200 tecken). Beskriv vad spelaren ser, hör eller känner. Använd svenska. Skriv INTE markdown, INTE förklaringar, bara JSON.`;

  try {
    const data = await postJSON(`${BASE_URL}/v1/chat/completions`, {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 500,
    }) as any;
    const raw = data.choices?.[0]?.message?.content?.trim() || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}$/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.title && parsed.description) {
      return { title: parsed.title, description: parsed.description };
    }
    return null;
  } catch (error) {
    console.warn('[AI] Event card generation failed:', error);
    return null;
  }
}

export async function generateCharacterName(
  element: number,
  archetype: string,
  model: string = 'openai'
): Promise<string | null> {
  const elementName = ELEMENT_NAMES[element] || 'neutral';
  const prompt = `Ge mig exakt EN svensk fantasy karaktärsnamn kopplad till elementet ${elementName} och arketyp ${archetype}. Returnera BARA namnet, inget annat.`;

  try {
    const data = await postJSON(`${BASE_URL}/v1/chat/completions`, {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 50,
    }) as any;
    return data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') || null;
  } catch (error) {
    console.warn('[AI] Name generation failed:', error);
    return null;
  }
}

export async function generateItemDescription(
  itemName: string,
  rarity: string,
  element: number,
  model: string = 'openai'
): Promise<string | null> {
  const elementName = ELEMENT_NAMES[element] || 'neutral';
  const prompt = `Skriv en kort atmosphärisk beskrivning (max 60 tecken) av ett magiskt föremål vid namn "${itemName}" (sällskap: ${rarity}, element: ${elementName}) för ett fantasy-kortspel. Använd svenska. Skriv BARA beskrivningen.`;

  try {
    const data = await postJSON(`${BASE_URL}/v1/chat/completions`, {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    }) as any;
    return data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') || null;
  } catch (error) {
    console.warn('[AI] Item description failed:', error);
    return null;
  }
}

export async function generateNPCResponse(
  npcName: string,
  npcPersonality: string,
  playerText: string,
  model: string = 'openai'
): Promise<string | null> {
  const systemPrompt = `Du är "${npcName}" i ett episkt fantasy-kortspel. Dina karaktärsdrag: ${npcPersonality}. Svara alltid på svenska, kort och i karaktär (max 2 meningar).`;

  try {
    const data = await postJSON(`${BASE_URL}/v1/chat/completions`, {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: playerText },
      ],
      temperature: 0.8,
      max_tokens: 200,
    }) as any;
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.warn('[AI] NPC response failed:', error);
    return null;
  }
}

export async function generateEnemyFlavorText(
  enemyName: string,
  element: number,
  model: string = 'openai'
): Promise<string | null> {
  const elementName = ELEMENT_NAMES[element] || 'neutral';
  const adjective = ELEMENT_ADJECTIVES[element] || 'mystisk';
  const prompt = `Beskriv en kort, hotfull fiende-beskrivning (max 40 tecken) för en "${enemyName}" av elementet ${elementName} (${adjective}) i ett fantasy-kortspel. Använd svenska. Bara beskrivningen.`;

  try {
    const data = await postJSON(`${BASE_URL}/v1/chat/completions`, {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 80,
    }) as any;
    return data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') || null;
  } catch (error) {
    console.warn('[AI] Enemy flavor text failed:', error);
    return null;
  }
}

export interface AIEntity {
  name: string;
  personality: string;
  systemPrompt: string;
  conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}

export function createAIEntity(
  name: string,
  personality: string,
  systemPrompt: string = SYSTEM_PROMPT
): AIEntity {
  return {
    name,
    personality,
    systemPrompt,
    conversationHistory: [{ role: 'system', content: systemPrompt }],
  };
}

export async function generateNPCReport(
  entity: AIEntity,
  playerInput: string,
  model: string = 'openai'
): Promise<string> {
  const messages = [
    ...entity.conversationHistory,
    { role: 'user', content: playerInput },
  ];

  try {
    const data = await postJSON(`${BASE_URL}/v1/chat/completions`, {
      model,
      messages,
      temperature: 0.8,
      max_tokens: 300,
    }) as any;
    const responseText = data.choices?.[0]?.message?.content || '...';
    entity.conversationHistory.push({ role: 'user', content: playerInput });
    entity.conversationHistory.push({ role: 'assistant', content: responseText });
    return responseText;
  } catch (error) {
    console.warn('[AI] NPC report failed:', error);
    return '...';
  }
}

export async function listAvailableModels(): Promise<Array<{ id: string; name: string }> | null> {
  try {
    const data = await fetchText(`${BASE_URL}/v1/models`);
    const parsed = JSON.parse(data);
    return parsed.data?.map((m: any) => ({ id: m.id, name: m.name || m.id })) || null;
  } catch (error) {
    console.warn('[AI] Model listing failed:', error);
    return null;
  }
}
