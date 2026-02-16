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
        <div className="sticky top-header z-toolbar bg-white border-b shadow-sm">
            <div className="px-3 pt-2 pb-1">
                {/* ─── Top Row: Store & Date ─── */}
                <div className="flex items-center gap-1.5 mb-1.5">
                    {/* Store selector */}
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg flex-1 min-w-0">
                        <Store size={16} className="text-gray-500 shrink-0" />
                        <select
                            className="bg-transparent font-medium text-sm w-full outline-none truncate"
                            value={selectedStoreId}
                            onChange={(e) => onStoreChange(e.target.value)}
                        >
                            {stores.length === 0 && <option value="">{ui('selectStore')}</option>}
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Date picker */}
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1.5 rounded-lg shrink-0">
                        <CalendarDays size={14} className="text-gray-500" />
                        <input
                            type="date"
                            className="bg-transparent text-sm font-medium outline-none w-[110px]"
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
                    <Search className="absolute left-2.5 top-2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder={ui('search')}
                        className="w-full pl-8 pr-8 py-1.5 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-eden-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* ─── Quick Order Templates ─── */}
                {templates.length > 0 && (
                    <div className="overflow-x-auto -mx-3 px-3 scrollbar-hide mb-1">
                        <div className="flex gap-2">
                            <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center shrink-0">
                                <Zap size={10} className="mr-1" /> Quick Order:
                            </div>
                            {templates.map(tmpl => (
                                <div
                                    key={tmpl.id}
                                    onClick={() => onLoadTemplate(tmpl)}
                                    className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 active:bg-indigo-100 active:scale-95 transition-all cursor-pointer select-none"
                                >
                                    {tmpl.name}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteTemplate(tmpl.id);
                                        }}
                                        className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center hover:bg-indigo-200"
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
