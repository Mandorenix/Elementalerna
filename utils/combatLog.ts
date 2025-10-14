import { type CombatLogMessage } from '../types';

let logMessageId = 0;

export const createLogMessage = (text: string, type: CombatLogMessage['type']): CombatLogMessage => {
  return { id: logMessageId++, text, type };
};