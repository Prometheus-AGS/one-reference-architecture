
import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  Position,
  useEdgesState,
  useNodesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTheme } from './theme-provider';

// Type definitions for node data
interface BaseNodeData {
  icon: string;
  label: string;
}

interface UserNodeData extends BaseNodeData {
  description: string;
}

interface PlatformNodeData extends BaseNodeData {
  description: string;
}

interface ComponentNodeData extends BaseNodeData {
  tech: string;
  bgColor: string;
  borderColor: string;
}

interface StorageNodeData extends BaseNodeData {
  tech: string;
}

// Custom Node Components with theme support and proper handles
const UserNode = ({ data }: { data: UserNodeData }): React.JSX.Element => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return (
    <div className={`px-6 py-4 ${isDark ? 'bg-gradient-to-r from-orange-900/20 to-orange-800/20 border-orange-400/60 text-orange-200' : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400 text-orange-800'} border-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="text-center">
        <div className="text-2xl mb-2">{data.icon}</div>
        <div className={`text-lg font-bold ${isDark ? 'text-orange-200' : 'text-orange-800'}`}>{data.label}</div>
        <div className={`text-sm ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>{data.description}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const PlatformNode = ({ data }: { data: PlatformNodeData }): React.JSX.Element => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return (
    <div className={`px-8 py-6 ${isDark ? 'bg-gradient-to-br from-orange-800/30 to-orange-700/30 border-orange-500/70 text-orange-100' : 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-500 text-orange-900'} border-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="text-center">
        <div className="text-3xl mb-3">{data.icon}</div>
        <div className={`text-xl font-bold ${isDark ? 'text-orange-100' : 'text-orange-900'}`}>{data.label}</div>
        <div className={`text-sm max-w-xs ${isDark ? 'text-orange-200' : 'text-orange-700'}`}>{data.description}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
};

const ComponentNode = ({ data }: { data: ComponentNodeData }): React.JSX.Element => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Theme-aware background colors
  const getThemeColors = (bgColor: string, borderColor: string) => {
    if (isDark) {
      if (bgColor.includes('red')) return { bg: 'bg-red-900/20', border: 'border-red-400/60', text: 'text-red-200' };
      if (bgColor.includes('green')) return { bg: 'bg-green-900/20', border: 'border-green-400/60', text: 'text-green-200' };
      if (bgColor.includes('blue')) return { bg: 'bg-blue-900/20', border: 'border-blue-400/60', text: 'text-blue-200' };
      if (bgColor.includes('emerald')) return { bg: 'bg-emerald-900/20', border: 'border-emerald-400/60', text: 'text-emerald-200' };
      if (bgColor.includes('purple')) return { bg: 'bg-purple-900/20', border: 'border-purple-400/60', text: 'text-purple-200' };
      return { bg: 'bg-gray-800/20', border: 'border-gray-400/60', text: 'text-gray-200' };
    }
    return { bg: bgColor, border: borderColor, text: 'text-gray-800' };
  };
  
  const colors = getThemeColors(data.bgColor, data.borderColor);
  
  return (
    <div className={`px-5 py-3 ${colors.bg} border-2 ${colors.border} rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <div className="text-center">
        <div className="text-xl mb-2">{data.icon}</div>
        <div className={`text-base font-semibold ${colors.text}`}>{data.label}</div>
        <div className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{data.tech}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
};

const StorageNode = ({ data }: { data: StorageNodeData }): React.JSX.Element => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return (
    <div className={`px-5 py-3 ${isDark ? 'bg-gradient-to-r from-gray-800/30 to-gray-700/30 border-gray-400/60 text-gray-200' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-400 text-gray-800'} border-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="text-center">
        <div className="text-xl mb-2">{data.icon}</div>
        <div className={`text-base font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{data.label}</div>
        <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{data.tech}</div>
      </div>
    </div>
  );
};

const nodeTypes = {
  user: UserNode,
  platform: PlatformNode,
  component: ComponentNode,
  storage: StorageNode,
};

 // Systematic positioning based on architectural layers
 const LAYER_HEIGHT = 200;
 const BASE_NODE_SPACING = 180;
 const DIAGRAM_WIDTH = 1600; // wider canvas to reduce overlap
 
 /**
  * Calculate positions ensuring nodes in a layer don't touch.
  * Spacing grows with number of nodes in the layer and available width.
  */
 const calculateNodePosition = (layer: number, index: number, totalInLayer: number): { x: number; y: number } => {
   const layerY = 80 + (layer * LAYER_HEIGHT);
 
   // Compute effective spacing. Ensure minimum spacing but allow expansion.
   const effectiveSpacing = Math.max(BASE_NODE_SPACING, Math.floor(DIAGRAM_WIDTH / Math.max(1, totalInLayer + 1)));
   const totalWidth = effectiveSpacing * (totalInLayer - 1);
   const startX = Math.max(40, (DIAGRAM_WIDTH - totalWidth) / 2);
 
   const nodeX = startX + (index * effectiveSpacing);
   return { x: nodeX, y: layerY };
 };

const initialNodes: Node<UserNodeData | PlatformNodeData | ComponentNodeData | StorageNodeData>[] = [
  // Layer 0: Users (3 nodes)
  {
    id: 'web-user',
    type: 'user',
    position: { x: 250, y: 50 },
    data: {
      icon: '🌐',
      label: 'Web Browser',
      description: 'Tuono React SPA'
    },
    draggable: false,
  },
  {
    id: 'desktop-user',
    type: 'user',
    position: { x: 650, y: 50 },
    data: {
      icon: '🖥️',
      label: 'Desktop App',
      description: 'Tauri Application'
    },
    draggable: false,
  },
  {
    id: 'api-user',
    type: 'user',
    position: { x: 1050, y: 50 },
    data: {
      icon: '🔌',
      label: 'API Integration',
      description: 'REST/WebSocket'
    },
    draggable: false,
  },

  // Layer 1: Entry Points (3 nodes)
  {
    id: 'web-server',
    type: 'component',
    position: { x: 250, y: 250 },
    data: {
      icon: '🌐',
      label: 'Web Server',
      tech: 'Axum/Tokio :3000',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400'
    },
    draggable: false,
  },
  {
    id: 'ai-api',
    type: 'component',
    position: { x: 650, y: 250 },
    data: {
      icon: '🤖',
      label: 'AI API',
      tech: 'OpenAI Compatible :8787',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400'
    },
    draggable: false,
  },
  {
    id: 'websocket',
    type: 'component',
    position: { x: 1050, y: 250 },
    data: {
      icon: '⚡',
      label: 'WebSocket',
      tech: 'Real-time Updates',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400'
    },
    draggable: false,
  },

  // Layer 2: AI Brain - Core Platform (2 nodes) + Tools (3 nodes)
  {
    id: 'orchestrator',
    type: 'platform',
    position: { x: 200, y: 450 },
    data: {
      icon: '🎯',
      label: 'Smart Router',
      description: 'Intent Classification & Routing'
    },
    draggable: false,
  },
  {
    id: 'code-gen',
    type: 'platform',
    position: { x: 450, y: 450 },
    data: {
      icon: '⚙️',
      label: 'Code Generator',
      description: 'Multi-LLM Support'
    },
    draggable: false,
  },
  {
    id: 'file-system',
    type: 'component',
    position: { x: 800, y: 450 },
    data: {
      icon: '📁',
      label: 'File System',
      tech: 'MCP Server',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400'
    },
    draggable: false,
  },
  {
    id: 'web-search',
    type: 'component',
    position: { x: 1000, y: 450 },
    data: {
      icon: '🔍',
      label: 'Web Search',
      tech: 'MCP Server',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400'
    },
    draggable: false,
  },
  {
    id: 'external-apis',
    type: 'component',
    position: { x: 1200, y: 450 },
    data: {
      icon: '🌍',
      label: 'External APIs',
      tech: 'MCP Clients',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400'
    },
    draggable: false,
  },

  // Layer 3: Execution Layer - WASM Sandboxes (4 nodes) + Security (2 nodes)
  {
    id: 'js-sandbox',
    type: 'component',
    position: { x: 200, y: 650 },
    data: {
      icon: '📝',
      label: 'JavaScript',
      tech: 'WASM QuickJS',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400'
    },
    draggable: false,
  },
  {
    id: 'python-sandbox',
    type: 'component',
    position: { x: 400, y: 650 },
    data: {
      icon: '🐍',
      label: 'Python',
      tech: 'WASM Python-WASI',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400'
    },
    draggable: false,
  },
  {
    id: 'bash-sandbox',
    type: 'component',
    position: { x: 600, y: 650 },
    data: {
      icon: '💻',
      label: 'Bash',
      tech: 'WASM Busybox',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400'
    },
    draggable: false,
  },
  {
    id: 'rust-sandbox',
    type: 'component',
    position: { x: 800, y: 650 },
    data: {
      icon: '🦀',
      label: 'Rust',
      tech: 'WASM Native',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400'
    },
    draggable: false,
  },
  {
    id: 'security',
    type: 'component',
    position: { x: 1050, y: 650 },
    data: {
      icon: '🔒',
      label: 'Security',
      tech: 'Auth & Isolation',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-400'
    },
    draggable: false,
  },
  {
    id: 'monitoring',
    type: 'component',
    position: { x: 1250, y: 650 },
    data: {
      icon: '📊',
      label: 'Monitoring',
      tech: 'Prometheus/Grafana',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-400'
    },
    draggable: false,
  },

  // Layer 4: Artifacts (2 nodes) + Storage (3 nodes)
  {
    id: 'ui-artifacts',
    type: 'component',
    position: { x: 200, y: 850 },
    data: {
      icon: '⚛️',
      label: 'UI Components',
      tech: 'React/Vue/Svelte',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-400'
    },
    draggable: false,
  },
  {
    id: 'project-artifacts',
    type: 'component',
    position: { x: 400, y: 850 },
    data: {
      icon: '📦',
      label: 'Full Projects',
      tech: 'Scaffolding',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-400'
    },
    draggable: false,
  },
  {
    id: 'postgres',
    type: 'storage',
    position: { x: 650, y: 850 },
    data: {
      icon: '🗄️',
      label: 'PostgreSQL',
      tech: 'Agent Registry'
    },
    draggable: false,
  },
  {
    id: 'ipfs',
    type: 'storage',
    position: { x: 850, y: 850 },
    data: {
      icon: '🌐',
      label: 'IPFS',
      tech: 'Artifact Storage'
    },
    draggable: false,
  },
  {
    id: 'redis',
    type: 'storage',
    position: { x: 1050, y: 850 },
    data: {
      icon: '⚡',
      label: 'Redis',
      tech: 'Performance Cache'
    },
    draggable: false,
  },
];

const initialEdges: Edge[] = [
  // User connections to entry points
  { id: 'web-user-server', source: 'web-user', target: 'web-server', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
  { id: 'desktop-user-server', source: 'desktop-user', target: 'web-server', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
  { id: 'api-user-api', source: 'api-user', target: 'ai-api', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },

  // Entry points to AI Brain
  { id: 'web-server-orchestrator', source: 'web-server', target: 'orchestrator', type: 'smoothstep', style: { stroke: '#ef4444', strokeWidth: 2 } },
  { id: 'ai-api-orchestrator', source: 'ai-api', target: 'orchestrator', type: 'smoothstep', style: { stroke: '#ef4444', strokeWidth: 2 } },
  { id: 'websocket-orchestrator', source: 'websocket', target: 'orchestrator', type: 'smoothstep', style: { stroke: '#ef4444', strokeWidth: 2 } },

  // AI Brain connections (animated to show action flow)
  { id: 'orchestrator-codegen', source: 'orchestrator', target: 'code-gen', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 3 } },
 
  // Code generation to execution - animate flow
  { id: 'codegen-js', source: 'code-gen', target: 'js-sandbox', type: 'smoothstep', animated: true, style: { stroke: '#22c55e', strokeWidth: 2 } },
  { id: 'codegen-python', source: 'code-gen', target: 'python-sandbox', type: 'smoothstep', animated: true, style: { stroke: '#22c55e', strokeWidth: 2 } },
  { id: 'codegen-bash', source: 'code-gen', target: 'bash-sandbox', type: 'smoothstep', animated: true, style: { stroke: '#22c55e', strokeWidth: 2 } },
  { id: 'codegen-rust', source: 'code-gen', target: 'rust-sandbox', type: 'smoothstep', animated: true, style: { stroke: '#22c55e', strokeWidth: 2 } },

  // Tools connections
  { id: 'orchestrator-filesystem', source: 'orchestrator', target: 'file-system', type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'orchestrator-websearch', source: 'orchestrator', target: 'web-search', type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'orchestrator-apis', source: 'orchestrator', target: 'external-apis', type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } },

  // Artifact generation
  { id: 'codegen-ui-artifacts', source: 'code-gen', target: 'ui-artifacts', type: 'smoothstep', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'codegen-project-artifacts', source: 'code-gen', target: 'project-artifacts', type: 'smoothstep', style: { stroke: '#10b981', strokeWidth: 2 } },

  // Storage connections
  { id: 'js-postgres', source: 'js-sandbox', target: 'postgres', type: 'smoothstep', style: { stroke: '#78716c', strokeWidth: 1 } },
  { id: 'python-postgres', source: 'python-sandbox', target: 'postgres', type: 'smoothstep', style: { stroke: '#78716c', strokeWidth: 1 } },
  { id: 'ui-artifacts-ipfs', source: 'ui-artifacts', target: 'ipfs', type: 'smoothstep', style: { stroke: '#78716c', strokeWidth: 1 } },
  { id: 'project-artifacts-ipfs', source: 'project-artifacts', target: 'ipfs', type: 'smoothstep', style: { stroke: '#78716c', strokeWidth: 1 } },
  { id: 'orchestrator-redis', source: 'orchestrator', target: 'redis', type: 'smoothstep', style: { stroke: '#78716c', strokeWidth: 1 } },

  // Security & Monitoring
  { id: 'platform-security', source: 'orchestrator', target: 'security', type: 'smoothstep', style: { stroke: '#8b5cf6', strokeWidth: 1 } },
  { id: 'platform-monitoring', source: 'code-gen', target: 'monitoring', type: 'smoothstep', style: { stroke: '#8b5cf6', strokeWidth: 1 } },

  // Additional logical connections
  { id: 'bash-redis', source: 'bash-sandbox', target: 'redis', type: 'smoothstep', style: { stroke: '#78716c', strokeWidth: 1 } },
  { id: 'rust-postgres', source: 'rust-sandbox', target: 'postgres', type: 'smoothstep', style: { stroke: '#78716c', strokeWidth: 1 } },
];

export default function ONEPlatformArchitectureDiagram(): React.JSX.Element {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const { theme } = useTheme();
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Theme-aware styles
  const themeStyles = useMemo(() => ({
    background: isDark 
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
      : 'bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100',
    headerBg: isDark 
      ? 'bg-gray-800/95 border-gray-600' 
      : 'bg-white/95 border-orange-200',
    headerText: isDark 
      ? 'from-orange-400 to-orange-300' 
      : 'from-orange-600 to-orange-800',
    subText: isDark ? 'text-gray-300' : 'text-gray-600',
    legendBg: isDark 
      ? 'bg-gray-800/95 border-gray-600' 
      : 'bg-white/95 border-orange-200',
    legendText: isDark ? 'text-gray-200' : 'text-gray-800',
    controlsBg: isDark 
      ? 'bg-gray-800/95 border-gray-600' 
      : 'bg-white/95 border-orange-200',
    backgroundDots: isDark ? '#374151' : '#e2e8f0',
  }), [isDark]);

  console.log('🔍 Architecture Diagram: Rendering with systematic positioning and theme support');
  console.log('📊 Nodes count:', nodes.length);
  console.log('🔗 Edges count:', edges.length);
  console.log('🎨 Theme mode:', theme, '| isDark:', isDark);

  return (
    <div className={`w-full ${themeStyles.background} relative overflow-hidden`} style={{ height: '150vh' }}>
      {/* Header */}
      <div className={`absolute top-4 left-4 z-10 ${themeStyles.headerBg} backdrop-blur-sm p-4 rounded-xl shadow-lg border`}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">🔥</div>
          <div>
            <h1 className={`text-2xl font-bold bg-gradient-to-r ${themeStyles.headerText} bg-clip-text text-transparent`}>
              ONE Platform
            </h1>
            <p className={`text-sm ${themeStyles.subText}`}>Intelligent Code Execution System</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className={`absolute top-4 right-4 z-10 ${themeStyles.legendBg} backdrop-blur-sm p-4 rounded-xl shadow-lg border`}>
        <h3 className={`text-sm font-semibold ${themeStyles.legendText} mb-3`}>Architecture Layers</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${isDark ? 'bg-gradient-to-r from-orange-600/40 to-orange-500/40 border-orange-400/60' : 'bg-gradient-to-r from-orange-200 to-orange-300 border-orange-400'} border rounded`}></div>
            <span className={themeStyles.subText}>Users & Platform Core</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${isDark ? 'bg-red-800/40 border-red-400/60' : 'bg-red-100 border-red-400'} border rounded`}></div>
            <span className={themeStyles.subText}>Entry Points</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${isDark ? 'bg-green-800/40 border-green-400/60' : 'bg-green-100 border-green-400'} border rounded`}></div>
            <span className={themeStyles.subText}>WASM Sandboxes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${isDark ? 'bg-blue-800/40 border-blue-400/60' : 'bg-blue-100 border-blue-400'} border rounded`}></div>
            <span className={themeStyles.subText}>MCP Tools</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${isDark ? 'bg-emerald-800/40 border-emerald-400/60' : 'bg-emerald-100 border-emerald-400'} border rounded`}></div>
            <span className={themeStyles.subText}>Artifacts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${isDark ? 'bg-gray-700/40 border-gray-400/60' : 'bg-gray-100 border-gray-400'} border rounded`}></div>
            <span className={themeStyles.subText}>Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${isDark ? 'bg-purple-800/40 border-purple-400/60' : 'bg-purple-100 border-purple-400'} border rounded`}></div>
            <span className={themeStyles.subText}>Security</span>
          </div>
        </div>
      </div>

      {/* ReactFlow Container - Full height with 150% increase */}
      <div className="w-full h-full p-2">
        <div className="w-full h-full rounded-lg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            className="bg-transparent w-full h-full"
            defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
            minZoom={0.2}
            maxZoom={1.2}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
          >
          <Background
            color={themeStyles.backgroundDots}
            gap={20}
            size={1}
            variant={BackgroundVariant.Cross}
            className="opacity-30"
          />
          <Controls
            className={`${themeStyles.controlsBg} backdrop-blur-sm border shadow-lg rounded-lg`}
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          <MiniMap
            className={`${themeStyles.controlsBg} backdrop-blur-sm border shadow-lg rounded-lg`}
            nodeColor={(node) => {
              const baseColors = {
                user: isDark ? '#fed7aa40' : '#fed7aa',
                platform: isDark ? '#ffedd540' : '#ffedd5',
                storage: isDark ? '#f3f4f640' : '#f3f4f6',
              };
              
              if (node.type === 'component') {
                // derive color from node data if available
                const dataAny = node.data as any;
                if (dataAny?.bgColor) return isDark ? '#065f46' : '#10b981';
                return isDark ? '#cbd5e1' : '#cbd5e1';
              }
 
              // default colors
              return baseColors[node.type as keyof typeof baseColors] || (isDark ? '#9ca3af' : '#94a3b8');
            }}
            zoomable
          />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
