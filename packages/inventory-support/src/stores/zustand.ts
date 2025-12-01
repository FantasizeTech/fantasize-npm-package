// Lightweight adapter example for Zustand
import type { StoreApi } from 'zustand';
import type { InventoryState } from '../types';

export type ZustandInventoryStore = StoreApi<InventoryState>;
