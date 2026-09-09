export interface CarCollider {
  x: number;
  z: number;
  radius: number;
}

const cars = new Map<string, CarCollider>();

export function updateCarCollider(id: string, collider: CarCollider): void {
  cars.set(id, collider);
}

export function removeCarCollider(id: string): void {
  cars.delete(id);
}

/**
 * ¿Hay algún carro lo bastante cerca de la posición z (a lo largo de la
 * calzada) como para que cruzar ahora sea peligroso?
 *
 * roadXRange define los límites en X de la calzada (donde SÍ pueden estar
 * los carros); un carro fuera de ese rango (p. ej. estacionado en un andén)
 * no cuenta como peligro.
 */
export function isCarApproaching(
  z: number,
  safeDistance = 18,
  roadXRange: [number, number] = [-5, 5]
): boolean {
  for (const car of cars.values()) {
    if (car.x < roadXRange[0] || car.x > roadXRange[1]) continue;
    if (Math.abs(car.z - z) < safeDistance) return true;
  }
  return false;
}
