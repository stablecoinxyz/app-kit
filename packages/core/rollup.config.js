import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

export default [
  {
    input: 'src/index.ts',
    onwarn(warning, warn) {
      // Suppress circular dependency warnings from viem
      if (warning.code === 'CIRCULAR_DEPENDENCY' && 
          (warning.ids?.some(id => id.includes('node_modules/viem')) || 
           warning.message?.includes('node_modules/viem'))) {
        return;
      }
      
      // Suppress TypeScript override warnings from permissionless
      if (warning.code === 'PLUGIN_WARNING' && warning.plugin === 'typescript' && 
          warning.message?.includes('override') && warning.loc?.file?.includes('node_modules/permissionless')) {
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
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
        exclude: ['node_modules/**'],
        filterRoot: './src'
      }),
    ],
    external: [
      'viem',
      'permissionless',
      ...Object.keys(packageJson.peerDependencies || {}),
    ],
  },
];
