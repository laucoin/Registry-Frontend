<script setup lang="ts">
import type { SortDirection } from '@/components/ListSearchPanel.vue'
import type { LabelDto, UserRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Dropdown, List, ListItem, Menu, MenuItem, Modal, Select, Space, Tag } from 'ant-design-vue'

/**
 * B2 reference slice — authority-gated administration list on the v2 grammar.
 * The route mirrors the backend authority (REGISTRY_USER_R); the backend keeps
 * enforcing it regardless.
 */
definePageMeta({ middleware: 'auth' })

const { t, d } = useI18n()
const registryMessage = useRegistryMessage()
const sessionStore = useSessionStore()

if (!sessionStore.hasAuthority('REGISTRY_USER_R')) {
	throw createError({ statusCode: 403 })
}

const submittedQ = ref('')
const chosenSort = ref('lastName')
const chosenDirection = ref<SortDirection>('ASC')

/**
 * A text search is ordered by match quality server-side; sending a criterion
 * alongside it would override the relevance the operator is reading. The
 * direction is withheld with it — on its own it orders nothing.
 */
const effectiveSort = computed(() => (submittedQ.value ? undefined : chosenSort.value))

const searchLabels = computed(() => [t('users.firstName'), t('users.lastName'), t('users.email')])
const sortOptions = computed(() => [
	{ value: 'lastName', label: t('sort.lastName') },
	{ value: 'firstName', label: t('sort.firstName') },
	{ value: 'email', label: t('sort.email') },
	{ value: 'role', label: t('sort.role') },
	{ value: 'lastLogin', label: t('sort.lastLogin') },
])

const listQuery = computed(() => ({
	...(effectiveSort.value ? { sort: effectiveSort.value, direction: chosenDirection.value } : {}),
	...(submittedQ.value ? { q: submittedQ.value } : {}),
}))

const { data, items, total, hasMore, error, status, loadingMore, loadMore } = await useLazyList<UserRowDto>({
	fetchPath: () => '/api/v2/users',
	fetchKey: 'users-list',
	query: () => listQuery.value,
})

const lastRefresh = computed(() => {
	if (!data.value?.lastRefresh) {
		return ''
	}
	const refreshedAt = new Date(data.value.lastRefresh)
	return t('common.lastRefresh', {
		date: d(refreshedAt, { day: '2-digit', month: '2-digit', year: 'numeric' }),
		time: d(refreshedAt, { hour: '2-digit', minute: '2-digit' }),
	})
})

function displayName(user: UserRowDto): string {
	return [user.firstName, user.lastName?.toUpperCase()].filter(Boolean).join(' ') || (user.email ?? '')
}

const { isActionEnabled } = useEnabledActions()
const canUpdate = computed(() => sessionStore.hasAuthority('REGISTRY_USER_U'))
const canDelete = computed(() => sessionStore.hasAuthority('REGISTRY_USER_D'))
/**
 * Self-row is action-free; matched by email (the session holds the OIDC email,
 * not the backend user id).
 */
const selfEmail = computed(() => sessionStore.user?.email ?? '')

function isSelf(user: UserRowDto): boolean {
	return !!user.email && user.email === selfEmail.value
}

const reload = () => refreshNuxtData('users-list')
const headers = () => ({ 'x-csrf-token': sessionStore.csrf })

const roles = ref<LabelDto[]>([])
const roleOptions = computed(() => roles.value.map(r => ({ value: r.value, label: r.label })))

async function loadRoles(): Promise<void> {
	if (!roles.value.length) {
		roles.value = await $fetch<LabelDto[]>('/api/v2/users/assignable-roles')
	}
}

const roleModalOpen = ref(false)
const editUserId = ref<string | null>(null)
const editUserName = ref('')
const editRole = ref<string | undefined>(undefined)
const roleError = ref<unknown>('')
const savingRole = ref(false)

async function openEditRole(user: UserRowDto): Promise<void> {
	editUserId.value = user.id
	editUserName.value = displayName(user)
	editRole.value = user.role?.value
	roleError.value = ''
	roleModalOpen.value = true
	await loadRoles()
}

async function submitRole(): Promise<void> {
	if (!editRole.value || !editUserId.value) {
		roleError.value = t('users.form.roleRequired')
		return
	}
	savingRole.value = true
	roleError.value = ''
	try {
		await $fetch(`/api/v2/users/${editUserId.value}`, {
			method: 'PATCH',
			headers: headers(),
			body: { role: editRole.value },
		})
		roleModalOpen.value = false
		await reload()
	} catch (error) {
		roleError.value = error
	} finally {
		savingRole.value = false
	}
}

async function setBlocked(user: UserRowDto, blocked: boolean): Promise<void> {
	try {
		await $fetch(`/api/v2/users/${user.id}/${blocked ? 'block' : 'unblock'}`, { method: 'POST', headers: headers() })
		await reload()
	} catch (error) {
		registryMessage.apiError(error)
	}
}

