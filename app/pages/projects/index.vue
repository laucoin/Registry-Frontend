<script setup lang="ts">
import type { SortDirection } from '@/components/ListSearchPanel.vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { ProjectRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Button, Dropdown, Menu, MenuItem, Modal, Spin, Tag } from 'ant-design-vue'

/**
 * B2 reference slice — list on the API v2 grammar via the BFF proxy:
 * keyed useFetch (dedup), a window that grows on scroll + q search, refresh
 * after mutations. Empty state mirrors the first-project welcome journey.
 */
definePageMeta({ middleware: 'auth' })

const { t, d } = useI18n()
const sessionStore = useSessionStore()

/**
 * Favorite (star) toggle — resolved against the caller's own project profiles
 * (favorites live on the profile, not the project). Only members see a star.
 */
const { isFavorite, profileForProject, toggleFavorite } = useUserProfiles()

const submittedQ = ref('')
const chosenSort = ref('name')
const chosenDirection = ref<SortDirection>('ASC')

/**
 * A text search is ordered by match quality server-side; sending a criterion
 * alongside it would override the relevance the operator is reading. The
 * direction is withheld with it — on its own it orders nothing.
 */
const effectiveSort = computed(() => (submittedQ.value ? undefined : chosenSort.value))

/**
 * Projects read as a mosaic of cards rather than rows, so a chunk is sized to
 * fill the grid a couple of times over, not to match the list default.
 */
const PROJECTS_PER_CHUNK = 10

const searchLabels = computed(() => [t('projects.form.name')])
const sortOptions = computed(() => [
	{ value: 'name', label: t('sort.name') },
	{ value: 'beginDate', label: t('sort.beginDate') },
	{ value: 'endDate', label: t('sort.endDate') },
])

const listQuery = computed(() => ({
	...(effectiveSort.value ? { sort: effectiveSort.value, direction: chosenDirection.value } : {}),
	...(submittedQ.value ? { q: submittedQ.value } : {}),
}))

const { data, items, total, hasMore, error, refresh, status, loadingMore, loadMore }
	= await useLazyList<ProjectRowDto>({
		fetchPath: () => '/api/v2/projects',
		fetchKey: 'projects-list',
		query: () => listQuery.value,
		pageSize: PROJECTS_PER_CHUNK,
	})

const isWelcome = computed(() => status.value === 'success' && total.value === 0 && submittedQ.value === '')

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

function formatWindow(project: ProjectRowDto): string {
	const begin = project.begin?.date
	const end = project.end?.date
	if (!begin && !end) {
		return ''
	}
	return [begin ? `${t('projects.from')} ${begin}` : '', end ? `${t('projects.to')} ${end}` : '']
			.filter(Boolean)
			.join(' ')
}

/**
 * Enable/disable (Phase H) — a project can be disabled to revoke all member
 * access, then re-enabled. Backed by POST /{id}/disable|enable, gated on the
 * per-project update authority. Disabled projects stay in the list (with a tag)
 * so they can be re-enabled.
 *
 * A disabled project cannot be edited — the backend refuses the update — so the
 * row menu drops Edit while it is off, leaving only the actions that still lead
 * somewhere: re-enabling it, or deleting it. Offering an Edit that can only end
 * in a rejected save is a worse answer than not offering it.
 */
const { isActionEnabled } = useEnabledActions()

function canManageAccess(project: ProjectRowDto): boolean {
	return sessionStore.hasProjectAuthority(project.id, 'REGISTRY_PROJECT_U')
}

async function setAccess(project: ProjectRowDto, enabled: boolean): Promise<void> {
	await $fetch(`/api/v2/projects/${project.id}/${enabled ? 'enable' : 'disable'}`, {
		method: 'POST',
		headers: { 'x-csrf-token': sessionStore.csrf },
	})
	await refresh()
}

