import { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface QuantityControlProps {
    value: number;
    onChange: (val: number) => void;
    /** If true, shows compact inline mode for list rows */
    compact?: boolean;
}

/**
 * Reusable quantity control: –/+ buttons + editable numeric input.
 * Handles decimal values and transient input state.
 */
export const QuantityControl = ({ value, onChange }: QuantityControlProps) => {
    const [localValue, setLocalValue] = useState(value.toString());

    useEffect(() => {
        if (parseFloat(localValue) !== value) {
            setLocalValue(value > 0 ? value.toString() : '');
        }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
            onChange(num);
        }
    };

    const handleBlur = () => {
        const num = parseFloat(localValue);
        if (isNaN(num) || num <= 0) {
            onChange(0);
        } else {
            onChange(num);
            setLocalValue(num.toString());
        }
    };

    const step = (delta: number) => {
        const current = value || 0;
        // For decrement: if < 1, remove entirely; else -1
        const actualDelta = delta < 0 && current <= 1 ? -current : delta;
        const next = Math.max(0, Math.round((current + actualDelta) * 1000) / 1000);
        onChange(next);
    };

    if (value <= 0) {
        // Not selected — show single + button
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => step(1)}
                aria-label="Add item"
            >
                <Plus size={20} />
            </Button>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full border-border bg-card"
                onClick={() => step(-1)}
                aria-label="Decrease quantity"
            >
                <Minus size={16} />
            </Button>

            <Input
                type="number"
                step="0.001"
                min="0"
                className="w-16 h-11 text-center p-0 text-base font-bold mx-0.5 border-none shadow-none focus-visible:ring-0 bg-transparent text-foreground"
                value={localValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={(e) => e.target.select()}
                aria-label="Quantity input"
            />

            <Button
                variant="default"
                size="icon"
                className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => step(1)}
                aria-label="Increase quantity"
            >
                <Plus size={16} />
            </Button>
        </div>
    );
};