function confirmDelete(user: UserRowDto): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('users.deleteConfirm', { name: displayName(user) }),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: confirmButtonProps('user-delete-confirm'),
		cancelText: t('common.cancel'),
		onOk: async () => {
			try {
				await $fetch(`/api/v2/users/${user.id}`, { method: 'DELETE', headers: headers() })
				await reload()
			} catch (error) {
				registryMessage.apiError(error)
			}
		},
	})
}

useHead({ title: computed(() => t('users.title')) })
</script>

<template>
	<Space
			direction="vertical"
			size="middle"
			style="width: 100%"
	>
		<ApiErrorAlert
				v-if="error"
				:error="error"
				:message="$t('common.loadError')"
		/>

		<template v-else>
			<header class="users__bar">
				<h1 class="users__title">
					{{ $t('users.title') }}
				</h1>
				<span
						class="users__refresh"
						aria-live="polite"
				>{{ lastRefresh }}</span>
			</header>

			<ListSearchPanel
					v-model:query="submittedQ"
					v-model:sort="chosenSort"
					v-model:direction="chosenDirection"
					:search-labels="searchLabels"
					:sort-options="sortOptions"
					testid="users"
			/>

			<List
					data-testid="users-list"
					:data-source="items"
					:loading="status === 'pending'"
			>
				<template #renderItem="{ item }">
					<ListItem>
						<ListItem.Meta>
							<template #avatar>
								<EntityAvatar
										kind="person"
										:entity-id="item.id"
										:email="item.email"
										:name="displayName(item)"
										testid="user-avatar"
								/>
							</template>
							<template #title>
								<SearchHighlight
										:text="displayName(item)"
										:query="submittedQ"
								/>
							</template>
							<template #description>
								<SearchHighlight
										:text="item.email"
										:query="submittedQ"
								/>
							</template>
						</ListItem.Meta>
						<Space>
							<Tag v-if="item.role">
								{{ item.role.label }}
							</Tag>
							<Tag :color="item.visible === false ? STATUS_COLOR.danger : STATUS_COLOR.success">
								{{ item.visible === false ? $t('users.status.blocked') : $t('users.status.active') }}
							</Tag>
							<Dropdown
									v-if="(canUpdate || canDelete) && !isSelf(item)"
									:trigger="['click']"
							>
								<button
										type="button"
										class="icon-btn"
										data-testid="user-row-actions"
										:aria-label="$t('common.options')"
								>
									<svg
											viewBox="0 0 24 24"
											width="18"
											height="18"
											fill="currentColor"
											aria-hidden="true"
									>
										<circle
												cx="12"
												cy="5"
												r="1.7"
										/>
										<circle
												cx="12"
												cy="12"
												r="1.7"
										/>
										<circle
												cx="12"
												cy="19"
												r="1.7"
										/>
									</svg>
								</button>
								<template #overlay>
									<Menu>
										<MenuItem
												v-if="canUpdate && isActionEnabled('USER_UPDATE')"
												key="role"
												data-testid="user-action-role"
												@click="openEditRole(item)"
										>
											{{ $t('users.editRole') }}
										</MenuItem>
										<MenuItem
												v-if="canUpdate && item.visible !== false && isActionEnabled('USER_BLOCK')"
												key="block"
												data-testid="user-action-block"
												@click="setBlocked(item, true)"
										>
											{{ $t('users.block') }}
										</MenuItem>
										<MenuItem
												v-if="canUpdate && item.visible === false && isActionEnabled('USER_UNBLOCK')"
												key="unblock"
												data-testid="user-action-unblock"
												@click="setBlocked(item, false)"
										>
											{{ $t('users.unblock') }}
										</MenuItem>
										<MenuItem
												v-if="canDelete && isActionEnabled('USER_DELETE')"
												key="delete"
												danger
												data-testid="user-action-delete"
												@click="confirmDelete(item)"
										>
											{{ $t('common.delete') }}
										</MenuItem>
									</Menu>
								</template>
							</Dropdown>
						</Space>
					</ListItem>
				</template>
			</List>

			<Modal
					:open="roleModalOpen"
					:title="$t('users.editRole')"
					:confirm-loading="savingRole"
					data-testid="user-role-modal"
					:ok-text="$t('common.save')"
					:cancel-text="$t('common.cancel')"
					@ok="submitRole"
					@cancel="roleModalOpen = false"
			>
				<p>{{ editUserName }}</p>
				<Select
						v-model:value="editRole"
						data-testid="user-role-select"
						:options="roleOptions"
						:placeholder="$t('users.form.rolePlaceholder')"
						style="width: 100%"
				/>
				<ApiErrorAlert
						v-if="roleError"
						style="margin-top: 12px"
						:error="roleError"
				/>
			</Modal>

			<ListLoadMore
					:has-more="hasMore"
					:loading="loadingMore"
					:loaded="items.length"
					:total="total"
					testid="users"
					@load="loadMore"
			/>
		</template>
	</Space>
</template>

<style scoped>
.users__bar {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 4px 16px;
}

.users__title {
	margin: 0;
	font-size: clamp(1.5rem, 4vw, 1.9rem);
	font-weight: 700;
	letter-spacing: -0.02em;
}

.users__refresh {
	font-size: 0.85rem;
	opacity: 0.72;
}
</style>
