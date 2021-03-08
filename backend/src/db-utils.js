const { DS_INDEXER_BACKEND, PARTNER_LIST } = require("./consts");
const models = require("../models");
const BN = require("bn.js");

const query = async ([query, replacements], { dataSource }) => {
  const sequelize =
    dataSource === DS_INDEXER_BACKEND
      ? models.sequelizeIndexerBackendReadOnly
      : models.sequelizeLegacySyncBackendReadOnly;
  return await sequelize.query(query, {
    replacements,
    type: models.Sequelize.QueryTypes.SELECT,
  });
};

const querySingleRow = async (args, options) => {
  const result = await query(args, options || {});
  return result[0];
};

const queryRows = async (args, options) => {
  return await query(args, options || {});
};

const getSyncedGenesis = async (options) => {
  return await querySingleRow(
    [
      `SELECT genesis_time as genesisTime, genesis_height as genesisHeight, chain_id as chainId FROM genesis`,
    ],
    options
  );
};

const addNodeInfo = async (nodes) => {
  const accountArray = nodes.map((node) => node.account_id);
  let nodesInfo = await queryRows([
    `SELECT ip_address as ipAddress, account_id as accountId, node_id as nodeId,
        last_seen as lastSeen, last_height as lastHeight,status,
        agent_name as agentName, agent_version as agentVersion, agent_build as agentBuild,
        latitude, longitude, city
              FROM nodes
              WHERE account_id IN (:accountArray)
              ORDER BY node_id DESC
          `,
    {
      accountArray,
    },
  ]);
  let nodeMap = new Map();
  if (nodesInfo && nodesInfo.length > 0) {
    for (let i = 0; i < nodesInfo.length; i++) {
      const { accountId, ...nodeInfo } = nodesInfo[i];
      nodeMap.set(accountId, nodeInfo);
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].nodeInfo = nodeMap.get(nodes[i].account_id);
  }

  return nodes;
};

const pickOnlineValidatingNode = (nodes) => {
  let onlineValidatingNodes = nodes.filter(
    (node) => node.nodeInfo !== undefined
  );
  onlineValidatingNodes = onlineValidatingNodes.map((node) => {
    return { accountId: node.account_id, ...node.nodeInfo };
  });
  return onlineValidatingNodes;
};

const queryOnlineNodes = async () => {
  return await queryRows([
    `SELECT ip_address as ipAddress, account_id as accountId, node_id as nodeId,
      last_seen as lastSeen, last_height as lastHeight,status,
      agent_name as agentName, agent_version as agentVersion, agent_build as agentBuild,
      latitude, longitude, city
            FROM nodes
            WHERE last_seen > (strftime('%s','now') - 60) * 1000
            ORDER BY is_validator ASC, node_id DESC
        `,
  ]);
};

//new query for new dashboard
const queryDashboardBlocksStats = async (options) => {
  async function queryLatestBlockHeight({ dataSource }) {
    let query;
    if (dataSource === DS_INDEXER_BACKEND) {
      query = `SELECT block_height FROM blocks ORDER BY block_height DESC LIMIT 1`;
    } else {
      query = `SELECT height AS block_height FROM blocks ORDER BY height DESC LIMIT 1`;
    }
    return (await querySingleRow([query], { dataSource })).block_height;
  }

  async function queryLatestGasPrice({ dataSource }) {
    let query;
    if (dataSource === DS_INDEXER_BACKEND) {
      query = `SELECT gas_price FROM blocks ORDER BY block_height DESC LIMIT 1`;
    } else {
      query = `SELECT gas_price FROM blocks ORDER BY height DESC LIMIT 1`;
    }
    return (await querySingleRow([query], { dataSource })).gas_price;
  }

  async function queryRecentBlockProductionSpeed({ dataSource }) {
    let query;
    if (dataSource === DS_INDEXER_BACKEND) {
      query = `SELECT block_timestamp AS latest_block_timestamp FROM blocks ORDER BY block_timestamp DESC LIMIT 1`;
    } else {
      query = `SELECT timestamp AS latest_block_timestamp FROM blocks ORDER BY timestamp DESC LIMIT 1`;
    }
    const latestBlockTimestampOrNone = await querySingleRow([query], {
      dataSource,
    });
    if (!latestBlockTimestampOrNone) {
      return 0;
    }
    const {
      latest_block_timestamp: latestBlockTimestamp,
    } = latestBlockTimestampOrNone;
    const latestBlockTimestampBN = new BN(latestBlockTimestamp);
    const currentUnixTimeBN = new BN(Math.floor(new Date().getTime() / 1000));
    let latestBlockEpochTimeBN;
    if (dataSource === DS_INDEXER_BACKEND) {
      latestBlockEpochTimeBN = latestBlockTimestampBN.div(new BN("1000000000"));
    } else {
      latestBlockEpochTimeBN = latestBlockTimestampBN.divn(1000);
    }
    // If the latest block is older than 1 minute from now, we report 0
    if (currentUnixTimeBN.sub(latestBlockEpochTimeBN).gtn(60)) {
      return 0;
    }

    if (dataSource === DS_INDEXER_BACKEND) {
      query = `SELECT COUNT(*) AS blocks_count_60_seconds_before FROM blocks
        WHERE block_timestamp > (cast(:latestBlockTimestamp - 60 as bigint) * 1000 * 1000 * 1000)`;
    } else {
      query = `SELECT COUNT(*) AS blocks_count_60_seconds_before FROM blocks
        WHERE timestamp > (:latestBlockTimestamp - 60 * 1000)`;
    }
    const result = await querySingleRow(
      [
        query,
        {
          latestBlockTimestamp:
            dataSource == DS_INDEXER_BACKEND
              ? latestBlockEpochTimeBN.toNumber()
              : latestBlockEpochTimeBN.muln(1000).toNumber(),
        },
      ],
      {
        dataSource,
      }
    );
    if (!result || !result.blocks_count_60_seconds_before) {
      return 0;
    }
    return result.blocks_count_60_seconds_before / 60;
  }

  const [
    latestBlockHeight,
    latestGasPrice,
    recentBlockProductionSpeed,
  ] = await Promise.all([
    queryLatestBlockHeight(options),
    queryLatestGasPrice(options),
    queryRecentBlockProductionSpeed(options),
  ]);
  return {
    latestBlockHeight,
    latestGasPrice,
    recentBlockProductionSpeed,
  };
};

