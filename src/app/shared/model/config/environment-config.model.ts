import { ExecutionContextEnum } from './execution-context.enum'

export interface EnvironmentConfigModel {
    executionContext: ExecutionContextEnum
    frontendUrl: string
    backendUrl: string
    security: {
        oidcUrl: string
        realm: string
        clientId: string
    }
}
