import React from "react";
import { Col, Row } from "react-bootstrap";

import { NodeStatsConsumer } from "../../context/NodeStatsProvider";

import DashboardCard from "../utils/DashboardCard";
import LongCardCell from "../utils/LongCardCell";
import Term from "../utils/Term";

export default () => (
  <NodeStatsConsumer>
    {(stats) => (
      <DashboardCard
        iconPath="/static/images/icon-nodes.svg"
        title="Nodes"
        className="node-card"
      >
        <Row noGutters>
          <Col xs="6" md="12">
            <LongCardCell
              title={
                <Term title={"Nodes online"}>
                  {"Total number of online nodes. "}
                  <a
                    href={
                      "https://docs.near.org/docs/validator/staking#run-the-node"
                    }
                  >
                    docs
                  </a>
                </Term>
              }
              text={stats.onlineNodeAmount.toLocaleString()}
              href={"/nodes/online-nodes"}
              loading={!stats.onlineNodeAmount}
            />
          </Col>
          <Col xs="6" md="12">
            <LongCardCell
              title={
                <Term title={"Nodes validating"}>
                  {"Total number of validating nodes. "}
                  <a
                    href={
                      "https://docs.near.org/docs/roles/integrator/faq#validators"
                    }
                  >
                    docs
                  </a>
                </Term>
              }
              text={stats.validatorAmount.toLocaleString()}
              href={"/nodes/validators"}
              loading={!stats.validatorAmount}
              className="dashboard-validating-nodes-count"
            />
          </Col>
        </Row>
        <style jsx global>{`
          .dashboard-validating-nodes-count .card-cell-text {
            color: #00c08b;
          }
        `}</style>
      </DashboardCard>
    )}
  </NodeStatsConsumer>
);