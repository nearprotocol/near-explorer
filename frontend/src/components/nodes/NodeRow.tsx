import React from "react";
import { Row, Col } from "react-bootstrap";

import * as N from "../../libraries/explorer-wamp/nodes";

import Timer from "../utils/Timer";

interface Props {
  node: N.NodeInfo;
}

export default class extends React.PureComponent<Props> {
  render() {
    const { node } = this.props;
    return (
      <Row className="node-row mx-0">
        <Col md="auto" xs="1" className="pr-0">
          <img
            src="/static/images/icon-m-block.svg"
            style={{ width: "15px" }}
          />
        </Col>
        <Col md="7" xs="6">
          <Row>
            <Col className="node-row-title">{node.moniker}</Col>
          </Row>
          <Row>
            <Col className="node-row-text">
              <Row>
                <Col md="auto">#{node.lastHeight}</Col>
                <Col md="auto" className="pl-0">
                  <img
                    src="/static/images/icon-m-user.svg"
                    style={{ width: "12px" }}
                  />
                  {` @${node.accountId}`}
                </Col>
                <Col md="auto">{node.ipAddress}</Col>
              </Row>
            </Col>
          </Row>
        </Col>
        <Col md="3" xs="4" className="ml-auto text-right">
          <Row>
            <Col className="node-row-txid" title={node.nodeId}>
              {node.nodeId.substring(8, 20)}...
            </Col>
          </Row>
          <Row>
            <Col className="node-row-timer">
              <span className="node-row-timer-status">Last seen</span>
              &nbsp;&nbsp;
              <Timer time={node.lastSeen} />
            </Col>
          </Row>
        </Col>
        <style jsx global>{`
          .node-row {
            padding-top: 10px;
            padding-bottom: 10px;
            border-top: solid 2px #f8f8f8;
          }

          .node-row:hover {
            background: rgba(0, 0, 0, 0.1);
          }

          .node-row-bottom {
            border-bottom: solid 2px #f8f8f8;
          }

          .node-row-title {
            font-family: BentonSans;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.29;
            color: #24272a;
          }

          .node-row-text {
            font-family: BentonSans;
            font-size: 12px;
            font-weight: 500;
            line-height: 1.5;
            color: #999999;
          }

          .node-row-txid {
            font-family: BentonSans;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.29;
            color: #0072ce;
          }

          .node-row-timer {
            font-family: BentonSans;
            font-size: 12px;
            color: #999999;
            font-weight: 100;
          }

          .node-row-timer-status {
            font-weight: 500;
          }
        `}</style>
      </Row>
    );
  }
}
