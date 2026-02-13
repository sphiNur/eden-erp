import * as React from "react"
import { cn } from "../../lib/utils"

// Since we cannot install @radix-ui/react-tabs easily without potential issues, 
// I will create a simplified custom implementation of Tabs that mimics the API.
// This is safer for the demo environment constraints.

interface TabsProps {
    defaultValue: string;
    className?: string;
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
}

const TabsContext = React.createContext<{
    value: string;
    setValue: (v: string) => void;
} | null>(null);

const Tabs = ({ defaultValue, className, children, onValueChange }: TabsProps) => {
    const [value, setValue] = React.useState(defaultValue);

    const handleSetValue = (v: string) => {
        setValue(v);
        onValueChange?.(v);
    }

    return (
        <TabsContext.Provider value={{ value, setValue: handleSetValue }}>
            <div className={cn("", className)}>{children}</div>
        </TabsContext.Provider>
    );
};

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
            className
        )}
        {...props}
    />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isSelected = context?.value === value;

    return (
        <button
            ref={ref}
            onClick={() => context?.setValue(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSelected && "bg-white text-gray-950 shadow-sm",
                className
            )}
            {...props}
        />
    )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (context?.value !== value) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
