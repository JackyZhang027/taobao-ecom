import { Head } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomerLayout from '@/layouts/customer-layout';

interface FaqItem {
    id: number;
    question: string;
    answer: string | null;
}

interface FaqProps {
    faqs: FaqItem[];
}

export default function Faq({ faqs }: FaqProps) {
    const { t } = useTranslation();
    const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);

    return (
        <CustomerLayout>
            <Head title={t('footer.faq')} />
            <h1 className="mb-6 text-2xl font-bold">{t('footer.faq')}</h1>

            {faqs.length === 0 ? (
                <p className="text-muted-foreground">{t('faq.empty')}</p>
            ) : (
                <div className="divide-y rounded-lg border">
                    {faqs.map((faq) => {
                        const isOpen = openId === faq.id;
                        return (
                            <div key={faq.id}>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left font-medium hover:bg-muted/50 transition-colors"
                                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                                >
                                    {faq.question}
                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {isOpen && faq.answer && (
                                    <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-line">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </CustomerLayout>
    );
}
