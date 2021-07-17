const autobahn = require("autobahn");
const BN = require("bn.js");
const geoip = require("geoip-lite");
const { sha256 } = require("js-sha256");

const aggregations = require("./aggregations");
const stats = require("./stats");
const models = require("../models");

const {
  wampNearNetworkName,
  wampNearExplorerUrl,
  wampNearExplorerBackendSecret,
  nearLockupAccountIdSuffix,
} = require("./config");

const { nearRpc } = require("./near");

const wampHandlers = {};

// node
wampHandlers["node-telemetry"] = async ([nodeInfo]) => {
  let geo = geoip.lookup(nodeInfo.ip_address);
  if (geo) {
    nodeInfo.latitude = geo.ll[0];
    nodeInfo.longitude = geo.ll[1];
    nodeInfo.city = geo.city;
  } else {
    console.warn("Node Telemetry failed to lookup geoIP for ", nodeInfo);
  }
  return saveNodeIntoDatabase(nodeInfo);
};

const saveNodeIntoDatabase = async (nodeInfo) => {
  if (!nodeInfo.hasOwnProperty("agent")) {
    // This seems to be an old format, and all our nodes should support the new
    // Telemetry format as of 2020-04-14, so we just ignore those old Telemetry
    // reports.
    return;
  }
  return await models.Node.upsert({
    ipAddress: nodeInfo.ip_address,
    latitude: nodeInfo.latitude,
    longitude: nodeInfo.longitude,
    city: nodeInfo.city,
    lastSeen: Date.now(),
    nodeId: nodeInfo.chain.node_id,
    moniker: nodeInfo.chain.account_id,
    accountId: nodeInfo.chain.account_id,
    lastHeight: nodeInfo.chain.latest_block_height,
    peerCount: nodeInfo.chain.num_peers,
    isValidator: nodeInfo.chain.is_validator,
    lastHash: nodeInfo.chain.latest_block_hash,
    signature: nodeInfo.signature || "",
    agentName: nodeInfo.agent.name,
    agentVersion: nodeInfo.agent.version,
    agentBuild: nodeInfo.agent.build,
    status: nodeInfo.chain.status,
  });
};

// select query directly to database && indexer
wampHandlers["select"] = async ([query, replacements]) => {
  return await models.sequelizeLegacySyncBackendReadOnly.query(query, {
    replacements,
    type: models.Sequelize.QueryTypes.SELECT,
  });
};

wampHandlers["select:INDEXER_BACKEND"] = async ([query, replacements]) => {
  return await models.sequelizeIndexerBackendReadOnly.query(query, {
    replacements,
    type: models.Sequelize.QueryTypes.SELECT,
  });
};

// rpc endpoint
wampHandlers["nearcore-view-account"] = async ([accountId]) => {
  return await nearRpc.sendJsonRpc("query", {
    request_type: "view_account",
    finality: "final",
    account_id: accountId,
  });
};

wampHandlers["nearcore-view-access-key-list"] = async ([accountId]) => {
  return await nearRpc.sendJsonRpc("query", {
    request_type: "view_access_key_list",
    finality: "final",
    account_id: accountId,
  });
};

wampHandlers["nearcore-tx"] = async ([transactionHash, accountId]) => {
  return await nearRpc.sendJsonRpc("EXPERIMENTAL_tx_status", [
    transactionHash,
    accountId,
  ]);
};

wampHandlers["nearcore-final-block"] = async () => {
  return await nearRpc.sendJsonRpc("block", { finality: "final" });
};

wampHandlers["nearcore-status"] = async () => {
  return await nearRpc.sendJsonRpc("status");
};

wampHandlers["nearcore-validators"] = async () => {
  return await nearRpc.sendJsonRpc("validators", [null]);
};

// genesis configuration
wampHandlers["nearcore-genesis-protocol-configuration"] = async ([blockId]) => {
  return await nearRpc.sendJsonRpc("block", { block_id: blockId });
};

wampHandlers["get-latest-circulating-supply"] = async () => {
  return aggregations.getCirculatingSupply();
};

