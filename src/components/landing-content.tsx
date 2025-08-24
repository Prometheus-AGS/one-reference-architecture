'use client';

import { Box, Database, GitBranch, Monitor, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";

type Feature = { id: string; title: string; desc: string; icon: React.ReactNode };

// Static features demonstrating PAS 3.0 concepts
const FEATURES: Feature[] = [
  { id: "artifact-schema", title: "Prometheus PAS 3.0", desc: "Core artifact schema, actions, data-bindings and container bridge.", icon: <Box size={18} /> },
  { id: "ai-core", title: "AI-first Core", desc: "Agent-call action, RAG bindings and AI primitives integrated.", icon: <Zap size={18} /> },
  { id: "pglite", title: "pglite Local DB", desc: "Client-side SQL + vector store for offline-first search.", icon: <Database size={18} /> },
  { id: "yjs", title: "CRDT Sync (Yjs)", desc: "Peer-to-peer WebRTC CRDT sync for same-owner devices.", icon: <GitBranch size={18} /> },
  { id: "runtimes", title: "Adaptive Runtimes", desc: "Tuono for web, Tauri for desktop & mobile — single artifact runs everywhere.", icon: <Monitor size={18} /> },
  { id: "security", title: "Sandbox & Permissions", desc: "Fine-grained permissions (network, storage, clipboard, sandboxing).", icon: <Users size={18} /> },
];

const Hero: React.FC<{ onOpenManifest: () => void }> = ({ onOpenManifest }) => (
  <header className="section-padding">
    <div className="grid-mobile-2 items-center">
      <div className="space-mobile">
        <h1>ONE — The Artifact Container (PAS 3.0)</h1>
        <p className="text-responsive-lg text-muted-foreground max-w-xl">
          Portable artifacts (Prometheus PAS 3.0) that run on web (Tuono), desktop & mobile (Tauri).
          Offline-first pglite, Yjs peer sync, agent-call actions and a secure container bridge.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onOpenManifest} className="btn-flame">View Artifact Manifest</button>
          <button className="btn-secondary">Features</button>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <Badge>agent-call</Badge>
          <Badge>pglite vector</Badge>
          <Badge>Yjs CRDT</Badge>
          <Badge>Sandbox</Badge>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="card-mobile w-full max-w-md hover:scale-105 hover:-translate-y-1 transition-all duration-300">
          <div className="h-64 rounded-2xl overflow-hidden bg-gradient-to-b from-primary/5 to-primary/10 flex items-center justify-center">
            <div className="flex items-center justify-center w-full h-full bg-muted/20 rounded-2xl">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center">
                  <img src="/icon.png" alt="ONE" className="w-10 h-10" />
                </div>
                <div className="text-responsive-sm font-medium text-foreground">ONE Dashboard</div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-responsive-sm font-medium text-foreground">ONE Dashboard (preview)</div>
              <div className="text-xs text-muted-foreground">local • synced</div>
            </div>
            <div className="text-responsive-sm text-muted-foreground">Shows artifact manifest, bridge messages, and action dispatch preview.</div>
          </div>
        </div>
      </div>
    </div>
  </header>
);

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="badge-flame">{children}</span>
);

const FeatureCard: React.FC<{ f: Feature }> = ({ f }) => (
  <div className="card-mobile hover:scale-105 hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">{f.icon}</div>
      <div className="flex-1">
        <div className="text-responsive-base font-semibold text-foreground">{f.title}</div>
        <div className="text-responsive-sm text-muted-foreground mt-1">{f.desc}</div>
      </div>
    </div>
  </div>
);

/* Simulated PAS 3.0 artifact manifest string for preview */
const SAMPLE_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<artifact xmlns="https://prometheusags.ai/schema/v3.0" type="react" id="one-demo-artifact" version="3.0.0">
  <metadata>
    <title>ONE Demo Artifact</title>
    <description>Demonstration artifact showing PAS 3.0 features: agent-call, bindings, container bridge.</description>
    <author>Acme Labs</author>
    <created>2025-08-24</created>
  </metadata>
  <dependencies>
    <dependency name="react" version="^19.0.0"/>
    <dependency name="@shadcn/ui" version="latest"/>
    <dependency name="lucide-react" version="^0.263.1"/>
  </dependencies>
  <environment>
    <variable name="NODE_ENV">production</variable>
    <variable name="API_BASE_URL">\${API_BASE_URL}</variable>
  </environment>
  <actions>
    <action id="summarize" type="agent-call">
      <endpoint>agent://expert/summarize</endpoint>
      <protocol>mcp</protocol>
      <payload>{"query":"\${USER_INPUT}"}</payload>
    </action>
  </actions>
  <data-bindings>
    <binding id="knowledge" type="agent">
      <source type="agent" endpoint="agent://rag/retriever"/>
    </binding>
  </data-bindings>
  <container-bridge>
    <messaging protocol="postMessage">
      <channel name="artifact-updates"/>
      <channel name="action-dispatch"/>
    </messaging>
    <hooks>
      <hook event="beforeMount" handler="initialize"/>
      <hook event="afterMount" handler="notifyReady"/>
      <hook event="beforeUnmount" handler="cleanup"/>
    </hooks>
  </container-bridge>
  <permissions>
    <permission type="api-access"><domain>api.example.com</domain><methods>GET,POST</methods></permission>
    <permission type="storage">indexedDB</permission>
    <permission type="clipboard">read,write</permission>
  </permissions>
