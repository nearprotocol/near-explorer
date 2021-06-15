const moment = require("moment");

const models = require("../models");

const {
  isLegacySyncBackendEnabled,
  isIndexerBackendEnabled,
  backupDbOnReset,
  regularCheckGenesisInterval,
  regularSyncNewNearcoreStateInterval,
  regularSyncMissingNearcoreStateInterval,
  regularPublishFinalityStatusInterval,
  regularQueryStatsInterval,
  regularPublishNetworkInfoInterval,
  regularFetchStakingPoolsInfoInterval,
  regularStatsInterval,
  regularCalculateCirculatingSupplyInterval,
  wampNearNetworkName,
} = require("./config");

const { DS_LEGACY_SYNC_BACKEND, DS_INDEXER_BACKEND } = require("./consts");

const { nearRpc, queryFinalBlock, queryEpochStats } = require("./near");

const {
  syncNewNearcoreState,
  syncMissingNearcoreState,
  syncGenesisState,
} = require("./sync");

const { setupWamp, wampPublish } = require("./wamp");

const {
  extendWithTelemetryInfo,
  queryOnlineNodes,
  pickOnlineValidatingNode,
  queryNodeValidators,
  getSyncedGenesis,
  queryDashboardBlocksStats,
  queryDashboardTransactionsStats,
} = require("./db-utils");

const {
  aggregateTeragasUsedByDate,
  aggregateTransactionsCountByDate,
  aggregateNewAccountsCountByDate,
  aggregateDeletedAccountsCountByDate,
  aggregateNewContractsCountByDate,
  aggregateUniqueDeployedContractsCountByDate,
  aggregateActiveContractsCountByDate,
  aggregateActiveAccountsCountByDate,
  aggregateActiveAccountsCountByWeek,
  aggregateActiveAccountsList,
  aggregateActiveContractsList,
  aggregatePartnerTotalTransactionsCount,
  aggregatePartnerFirst3MonthTransactionsCount,
  aggregateDepositAmountByDate,
  aggregateParterUniqueUserAmount,
  aggregateLiveAccountsCountByDate,
} = require("./stats");

const { calculateCirculatingSupply } = require("./aggregations");

let currentValidators = [];
let currentProposals = [];
let stakingPoolsInfo = new Map();
let currentPools = [];

async function startLegacySync() {
  console.log("Starting NEAR Explorer legacy syncing service...");

  let genesisHeight, genesisTime, genesisChainId;

  const SyncGenesisState = async () => {
    console.log("Starting Genesis state sync...");
    try {
      await syncGenesisState();
    } catch (error) {
      console.warn("Genesis state crashed due to:", error);
    }
  };

  const syncedGenesis = await getSyncedGenesis();
  if (syncedGenesis) {
    genesisHeight = syncedGenesis.genesisHeight;
    genesisTime = syncedGenesis.genesisTime;
    genesisChainId = syncedGenesis.chainId;
  } else {
    setTimeout(SyncGenesisState, 0);
  }

  const regularCheckGenesis = async () => {
    console.log("Starting regular Genesis check...");
    try {
      const genesisConfig = await nearRpc.sendJsonRpc(
        "EXPERIMENTAL_genesis_config"
      );
      const genesisConfigGenesisTime = moment(
        genesisConfig.genesis_time
      ).valueOf();
      if (
        (genesisHeight &&
          genesisHeight !== genesisConfig.genesis_height.toString()) ||
        (genesisTime && genesisTime !== genesisConfigGenesisTime) ||
        (genesisChainId && genesisChainId !== genesisConfig.chain_id)
      ) {
        console.log(
          `Genesis has changed (height ${genesisHeight} -> ${genesisConfig.genesis_height}; \
          time ${genesisTime} -> ${genesisConfigGenesisTime}; chain id ${genesisChainId} -> \
          ${genesisConfig.chain_id}). We are resetting the database and shutting down the backend \
          to let it auto-start and sync from scratch.`
        );
        models.resetDatabase({ saveBackup: backupDbOnReset });
        process.exit(0);
      }
      genesisHeight = genesisConfig.genesis_height.toString();
      genesisTime = genesisConfigGenesisTime;
      console.log("Regular Genesis check is completed.");
    } catch (error) {
      console.warn("Regular Genesis check crashed due to:", error);
    }
    setTimeout(regularCheckGenesis, regularCheckGenesisInterval);
  };
  setTimeout(regularCheckGenesis, 0);

  const regularSyncNewNearcoreState = async () => {
    console.log("Starting regular new nearcore state sync...");
    try {
      await syncNewNearcoreState();
      console.log("Regular new nearcore state sync is completed.");
    } catch (error) {
      console.warn("Regular new nearcore state sync crashed due to:", error);
    }
    setTimeout(
      regularSyncNewNearcoreState,
      regularSyncNewNearcoreStateInterval
    );
  };
  setTimeout(regularSyncNewNearcoreState, 0);

  const regularSyncMissingNearcoreState = async () => {
    console.log("Starting regular missing nearcore state sync...");
    try {
      await syncMissingNearcoreState();
      console.log("Regular missing nearcore state sync is completed.");
    } catch (error) {
      console.warn(
        "Regular missing nearcore state sync crashed due to:",
        error
      );
    }
    setTimeout(
      regularSyncMissingNearcoreState,
      regularSyncMissingNearcoreStateInterval
    );
  };
  setTimeout(
    regularSyncMissingNearcoreState,
    regularSyncMissingNearcoreStateInterval
  );
}

