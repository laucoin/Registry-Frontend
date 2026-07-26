<script setup lang="ts">
import { useSessionStore } from '@stores/session'
import { Alert, Button } from 'ant-design-vue'
import { storeToRefs } from 'pinia'

// ADR 025 — the global home. Signed out: a slim hero with the login CTA.
// Signed in: the personal dashboard (starred projects, open-alert projects,
// invitations received/sent) replaces the old static pillar cards.
const sessionStore = useSessionStore()
const { authenticated } = storeToRefs(sessionStore)
const route = useRoute()
const { t } = useI18n()

useHead({ title: computed(() => t('nav.home')) })

// /auth/login lands here with ?idp=down when the identity provider is
// unreachable — the one 401 story where redirecting can't help, so it gets an
// explicit message instead.
const idpDown = computed(() => route.query.idp === 'down')
</script>

<template>
	<div class="home">
		<Alert
				v-if="idpDown"
				type="error"
				show-icon
				role="alert"
				data-testid="home-idp-down"
				:message="$t('home.idpDown.title')"
				:description="$t('home.idpDown.text')"
		/>

		<section class="hero reveal">
			<p class="hero__eyebrow">
				{{ $t('home.eyebrow') }}
			</p>
			<h1 class="hero__title">
				{{ $t('home.welcome') }}
			</h1>
			<p class="hero__lead">
				{{ $t('home.description') }}
			</p>

			<div class="hero__actions">
				<template v-if="!authenticated">
					<Button
							type="primary"
							size="large"
							data-testid="home-login"
							@click="sessionStore.login(route.fullPath)"
					>
						{{ $t('auth.login') }}
					</Button>
					<span class="hero__hint">{{ $t('home.loginPrompt') }}</span>
				</template>
				<template v-else>
					<NuxtLink to="/projects">
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
				</template>
			</div>
		</section>

		<DashboardHome v-if="authenticated"/>
	</div>
</template>

<style scoped>
.home {
	display: flex;
	flex-direction: column;
	gap: 40px;
}

.hero {
	position: relative;
	padding: 40px 8px 8px;
	max-width: 720px;
}

.hero::before {
	content: '';
	position: absolute;
	/* Confined horizontally (0 left/right) so the blurred bleed can never push
		 past the viewport at the 320px floor; it still reads as an ambient glow. */
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
	font-size: 13px;
	font-weight: 600;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: var(--accent-ink);
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

.hero__hint {
	font-size: 0.95rem;
	opacity: 0.6;
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
