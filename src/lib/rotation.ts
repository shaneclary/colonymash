/** One gate for customer-facing "currently pouring" claims. */
export type RotatingProduct = { onTap: boolean; kickedAt?: string };
export function selectConfirmedRotation<T extends RotatingProduct>(
  products: readonly T[], confirmed: boolean,
): T[] {
  return confirmed ? products.filter((product) => product.onTap && !product.kickedAt) : [];
}
