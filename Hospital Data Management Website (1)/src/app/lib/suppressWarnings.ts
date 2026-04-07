// Suppress known harmless warnings from third-party libraries

export function suppressRechartsWarnings() {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    // Suppress Recharts duplicate key warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Encountered two children with the same key') ||
       args[0].includes('React does not recognize'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    // Suppress Recharts duplicate key warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Encountered two children with the same key') ||
       args[0].includes('React does not recognize'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}
