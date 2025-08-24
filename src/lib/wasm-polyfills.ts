// WASM Polyfills for PGLite compatibility
// This ensures TextEncoder.encodeInto is available for WASM modules

export function setupWASMPolyfills(): void {
  console.log('🔧 [POLYFILL] Starting WASM polyfills setup...');
  console.log('🔧 [POLYFILL] Environment check - window:', typeof window !== 'undefined');
  console.log('🔧 [POLYFILL] Environment check - TextEncoder:', typeof TextEncoder !== 'undefined');
  
  // Only run in browser environment
  if (typeof window === 'undefined') {
    console.log('🔧 [POLYFILL] Skipping polyfills - not in browser environment');
    return;
  }

  // Check if TextEncoder exists and log its current state
  if (typeof TextEncoder !== 'undefined') {
    console.log('🔧 [POLYFILL] TextEncoder available, checking encodeInto method...');
    console.log('🔧 [POLYFILL] TextEncoder.prototype.encodeInto exists:', !!TextEncoder.prototype.encodeInto);
  }

  // Polyfill TextEncoder.encodeInto if not available
  if (typeof TextEncoder !== 'undefined' && !TextEncoder.prototype.encodeInto) {
    console.log('🔧 [POLYFILL] Adding TextEncoder.encodeInto polyfill for WASM compatibility');
    
    TextEncoder.prototype.encodeInto = function(source: string, destination: Uint8Array) {
      console.log('🔧 [POLYFILL] encodeInto polyfill called with source length:', source.length, 'destination length:', destination.length);
      const encoded = this.encode(source);
      const length = Math.min(encoded.length, destination.length);
      destination.set(encoded.subarray(0, length));
      const result = {
        read: source.length,
        written: length
      };
      console.log('🔧 [POLYFILL] encodeInto polyfill result:', result);
      return result;
    };
    
    console.log('🔧 [POLYFILL] TextEncoder.encodeInto polyfill applied successfully');
  } else if (typeof TextEncoder !== 'undefined' && TextEncoder.prototype.encodeInto !== undefined) {
    console.log('🔧 [POLYFILL] TextEncoder.encodeInto already exists - no polyfill needed');
  }

  // Ensure TextEncoder is available globally
  if (!window.TextEncoder && typeof TextEncoder !== 'undefined') {
    console.log('🔧 [POLYFILL] Adding TextEncoder to window global');
    window.TextEncoder = TextEncoder;
  }

  // Ensure TextDecoder is available globally
  if (!window.TextDecoder && typeof TextDecoder !== 'undefined') {
    console.log('🔧 [POLYFILL] Adding TextDecoder to window global');
    window.TextDecoder = TextDecoder;
  }

  // Ensure crypto.getRandomValues is available for WASM
  if (!window.crypto || !window.crypto.getRandomValues) {
    console.log('🔧 [POLYFILL] Adding crypto.getRandomValues polyfill for WASM compatibility');
    
    if (!window.crypto) {
      window.crypto = {} as Crypto;
    }
    
    if (!window.crypto.getRandomValues) {
      window.crypto.getRandomValues = function(array: any) {
        console.log('🔧 [POLYFILL] crypto.getRandomValues polyfill called for array length:', array.length);
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      };
    }
  }

  // Additional WASM compatibility fixes
  if (typeof window !== 'undefined') {
    // Ensure performance.now is available
    if (!window.performance || !window.performance.now) {
      console.log('🔧 [POLYFILL] Adding performance.now polyfill');
      if (!window.performance) {
        window.performance = {} as Performance;
      }
      window.performance.now = function() {
        return Date.now();
      };
    }
  }

  console.log('✅ [POLYFILL] WASM polyfills setup complete');
  
  // Final verification
  if (typeof TextEncoder !== 'undefined') {
    console.log('✅ [POLYFILL] Final check - TextEncoder.encodeInto available:', !!TextEncoder.prototype.encodeInto);
  }
}

// Additional function to setup polyfills globally and synchronously
export function setupGlobalWASMPolyfills(): void {
  console.log('🌍 [GLOBAL-POLYFILL] Setting up global WASM polyfills...');
  
  // Apply polyfills in both browser and potential SSR contexts
  const isClient = typeof window !== 'undefined';
  const hasTextEncoder = typeof TextEncoder !== 'undefined';
  
  console.log('🌍 [GLOBAL-POLYFILL] isClient:', isClient, 'hasTextEncoder:', hasTextEncoder);
  
  if (hasTextEncoder && !TextEncoder.prototype.encodeInto) {
    console.log('🌍 [GLOBAL-POLYFILL] Applying global TextEncoder.encodeInto polyfill');
    
    TextEncoder.prototype.encodeInto = function(source: string, destination: Uint8Array) {
      console.log('🌍 [GLOBAL-POLYFILL] Global encodeInto called - source:', source.length, 'dest:', destination.length);
      const encoded = this.encode(source);
      const length = Math.min(encoded.length, destination.length);
      destination.set(encoded.subarray(0, length));
      return {
        read: source.length,
        written: length
      };
    };
  }
  
  // If in client, also setup window globals
  if (isClient) {
    setupWASMPolyfills();
  }
  
  console.log('✅ [GLOBAL-POLYFILL] Global WASM polyfills complete');
}