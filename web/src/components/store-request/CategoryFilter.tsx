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
        <div className="bg-card border-b border-border">
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
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-accent text-accent-foreground hover:bg-accent/80"
                                )}
                            >
                                {cat}
                                {count > 0 && (
                                    <span className={cn(
                                        "min-w-[16px] h-[16px] rounded-full text-[9px] font-bold inline-flex items-center justify-center",
                                        activeCategory === cat
                                            ? "bg-background text-foreground"
                                            : "bg-primary/20 text-primary"
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
