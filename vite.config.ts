import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { loadMdkbConfig, mdkbPlugin, parseBaseUrl } from './plugins/vite-plugin-mdkb.ts'

const mdkbConfig = loadMdkbConfig(process.cwd(), { docsDir: 'example/src' })
const { viteBase } = parseBaseUrl(mdkbConfig.baseUrl)

export default defineConfig({
  base: viteBase,
  plugins: [react(), mdkbPlugin({ docsDir: 'example/src' })],
})
