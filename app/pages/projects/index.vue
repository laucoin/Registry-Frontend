<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import type { PageDto, ProjectRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import {
	Alert,
	Button,
	Collapse,
	CollapsePanel,
	Dropdown,
	Input,
	Menu,
	MenuItem,
	Modal,
	Pagination,
	Spin,
	Tag,
} from 'ant-design-vue'

// B2 reference slice — list on the API v2 grammar via the BFF proxy:
// keyed useFetch (dedup), server-driven paging + q search, refresh after
// mutations. Empty state mirrors the first-project welcome journey.
definePageMeta({ middleware: 'auth' })

const { t, d } = useI18n()
const sessionStore = useSessionStore()

// Favorite (star) toggle — resolved against the caller's own project profiles
// (favorites live on the profile, not the project). Only members see a star.
const { isFavorite, profileForProject, toggleFavorite } = useUserProfiles()

const page = ref(0)
const q = ref('')
const submittedQ = ref('')

const { data, error, refresh, status } = await useFetch<PageDto<ProjectRowDto>>('/api/v2/projects', {
	key: 'projects-list',
	query: computed(() => ({
		page: page.value,
		size: 10,
		sort: 'name',
		...(submittedQ.value ? { q: submittedQ.value } : {}),
	})),
})

const isWelcome = computed(() =>
		status.value === 'success' && data.value?.totalElements === 0 && submittedQ.value === '',
)

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

// Enable/disable (Phase H) — a project can be disabled to revoke all member
// access, then re-enabled. Backed by POST /{id}/disable|enable, gated on the
// per-project update authority. Disabled projects stay in the list (with a tag)
// so they can be re-enabled.
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
		okButtonProps: { 'data-testid': 'project-disable-confirm' },
		cancelText: t('common.cancel'),
		onOk: () => setAccess(project, false),
	})
}

function confirmDelete(project: ProjectRowDto): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('projects.deleteConfirm', { name: project.name ?? '' }),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: { 'data-testid': 'project-delete-confirm' },
		cancelText: t('common.cancel'),
		onOk: async () => {
			await $fetch(`/api/v2/projects/${project.id}`, {
				method: 'DELETE',
				headers: { 'x-csrf-token': sessionStore.csrf },
			})
			await refresh()
		},
	})
}

useHead({ title: computed(() => t('projects.title')) })
</script>

<template>
	<div class="projects">
		<Alert
				v-if="error"
				type="error"
				show-icon
				role="alert"
				:message="$t('common.loadError')"
				:description="apiErrorMessage(error)"
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
				<!-- No + icon here: this is the hero CTA, not an inline add
             button — and the icon pushes its min-width past 320px. -->
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

			<Collapse
					:bordered="false"
					class="projects__search"
			>
				<CollapsePanel
						key="search"
						:header="$t('common.searchFilter')"
				>
					<Input.Search
							v-model:value="q"
							data-testid="projects-search"
							:placeholder="$t('common.searchPlaceholder')"
							:aria-label="$t('common.searchFilter')"
							allow-clear
							@search="page = 0; submittedQ = q"
					/>
				</CollapsePanel>
			</Collapse>

			<Spin :spinning="status === 'pending'">
				<ul class="project-grid">
					<li
							v-for="(item, index) in data?.content ?? []"
							:key="item.id"
							class="project-card lift reveal"
							:class="{ 'project-card--disabled': item.visible === false }"
							:style="{ animationDelay: `${index * 0.05}s` }"
							:data-testid="item.visible === false ? 'project-card-disabled' : undefined"
					>
						<div class="project-card__head">
							<NuxtLink
									:to="`/projects/${item.id}`"
									class="project-card__title"
									data-testid="project-row-link"
							>{{ item.name }}
							</NuxtLink>
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
													v-if="isActionEnabled('PROJECT_UPDATE')"
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
					</li>
				</ul>
			</Spin>

			<Pagination
					v-if="(data?.totalElements ?? 0) > 10"
					:current="page + 1"
					:total="data?.totalElements ?? 0"
					:page-size="10"
					class="projects__pagination"
					@change="(nextPage: number) => page = nextPage - 1"
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

.projects__search :deep(.ant-collapse-header) {
	padding-left: 0 !important;
}

.project-grid {
	list-style: none;
	margin: 0;
	padding: 0;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 16px;
}

.project-card {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 20px;
	border-radius: 18px;
	border: 1px solid var(--hairline);
	background: var(--surface);
	box-shadow: var(--shadow-sm);
}

/* Disabled projects read as inert: dimmed + desaturated, alongside the tag
   (never colour/opacity alone — ADR 015). Kept clickable so an administrator
   can still open it to re-enable. Opacity stays ≥ .55 for the AA gate. */
.project-card--disabled {
	opacity: 0.55;
	filter: grayscale(0.35);
}

.project-card__head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
}

.project-card__title {
	font-size: 1.12rem;
	font-weight: 600;
	letter-spacing: -0.01em;
	line-height: 1.3;
	overflow-wrap: anywhere;
	color: inherit;
	transition: color var(--dur-1) var(--ease-out);
}

.project-card:hover .project-card__title {
	color: var(--focus);
}

/* Stretched link — the whole card navigates, while the menu (higher layer)
   stays independently clickable. */
.project-card__title::after {
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

.project-card__menu,
.project-card__controls,
.project-card__tags {
	position: relative;
	z-index: 2;
}

.project-card__window {
	margin: 0;
	font-size: 0.9rem;
	opacity: 0.62;
}

.project-card__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: auto;
}

.projects__pagination {
	margin-top: 4px;
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
