exports.nearRpcUrl = process.env.NEAR_RPC_URL || "http://localhost:3030";

exports.debugLogs =
  (process.env.NEAR_DEBUG_LOGS || "TRUE").toUpperCase() !== "FALSE";

exports.isLegacySyncBackendEnabled =
  (process.env.NEAR_IS_LEGACY_SYNC_BACKEND_ENABLED || "TRUE").toUpperCase() !==
  "FALSE";

exports.isIndexerBackendEnabled =
  (process.env.NEAR_IS_INDEXER_BACKEND_ENABLED || "FALSE").toUpperCase() !==
  "FALSE";

exports.syncFetchQueueSize =
  parseInt(process.env.NEAR_SYNC_FETCH_QUEUE_SIZE) || 3;

exports.syncSaveQueueSize =
  parseInt(process.env.NEAR_SYNC_SAVE_QUEUE_SIZE) || 10;

exports.syncNewBlocksHorizon =
  parseInt(process.env.NEAR_SYNC_NEW_BLOCKS_HORIZON) || 100;

exports.bulkDbUpdateSize =
  parseInt(process.env.NEAR_SYNC_BULK_DB_UPDATE_SIZE) || 10;

exports.backupDbOnReset =
  (process.env.NEAR_BACKUP_DB_ON_RESET || "TRUE").toUpperCase() !== "FALSE";

exports.regularCheckGenesisInterval =
  parseInt(process.env.NEAR_REGULAR_CHECK_GENESIS_INTERVAL) || 60000;

exports.regularSyncNewNearcoreStateInterval =
  parseInt(process.env.NEAR_REGULAR_SYNC_NEW_NEARCORE_STATE_INTERVAL) || 5000;

exports.regularSyncMissingNearcoreStateInterval =
  parseInt(process.env.NEAR_REGULAR_SYNC_MISSING_NEARCORE_STATE_INTERVAL) ||
  60000;

exports.regularPublishFinalityStatusInterval =
  parseInt(process.env.NEAR_REGULAR_PUBLISH_FINALITY_STATUS_INTERVAL) || 1000;

exports.regularQueryStatsInterval =
  parseInt(process.env.NEAR_REGULAR_QUERY_STATS_INTERVAL) || 1000;

exports.regularPublishNetworkInfoInterval =
  parseInt(process.env.NEAR_REGULAR_PUBLISH_NETWORK_INFO_INTERVAL) || 1000;

exports.regularFetchStakingPoolsInfoInterval =
  parseInt(process.env.NEAR_REGULAR_FETCH_STAKING_POOLS_INFO_INTERVAL) || 15000;

exports.regularStatsInterval =
  parseInt(process.env.NEAR_REGULAR_STATS_INTERVAL) || 3600000;

exports.regularCalculateCirculatingSupplyInterval =
  parseInt(process.env.NEAR_REGULAR_CALCULATE_CIRCULATING_SUPPLY) ||
  3600000 * 24;

exports.wampNearNetworkName =
  process.env.WAMP_NEAR_NETWORK_NAME || "localhostnet";

exports.wampNearExplorerUrl =
  process.env.WAMP_NEAR_EXPLORER_URL || "ws://localhost:8080/ws";

exports.wampNearExplorerBackendSecret =
  process.env.WAMP_NEAR_EXPLORER_BACKEND_SECRET || "back";

exports.genesisRecordsUrl = process.env.NEAR_GENESIS_RECORDS_URL;

exports.nearLockupAccountIdSuffix =
  process.env.NEAR_LOCKUP_ACCOUNT_SUFFIX || "lockup.near";

exports.nearPoolAccountSuffix =
  process.env.WAMP_NEAR_NETWORK_NAME === "mainnet"
    ? ".poolv1.near"
    : process.env.WAMP_NEAR_NETWORK_NAME === "testnet"
    ? ".f863973.m0"
    : process.env.WAMP_NEAR_NETWORK_NAME === "guildnet"
    ? ".stake.guildnet"
    : process.env.NEAR_POOL_ACCOUNT_SUFFIX;
