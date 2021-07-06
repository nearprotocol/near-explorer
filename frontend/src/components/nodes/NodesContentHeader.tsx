import React from "react";
import { Col, Row } from "react-bootstrap";

import NodeNav from "./NodeNav";

interface Props {
  navRole: string;
}

const NodesIcon = () => (
  <img
    src="/static/images/icon-nodes.svg"
    style={{ width: "24px", height: "100%", marginRight: "11px" }}
  />
);

class NodesContentHeader extends React.PureComponent<Props> {
  render() {
    return (
      <Row noGutters>
        <Col xs="auto" className="content-icon-col">
          <NodesIcon />
        </Col>
        <Col className="content-title">
          <h1 style={{ fontSize: "31px", marginBottom: "0px" }}>Nodes</h1>
        </Col>
        {/* Currently hide navigation as there is only one tab */}
        <Col xs="12" style={{ visibility: "hidden" }}>
          <NodeNav role={this.props.navRole} />
        </Col>
      </Row>
    );
  }
}

export default NodesContentHeader;
