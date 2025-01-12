import { ExecutionContextEnum } from '../enumeration/execution-context.enum'

export interface EnvironmentModel {
    production: boolean
    languages: string[]
    executionContext: ExecutionContextEnum
    backend: {
        url: string
        noAuthPaths: string[]
    }
}
