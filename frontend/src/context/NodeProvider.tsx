import React, { createContext, useEffect, useState } from "react";

import { ExplorerApi } from "../libraries/explorer-wamp";
import { NodeInfo, ValidationNodeInfo } from "../libraries/explorer-wamp/nodes";

export interface INodeContext {
  currentValidators?: ValidationNodeInfo[];
  onlineNodes?: NodeInfo[];
  currentProposals?: ValidationNodeInfo[];
  onlineValidatingNodes?: NodeInfo[];
  currentPools?: ValidationNodeInfo[];
}

const NodeContext = createContext<INodeContext>({});

export interface Props {
  children: React.Component;
}

const NodeProvider = (props: Props) => {
  const [currentContext, setContext] = useState<INodeContext>({});

  const fetchNodeInfo = (_positionalArgs: any, context: INodeContext) => {
    setContext(context);
  };

  useEffect(() => {
    const explorerApi = new ExplorerApi();
    explorerApi.subscribe("nodes", fetchNodeInfo);

    return () => {
      explorerApi.unsubscribe("nodes");
    };
  }, []);

  return (
    <NodeContext.Provider value={currentContext}>
      {props.children}
    </NodeContext.Provider>
  );
};

const NodeConsumer = NodeContext.Consumer;

export { NodeConsumer, NodeContext };

export default NodeProvider;
