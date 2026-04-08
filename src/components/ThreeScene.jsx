import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function DustParticles({ count = 60 }) {
  const ref = useRef();
  const [pos] = useState(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i*3]   = (Math.random()-0.5)*14;
      a[i*3+1] = (Math.random()-0.5)*14;
      a[i*3+2] = Math.random()*3-1;
    }
    return a;
  });

  useFrame((st) => {
    if (!ref.current) return;
    const p = ref.current.geometry.attributes.position.array;
    for (let i=0; i<count; i++) {
      p[i*3+1] += Math.sin(st.clock.elapsedTime*0.15+i)*0.0015;
      p[i*3]   += Math.cos(st.clock.elapsedTime*0.1+i*0.7)*0.0008;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#c0b8a8" transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function LightOrb() {
  const ref = useRef();
  useFrame((st) => {
    if (!ref.current) return;
    ref.current.position.x = Math.sin(st.clock.elapsedTime*0.3)*2;
    ref.current.position.y = Math.cos(st.clock.elapsedTime*0.2)*1.5+1;
    ref.current.intensity = 0.15+Math.sin(st.clock.elapsedTime*0.5)*0.05;
  });
  return <pointLight ref={ref} color="#fff5e6" distance={12} />;
}

export default function ThreeScene() {
  return (
    <div className="three-wall">
      <Canvas dpr={[1,1.5]} camera={{position:[0,0,5],fov:50}} gl={{antialias:false,alpha:true}}>
        <ambientLight intensity={0.6} color="#f5f0e8" />
        <directionalLight position={[-4,6,4]} intensity={0.4} color="#ffffff" />
        <LightOrb />
        <DustParticles count={50} />
      </Canvas>
    </div>
  );
}
