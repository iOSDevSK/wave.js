import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
  plugins: [react(), glsl()],
  build: command === 'serve' ? {} : {
    lib: {
      entry: {
        'wave.js': resolve(__dirname, 'src/index.js'),
        'react': resolve(__dirname, 'src/react.js'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
  },
}))
