import { useLanguage } from '../../contexts/LanguageContext';
import { TrendingUp, Store, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { formatCurrency } from '../../lib/utils';
import { getLocale } from '../../lib/locale';
import { PageLayout } from '../layout/PageLayout';

export const AnalyticsDashboard = () => {
    const { language } = useLanguage();

    // Mock Data — TODO: replace with real API calls
    const stats = [
        { title: "Total Spend (Month)", value: 45250000, icon: CreditCard, color: "text-eden-500" },
        { title: "Active Stores", value: 2, icon: Store, color: "text-emerald-600" },
        { title: "Orders Processed", value: 145, icon: TrendingUp, color: "text-purple-600" },
    ];

    const storeSpend = [
        { name: "Magic Store", amount: 28500000, percent: 63 },
        { name: "Seoul Store", amount: 16750000, percent: 37 },
    ];

    const locale = getLocale(language);

    const toolbar = (
        <div className="px-3 py-2">
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</p>
        </div>
    );

    return (
        <PageLayout toolbar={toolbar}>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">
                                {typeof stat.value === 'number' && stat.value > 1000
                                    ? formatCurrency(stat.value, 'UZS', locale)
                                    : stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Store Breakdown */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Spend by Store</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {storeSpend.map((store) => (
                        <div key={store.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{store.name}</span>
                                <span className="text-gray-500">{formatCurrency(store.amount, 'UZS', locale)}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-eden-500 rounded-full"
                                    style={{ width: `${store.percent}%` }}
                                />
                            </div>
                            <p className="text-xs text-right text-gray-400">{store.percent}%</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </PageLayout>
    );
};
