import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./app', import.meta.url)),
			'@stores': fileURLToPath(new URL('./app/stores', import.meta.url)),
			'@assets': fileURLToPath(new URL('./app/assets', import.meta.url)),
			'@shared': fileURLToPath(new URL('./shared', import.meta.url)),
			'@server': fileURLToPath(new URL('./server', import.meta.url)),
		},
	},
	test: {
		environment: 'happy-dom',
		include: ['tests/**/*.test.ts'],
		/**
		 * No `include`: Vitest 4's remapper raw-parses never-imported files as
		 * JS/JSX and chokes on TS/SFC syntax, so coverage is limited to files
		 * actually loaded by the test run.
		 */
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
		},
	},
})
