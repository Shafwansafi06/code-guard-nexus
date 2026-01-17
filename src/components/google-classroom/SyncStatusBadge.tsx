/**
 * Sync Status Badge Component
 * Shows Google Classroom sync status
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncStatusBadgeProps {
  lastSyncedAt?: string | null;
  syncEnabled: boolean;
}

export function SyncStatusBadge({ lastSyncedAt, syncEnabled }: SyncStatusBadgeProps) {
  if (!syncEnabled) {
    return (
      <Badge variant="outline" className="text-gray-500">
        Not Synced
      </Badge>
    );
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <span className="mr-1">✓</span>
            Synced{lastSyncedAt && ` ${formatTime(lastSyncedAt)}`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
