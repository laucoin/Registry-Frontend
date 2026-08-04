<script setup lang="ts">
import { usePreferencesStore } from '@stores/preferences'
import { useSessionStore } from '@stores/session'
import { Card, Descriptions, DescriptionsItem, Space } from 'ant-design-vue'
import { storeToRefs } from 'pinia'

// ADR 022 — reference protected page. The account view is people-first: identity
// and preferences in plain language.
definePageMeta({ middleware: 'auth' })

const sessionStore = useSessionStore()
const { user, role } = storeToRefs(sessionStore)
const preferences = usePreferencesStore()
const { themeMode, language } = storeToRefs(preferences)
const { t } = useI18n()

const themeLabel = computed(() => t(`preferences.theme.${themeMode.value.toLowerCase()}`))
const languageLabel = computed(() => t(`account.languages.${language.value}`))

useHead({ title: computed(() => t('account.title')) })
</script>

<template>
	<Space
			direction="vertical"
			size="large"
			style="width: 100%"
	>
		<Card :title="$t('account.title')">
			<Descriptions
					bordered
					size="small"
					:column="1"
			>
				<DescriptionsItem :label="$t('account.name')">
					{{ sessionStore.displayName || '—' }}
				</DescriptionsItem>
				<DescriptionsItem label="Email">
					{{ user?.email ?? '—' }}
				</DescriptionsItem>
				<DescriptionsItem :label="$t('account.role')">
					{{ role?.label ?? '—' }}
				</DescriptionsItem>
			</Descriptions>
		</Card>

		<Card :title="$t('account.preferences')">
			<Descriptions
					bordered
					size="small"
					:column="1"
			>
				<DescriptionsItem :label="$t('preferences.language.label')">
					{{ languageLabel }}
				</DescriptionsItem>
				<DescriptionsItem :label="$t('preferences.theme.label')">
					{{ themeLabel }}
				</DescriptionsItem>
			</Descriptions>
		</Card>
	</Space>
</template>
