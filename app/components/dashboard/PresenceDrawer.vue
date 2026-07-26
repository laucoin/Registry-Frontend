<script setup lang="ts">
import type { ParticipantRowDto, VehicleRowDto } from '@shared/utils/api-types'
import { Drawer, Empty, Input, Space, Tag } from 'ant-design-vue'

/**
 * "View all" from a presence card: the counts made concrete. The card answers
 * *how many* are here; this answers *who*, with the state each one is in —
 * "Out since 40 min", "Not arrived yet" — which is the question the count
 * prompts and which the counters themselves could never settle.
 *
 * It is a READ surface over the same endpoint the domain list uses, filtered
 * client-side: the drawer opens over the dashboard rather than navigating away,
 * so a glance at the detail costs no context.
 */
const props = defineProps<{
	projectId: string
	kind: 'participants' | 'vehicles'
	title: string
}>()

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()

type Row = ParticipantRowDto | VehicleRowDto

const rows = ref<Row[]>([])
const loading = ref(false)
const loadError = ref<unknown>('')
const query = ref('')

const path = computed(() => `/api/v2/projects/${props.projectId}/${props.kind}`)

async function load(): Promise<void> {
	loading.value = true
	loadError.value = ''
	try {
		const page = await $fetch<{ content: Row[] }>(path.value, {
			query: { size: 200, sort: props.kind === 'participants' ? 'lastName' : 'licensePlate' },
		})
		rows.value = page.content ?? []
	} catch (error) {
		loadError.value = error
	} finally {
		loading.value = false
	}
}

watch(open, (isOpen) => {
	if (isOpen) {
		query.value = ''
		load()
	}
}, { immediate: true })

function label(row: Row): string {
	if (props.kind === 'vehicles') {
		const vehicle = row as VehicleRowDto
		return [vehicle.licensePlate, [vehicle.brand, vehicle.model].filter(Boolean).join(' ')]
				.filter(Boolean).join(' · ')
	}
	const participant = row as ParticipantRowDto
	return [participant.firstName, participant.lastName?.toUpperCase()].filter(Boolean).join(' ')
}

/**
 * A guest is on site for an afternoon, not for the event: telling them apart at
 * a glance is the whole reason an operator opens this list during a visit.
 */
function isGuest(row: Row): boolean {
	return props.kind === 'participants' && (row as ParticipantRowDto).type?.value === 'GUEST'
}

/**
 * Filtered in the browser: the whole list is already loaded (capped at 200) and
 * a round trip per keystroke would be slower than the filter it replaces.
 */
const visibleRows = computed(() => {
	const needle = normalizeForSearch(query.value.trim())
	if (!needle) {
		return rows.value
	}
	return rows.value.filter(row => normalizeForSearch(label(row)).includes(needle))
})

const guestCount = computed(() => visibleRows.value.filter(isGuest).length)

function statusColor(row: Row): string {
	switch (row.status?.value) {
		case 'IN':
			return STATUS_COLOR.success
		case 'OUT':
			return STATUS_COLOR.accent
		default:
			return STATUS_COLOR.neutral
	}
}

const { placement: drawerPlacement, height: drawerHeight } = useDrawerPlacement()
</script>

<template>
	<Drawer
			:placement="drawerPlacement"
			:height="drawerHeight"
			:open="open"
			:title="title"
			width="460"
			@close="open = false"
	>
		<Space
				direction="vertical"
				size="middle"
				style="width: 100%"
				:data-testid="`presence-drawer-${kind}`"
		>
			<ApiErrorAlert
					v-if="loadError"
					:error="loadError"
			/>
			<p
					v-else-if="loading"
					aria-live="polite"
			>
				{{ t('movements.details.loading') }}
			</p>
			<template v-else>
				<Input.Search
						v-model:value="query"
						:placeholder="t('common.searchBy', {
							fields: kind === 'participants'
								? [t('participants.form.firstName'), t('participants.form.lastName')].join(', ')
								: [t('vehicles.form.licensePlate'), t('vehicles.form.brand')].join(', '),
						})"
						:aria-label="t('common.search')"
						:data-testid="`presence-drawer-${kind}-search`"
						allow-clear
				/>

				<p
						v-if="guestCount > 0"
						class="presence__guests"
						aria-live="polite"
				>
					{{ t('dashboard.overview.presence.guestCount', { count: guestCount }) }}
				</p>

				<Empty
						v-if="visibleRows.length === 0"
						:image="Empty.PRESENTED_IMAGE_SIMPLE"
						:description="t('common.noResult')"
				/>
				<ul
						v-else
						class="presence"
						:data-testid="`presence-drawer-${kind}-list`"
				>
					<li
							v-for="row in visibleRows"
							:key="row.id"
							class="presence__row"
							:class="{ 'presence__row--guest': isGuest(row) }"
							:data-testid="isGuest(row) ? 'presence-row-guest' : 'presence-row'"
					>
						<EntityAvatar
								:kind="kind === 'vehicles' ? 'vehicle' : 'person'"
								:entity-id="row.id"
								:name="label(row)"
						/>
						<span class="presence__name">
							<SearchHighlight
									:text="label(row)"
									:query="query"
							/>
							<Tag
									v-if="isGuest(row)"
									:color="STATUS_COLOR.accent"
									class="presence__guest-tag"
							>
								{{ t('dashboard.overview.presence.guest') }}
							</Tag>
						</span>
						<!-- The backend already phrases the state with its duration
                 ("Out (since 40 min)"), so the row shows that label rather
                 than recomputing a clock the server owns. -->
						<Tag
								v-if="row.status"
								:color="statusColor(row)"
								class="presence__status"
						>
							{{ row.status.label }}
						</Tag>
					</li>
				</ul>
			</template>
		</Space>
	</Drawer>
</template>

<style scoped>
.presence {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
}

.presence__row {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 0;
	border-top: 1px solid var(--hairline);
}

.presence__row:first-child {
	border-top: none;
}

.presence__row--guest {
	background: color-mix(in srgb, var(--accent) 7%, transparent);
	border-radius: 10px;
	padding-inline: 8px;
}

.presence__name {
	flex: 1 1 auto;
	min-width: 0;
	overflow-wrap: anywhere;
	display: flex;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
}

.presence__guest-tag,
.presence__status {
	flex: none;
}

.presence__guests {
	margin: 0;
	font-size: 0.85rem;
	opacity: 0.75;
}
</style>