function confirmDisable(project: ProjectRowDto): void {
	Modal.confirm({
		title: t('projects.disable'),
		content: t('projects.disableConfirm', { name: project.name ?? '' }),
		okText: t('projects.disable'),
		okType: 'danger',
		okButtonProps: confirmButtonProps('project-disable-confirm'),
		cancelText: t('common.cancel'),
		onOk: () => setAccess(project, false),
	})
}

/**
 * Deleting a project CASCADES through everything it holds, so it gets the long
 * dialog rather than a plain confirm: it warns about the duration up front and
 * names each part of the work while the single API call runs. The rejection a
 * coordinator gets (no PROJECT_DELETE) is shown inside that dialog, which is
 * why the call re-throws instead of swallowing it.
 */
const deleteDialogOpen = ref(false)
const deleteTarget = ref<ProjectRowDto | null>(null)
const deleteDialog = useTemplateRef('deleteDialog')

const deleteSteps = computed(() => [
	t('common.longDelete.movements'),
	t('common.longDelete.communications'),
	t('common.longDelete.alerts'),
	t('common.longDelete.participants'),
	t('common.longDelete.groups'),
	t('common.longDelete.vehicles'),
	t('common.longDelete.activities'),
	t('common.longDelete.members'),
	t('common.longDelete.finishing'),
])

function confirmDelete(project: ProjectRowDto): void {
	deleteTarget.value = project
	deleteDialogOpen.value = true
}

async function runDelete(): Promise<void> {
	const project = deleteTarget.value
	if (!project) {
		return
	}
	await deleteDialog.value?.run(async () => {
		await $fetch(`/api/v2/projects/${project.id}`, {
			method: 'DELETE',
			headers: { 'x-csrf-token': sessionStore.csrf },
		})
		await refresh()
	})
}

useHead({ title: computed(() => t('projects.title')) })
</script>

