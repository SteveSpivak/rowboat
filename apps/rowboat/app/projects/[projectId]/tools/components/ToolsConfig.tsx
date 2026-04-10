'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tabs, Tab } from '@/components/ui/tabs';
import { CustomMcpServers } from './CustomMcpServer';
import { SelectComposioToolkit } from './SelectComposioToolkit';
import { ComposioToolsPanel } from './ComposioToolsPanel';
import { AddWebhookTool } from './AddWebhookTool';
import type { Key } from 'react';
import { Workflow, WorkflowTool } from '@/app/lib/types/workflow_types';
import { ZToolkit } from "@/src/application/lib/composio/types";
import { z } from 'zod';
import { getLocalConnectorStatus } from '@/app/actions/local-connectors.actions';
import { LOCAL_CONNECTORS, LocalConnectorModel } from '@/app/lib/local-connectors';

interface ToolsConfigProps {
  projectId: string;
  useComposioTools: boolean;
  tools: z.infer<typeof Workflow.shape.tools>;
  onAddTool: (tool: Partial<z.infer<typeof WorkflowTool>>) => void;
  initialToolkitSlug?: string | null;
}

type ToolkitType = z.infer<typeof ZToolkit>;

export function ToolsConfig({
  projectId,
  useComposioTools,
  tools,
  onAddTool,
  initialToolkitSlug
}: ToolsConfigProps) {
  let defaultActiveTab = 'mcp';
  if (useComposioTools && initialToolkitSlug) {
    defaultActiveTab = 'connected-apps';
  }
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [selectedToolkit, setSelectedToolkit] = useState<ToolkitType | null>(null);
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);
  const [connectorBaseUrl, setConnectorBaseUrl] = useState('');
  const [connectorModels, setConnectorModels] = useState<LocalConnectorModel[]>([]);
  const [connectorStatusLoading, setConnectorStatusLoading] = useState(true);
  const [connectorStatusError, setConnectorStatusError] = useState<string | null>(null);
  const useBilling = process.env.NEXT_PUBLIC_USE_BILLING === "true";

  useEffect(() => {
    let active = true;

    async function loadConnectorStatus() {
      try {
        setConnectorStatusLoading(true);
        const status = await getLocalConnectorStatus();
        if (!active) return;
        setConnectorBaseUrl(status.baseUrl);
        setConnectorModels(status.models);
        setConnectorStatusError(null);
      } catch (error) {
        console.error('Failed to load local connector status:', error);
        if (!active) return;
        setConnectorStatusError('Unable to check the local connector bridge right now.');
        setConnectorModels([]);
      } finally {
        if (active) {
          setConnectorStatusLoading(false);
        }
      }
    }

    loadConnectorStatus();

    return () => {
      active = false;
    };
  }, []);

  const connectorModelsByKey = useMemo(() => {
    return connectorModels.reduce<Record<string, LocalConnectorModel[]>>((accumulator, model) => {
      if (!accumulator[model.connector]) {
        accumulator[model.connector] = [];
      }
      accumulator[model.connector].push(model);
      return accumulator;
    }, {});
  }, [connectorModels]);

  const handleTabChange = (key: Key) => {
    setActiveTab(key.toString());
  };

  const handleSelectToolkit = (toolkit: ToolkitType) => {
    setSelectedToolkit(toolkit);
    setIsToolsPanelOpen(true);
  };

  const handleCloseToolsPanel = () => {
    setSelectedToolkit(null);
    setIsToolsPanelOpen(false);
  };

  const handleAddTool = (tool: z.infer<typeof WorkflowTool>) => {
    onAddTool(tool);
    handleCloseToolsPanel();
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={handleTabChange}
        aria-label="Tool and connector configuration options"
        className="w-full"
        fullWidth
      >
        <Tab key="mcp" title="MCP">
          <div className="mt-4 p-6">
            <CustomMcpServers
              tools={tools}
              onAddTool={onAddTool}
            />
          </div>
        </Tab>
        {!useBilling && <Tab key="webhook" title="Webhook">
          <div className="mt-4 p-6">
            <AddWebhookTool
              projectId={projectId}
              onAddTool={onAddTool}
            />
          </div>
        </Tab>}
        <Tab key="connectors" title="Connectors">
          <div className="mt-4 p-6">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Model connectors</div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Select the connector and model per agent in the workflow editor. This panel shows what the local bridge exposes right now and where fallback traffic should go if you override it.
                  </div>
                </div>
                <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  connectorStatusLoading
                    ? 'border border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                    : connectorModels.length > 0
                      ? 'border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                      : 'border border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
                }`}>
                  {connectorStatusLoading ? 'Checking bridge...' : connectorModels.length > 0 ? 'Bridge reachable' : 'Bridge unavailable'}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Base URL: <span className="font-mono text-gray-700 dark:text-gray-300">{connectorBaseUrl || 'http://127.0.0.1:8765/v1'}</span>
              </div>

              {connectorStatusError && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {connectorStatusError}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {LOCAL_CONNECTORS.map((connector) => {
                  const modelsForConnector = connectorModelsByKey[connector.key] || [];

                  return (
                    <div
                      key={connector.key}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{connector.label}</div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{connector.description}</div>
                      <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                        {modelsForConnector.length > 0
                          ? modelsForConnector.map((model) => model.model).join(', ')
                          : 'No models exposed right now.'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!connectorStatusLoading && connectorModels.length === 0 && !connectorStatusError && (
                <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                  Start the local CLI bridge or set <span className="font-mono">PROVIDER_BASE_URL</span> to a compatible hosted endpoint. MCP and webhook tools remain available even when local models are offline.
                </div>
              )}
            </div>
          </div>
        </Tab>
        {useComposioTools && (
          <Tab key="connected-apps" title="Connected Apps">
            <div className="mt-4 p-6">
              <SelectComposioToolkit
                projectId={projectId}
                tools={tools}
                onSelectToolkit={handleSelectToolkit}
                initialToolkitSlug={initialToolkitSlug}
                filterByTools={true}
              />
            </div>
          </Tab>
        )}
      </Tabs>
      
      {/* Tools Panel */}
      {selectedToolkit && (
        <ComposioToolsPanel
          toolkit={selectedToolkit}
          isOpen={isToolsPanelOpen}
          onClose={handleCloseToolsPanel}
          tools={tools}
          onAddTool={handleAddTool}
        />
      )}
    </div>
  );
} 