wampHandlers["get-account-details"] = async ([accountId]) => {
  function generateLockupAccountIdFromAccountId(accountId) {
    // copied from https://github.com/near/near-wallet/blob/f52a3b1a72b901d87ab2c9cee79770d697be2bd9/src/utils/wallet.js#L601
    return (
      sha256(Buffer.from(accountId)).substring(0, 40) +
      "." +
      nearLockupAccountIdSuffix
    );
  }

  function ignore_if_does_not_exist(error) {
    if (
      typeof error.message === "string" &&
      (error.message.includes("doesn't exist") ||
        error.message.includes("does not exist") ||
        error.message.includes("MethodNotFound"))
    ) {
      return null;
    }
    throw error;
  }

  let lockupAccountId;
  if (accountId.endsWith(`.${nearLockupAccountIdSuffix}`)) {
    lockupAccountId = accountId;
  } else {
    lockupAccountId = generateLockupAccountIdFromAccountId(accountId);
  }

  const [
    accountInfo,
    lockupAccountInfo,
    lockupLockedBalance,
    lockupStakingPoolAccountId,
    genesisConfig,
  ] = await Promise.all([
    nearRpc
      .sendJsonRpc("query", {
        request_type: "view_account",
        finality: "final",
        account_id: accountId,
      })
      .catch(ignore_if_does_not_exist),
    accountId !== lockupAccountId
      ? nearRpc
          .sendJsonRpc("query", {
            request_type: "view_account",
            finality: "final",
            account_id: lockupAccountId,
          })
          .catch(ignore_if_does_not_exist)
      : null,
    nearRpc
      .callViewMethod(lockupAccountId, "get_locked_amount", {})
      .then((balance) => new BN(balance))
      .catch(ignore_if_does_not_exist),
    nearRpc
      .callViewMethod(lockupAccountId, "get_staking_pool_account_id", {})
      .catch(ignore_if_does_not_exist),
    nearRpc.sendJsonRpc("EXPERIMENTAL_genesis_config", {}),
  ]);

  if (accountInfo === null) {
    return null;
  }

  const storageUsage = new BN(accountInfo.storage_usage);
  const storageAmountPerByte = new BN(
    genesisConfig.runtime_config.storage_amount_per_byte
  );
  const stakedBalance = new BN(accountInfo.locked);
  const nonStakedBalance = new BN(accountInfo.amount);
  const minimumBalance = storageAmountPerByte.mul(storageUsage);
  const availableBalance = nonStakedBalance
    .add(stakedBalance)
    .sub(BN.max(stakedBalance, minimumBalance));

  const accountDetails = {
    storageUsage: storageUsage.toString(),
    stakedBalance: stakedBalance.toString(),
    nonStakedBalance: nonStakedBalance.toString(),
    minimumBalance: minimumBalance.toString(),
    availableBalance: availableBalance.toString(),
  };

  let lockupDelegatedToStakingPoolBalance;
  if (lockupStakingPoolAccountId) {
    lockupDelegatedToStakingPoolBalance = await nearRpc
      .callViewMethod(lockupStakingPoolAccountId, "get_account_total_balance", {
        account_id: lockupAccountId,
      })
      .then((balance) => new BN(balance))
      .catch(ignore_if_does_not_exist);
  }

  let totalBalance = stakedBalance.add(nonStakedBalance);
  // The following section could be compressed into more complicated checks,
  // but it is left in a readable form.
  if (accountId !== lockupAccountId && !lockupAccountInfo) {
    // It is a regular account without lockup
  } else if (accountId !== lockupAccountId) {
    // It is a regular account with lockup
    const lockupStakedBalance = new BN(lockupAccountInfo.locked);
    const lockupNonStakedBalance = new BN(lockupAccountInfo.amount);
    let lockupTotalBalance = lockupStakedBalance.add(lockupNonStakedBalance);
    if (lockupDelegatedToStakingPoolBalance) {
      console.log(lockupTotalBalance, lockupDelegatedToStakingPoolBalance);
      lockupTotalBalance.iadd(lockupDelegatedToStakingPoolBalance);
    }
    totalBalance.iadd(lockupTotalBalance);
    accountDetails.lockupAccountId = lockupAccountId;
    accountDetails.lockupTotalBalance = lockupTotalBalance.toString();
    accountDetails.lockupLockedBalance = lockupLockedBalance.toString();
    accountDetails.lockupUnlockedBalance = lockupTotalBalance
      .sub(lockupLockedBalance)
      .toString();
  } else if (accountId === lockupAccountId) {
    // It is a lockup account
    if (lockupDelegatedToStakingPoolBalance) {
      totalBalance.iadd(lockupDelegatedToStakingPoolBalance);
    }
  }

  accountDetails.totalBalance = totalBalance.toString();

  return accountDetails;
};

