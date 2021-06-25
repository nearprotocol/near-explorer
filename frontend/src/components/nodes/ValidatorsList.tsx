import BN from "bn.js";
import React from "react";

import * as N from "../../libraries/explorer-wamp/nodes";
import {
  NetworkStatsContext,
  NetworkStatsContextProps,
} from "../../context/NetworkStatsProvider";

import ValidatorRow from "./ValidatorRow";

const epochValidatorsStake = new Map();

interface Props {
  validators: any;
  pages: any;
  cellCount: number;
}

class ValidatorsList extends React.PureComponent<Props> {
  render() {
    const {
      validators,
      pages: { startPage, endPage, activePage, itemsPerPage },
      cellCount,
    } = this.props;

    const { networkStats }: NetworkStatsContextProps = this.context;

    let validatorsList = validators.sort(
      (a: N.ValidationNodeInfo, b: N.ValidationNodeInfo) =>
        new BN(b.stake).sub(new BN(a.stake))
    );

    // filter validators list by 'active' and 'leaving' validators to culculate cumulative
    // stake only for those validators
    const activeValidatorsList = validatorsList.filter(
      (i: N.ValidationNodeInfo) =>
        i.validatorStatus &&
        ["active", "leaving"].indexOf(i.validatorStatus) >= 0
    );

    activeValidatorsList.forEach(
      (validator: N.ValidationNodeInfo, index: number) => {
        let total = new BN(0);
        for (let i = 0; i <= index; i++) {
          total = total.add(new BN(activeValidatorsList[i].stake));
          epochValidatorsStake.set(validator.account_id, total);
        }
      }
    );

    validatorsList.forEach((validator: N.ValidationNodeInfo, index: number) => {
      const validatorCumStake = epochValidatorsStake.get(validator.account_id);
      if (validatorCumStake) {
        validatorsList[index].cumulativeStakeAmount = validatorCumStake;
      }
    });

    validatorsList.some((validator: N.ValidationNodeInfo, index: number) =>
      networkStats?.totalStake &&
      validator.cumulativeStakeAmount &&
      validator.cumulativeStakeAmount.gt(networkStats.totalStake.divn(3))
        ? (validatorsList[index].networkHolder = true)
        : false
    );

    return (
      <>
        {validatorsList
          .slice(startPage - 1, endPage)
          .map((node: N.ValidationNodeInfo, index: number) => (
            <ValidatorRow
              key={node.account_id}
              node={node}
              index={activePage * itemsPerPage + index + 1}
              cellCount={cellCount}
              totalStake={networkStats?.totalStake}
            />
          ))}
      </>
    );
  }
}

ValidatorsList.contextType = NetworkStatsContext;

export default ValidatorsList;
