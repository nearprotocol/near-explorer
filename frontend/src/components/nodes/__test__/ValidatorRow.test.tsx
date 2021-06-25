import BN from "bn.js";

import renderer from "react-test-renderer";

import ValidatorRow from "../ValidatorRow";

describe("<ValidatorRow />", () => {
  it("renders row on Validators tab", () => {
    expect(
      renderer.create(
        <ValidatorRow
          key="dokiacapital.pool.6fb1358"
          node={{
            account_id: "dokiacapital.pool.6fb1358",
            is_slashed: false,
            num_expected_blocks: 1771,
            num_produced_blocks: 1768,
            public_key: "ed25519:935JMz1vLcJxFApG3TY4MA4RHhvResvoGwCrQoJxHPn9",
            shards: [0],
            stake: "91037770393145811562101780866",
            cumulativeStakeAmount: new BN("91037770393145811562101780866"),
            totalStake: new BN("91037770393145811562101780866"),
            fee: { numerator: 10, denominator: 100 },
            delegatorsCount: 11,
          }}
          index={1}
          cellCount={7}
        />
      )
    ).toMatchSnapshot();
  });

  // TODO write test with networkHolder validator
});
