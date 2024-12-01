import { ExecutionContextEnum } from '../enumeration/execution-context.enum'

export interface EnvironmentModel {
    production: boolean
    languages: string[]
    executionContext: ExecutionContextEnum
    frontendUrl: string
    backendUrl: string
    authProvider: string
}
