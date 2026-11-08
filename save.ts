import React from 'react';
import type { Character, Item, EquipmentSlot, View, ItemStats, Rarity } from './types';
import { Icons } from './constants';
import { isSaveDataV1, SAVE_VERSION } from './utils/validateSaveData';

const SAVE_KEY = 'elementalerna_save_data';

export interface SaveData {
    version: number;
    timestamp: number;
    character: Character;
    skillPoints: number;
    attributePoints: number;
    elementalPoints: number;
    unlockedSkillEntries: [string, number][];
    equipment: Record<string, SerializableItem | null>;
    inventory: SerializableItem[];
    gold: number;
    roundLevel: number;
    gameStarted: boolean;
    activeView: View;
}

interface SerializableItem {
    id: string;
    name: string;
    rarity: Rarity;
    slot: string;
    stats: ItemStats;
    affix?: { trigger: string; effect: Record<string, unknown>; description: string };
    price?: number;
    consumableEffect?: Record<string, unknown>;
    isRelic?: boolean;
}

export function hasSaveData(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
}

export function saveGame(
    character: Character,
    skillPoints: number,
    attributePoints: number,
    elementalPoints: number,
    unlockedSkills: Map<string, number>,
    equipment: Record<string, Item | null>,
    inventory: Item[],
    gold: number,
    roundLevel: number,
    gameStarted: boolean,
    activeView: View,
): void {
    const data: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        character,
        skillPoints,
        attributePoints,
        elementalPoints,
        unlockedSkillEntries: Array.from(unlockedSkills.entries()),
        equipment: Object.fromEntries(
            Object.entries(equipment).map(([slot, item]) => [slot, item ? toSerializable(item) : null])
        ),
        inventory: inventory.map(toSerializable),
        gold,
        roundLevel,
        gameStarted,
        activeView,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
        const data: unknown = JSON.parse(raw);
        if (!isSaveDataV1(data)) return null;
        return data;
    } catch {
        return null;
    }
}

export function deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
}

function toSerializable(item: Item): SerializableItem {
    return {
        id: item.id,
        name: item.name,
        rarity: item.rarity,
        slot: item.slot,
        stats: item.stats,
        affix: item.affix ? { trigger: item.affix.trigger, effect: item.affix.effect as Record<string, unknown>, description: item.affix.description } : undefined,
        price: item.price,
        consumableEffect: item.consumableEffect as Record<string, unknown> | undefined,
        isRelic: item.isRelic,
    };
}

export function restoreItem(data: SerializableItem): Item {
    const iconMap: Record<string, React.FC> = {
        'start_helmet': Icons.Shield,
        'start_weapon': Icons.Fire,
    };

    let icon: React.FC;

    if (data.id in iconMap) {
        icon = iconMap[data.id];
    } else if (data.isRelic) {
        icon = Icons.Earth;
    } else if (data.slot === 'Föremål') {
        icon = Icons.Water;
    } else {
        switch (data.slot) {
            case 'Hjälm':
            case 'Bröst':
            case 'Handskar':
            case 'Bälte':
            case 'Byxor':
            case 'Stövlar':
                icon = Icons.Shield;
                break;
            case 'Vapen 1':
            case 'Vapen 2':
                icon = Icons.Fire;
                break;
            default:
                icon = Icons.Start;
        }
    }

    return {
        id: data.id,
        name: data.name,
        rarity: data.rarity,
        slot: data.slot as EquipmentSlot | 'Föremål',
        stats: data.stats,
        icon,
        affix: data.affix as Item['affix'],
        price: data.price,
        consumableEffect: data.consumableEffect as Item['consumableEffect'],
        isRelic: data.isRelic,
    };
}
