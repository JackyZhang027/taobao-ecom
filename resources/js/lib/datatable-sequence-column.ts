export function sequenceColumn(width = '40px') {
    return {
        data: null,
        title: '#',
        orderable: false,
        searchable: false,
        width,
        render: (_data: unknown, _type: string, _row: unknown, meta: { row: number; settings: any }) =>
            meta.row + meta.settings._iDisplayStart + 1,
    };
}
