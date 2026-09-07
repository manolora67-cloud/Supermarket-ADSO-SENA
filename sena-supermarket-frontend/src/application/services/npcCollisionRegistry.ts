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

export function isNearNPC(x: number, z: number, playerRadius = 0.55): boolean {
  for (const collider of colliders.values()) {
    const distanceX = x - collider.x;
    const distanceZ = z - collider.z;
    const minimumDistance = playerRadius + collider.radius;
    if (distanceX * distanceX + distanceZ * distanceZ < minimumDistance * minimumDistance) return true;
  }
  return false;
}