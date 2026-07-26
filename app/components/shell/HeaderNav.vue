<script setup lang="ts">
import { useSessionStore } from '@stores/session'
import { Button, Dropdown, Space } from 'ant-design-vue'
import { storeToRefs } from 'pinia'

/**
 * The header's navigation + controls, rendered BOTH in the desktop bar
 * (horizontal) and inside the mobile menu drawer (vertical). `hooks` gates the
 * data-testid attributes so only ONE instance — the desktop bar — carries them;
 * duplicate testids would break getByTestId's strict matching. The vertical
 * (mobile) instance stays navigable by role/text (Playwright role locators
 * ignore the display:none desktop copy).
 *
 * The two layouts place the same pieces differently. On the desktop bar
 * everything about the signed-in person is folded behind their avatar: those
 * controls used to sit in the bar itself, where they outnumbered the navigation
 * and pushed it left on every viewport. The drawer has room to spread them out
 * instead — "My account" joins the list of pages, the theme and language sink to
 * the foot of the body, and who is signed in plus signing out are pinned below
 * them as the drawer's footer (AppHeader), out of the scroll.
 *
 * Signed out there is no avatar to fold anything into, so the desktop bar
 * carries the theme and language pickers itself — a visitor must be able to read
 * the app in their own language before deciding to sign in, and next to a lone
 * Login button the two controls no longer crowd the navigation.
 */
const props = withDefaults(defineProps<{ vertical?: boolean, hooks?: boolean }>(), { hooks: true })
const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const sessionStore = useSessionStore()
const { authenticated, displayName } = storeToRefs(sessionStore)

const tid = (id: string) => (props.hooks ? id : undefined)

/**
 * The account panel holds form controls (the native theme/language selects), so
 * it is a DISCLOSURE and not a menu: `role="menu"` only admits `menuitem` and
 * friends, and a <select> can never be one — the panel used to claim the role
 * while containing no item at all, which reads to a screen reader as an empty
 * menu. It reports itself open and closed through `aria-expanded` instead,
 * because AntD's trigger stays silent about it on its own.
 */
const accountOpen = ref(false)
const accountTrigger = ref<HTMLButtonElement>()

const PANEL_FOCUSABLE = '.account-menu a, .account-menu button, .account-menu select'

/**
 * The panel is portaled to the end of <body>, so it is neither where the
 * reader's focus is nor where Tab would take them next: opening has to move
 * focus in by hand, and Escape has to hand it back to the avatar it came from.
 *
 * The panel is found in the document rather than through a `ref="…"` on it:
 * AntD rebuilds the vnode it is given for `#overlay`, which drops template refs
 * and vnode lifecycle hooks (its event listeners do survive, which is why
 * Escape and focusout below are bound in the template). Exactly one panel can
 * exist — the vertical instance renders the drawer's flat list, never a
 * dropdown.
 *
 * Re-opening only needs Vue's own flush, but on the FIRST open the panel is
 * still inside AntD's enter transition, where it is already in the DOM yet
 * `focus()` on it is silently a no-op — so the retry a task later is gated on
 * focus having actually LANDED, not on the element having been found.
 */
watch(accountOpen, async (open) => {
	if (!open) {
		return
	}
	await nextTick()
	const focusFirst = (): boolean => {
		const first = document.querySelector<HTMLElement>(PANEL_FOCUSABLE)
		first?.focus()
		return first !== null && document.activeElement === first
	}
	if (!focusFirst()) {
		setTimeout(focusFirst)
	}
})

function closeAccount(restoreFocus: boolean): void {
	accountOpen.value = false
	if (restoreFocus) {
		accountTrigger.value?.focus()
	}
}

/**
 * Tabbing off the last control would otherwise walk into the page behind a
 * panel that is still open — the portal puts nothing after it to close it.
 *
 * The landing spot is read from `document.activeElement` one tick later rather
 * than from `relatedTarget`, which is null both when Tab wraps past the end of
 * the document (the portal is the last thing in <body>, so it usually does) and
 * when the window itself loses focus. `document.hasFocus()` is what tells those
 * two apart: switching app must leave the panel as it was found.
 */
function onAccountFocusOut(event: FocusEvent): void {
	const panel = event.currentTarget as HTMLElement
	setTimeout(() => {
		const landed = document.activeElement
		if (!document.hasFocus() || !landed) {
			return
		}
		if (!panel.contains(landed) && landed !== accountTrigger.value) {
			closeAccount(false)
		}
	})
}

/**
 * Choosing a theme or a language is a setting, not a navigation: the panel
 * stays open so the result is visible where the choice was made. Following the
 * account link or signing out closes it, because the page underneath changes.
 */
watch(() => route.fullPath, () => {
	accountOpen.value = false
})
</script>