<template>
	<div class="projects">
		<ApiErrorAlert
				v-if="error"
				:error="error"
				:message="$t('common.loadError')"
		/>

		<section
				v-else-if="isWelcome"
				class="welcome reveal"
		>
			<span
					class="welcome__glyph"
					aria-hidden="true"
			>
				<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
				>
					<path d="M12 3 3 8l9 5 9-5-9-5Z"/>
					<path d="m3 13 9 5 9-5"/>
					<path
							d="m3 18 9 5 9-5"
							opacity="0.5"
					/>
				</svg>
			</span>
			<h2 class="welcome__title">
				{{ $t('projects.welcomeTitle') }}
			</h2>
			<p class="welcome__text">
				{{ $t('projects.welcomeText') }}
			</p>
			<NuxtLink to="/projects/create">
				<Button
						type="primary"
						size="large"
						data-testid="projects-create-first"
				>{{ $t('projects.createFirst') }}
				</Button>
			</NuxtLink>
		</section>

		<template v-else>
			<header class="projects__bar">
				<div class="projects__heading">
					<h1 class="projects__title">
						{{ $t('projects.title') }}
					</h1>
					<span
							class="projects__refresh"
							aria-live="polite"
					>{{ lastRefresh }}</span>
				</div>
				<NuxtLink to="/projects/create">
					<Button
							type="primary"
							data-testid="projects-create"
					>
						<template #icon>
							<PlusOutlined/>
						</template>
						{{ $t('common.create') }}
					</Button>
				</NuxtLink>
			</header>

			<ListSearchPanel
					v-model:query="submittedQ"
					v-model:sort="chosenSort"
					v-model:direction="chosenDirection"
					:search-labels="searchLabels"
					:sort-options="sortOptions"
					testid="projects"
			/>

			<Spin :spinning="status === 'pending'">
				<ul class="project-grid">
					<li
							v-for="(item, index) in items"
							:key="item.id"
							class="project-card reveal"
							:class="{ 'project-card--disabled': item.visible === false }"
							:style="{ animationDelay: `${index * 0.05}s` }"
							:data-testid="item.visible === false ? 'project-card-disabled' : undefined"
					>
						<div class="project-card__head">
							<EntityAvatar
									kind="project"
									:entity-id="item.id"
									:name="item.name"
									class="project-card__avatar"
									testid="project-avatar"
							/>
							<!-- Two branches rather than one <component :is>:
							     resolveComponent('NuxtLink') fell back to its own name,
							     so the title rendered as an inert <nuxtlink> element and
							     neither it nor the stretched link navigated. -->
							<NuxtLink
									v-if="item.visible !== false"
									:to="`/projects/${item.id}`"
									class="project-card__title"
									data-testid="project-row-link"
							>
								<SearchHighlight
										:text="item.name"
										:query="submittedQ"
								/>
							</NuxtLink>
							<span
									v-else
									class="project-card__title"
									data-testid="project-row-link"
							>
								<SearchHighlight
										:text="item.name"
										:query="submittedQ"
								/>
							</span>
							<div class="project-card__controls">
								<DashboardFavoriteStar
										v-if="profileForProject(item.id)"
										:active="isFavorite(item.id)"
										testid="project-favorite-star"
										@toggle="toggleFavorite(item.id)"
								/>
								<Dropdown
										:trigger="['click']"
										class="project-card__menu"
								>
									<button
											type="button"
											class="icon-btn"
											data-testid="project-row-actions"
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
													v-if="item.visible !== false && isActionEnabled('PROJECT_UPDATE')"
													key="edit"
													data-testid="project-action-edit"
													@click="navigateTo(`/projects/edit/${item.id}`)"
											>
												{{ $t('common.edit') }}
											</MenuItem>
											<MenuItem
													v-if="canManageAccess(item) && item.visible === false && isActionEnabled('PROJECT_ENABLE')"
													key="enable"
													data-testid="project-action-enable"
													@click="setAccess(item, true)"
											>
												{{ $t('projects.enable') }}
											</MenuItem>
											<MenuItem
													v-else-if="canManageAccess(item) && item.visible !== false && isActionEnabled('PROJECT_DISABLE')"
													key="disable"
													data-testid="project-action-disable"
													@click="confirmDisable(item)"
											>
												{{ $t('projects.disable') }}
											</MenuItem>
											<MenuItem
													v-if="isActionEnabled('PROJECT_DELETE')"
													key="delete"
													danger
													data-testid="project-action-delete"
													@click="confirmDelete(item)"
											>
												{{ $t('common.delete') }}
											</MenuItem>
										</Menu>
									</template>
								</Dropdown>
							</div>
						</div>

						<p
								v-if="formatWindow(item)"
								class="project-card__window"
						>
							{{ formatWindow(item) }}
						</p>

						<p
								v-if="item.visible === false"
								class="project-card__hint"
						>
							{{ $t('projects.disabledHint') }}
						</p>

						<div class="project-card__footer">
							<div class="project-card__tags">
								<Tag
										v-for="option in item.options ?? []"
										:key="option.value"
								>
									{{ option.label }}
								</Tag>
								<Tag
										v-if="item.status"
										:color="STATUS_COLOR.info"
								>
									{{ item.status.label }}
								</Tag>
								<Tag
										v-if="item.visible === false"
										:color="STATUS_COLOR.neutral"
										data-testid="project-disabled-tag"
								>
									{{ $t('projects.disabled') }}
								</Tag>
							</div>
						</div>
					</li>
				</ul>
			</Spin>

			<LongDeleteDialog
					ref="deleteDialog"
					v-model:open="deleteDialogOpen"
					:title="$t('common.delete')"
					:confirm-text="$t('projects.deleteConfirm', { name: deleteTarget?.name ?? '' })"
					:steps="deleteSteps"
					testid="project-delete-dialog"
					@confirm="runDelete"
			/>

			<ListLoadMore
					:has-more="hasMore"
					:loading="loadingMore"
					:loaded="items.length"
					:total="total"
					testid="projects"
					@load="loadMore"
			/>
		</template>
	</div>
</template>

