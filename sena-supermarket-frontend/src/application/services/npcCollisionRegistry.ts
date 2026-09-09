export interface NPCCollider {
  x: number;
  z: number;
  radius: number;
}

const colliders = new Map<string, NPCCollider>();

export function updateNPCCollider(id: string, collider: NPCCollider): void {
  colliders.set(id, collider);
}

export function removeNPCCollider(id: string): void {
  colliders.delete(id);
}

// Usado por el jugador (FirstPersonController): ¿hay algún NPC cerca de (x, z)?
export function isNearNPC(x: number, z: number, playerRadius = 0.55): boolean {
  for (const collider of colliders.values()) {
    const distanceX = x - collider.x;
    const distanceZ = z - collider.z;
    const minimumDistance = playerRadius + collider.radius;
    if (distanceX * distanceX + distanceZ * distanceZ < minimumDistance * minimumDistance) return true;
  }
  return false;
}

// Usado por los propios NPCs: ¿hay OTRO NPC (distinto de excludeId) cerca de
// (x, z)? Permite que cada NPC evite pisarse/atravesarse con los demás sin
// chocar consigo mismo (por eso se excluye su propio id).
export function isNearOtherNPC(excludeId: string, x: number, z: number, radius = 0.5): boolean {
  for (const [id, collider] of colliders.entries()) {
    if (id === excludeId) continue;
    const distanceX = x - collider.x;
    const distanceZ = z - collider.z;
    const minimumDistance = radius + collider.radius;
    if (distanceX * distanceX + distanceZ * distanceZ < minimumDistance * minimumDistance) return true;
  }
  return false;
}