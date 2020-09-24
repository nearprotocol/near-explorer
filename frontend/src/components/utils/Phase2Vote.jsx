import { Row, Col } from "react-bootstrap";

import { DatabaseConsumer } from "../../context/DatabaseProvider";
import LargeBalance from "../utils/LargeBalance";

const Big = require("big.js");
export default () => {
  return (
    <DatabaseConsumer>
      {(context) => (
        <div className="vote">
          <Row>
            <Col
              md="2"
              style={{
                fontFamily: "BentonSans",
                color: "white",
                fontWeight: "400",
              }}
            >
              Phase 2 Vote Status
            </Col>
            <Col
              style={{ borderLeft: "2px solid #505050", paddingLeft: "25px" }}
            >
              <Row>
                {"Total Stake:"}
                <span
                  style={{
                    color: "white",
                    fontWeight: "400",
                    marginLeft: "0.2rem",
                  }}
                >
                  <LargeBalance amount={context.phase2TotalStake} />
                </span>
              </Row>
              <Row>
                {"Votes Needed to Enable Phase 2:"}
                <span
                  style={{
                    color: "white",
                    fontWeight: "400",
                    marginLeft: "0.2rem",
                  }}
                >
                  <LargeBalance
                    amount={Big(context.phase2TotalStake)
                      .times(Big(2))
                      .div(Big(3))
                      .toFixed(0)}
                  />
                </span>
              </Row>
            </Col>
          </Row>
          <Row
            style={{ textAlign: "center", margin: "auto", marginTop: "20px" }}
          >
            <div className="vote-bar"></div>
            <div className="vote-pro"></div>
            <div className="vote-data">
              <span style={{ color: "#8DD4BD", fontWeight: "800" }}>
                {" "}
                {`${Big(context.phase2TotalVotes)
                  .div(Big(context.phase2TotalStake).times(Big(2)).div(Big(3)))
                  .toFixed(2)}%`}
              </span>
              <span>
                (<LargeBalance amount={context.phase2TotalVotes} />
              </span>
              {" / "}
              <LargeBalance
                amount={Big(context.phase2TotalStake)
                  .times(Big(2))
                  .div(Big(3))
                  .toFixed(0)}
              />
              )
            </div>
          </Row>
          <style jsx global>{`
            @import url("https://fonts.googleapis.com/css2?family=Inter:wght@200;400;800&display=swap");

            .vote {
              color: #a0a0a2;
              background: #25272a;
              border-radius: 4px;
              font-size: 14px;
              margin-bottom: 63px;
              font-family: "Inter", sans-serif;
              font-weight: 200;
              padding: 15px 20px;
            }

            .vote-data {
              text-align: center;
              font-weight: 400;
              color: white;
              margin-top: 10px;
              position: relative;
              left: 70%;
            }

            .vote-bar {
              background: #000000;
              border-radius: 50px;
              height: 6px;
              width: 100%;
            }

            .vote-pro {
              position: relative;
              top: -6px;
              background: #8dd4bd;
              border-radius: 50px;
              height: 6px;
              width: ${Big(context.phase2TotalVotes)
                .div(Big(context.phase2TotalStake).times(Big(2)).div(Big(3)))
                .toFixed(2)}%;
            }
          `}</style>
        </div>
      )}
    </DatabaseConsumer>
  );
};