// stats part
// transaction related
wampHandlers["transactions-count-aggregated-by-date"] = async () => {
  return await stats.getTransactionsByDate();
};

wampHandlers["teragas-used-aggregated-by-date"] = async () => {
  return await stats.getTeragasUsedByDate();
};

wampHandlers["deposit-amount-aggregated-by-date"] = async () => {
  return await stats.getDepositAmountByDate();
};

// accounts
wampHandlers["new-accounts-count-aggregated-by-date"] = async () => {
  return await stats.getNewAccountsCountByDate();
};

wampHandlers["live-accounts-count-aggregated-by-date"] = async () => {
  return await stats.getLiveAccountsCountByDate();
};

wampHandlers["active-accounts-count-aggregated-by-week"] = async () => {
  return await stats.getActiveAccountsCountByWeek();
};

wampHandlers["active-accounts-count-aggregated-by-date"] = async () => {
  return await stats.getActiveAccountsCountByDate();
};

wampHandlers["active-accounts-list"] = async () => {
  return await stats.getActiveAccountsList();
};

// contracts
wampHandlers["new-contracts-count-aggregated-by-date"] = async () => {
  return await stats.getNewContractsCountByDate();
};

wampHandlers[
  "unique-deployed-contracts-count-aggregate-by-date"
] = async () => {
  return await stats.getUniqueDeployedContractsCountByDate();
};

wampHandlers["active-contracts-count-aggregated-by-date"] = async () => {
  return await stats.getActiveContractsCountByDate();
};

wampHandlers["active-contracts-list"] = async () => {
  return await stats.getActiveContractsList();
};

// partner part
wampHandlers["partner-total-transactions-count"] = async () => {
  return await stats.getPartnerTotalTransactionsCount();
};

wampHandlers["partner-first-3-month-transactions-count"] = async () => {
  return await stats.getPartnerFirst3MonthTransactionsCount();
};

wampHandlers["partner-unique-user-amount"] = async () => {
  return await stats.getPartnerUniqueUserAmount();
};

wampHandlers["nearcore-genesis-accounts-count"] = async () => {
  return await stats.getGenesisAccountsCount();
};

wampHandlers["nearcore-total-fee-count"] = async ([daysCount]) => {
  return await stats.getTotalFee(daysCount);
};

wampHandlers["nearcore-total-fee-count-per-days"] = async ([daysCount]) => {
  return await stats.getTotalFeePerDays(daysCount);
};

// set up wamp
function setupWamp() {
  const wamp = new autobahn.Connection({
    realm: "near-explorer",
    transports: [
      {
        url: wampNearExplorerUrl,
        type: "websocket",
      },
    ],
    authmethods: ["ticket"],
    authid: "near-explorer-backend",
    onchallenge: (session, method, extra) => {
      if (method === "ticket") {
        return wampNearExplorerBackendSecret;
      }
      throw "WAMP authentication error: unsupported challenge method";
    },
    retry_if_unreachable: true,
    max_retries: Number.MAX_SAFE_INTEGER,
    max_retry_delay: 10,
  });

  wamp.onopen = async (session) => {
    console.log("WAMP connection is established. Waiting for commands...");

    for (const [name, handler] of Object.entries(wampHandlers)) {
      const uri = `com.nearprotocol.${wampNearNetworkName}.explorer.${name}`;
      try {
        await session.register(uri, handler);
      } catch (error) {
        console.error(`Failed to register "${uri}" handler due to:`, error);
        wamp.close();
        setTimeout(() => {
          wamp.open();
        }, 1000);
        return;
      }
    }
  };

  wamp.onclose = (reason) => {
    console.log(
      "WAMP connection has been closed (check WAMP router availability and credentials):",
      reason
    );
  };

  return wamp;
}

const wampPublish = (topic, namedArgs, wamp) => {
  const uri = `com.nearprotocol.${wampNearNetworkName}.explorer.${topic}`;
  wamp.session.publish(uri, [], namedArgs);
};

exports.setupWamp = setupWamp;
exports.wampPublish = wampPublish;
