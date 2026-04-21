"use client";

import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  useGLTF,
  Center,
  OrbitControls,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";


function DuckModel({ show, isRevealing }: { show: boolean, isRevealing: boolean }) {
  const { scene } = useGLTF("/duck.glb");
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number | null>(null);

  // Auto-shadows
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Enforce rotation on the whole scene to ensure it faces forward
    clonedScene.rotation.set(0, Math.PI, 0);
  }, [clonedScene]);

  useFrame((state) => {
    if (!groupRef.current || !show) return;

    if (isRevealing) {
      if (startTimeRef.current === null) startTimeRef.current = state.clock.elapsedTime;
      const elapsed = state.clock.elapsedTime - startTimeRef.current;
      const duration = 2;
      const t = Math.min(elapsed / duration, 1);
      
      // Ease out expo
      const easeT = 1 - Math.pow(2, -10 * t);
      
      groupRef.current.position.y = -5 + (4.8 * easeT); 
      groupRef.current.scale.setScalar(5 - (2.7 * easeT));
    } else {
      startTimeRef.current = null;
      groupRef.current.position.y = -0.2;
      groupRef.current.scale.setScalar(2.3);
    }
  });

  if (!show) return null;

  return (
    <primitive
      ref={groupRef}
      object={clonedScene}
      position={[0, -5, 0]}
    />
  );
}




function Lighting({ lightingMode }: { lightingMode: "intro" | "pointing" | "off" }) {
  const spot1 = useRef<THREE.SpotLight>(null);
  const spot2 = useRef<THREE.SpotLight>(null);
  const spot3 = useRef<THREE.SpotLight>(null);
  const spot4 = useRef<THREE.SpotLight>(null);
  
  const target1 = useRef(new THREE.Object3D());
  const target2 = useRef(new THREE.Object3D());
  const target3 = useRef(new THREE.Object3D());
  const target4 = useRef(new THREE.Object3D());

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (lightingMode === "intro") {
      // 4 Beams crossing
      const sweep = Math.sin(time * 1.2) * 6;
      target1.current.position.set(sweep, -5, 0);
      target2.current.position.set(-sweep, -5, 0);
      target3.current.position.set(sweep * 0.5, -5, 2);
      target4.current.position.set(-sweep * 0.5, -5, 2);

      const intensity = 1500;
      if (spot1.current) spot1.current.intensity = intensity;
      if (spot2.current) spot2.current.intensity = intensity;
      if (spot3.current) spot3.current.intensity = intensity;
      if (spot4.current) spot4.current.intensity = intensity;
    } else if (lightingMode === "pointing") {
      // All lights focus on the center
      target1.current.position.set(0, 0, 0);
      target2.current.position.set(0, 0, 0);
      target3.current.position.set(0, 1, 0);
      target4.current.position.set(0, 1, 0);

      if (spot1.current) spot1.current.intensity = 800;
      if (spot2.current) spot2.current.intensity = 800;
      if (spot3.current) spot3.current.intensity = 1000;
      if (spot4.current) spot4.current.intensity = 1000;
    } else {
      if (spot1.current) spot1.current.intensity = 0;
      if (spot2.current) spot2.current.intensity = 0;
      if (spot3.current) spot3.current.intensity = 0;
      if (spot4.current) spot4.current.intensity = 0;
    }
  });

  return (
    <>
      <ambientLight intensity={lightingMode === "pointing" ? 1 : 0.05} />
      
      <primitive object={target1.current} />
      <primitive object={target2.current} />
      <primitive object={target3.current} />
      <primitive object={target4.current} />

      {/* Top Rig Spotlights */}
      <spotLight
        ref={spot1}
        position={[-6, 10, 5]}
        target={target1.current}
        angle={0.12}
        penumbra={0.1}
        intensity={0}
        color="#ffffff"
      />
      <spotLight
        ref={spot2}
        position={[6, 10, 5]}
        target={target2.current}
        angle={0.12}
        penumbra={0.1}
        intensity={0}
        color="#ffffff"
      />
      <spotLight
        ref={spot3}
        position={[-3, 10, -5]}
        target={target3.current}
        angle={0.15}
        penumbra={0.1}
        intensity={0}
        color="#ffffff"
      />
      <spotLight
        ref={spot4}
        position={[3, 10, -5]}
        target={target4.current}
        angle={0.15}
        penumbra={0.1}
        intensity={0}
        color="#ffffff"
      />
    </>
  );
}

export default function DuckScene({
  onLoaded,
  showDuck = false,
  isRevealing = false,
  lightingMode = "off",
}: {
  onLoaded?: () => void;
  showDuck?: boolean;
  isRevealing?: boolean;
  lightingMode?: "intro" | "pointing" | "off";
}) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onLoaded) onLoaded();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onLoaded]);

  return (
    <div 
      className="w-full h-full bg-black" 
      style={{ 
        cursor: isDragging ? "grabbing" : "grab", 
        background: "black" 
      }}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        style={{ background: "black" }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={["black"]} />
        
        <Lighting lightingMode={lightingMode} />

        <directionalLight position={[5, 5, 5]} intensity={lightingMode === "pointing" ? 1 : 0} />

        <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="orange" wireframe /></mesh>}>
          <Center>
            <DuckModel show={showDuck} isRevealing={isRevealing} />
          </Center>
        </Suspense>

        {(lightingMode === "pointing" || lightingMode === "intro") && (
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        )}
        <OrbitControls enablePan={false} enableZoom={false} makeDefault />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/duck.glb");
