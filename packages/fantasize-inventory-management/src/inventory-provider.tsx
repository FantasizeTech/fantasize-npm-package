import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type {
  Catalog,
  InventoryItem,
  InventoryState,
  Product,
  Warehouse,
  Unit,
} from './types';
import { getStockForProduct, unitById, toUnits } from './inventory-utils';

export type InventoryAction<
  PE = Record<string, unknown>,
  UE = Record<string, unknown>,
  VATE = Record<string, unknown>,
  VE = Record<string, unknown>,
  PKE = Record<string, unknown>,
  WE = Record<string, unknown>
> =
  | { type: 'SET_CATALOG'; catalog: Catalog<PE, UE, VATE, VE, PKE, WE> }
  | { type: 'SET_STOCK'; stock: InventoryItem[] }
  | {
      type: 'INCREMENT_STOCK';
      productId: string;
      warehouseId: string;
      quantityBaseUnits: number;
    }
  | {
      type: 'DECREMENT_STOCK';
      productId: string;
      warehouseId: string;
      quantityBaseUnits: number;
    };

function makeReducer<
  PE = Record<string, unknown>,
  UE = Record<string, unknown>,
  VATE = Record<string, unknown>,
  VE = Record<string, unknown>,
  PKE = Record<string, unknown>,
  WE = Record<string, unknown>
>() {
  return (
    state: InventoryState<PE, UE, VATE, VE, PKE, WE>,
    action: InventoryAction<PE, UE, VATE, VE, PKE, WE>
  ): InventoryState<PE, UE, VATE, VE, PKE, WE> => {
    switch (action.type) {
      case 'SET_CATALOG':
        return { ...state, catalog: action.catalog };
      case 'SET_STOCK':
        return { ...state, stock: action.stock };
      case 'INCREMENT_STOCK': {
        const idx = state.stock.findIndex(
          (i) =>
            i.productId === action.productId &&
            i.warehouseId === action.warehouseId
        );
        const updated = [...state.stock];
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            quantityBaseUnits:
              updated[idx].quantityBaseUnits + action.quantityBaseUnits,
          };
        } else {
          updated.push({
            productId: action.productId,
            warehouseId: action.warehouseId,
            quantityBaseUnits: action.quantityBaseUnits,
          });
        }
        return { ...state, stock: updated };
      }
      case 'DECREMENT_STOCK': {
        const idx = state.stock.findIndex(
          (i) =>
            i.productId === action.productId &&
            i.warehouseId === action.warehouseId
        );
        const updated = [...state.stock];
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            quantityBaseUnits: Math.max(
              0,
              updated[idx].quantityBaseUnits - action.quantityBaseUnits
            ),
          };
        }
        return { ...state, stock: updated };
      }
      default:
        return state;
    }
  };
}

export function createInventoryContext<
  PE = Record<string, unknown>,
  UE = Record<string, unknown>,
  VATE = Record<string, unknown>,
  VE = Record<string, unknown>,
  PKE = Record<string, unknown>,
  WE = Record<string, unknown>
>() {
  const Ctx = createContext<{
    state: InventoryState<PE, UE, VATE, VE, PKE, WE>;
    dispatch: React.Dispatch<InventoryAction<PE, UE, VATE, VE, PKE, WE>>;
  } | null>(null);

  const reducer = makeReducer<PE, UE, VATE, VE, PKE, WE>();

  function InventoryProvider({
    children,
    initialState,
  }: {
    children: React.ReactNode;
    initialState?: Partial<InventoryState<PE, UE, VATE, VE, PKE, WE>>;
  }) {
    const defaultState: InventoryState<PE, UE, VATE, VE, PKE, WE> = useMemo(
      () => ({
        catalog: {
          products: [],
          units: [],
          vats: [],
          warehouses: [],
          packages: [],
        } as unknown as Catalog<PE, UE, VATE, VE, PKE, WE>,
        stock: [],
      }),
      []
    );

    const [state, dispatch] = useReducer(reducer, {
      ...defaultState,
      ...initialState,
    });

    return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
  }

  function useInventory() {
    const ctx = useContext(Ctx);
    if (!ctx)
      throw new Error('useInventory must be used within InventoryProvider');
    const { state, dispatch } = ctx;

    function stockInUnits(
      product: Product<PE, VE, PKE>,
      warehouse?: Warehouse<WE>
    ) {
      const base = getStockForProduct(state.stock, product.id, warehouse?.id);
      const baseUnit = unitById(
        state.catalog as unknown as Catalog,
        product.baseUnitId
      ) as Unit | undefined;
      if (!baseUnit) return { baseUnits: base, units: base };
      return { baseUnits: base, units: toUnits(base, baseUnit) };
    }

    return { state, dispatch, stockInUnits };
  }

  return { InventoryProvider, useInventory };
}

export const { InventoryProvider, useInventory } = createInventoryContext();
