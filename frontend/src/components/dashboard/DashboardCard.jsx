import { Row, Col, Card } from "react-bootstrap";

export default props => (
  <Card className={props.cls} style={{ border: "solid 4px #e6e6e6" }}>
    <Card.Body>
      <Row noGutters="true">
        <Col
          xs="auto"
          md="12"
          className="dashboard-card-title align-self-center text-left text-md-center"
        >
          <img src={props.imgLink} className="dashboard-card-title-img" />
          {props.title}
        </Col>
        <Col
          xs="auto"
          md="12"
          className="ml-auto dashboard-card-text align-self-center text-right text-md-center"
        >
          {props.format !== undefined
            ? parseInt(props.text).toLocaleString()
            : props.text}
        </Col>
      </Row>
    </Card.Body>
    <style jsx global>{`
      .dashboard-card-title {
        text-transform: uppercase;
        letter-spacing: 1.8px;
        color: #999999;
        font-family: BentonSans;
        font-size: 14px;
        font-weight: 500;
      }

      .dashboard-card-title-img {
        width: 12px !important;
        margin-right: 8px;
        margin-top: -3px;
      }

      .dashboard-card-text {
        font-family: BwSeidoRound;
        font-size: 24px;
        font-weight: 500;
        color: #24272a;
      }
    `}</style>
  </Card>
);
