import { useState } from 'react';
import { Plus, X, Truck, Users, Snowflake, HelpCircle, Loader2 } from 'lucide-react';
import { expensesApi } from '../../api/client';
import type { SharedExpenseCreate, SharedExpenseResponse, SplitMethod } from '../../types';
import { Button } from '../ui/button';

const EXPENSE_TYPES = [
    { value: 'transport', label: '车费', icon: Truck },
    { value: 'labor', label: '人工费', icon: Users },
    { value: 'ice', label: '冰块费', icon: Snowflake },
    { value: 'other', label: '其他', icon: HelpCircle },
];

interface ExpenseFormProps {
    date: string;
    expenses: SharedExpenseResponse[];
    onExpenseAdded: (expense: SharedExpenseResponse) => void;
    onExpenseDeleted: (id: string) => void;
}

export const ExpenseForm = ({ date, expenses, onExpenseAdded, onExpenseDeleted }: ExpenseFormProps) => {
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<SharedExpenseCreate>({
        expense_date: date,
        expense_type: 'transport',
        description: '',
        amount: 0,
        split_method: 'equal' as SplitMethod,
    });

    const handleSubmit = async () => {
        if (form.amount <= 0) return;
        setSaving(true);
        try {
            const created = await expensesApi.create({ ...form, expense_date: date });
            onExpenseAdded(created);
            setShowForm(false);
            setForm(prev => ({ ...prev, description: '', amount: 0 }));
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await expensesApi.delete(id);
            onExpenseDeleted(id);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-600">共享费用</h3>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center text-xs font-semibold text-eden-600 hover:underline"
                    >
                        <Plus size={14} className="mr-0.5" /> 添加
                    </button>
                )}
            </div>

            {/* Existing expenses */}
            {expenses.length > 0 && (
                <div className="space-y-1.5">
                    {expenses.map(exp => {
                        const typeInfo = EXPENSE_TYPES.find(t => t.value === exp.expense_type) || EXPENSE_TYPES[3];
                        const Icon = typeInfo.icon;
                        return (
                            <div key={exp.id} className="flex items-center justify-between bg-amber-50 px-3 py-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Icon size={14} className="text-amber-500" />
                                    <span className="text-sm font-medium">{typeInfo.label}</span>
                                    {exp.description && <span className="text-xs text-gray-400">({exp.description})</span>}
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                        {exp.split_method === 'equal' ? '平均' : '按比例'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{Number(exp.amount).toLocaleString()}</span>
                                    <button onClick={() => handleDelete(exp.id)} className="text-gray-400 hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add form */}
            {showForm && (
                <div className="bg-white rounded-xl border p-3 space-y-2.5 shadow-sm">
                    {/* Type selector */}
                    <div className="grid grid-cols-4 gap-1.5">
                        {EXPENSE_TYPES.map(type => {
                            const Icon = type.icon;
                            const selected = form.expense_type === type.value;
                            return (
                                <button
                                    key={type.value}
                                    onClick={() => setForm(prev => ({ ...prev, expense_type: type.value }))}
                                    className={`flex flex-col items-center p-2 rounded-lg text-xs font-medium transition-all ${selected
                                            ? 'bg-eden-500 text-white shadow-md scale-105'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    <Icon size={16} className="mb-0.5" />
                                    {type.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Amount */}
                    <input
                        type="number"
                        placeholder="金额 (UZS)"
                        className="w-full px-3 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-eden-500 text-sm"
                        value={form.amount || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    />

                    {/* Description */}
                    <input
                        type="text"
                        placeholder="备注 (可选)"
                        className="w-full px-3 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-eden-500 text-sm"
                        value={form.description || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    />

                    {/* Split method */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setForm(prev => ({ ...prev, split_method: 'equal' }))}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${form.split_method === 'equal'
                                    ? 'bg-eden-500 text-white'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            平均均摊
                        </button>
                        <button
                            onClick={() => setForm(prev => ({ ...prev, split_method: 'proportional' }))}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${form.split_method === 'proportional'
                                    ? 'bg-eden-500 text-white'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            按比例均摊
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold"
                        >
                            取消
                        </button>
                        <Button className="flex-1" onClick={handleSubmit} disabled={saving || form.amount <= 0}>
                            {saving ? <Loader2 className="animate-spin mr-1" size={14} /> : null}
                            添加
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
