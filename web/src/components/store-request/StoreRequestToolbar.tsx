import { Store, CalendarDays, Search, X, Zap } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { OrderTemplate } from '../../types';

interface StoreOption {
    id: string;
    name: string;
}

interface StoreRequestToolbarProps {
    stores: StoreOption[];
    selectedStoreId: string;
    onStoreChange: (id: string) => void;
    deliveryDate: string;
    onDateChange: (date: string) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    templates: OrderTemplate[];
    onLoadTemplate: (template: OrderTemplate) => void;
    onDeleteTemplate: (id: string) => void;
}

export const StoreRequestToolbar = ({
    stores,
    selectedStoreId,
    onStoreChange,
    deliveryDate,
    onDateChange,
    searchTerm,
    onSearchChange,
    templates,
    onLoadTemplate,
    onDeleteTemplate
}: StoreRequestToolbarProps) => {
    const { ui } = useLanguage();

    return (
        <div className="bg-card border-b border-border">
            <div className="px-3 pt-2 pb-1">
                {/* ─── Top Row: Store & Date ─── */}
                <div className="flex items-center gap-1.5 mb-1.5">
                    {/* Store selector */}
                    <div className="flex items-center gap-1.5 bg-accent px-2 py-1.5 rounded-lg flex-1 min-w-0 transition-colors focus-within:ring-2 focus-within:ring-primary/20">
                        <Store size={16} className="text-muted-foreground shrink-0" />
                        <select
                            className="bg-transparent font-medium text-sm w-full outline-none truncate text-foreground appearance-none"
                            value={selectedStoreId}
                            onChange={(e) => onStoreChange(e.target.value)}
                        >
                            {stores.length === 0 && <option value="">{ui('selectStore')}</option>}
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Date picker */}
                    <div className="flex items-center gap-1 bg-accent px-2 py-1.5 rounded-lg shrink-0 transition-colors focus-within:ring-2 focus-within:ring-primary/20">
                        <CalendarDays size={14} className="text-muted-foreground" />
                        <input
                            type="date"
                            className="bg-transparent text-sm font-medium outline-none w-[110px] text-foreground"
                            value={deliveryDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => onDateChange(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="px-3 pb-1.5 space-y-1.5">
                {/* ─── Search ─── */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder={ui('search')}
                        className="w-full pl-8 pr-8 py-1.5 bg-accent rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm text-foreground placeholder:text-muted-foreground transition-all"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* ─── Quick Order Templates ─── */}
                {templates.length > 0 && (
                    <div className="overflow-x-auto -mx-3 px-3 scrollbar-hide mb-1">
                        <div className="flex gap-2">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center shrink-0">
                                <Zap size={10} className="mr-1" /> Quick Order:
                            </div>
                            {templates.map(tmpl => (
                                <div
                                    key={tmpl.id}
                                    onClick={() => onLoadTemplate(tmpl)}
                                    className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 active:bg-primary/20 active:scale-95 transition-all cursor-pointer select-none"
                                >
                                    {tmpl.name}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteTemplate(tmpl.id);
                                        }}
                                        className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
