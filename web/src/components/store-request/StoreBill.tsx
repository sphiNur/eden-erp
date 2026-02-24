import { useState, useEffect } from 'react';
import { Loader2, Receipt, Calendar, Truck, Users, Snowflake, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useLanguage } from '../../contexts/LanguageContext';
import { billsApi } from '../../api/client';
import type { DailyBillResponse, BillItemDetail, BillExpenseDetail } from '../../types';
import { PageLayout } from '../layout/PageLayout';
import { PageHeader } from '../layout/PageHeader';

const EXPENSE_ICONS: Record<string, any> = {
    transport: Truck,
    labor: Users,
    ice: Snowflake,
    other: HelpCircle,
};

export const StoreBill = () => {
    const [bills, setBills] = useState<DailyBillResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [expandedBill, setExpandedBill] = useState<string | null>(null);

    useEffect(() => {
        const fetchBills = async () => {
            setLoading(true);
            try {
                const params: { bill_date?: string; store_id?: string } = { bill_date: selectedDate };
                // Store managers: filter is handled server-side by role
                const data = await billsApi.list(params);
                setBills(data);
                if (data.length > 0) setExpandedBill(data[0].id);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBills();
    }, [selectedDate]);

    const header = (
        <PageHeader>
            <div className="flex items-center gap-3">
                <Receipt className="text-primary" size={20} />
                <h1 className="text-lg font-bold">每日账单</h1>
                <div className="flex-1" />
                <div className="flex items-center bg-accent px-2 py-1.5 rounded-lg shrink-0 focus-within:ring-2 focus-within:ring-primary/20">
                    <Calendar size={14} className="text-muted-foreground mr-1.5" aria-hidden />
                    <Input
                        type="date"
                        className="h-8 border-none bg-transparent text-[13px] font-medium outline-none focus-visible:ring-0 shadow-none px-0"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>
        </PageHeader>
    );

    if (loading) {
        return (
            <PageLayout header={header} className="bg-secondary">
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout header={header} className="bg-secondary">
            <div className="space-y-3 pb-8">
                {bills.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <Receipt size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">暂无账单</p>
                        <p className="text-sm mt-1">该日期还未生成账单</p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible value={expandedBill || ""} onValueChange={(val) => setExpandedBill(val || null)} className="space-y-3 px-3">
                        {bills.map(bill => (
                            <BillCard
                                key={bill.id}
                                bill={bill}
                            />
                        ))}
                    </Accordion>
                )}
            </div>
        </PageLayout>
    );
};

const BillCard = ({ bill }: {
    bill: DailyBillResponse;
}) => {
    const { t } = useLanguage();
    const items = bill.detail?.items || [];
    const expenses = bill.detail?.expenses || [];

    return (
        <AccordionItem value={bill.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden border-b-0 px-0">
            <AccordionTrigger className="w-full px-4 py-3 hover:bg-accent transition-colors hover:no-underline">
                <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm ring-1 ring-border shrink-0">
                            {(bill.store_name || '?')[0]}
                        </div>
                        <div className="text-left flex flex-col">
                            <p className="font-semibold text-foreground leading-tight">{bill.store_name || 'Store'}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {items.length} 项商品 · {expenses.length} 项费用
                            </p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <p className="font-bold text-lg text-primary leading-tight">
                            {Number(bill.grand_total).toLocaleString()}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase leading-tight mt-0.5">UZS</span>
                    </div>
                </div>
            </AccordionTrigger>

            <AccordionContent className="p-0 border-t border-border">
                {/* Items Section */}
                {items.length > 0 && (
                    <div className="px-4 py-3 bg-card">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">商品明细</p>
                        <div className="space-y-1.5">
                            {items.map((item: BillItemDetail, i: number) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-foreground">{t(item.product_name)}</span>
                                        <span className="text-muted-foreground text-xs ml-1">
                                            ×{Number(item.quantity).toFixed(1)} {t(item.unit)}
                                        </span>
                                    </div>
                                    <span className="font-medium text-foreground ml-2 shrink-0">
                                        {Number(item.subtotal).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-dashed border-border flex justify-between text-sm font-semibold">
                            <span className="text-muted-foreground">商品小计</span>
                            <span className="text-foreground">{Number(bill.items_total).toLocaleString()} UZS</span>
                        </div>
                    </div>
                )}

                {/* Shared Expenses Section */}
                {expenses.length > 0 && (
                    <div className="px-4 py-3 bg-secondary/80 border-t border-border">
                        <p className="text-[10px] uppercase font-bold text-primary/80 tracking-wider mb-2">均摊费用</p>
                        <div className="space-y-1.5">
                            {expenses.map((exp: BillExpenseDetail, i: number) => {
                                const Icon = EXPENSE_ICONS[exp.expense_type] || HelpCircle;
                                return (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <Icon size={14} className="text-primary/70" />
                                            <span className="text-foreground">{exp.description || exp.expense_type}</span>
                                            <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                                                {exp.split_method === 'equal' ? '平均' : '按比例'}
                                            </span>
                                        </div>
                                        <span className="font-medium text-primary ml-2 shrink-0">
                                            {Number(exp.store_share).toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-2 pt-2 border-t border-dashed border-border flex justify-between text-sm font-semibold">
                            <span className="text-primary/90">均摊小计</span>
                            <span className="text-primary">{Number(bill.shared_total).toLocaleString()} UZS</span>
                        </div>
                    </div>
                )}

                {/* Grand Total */}
                <div className="px-4 py-3 bg-primary/10 flex justify-between items-center border-t border-border">
                    <span className="font-bold text-foreground">合计</span>
                    <span className="text-xl font-bold text-primary">
                        {Number(bill.grand_total).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">UZS</span>
                    </span>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};
