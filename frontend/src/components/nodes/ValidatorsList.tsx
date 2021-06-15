import BN from "bn.js";
import React from "react";

import * as N from "../../libraries/explorer-wamp/nodes";

import ValidatorRow from "./ValidatorRow";

interface Props {
  validators: any;
  pages: any;
  cellCount: number;
  validatorType: string;
}

class ValidatorsList extends React.PureComponent<Props> {
  calculateStake = (nodeIndex: number, totalStake: BN) => {
    let total = new BN(0);
    let networkHolderIndex = [];
    let networkStakeSafeAmount = totalStake.divn(3);

    for (let i = 0; i <= nodeIndex; i++) {
      total = total.add(new BN(this.props.validators[i].stake));

      if (total.gt(networkStakeSafeAmount)) {
        networkHolderIndex.push(i);
      }
    }
    return { total, networkHolderIndex: networkHolderIndex[0] };
  };

  render() {
    const {
      validators,
      pages: { startPage, endPage, activePage, itemsPerPage },
      cellCount,
      validatorType,
    } = this.props;
    const totalStake = validators.reduce(
      (acc: BN, node: any) => acc.add(new BN(node.stake)),
      new BN(0)
    );

    const validatorsList = validators
      .sort((a: N.ValidationNodeInfo, b: N.ValidationNodeInfo) =>
        new BN(b.stake).sub(new BN(a.stake))
      )
      .map((node: N.ValidationNodeInfo, index: number) => {
        if (validatorType === "validators" || validatorType === "nodePools") {
          return {
            ...node,
            totalStake: totalStake,
            cumulativeStakeAmount: this.calculateStake(index, totalStake),
          };
        }
        return node;
      });

    // console.log("validators", validators?.filter((i) => (i.num_produced_blocks && i.num_expected_blocks) || i.nodeInfo));

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
              validatorType={validatorType}
            />
          ))}
      </>
    );
  }
}

export default ValidatorsList;
