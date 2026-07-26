<script setup lang="ts">
/**
 * The product's own status artwork, drawn inline rather than fetched as an
 * image so it can take its ink from `currentColor` — that is what lets the
 * error screen paint it in the status colour and what keeps it legible in both
 * modes. A deploy that supplies its own illustration gets an <img> instead and
 * keeps its colours; see useRegistryAssets.isDefault.
 *
 * Decorative: the message beside it carries the information.
 */
</script>

<template>
	<svg
			viewBox="0 0 240 160"
			fill="none"
			aria-hidden="true"
			focusable="false"
	>
		<rect
				width="240"
				height="160"
				rx="12"
				fill="currentColor"
				opacity="0.12"
		/>
		<circle
				cx="120"
				cy="64"
				r="36"
				fill="currentColor"
				opacity="0.45"
		/>
		<rect
				x="60"
				y="116"
				width="120"
				height="10"
				rx="5"
				fill="currentColor"
				opacity="0.6"
		/>
		<rect
				x="84"
				y="132"
				width="72"
				height="8"
				rx="4"
				fill="currentColor"
				opacity="0.35"
		/>
	</svg>
</template>
