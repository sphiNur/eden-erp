import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { ReactNode } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ListToolbarProps {
    search?: string;
    onSearchChange?: (value: string) => void;
    placeholder?: string;
    actions?: ReactNode;
    className?: string;
}

export const ListToolbar = ({
    search,
    onSearchChange,
    placeholder,
    actions,
    className
}: ListToolbarProps) => {
    const { ui } = useLanguage();

    return (
        <div className={`px-3 py-2 flex items-center gap-3 ${className || ''}`}>
            {/* Search Input - Expands to fill available space */}
            {onSearchChange && (
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <Input
                        placeholder={placeholder || ui('search')}
                        className="w-full pl-8 pr-8 h-9 bg-gray-100 border-transparent focus:bg-white focus:border-eden-500 rounded-lg text-sm transition-all"
                        value={search || ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* Actions - Pushed to the right */}
            {actions && (
                <div className="flex items-center gap-2 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
};
