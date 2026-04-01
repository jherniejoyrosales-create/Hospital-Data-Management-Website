/**
 * Suppresses specific Recharts library warnings that cannot be fixed from application code.
 * 
 * These warnings originate from inside the Recharts library (node_modules/recharts.js)
 * at lines 25504 (ChartLayoutContextProvider2) and 6048 (Surface).
 * 
 * The warnings are:
 * - "Encountered two children with the same key" in div/svg elements
 * 
 * This is a known limitation of Recharts v2.15.2 and does not affect functionality.
 */

const originalError = console.error;

export function suppressRechartsWarnings() {
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    
    // Suppress Recharts duplicate key warnings
    if (
      errorString.includes('Encountered two children with the same key') &&
      (errorString.includes('ChartLayoutContextProvider2') || 
       errorString.includes('Surface') ||
       errorString.includes('recharts.js'))
    ) {
      return;
    }
    
    // Call original console.error for all other errors
    originalError.apply(console, args);
  };
}

export function restoreConsoleError() {
  console.error = originalError;
}
