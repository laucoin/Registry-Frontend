<script setup lang="ts">
import type { NuxtError } from '#app'
import { AUTH_REFUSAL_CODES, type RegistryErrorBody } from '@shared/utils/api-errors'
import { useSessionStore } from '@stores/session'
import { Button, Typography, theme as antdTheme } from 'ant-design-vue'
import type { AssetKey } from '../composables/useRegistryAssets'

/**
 * Status illustrations come from the brand-asset layer (config
 * override → built-in default). Decorative, so hidden from assistive tech;
 * the message carries the information.
 *
 * Like the app shell, the screen sits outside every AntD component, so it takes
 * its surface and ink from the resolved tokens explicitly — otherwise dark mode
 * leaves the design layer's pale ink on an unpainted white page — and themes
 * <body> too, which is the canvas exposed around it.
 */
const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const { resolve, isDefault } = useRegistryAssets()
const { token } = antdTheme.useToken()
const sessionStore = useSessionStore()

const illustration = computed<AssetKey>(() => {
	if (props.error.status === 404) {
		return 'illustration:notFound'
	}
	if (props.error.status === 403) {
		return 'illustration:forbidden'
	}
	return 'illustration:error'
})

const message = computed(() => {
	if (props.error.status === 404) {
		return 'errorPage.notFound'
	}
	if (props.error.status === 403) {
		return 'errorPage.forbidden'
	}
	return 'errorPage.generic'
})

/**
 * A 4xx is the reader's own request being turned down and is usually theirs to
 * act on, so the built-in artwork wears the warning colour; a 5xx is the service
 * failing under them and wears the error colour. A failure that reached this
 * page without a status is the second kind.
 */
const statusColor = computed(() => {
	const status = props.error.status ?? 500
	return status >= 400 && status < 500 ? token.value.colorWarning : token.value.colorError
})

/**
 * Every failure that blocks the render — a sign-in refusal, a backend that is
 * down, anything the current-user call rejected with — arrives here with its
 * body attached, and naming that reason is the whole point of routing them to
 * this page, so it wins over the generic per-status wording. It goes through the
 * same resolver as every inline notice: Spring translates its own bodies, while
 * an outage has none and is localized here.
 */
const detail = computed(() => {
	const body = props.error.data as RegistryErrorBody | undefined
	if (!body?.message && !body?.title && !isServiceUnavailable(props.error)) {
		return ''
	}
	return apiErrorMessage(props.error, t)
})

/**
 * "Back to the home page" cannot clear a sign-in refusal: the sealed session
 * still holds the account the backend turned down, so the next render refuses
 * again. Signing out is the only move that changes that state, so those screens
 * offer it instead. Every other failure here is transient — an outage, a wrong
 * address — and the home page is worth another try.
 */
const refused = computed(() => {
	const code = (props.error.data as RegistryErrorBody | undefined)?.code
	return !!code && AUTH_REFUSAL_CODES.includes(code)
})

const screenStyle = computed(() => ({
	background: token.value.colorBgLayout,
	color: token.value.colorText,
}))

useHead({
	bodyAttrs: {
		style: computed(() => `background-color:${token.value.colorBgLayout}`),
	},
})
</script>

<template>
	<div
			class="error-page"
			:style="screenStyle"
	>
		<StatusIllustration
				v-if="isDefault(illustration)"
				class="error-page__illustration"
				:style="{ color: statusColor }"
		/>
		<img
				v-else
				:src="resolve(illustration)"
				alt=""
				aria-hidden="true"
				class="error-page__illustration"
		>
		<Typography>
			<h1>{{ error.status }}</h1>
			<p
					role="alert"
					data-testid="error-page-message"
			>
				{{ detail || $t(message) }}
			</p>
		</Typography>
		<Button
				v-if="refused"
				type="primary"
				data-testid="error-page-signout"
				@click="sessionStore.logout()"
		>
			{{ $t('auth.logout') }}
		</Button>
		<Button
				v-else
				type="primary"
				data-testid="error-page-home"
				@click="clearError({ redirect: '/' })"
		>
			{{ $t('errorPage.backHome') }}
		</Button>
	</div>
</template>

<style scoped>
.error-page {
	min-height: 100vh;
	min-width: 320px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16px;
	padding: 24px;
	text-align: center;
}

.error-page__illustration {
	width: 100%;
	max-width: 240px;
	height: auto;
}

.error-page p {
	max-width: 60ch;
	margin-inline: auto;
	overflow-wrap: anywhere;
}
</style>
