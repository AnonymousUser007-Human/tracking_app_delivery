import { useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';

/**
 * Couleurs distinctes par colis (réseau de neurones / flux parallèles)
 */
const EXTRA_COLORS = [
  '#FF6D00', '#00BFA5', '#FFD600', '#E040FB', '#00E5FF',
  '#76FF03', '#FF4081', '#7C4DFF', '#18FFFF', '#FF9100',
  '#EA80FC', '#69F0AE', '#448AFF', '#FFFF00', '#FF5252',
];

export function getPackagePathColor(index) {
  return EXTRA_COLORS[index % EXTRA_COLORS.length];
}

/** Légère séparation en Z + arche verticale pour aspect organique */
function prepareNeuralPoints(rawPoints, pathIndex, totalPaths) {
  const spread = totalPaths > 1 ? 0.18 : 0;
  const zOff = (pathIndex - (totalPaths - 1) / 2) * spread;
  return rawPoints.map((p, i) => {
    const t = rawPoints.length <= 1 ? 0 : i / (rawPoints.length - 1);
    const arch = Math.sin(t * Math.PI) * (0.65 + (pathIndex % 4) * 0.08);
    return new THREE.Vector3(p[0], p[1] + arch, p[2] + zOff);
  });
}

/**
 * Connexion type « synapse » : tube courbe Catmull-Rom + halo émissif par colis
 */
export function NeuralPackagePath({ points, color, pathIndex = 0, totalPaths = 1 }) {
  const vecs = useMemo(
    () => prepareNeuralPoints(points, pathIndex, totalPaths),
    [points, pathIndex, totalPaths]
  );

  const { coreGeo, glowGeo, wireGeo } = useMemo(() => {
    if (vecs.length < 2) return { coreGeo: null, glowGeo: null, wireGeo: null };
    const curve = new THREE.CatmullRomCurve3(vecs, false, 'catmullrom', 0.4);
    const segs = Math.min(128, Math.max(48, vecs.length * 24));
    const coreGeo = new THREE.TubeGeometry(curve, segs, 0.048, 12, false);
    const glowGeo = new THREE.TubeGeometry(curve, segs, 0.11, 10, false);
    const wireGeo = new THREE.TubeGeometry(curve, segs, 0.018, 6, false);
    return { coreGeo, glowGeo, wireGeo };
  }, [vecs]);

  useLayoutEffect(() => {
    return () => {
      coreGeo?.dispose();
      glowGeo?.dispose();
      wireGeo?.dispose();
    };
  }, [coreGeo, glowGeo, wireGeo]);

  if (!coreGeo || !glowGeo) return null;

  const c = new THREE.Color(color);

  return (
    <group>
      <mesh geometry={glowGeo} renderOrder={1}>
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={coreGeo} renderOrder={2}>
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={1.1}
          metalness={0.45}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>
      {wireGeo && (
        <mesh geometry={wireGeo} renderOrder={3}>
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.35}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}
