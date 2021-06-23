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
  validatorStatus?: "new" | "removed";
  // new?: boolean;
  // removed?: boolean;
  shards?: [number];
  nodeInfo?: NodeInfo;
}

export interface StakingPoolInfo {
  fee: { numerator: number; denominator: number };
  delegatorsCount: number;
}

export interface StakeInfo {
  cumulativeStakeAmount: CumulativeStake;
  totalStake: BN;
}

export type ValidationNodeInfo = BaseValidationNodeInfo &
  StakingPoolInfo &
  StakeInfo;

interface CumulativeStake {
  total: BN;
  networkHolderIndex: number;
}

export interface NodeStats {
  validatorsCount: number;
  onlineNodesCount: number;
  proposalsCount: number;
}
