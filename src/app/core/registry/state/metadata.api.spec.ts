import { expect } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { ApiCase, describeApi } from '@shared/helpers/testing/api-test.helper'

const BASE: string = '/api/v1/metadata'
const OPTIONS: object[] = [ { label: 'A', value: 'A' } ]
const same = (result: unknown): void => expect( result ).toEqual( OPTIONS )

const CASES: ApiCase<MetadataApi>[] = [
    { name: 'lists the presence statuses', method: 'GET', url: `${BASE}/presences/status`, call: (api: MetadataApi) => api.getPresencesStatus(), response: OPTIONS, verify: same },
    { name: 'lists the profile statuses', method: 'GET', url: `${BASE}/profiles/status`, call: (api: MetadataApi) => api.getProfilesStatus(), response: OPTIONS, verify: same },
    { name: 'lists the movement types', method: 'GET', url: `${BASE}/movements/types`, call: (api: MetadataApi) => api.getMovementsTypes(), response: OPTIONS, verify: same },
    { name: 'lists the participant types', method: 'GET', url: `${BASE}/participants/types`, call: (api: MetadataApi) => api.getParticipantsTypes(), response: OPTIONS, verify: same },
    { name: 'lists the alert statuses', method: 'GET', url: `${BASE}/alerts/status`, call: (api: MetadataApi) => api.getAlertsStatus(), response: OPTIONS, verify: same },
]

describeApi( 'MetadataApi', MetadataApi, CASES )
