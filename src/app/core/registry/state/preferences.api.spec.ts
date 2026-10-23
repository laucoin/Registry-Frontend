import { PreferencesApi } from '@core/registry/state/preferences.api'
import { ApiCase, describeApi, expectMapped } from '@shared/helpers/testing/api-test.helper'

const BASE: string = '/api/v2/users/preferences'
const PREFERENCES: object = { userId: 'u1', theme: 'DARK', language: 'fr', refreshMode: 'NORMAL' }

const CASES: ApiCase<PreferencesApi>[] = [
    { name: 'saves the theme', method: 'POST', url: `${BASE}/theme?theme=DARK`, call: (api: PreferencesApi) => api.updateTheme( 'DARK' ), response: PREFERENCES, verify: expectMapped },
    { name: 'saves the language', method: 'POST', url: `${BASE}/language?language=fr`, call: (api: PreferencesApi) => api.updateLanguage( 'fr' ), response: PREFERENCES, verify: expectMapped },
    { name: 'saves the refresh mode', method: 'POST', url: `${BASE}/refresh-mode?mode=FAST`, call: (api: PreferencesApi) => api.updateRefreshMode( 'FAST' ), response: PREFERENCES, verify: expectMapped },
]

describeApi( 'PreferencesApi', PreferencesApi, CASES )
