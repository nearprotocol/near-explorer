const nearlib = require("near-api-js");

const { nearRpcUrl, wampNearNetworkName } = require("./config");

const nearRpc = new nearlib.providers.JsonRpcProvider(nearRpcUrl);

const queryFinalTimestamp = async () => {
  const finalBlock = await nearRpc.sendJsonRpc("block", { finality: "final" });
  return finalBlock.header.timestamp;
};

const queryNodeStats = async () => {
  let nodes = await nearRpc.sendJsonRpc("validators", [null]);
  let proposals = nodes.current_proposals;
  let currentValidators = getCurrentNodes(nodes);
  return { currentValidators, proposals };
};

const signNewValidators = (newValidators) => {
  for (let i = 0; i < newValidators.length; i++) {
    newValidators[i].new = true;
  }
};

const signRemovedValidators = (removedValidators) => {
  for (let i = 0; i < removedValidators.length; i++) {
    removedValidators[i].removed = true;
  }
};

const getCurrentNodes = (nodes) => {
  let currentValidators = nodes.current_validators;
  let nextValidators = nodes.next_validators;
  const {
    newValidators,
    removedValidators,
  } = nearlib.validators.diffEpochValidators(currentValidators, nextValidators);
  signNewValidators(newValidators);
  signRemovedValidators(removedValidators);
  currentValidators = currentValidators.concat(newValidators);
  return currentValidators;
};

const getVoteStats = async (config) => {
  const keyStore = new nearlib.keyStores.InMemoryKeyStore();
  const near = await nearlib.connect({
    deps: { keyStore },
    nodeUrl: config.nodeUrl,
    networkId: config.networkId,
  });
  const account = await near.account(config.contractName);
  const [totalVotes, totalStake] = await account.viewFunction(
    config.contractName,
    "get_total_voted_stake",
    {}
  );
  return { totalVotes, totalStake };
};

exports.nearRpc = nearRpc;
exports.queryFinalTimestamp = queryFinalTimestamp;
exports.queryNodeStats = queryNodeStats;
exports.getVoteStats = getVoteStats;
