import React, { useState, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ShieldAlert,
  HelpCircle,
  FileText,
  CheckCircle,
  XCircle,
  ZoomIn,
  Filter,
  X,
  ExternalLink,
} from 'lucide-react';

interface KnowledgeGapGraphProps {
  projectTitle: string;
  sources: any[];
  claims: any[];
  gaps: any[];
  conflicts: any[];
  tasks: any[];
}

export const KnowledgeGapGraph: React.FC<KnowledgeGapGraphProps> = ({
  projectTitle,
  sources,
  claims,
  gaps,
  conflicts,
  tasks,
}) => {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Compute Nodes & Edges dynamically from database data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Central Topic Root Node
    nodes.push({
      id: 'root-topic',
      type: 'default',
      position: { x: 400, y: 50 },
      data: {
        label: (
          <div className="p-3 text-center">
            <span className="text-[10px] uppercase font-mono tracking-widest text-purple-300 font-bold block">
              RESEARCH INITIATIVE
            </span>
            <span className="font-bold text-xs text-white line-clamp-2">{projectTitle}</span>
          </div>
        ),
        type: 'root',
        raw: { title: projectTitle },
      },
      style: {
        background: '#1E1B4B',
        border: '2px solid #8B5CF6',
        borderRadius: '14px',
        color: '#fff',
        width: 260,
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
      },
    });

    // 1. Sources (Blue Nodes)
    sources.forEach((s, idx) => {
      const sId = `src-${s.id || idx}`;
      const posX = 100 + idx * 240;
      const posY = 180;
      nodes.push({
        id: sId,
        type: 'default',
        position: { x: posX, y: posY },
        data: {
          label: (
            <div className="p-2 text-left">
              <span className="text-[9px] uppercase font-mono text-cyan-300 font-bold block flex items-center gap-1">
                <FileText className="w-3 h-3" /> SOURCE [{s.source_type || 'web'}]
              </span>
              <span className="font-semibold text-[11px] text-white line-clamp-1">{s.title}</span>
            </div>
          ),
          type: 'source',
          raw: s,
        },
        style: {
          background: '#0F2642',
          border: '1.5px solid #06B6D4',
          borderRadius: '10px',
          color: '#fff',
          width: 200,
        },
      });

      edges.push({
        id: `e-root-${sId}`,
        source: 'root-topic',
        target: sId,
        style: { stroke: '#06B6D4', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#06B6D4' },
      });
    });

    // 2. Claims (Green Nodes for supported claims)
    claims.forEach((c, idx) => {
      const cId = `claim-${c.id || idx}`;
      const posX = 50 + idx * 190;
      const posY = 320;
      nodes.push({
        id: cId,
        type: 'default',
        position: { x: posX, y: posY },
        data: {
          label: (
            <div className="p-2 text-left">
              <span className="text-[9px] uppercase font-mono text-emerald-400 font-bold block flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> CLAIM ({Math.round((c.confidence || 0.8) * 100)}%)
              </span>
              <span className="text-[10px] text-gray-200 line-clamp-2">{c.claim_text}</span>
            </div>
          ),
          type: 'claim',
          raw: c,
        },
        style: {
          background: '#062E20',
          border: '1.5px solid #10B981',
          borderRadius: '10px',
          color: '#fff',
          width: 180,
        },
      });

      const parentSourceId = c.source_id ? `src-${c.source_id}` : (sources.length > 0 ? `src-${sources[0].id || 0}` : 'root-topic');
      edges.push({
        id: `e-src-${cId}`,
        source: parentSourceId,
        target: cId,
        style: { stroke: '#10B981', strokeWidth: 1.2 },
      });
    });

    // 3. Information Gaps (Yellow/Amber Nodes: Requires Verification)
    gaps.forEach((g, idx) => {
      const gId = `gap-${g.id || idx}`;
      const posX = 600 + idx * 210;
      const posY = 200 + (idx % 2) * 120;
      nodes.push({
        id: gId,
        type: 'default',
        position: { x: posX, y: posY },
        data: {
          label: (
            <div className="p-2 text-left">
              <span className="text-[9px] uppercase font-mono text-amber-400 font-bold block flex items-center gap-1">
                <AlertCircleIcon className="w-3 h-3" /> GAP: {g.importance?.toUpperCase()}
              </span>
              <span className="text-[10px] font-semibold text-gray-200 line-clamp-2">{g.title}</span>
            </div>
          ),
          type: 'gap',
          raw: g,
        },
        style: {
          background: '#35210A',
          border: '1.5px solid #F59E0B',
          borderRadius: '10px',
          color: '#fff',
          width: 190,
        },
      });

      edges.push({
        id: `e-root-${gId}`,
        source: 'root-topic',
        target: gId,
        style: { stroke: '#F59E0B', strokeDasharray: '4 4', strokeWidth: 1.5 },
      });
    });

    // 4. Conflicts (Red Nodes: Contradictions)
    conflicts.forEach((conf, idx) => {
      const confId = `conf-${conf.id || idx}`;
      const posX = 350 + idx * 220;
      const posY = 460;
      nodes.push({
        id: confId,
        type: 'default',
        position: { x: posX, y: posY },
        data: {
          label: (
            <div className="p-2 text-left">
              <span className="text-[9px] uppercase font-mono text-rose-400 font-bold block flex items-center gap-1">
                <XCircle className="w-3 h-3" /> CONFLICT RADAR
              </span>
              <span className="text-[10px] font-semibold text-gray-200 line-clamp-2">{conf.description}</span>
            </div>
          ),
          type: 'conflict',
          raw: conf,
        },
        style: {
          background: '#3B0C15',
          border: '1.5px solid #F43F5E',
          borderRadius: '10px',
          color: '#fff',
          width: 200,
          boxShadow: '0 0 15px rgba(244, 63, 94, 0.3)',
        },
      });

      // Connect to claims if available
      edges.push({
        id: `e-conf-${confId}`,
        source: 'root-topic',
        target: confId,
        style: { stroke: '#F43F5E', strokeWidth: 2 },
        animated: true,
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [projectTitle, sources, claims, gaps, conflicts, tasks]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Filter nodes according to selected category
  const filteredNodes = useMemo(() => {
    if (filterType === 'all') return nodes;
    return nodes.filter(n => n.id === 'root-topic' || n.data?.type === filterType);
  }, [nodes, filterType]);

  const handleNodeClick = (_: any, node: Node) => {
    setSelectedNode(node.data);
  };

  return (
    <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-white/10 bg-[#080B14]">
      {/* Legend & Filter Controls Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-[#111827]/90 backdrop-blur-md p-2 rounded-xl border border-white/10 text-xs">
        <span className="text-gray-400 font-semibold px-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-purple-400" /> Filter:
        </span>
        <button
          onClick={() => setFilterType('all')}
          className={`px-2.5 py-1 rounded-lg transition-colors ${
            filterType === 'all' ? 'bg-purple-600 text-white font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('source')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
            filterType === 'source' ? 'bg-cyan-600 text-white font-bold' : 'text-cyan-400 hover:text-cyan-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400" /> Sources
        </button>
        <button
          onClick={() => setFilterType('claim')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
            filterType === 'claim' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Claims
        </button>
        <button
          onClick={() => setFilterType('gap')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
            filterType === 'gap' ? 'bg-amber-600 text-white font-bold' : 'text-amber-400 hover:text-amber-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Gaps
        </button>
        <button
          onClick={() => setFilterType('conflict')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
            filterType === 'conflict' ? 'bg-rose-600 text-white font-bold' : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400" /> Conflicts
        </button>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background color="#1E293B" gap={18} size={1} />
        <Controls className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden fill-white" />
        <MiniMap
          nodeColor={(n: any) => {
            if (n.data?.type === 'source') return '#06B6D4';
            if (n.data?.type === 'claim') return '#10B981';
            if (n.data?.type === 'gap') return '#F59E0B';
            if (n.data?.type === 'conflict') return '#F43F5E';
            return '#8B5CF6';
          }}
          className="bg-[#0B0F19] border border-white/10 rounded-xl"
        />
      </ReactFlow>

      {/* Interactive Node Details Inspector Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 bg-[#111827] border border-white/15 rounded-2xl shadow-2xl p-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-purple-400">
              {selectedNode.type} Details
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-3 text-xs">
            {selectedNode.type === 'source' && (
              <>
                <p className="font-bold text-white text-sm">{selectedNode.raw.title}</p>
                <p className="text-gray-400">Type: <span className="text-cyan-300 font-mono">{selectedNode.raw.source_type}</span></p>
                {selectedNode.raw.url && (
                  <a
                    href={selectedNode.raw.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1.5 break-all"
                  >
                    <span>{selectedNode.raw.url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                )}
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 max-h-40 overflow-y-auto text-gray-300 text-[11px] leading-relaxed">
                  {selectedNode.raw.source_content || 'No text snippet'}
                </div>
              </>
            )}

            {selectedNode.type === 'claim' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                    Confidence: {Math.round((selectedNode.raw.confidence || 0.85) * 100)}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 font-mono text-[10px]">
                    {selectedNode.raw.claim_type}
                  </span>
                </div>
                <p className="font-semibold text-white leading-relaxed">{selectedNode.raw.claim_text}</p>
                {selectedNode.raw.evidence_text && (
                  <div className="p-3 bg-black/40 rounded-xl border border-emerald-500/20 text-emerald-200 text-[11px]">
                    <span className="text-emerald-400 font-bold block mb-1">Supporting Evidence:</span>
                    "{selectedNode.raw.evidence_text}"
                  </div>
                )}
              </>
            )}

            {selectedNode.type === 'gap' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px]">
                    Importance: {selectedNode.raw.importance}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 font-mono text-[10px]">
                    Status: {selectedNode.raw.status}
                  </span>
                </div>
                <p className="font-bold text-white text-sm">{selectedNode.raw.title}</p>
                <p className="text-gray-300 leading-relaxed">{selectedNode.raw.description}</p>
                {selectedNode.raw.recommended_action && (
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-200">
                    <span className="font-bold block text-amber-400 mb-0.5">Recommended Verification:</span>
                    {selectedNode.raw.recommended_action}
                  </div>
                )}
              </>
            )}

            {selectedNode.type === 'conflict' && (
              <>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px]">
                  Contradiction Detected
                </span>
                <p className="font-semibold text-white leading-relaxed">{selectedNode.raw.description}</p>
                {selectedNode.raw.recommended_action && (
                  <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-200">
                    <span className="font-bold block text-rose-400 mb-0.5">Resolution Protocol:</span>
                    {selectedNode.raw.recommended_action}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

