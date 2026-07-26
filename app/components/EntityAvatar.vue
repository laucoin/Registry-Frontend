<script setup lang="ts">
import { Avatar } from 'ant-design-vue'

/**
 * The chip that opens every list row. Two jobs:
 *
 *  - give each domain a recognisable mark, so a row is identifiable before its
 *    text is read. People and projects get their initials — the two kinds whose
 *    rows the reader tells apart by name; the domains listed inside a single
 *    project (a group, a vehicle, an activity, an alert) get the domain glyph,
 *    which is why several lists used to start with a ragged left edge;
 *  - hand over the row's SUPPORT VALUE on a double-click (a long press on
 *    touch, where a double tap is the zoom gesture). That value is the technical
 *    id — support conversations run on those ids and there was nowhere in the UI
 *    to read one — except on a user, whose address is what one actually needs to
 *    copy; pass `email` there and it takes the id's place.
 *
 * The value is copied, never displayed: it is a handle on the row, not
 * information the row is about. The mark flips to `#` for a moment instead, and
 * the chip pops with a mint ring (`.just-copied`, design.css), so the gesture
 * confirms itself on the avatar the pointer is already on — the toast lands at
 * the far bottom of the viewport, where the eye is not.
 */
const props = withDefaults(defineProps<{
	entityId?: string | null
	email?: string | null
	name?: string | null
	kind?: 'person' | 'group' | 'vehicle' | 'activity' | 'alert' | 'project'
	testid?: string
}>(), { kind: 'person' })

const { t } = useI18n()
const registryMessage = useRegistryMessage()

const GLYPHS: Record<NonNullable<typeof props.kind>, string> = {
	person: '·',
	group: '👥',
	vehicle: '🚐',
	activity: '🥾',
	alert: '🚨',
	project: '📁',
}

const INITIALLED_KINDS: ReadonlyArray<NonNullable<typeof props.kind>> = ['person', 'project']

const COPIED_MARK = '#'
const COPIED_MARK_MS = 900
const LONG_PRESS_MS = 500

const initials = computed(() => {
	const parts = (props.name ?? '').trim().split(/\s+/).filter(Boolean)
	if (!INITIALLED_KINDS.includes(props.kind) || parts.length === 0) {
		return GLYPHS[props.kind]
	}
	return parts.slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase()
})

const copyValue = computed(() => props.email || props.entityId || '')

const hint = computed(() => {
	if (!copyValue.value) {
		return undefined
	}
	return props.email ? t('common.copyEmailHint') : t('common.copyIdHint')
})

const justCopied = ref(false)

const { start: markCopied } = useTimeoutFn(() => {
	justCopied.value = false
}, COPIED_MARK_MS, { immediate: false })

const { start: armPress, stop: cancelPress } = useTimeoutFn(() => void copy(), LONG_PRESS_MS, {
	immediate: false,
})

/**
 * navigator.clipboard directly rather than useClipboard: VueUse falls back to
 * execCommand where the async API is unavailable, which reports a write that a
 * refusal would have made fail. A denied write is swallowed here — there is
 * nothing the reader can do about it, and the gesture is a convenience rather
 * than a path through the app — but it must not be acknowledged as done.
 */
async function copy(): Promise<void> {
	if (!copyValue.value) {
		return
	}
	try {
		await navigator.clipboard.writeText(copyValue.value)
		registryMessage.copied(props.email ? t('common.emailCopied') : t('common.idCopied'))
		justCopied.value = true
		markCopied()
	} catch {
		return
	}
}

/**
 * Touch has no double-click: a double tap is the browser's zoom gesture, so the
 * same intent arrives as a long press. The mouse keeps its double-click alone —
 * a held button there is the start of a drag or a selection, not a copy.
 */
function onPointerDown(event: PointerEvent): void {
	if (event.pointerType === 'mouse') {
		return
	}
	armPress()
}
</script>

<template>
	<Avatar
			class="entity-avatar"
			:class="[
				`entity-avatar--${kind}`,
				{ 'entity-avatar--copyable': copyValue, 'just-copied': justCopied },
			]"
			:title="hint"
			:data-testid="testid"
			@dblclick="copy"
			@pointerdown="onPointerDown"
			@pointerup="cancelPress"
			@pointercancel="cancelPress"
			@pointerleave="cancelPress"
	>
		{{ justCopied ? COPIED_MARK : initials }}
	</Avatar>
</template>

<style scoped>
.entity-avatar {
	background-color: #003a5d;
	color: #fff;
	flex: none;
}

/* The glyph marks are emoji, which carry their own colour — a navy plate
   behind them muddies the glyph, so those get a neutral surface instead. The
   initialled kinds keep the navy plate (white on #003a5d clears AA). */
.entity-avatar--group,
.entity-avatar--vehicle,
.entity-avatar--activity,
.entity-avatar--alert {
	background-color: color-mix(in srgb, var(--focus) 12%, var(--surface));
	color: inherit;
}

/* Only a copyable avatar answers the pointer, and it must not answer a long
   press with the platform's own selection or callout menu instead. */
.entity-avatar--copyable {
	cursor: pointer;
	user-select: none;
	-webkit-touch-callout: none;
}
</style>
