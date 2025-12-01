// Base shapes (required relations). Extend safely via generics.
export type BaseUnit = {
  id: string;
  name: string;
  ratioToBase: number; // e.g., 12 for dozen
};

export type BaseVAT = {
  id: string;
  name: string;
  rate: number; // 0.2 for 20%
};

export type BaseVariantOption = {
  id: string;
  name: string;
  value: string;
};

export type BaseProductPackage = {
  id: string;
  name: string;
  unitId: string; // Unit reference
  quantity: number; // how many units
};

export type BaseProduct = {
  id: string;
  sku: string;
  name: string;
  baseUnitId: string;
  vatId?: string;
};

export type BaseWarehouse = {
  id: string;
  name: string;
};

// Extensible types with generic metadata fields
export type Unit<UE = Record<string, unknown>> = BaseUnit & UE;
export type VAT<VATE = Record<string, unknown>> = BaseVAT & VATE;
export type VariantOption<VE = Record<string, unknown>> = BaseVariantOption &
  VE;
export type ProductPackage<PKE = Record<string, unknown>> = BaseProductPackage &
  PKE;
export type Product<
  PE = Record<string, unknown>,
  VE = Record<string, unknown>,
  PKE = Record<string, unknown>
> = BaseProduct &
  PE & {
    variants?: VariantOption<VE>[];
    packages?: ProductPackage<PKE>[];
  };
export type Warehouse<WE = Record<string, unknown>> = BaseWarehouse & WE;

export type InventoryItem = {
  productId: string;
  warehouseId: string;
  quantityBaseUnits: number; // stored in base units
};

export type Catalog<
  PE = Record<string, unknown>,
  UE = Record<string, unknown>,
  VATE = Record<string, unknown>,
  VE = Record<string, unknown>,
  PKE = Record<string, unknown>,
  WE = Record<string, unknown>
> = {
  products: Product<PE, VE, PKE>[];
  units: Unit<UE>[];
  vats: VAT<VATE>[];
  packages: ProductPackage<PKE>[];
  warehouses: Warehouse<WE>[];
};

export type InventoryState<
  PE = Record<string, unknown>,
  UE = Record<string, unknown>,
  VATE = Record<string, unknown>,
  VE = Record<string, unknown>,
  PKE = Record<string, unknown>,
  WE = Record<string, unknown>
> = {
  catalog: Catalog<PE, UE, VATE, VE, PKE, WE>;
  stock: InventoryItem[];
};
