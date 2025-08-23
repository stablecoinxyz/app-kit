import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

export default [
  // JS bundles (transpile-only via esbuild)
  {
    input: 'src/index.ts',
    onwarn(warning, warn) {
      // Suppress circular dependency warnings from viem
      if (warning.code === 'CIRCULAR_DEPENDENCY' && 
          (warning.ids?.some(id => id.includes('node_modules/viem')) || 
           warning.message?.includes('node_modules/viem'))) {
        return;
      }
      
      // Show other warnings (only from our code)
      warn(warning);
    },
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: false, // Disabled to prevent warnings in consuming apps
        inlineDynamicImports: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: false, // Disabled to prevent warnings in consuming apps
        inlineDynamicImports: true,
      },
    ],
    plugins: [
      resolve({
        browser: false,
        preferBuiltins: true,
      }),
      commonjs(),
      esbuild({
        sourceMap: false,
        minify: false,
        target: 'es2020',
        jsx: 'automatic',
        tsconfig: './tsconfig.json',
      }),
    ],
    external: [
      'viem',
      'permissionless',
      ...Object.keys(packageJson.peerDependencies || {}),
    ],
  },
  // Type bundle (builds index.d.ts without type-checking node_modules)
  {
    input: 'src/index.ts',
    output: [{ file: packageJson.types, format: 'es' }],
    plugins: [
      dts({
        respectExternal: true,
        compilerOptions: {
          skipLibCheck: true,
        },
      })
    ],
    external: [/^viem/, /^permissionless/, /^ox/],
  },
];
