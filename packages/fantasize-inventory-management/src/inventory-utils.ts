import { Catalog, InventoryItem, Unit } from './types';

export function unitById(catalog: Catalog, id: string): Unit | undefined {
  return catalog.units.find((u) => u.id === id);
}

export function toUnits(quantityBaseUnits: number, unit: Unit): number {
  return quantityBaseUnits / unit.ratioToBase;
}

export function fromUnits(quantityInUnit: number, unit: Unit): number {
  return quantityInUnit * unit.ratioToBase;
}

export function getStockForProduct(
  stock: InventoryItem[],
  productId: string,
  warehouseId?: string
): number {
  return stock
    .filter(
      (i) =>
        i.productId === productId &&
        (!warehouseId || i.warehouseId === warehouseId)
    )
    .reduce((sum, i) => sum + i.quantityBaseUnits, 0);
}
