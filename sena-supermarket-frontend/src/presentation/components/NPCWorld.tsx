import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { removeNPCCollider, updateNPCCollider, isNearOtherNPC } from '../../application/services/npcCollisionRegistry';
import { isCarApproaching } from '../../application/services/carTrafficRegistry';

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
  // Si es true, este NPC verifica el tráfico antes de entrar a la calzada.
  crossesRoad?: boolean;
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

// Activa esto en true SOLO para diagnosticar (dibuja una caja verde alrededor
// de cada NPC y muestra su tamaño real + nombres de sus clips en consola).
// Déjalo en false en producción.
const NPC_DEBUG = false;

// Rango en X de la calzada central (debe coincidir con la carretera de
// SupermarketEnvironment). Un NPC que va a entrar en este rango de X primero
// consulta si hay carros cerca.
const ROAD_X_RANGE: [number, number] = [-5, 5];
// Qué tan cerca (en Z) puede estar un carro para considerar que NO es seguro cruzar.
const CROSSING_SAFE_DISTANCE = 18;

// Los modelos de personas suelen tener el origen (0,0,0) un poco por encima
// de los pies, lo que hace que se vean "hundidos". Este offset los levanta.
const KIND_Y_OFFSET: Record<NPCKind, number> = {
  man: 0.05,
  woman: 0.05,
  child: 0.04,
  dog: 0,
  cat: 0,
};

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
  { id: 'woman-crossing-1', kind: 'woman', model: NPC_MODELS.woman, animationModel: NPC_MODELS.womanWalk, position: [-7, 0, -5], route: [[-7, -5], [-7, 5], [-3.5, 5], [3.5, 5], [7, 5], [7, -45]], speed: 1.05, scale: 0.8, radius: 0.45, crossesRoad: true },
  { id: 'child-crossing-1', kind: 'child', model: NPC_MODELS.child, animationModel: NPC_MODELS.childWalk, position: [7, 0, 22], route: [[7, 22], [7, 5], [3.5, 5], [-3.5, 5], [-7, 5], [-7, 65]], speed: 1.35, scale: 0.58, radius: 0.34, crossesRoad: true },
];

