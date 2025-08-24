// Global type declarations for cross-platform compatibility

declare global {
  interface Window {
    __TAURI__?: {
      // Tauri API types - add as needed
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
      // Add other Tauri APIs as needed
    };
  }
}

export { };