const queryDashboardTransactionsStats = async (options) => {
  async function queryTransactionsCountHistory({ dataSource }) {
    let query;
    if (dataSource === DS_INDEXER_BACKEND) {
      query = `SELECT date_trunc('day', to_timestamp(DIV(block_timestamp, 1000*1000*1000))) as date, count(transaction_hash) as total
                FROM transactions
                WHERE
                  block_timestamp > ((cast(EXTRACT(EPOCH FROM NOW()) as bigint) / (60 * 60 * 24) - 15) * 60 * 60 * 24 * 1000 * 1000 * 1000)
                  AND
                  block_timestamp < ((cast(EXTRACT(EPOCH FROM NOW()) as bigint) / (60 * 60 * 24)) * 60 * 60 * 24 * 1000 * 1000 * 1000)
                GROUP BY date
                ORDER BY date`;
    } else {
      query = `SELECT strftime('%Y-%m-%d',block_timestamp/1000,'unixepoch') as date, count(hash) as total
                FROM transactions
                WHERE
                  (block_timestamp/1000) > (strftime('%s','now') / (60 * 60 * 24) - 15) * 60 * 60 * 24
                  AND
                  (block_timestamp/1000) < (strftime('%s','now') / (60 * 60 * 24)) * 60 * 60 * 24
                GROUP BY date
                ORDER BY date`;
    }
    return (
      await queryRows([query], { dataSource })
    ).map(({ total, ...rest }) => ({ total: parseInt(total), ...rest }));
  }

  async function queryRecentTransactionsCount({ dataSource }) {
    let query;
    if (dataSource === DS_INDEXER_BACKEND) {
      query = `SELECT date_trunc('day', to_timestamp(DIV(block_timestamp, 1000*1000*1000) - (MOD(cast(EXTRACT(EPOCH FROM NOW()) as integer), (60 * 60 * 24))))) as date, count(transaction_hash) as total
                FROM transactions
                WHERE
                  block_timestamp > (cast(EXTRACT(EPOCH FROM NOW()) - 60 * 60 * 24 * 2 as bigint) * 1000 * 1000 * 1000)
                GROUP BY date
                ORDER BY date DESC`;
    } else {
      query = `SELECT strftime('%Y-%m-%d', block_timestamp/1000 - strftime('%s','now') % (60 * 60 * 24), 'unixepoch') as date, count(hash) as total
                FROM transactions
                WHERE
                  (block_timestamp/1000) > (strftime('%s','now') - 60 * 60 * 24 * 2)
                GROUP BY date
                ORDER BY date DESC`;
    }
    return (
      await queryRows([query], { dataSource })
    ).map(({ total, ...rest }) => ({ total: parseInt(total), ...rest }));
  }

  const [
    transactionsCountHistory,
    recentTransactionsCount,
  ] = await Promise.all([
    queryTransactionsCountHistory(options),
    queryRecentTransactionsCount(options),
  ]);
  return {
    transactionsCountHistory,
    recentTransactionsCount,
  };
};

