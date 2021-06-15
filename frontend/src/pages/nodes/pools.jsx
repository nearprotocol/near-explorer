import Head from "next/head";

import React from "react";

import Mixpanel from "../../libraries/mixpanel";

import { Container } from "react-bootstrap";

import NodesEpoch from "../../components/nodes/NodesEpoch";
import Validators from "../../components/nodes/Validators";
import Content from "../../components/utils/Content";
import NodesCard from "../../components/nodes/NodesCard";
import NodesContentHeader from "../../components/nodes/NodesContentHeader";

import NodeProvider from "../../context/NodeProvider";
import NetworkStatsProvider, {
  NetworkStatsConsumer,
} from "../../context/NetworkStatsProvider";

class ValidatorsPage extends React.Component {
  componentDidMount() {
    Mixpanel.track("Explorer View Validator Node page");
  }

  render() {
    return (
      <>
        <Head>
          <title>NEAR Explorer | Nodes</title>
        </Head>

        <NetworkStatsProvider>
          <Container fluid>
            <NetworkStatsConsumer>
              {({ networkStats, epochStartBlock, finalityStatus }) => {
                if (!networkStats || !epochStartBlock || !finalityStatus) {
                  return null;
                }
                return (
                  <NodesEpoch
                    epochLength={networkStats.epochLength}
                    epochStartHeight={epochStartBlock.height}
                    epochStartTimestamp={epochStartBlock.timestamp}
                    latestBlockHeight={finalityStatus.finalBlockHeight}
                    latestBlockTimestamp={finalityStatus.finalBlockTimestampNanosecond
                      .divn(10 ** 6)
                      .toNumber()}
                  />
                );
              }}
            </NetworkStatsConsumer>
          </Container>

          <Content
            border={false}
            fluid
            contentFluid
            className="nodes-page"
            header={<NodesContentHeader navRole="nodePools" />}
          >
            <Container>
              <NodesCard />
            </Container>
            <NodeProvider>
              <Container style={{ paddingTop: "24px", paddingBottom: "50px" }}>
                <Validators type="nodePools" />
              </Container>
            </NodeProvider>
          </Content>
        </NetworkStatsProvider>
        <style global jsx>{`
          .nodes-page {
            background-color: #ffffff;
          }

          @media (max-width: 576px) {
            .nodes-page > .container-fluid,
            .nodes-page > .container-fluid > .container {
              padding-left: 0;
              padding-right: 0;
            }
          }
          @media (min-width: 576px) {
            .content-header {
              padding-left: 32px;
              padding-right: 32px;
            }
          }
          .content-header {
            background: #fafafa;
            margin-left: -15px;
            margin-right: -15px;
            padding-bottom: 0;
          }
        `}</style>
      </>
    );
  }
}

export default ValidatorsPage;
