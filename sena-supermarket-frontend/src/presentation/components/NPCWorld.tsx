import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { removeNPCCollider, updateNPCCollider } from '../../application/services/npcCollisionRegistry';

type NPCKind = 'man' | 'woman' | 'child' | 'dog' | 'cat';
type Point = [number, number];

interface NPCConfig {
  id: string;
  kind: NPCKind;
  model: string;
  animationModel?: string;
  position: [number, number, number];
  route: Point[];
  speed: number;
  scale: number;
  rotationY?: number;
  radius: number;
  modelRotationY?: number;
  moves?: boolean;
}

const NPC_MODELS = {
  man: '/npcs/hombre.glb',
  manWalk: '/npcs/hombre_caminar.glb',
  woman: '/npcs/mujer.glb',
  womanWalk: '/npcs/mujer_caminar.glb',
  child: '/npcs/nino.glb',
  childWalk: '/npcs/nino_caminar.glb',
  girl: '/npcs/nina.glb',
  girlWalk: '/npcs/nina_caminar.glb',
  dog: '/npcs/perro.glb',
  dogTwo: '/npcs/perro2.glb',
  cat: '/npcs/gato.glb',
  catTwo: '/npcs/gato1.glb',
};

Object.values(NPC_MODELS).forEach((path) => useGLTF.preload(path));

const NPC_CONFIGS: NPCConfig[] = [
  { id: 'man-left-1', kind: 'man', model: NPC_MODELS.man, animationModel: NPC_MODELS.manWalk, position: [-7, 0, -60], route: [[-7, -60], [-7, -10], [-7, -72]], speed: 1.35, scale: 0.8, radius: 0.45 },
  { id: 'woman-left-1', kind: 'woman', model: NPC_MODELS.woman, animationModel: NPC_MODELS.womanWalk, position: [-7, 0, 30], route: [[-7, 30], [-7, -12], [-7, -72]], speed: 1.1, scale: 0.8, radius: 0.45 },
  { id: 'child-left-1', kind: 'child', model: NPC_MODELS.child, animationModel: NPC_MODELS.childWalk, position: [-7, 0, 55], route: [[-7, 55], [-7, 20], [-7, -30]], speed: 1.5, scale: 0.58, radius: 0.34 },
  { id: 'nina-left-1', kind: 'child', model: NPC_MODELS.girl, animationModel: NPC_MODELS.girlWalk, position: [-7, 0, 72], route: [[-7, 72], [-7, 42], [-7, -8]], speed: 1.35, scale: 0.58, radius: 0.34 },
  { id: 'dog-left-1', kind: 'dog', model: NPC_MODELS.dog, position: [-6.3, 0, 10], route: [[-6.3, 10], [-6.3, 35], [-6.3, 70]], speed: 1.45, scale: 0.02, radius: 0.4, modelRotationY: 0 },
  { id: 'cat-left-1', kind: 'cat', model: NPC_MODELS.cat, position: [-6.7, 0, 25], route: [[-6.7, 25]], speed: 0, scale: 0.035, radius: 0.25, modelRotationY: 0, moves: false },
  { id: 'man-right-1', kind: 'man', model: NPC_MODELS.man, animationModel: NPC_MODELS.manWalk, position: [7, 0, 60], route: [[7, 60], [7, 10], [7, 76]], speed: 1.25, scale: 0.8, radius: 0.45 },
  { id: 'woman-right-1', kind: 'woman', model: NPC_MODELS.woman, animationModel: NPC_MODELS.womanWalk, position: [7, 0, -35], route: [[7, -35], [7, 18], [7, 76]], speed: 1.15, scale: 0.8, radius: 0.45 },
  { id: 'child-right-1', kind: 'child', model: NPC_MODELS.child, animationModel: NPC_MODELS.childWalk, position: [7, 0, -65], route: [[7, -65], [7, -18], [7, 42]], speed: 1.55, scale: 0.58, radius: 0.34 },
  { id: 'dog-right-1', kind: 'dog', model: NPC_MODELS.dogTwo, position: [6.3, 0, 15], route: [[6.3, 15], [6.3, -25], [6.3, -65]], speed: 1.55, scale: 0.02, radius: 0.4, modelRotationY: 0 },
  { id: 'cat-right-1', kind: 'cat', model: NPC_MODELS.catTwo, position: [6.7, 0, 30], route: [[6.7, 30], [6.7, 15], [6.7, 70]], speed: 0.85, scale: 0.04, radius: 0.25, modelRotationY: 0 },
  { id: 'woman-crossing-1', kind: 'woman', model: NPC_MODELS.woman, position: [-7, 0, -5], route: [[-7, -5], [-7, 5], [-3.5, 5], [3.5, 5], [7, 5], [7, -45]], speed: 1.05, scale: 0.8, radius: 0.45 },
  { id: 'child-crossing-1', kind: 'child', model: NPC_MODELS.child, position: [7, 0, 22], route: [[7, 22], [7, 5], [3.5, 5], [-3.5, 5], [-7, 5], [-7, 65]], speed: 1.35, scale: 0.58, radius: 0.34 },
];

function AnimatedNPC({ config }: { config: NPCConfig }) {
  const rootRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const routeIndex = useRef(config.moves === false ? 0 : 1);
  const { scene, animations } = useGLTF(config.model);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(config.moves === false ? animations : [], modelRef);

  useEffect(() => {
    if (config.moves !== false) return;
    const idleAction = Object.values(actions)[0];
    idleAction?.reset().fadeIn(0.2).play();
    return () => { idleAction?.fadeOut(0.2); };
  }, [actions, config.moves]);

  useEffect(() => () => removeNPCCollider(config.id), [config.id]);

  useFrame((_, delta) => {
    if (!rootRef.current || config.moves === false) {
      updateNPCCollider(config.id, { x: config.position[0], z: config.position[2], radius: config.radius });
      return;
    }
    const target = config.route[routeIndex.current];
    if (!target) {
      routeIndex.current = 0;
      return;
    }
    const targetPosition = new THREE.Vector3(target[0], 0, target[1]);
    const currentPosition = rootRef.current.position;
    const direction = targetPosition.clone().sub(currentPosition);
    direction.y = 0;
    if (direction.length() < 0.12) {
      routeIndex.current = (routeIndex.current + 1) % config.route.length;
      return;
    }
    direction.normalize();
    currentPosition.addScaledVector(direction, config.speed * delta);
    rootRef.current.rotation.y = Math.atan2(direction.x, direction.z);
    modelRef.current?.position.set(0, Math.abs(Math.sin(performance.now() * 0.008 * config.speed)) * 0.025, 0);
    updateNPCCollider(config.id, { x: currentPosition.x, z: currentPosition.z, radius: config.radius });
  });

  return (
    <group ref={rootRef} position={config.position} rotation={[0, 0, 0]}>
    <group ref={modelRef} rotation={[0, config.modelRotationY ?? 0, 0]} scale={[config.scale, config.scale, config.scale]}>
        <primitive object={clonedScene} castShadow />
      </group>
    </group>
  );
}

export const NPCWorld: React.FC = () => (
  <group>
    {NPC_CONFIGS.map((config) => (
      <Suspense key={config.id} fallback={null}>
        <AnimatedNPC config={config} />
      </Suspense>
    ))}
  </group>
);