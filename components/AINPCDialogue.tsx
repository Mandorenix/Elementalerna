import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chat, chatStream, conversation } from '@pollinations/sdk';
import { NPC_PERSONALITIES } from '../src/services/aiPrompts';

interface AINPCDialogueProps {
  npcName: string;
  npcRole?: string;
  playerInput: string;
  onResponse: (response: string) => void;
  isActive: boolean;
}

const AINPCDialogue: React.FC<AINPCDialogueProps> = ({ npcName, npcRole, playerInput, onResponse, isActive }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [conversationLog, setConversationLog] = useState<Array<{ role: 'player' | 'npc'; text: string }>>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const personality = NPC_PERSONALITIES[npcRole || ''] || NPC_PERSONALITIES['Stenväktaren'];

  const SYSTEM_PROMPT = `Du är "${npcName}" i ett episkt fantasy-kortspel. Din personlighet: ${personality}. Svara alltid på svenska, kort och dramatiskt (max 3 meningar). Du är i ett combat/scenario med spelaren. Var alltid i karaktär.`;

  const scrollToBottom = useCallback(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversationLog, scrollToBottom]);

  const handleGetResponse = useCallback(async () => {
    if (!playerInput.trim() || isLoading) return;

    setIsLoading(true);
    setStreamText('');

    const newLog = [...conversationLog, { role: 'player' as const, text: playerInput }];
    setConversationLog(newLog);

    abortRef.current = new AbortController();

    try {
      const messages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...newLog.map(msg => ({
          role: msg.role === 'player' ? 'user' as const : 'assistant' as const,
          content: msg.text,
        })),
      ];

      let fullResponse = '';
      for await (const chunk of chatStream(messages, { temperature: 0.8, model: 'openai' })) {
        if (abortRef.current?.signal.aborted) break;
        const text = chunk.choices?.[0]?.delta?.content || '';
        if (text) {
          fullResponse += text;
          setStreamText(fullResponse);
        }
      }

      const finalResponse = fullResponse || '...';
      setConversationLog(prev => [...prev, { role: 'npc', text: finalResponse }]);
      onResponse(finalResponse);
    } catch (error) {
      console.warn('[AINPCDialogue] Stream failed:', error);
      setStreamText('...');
      onResponse('...');
    } finally {
      setIsLoading(false);
    }
  }, [playerInput, isLoading, conversationLog, onResponse, SYSTEM_PROMPT]);

  useEffect(() => {
    if (isActive && playerInput.trim()) {
      handleGetResponse();
    }
  }, [isActive]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
        <span className="text-yellow-400 font-bold text-xs">{npcName}</span>
        {isLoading && <span className="text-gray-500 text-xs animate-pulse">tänker...</span>}
      </div>
      <div className="bg-black/60 border border-yellow-600/30 rounded p-3 max-h-40 overflow-y-auto">
        {conversationLog.map((msg, i) => (
          <div key={i} className={`mb-1 text-xs ${msg.role === 'player' ? 'text-blue-300' : 'text-yellow-200'}`}>
            <span className="font-bold">{msg.role === 'player' ? 'Du: ' : `${npcName}: `}</span>
            {msg.text}
          </div>
        ))}
        {streamText && (
          <div className="text-yellow-200 text-xs">
            <span className="font-bold">{npcName}: </span>
            {streamText}
            <span className="animate-pulse">|</span>
          </div>
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default AINPCDialogue;