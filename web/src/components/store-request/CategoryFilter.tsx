import { cn } from '../../lib/utils';
import { haptic } from '../../lib/telegram';

interface CategoryFilterProps {
    categories: string[];
    activeCategory: string;
    onSelectCategory: (category: string) => void;
    categoryCounts?: Record<string, number>;
    totalSelectedCount?: number;
    allLabel?: string;
}

export const CategoryFilter = ({
    categories,
    activeCategory,
    onSelectCategory,
    categoryCounts = {},
    totalSelectedCount = 0,
    allLabel = 'All',
}: CategoryFilterProps) => {
    return (
        <div className="flex gap-1.5 py-0.5 overflow-x-auto scrollbar-hide whitespace-nowrap">
            {categories.map((cat) => {
                const isActive = cat === activeCategory;
                const count = cat === allLabel ? totalSelectedCount : (categoryCounts[cat] || 0);
                return (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => {
                            haptic.selection();
                            onSelectCategory(cat);
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 shrink-0 border",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                                ? "bg-primary text-primary-foreground border-primary/20 shadow-sm"
                                : "bg-card/80 text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                        )}
                    >
                        {cat}
                        {count > 0 && (
                            <span className={cn(
                                "ml-1 text-[9px] font-bold align-middle px-1 rounded-full",
                                isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
