import { PageLayout } from '../layout/PageLayout';
import { ProductListSkeleton } from './Skeleton';

export const PageLoading = () => {
    return (
        <PageLayout>
            <ProductListSkeleton />
        </PageLayout>
    );
};
