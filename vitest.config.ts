import vue from '@vitejs/plugin-vue'
import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// dayjs is a transitive dependency (pnpm strict layout): the Nuxt app resolves
// it through ant-design-vue's prebundle nesting (nuxt.config.ts
// vite.optimizeDeps), which plain Vitest lacks — mirror it with an alias to the
// package directory ant-design-vue actually links against.
const dayjsDir = dirname(createRequire(
	realpathSync(fileURLToPath(new URL('./node_modules/ant-design-vue/package.json', import.meta.url))),
).resolve('dayjs'))

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@stores': fileURLToPath(new URL('./app/stores', import.meta.url)),
			'@assets': fileURLToPath(new URL('./app/assets', import.meta.url)),
			'@shared': fileURLToPath(new URL('./shared', import.meta.url)),
			'@server': fileURLToPath(new URL('./server', import.meta.url)),
			'dayjs': dayjsDir,
		},
	},
	test: {
		environment: 'happy-dom',
		include: ['tests/**/*.test.ts'],
		// No `include`: Vitest 4's remapper raw-parses never-imported files as
		// JS/JSX and chokes on TS/SFC syntax, so coverage is limited to files
		// actually loaded by the test run.
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
		},
	},
})
