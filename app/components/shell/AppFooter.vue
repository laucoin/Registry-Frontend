<script setup lang="ts">
/**
 * The site footer (contentinfo landmark): legal/privacy/accessibility links +
 * copyright. It sits below the flex:1 main region, so it lands at the bottom of
 * the viewport on short pages and after the content on long ones. Colours are
 * inherited from the shell (AntD tokens via default.vue), so it follows light
 * and dark modes; the hairline and link accent come from the design layer.
 */
</script>

<template>
	<footer
			class="app-footer"
			role="contentinfo"
			data-testid="app-footer"
	>
		<nav :aria-label="$t('footer.label')">
			<ul class="app-footer__links">
				<li>
					<NuxtLink
							to="/legal"
							data-testid="footer-legal"
					>{{ $t('footer.legal') }}
					</NuxtLink>
				</li>
				<li>
					<NuxtLink
							to="/privacy"
							data-testid="footer-privacy"
					>{{ $t('footer.privacy') }}
					</NuxtLink>
				</li>
				<li>
					<NuxtLink
							to="/accessibility"
							data-testid="footer-accessibility"
					>{{ $t('footer.accessibility') }}
					</NuxtLink>
				</li>
			</ul>
		</nav>
		<p class="app-footer__copyright">
			{{ $t('footer.copyright') }}
		</p>
	</footer>
</template>

<style scoped>
.app-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 8px 24px;
	max-width: 1080px;
	margin: 0 auto;
	width: 100%;
	padding: 16px 24px;
	border-top: 1px solid var(--hairline);
	font-size: 0.9rem;
}

.app-footer__links {
	display: flex;
	flex-wrap: wrap;
	gap: 4px 20px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.app-footer__links a {
	color: var(--accent-ink);
	text-decoration: underline;
	text-underline-offset: 2px;
}

.app-footer__copyright {
	margin: 0;
	opacity: 0.72;
}

@media (max-width: 575px) {
	.app-footer {
		padding: 16px 12px;
	}
}
</style>
