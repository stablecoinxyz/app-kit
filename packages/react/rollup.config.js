import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default [
  // JS bundles (transpile-only)
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.js', format: 'cjs', sourcemap: false },
      { file: 'dist/index.esm.js', format: 'esm', sourcemap: false },
    ],
    plugins: [
      peerDepsExternal(),
      resolve({ browser: true }),
      commonjs(),
      esbuild({
        sourceMap: false,
        minify: false,
        target: 'es2020',
        jsx: 'automatic',
        tsconfig: './tsconfig.json',
      }),
    ],
    external: ['react', 'react-dom', 'viem', '@stablecoin.xyz/core'],
  },
  // Types
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [
      dts({
        respectExternal: true,
        compilerOptions: { skipLibCheck: true },
      }),
    ],
    external: [/^react/, /^viem/, /^@stablecoin\.xyz\/core/],
  },
];