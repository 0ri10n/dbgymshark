/* eslint-disable react/no-unknown-property */
import { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars } from '@react-three/drei';
import './Beams.css';

const CanvasWrapper = ({ children }) => (
  <Canvas 
    dpr={1} 
    className="beams-container"
    gl={{ antialias: false, powerPreference: "high-performance" }}
  >
    {children}
  </Canvas>
);

const AnimatedBeams = ({ count = 10 }) => {
  const group = useRef();
  
  // Creamos los rayos como objetos simples para que no fallen nunca
  const beams = Array.from({ length: count }).map((_, i) => ({
    position: [(Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 10],
    scale: [0.1, 20 + Math.random() * 20, 1],
    speed: 0.01 + Math.random() * 0.02,
  }));

  useFrame((state) => {
    group.current.children.forEach((beam, i) => {
      // Movimiento vertical simple que consume 0% CPU
      beam.position.y = Math.sin(state.clock.elapsedTime * beams[i].speed + i) * 2;
    });
  });

  return (
    <group ref={group}>
      {beams.map((beam, i) => (
        <mesh key={i} position={beam.position} scale={beam.scale}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.2} 
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

const Beams = ({ rotation = 30 }) => {
  return (
    <CanvasWrapper>
      {/* Añadimos estrellas de fondo para que no se vea vacío y se vea deportivo */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <group rotation={[0, 0, (rotation * Math.PI) / 180]}>
        <AnimatedBeams count={15} />
      </group>

      <color attach="background" args={['#05070a']} />
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={30} />
    </CanvasWrapper>
  );
};

export default Beams;