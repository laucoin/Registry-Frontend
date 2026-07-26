<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import { Button } from 'ant-design-vue'

/**
 * The action that opens a domain list's create form.
 *
 * Below the reflow breakpoint it keeps its icon and drops its words. "Ajouter un
 * participant" is 216px of a 296px content box at the 320px floor, so the button
 * alone pushed the toolbar into horizontal scroll — and a page that scrolls
 * sideways is harder to use than one whose add button is a "+". The icon is the
 * half that survives, because it is the half that still means something without
 * the other.
 *
 * The name never goes away, only the glyphs do: `aria-label` carries it at every
 * width, so the control keeps its accessible name when the text is hidden, and
 * matches the visible text when it is not (WCAG 2.5.3, Label in Name) — which is
 * also what keeps role-and-name selectors working at both widths.
 */
withDefaults(defineProps<{
	label: string
	testid?: string
	type?: 'primary' | 'default'
}>(), { type: 'default' })

defineEmits<{ click: [] }>()
</script>

<template>
	<Button
			:type="type"
			:aria-label="label"
			:data-testid="testid"
			@click="$emit('click')"
	>
		<template #icon>
			<slot name="icon">
				<PlusOutlined/>
			</slot>
		</template>
		<span class="toolbar-button__label">{{ label }}</span>
	</Button>
</template>

<style scoped>
@media (max-width: 575px) {
	.toolbar-button__label {
		display: none;
	}
}
</style>
