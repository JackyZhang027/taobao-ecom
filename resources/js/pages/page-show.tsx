import { Head } from '@inertiajs/react';
import DOMPurify from 'dompurify';
import CustomerLayout from '@/layouts/customer-layout';

interface PageShowProps {
    page: {
        slug: string;
        title: string;
        content: string | null;
    };
}

export default function PageShow({ page }: PageShowProps) {
    return (
        <CustomerLayout>
            <Head title={page.title} />
            <h1 className="mb-6 text-2xl font-bold">{page.title}</h1>
            {page.content && (
                <div
                    className="prose prose-sm max-w-none text-slate-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
                />
            )}
        </CustomerLayout>
    );
}
