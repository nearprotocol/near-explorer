import BN from "bn.js";

export interface NodeInfo {
  ipAddress: string;
  accountId: string;
  nodeId: string;
  lastSeen: number;
  lastHeight: number;
  agentName: string;
  agentVersion: string;
  agentBuild: string;
  status: string;
  latitude: number;
  longitude: number;
  city?: string;
}

export interface BaseValidationNodeInfo {
  account_id: string;
  is_slashed?: boolean;
  num_produced_blocks?: number;
  num_expected_blocks?: number;
  public_key: string;
  stake: string;
  stakeProposed?: string;
  cumulativeStakeAmount?: BN;
  validatorStatus?: "active" | "new" | "leaving" | "proposal";
  networkHolder?: boolean;
  shards?: [number];
  nodeInfo?: NodeInfo;
}

export interface StakingPoolInfo {
  fee: { numerator: number; denominator: number };
  delegatorsCount: number;
}

export type ValidationNodeInfo = BaseValidationNodeInfo & StakingPoolInfo;

export interface NodeStats {
  validatorsCount: number;
  onlineNodesCount: number;
  proposalsCount: number;
}
