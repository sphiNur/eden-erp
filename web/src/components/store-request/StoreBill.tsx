import { useState, useEffect } from 'react';
import { Loader2, Receipt, Calendar, ChevronDown, ChevronUp, Truck, Users, Snowflake, HelpCircle } from 'lucide-react';
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
                <Receipt className="text-eden-500" size={20} />
                <h1 className="text-lg font-bold">每日账单</h1>
                <div className="flex-1" />
                <div className="flex items-center bg-gray-100 px-2 py-1.5 rounded-lg shrink-0 focus-within:ring-2 focus-within:ring-eden-500/20">
                    <Calendar size={14} className="text-gray-500 mr-1.5" />
                    <input
                        type="date"
                        className="bg-transparent text-[13px] font-medium outline-none"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>
        </PageHeader>
    );

    if (loading) {
        return (
            <PageLayout header={header} className="bg-gray-50">
                <div className="flex justify-center items-center min-h-[50vh]">
                    <Loader2 className="animate-spin text-eden-500" size={48} />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout header={header} className="bg-gray-50">
            <div className="space-y-3 pb-8">
                {bills.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Receipt size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">暂无账单</p>
                        <p className="text-sm mt-1">该日期还未生成账单</p>
                    </div>
                ) : (
                    bills.map(bill => (
                        <BillCard
                            key={bill.id}
                            bill={bill}
                            expanded={expandedBill === bill.id}
                            onToggle={() => setExpandedBill(expandedBill === bill.id ? null : bill.id)}
                        />
                    ))
                )}
            </div>
        </PageLayout>
    );
};

const BillCard = ({ bill, expanded, onToggle }: {
    bill: DailyBillResponse;
    expanded: boolean;
    onToggle: () => void;
}) => {
    const { t } = useLanguage();
    const items = bill.detail?.items || [];
    const expenses = bill.detail?.expenses || [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Summary Header */}
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-eden-400 to-eden-600 flex items-center justify-center text-white font-bold text-sm">
                        {(bill.store_name || '?')[0]}
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-gray-900">{bill.store_name || 'Store'}</p>
                        <p className="text-xs text-gray-500">
                            {items.length} 项商品 · {expenses.length} 项费用
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <p className="font-bold text-lg text-eden-600">
                            {Number(bill.grand_total).toLocaleString()} <span className="text-xs font-normal">UZS</span>
                        </p>
                    </div>
                    {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
            </button>

            {/* Expanded Detail */}
            {expanded && (
                <div className="border-t border-gray-100">
                    {/* Items Section */}
                    {items.length > 0 && (
                        <div className="px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">商品明细</p>
                            <div className="space-y-1.5">
                                {items.map((item: BillItemDetail, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-gray-700">{t(item.product_name)}</span>
                                            <span className="text-gray-400 text-xs ml-1">
                                                ×{Number(item.quantity).toFixed(1)} {t(item.unit)}
                                            </span>
                                        </div>
                                        <span className="font-medium text-gray-900 ml-2 shrink-0">
                                            {Number(item.subtotal).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed flex justify-between text-sm font-semibold">
                                <span className="text-gray-500">商品小计</span>
                                <span className="text-gray-900">{Number(bill.items_total).toLocaleString()} UZS</span>
                            </div>
                        </div>
                    )}

                    {/* Shared Expenses Section */}
                    {expenses.length > 0 && (
                        <div className="px-4 py-3 bg-amber-50/50 border-t">
                            <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider mb-2">均摊费用</p>
                            <div className="space-y-1.5">
                                {expenses.map((exp: BillExpenseDetail, i: number) => {
                                    const Icon = EXPENSE_ICONS[exp.expense_type] || HelpCircle;
                                    return (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <Icon size={14} className="text-amber-500" />
                                                <span className="text-gray-700">{exp.description || exp.expense_type}</span>
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {exp.split_method === 'equal' ? '平均' : '按比例'}
                                                </span>
                                            </div>
                                            <span className="font-medium text-amber-700 ml-2 shrink-0">
                                                {Number(exp.store_share).toLocaleString()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed border-amber-200 flex justify-between text-sm font-semibold">
                                <span className="text-amber-600">均摊小计</span>
                                <span className="text-amber-700">{Number(bill.shared_total).toLocaleString()} UZS</span>
                            </div>
                        </div>
                    )}

                    {/* Grand Total */}
                    <div className="px-4 py-3 bg-eden-50 flex justify-between items-center">
                        <span className="font-bold text-eden-700">合计</span>
                        <span className="text-xl font-bold text-eden-600">
                            {Number(bill.grand_total).toLocaleString()} <span className="text-xs font-normal">UZS</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
