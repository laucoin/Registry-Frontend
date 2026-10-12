export interface SelectOptionModel<T = unknown> {
    label?: string | undefined
    value: T
    title?: string | undefined
    icon?: string | undefined
    disabled?: boolean | undefined
}

export interface SelectOptionGroupModel<T = unknown> {
    label?: string | undefined
    value?: string | undefined
    items: SelectOptionModel<T>[]
}
