<script setup lang="ts">
// Public static page — no auth middleware. GDPR information notice: controller,
// participant data, data, purposes/legal bases, retention, rights, cookie
// inventory, telemetry. Two distinct regimes are described: account data (the
// publisher is controller) and participant data (the project organiser is
// controller, the publisher a processor — art. 28). All copy lives in i18n
// (fr is authoritative).
const { t } = useI18n()

useHead({ title: computed(() => t('privacy.title')) })

const CONTACT_EMAIL = 'luc.aucoin1998@gmail.com'
const CNIL_URL = 'https://www.cnil.fr'

// Cookie identifiers are technical names, identical in every locale; only their
// purpose/lifetime strings are translated. Production names (ADR 022 — the
// __Host- prefix requires the https deployment).
const cookieRows = [
	{ key: 'session', name: '__Host-registry-session', essential: true },
	{ key: 'idt', name: '__Host-registry-session-idt', essential: true },
	{ key: 'loginFlow', name: '__Host-registry-login-flow', essential: true },
	{ key: 'loginRetry', name: 'registry-login-retry', essential: true },
	{ key: 'preferences', name: 'registry-preferences', essential: false },
	{ key: 'systemDark', name: 'registry-system-dark', essential: false },
] as const
</script>

<template>
	<article class="legal-page reveal">
		<h1>{{ $t('privacy.title') }}</h1>
		<p class="legal-page__updated">
			{{ $t('privacy.updated') }}
		</p>
		<p class="legal-page__intro">
			{{ $t('privacy.intro') }}
		</p>

		<section>
			<h2>{{ $t('privacy.controller.title') }}</h2>
			<p>{{ $t('privacy.controller.text') }}</p>
			<p>
				{{ $t('privacy.controller.contact') }}
				<a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
			</p>
		</section>

		<!-- Participants are recorded BY an organiser and are not users of the
		     app, so the controller/processor split differs from the rest of this
		     notice: the organiser is the controller, the publisher a processor.
		     That is also why the consent duty is stated as theirs. -->
		<section>
			<h2>{{ $t('privacy.participants.title') }}</h2>
			<p>{{ $t('privacy.participants.intro') }}</p>
			<ul>
				<li>{{ $t('privacy.participants.identity') }}</li>
				<li>{{ $t('privacy.participants.presence') }}</li>
				<li>{{ $t('privacy.participants.vehicles') }}</li>
				<li>{{ $t('privacy.participants.communications') }}</li>
			</ul>

			<h3>{{ $t('privacy.participants.roles.title') }}</h3>
			<p>{{ $t('privacy.participants.roles.organiser') }}</p>
			<p>{{ $t('privacy.participants.roles.publisher') }}</p>

			<h3>{{ $t('privacy.participants.consent.title') }}</h3>
			<p>{{ $t('privacy.participants.consent.text') }}</p>
			<p>{{ $t('privacy.participants.consent.noVerification') }}</p>
			<p>{{ $t('privacy.participants.consent.minors') }}</p>

			<h3>{{ $t('privacy.participants.rights.title') }}</h3>
			<p>{{ $t('privacy.participants.rights.text') }}</p>
		</section>

		<section>
			<h2>{{ $t('privacy.data.title') }}</h2>
			<p>{{ $t('privacy.data.intro') }}</p>
			<ul>
				<li>{{ $t('privacy.data.identity') }}</li>
				<li>{{ $t('privacy.data.usage') }}</li>
				<li>{{ $t('privacy.data.telemetry') }}</li>
			</ul>
		</section>

		<section>
			<h2>{{ $t('privacy.purposes.title') }}</h2>
			<p>{{ $t('privacy.purposes.intro') }}</p>
			<ul>
				<li>{{ $t('privacy.purposes.service') }}</li>
				<li>{{ $t('privacy.purposes.security') }}</li>
				<li>{{ $t('privacy.purposes.telemetry') }}</li>
				<li>{{ $t('privacy.purposes.preferences') }}</li>
			</ul>
		</section>

		<section>
			<h2>{{ $t('privacy.retention.title') }}</h2>
			<p>{{ $t('privacy.retention.text') }}</p>
		</section>

		<section>
			<h2>{{ $t('privacy.rights.title') }}</h2>
			<p>{{ $t('privacy.rights.intro') }}</p>
			<ul>
				<li>{{ $t('privacy.rights.access') }}</li>
				<li>{{ $t('privacy.rights.rectification') }}</li>
				<li>{{ $t('privacy.rights.erasure') }}</li>
				<li>{{ $t('privacy.rights.restriction') }}</li>
				<li>{{ $t('privacy.rights.objection') }}</li>
				<li>{{ $t('privacy.rights.portability') }}</li>
			</ul>
			<p>
				{{ $t('privacy.rights.exercise') }}
				<a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
			</p>
			<p>
				{{ $t('privacy.rights.complaint') }}
				<a
						:href="CNIL_URL"
						rel="noopener"
				>www.cnil.fr</a>
			</p>
		</section>

		<section>
			<h2>{{ $t('privacy.cookies.title') }}</h2>
			<p>{{ $t('privacy.cookies.intro') }}</p>
			<p>{{ $t('privacy.cookies.noBanner') }}</p>
			<!-- The 4-column table is wider than a 320px viewport: it scrolls in
			     its own container so the page itself never overflows. -->
			<div
					class="legal-page__table-scroll"
					tabindex="0"
					role="region"
					:aria-label="$t('privacy.cookies.tableCaption')"
			>
				<table class="legal-page__table">
					<caption class="sr-only">
						{{ $t('privacy.cookies.tableCaption') }}
					</caption>
					<thead>
					<tr>
						<th scope="col">
							{{ $t('privacy.cookies.colName') }}
						</th>
						<th scope="col">
							{{ $t('privacy.cookies.colPurpose') }}
						</th>
						<th scope="col">
							{{ $t('privacy.cookies.colDuration') }}
						</th>
						<th scope="col">
							{{ $t('privacy.cookies.colType') }}
						</th>
					</tr>
					</thead>
					<tbody>
					<tr
							v-for="row in cookieRows"
							:key="row.key"
					>
						<th scope="row">
							<code>{{ row.name }}</code>
						</th>
						<td>{{ $t(`privacy.cookies.rows.${row.key}.purpose`) }}</td>
						<td>{{ $t(`privacy.cookies.rows.${row.key}.duration`) }}</td>
						<td>{{ row.essential ? $t('privacy.cookies.typeEssential') : $t('privacy.cookies.typeFunctional') }}</td>
					</tr>
					</tbody>
				</table>
			</div>
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

.legal-page__updated {
	margin: 0 0 4px;
	font-size: 0.9rem;
	opacity: 0.72;
}

.legal-page__intro {
	margin: 0 0 8px;
	opacity: 0.72;
}

.legal-page h2 {
	margin: 28px 0 8px;
	font-size: 1.15rem;
}

/* The participants section is the only one deep enough to need a third level
   (roles / consent / rights). Sized between h2 and body so the hierarchy reads
   without a heading level being skipped. */
.legal-page h3 {
	margin: 18px 0 4px;
	font-size: 1rem;
	opacity: 0.9;
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

.legal-page__table-scroll {
	overflow-x: auto;
	margin: 12px 0;
}

.legal-page__table {
	border-collapse: collapse;
	width: 100%;
	font-size: 0.92rem;
}

.legal-page__table th,
.legal-page__table td {
	border: 1px solid var(--hairline);
	padding: 8px 10px;
	text-align: left;
	vertical-align: top;
}

.legal-page__table thead th {
	background: var(--row-hover);
}

.legal-page__table code {
	font-size: 0.85em;
	word-break: break-all;
}
</style>
