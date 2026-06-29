export interface ProposalPayloadLabels {
  confirm: string;
  decline: string;
}

export const DEFAULT_PROPOSAL_LABELS: ProposalPayloadLabels = {
  confirm: 'Có',
  decline: 'Không',
};

export interface ProposalPayload {
  kind: string;
  title: string;
  description: string;
  endpoint: string;
  payload: Record<string, unknown>;
  labels?: ProposalPayloadLabels;
}

export function isProposalPayload(result: unknown): result is ProposalPayload {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return false;
  const o = result as Record<string, unknown>;
  if ('error' in o) return false;
  if (
    typeof o.kind !== 'string' ||
    typeof o.title !== 'string' ||
    typeof o.description !== 'string' ||
    typeof o.endpoint !== 'string'
  ) {
    return false;
  }
  if (o.payload === null || o.payload === undefined || typeof o.payload !== 'object') {
    return false;
  }
  if (Array.isArray(o.payload)) return false;
  return true;
}