<template>
	<div
			class="header-nav"
			:class="{ 'header-nav--vertical': vertical }"
	>
		<nav :aria-label="$t('nav.main')">
			<Space
					:direction="vertical ? 'vertical' : 'horizontal'"
					wrap
			>
				<NuxtLink
						to="/"
						:data-testid="tid('nav-home')"
						@click="emit('navigate')"
				>{{ $t('nav.home') }}
				</NuxtLink>
				<NuxtLink
						v-if="authenticated"
						to="/projects"
						:data-testid="tid('nav-projects')"
						@click="emit('navigate')"
				>{{ $t('nav.projects') }}
				</NuxtLink>
				<NuxtLink
						v-if="sessionStore.hasAuthority('REGISTRY_USER_R')"
						to="/users"
						:data-testid="tid('nav-users')"
						@click="emit('navigate')"
				>{{ $t('nav.users') }}
				</NuxtLink>
				<NuxtLink
						v-if="authenticated && vertical"
						to="/account"
						@click="emit('navigate')"
				>{{ $t('nav.account') }}
				</NuxtLink>
			</Space>
		</nav>

		<div class="header-nav__controls">
			<Dropdown
					v-if="authenticated && !vertical"
					v-model:open="accountOpen"
					:trigger="['click']"
					placement="bottomRight"
			>
				<button
						ref="accountTrigger"
						type="button"
						class="header-nav__avatar"
						aria-haspopup="true"
						:aria-expanded="accountOpen"
						:aria-label="$t('nav.userMenu')"
						:data-testid="tid('header-avatar')"
				>
					<EntityAvatar
							kind="person"
							:name="displayName"
					/>
				</button>
				<template #overlay>
					<div
							class="account-menu"
							:aria-label="$t('nav.userMenu')"
							@keydown.esc="closeAccount(true)"
							@focusout="onAccountFocusOut"
					>
						<div class="account-menu__identity">
							<ShellAccountIdentity :testid="tid('header-user')"/>
						</div>

						<NuxtLink
								to="/account"
								class="account-menu__row"
								:data-testid="tid('nav-account')"
								@click="accountOpen = false"
						>
							{{ $t('nav.account') }}
							<span
									class="account-menu__chevron"
									aria-hidden="true"
							>›</span>
						</NuxtLink>

						<div class="account-menu__section">
							<ShellHeaderPreferences
									labelled
									:hooks="hooks"
							/>
						</div>

						<div class="account-menu__section">
							<Button
									danger
									block
									:data-testid="tid('header-logout')"
									@click="sessionStore.logout()"
							>
								{{ $t('auth.logout') }}
							</Button>
						</div>
					</div>
				</template>
			</Dropdown>

			<ShellHeaderPreferences
					v-if="vertical"
					labelled
					:hooks="hooks"
			/>

			<ShellHeaderPreferences
					v-if="!authenticated && !vertical"
					:hooks="hooks"
			/>

			<Button
					v-if="!authenticated && !vertical"
					type="primary"
					:data-testid="tid('header-login')"
					@click="sessionStore.login(route.fullPath)"
			>
				{{ $t('auth.login') }}
			</Button>
		</div>
	</div>
</template>

<style scoped>
.header-nav {
	display: flex;
	flex: 1;
	align-items: center;
	gap: 12px 24px;
	min-width: 0;
}

.header-nav__controls {
	margin-left: auto;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
}

.header-nav--vertical {
	flex-direction: column;
	align-items: stretch;
	gap: 20px;
}

.header-nav--vertical .header-nav__controls {
	margin-left: 0;
	margin-top: auto;
	flex-direction: column;
	align-items: stretch;
}

.header-nav__avatar {
	display: inline-flex;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: none;
	cursor: pointer;
	line-height: 0;
}

.header-nav__avatar:focus-visible {
	outline: 2px solid var(--focus);
	outline-offset: 2px;
}

.account-menu {
	display: flex;
	flex-direction: column;
	min-width: 248px;
	max-width: 300px;
	border-radius: 12px;
	border: 1px solid var(--hairline);
	background: var(--surface);
	box-shadow: var(--shadow-md);
	overflow: hidden;
}

.account-menu > * + * {
	border-top: 1px solid var(--hairline);
}

.account-menu__identity {
	padding: 12px 14px;
}

.account-menu__row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 14px;
	color: inherit;
	font-weight: 500;
	transition: background var(--dur-1) var(--ease-out);
}

.account-menu__row:hover,
.account-menu__row:focus-visible {
	background: var(--row-hover);
	color: inherit;
}

.account-menu__chevron {
	opacity: 0.45;
}

.account-menu__section {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 12px 14px;
}
</style>
