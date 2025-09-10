// Temporary shim if vitest types not yet installed locally
// (Real project should run: npm install --save-dev vitest)
declare module 'vitest' {
  export const describe: any
  export const it: any
  export const expect: any
}