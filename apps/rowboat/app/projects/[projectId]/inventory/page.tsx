import { Metadata } from "next";
import { requireActiveBillingSubscription } from '@/app/lib/billing';
import { InventoryApp } from './app';

export const metadata: Metadata = {
    title: 'Inventory',
};

export default async function Page(
    props: {
        params: Promise<{ projectId: string }>;
    }
) {
    const params = await props.params;
    await requireActiveBillingSubscription();

    return <InventoryApp projectId={params.projectId} />;
}
