export type MonitoringStatusVariant = 'success' | 'warning' | 'danger' | 'neutral'

export interface MonitoringRowModel {
    id: string
    title: string
    subtitle: string | undefined
    statusLabel: string | undefined
    statusVariant: MonitoringStatusVariant
    icon: string
    overdue?: boolean
}
