'use client';
import { WebhookConfig } from './WebhookConfig';
import { Button } from '@heroui/react';
import { WorkflowTool } from '@/app/lib/types/workflow_types';
import { z } from 'zod';

interface AddWebhookToolProps {
  projectId: string;
  onAddTool: (tool: Partial<z.infer<typeof WorkflowTool>>) => void;
}

export function AddWebhookTool({ projectId, onAddTool }: AddWebhookToolProps) {
  function handleAddTool() {
    onAddTool({
      description: 'Webhook tool',
      mockTool: true,
      isWebhook: true,
    });
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Local webhook tool
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Use the project webhook as the local-first handoff into n8n or another router. When this tool is added to a workflow, requests post to the configured destination below.
        </p>
      </div>
      
      <WebhookConfig projectId={projectId} />

      <div className="text-sm text-gray-600 dark:text-gray-300">
        Add a webhook tool to your workflow after you configure the destination URL.
      </div>
      <Button
        size="lg"
        color="primary"
        onPress={handleAddTool}
      >Add webhook tool</Button>
    </div>
  );
} 
