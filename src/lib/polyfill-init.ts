// Early WASM polyfill initialization
// This file should be imported as early as possible to ensure polyfills are available
// before any WASM modules (like PGLite) are loaded

console.log('🌟 [POLYFILL-INIT] Initializing early WASM polyfills...');

// Server-side safety check
const isClient = typeof window !== 'undefined';
const hasTextEncoder = typeof TextEncoder !== 'undefined';

console.log('🌟 [POLYFILL-INIT] Environment - isClient:', isClient, 'hasTextEncoder:', hasTextEncoder);

// Apply TextEncoder.encodeInto polyfill if needed (works in both client and server contexts)
if (hasTextEncoder && !TextEncoder.prototype.encodeInto) {
  console.log('🌟 [POLYFILL-INIT] Applying TextEncoder.encodeInto polyfill');
  
  TextEncoder.prototype.encodeInto = function(source: string, destination: Uint8Array) {
    console.log('🌟 [POLYFILL-INIT] encodeInto polyfill called - source:', source.length, 'dest:', destination.length);
    const encoded = this.encode(source);
    const length = Math.min(encoded.length, destination.length);
    destination.set(encoded.subarray(0, length));
    return {
      read: source.length,
      written: length
    };
  };
  
  console.log('🌟 [POLYFILL-INIT] TextEncoder.encodeInto polyfill applied successfully');
} else if (hasTextEncoder) {
  console.log('🌟 [POLYFILL-INIT] TextEncoder.encodeInto already available');
} else {
  console.log('🌟 [POLYFILL-INIT] TextEncoder not available in this environment');
}

// Client-side specific polyfills
if (isClient) {
  console.log('🌟 [POLYFILL-INIT] Applying client-side polyfills...');
  
  // Ensure TextEncoder is available globally
  if (!window.TextEncoder && hasTextEncoder) {
    console.log('🌟 [POLYFILL-INIT] Adding TextEncoder to window global');
    window.TextEncoder = TextEncoder;
  }

  // Ensure TextDecoder is available globally
  if (!window.TextDecoder && typeof TextDecoder !== 'undefined') {
    console.log('🌟 [POLYFILL-INIT] Adding TextDecoder to window global');
    window.TextDecoder = TextDecoder;
  }

  // Ensure URL constructor is available globally
  if (!window.URL) {
    console.log('🌟 [POLYFILL-INIT] URL not available on window, checking global');
    if (typeof URL !== 'undefined') {
      console.log('🌟 [POLYFILL-INIT] Adding URL to window global');
      window.URL = URL;
    } else {
      console.log('🌟 [POLYFILL-INIT] URL not available anywhere - this should not happen in modern browsers');
      // In modern browsers, URL should always be available
      // If it's not, something is seriously wrong with the environment
    }
  } else {
    console.log('🌟 [POLYFILL-INIT] URL already available globally');
  }

  // Ensure crypto.getRandomValues is available for WASM
  if (!window.crypto || !window.crypto.getRandomValues) {
    console.log('🌟 [POLYFILL-INIT] Adding crypto.getRandomValues polyfill');
    
    if (!window.crypto) {
      window.crypto = {} as Crypto;
    }
    
    if (!window.crypto.getRandomValues) {
      window.crypto.getRandomValues = function(array: any) {
        console.log('🌟 [POLYFILL-INIT] crypto.getRandomValues polyfill called for array length:', array.length);
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      };
    }
  }

  // Ensure performance.now is available
  if (!window.performance || !window.performance.now) {
    console.log('🌟 [POLYFILL-INIT] Adding performance.now polyfill');
    if (!window.performance) {
      window.performance = {} as Performance;
    }
    window.performance.now = function() {
      return Date.now();
    };
  }
  
  console.log('🌟 [POLYFILL-INIT] Client-side polyfills complete');
}

// Final verification
if (hasTextEncoder) {
  console.log('🌟 [POLYFILL-INIT] Final verification - TextEncoder.encodeInto available:', !!TextEncoder.prototype.encodeInto);
}

console.log('✅ [POLYFILL-INIT] Early WASM polyfill initialization complete');

// Export a function to verify polyfills are working
export function verifyPolyfills(): boolean {
  const hasEncoder = typeof TextEncoder !== 'undefined';
  const hasEncodeInto = hasEncoder && !!TextEncoder.prototype.encodeInto;
  
  console.log('🔍 [POLYFILL-VERIFY] TextEncoder available:', hasEncoder);
  console.log('🔍 [POLYFILL-VERIFY] encodeInto available:', hasEncodeInto);
  
  return hasEncoder && hasEncodeInto;
}

// Export polyfill status for debugging
export const polyfillStatus = {
  isClient,
  hasTextEncoder,
  hasEncodeInto: hasTextEncoder && !!TextEncoder.prototype.encodeInto,
  timestamp: new Date().toISOString()
};