<style scoped>
.projects {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.projects__bar {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 12px 16px;
}

.projects__title {
	margin: 0;
	font-size: clamp(1.5rem, 4vw, 1.9rem);
	font-weight: 700;
	letter-spacing: -0.02em;
}

.projects__refresh {
	display: block;
	margin-top: 4px;
	font-size: 0.85rem;
	opacity: 0.72;
}

.project-grid {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.project-card {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px 18px;
	border-radius: 14px;
	border: 1px solid var(--hairline);
	background: var(--surface);
	box-shadow: var(--shadow-sm);
	transition: box-shadow var(--dur-2) var(--ease-out),
	transform var(--dur-2) var(--ease-out),
	border-color var(--dur-2) var(--ease-out);
}

.project-card:not(.project-card--disabled):hover {
	transform: translateY(-2px);
	box-shadow: var(--shadow-md);
	border-color: color-mix(in srgb, var(--accent) 28%, var(--hairline));
}

/* A disabled project is INERT, not merely faded: it cannot be opened (its
   pages render nothing an operator can use), so the card drops its hover
   lift, its title stops being a link and the cursor says so. The tag and the
   hint carry the meaning — never opacity alone — and the dimming
   stays mild enough to keep AA. The row menu remains live so an administrator
   can re-enable it from here.

   The dimming is applied to the card's INFORMATION, never to the card itself:
   `opacity` on the card would open a group no descendant can be brighter than,
   which took the favourite star (0.55 of its own) down to a third of full
   strength and greyed the gold out of an already-starred one. The controls are
   the half of the card that still answers a click, so they keep full contrast. */
.project-card--disabled {
	cursor: not-allowed;
}

.project-card--disabled .project-card__avatar,
.project-card--disabled .project-card__title,
.project-card--disabled .project-card__window,
.project-card--disabled .project-card__hint,
.project-card--disabled .project-card__tags {
	opacity: 0.62;
	filter: grayscale(0.4);
}

.project-card--disabled .project-card__title {
	cursor: not-allowed;
}

.project-card__hint {
	margin: 0;
	font-size: 0.85rem;
	opacity: 0.75;
}

.project-card__head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
}

.project-card__title {
	flex: 1;
	min-width: 0;
	font-size: 1.12rem;
	font-weight: 600;
	letter-spacing: -0.01em;
	line-height: 1.3;
	overflow-wrap: anywhere;
	color: inherit;
	transition: color var(--dur-1) var(--ease-out);
}

.project-card:not(.project-card--disabled):hover .project-card__title {
	color: var(--focus);
}

/* Stretched link — the whole card navigates, while the menu (higher layer)
   stays independently clickable. A disabled card has no link to stretch. */
.project-card:not(.project-card--disabled) .project-card__title::after {
	content: '';
	position: absolute;
	inset: 0;
	z-index: 1;
	border-radius: inherit;
}

.project-card__controls {
	display: flex;
	align-items: center;
	gap: 2px;
}

/* Everything that answers a click of its own has to sit above the stretched
   link, the avatar included — its double-click copies the technical id. */
.project-card__menu,
.project-card__controls,
.project-card__avatar,
.project-card__tags {
	position: relative;
	z-index: 2;
}

.project-card__window {
	margin: 0;
	font-size: 0.9rem;
	opacity: 0.62;
}

.project-card__footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 8px 12px;
	margin-top: auto;
}

.project-card__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.welcome {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 8px;
	padding: 56px 24px;
	border-radius: 22px;
	border: 1px solid var(--hairline);
	background: var(--surface);
	box-shadow: var(--shadow-sm);
	max-width: 560px;
	margin: 24px auto;
}

.welcome__glyph {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 60px;
	height: 60px;
	border-radius: 18px;
	color: var(--focus);
	background: color-mix(in srgb, var(--focus) 12%, transparent);
	margin-bottom: 8px;
}

.welcome__glyph svg {
	width: 30px;
	height: 30px;
}

.welcome__title {
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
	letter-spacing: -0.01em;
}

.welcome__text {
	margin: 0 0 12px;
	font-size: 1rem;
	line-height: 1.55;
	opacity: 0.66;
}
</style>
