import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, X, Trash2, MapPin } from 'lucide-react';
import { stallsApi } from '../../api/client';
import type { Stall, StallCreate } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const StallManager = () => {
    const [stalls, setStalls] = useState<Stall[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<StallCreate>({ name: '', location: '', sort_order: 0 });
    const [saving, setSaving] = useState(false);

    const fetchStalls = useCallback(async () => {
        setLoading(true);
        try {
            const data = await stallsApi.list();
            setStalls(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStalls(); }, [fetchStalls]);

    const handleSubmit = async () => {
        if (!formData.name.trim()) return;
        setSaving(true);
        try {
            if (editingId) {
                const updated = await stallsApi.update(editingId, formData);
                setStalls(prev => prev.map(s => s.id === editingId ? updated : s));
            } else {
                const created = await stallsApi.create(formData);
                setStalls(prev => [...prev, created]);
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', location: '', sort_order: 0 });
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this stall?')) return;
        try {
            await stallsApi.delete(id);
            setStalls(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const startEdit = (stall: Stall) => {
        setFormData({ name: stall.name, location: stall.location || '', sort_order: stall.sort_order });
        setEditingId(stall.id);
        setShowForm(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">档口管理</h2>
                <Button
                    size="sm"
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', location: '', sort_order: 0 }); }}
                >
                    <Plus size={16} className="mr-1" /> 添加档口
                </Button>
            </div>

            {/* Stall Form */}
            {showForm && (
                <div className="bg-card rounded-xl border border-border p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-foreground">{editingId ? '编辑档口' : '新增档口'}</h3>
                        <button onClick={() => setShowForm(false)}><X size={18} className="text-muted-foreground" /></button>
                    </div>
                    <Input
                        type="text"
                        placeholder="档口名称 (e.g. 蔬菜档)"
                        className="w-full bg-accent border-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring text-sm"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                        type="text"
                        placeholder="位置描述 (可选)"
                        className="w-full bg-accent border-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring text-sm"
                        value={formData.location || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                    <Input
                        type="number"
                        placeholder="排序"
                        className="w-full bg-accent border-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring text-sm"
                        value={formData.sort_order || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    />
                    <Button className="w-full" onClick={handleSubmit} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                        {editingId ? '保存' : '创建'}
                    </Button>
                </div>
            )}

            {/* Stall List */}
            <div className="space-y-2">
                {stalls.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">暂无档口，请添加</p>
                    </div>
                ) : (
                    stalls.map(stall => (
                        <div
                            key={stall.id}
                            className="bg-card rounded-lg border border-border p-3 flex items-center justify-between group hover:shadow-sm transition-shadow"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                    {stall.sort_order}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-foreground">{stall.name}</p>
                                    {stall.location && <p className="text-xs text-muted-foreground">{stall.location}</p>}
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEdit(stall)}
                                    className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(stall.id)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
