import React from "react";

import * as N from "../../libraries/explorer-wamp/nodes";
import { SubConsumer } from "../utils/SubscriptionProvider";

import NodeRow from "./NodeRow";
import PaginationSpinner from "../utils/PaginationSpinner";

export default class extends React.Component {
  render() {
    return (
      <SubConsumer>
        {(context) => (
          <>
            {context.nodeInfo.onlineNodes ? (
              context.nodeInfo.onlineNodes.map((node: N.NodeInfo) => (
                <NodeRow key={node.nodeId} node={node} />
              ))
            ) : (
              <PaginationSpinner hidden={false} />
            )}
          </>
        )}
      </SubConsumer>
    );
  }
}
