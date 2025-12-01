// Lightweight adapter example for Redux
import type { Store } from 'redux';
import type { InventoryState } from '../types';

export type ReduxInventoryStore = Store<InventoryState>;
