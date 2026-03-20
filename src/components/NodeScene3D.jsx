import { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Grid } from '@react-three/drei';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { NeuralPackagePath, getPackagePathColor } from './NeuralPath';

const NODE_COLORS = {
  supplier: '#2196F3',
  warehouse: '#9C27B0',
  delivery_agent: '#4CAF50',
};

/** Halo « neurone » autour du soma */
function NeuronHalo({ color, scale = 1 }) {
  const c = new THREE.Color(color);
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial
        color={c}
        transparent
        opacity={0.12}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/** Nœud chaîne d'approvisionnement — style réseau de neurones (soma + noyau) */
function SupplyChainNode({ position, color, label, type }) {
  const emissive = color;
  const haloScale =
    type === 'warehouse' ? 0.95 : type === 'supplier' ? 0.72 : 0.55;
  return (
    <group position={position}>
      <NeuronHalo color={color} scale={haloScale} />
      {type === 'supplier' && (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.38, 0.42, 0.65, 20]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={0.45}
            metalness={0.35}
            roughness={0.35}
          />
        </mesh>
      )}
      {type === 'warehouse' && (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 0.5, 0.75]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={0.4}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      )}
      {type === 'delivery_agent' && (
        <group rotation={[0, Math.PI / 6, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
            <boxGeometry args={[0.5, 0.22, 0.32]} />
            <meshStandardMaterial
              color={color}
              emissive={emissive}
              emissiveIntensity={0.45}
              metalness={0.35}
              roughness={0.35}
            />
          </mesh>
        </group>
      )}
      {label && (
        <Html
          position={[0, type === 'warehouse' ? 0.55 : type === 'supplier' ? 0.55 : 0.45, 0]}
          center
          distanceFactor={11}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            fontSize: '11px',
            fontWeight: 600,
            color: '#e8eef5',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            zIndex: 100,
          }}
        >
          <div className="scene-node-label scene-node-label--chain">{label}</div>
        </Html>
      )}
    </group>
  );
}

const STATUS_LABELS = {
  created: 'Créé',
  atSupplier: 'Chez fournisseur',
  inTransitToWarehouse: 'Vers entrepôt',
  atWarehouse: "À l'entrepôt",
  inTransitToClient: 'En livraison',
  delivered: 'Livré',
  returned: 'Retourné',
  transit: 'En transit',
};

/** Étapes de la chaîne (libellés au-dessus des colonnes) */
function ChainStageLabels({ columnX }) {
  const stages = [
    {
      x: columnX.supplier,
      step: '1',
      title: 'Approvisionnement',
      subtitle: 'Fournisseurs',
    },
    {
      x: columnX.warehouse,
      step: '2',
      title: 'Stockage & tri',
      subtitle: 'Entrepôts',
    },
    {
      x: columnX.delivery,
      step: '3',
      title: 'Distribution',
      subtitle: 'Livreurs — dernier km',
    },
  ];
  return (
    <>
      {stages.map((s) => (
        <Html
          key={s.step}
          position={[s.x, 3.6, 0]}
          center
          distanceFactor={14}
          style={{ pointerEvents: 'none', userSelect: 'none', textAlign: 'center' }}
        >
          <div className="scene-chain-stage">
            <span className="scene-chain-stage__step">{s.step}</span>
            <div className="scene-chain-stage__title">{s.title}</div>
            <div className="scene-chain-stage__subtitle">{s.subtitle}</div>
          </div>
        </Html>
      ))}
    </>
  );
}

