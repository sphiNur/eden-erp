import { cn } from '../../lib/utils';


interface CategoryFilterProps {
    categories: string[];
    activeCategory: string;
    onSelectCategory: (category: string) => void;
    categoryCounts: Record<string, number>; // How many items selected in this category
    totalSelectedCount: number;
    allLabel: string;
}

export const CategoryFilter = ({
    categories,
    activeCategory,
    onSelectCategory,
    categoryCounts,
    totalSelectedCount,
    allLabel
}: CategoryFilterProps) => {

    // Auto-scroll active category into view if needed? 
    // For now simple rendering is fine.

    return (
        <div className="bg-white border-b">
            <div className="overflow-x-auto px-3 py-2 scrollbar-hide">
                <div className="flex gap-1.5">
                    {categories.map(cat => {
                        const isAll = cat === allLabel;
                        const count = isAll ? totalSelectedCount : (categoryCounts[cat] || 0);

                        return (
                            <button
                                key={cat}
                                onClick={() => onSelectCategory(cat)}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                                    activeCategory === cat
                                        ? "bg-eden-500 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                            >
                                {cat}
                                {count > 0 && (
                                    <span className={cn(
                                        "min-w-[16px] h-[16px] rounded-full text-[9px] font-bold inline-flex items-center justify-center",
                                        activeCategory === cat
                                            ? "bg-white/30 text-white"
                                            : "bg-eden-50 text-eden-500"
                                    )}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
