<script setup lang="ts">
/**
 * Public static page — no auth middleware. Accessibility statement:
 * WCAG 2.2 AA target. The AntD combobox exceptions are gone (fixed by
 * patches/ant-design-vue@4.2.6.patch, so the axe gate runs with no waived
 * rules); what remains is the manual keyboard/screen-reader audit, which is
 * what still holds the declaration at "partial". All copy lives in i18n.
 */
const { t } = useI18n()

useHead({ title: computed(() => t('accessibilityPage.title')) })

const CONTACT_EMAIL = 'luc.aucoin1998@gmail.com'
</script>

<template>
	<article class="legal-page reveal">
		<h1>{{ $t('accessibilityPage.title') }}</h1>
		<p class="legal-page__intro">
			{{ $t('accessibilityPage.intro') }}
		</p>

		<section>
			<h2>{{ $t('accessibilityPage.status.title') }}</h2>
			<p>{{ $t('accessibilityPage.status.text') }}</p>
		</section>

		<section>
			<h2>{{ $t('accessibilityPage.exceptions.title') }}</h2>
			<ul>
				<li>{{ $t('accessibilityPage.exceptions.manualAudit') }}</li>
				<li>{{ $t('accessibilityPage.exceptions.thirdParty') }}</li>
			</ul>
		</section>

		<section>
			<h2>{{ $t('accessibilityPage.testing.title') }}</h2>
			<p>{{ $t('accessibilityPage.testing.text') }}</p>
		</section>

		<section>
			<h2>{{ $t('accessibilityPage.feedback.title') }}</h2>
			<p>
				{{ $t('accessibilityPage.feedback.text') }}
				<a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
			</p>
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

.legal-page ul {
	margin: 8px 0;
	padding-left: 22px;
}

.legal-page li {
	margin: 4px 0;
}

.legal-page a {
	color: var(--accent-ink);
	text-decoration: underline;
	text-underline-offset: 2px;
}
</style>
