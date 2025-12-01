// Lightweight adapter example for Jotai
import type { Atom } from 'jotai';
import type { InventoryState } from '../types';

export type JotaiInventoryStore = {
  stateAtom: Atom<InventoryState>;
};