</artifact>`;

/* Simple container-bridge simulator for preview */
function sendBridgeMessage(type: string, payload: any) {
  // In a real host this would be window.parent.postMessage or Tauri IPC.
  // For preview we just console.log and show an alert.
  console.log("BRIDGE SEND", { type, payload });
  
  // Only show alert in browser environment to avoid SSR errors
  if (typeof window !== 'undefined') {
    window.alert(`Bridge message sent: ${type}\n${JSON.stringify(payload, null, 2).slice(0, 200)}`);
  }
}

/* Main Preview component */
const OneLandingPas3Preview: React.FC = () => {
  const [showManifest, setShowManifest] = useState(false);
  const features = useMemo(() => FEATURES, []);
  const [lastActionResp, setLastActionResp] = useState<string | null>(null);

  function handleInvokeAgent() {
    // Demonstrate an action dispatch of type agent-call (no network in preview)
    const action = {
      id: "summarize",
      type: "agent-call",
      endpoint: "agent://expert/summarize",
      protocol: "mcp",
      payload: { query: "Summarize my notes." },
    };
    sendBridgeMessage("ACTION", action);

    // Simulate an agent response locally
    const simulated = { ok: true, summary: "This is a simulated summary produced in preview." };
    setLastActionResp(JSON.stringify(simulated, null, 2));
    sendBridgeMessage("DATA_UPDATE", { binding: "knowledge", data: simulated });
  }

  return (
    <div className="min-h-full bg-background text-foreground space-y-8">
      <Hero onOpenManifest={() => setShowManifest(true)} />

        {/* Technical Architecture Overview */}
        <section className="section-padding">
          <div className="space-mobile">
            <h2 className="text-responsive-xl font-bold text-foreground">Technical Architecture</h2>
            <p className="text-responsive-base text-muted-foreground">System overview showing the complete ONE platform architecture.</p>
          </div>
          <div className="card-mobile">
            <div className="text-responsive-base font-semibold text-foreground mb-4">System Overview</div>
            <div className="bg-muted/10 p-4 rounded-xl text-sm font-mono text-foreground">
              <pre className="whitespace-pre-wrap">
{`┌─────────────────┐  ┌─────────────────┐
│   Tuono Web     │  │  Tauri Desktop  │
│   (Axum HTTP)   │  │   (IPC Calls)   │
└─────────────────┘  └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────┐
│        Shared Rust Handlers            │
│     (rust-lib/src/{ai,api,mcp,rag})    │
└─────────────────────────────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────┐
│         Application Container           │
│    (React Components + Navigation)     │
└─────────────────────────────────────────┘`}
              </pre>
            </div>
          </div>
        </section>

        <section id="features" className="section-padding">
          <div className="space-mobile">
            <h2 className="text-responsive-xl font-bold text-foreground">What PAS 3.0 brings to ONE</h2>
            <p className="text-responsive-base text-muted-foreground">A manifest-driven artifact model with agent-call actions and container bridge.</p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <FeatureCard key={f.id} f={f} />
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-mobile">
              <div className="flex items-center justify-between">
                <div className="text-responsive-base font-semibold text-foreground">Manifest (PAS 3.0)</div>
                <button className="text-responsive-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowManifest((s) => !s)}>
                  {showManifest ? "Hide" : "Show"}
                </button>
              </div>
              {showManifest && (
                <pre className="mt-3 text-xs bg-muted/20 p-3 rounded-2xl text-foreground overflow-auto max-h-70">
                  {SAMPLE_MANIFEST}
                </pre>
              )}
            </div>

            <div className="card-mobile">
              <div className="flex items-center justify-between">
                <div className="text-responsive-base font-semibold text-foreground">Container Bridge</div>
                <div className="text-xs text-muted-foreground">postMessage (preview)</div>
              </div>
              <div className="mt-3 text-responsive-sm text-muted-foreground">
                Actions dispatched from the artifact use the container-bridge. Click to simulate an agent-call action.
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button onClick={handleInvokeAgent} className="btn-flame">Invoke agent-call</button>
                <button onClick={() => sendBridgeMessage("STATE_SYNC", { state: "preview" })} className="btn-secondary">Send STATE_SYNC</button>
              </div>

              {lastActionResp && (
                <div className="mt-3 text-xs bg-muted/20 p-3 rounded-2xl text-foreground">
                  <div className="font-medium">Simulated agent response</div>
                  <pre className="mt-1">{lastActionResp}</pre>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="runtime" className="section-padding">
          <div className="space-mobile">
            <h3 className="text-responsive-lg font-bold text-foreground">Runtime Targets & Policies</h3>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-mobile">
                <div className="text-responsive-base font-semibold text-foreground">Runtime routing</div>
                <div className="text-responsive-sm text-muted-foreground mt-2">
                  ONE's runtime router chooses where to run an artifact (Tuono web sandbox, Tauri native, or cloud) based on the artifact manifest capabilities, permissions, and device policies.
                </div>
              </div>
              <div className="card-mobile">
                <div className="text-responsive-base font-semibold text-foreground">Security & Sandbox</div>
                <div className="text-responsive-sm text-muted-foreground mt-2">
                  PAS 3.0 manifests declare permissions (network allowlist, storage, clipboard, sandbox level). Validators reject eval()/Function() usage.
                </div>
              </div>
            </div>
          </div>
        </section>

      <footer className="mt-16 pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} ONE — Prometheus PAS 3.0 Demo</div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Registry</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OneLandingPas3Preview;
