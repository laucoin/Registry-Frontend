<script setup lang="ts">
import type { OpenAlertProjectDto, PageDto, PartialUserDto, ProjectProfileRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Button, Tag } from 'ant-design-vue'

// ADR 025 — the authenticated global home: a personal launchpad. Four panels,
// each lazily loading its own slice through the BFF: starred projects (full
// list), projects with open alerts, invitations received (actionable inline)
// and invitations sent (recent window, resolved server-side).
const sessionStore = useSessionStore()
const { t } = useI18n()
const registryMessage = useRegistryMessage()

const headers = () => ({ 'x-csrf-token': sessionStore.csrf })

function projectName(profile: ProjectProfileRowDto): string {
	return profile.project?.name ?? ''
}

function userName(user?: PartialUserDto | null): string {
	if (!user) {
		return ''
	}
	return [user.firstName, user.lastName?.toUpperCase()].filter(Boolean).join(' ') || (user.email ?? '')
}

async function unfavorite(profileId: string): Promise<void> {
	try {
		await $fetch(`/api/v2/users/profiles/${profileId}/favorite`, { method: 'POST', headers: headers() })
		await Promise.all([refreshNuxtData('home-favorites'), refreshNuxtData('user-profiles')])
	} catch (error) {
		registryMessage.error(apiErrorMessage(error, t))
	}
}

// Accept/reject an invitation without leaving the dashboard. Accepting grants
// new project-scoped authorities, so the session profile is re-derived; both
// invitation panels and the favorites/projects lists are reloaded.
const responding = ref<string | null>(null)

async function respond(profileId: string, action: 'accept' | 'reject'): Promise<void> {
	responding.value = `${profileId}:${action}`
	try {
		await $fetch(`/api/v2/users/profiles/${profileId}/${action}`, { method: 'POST', headers: headers() })
		if (action === 'accept') {
			await sessionStore.refreshProfile()
		}
		await Promise.all([
			refreshNuxtData('home-invites-received'),
			refreshNuxtData('home-favorites'),
			refreshNuxtData('home-open-alerts'),
			refreshNuxtData('user-profiles'),
			refreshNuxtData('projects-list'),
		])
	} catch (error) {
		registryMessage.error(apiErrorMessage(error, t))
	} finally {
		responding.value = null
	}
}
</script>

<template>
	<section class="dashboard">
		<div class="dashboard__grid">
			<DashboardPanel
					:title="t('dashboard.home.favorites.title')"
					fetch-path="/api/v2/users/profiles?favorite=true&size=100&sort=name"
					fetch-key="home-favorites"
					testid="dashboard-favorites"
			>
				<template #default="{ data }: { data: PageDto<ProjectProfileRowDto> | null }">
					<DashboardEmptyHint
							v-if="!data?.content?.length"
							:text="t('dashboard.home.favorites.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="profile in data.content"
								:key="profile.id"
								class="dash-row"
						>
							<NuxtLink
									:to="`/projects/${profile.project?.id}`"
									class="dash-row__link"
									data-testid="dashboard-favorite-link"
							>
								<span class="dash-row__title">{{ projectName(profile) }}</span>
								<Tag v-if="profile.role">
									{{ profile.role.label }}
								</Tag>
							</NuxtLink>
							<DashboardFavoriteStar
									:active="true"
									testid="dashboard-favorite-star"
									@toggle="unfavorite(profile.id)"
							/>
						</li>
					</ul>
				</template>
			</DashboardPanel>

			<DashboardPanel
					:title="t('dashboard.home.openAlerts.title')"
					fetch-path="/api/v2/projects/open-alerts"
					fetch-key="home-open-alerts"
					testid="dashboard-open-alerts"
			>
				<template #default="{ data }: { data: OpenAlertProjectDto[] | null }">
					<DashboardEmptyHint
							v-if="!data?.length"
							:text="t('dashboard.home.openAlerts.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="project in data"
								:key="project.id"
								class="dash-row"
						>
							<NuxtLink
									:to="`/projects/${project.id}/alerts`"
									class="dash-row__link"
									data-testid="dashboard-open-alert-link"
							>
								<span class="dash-row__title">{{ project.name }}</span>
							</NuxtLink>
							<Tag :color="STATUS_COLOR.danger">
								{{ t('dashboard.home.openAlerts.count', { count: project.openAlertCount }) }}
							</Tag>
						</li>
					</ul>
				</template>
			</DashboardPanel>

			<DashboardPanel
					:title="t('dashboard.home.invitationsReceived.title')"
					fetch-path="/api/v2/users/profiles?status=INVITED&size=100"
					fetch-key="home-invites-received"
					testid="dashboard-invites-received"
			>
				<template #default="{ data }: { data: PageDto<ProjectProfileRowDto> | null }">
					<DashboardEmptyHint
							v-if="!data?.content?.length"
							:text="t('dashboard.home.invitationsReceived.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="profile in data.content"
								:key="profile.id"
								class="dash-row dash-row--stack"
						>
							<span class="dash-row__title">{{ projectName(profile) }}</span>
							<div class="dash-row__actions">
								<Button
										size="small"
										type="primary"
										:loading="responding === `${profile.id}:accept`"
										data-testid="dashboard-invite-accept"
										@click="respond(profile.id, 'accept')"
								>
									{{ t('dashboard.home.invitationsReceived.accept') }}
								</Button>
								<Button
										size="small"
										danger
										:loading="responding === `${profile.id}:reject`"
										data-testid="dashboard-invite-reject"
										@click="respond(profile.id, 'reject')"
								>
									{{ t('dashboard.home.invitationsReceived.reject') }}
								</Button>
							</div>
						</li>
					</ul>
				</template>
			</DashboardPanel>

			<DashboardPanel
					:title="t('dashboard.home.invitationsSent.title')"
					fetch-path="/api/v2/users/profiles/sent?size=100"
					fetch-key="home-invites-sent"
					testid="dashboard-invites-sent"
			>
				<template #default="{ data }: { data: PageDto<ProjectProfileRowDto> | null }">
					<DashboardEmptyHint
							v-if="!data?.content?.length"
							:text="t('dashboard.home.invitationsSent.empty')"
					/>
					<ul
							v-else
							class="dash-list"
					>
						<li
								v-for="profile in data.content"
								:key="profile.id"
								class="dash-row dash-row--stack"
						>
							<span class="dash-row__title">{{ userName(profile.user) }}</span>
							<div class="dash-row__meta">
								<span class="dash-row__sub">{{ projectName(profile) }}</span>
								<Tag
										v-if="profile.status"
										:color="STATUS_COLOR.info"
								>
									{{ profile.status.label }}
								</Tag>
							</div>
						</li>
					</ul>
				</template>
			</DashboardPanel>
		</div>
	</section>
</template>

<style scoped>
.dashboard__grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 18px;
}

.dash-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
}

.dash-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 0;
	border-top: 1px solid var(--hairline);
}

.dash-row:first-child {
	border-top: none;
}

.dash-row--stack {
	flex-wrap: wrap;
}

.dash-row__link {
	display: flex;
	align-items: center;
	gap: 10px;
	min-width: 0;
	color: inherit;
	font-weight: 500;
	text-decoration: none;
}

.dash-row__link:hover .dash-row__title {
	color: var(--focus);
}

.dash-row__title {
	overflow-wrap: anywhere;
	transition: color var(--dur-1) var(--ease-out);
}

.dash-row__meta {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.dash-row__sub {
	font-size: 0.9rem;
	opacity: 0.68;
}

.dash-row__actions {
	display: flex;
	gap: 8px;
}
</style>
