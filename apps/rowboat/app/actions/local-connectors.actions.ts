"use server";

import { fetchLocalConnectorModels, resolveLocalConnectorBaseUrl } from "@/app/lib/local-connectors";

export async function getLocalConnectorStatus() {
    const models = await fetchLocalConnectorModels();

    return {
        baseUrl: resolveLocalConnectorBaseUrl(),
        models,
    };
}
