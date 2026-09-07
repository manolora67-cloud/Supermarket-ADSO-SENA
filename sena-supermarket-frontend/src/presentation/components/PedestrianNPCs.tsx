import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type NPCType = 'man' | 'woman' | 'child' | 'dog' | 'cat';

interface NPCData {
  id: number;
  type: NPCType;
  laneX: number;
  initialZ: number;
  speed: number;
  direction: 1 | -1;
  color: string;
  offset: number;
}

interface PedestrianProps extends NPCData {
  totalTime: React.MutableRefObject<number>;
}

const NPC_COLORS = {
  skin: '#f2b48f',
  darkSkin: '#9a5b3d',
  hair: '#3f2a20',
  shirtBlue: '#2563eb',
  shirtPink: '#db2777',
  shirtGreen: '#15803d',
  pants: '#334155',
  shoe: '#111827',
};

function PersonNPC({ type, color }: { type: 'man' | 'woman' | 'child'; color: string }) {
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const isChild = type === 'child';
  const bodyHeight = isChild ? 0.65 : 0.95;
  const headSize = isChild ? 0.22 : 0.27;

  useFrame(({ clock }) => {
    const walking = Math.sin(clock.getElapsedTime() * (isChild ? 8 : 6));
    [leftArm, rightArm, leftLeg, rightLeg].forEach((limb, index) => {
      if (!limb.current) return;
      const phase = index % 2 === 0 ? walking : -walking;
      limb.current.rotation.x = phase * 0.55;
    });
  });

  return (
    <group scale={isChild ? 0.78 : 1}>
      <mesh position={[0, bodyHeight / 2 + 0.4, 0]} castShadow>
        <capsuleGeometry args={[isChild ? 0.18 : 0.25, bodyHeight, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0, bodyHeight + 0.77, 0]} castShadow>
        <sphereGeometry args={[headSize, 12, 8]} />
        <meshStandardMaterial color={isChild ? NPC_COLORS.darkSkin : NPC_COLORS.skin} roughness={0.8} />
      </mesh>
      <mesh position={[0, bodyHeight + 0.96, 0]} castShadow>
        <sphereGeometry args={[headSize * 1.02, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={type === 'woman' ? '#6b3f2a' : NPC_COLORS.hair} />
      </mesh>
      <group ref={leftArm} position={[-0.29, bodyHeight + 0.52, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow><capsuleGeometry args={[0.07, 0.38, 3, 6]} /><meshStandardMaterial color={isChild ? NPC_COLORS.darkSkin : NPC_COLORS.skin} /></mesh>
      </group>
      <group ref={rightArm} position={[0.29, bodyHeight + 0.52, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow><capsuleGeometry args={[0.07, 0.38, 3, 6]} /><meshStandardMaterial color={isChild ? NPC_COLORS.darkSkin : NPC_COLORS.skin} /></mesh>
      </group>
      <group ref={leftLeg} position={[-0.12, 0.38, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow><capsuleGeometry args={[0.09, 0.42, 3, 6]} /><meshStandardMaterial color={NPC_COLORS.pants} /></mesh>
        <mesh position={[0, -0.43, -0.06]} castShadow><boxGeometry args={[0.16, 0.1, 0.28]} /><meshStandardMaterial color={NPC_COLORS.shoe} /></mesh>
      </group>
      <group ref={rightLeg} position={[0.12, 0.38, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow><capsuleGeometry args={[0.09, 0.42, 3, 6]} /><meshStandardMaterial color={NPC_COLORS.pants} /></mesh>
        <mesh position={[0, -0.43, -0.06]} castShadow><boxGeometry args={[0.16, 0.1, 0.28]} /><meshStandardMaterial color={NPC_COLORS.shoe} /></mesh>
      </group>
    </group>
  );
}

function PetNPC({ type }: { type: 'dog' | 'cat' }) {
  const legRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  useFrame(({ clock }) => {
    const walking = Math.sin(clock.getElapsedTime() * 6);
    legRefs.forEach((leg, index) => {
      if (leg.current) leg.current.rotation.x = (index % 2 === 0 ? walking : -walking) * 0.45;
    });
  });
  const fur = type === 'dog' ? '#a16207' : '#64748b';
  return (
    <group scale={type === 'dog' ? 0.7 : 0.52}>
      <mesh position={[0, 0.5, 0]} castShadow><capsuleGeometry args={[0.28, 0.7, 4, 8]} /><meshStandardMaterial color={fur} /></mesh>
      <mesh position={[0, 0.78, 0.32]} castShadow><sphereGeometry args={[0.25, 12, 8]} /><meshStandardMaterial color={fur} /></mesh>
      <mesh position={[-0.13, 1.02, 0.3]} rotation={[0, 0, -0.3]} castShadow><coneGeometry args={[0.1, 0.24, 4]} /><meshStandardMaterial color={type === 'cat' ? '#475569' : fur} /></mesh>
      <mesh position={[0.13, 1.02, 0.3]} rotation={[0, 0, 0.3]} castShadow><coneGeometry args={[0.1, 0.24, 4]} /><meshStandardMaterial color={type === 'cat' ? '#475569' : fur} /></mesh>
      {[[-0.18, 0.3, 0.17], [0.18, 0.3, 0.17], [-0.18, 0.3, -0.17], [0.18, 0.3, -0.17]].map((position, index) => (
        <group key={index} ref={legRefs[index]} position={position as [number, number, number]}>
          <mesh position={[0, -0.17, 0]} castShadow><capsuleGeometry args={[0.07, 0.3, 3, 5]} /><meshStandardMaterial color={fur} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.62, -0.4]} rotation={[0, 0, type === 'cat' ? -0.8 : 0.6]} castShadow><capsuleGeometry args={[0.06, 0.42, 3, 5]} /><meshStandardMaterial color={fur} /></mesh>
    </group>
  );
}

function MovingNPC({ type, laneX, initialZ, speed, direction, color, offset, totalTime }: PedestrianProps) {
  const ref = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current || !visualRef.current) return;
    const localTime = totalTime.current + offset;
    const pauseCycle = localTime % 18;
    const isPaused = pauseCycle > 11 && pauseCycle < 13.5;
    if (!isPaused) ref.current.position.z += speed * direction * delta;
    if (ref.current.position.z > 88) ref.current.position.z = -88;
    if (ref.current.position.z < -88) ref.current.position.z = 88;
    const walking = isPaused ? 0 : Math.sin(localTime * (type === 'child' ? 8 : 6));
    visualRef.current.position.y = Math.abs(Math.sin(localTime * 3)) * (isPaused ? 0.01 : type === 'child' ? 0.035 : 0.02);
    visualRef.current.rotation.y = isPaused ? Math.sin(localTime * 2) * 0.35 : direction === 1 ? 0 : Math.PI;
    const animationTarget = visualRef.current.children[0];
    if (animationTarget) animationTarget.rotation.z = walking * 0.01;
  });

  return (
    <group ref={ref} position={[laneX, 0, initialZ]}>
      <group ref={visualRef}>
        {type === 'dog' || type === 'cat' ? <PetNPC type={type} /> : <PersonNPC type={type} color={color} />}
      </group>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[type === 'child' ? 0.28 : 0.38, 12]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

export const PedestrianNPCs: React.FC = () => {
  const totalTime = useRef(0);
  const npcs = useMemo<NPCData[]>(() => [
    { id: 1, type: 'man', laneX: -9, initialZ: -62, speed: 1.4, direction: 1, color: NPC_COLORS.shirtBlue, offset: 0 },
    { id: 2, type: 'woman', laneX: -8, initialZ: 12, speed: 1.1, direction: -1, color: NPC_COLORS.shirtPink, offset: 4 },
    { id: 3, type: 'child', laneX: -7, initialZ: 50, speed: 1.7, direction: -1, color: '#f59e0b', offset: 8 },
    { id: 4, type: 'dog', laneX: -6.2, initialZ: -22, speed: 1.8, direction: 1, color: '#a16207', offset: 2 },
    { id: 5, type: 'cat', laneX: 9, initialZ: 68, speed: 0.8, direction: -1, color: '#64748b', offset: 10 },
    { id: 6, type: 'man', laneX: 11, initialZ: 35, speed: 1.25, direction: -1, color: NPC_COLORS.shirtGreen, offset: 6 },
    { id: 7, type: 'woman', laneX: 10, initialZ: -45, speed: 1.05, direction: 1, color: '#7c3aed', offset: 12 },
  ], []);

  useFrame((_, delta) => { totalTime.current += delta; });

  return <group>{npcs.map((npc) => <MovingNPC key={npc.id} {...npc} totalTime={totalTime} />)}</group>;
};