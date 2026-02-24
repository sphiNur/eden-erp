import { cn } from '../../lib/utils';
import { Badge } from '@/components/ui/badge';


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
                            <Badge
                                key={cat}
                                variant={activeCategory === cat ? "default" : "secondary"}
                                onClick={() => onSelectCategory(cat)}
                                className={cn(
                                    "px-3 py-1 cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5",
                                    activeCategory !== cat && "bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {cat}
                                {count > 0 && (
                                    <span className={cn(
                                        "min-w-[16px] h-[16px] rounded-full text-[9px] font-bold inline-flex items-center justify-center",
                                        activeCategory === cat
                                            ? "bg-primary-foreground text-primary"
                                            : "bg-primary/20 text-foreground"
                                    )}>
                                        {count}
                                    </span>
                                )}
                            </Badge>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
