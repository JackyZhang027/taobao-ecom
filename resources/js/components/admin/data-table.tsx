import type { Config, ConfigColumns } from 'datatables.net';
import DT from 'datatables.net-dt';
import DataTable from 'datatables.net-react';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { forwardRef, useImperativeHandle, useRef } from 'react';

// eslint-disable-next-line react-hooks/rules-of-hooks
DataTable.use(DT);

interface AdminDataTableProps {
    url: string;
    columns: ConfigColumns[];
    options?: Partial<Config>;
}

export interface AdminDataTableRef {
    reload: () => void;
}

export const AdminDataTable = forwardRef<AdminDataTableRef, AdminDataTableProps>(
    ({ url, columns, options = {} }, ref) => {
        const tableRef = useRef<any>(null);

        useImperativeHandle(ref, () => ({
            reload() {
                if (tableRef.current) {
                    tableRef.current.dt().ajax.reload(null, false);
                }
            },
        }));

        return (
            <div className="dt-wrapper">
                <DataTable
                    ref={tableRef}
                    ajax={url}
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

