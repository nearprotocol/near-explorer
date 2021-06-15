import React from "react";
import { Badge, Col, Row } from "react-bootstrap";

import { NetworkStatsConsumer } from "../../context/NetworkStatsProvider";

import Link from "../utils/Link";

interface Props {
  role: string;
}

class NodeNav extends React.PureComponent<Props> {
  render() {
    const { role } = this.props;
    return (
      <NetworkStatsConsumer>
        {(context) => (
          <>
            <Row>
              <Col
                xs="auto"
                className={`node-selector pt-2 pb-2 ${
                  role === "validators" ? `node-selected` : ""
                }`}
              >
                <Link href="/nodes/validators">
                  <a className="node-link" id="validator-node">
                    Validating{" "}
                    <Badge pill className="nodes-amount-label validating">
                      {context.networkStats
                        ? context.networkStats.currentValidatorsCount
                        : "--"}
                    </Badge>
                  </a>
                </Link>
              </Col>
              {/* <Col
                xs="auto"
                className={`node-selector pt-2 pb-2 ${
                  role === "online-nodes" ? `node-selected` : ""
                }`}
              >
                <Link href="/nodes/online-nodes">
                  <a className="node-link" id="online-node">
                    Online{" "}
                    <Badge pill className="nodes-amount-label online">
                      {typeof context.onlineNodeAmount !== "undefined"
                        ? context.onlineNodeAmount
                        : "--"}
                    </Badge>
                  </a>
                </Link>
              </Col> */}
              <Col
                xs="auto"
                className={`node-selector pt-2 pb-2 ${
                  role === "proposals" ? `node-selected` : ""
                }`}
              >
                <Link href="/nodes/proposals">
                  <a className="node-link" id="proposal-node">
                    Proposed{" "}
                    <Badge pill className="nodes-amount-label proposed">
                      {context.networkStats
                        ? context.networkStats.currentProposalsCount
                        : "--"}
                    </Badge>
                  </a>
                </Link>
              </Col>

              <Col
                xs="auto"
                className={`node-selector pt-2 pb-2 ${
                  role === "nodePools" ? `node-selected` : ""
                }`}
              >
                <Link href="/nodes/pools">
                  <a className="node-link" id="pools-node">
                    Pools{" "}
                    <Badge pill className="nodes-amount-label pools">
                      {context.networkStats
                        ? context.networkStats.currentPoolsCount
                        : "--"}
                    </Badge>
                  </a>
                </Link>
              </Col>
              {/* <Col className="node-selector pt-2 pb-2">
                <Link href="/nodes/map">
                  <a className="node-link" id="node-map">
                    Nodes Map
                  </a>
                </Link>
              </Col> */}
            </Row>
            <style jsx global>{`
              .node-selector {
                height: 100%;
                font-size: 16px;
                font-weight: 500;
                text-decoration: none;
                padding-left: 0;
                padding-right: 0;
                margin-left: 16px;
                margin-top: 2px;
                text-align: center;
                color: #72727a;
                transition: all 0.15s ease-in-out;
              }

              .node-selector:hover {
                color: #111618;
              }

              .nodes-amount-label {
                border-radius: 50px;
                line-height: 150%;
                font-weight: 500;
              }

              .nodes-amount-label.validating {
                background-color: #00c08b;
                color: #ffffff;
              }

              .nodes-amount-label.online {
                background-color: #e5e5e6;
                color: #72727a;
              }

              .nodes-amount-label.pools {
                background-color: #e5e5e6;
                color: #72727a;
              }

              .nodes-amount-label.proposed {
                background-color: #ffecd6;
                color: #995200;
              }

              .node-link,
              .node-link:hover {
                color: inherit;
              }

              .node-selected {
                color: #111618;
                border-bottom: 2px solid #2b9af4;
              }

              .node-icon {
                margin: 10px;
              }
            `}</style>
          </>
        )}
      </NetworkStatsConsumer>
    );
  }
}

export default NodeNav;
