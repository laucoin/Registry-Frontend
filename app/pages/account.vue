<script setup lang="ts">
import { usePreferencesStore } from '@stores/preferences'
import { useSessionStore } from '@stores/session'
import { Button, Card, Descriptions, DescriptionsItem, Modal, Space } from 'ant-design-vue'
import { storeToRefs } from 'pinia'

/**
 * Reference protected page. The account view is people-first: identity
 * and preferences in plain language.
 */
definePageMeta({ middleware: 'auth' })

const sessionStore = useSessionStore()
const { user, role } = storeToRefs(sessionStore)
const preferences = usePreferencesStore()
const { themeMode, language } = storeToRefs(preferences)
const { t } = useI18n()

const themeLabel = computed(() => t(`preferences.theme.${themeMode.value.toLowerCase()}`))
const languageLabel = computed(() => t(`account.languages.${language.value}`))

/**
 * The right to erasure, self-served. Signing out is part of the act, not a
 * courtesy: the caller's token stays valid for its own lifetime, and the next
 * request it makes would be provisioned a brand-new account — leaving the user
 * looking at an app that seems to have ignored them. Logging out also ends the
 * IdP session, so the deletion is the last thing this browser does signed in.
 * A refusal (last administrator of a project or of the platform) is surfaced
 * rather than swallowed, since it tells the user exactly what to do first.
 */
const deleteError = ref<unknown>(null)

function confirmDelete(): void {
	deleteError.value = null
	Modal.confirm({
		title: t('account.delete.title'),
		content: t('account.delete.confirm'),
		okText: t('account.delete.action'),
		okType: 'danger',
		okButtonProps: confirmButtonProps('account-delete-confirm'),
		cancelText: t('common.cancel'),
		onOk: async () => {
			try {
				await $fetch('/api/v2/users/me', {
					method: 'DELETE',
					headers: { 'x-csrf-token': sessionStore.csrf },
				})
			} catch (cause) {
				deleteError.value = cause
				return
			}
			await sessionStore.logout()
		},
	})
}

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

		<Card
				:title="$t('account.delete.title')"
				data-testid="account-delete-card"
		>
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<ApiErrorAlert
						v-if="deleteError"
						closable
						:error="deleteError"
						:message="$t('account.delete.failed')"
						testid="account-delete-error"
						@close="deleteError = null"
				/>
				<p>{{ $t('account.delete.explanation') }}</p>
				<Button
						danger
						type="primary"
						data-testid="account-delete"
						@click="confirmDelete"
				>
					{{ $t('account.delete.action') }}
				</Button>
			</Space>
		</Card>
	</Space>
</template>
