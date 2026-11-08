import React, { useState, useCallback } from 'react';
import { generateEventCardContent } from '../src/services/aiService';
import { Element } from '../types';

interface AIEventGeneratorProps {
  element: Element;
  roundLevel: number;
  playerLevel: number;
  onGenerated: (title: string, description: string) => void;
}

const AIEventGenerator: React.FC<AIEventGeneratorProps> = ({ element, roundLevel, playerLevel, onGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedDesc, setGeneratedDesc] = useState('');

  const generateEvent = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedTitle('');
    setGeneratedDesc('');

    try {
      const result = await generateEventCardContent(element, roundLevel, playerLevel, 'openai');
      if (result) {
        setGeneratedTitle(result.title);
        setGeneratedDesc(result.description);
        onGenerated(result.title, result.description);
      }
    } catch (error) {
      console.warn('[AIEventGenerator] Failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [element, roundLevel, playerLevel, onGenerated]);

  return (
    <div className="bg-black/40 border border-yellow-600/30 rounded p-3">
      <h3 className="text-yellow-400 font-bold text-xs mb-2">🤖 AI Event Generator</h3>
      <button
        onClick={generateEvent}
        disabled={isGenerating}
        className="w-full px-3 py-2 border-2 border-yellow-600 bg-yellow-800/30 hover:bg-yellow-700/50 text-yellow-300 text-xs font-bold transition-colors disabled:opacity-50"
      >
        {isGenerating ? 'Genererar...' : 'Generera AI-händelse'}
      </button>
      {generatedTitle && (
        <div className="mt-2">
          <p className="text-yellow-300 text-xs font-bold">{generatedTitle}</p>
          <p className="text-gray-400 text-xs mt-1">{generatedDesc}</p>
        </div>
      )}
    </div>
  );
};

export default AIEventGenerator;