export function NodeScene3D({
  suppliers = [],
  warehouses = [],
  agents = [],
  packages = [],
}) {
  const columnSpacing = 4;
  const rowSpacing = 3;

  const columnX = useMemo(
    () => ({
      supplier: -columnSpacing * 2,
      warehouse: 0,
      delivery: columnSpacing * 2,
    }),
    []
  );

  const allNodes = useMemo(() => {
    const nodes = [];

    suppliers.forEach((s, i) => {
      nodes.push({
        id: s.id,
        type: 'supplier',
        label: (s.name || '').slice(0, 14),
        position: [columnX.supplier, 0, -columnSpacing + i * rowSpacing],
      });
    });
    warehouses.forEach((w, i) => {
      nodes.push({
        id: w.id,
        type: 'warehouse',
        label: (w.name || '').slice(0, 14),
        position: [columnX.warehouse, 0, -columnSpacing + i * rowSpacing],
      });
    });
    agents.forEach((a, i) => {
      nodes.push({
        id: a.id,
        type: 'delivery_agent',
        label: `${(a.first_name || '')} ${(a.last_name || '')}`.trim().slice(0, 14) || 'Livreur',
        position: [columnX.delivery, 0, -columnSpacing + i * rowSpacing],
      });
    });

    return nodes;
  }, [suppliers, warehouses, agents, columnX, columnSpacing, rowSpacing]);

  const nodeIdToPosition = useMemo(() => {
    const map = {};
    allNodes.forEach((n) => {
      map[n.id] = n.position;
    });
    return map;
  }, [allNodes]);

  const nodeIdToLabel = useMemo(() => {
    const map = {};
    allNodes.forEach((n) => {
      map[n.id] = n.label;
    });
    return map;
  }, [allNodes]);

  const packagesWithHistory = useMemo(
    () => packages.filter((p) => p.tracking_history && p.tracking_history.length > 0),
    [packages]
  );

  const packagePaths = useMemo(() => {
    const paths = [];
    packages.forEach((pkg, pkgIdx) => {
      const color = getPackagePathColor(pkgIdx);
      const statusLabel = STATUS_LABELS[pkg.status] || pkg.status;
      let points = [];
      let historySteps = [];

      if (pkg.tracking_history && pkg.tracking_history.length > 0) {
        historySteps = pkg.tracking_history
          .map((tp) => ({
            position: nodeIdToPosition[tp.node_id],
            status: tp.status,
          }))
          .filter((s) => s.position);
        points = historySteps.map((s) => s.position);
      }

      if (points.length < 2 && (pkg.supplier_id || pkg.warehouse_id || pkg.delivery_agent_id)) {
        const fallback = [];
        const steps = [
          { id: pkg.supplier_id, status: 'created' },
          { id: pkg.warehouse_id, status: 'atWarehouse' },
          { id: pkg.delivery_agent_id, status: 'inTransitToClient' },
        ].filter((s) => s.id);
        steps.forEach((s) => {
          const pos = nodeIdToPosition[s.id];
          if (pos) {
            fallback.push(pos);
            historySteps.push({ position: pos, status: s.status });
          }
        });
        if (fallback.length >= 2) {
          points = fallback;
        }
      }

      paths.push({
        id: pkg.id,
        trackingNumber: pkg.tracking_number,
        status: pkg.status,
        statusLabel,
        points,
        color,
        historySteps,
      });
    });
    return paths;
  }, [packages, nodeIdToPosition]);

  const staticConnections = useMemo(() => {
    if (packagePaths.some((p) => p.points.length >= 2)) return [];
    const conns = [];
    const supplierNodes = allNodes.filter((n) => n.type === 'supplier');
    const warehouseNodes = allNodes.filter((n) => n.type === 'warehouse');
    const agentNodes = allNodes.filter((n) => n.type === 'delivery_agent');
    supplierNodes.forEach((s, i) => {
      if (warehouseNodes[i]) conns.push({ start: s.position, end: warehouseNodes[i].position });
    });
    warehouseNodes.forEach((w, i) => {
      if (agentNodes[i]) conns.push({ start: w.position, end: agentNodes[i].position });
    });
    return conns;
  }, [allNodes, packagePaths]);

  const pathsWithLines = useMemo(
    () => packagePaths.filter((p) => p.points.length >= 2),
    [packagePaths]
  );

  return (
    <div className="scene-container scene-container--supply-chain">
      <div className="scene-supply-chain__banner">
        <h2 className="scene-supply-chain__heading">Suivi logistique &amp; chaîne d&apos;approvisionnement</h2>
        <p className="scene-supply-chain__tagline">
          Chaque couleur = un colis — connexions courbes type réseau de neurones (synapses)
        </p>
      </div>
      <div className="scene-supply-chain__canvas">
      <Canvas
        style={{ width: '100%', height: '100%' }}
        shadows
        camera={{
          position: [0, 13, 17],
          fov: 48,
          near: 0.1,
          far: 1000,
        }}
      >
        <color attach="background" args={['#061018']} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[8, 14, 10]} intensity={1.1} castShadow />
        <directionalLight position={[-6, 8, -4]} intensity={0.35} />
        <hemisphereLight args={['#1a3a5c', '#0a1520', 0.35]} />
        <OrbitControls
          enableZoom
          enablePan
          enableRotate
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0.5, 0]}
        />

        <Grid
          position={[0, -0.02, 0]}
          args={[28, 28]}
          cellSize={0.6}
          cellThickness={0.6}
          cellColor="#1a3555"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#0D47A1"
          fadeDistance={45}
          fadeStrength={1}
          infiniteGrid
        />

        <ChainStageLabels columnX={columnX} />

        {allNodes.map((node) => (
          <SupplyChainNode
            key={node.id}
            position={node.position}
            color={NODE_COLORS[node.type]}
            label={node.label}
            type={node.type}
          />
        ))}
        {pathsWithLines.map((path, i) => (
          <NeuralPackagePath
            key={path.id}
            points={path.points}
            color={path.color}
            pathIndex={i}
            totalPaths={pathsWithLines.length}
          />
        ))}
        {staticConnections.map((c, i) => (
          <NeuralPackagePath
            key={`static-${i}`}
            points={[c.start, c.end]}
            color="#5c6b7a"
            pathIndex={i}
            totalPaths={staticConnections.length}
          />
        ))}
      </Canvas>
      </div>
      {packagePaths.length > 0 && (
        <div className="scene-legend scene-legend--supply">
          <span className="scene-legend__title">1 connexion par colis</span>
          {packagePaths.map((path) => (
            <span key={path.id} className="scene-legend__item" style={{ '--color': path.color }}>
              {path.trackingNumber}
              <span className="scene-legend__status">{path.statusLabel}</span>
            </span>
          ))}
        </div>
      )}
      {packagesWithHistory.length > 0 && (
        <PackageTrackingDetails
          packages={packagesWithHistory}
          nodeIdToLabel={nodeIdToLabel}
        />
      )}
    </div>
  );
}

function PackageTrackingDetails({ packages, nodeIdToLabel }) {
  const [expanded, setExpanded] = useState(false);
  if (packages.length === 0) return null;

  return (
    <div className="scene-tracking-details">
      <button
        type="button"
        className="scene-tracking-details__toggle"
        onClick={() => setExpanded((e) => !e)}
      >
        <Package size={16} />
        Détail du parcours — historique des colis ({packages.length})
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && (
        <div className="scene-tracking-details__list">
          {packages.map((pkg) => (
            <div key={pkg.id} className="scene-tracking-item">
              <div className="scene-tracking-item__header">
                <strong>{pkg.tracking_number}</strong>
                <span className="scene-tracking-item__status">{pkg.status}</span>
              </div>
              <ol className="scene-tracking-item__steps">
                {pkg.tracking_history.map((tp, i) => (
                  <li key={tp.id || i}>
                    <span className="scene-tracking-item__node">
                      {nodeIdToLabel[tp.node_id] || tp.node_type}
                    </span>
                    — {tp.status}
                    {tp.location && ` (${tp.location})`}
                    <span className="scene-tracking-item__time">
                      {tp.timestamp ? new Date(tp.timestamp).toLocaleString('fr-FR') : ''}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
