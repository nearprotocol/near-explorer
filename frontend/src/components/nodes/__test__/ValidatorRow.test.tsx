import BN from "bn.js";

import renderer from "react-test-renderer";

import ValidatorRow from "../ValidatorRow";

describe("<ValidatorRow />", () => {
  it("renders full Validators row", () => {
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
            stakeProposed: "4792255943512030289565031148674",
            cumulativeStakeAmount: new BN("91037770393145811562101780866"),
            networkHolder: true,
            validatorStatus: "active",
            fee: { numerator: 10, denominator: 100 },
            delegatorsCount: 11,
          }}
          totalStake={new BN("91037770393145811562101780866")}
          index={1}
          cellCount={7}
        />
      )
    ).toMatchSnapshot();
  });

  it("renders Validators row without cumulative stake", () => {
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
            stakeProposed: "4792255943512030289565031148674",
            networkHolder: true,
            validatorStatus: "leaving",
            fee: { numerator: 10, denominator: 100 },
            delegatorsCount: 11,
          }}
          totalStake={new BN("91037770393145811562101780866")}
          index={2}
          cellCount={7}
        />
      )
    ).toMatchSnapshot();
  });

  it("renders simple Validators row", () => {
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
            stakeProposed: "4792255943512030289565031148674",
            networkHolder: true,
            fee: { numerator: 10, denominator: 100 },
            delegatorsCount: 11,
          }}
          totalStake={new BN("91037770393145811562101780866")}
          index={3}
          cellCount={7}
        />
      )
    ).toMatchSnapshot();
  });
});
