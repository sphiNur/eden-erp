import { useState, useEffect } from 'react';
import { Loader2, Receipt, Calendar, Truck, Users, Snowflake, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { billsApi } from '../../api/client';
import { DailyBillResponse } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
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
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const data = await billsApi.list({ bill_date: selectedDate });
            setBills(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBills(); }, [selectedDate]);

    const header = (
        <PageHeader title={<span className="flex items-center gap-2"><Receipt size={18} /> Bills</span>}>
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <Input
                    type="date"
                    className="h-8 bg-accent border-none text-sm font-medium flex-1"
                    value={selectedDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                />
            </div>
        </PageHeader>
    );

    return (
        <PageLayout header={header}>
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : bills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Receipt size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">No bills for this date</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bills.map(bill => <BillCard key={bill.id} bill={bill} />)}
                </div>
            )}
        </PageLayout>
    );
};

const BillCard = ({ bill }: { bill: DailyBillResponse }) => {
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 text-left hover:bg-accent/50 transition-colors"
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-foreground text-[15px]">
                            {bill.store_name || 'Store'}
                        </h3>
                        <span className="text-xs text-muted-foreground">{bill.bill_date}</span>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-foreground">{bill.grand_total?.toLocaleString()} UZS</p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                            {bill.status}
                        </p>
                    </div>
                </div>
            </button>

            {expanded && bill.detail && (
                <div className="border-t border-border">
                    {/* Items */}
                    {bill.detail.items?.length > 0 && (
                        <div className="p-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Products</h4>
                            <div className="space-y-1.5">
                                {bill.detail.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-foreground">{t(item.product_name)}</span>
                                        <div className="text-right text-muted-foreground">
                                            <span>{item.quantity} × {item.unit_price?.toLocaleString()}</span>
                                            <span className="ml-2 font-medium text-foreground">{item.subtotal?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Expenses */}
                    {bill.detail.expenses?.length > 0 && (
                        <div className="p-3 border-t border-border">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Shared Expenses</h4>
                            <div className="space-y-1.5">
                                {bill.detail.expenses.map((exp, idx) => {
                                    const ExpIcon = EXPENSE_ICONS[exp.expense_type] || HelpCircle;
                                    return (
                                        <div key={idx} className="flex justify-between text-sm items-center">
                                            <span className="flex items-center gap-2 text-foreground">
                                                <ExpIcon size={14} className="text-muted-foreground" />
                                                {exp.expense_type}
                                                {exp.description && <span className="text-muted-foreground text-xs">({exp.description})</span>}
                                            </span>
                                            <span className="font-medium text-foreground">{exp.store_share?.toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="p-3 bg-muted/50 border-t border-border">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Items</span>
                            <span className="font-medium text-foreground">{bill.items_total?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Shared</span>
                            <span className="font-medium text-foreground">{bill.shared_total?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t border-border">
                            <span className="text-foreground">Total</span>
                            <span className="text-foreground">{bill.grand_total?.toLocaleString()} UZS</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
