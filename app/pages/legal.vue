<script setup lang="ts">
/**
 * Public static page — no auth middleware (legal notices must be reachable by
 * anyone, signed in or not). All copy lives in i18n (fr is authoritative).
 */
const { t } = useI18n()

useHead({ title: computed(() => t('legal.title')) })

const CONTACT_EMAIL = 'luc.aucoin1998@gmail.com'
const DOCS_URL = 'https://doc.laucoin.fr/registry/'

/**
 * The hosting provider is deploy-specific, so it comes from runtime
 * config rather than i18n: NUXT_PUBLIC_LEGAL_HOSTING_NAME / _ADDRESS / _PHONE.
 * Each line is rendered only when provided, and if the name is missing the
 * section says so explicitly — a legal notice that quietly omits its host is
 * worse than one that admits the gap.
 *
 * String() before trim(): destr turns a separator-free phone number into a JS
 * number, which optional chaining wouldn't save us from.
 */
const { legalHosting } = useRuntimeConfig().public
const asText = (value: unknown): string => String(value ?? '').trim()
const hosting = computed(() => ({
	name: asText(legalHosting.name),
	address: asText(legalHosting.address),
	phone: asText(legalHosting.phone),
}))
/**
 * `tel:` needs the number without the separators humans read.
 */
const phoneHref = computed(() => `tel:${hosting.value.phone.replace(/[^+\d]/g, '')}`)
</script>

<template>
	<article class="legal-page reveal">
		<h1>{{ $t('legal.title') }}</h1>
		<p class="legal-page__intro">
			{{ $t('legal.intro') }}
		</p>

		<section>
			<h2>{{ $t('legal.editor.title') }}</h2>
			<p>{{ $t('legal.editor.text') }}</p>
			<p>
				{{ $t('legal.editor.contact') }}
				<a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
			</p>
			<p>
				{{ $t('legal.editor.docs') }}
				<a
						:href="DOCS_URL"
						rel="noopener"
				>{{ DOCS_URL }}</a>
			</p>
		</section>

		<section>
			<h2>{{ $t('legal.director.title') }}</h2>
			<p>{{ $t('legal.director.text') }}</p>
		</section>

		<section>
			<h2>{{ $t('legal.hosting.title') }}</h2>
			<template v-if="hosting.name">
				<p>{{ hosting.name }}</p>
				<p v-if="hosting.address">
					{{ hosting.address }}
				</p>
				<p v-if="hosting.phone">
					{{ $t('legal.hosting.phone') }}
					<a :href="phoneHref">{{ hosting.phone }}</a>
				</p>
			</template>
			<p v-else>
				{{ $t('legal.hosting.unavailable') }}
			</p>
		</section>

		<section>
			<h2>{{ $t('legal.ip.title') }}</h2>
			<p>{{ $t('legal.ip.text') }}</p>
		</section>

		<section>
			<h2>{{ $t('legal.credits.title') }}</h2>
			<p>{{ $t('legal.credits.intro') }}</p>
			<ul>
				<li>{{ $t('legal.credits.photography') }}</li>
				<li>{{ $t('legal.credits.logo') }}</li>
				<li>{{ $t('legal.credits.defaultLogo') }}</li>
			</ul>
		</section>
	</article>
</template>

<style scoped>
.legal-page {
	max-width: 720px;
	line-height: 1.6;
}

.legal-page h1 {
	margin: 0 0 8px;
	font-size: clamp(1.7rem, 4.5vw, 2.2rem);
	letter-spacing: -0.02em;
}

.legal-page__intro {
	margin: 0 0 8px;
	opacity: 0.72;
}

.legal-page h2 {
	margin: 28px 0 8px;
	font-size: 1.15rem;
}

.legal-page p {
	margin: 8px 0;
	overflow-wrap: anywhere;
}

.legal-page a {
	color: var(--accent-ink);
	text-decoration: underline;
	text-underline-offset: 2px;
}
</style>
