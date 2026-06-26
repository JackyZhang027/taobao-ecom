import type { Config, ConfigColumns } from 'datatables.net';
import DT from 'datatables.net-dt';
import DataTable from 'datatables.net-react';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// eslint-disable-next-line react-hooks/rules-of-hooks
DataTable.use(DT);

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
                    columns={columns}
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

