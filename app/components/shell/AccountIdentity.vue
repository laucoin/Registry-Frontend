<script setup lang="ts">
import { useSessionStore } from '@stores/session'
import { storeToRefs } from 'pinia'

/**
 * Who is signed in — the avatar, the name, and the role label under it.
 *
 * Shared by the two surfaces that name the reader, the desktop account panel
 * and the drawer footer, so the pair cannot drift apart. `testid` is a prop
 * rather than a fixed attribute because only ONE rendered instance may carry
 * it: duplicate testids break getByTestId's strict matching.
 */
defineProps<{ testid?: string }>()

const sessionStore = useSessionStore()
const { displayName } = storeToRefs(sessionStore)
</script>

<template>
	<div class="account-identity">
		<EntityAvatar
				kind="person"
				:name="displayName"
		/>
		<span class="account-identity__who">
			<span
					class="account-identity__name"
					:data-testid="testid"
			>{{ displayName }}</span>
			<span
					v-if="sessionStore.role"
					class="account-identity__role"
			>{{ sessionStore.role.label }}</span>
		</span>
	</div>
</template>

<style scoped>
.account-identity {
	display: flex;
	align-items: center;
	gap: 10px;
	min-width: 0;
}

.account-identity__who {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.account-identity__name {
	font-weight: 600;
	line-height: 1.3;
	overflow-wrap: anywhere;
}

.account-identity__role {
	font-size: 0.8rem;
	line-height: 1.3;
	color: color-mix(in srgb, var(--ink) 62%, transparent);
	overflow-wrap: anywhere;
}
</style>
