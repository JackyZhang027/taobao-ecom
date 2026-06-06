import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';

const statusColors: Record<string, string> = {
    draft:   'bg-gray-100 text-gray-600',
    posted:  'bg-green-100 text-green-700',
    voided:  'bg-red-100 text-red-700',
};

const columns = [
    { data: 'id', title: '#', width: '60px' },
    { data: 'date', title: 'Date', render: (d: string) => new Date(d).toLocaleDateString() },
    { data: 'reference_number', title: 'Reference' },
    { data: 'description', title: 'Description' },
    {
        data: 'status',
        title: 'Status',
        render: (data: string) => {
            const cls = statusColors[data] ?? 'bg-gray-100 text-gray-600';
            return `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent capitalize ${cls}">${data}</span>`;
        },
    },
    { data: 'creator_name', title: 'Created By', defaultContent: '—' },
    {
        data: 'id',
        title: '',
        orderable: false,
        searchable: false,
        render: (id: number) =>
            `<a href="/admin/accounting/journals/${id}" class="text-primary hover:underline text-sm">View</a>`,
    },
];

export default function JournalsIndex() {
    return (
        <AdminLayout>
            <Head title="Journal Entries" />
            <AdminPageHeader
                title="Journal Entries"
                actions={
                    <Button asChild>
                        <a href="/admin/accounting/journals/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New Entry
                        </a>
                    </Button>
                }
            />
            <Card>
                <CardHeader>
                    <CardTitle>All Journal Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable url="/admin/accounting/journals/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
