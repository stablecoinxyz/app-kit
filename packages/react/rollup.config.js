import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: false, // Disabled to prevent warnings in consuming apps
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: false, // Disabled to prevent warnings in consuming apps
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
    }),
  ],
  external: ['react', 'react-dom', 'viem', '@stablecoin.xyz/core'],
}; 