const queryTransactionsCountAggregatedByDate = async () => {
  return await queryRows(
    [
      `SELECT
          TIMESTAMP 'epoch' + DIV(DIV(blocks.block_timestamp, 1000000000), 60 * 60 * 24) * INTERVAL '1 day' AS "date",
          COUNT(*) AS transactions_count_by_date
        FROM transactions
        JOIN blocks ON blocks.block_hash = transactions.included_in_block_hash
        GROUP BY "date"
        ORDER BY "date"`,
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

const queryTeragasUsedAggregatedByDate = async () => {
  return await queryRows(
    [
      `SELECT
          TIMESTAMP 'epoch' + DIV(DIV(blocks.block_timestamp, 1000000000), 60 * 60 * 24) * INTERVAL '1 day' AS "date",
          DIV(SUM(chunks.gas_used), 1000000000000) AS teragas_used_by_date
        FROM blocks
        JOIN chunks ON chunks.included_in_block_hash = blocks.block_hash
        GROUP BY "date"
        ORDER BY "date"`,
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

const queryNewAccountsCountAggregatedByDate = async () => {
  return await queryRows(
    [
      `SELECT
        TIMESTAMP 'epoch' + DIV(DIV(blocks.block_timestamp, 1000000000), 60 * 60 * 24) * INTERVAL '1 day' AS "date",
        COUNT(*) as new_accounts_count_by_date
      FROM accounts
      JOIN receipts ON receipts.receipt_id = accounts.created_by_receipt_id
      JOIN blocks ON blocks.block_hash = receipts.included_in_block_hash
      GROUP BY "date"
      ORDER BY "date"`,
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

const queryNewContractsCountAggregatedByDate = async () => {
  return await queryRows(
    [
      `SELECT
        TIMESTAMP 'epoch' + DIV(DIV(receipts.included_in_block_timestamp, 1000000000), 60 * 60 * 24) * INTERVAL '1 day' AS "date",
        COUNT(distinct receipts.receiver_account_id) AS new_contracts_count_by_date
      FROM action_receipt_actions
      JOIN receipts ON receipts.receipt_id = action_receipt_actions.receipt_id
      WHERE action_receipt_actions.action_kind = 'DEPLOY_CONTRACT'
      GROUP BY "date"
      ORDER BY "date"`,
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

const queryUniqueContractsAggregatedByDate = async () => {
  return await queryRows(
    [
      `SELECT 
      TIMESTAMP 'epoch' + DIV(DIV(receipts.included_in_block_timestamp, 1000000000), 60 * 60 * 24) * INTERVAL '1 day' AS "date",	
      COUNT(distinct args->>'code_sha256') AS unique_contracts_count_by_date
      FROM action_receipt_actions 
      JOIN receipts ON receipts.receipt_id = action_receipt_actions.receipt_id
      WHERE action_kind = 'DEPLOY_CONTRACT' 
      group by "date"
      ORDER BY "date"`,
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

const queryActiveContractsCountAggregatedByDate = async () => {
  return await queryRows(
    [
      `SELECT
        TIMESTAMP 'epoch' + DIV(DIV(receipts.included_in_block_timestamp, 1000000000), 60 * 60 * 24) * INTERVAL '1 day' AS "date",
        COUNT(distinct receipts.receiver_account_id) as active_contracts_count_by_date
      FROM action_receipt_actions
      JOIN receipts ON receipts.receipt_id = action_receipt_actions.receipt_id
      JOIN execution_outcomes ON execution_outcomes.receipt_id = action_receipt_actions.receipt_id
      WHERE action_receipt_actions.action_kind = 'FUNCTION_CALL'
      AND execution_outcomes.status IN ('SUCCESS_VALUE', 'SUCCESS_RECEIPT_ID')
      GROUP BY "date"
      ORDER BY "date"`,
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

const queryActiveAccountsCountAggregatedByDate = async () => {
  return await queryRows(
    [
      `SELECT
        TIMESTAMP 'epoch' + DIV(DIV(transactions.block_timestamp, 1000000000), 60 * 60 * 24) * INTERVAL '1 day' AS "date",
        COUNT(distinct transactions.signer_account_id) as active_accounts_count_by_date
      FROM transactions
      JOIN execution_outcomes ON execution_outcomes.receipt_id = transactions.converted_into_receipt_id
      WHERE execution_outcomes.status IN ('SUCCESS_VALUE', 'SUCCESS_RECEIPT_ID')
      GROUP BY "date"
      ORDER BY "date"`,
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

const queryActiveContractsList = async () => {
  return await queryRows(
    [
      `SELECT receiver_account_id,
        count(receipts.receipt_id) AS receipts_count
      FROM action_receipt_actions
      JOIN receipts ON receipts.receipt_id = action_receipt_actions.receipt_id
      WHERE action_receipt_actions.action_kind = 'FUNCTION_CALL'
      AND receipts.included_in_block_timestamp >= (CAST(EXTRACT(EPOCH FROM NOW()) - 60 * 60 * 24 * 14 AS bigint) * 1000 * 1000 * 1000)
      AND receipts.included_in_block_timestamp < (CAST(EXTRACT(EPOCH FROM NOW()) AS bigint) * 1000 * 1000 * 1000)
      GROUP BY receiver_account_id
      ORDER BY receipts_count DESC
      LIMIT 10`,
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

const queryActiveAccountsList = async () => {
  return await queryRows(
    [
      `SELECT signer_account_id,
        COUNT(*) AS transactions_count
      FROM transactions
      WHERE transactions.block_timestamp >= (cast(EXTRACT(EPOCH FROM NOW()) - 60 * 60 * 24 * 14 AS bigint) * 1000 * 1000 * 1000)
      AND transactions.block_timestamp < (cast(EXTRACT(EPOCH FROM NOW()) AS bigint) * 1000 * 1000 * 1000)
      GROUP BY signer_account_id
      ORDER BY transactions_count DESC
      LIMIT 10`,
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

const queryPartnerTotalTransactions = async () => {
  return await queryRows(
    [
      `SELECT receiver_account_id,
          COUNT(*) AS transactions_count
        FROM transactions
        WHERE receiver_account_id IN (:partner_list)
        GROUP BY receiver_account_id
        ORDER BY transactions_count DESC
      `,
      { partner_list: PARTNER_LIST },
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

const queryPartnerFirstThreeMonthTransactions = async () => {
  let partnerList = Array(PARTNER_LIST.length);
  for (let i = 0; i < PARTNER_LIST.length; i++) {
    let result = await querySingleRow(
      [
        `SELECT :partner AS receiver_account_id, COUNT(*) AS transactions_count
        FROM transactions
        WHERE receiver_account_id = :partner
        AND TO_TIMESTAMP(block_timestamp / 1000000000) < (
          SELECT (TO_TIMESTAMP(block_timestamp / 1000000000) + INTERVAL '3 month')
            FROM transactions
            WHERE receiver_account_id = :partner
            ORDER BY block_timestamp
            LIMIT 1)
      `,
        { partner: PARTNER_LIST[i] },
      ],
      { dataSource: DS_INDEXER_BACKEND }
    );
    partnerList[i] = result;
  }
  return partnerList;
};

const queryTotalDepositAmount = async () => {
  return await querySingleRow(
    [
      `SELECT
        SUM((action_receipt_actions.args->>'deposit')::numeric) AS total_deposit_amount
      FROM action_receipt_actions
      JOIN execution_outcomes ON execution_outcomes.receipt_id = action_receipt_actions.receipt_id
      WHERE action_receipt_actions.action_kind IN ('FUNCTION_CALL', 'TRANSFER')
      AND (action_receipt_actions.args->>'deposit')::numeric > 0
      AND execution_outcomes.status IN ('SUCCESS_VALUE', 'SUCCESS_RECEIPT_ID')`,
    ],
    { dataSource: DS_INDEXER_BACKEND }
  );
};

exports.queryOnlineNodes = queryOnlineNodes;
exports.addNodeInfo = addNodeInfo;
exports.pickOnlineValidatingNode = pickOnlineValidatingNode;
exports.getSyncedGenesis = getSyncedGenesis;
exports.queryDashboardTransactionsStats = queryDashboardTransactionsStats;
exports.queryDashboardBlocksStats = queryDashboardBlocksStats;
exports.queryTransactionsCountAggregatedByDate = queryTransactionsCountAggregatedByDate;
exports.queryTeragasUsedAggregatedByDate = queryTeragasUsedAggregatedByDate;
exports.queryNewAccountsCountAggregatedByDate = queryNewAccountsCountAggregatedByDate;
exports.queryNewContractsCountAggregatedByDate = queryNewContractsCountAggregatedByDate;
exports.queryUniqueContractsAggregatedByDate = queryUniqueContractsAggregatedByDate;
exports.queryActiveContractsCountAggregatedByDate = queryActiveContractsCountAggregatedByDate;
exports.queryActiveAccountsCountAggregatedByDate = queryActiveAccountsCountAggregatedByDate;
exports.queryActiveContractsList = queryActiveContractsList;
exports.queryActiveAccountsList = queryActiveAccountsList;
exports.queryPartnerTotalTransactions = queryPartnerTotalTransactions;
exports.queryPartnerFirstThreeMonthTransactions = queryPartnerFirstThreeMonthTransactions;
exports.queryTotalDepositAmount = queryTotalDepositAmount;