function getDataSourceSpecificTopicName(baseTopicName, dataSource) {
  const defaultBackend = DS_LEGACY_SYNC_BACKEND;
  if (dataSource === defaultBackend) {
    return baseTopicName;
  }
  return `${baseTopicName}:${dataSource}`;
}

function startDataSourceSpecificJobs(wamp, dataSource) {
  const regularCheckDataStats = async () => {
    console.log(`Starting regular data stats check from ${dataSource}...`);
    try {
      if (wamp.session) {
        const [blocksStats, transactionsStats] = await Promise.all([
          queryDashboardBlocksStats({ dataSource }),
          queryDashboardTransactionsStats({ dataSource }),
        ]);
        wampPublish(
          getDataSourceSpecificTopicName("chain-blocks-stats", dataSource),
          blocksStats,
          wamp
        );
        wampPublish(
          getDataSourceSpecificTopicName(
            "chain-transactions-stats",
            dataSource
          ),
          transactionsStats,
          wamp
        );
      }
      console.log(`Regular data stats check from ${dataSource} is completed.`);
    } catch (error) {
      console.warn(
        `Regular data stats check from ${dataSource} is crashed due to:`,
        error
      );
    }
    setTimeout(regularCheckDataStats, regularQueryStatsInterval);
  };
  setTimeout(regularCheckDataStats, 0);
}

function startStatsAggregation() {
  const regularStatsAggregate = async () => {
    console.log("Starting Regular Stats Aggregation...");
    try {
      //stats part
      // transactions related
      await aggregateTransactionsCountByDate();
      await aggregateTeragasUsedByDate();
      await aggregateDepositAmountByDate();

      // account
      await aggregateNewAccountsCountByDate();
      await aggregateDeletedAccountsCountByDate();
      await aggregateLiveAccountsCountByDate();
      await aggregateActiveAccountsCountByDate();
      await aggregateActiveAccountsCountByWeek();
      await aggregateActiveAccountsList();

      // contract
      await aggregateNewContractsCountByDate();
      await aggregateActiveContractsCountByDate();
      await aggregateUniqueDeployedContractsCountByDate();
      await aggregateActiveContractsList();

      //partner part
      await aggregatePartnerTotalTransactionsCount();
      await aggregatePartnerFirst3MonthTransactionsCount();
      await aggregateParterUniqueUserAmount();
    } catch (error) {
      console.warn("Regular Stats Aggregation is crashed due to:", error);
    }
    setTimeout(regularStatsAggregate, regularStatsInterval);
  };
  setTimeout(regularStatsAggregate, 0);
}

function startRegularCalculationCirculatingSupply() {
  const regularCalculateCirculatingSupply = async () => {
    console.log(`Starting regular calculation of circulating supply...`);
    try {
      await calculateCirculatingSupply();
    } catch (error) {
      console.warn(
        "regular calculation of circulating supply is crashed due to:",
        error
      );
    }
    setTimeout(
      regularCalculateCirculatingSupply,
      regularCalculateCirculatingSupplyInterval
    );
  };
  setTimeout(regularCalculateCirculatingSupply, 0);
}

