import BN from "bn.js";
import React, { createContext, useEffect, useState } from "react";
import { ExplorerApi } from "../libraries/explorer-wamp/index";
import BlocksApi, {
  DetailedBlockInfo,
} from "../libraries/explorer-wamp/blocks";

export interface NetworkStats {
  currentValidatorsCount: number;
  currentProposalsCount: number;
  currentPoolsCount: number;
  onlineNodesCount: number;
  epochLength: number;
  epochStartHeight: number;
  epochProtocolVersion: number;
  totalStake: BN;
  seatPrice: BN;
  genesisTime: string;
  genesisHeight: number;
  genesisAccountsCount: number;
}

export interface FinalityStatus {
  finalBlockHeight: number;
  finalBlockTimestampNanosecond: BN;
}

export interface NetworkStatsContextProps {
  networkStats?: NetworkStats;
  finalityStatus?: FinalityStatus;
  epochStartBlock?: DetailedBlockInfo;
}

const NetworkStatsContext = createContext<NetworkStatsContextProps>({});

export interface Props {
  children: React.Component | React.ReactNode;
}

const NetworkStatsProvider = (props: Props) => {
  const [networkStats, dispatchNetworkStats] = useState<NetworkStats>();
  const [
    epochStartBlock,
    dispatchEpochStartBlock,
  ] = useState<DetailedBlockInfo>();
  const [finalityStatus, dispatchFinalityStatus] = useState<FinalityStatus>();

  const storeNetworkStats = (_positionalArgs: any, namedArgs: any) => {
    dispatchNetworkStats({
      currentValidatorsCount: namedArgs.currentValidatorsCount,
      currentProposalsCount: namedArgs.currentProposalsCount,
      currentPoolsCount: namedArgs.currentPoolsCount,
      onlineNodesCount: namedArgs.onlineNodesCount,
      epochLength: namedArgs.epochLength,
      epochStartHeight: namedArgs.epochStartHeight,
      epochProtocolVersion: namedArgs.epochProtocolVersion,
      seatPrice: new BN(namedArgs.seatPrice),
      totalStake: new BN(namedArgs.totalStake),
      genesisTime: namedArgs.genesisTime,
      genesisHeight: namedArgs.genesisHeight,
      genesisAccountsCount: namedArgs.genesisAccountsCount,
    });
  };

  const storeFinalityStatus = (_positionalArgs: any, namedArgs: any) => {
    dispatchFinalityStatus({
      finalBlockTimestampNanosecond: new BN(
        namedArgs.finalBlockTimestampNanosecond
      ),
      finalBlockHeight: namedArgs.finalBlockHeight,
    });
  };

  useEffect(() => {
    const explorerApi = new ExplorerApi();
    explorerApi.subscribe("network-stats", storeNetworkStats);
    explorerApi.subscribe("finality-status", storeFinalityStatus);

    return () => {
      explorerApi.unsubscribe("network-stats");
      explorerApi.unsubscribe("finality-status");
    };
  }, []);

  useEffect(() => {
    if (networkStats) {
      new BlocksApi()
        .getBlockInfo(networkStats.epochStartHeight)
        .then((blockInfo: any) => {
          dispatchEpochStartBlock(blockInfo);
          return;
        })
        .catch((err: any) => console.error(err));
    }
  }, [networkStats?.epochStartHeight]);

  return (
    <NetworkStatsContext.Provider
      value={{
        networkStats,
        epochStartBlock,
        finalityStatus,
      }}
    >
      {props.children}
    </NetworkStatsContext.Provider>
  );
};

const NetworkStatsConsumer = NetworkStatsContext.Consumer;

export { NetworkStatsConsumer, NetworkStatsContext };

export default NetworkStatsProvider;