// Atrapa errores de carga de un modelo puntual (p. ej. un .glb corrupto o con
// ruta incorrecta) sin que se caiga todo el listado de NPCs, y lo reporta en
// consola con el id exacto para poder ubicarlo rápido.
class NPCErrorBoundary extends React.Component<
  { id: string; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { id: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error(`[NPC] No se pudo cargar el modelo de "${this.props.id}":`, error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function AnimatedNPC({ config }: { config: NPCConfig }) {
  const rootRef = useRef<THREE.Group>(null);
  const routeIndex = useRef(config.moves === false ? 0 : 1);

  // CLAVE: siempre cargamos malla + animaciones DESDE EL MISMO archivo
  // (el de "caminar" si existe, o el modelo base si no). Antes se combinaba
  // la malla de un .glb con el clip de otro .glb distinto; si sus esqueletos
  // no son idénticos hueso-por-hueso, el resultado es un NPC deformado
  // ("mutante") y animaciones que se rompen a los pocos segundos. Al usar un
  // único archivo, la malla y el clip siempre corresponden al mismo esqueleto.
  const modelPath = config.animationModel ?? config.model;
  const { scene, animations } = useGLTF(modelPath);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(clonedScene), [clonedScene]);

  const initialPosition: [number, number, number] = [
    config.position[0],
    config.position[1] + (KIND_Y_OFFSET[config.kind] ?? 0),
    config.position[2],
  ];

  // Reproduce el clip correspondiente en loop infinito:
  // - NPCs estáticos (moves === false, ej. el gato quieto): busca lamer/idle.
  // - NPCs que caminan: busca caminar/correr. Si no hay coincidencia por
  //   nombre, usa el primer clip disponible como respaldo.
  useEffect(() => {
    if (!animations.length) return;

    const clip =
      config.moves === false
        ? animations.find((c) => /lam|lick|idle|quiet/i.test(c.name)) ?? animations[0]
        : animations.find((c) => /walk|caminar|run|correr|andar/i.test(c.name)) ?? animations[0];

    if (!clip) return;

    const action = mixer.clipAction(clip, clonedScene);
    action.reset().setLoop(THREE.LoopRepeat, Infinity).play();

    return () => {
      action.stop();
      mixer.stopAllAction();
    };
  }, [animations, clonedScene, config.moves, mixer]);

  useEffect(() => () => removeNPCCollider(config.id), [config.id]);

  // Diagnóstico: tamaño real del modelo y nombres de sus clips. Útil para
  // encontrar por qué un modelo "no aparece" (escala equivocada) o por qué
  // no encuentra el clip de caminar/lamer (nombre distinto al esperado).
  useEffect(() => {
    if (!NPC_DEBUG) return;
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    // eslint-disable-next-line no-console
    console.log(
      `[NPC_DEBUG] ${config.id} (${config.kind}) tamaño real:`,
      size,
      'clips disponibles:',
      animations.map((a) => a.name)
    );
  }, [clonedScene, config.id, config.kind, animations]);

  useFrame((_, delta) => {
    if (!rootRef.current) return;

    if (config.moves === false) {
      mixer.update(delta);
      updateNPCCollider(config.id, { x: config.position[0], z: config.position[2], radius: config.radius });
      return;
    }

    const target = config.route[routeIndex.current];
    if (!target) {
      routeIndex.current = 0;
      return;
    }

    const currentPosition = rootRef.current.position;
    const targetPosition = new THREE.Vector3(target[0], 0, target[1]);
    const direction = targetPosition.clone().sub(currentPosition);
    direction.y = 0;

    if (direction.length() < 0.12) {
      routeIndex.current = (routeIndex.current + 1) % config.route.length;
      return;
    }

    direction.normalize();
    const step = config.speed * delta;
    const nextX = currentPosition.x + direction.x * step;
    const nextZ = currentPosition.z + direction.z * step;

    // ¿Va a entrar a la calzada y viene un carro? Solo aplica a los NPCs
    // marcados con crossesRoad (los que cruzan la calle).
    const enteringRoad = nextX > ROAD_X_RANGE[0] && nextX < ROAD_X_RANGE[1];
    const carComing = Boolean(config.crossesRoad) && enteringRoad && isCarApproaching(nextZ, CROSSING_SAFE_DISTANCE);

    // ¿Se atravesaría con otro NPC?
    const blockedByOtherNPC = isNearOtherNPC(config.id, nextX, nextZ, config.radius);

    if (carComing || blockedByOtherNPC) {
      // Se queda quieto en su lugar (sin avanzar) hasta que sea seguro.
      // No actualizamos el mixer para que se congele en la pose actual en
      // vez de "caminar en el sitio" sin desplazarse.
      updateNPCCollider(config.id, { x: currentPosition.x, z: currentPosition.z, radius: config.radius });
      return;
    }

    mixer.update(delta);
    currentPosition.x = nextX;
    currentPosition.z = nextZ;
    rootRef.current.rotation.y = Math.atan2(direction.x, direction.z);
    updateNPCCollider(config.id, { x: currentPosition.x, z: currentPosition.z, radius: config.radius });
  });

  return (
    <group ref={rootRef} position={initialPosition} rotation={[0, 0, 0]}>
      <group rotation={[0, config.modelRotationY ?? 0, 0]} scale={[config.scale, config.scale, config.scale]}>
        <primitive object={clonedScene} castShadow />
        {NPC_DEBUG && <primitive object={new THREE.BoxHelper(clonedScene, 0x00ff00)} />}
      </group>
    </group>
  );
}

export const NPCWorld: React.FC = () => (
  <group>
    {NPC_CONFIGS.map((config) => (
      <Suspense key={config.id} fallback={null}>
        <NPCErrorBoundary id={config.id}>
          <AnimatedNPC config={config} />
        </NPCErrorBoundary>
      </Suspense>
    ))}
  </group>
);