async function main() {
  console.log("Starting Explorer backend...");

  await models.sequelizeLegacySyncBackend.sync();

  const wamp = setupWamp();
  console.log("Starting WAMP worker...");
  wamp.open();

  // regularly publish the latest information about the height and timestamp of the final block
  const regularPublishFinalityStatus = async () => {
    console.log("Starting regular final timestamp check...");
    try {
      if (wamp.session) {
        const finalBlock = await queryFinalBlock();
        wampPublish(
          "finality-status",
          {
            finalBlockTimestampNanosecond: finalBlock.header.timestamp_nanosec,
            finalBlockHeight: finalBlock.header.height,
          },
          wamp
        );
      }
      console.log("Regular final timestamp check is completed.");
    } catch (error) {
      console.warn("Regular final timestamp check  crashed due to:", error);
    }
    setTimeout(
      regularPublishFinalityStatus,
      regularPublishFinalityStatusInterval
    );
  };
  setTimeout(regularPublishFinalityStatus, 0);

  // regularly publish information about validators, proposals, staking pools, and online nodes
  const regularPublishNetworkInfo = async () => {
    console.log("Starting regular network info publishing...");
    try {
      if (wamp.session) {
        const epochStats = await queryEpochStats();
        currentValidators = await extendWithTelemetryInfo(
          epochStats.currentValidators
        );
        currentProposals = await extendWithTelemetryInfo(
          epochStats.currentProposals
        );
        const onlineValidatingNodes = pickOnlineValidatingNode(
          currentValidators
        );
        const onlineNodes = await queryOnlineNodes();

        currentPools = await extendWithTelemetryInfo(
          await queryNodeValidators()
        );

        if (stakingPoolsInfo) {
          currentValidators.forEach((validator) => {
            const stakingPoolInfo = stakingPoolsInfo.get(validator.account_id);
            if (stakingPoolInfo) {
              validator.fee = stakingPoolInfo.fee;
              validator.delegatorsCount = stakingPoolInfo.delegatorsCount;
              validator.stake = stakingPoolInfo.stake;
            }
          });
          currentProposals.forEach((validator) => {
            const stakingPoolInfo = stakingPoolsInfo.get(validator.account_id);
            if (stakingPoolInfo) {
              validator.fee = stakingPoolInfo.fee;
              validator.delegatorsCount = stakingPoolInfo.delegatorsCount;
            }
          });
          currentPools.forEach((validator) => {
            const stakingPoolInfo = stakingPoolsInfo.get(validator.account_id);
            if (stakingPoolInfo) {
              validator.fee = stakingPoolInfo.fee;
              validator.delegatorsCount = stakingPoolInfo.delegatorsCount;
              validator.stake = stakingPoolInfo.stake;
            }
          });
        }

        wampPublish(
          "nodes",
          {
            onlineNodes,
            currentValidators,
            currentProposals,
            onlineValidatingNodes,
            currentPools,
          },
          wamp
        );
        wampPublish(
          "network-stats",
          {
            currentValidatorsCount: currentValidators.length,
            currentProposalsCount: currentProposals.length,
            currentPoolsCount: currentPools.length,
            onlineNodesCount: onlineNodes.length,
            epochLength: epochStats.epochLength,
            epochStartHeight: epochStats.epochStartHeight,
            epochProtocolVersion: epochStats.epochProtocolVersion,
            totalStake: epochStats.totalStake,
            seatPrice: epochStats.seatPrice,
            genesisTime: epochStats.genesisTime,
            genesisHeight: epochStats.genesisHeight,
          },
          wamp
        );
      }
      console.log("Regular regular network info publishing is completed.");
    } catch (error) {
      console.warn(
        "Regular regular network info publishing crashed due to:",
        error
      );
    }
    setTimeout(regularPublishNetworkInfo, regularPublishNetworkInfoInterval);
  };
  setTimeout(regularPublishNetworkInfo, 0);

  // Periodic check of validators' staking pool fee and delegators count
  const regularFetchStakingPoolsInfo = async () => {
    try {
      const stakingPoolsAccountId = new Set([
        ...currentValidators.map(({ account_id }) => account_id),
        ...currentProposals.map(({ account_id }) => account_id),
        ...currentPools.map(({ account_id }) => account_id),
      ]);

      for (const stakingPoolAccountId of stakingPoolsAccountId) {
        try {
          const account = await nearRpc.query({
            request_type: "view_account",
            account_id: stakingPoolAccountId,
            finality: "final",
          });
          if (account.code_hash === "11111111111111111111111111111111") {
            stakingPoolsInfo.set(stakingPoolAccountId, {
              fee: null,
              delegatorsCount: null,
            });
          } else {
            const fee = await nearRpc.callViewMethod(
              stakingPoolAccountId,
              "get_reward_fee_fraction",
              {}
            );
            const delegatorsCount = await nearRpc.callViewMethod(
              stakingPoolAccountId,
              "get_number_of_accounts",
              {}
            );
            const stake = await nearRpc.callViewMethod(
              stakingPoolAccountId,
              "get_total_staked_balance",
              {}
            );
            stakingPoolsInfo.set(stakingPoolAccountId, {
              fee,
              delegatorsCount,
              stake,
            });
          }
        } catch (error) {
          console.warn(
            `Regular regular fetching staking pool ${stakingPoolAccountId} info crashed due to:`,
            error
          );
        }
      }
    } catch (error) {
      console.warn(
        "Regular regular fetching staking pools info crashed due to:",
        error
      );
    }
    setTimeout(
      regularFetchStakingPoolsInfo,
      regularFetchStakingPoolsInfoInterval
    );
  };
  setTimeout(regularFetchStakingPoolsInfo, 0);

  if (isLegacySyncBackendEnabled) {
    await startLegacySync();
    await startDataSourceSpecificJobs(wamp, DS_LEGACY_SYNC_BACKEND);
  }
  if (isIndexerBackendEnabled) {
    await startDataSourceSpecificJobs(wamp, DS_INDEXER_BACKEND);
    await startStatsAggregation();
  }

  if (wampNearNetworkName === "mainnet") {
    startRegularCalculationCirculatingSupply();
  }
}

main();
