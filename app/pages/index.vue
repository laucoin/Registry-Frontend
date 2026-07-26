<script setup lang="ts">
import { useSessionStore } from '@stores/session'
import { Alert, Button } from 'ant-design-vue'
import { storeToRefs } from 'pinia'

/**
 * The global home, and the app's front door.
 *
 * Signed out it is the entry screen: a two-column split, content against a
 * brand panel. There is no email/password form here and there never will be —
 * the Registry does not own credentials. The single button hands the
 * browser to the identity provider, so the column that carries a form on a
 * conventional login page carries one CTA instead.
 *
 * Signed in, the same page is the personal dashboard (starred projects,
 * open-alert projects, invitations) behind a compact hero.
 */
const sessionStore = useSessionStore()
const { authenticated } = storeToRefs(sessionStore)
const route = useRoute()
const { t } = useI18n()

useHead({ title: computed(() => t('nav.home')) })

/**
 * /auth/login lands here with ?idp=down when the identity provider is
 * unreachable — the one 401 story where redirecting can't help, so it gets an
 * explicit message instead.
 */
const idpDown = computed(() => route.query.idp === 'down')
</script>

<template>
	<div
			class="home"
			:class="{ 'home--entry': !authenticated }"
	>
		<div
				v-if="idpDown"
				class="home__notice"
		>
			<Alert
					type="error"
					show-icon
					role="alert"
					data-testid="home-idp-down"
					:message="$t('home.idpDown.title')"
					:description="$t('home.idpDown.text')"
			/>
		</div>

		<section
				v-if="!authenticated"
				class="entry reveal"
		>
			<div class="entry__content">
				<p class="eyebrow">
					{{ $t('home.eyebrow') }}
				</p>
				<h1 class="entry__title">
					{{ $t('home.welcome') }}
				</h1>
				<p class="entry__lead">
					{{ $t('home.description') }}
				</p>

				<Button
						type="primary"
						size="large"
						block
						class="entry__cta"
						data-testid="home-login"
						@click="sessionStore.login(route.fullPath)"
				>
					{{ $t('auth.login') }}
				</Button>
				<p class="entry__hint">
					{{ $t('home.loginPrompt') }}
				</p>
			</div>

			<!-- Decorative only: the photograph sets a scene, it carries nothing
			     the text does not already say. It is a CSS background rather than
			     an <img> precisely because there is no alternative text worth
			     giving it, and because it disappears entirely below the
			     breakpoint — a display:none <img> is still fetched by some
			     browsers, a background-image behind an unrendered box is not. -->
			<div class="entry__panel"/>
		</section>

		<template v-else>
			<section class="hero reveal">
				<p class="eyebrow hero__eyebrow">
					{{ $t('home.eyebrow') }}
				</p>
				<h1 class="hero__title">
					{{ $t('home.welcome') }}
				</h1>
				<p class="hero__lead">
					{{ $t('home.description') }}
				</p>

				<div class="hero__actions">
					<NuxtLink
							to="/projects"
							class="hero__cta"
					>
						<Button
								type="primary"
								size="large"
						>
							{{ $t('nav.projects') }} →
						</Button>
					</NuxtLink>
					<NuxtLink
							to="/account"
							class="hero__link"
							data-testid="home-account"
					>{{ $t('nav.account') }}
					</NuxtLink>
				</div>
			</section>

			<DashboardHome/>
		</template>
	</div>
</template>

<style scoped>
.home {
	display: flex;
	flex-direction: column;
	gap: 40px;
}

/* Signed out the page runs edge to edge (the layout drops its reading column
   for `.home--entry`), so the alert's gutter has to come back locally. */
.home--entry {
	gap: 0;
}

.home--entry .home__notice {
	padding: 16px 16px 0;
}

.entry {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	align-items: stretch;
	min-height: calc(100dvh - var(--app-header-h, 69px));
}

.entry__content {
	display: flex;
	flex-direction: column;
	justify-content: center;
	justify-self: center;
	width: 100%;
	max-width: 420px;
	padding: 40px 24px;
}

.entry__title {
	margin: 0;
	font-size: clamp(2.1rem, 5vw, 3.1rem);
}

.entry__lead {
	margin: 18px 0 0;
	font-size: clamp(1.02rem, 2.4vw, 1.18rem);
	line-height: 1.55;
	opacity: 0.75;
}

.entry__cta {
	margin-top: 32px;
}

.entry__hint {
	margin: 12px 0 0;
	font-size: 0.95rem;
	text-align: center;
	opacity: 0.65;
}

.entry__panel {
	background-color: var(--brand);
	background-image: url('/img/entry-camp.jpg');
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
}

@media (max-width: 767px) {
	.entry {
		grid-template-columns: 1fr;
	}

	.entry__panel {
		display: none;
	}

	.entry__content {
		max-width: 460px;
		padding: 32px 20px;
	}
}

.hero {
	position: relative;
	padding: 40px 8px 8px;
	max-width: 720px;
}

.hero::before {
	content: '';
	position: absolute;
	inset: -80px 0 auto 0;
	height: 360px;
	z-index: -1;
	background: radial-gradient(42% 60% at 18% 30%, color-mix(in srgb, var(--focus) 22%, transparent), transparent 70%),
	radial-gradient(38% 55% at 80% 10%, color-mix(in srgb, var(--nav-active) 20%, transparent), transparent 70%);
	filter: blur(18px);
	opacity: 0.9;
	pointer-events: none;
}

.hero__eyebrow {
	margin: 0 0 14px;
}

.hero__title {
	margin: 0;
	font-size: clamp(2.2rem, 6vw, 3.4rem);
	line-height: 1.05;
	letter-spacing: -0.02em;
	font-weight: 700;
}

.hero__lead {
	margin: 18px 0 0;
	font-size: clamp(1.02rem, 2.4vw, 1.22rem);
	line-height: 1.55;
	max-width: 46ch;
	opacity: 0.72;
}

.hero__actions {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px 20px;
	margin-top: 30px;
}

.hero__cta {
	display: inline-flex;
}

.hero__link {
	font-weight: 500;
}

@media (max-width: 575px) {
	.home {
		gap: 32px;
	}

	.hero {
		padding-top: 24px;
	}
}
</style>
