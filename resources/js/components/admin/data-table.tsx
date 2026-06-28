import type { Config, ConfigColumns } from 'datatables.net';
import DT from 'datatables.net-dt';
import DataTable from 'datatables.net-react';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { escHtml } from '@/lib/utils';

// eslint-disable-next-line react-hooks/rules-of-hooks
DataTable.use(DT);

// Columns with no explicit `render` are inserted via DataTables' default
// `.html()` cell rendering, which does not escape — escape by default here
// so free-text fields (names, notes, etc.) can't inject markup/scripts.
// Columns that already define their own `render` are left untouched.
function withDefaultEscaping(columns: ConfigColumns[]): ConfigColumns[] {
    return columns.map((column) =>
        column.render
            ? column
            : { ...column, render: (data: unknown) => escHtml(String(data ?? '')) }
    );
}

interface AdminDataTableProps {
    url: string;
    columns: ConfigColumns[];
    options?: Partial<Config>;
    filters?: Record<string, unknown>;
}

export interface AdminDataTableRef {
    reload: () => void;
}

export const AdminDataTable = forwardRef<AdminDataTableRef, AdminDataTableProps>(
    ({ url, columns, options = {}, filters = {} }, ref) => {
        const tableRef = useRef<any>(null);
        const filtersRef = useRef(filters);
        const isFirstRender = useRef(true);
        const safeColumns = useMemo(() => withDefaultEscaping(columns), [columns]);

        filtersRef.current = filters;

        useImperativeHandle(ref, () => ({
            reload() {
                if (tableRef.current) {
                    tableRef.current.dt().ajax.reload(null, false);
                }
            },
        }));

        useEffect(() => {
            if (isFirstRender.current) {
                isFirstRender.current = false;
                return;
            }
            if (tableRef.current) {
                tableRef.current.dt().ajax.reload(null, true);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [JSON.stringify(filters)]);

        return (
            <div className="dt-wrapper">
                <DataTable
                    ref={tableRef}
                    ajax={{ url, data: (d: any) => ({ ...d, ...filtersRef.current }) }}
                    columns={safeColumns}
                    options={
                        {
                            serverSide: true,
                            processing: true,
                            pageLength: 25,
                            ...options,
                        } as Config
                    }
                    className="w-full text-sm"
                />
            </div>
        );
    }
);

