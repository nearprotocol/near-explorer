const nearApi = require("near-api-js");

const BN = require("bn.js");

const { nearRpcUrl } = require("./config");

const nearRpc = new nearApi.providers.JsonRpcProvider(nearRpcUrl);

let seatPrice = null;
let totalStake = null;
let currentEpochStartHeight = null;
let currentValidatorsMap = new Map();

// TODO: Provide an equivalent method in near-api-js, so we don't need to hack it around.
nearRpc.callViewMethod = async function (contractName, methodName, args) {
  const account = new nearApi.Account({ provider: this });
  return await account.viewFunction(contractName, methodName, args);
};

const queryFinalBlock = async () => {
  return await nearRpc.sendJsonRpc("block", { finality: "final" });
};

const queryEpochStats = async () => {
  const networkProtocolConfig = await nearRpc.sendJsonRpc(
    "EXPERIMENTAL_protocol_config",
    { finality: "final" }
  );
  const epochStatus = await nearRpc.sendJsonRpc("validators", [null]);
  const numSeats =
    networkProtocolConfig.num_block_producer_seats +
    networkProtocolConfig.avg_hidden_validator_seats_per_shard.reduce(
      (a, b) => a + b
    );

  const currentProposals = epochStatus.current_proposals;
  const currentValidators = getCurrentNodes(epochStatus);

  // getCurrentNodes(epochStatus).forEach((validator) => {
  //   // currentValidatorsMap.set()
  // });

  const { epoch_start_height: epochStartHeight } = epochStatus;
  const {
    epoch_length: epochLength,
    genesis_time: genesisTime,
    genesis_height: genesisHeight,
    protocol_version: epochProtocolVersion,
  } = networkProtocolConfig;

  if (currentEpochStartHeight !== epochStartHeight) {
    // Update seat_price and total_stake each time when epoch starts
    currentEpochStartHeight = epochStartHeight;
    seatPrice = nearApi.validators
      .findSeatPrice(epochStatus.current_validators, numSeats)
      .toString();

    totalStake = currentValidators
      .reduce((acc, node) => acc.add(new BN(node.stake)), new BN(0))
      .toString();
  }

  return {
    epochLength,
    epochStartHeight,
    epochProtocolVersion,
    currentValidators,
    currentProposals,
    totalStake,
    seatPrice,
    genesisTime,
    genesisHeight,
  };
};

const setValidatorStatus = (validators, status) => {
  for (let i = 0; i < validators.length; i++) {
    validators[i].validatorStatus = status;
  }
};

const getCurrentNodes = (epochStatus) => {
  let {
    current_validators: currentValidators,
    next_validators: nextValidators,
  } = epochStatus;
  const {
    newValidators,
    removedValidators,
  } = nearApi.validators.diffEpochValidators(currentValidators, nextValidators);
  setValidatorStatus(newValidators, "new");
  setValidatorStatus(removedValidators, "removed");
  currentValidators = currentValidators.concat(newValidators);
  return currentValidators;
};

exports.nearRpc = nearRpc;
exports.queryFinalBlock = queryFinalBlock;
exports.queryEpochStats = queryEpochStats;
