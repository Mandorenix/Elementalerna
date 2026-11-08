import React, { useState, useCallback } from 'react';
import { configureAI, isAIConfigured, listAvailableModels, type AIEntity, createAIEntity } from '../src/services/aiService';

interface AISettingsProps {
  onApiKeyChange: (apiKey: string) => void;
  onModelChange: (model: string) => void;
  onNPCToggle: (enabled: boolean) => void;
  onEventGenToggle: (enabled: boolean) => void;
  currentModel: string;
  npcEnabled: boolean;
  eventGenEnabled: boolean;
}

const AISettings: React.FC<AISettingsProps> = ({
  onApiKeyChange,
  onModelChange,
  onNPCToggle,
  onEventGenToggle,
  currentModel,
  npcEnabled,
  eventGenEnabled,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<Array<{ id: string; name: string }> | null>(null);
  const [status, setStatus] = useState('');

  const handleConfigure = useCallback(() => {
    if (!apiKey.trim()) {
      setStatus('Ange en API-nyckel');
      return;
    }
    configureAI(apiKey.trim());
    onApiKeyChange(apiKey.trim());
    setStatus('API-nyckel sparat');
  }, [apiKey, onApiKeyChange]);

  const handleFetchModels = useCallback(async () => {
    const result = await listAvailableModels();
    if (result) {
      setModels(result);
    }
  }, []);

  return (
    <div className="bg-black/60 border border-yellow-600/30 rounded p-3">
      <h3 className="text-yellow-400 font-bold text-xs mb-3">🤖 AI-inställningar</h3>

      <div className="mb-3">
        <label className="text-gray-400 text-xs block mb-1">API-nyckel</label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="pk_..."
          className="w-full bg-gray-900 border border-gray-600 text-gray-200 text-xs p-2 rounded mb-1"
        />
        <button onClick={handleConfigure} className="px-3 py-1 bg-yellow-800/50 border border-yellow-600 text-yellow-300 text-xs rounded hover:bg-yellow-700/50">
          Spara nyckel
        </button>
        {isAIConfigured() && <span className="text-green-400 text-xs ml-2">✓ Ansluten</span>}
      </div>

      <div className="mb-3">
        <label className="text-gray-400 text-xs block mb-1">Textmodell</label>
        <select
          value={currentModel}
          onChange={e => onModelChange(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 text-gray-200 text-xs p-2 rounded"
        >
          <option value="openai">openai</option>
          <option value="mistral">mistral</option>
        </select>
      </div>

      <div className="mb-3">
        <button onClick={handleFetchModels} className="px-3 py-1 border border-gray-600 text-gray-300 text-xs rounded hover:border-yellow-500">
          Hämta tillgängliga modeller
        </button>
        {models && (
          <div className="mt-1 text-xs text-gray-500">
            {models.map(m => (
              <div key={m.id}>{m.name} ({m.id})</div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs">NPC-dialogn</span>
        <button
          onClick={() => onNPCToggle(!npcEnabled)}
          className={`w-10 h-5 rounded-full transition-colors ${npcEnabled ? 'bg-yellow-600' : 'bg-gray-700'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${npcEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs">AI-händelsegenerering</span>
        <button
          onClick={() => onEventGenToggle(!eventGenEnabled)}
          className={`w-10 h-5 rounded-full transition-colors ${eventGenEnabled ? 'bg-yellow-600' : 'bg-gray-700'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${eventGenEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {status && <p className="text-xs text-gray-500 mt-2">{status}</p>}
    </div>
  );
};

export default AISettings;