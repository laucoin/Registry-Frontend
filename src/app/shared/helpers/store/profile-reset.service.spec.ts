import { Mock } from 'vitest'
import { ProfileResetService } from './profile-reset.service'

describe( 'ProfileResetService', () => {
    it( 'runs registered resets until unregistered', () => {
        const service: ProfileResetService = new ProfileResetService()
        const reset: Mock<() => void> = vi.fn()
        const unregister: () => void = service.register( reset )
        service.resetAll()
        unregister()
        service.resetAll()
        expect( reset ).toHaveBeenCalledTimes( 1 )
    } )
} )
