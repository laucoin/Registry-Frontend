import { ExecutionContextEnum } from '../enumeration/execution-context.enum'

export interface EnvironmentModel {
    production: boolean
    languages: string[]
    executionContext: ExecutionContextEnum
    backendUrl: string
    authProvider: string
}
