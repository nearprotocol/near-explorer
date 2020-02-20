/// Copied from near-wallet project:
/// https://github.com/nearprotocol/near-wallet/blob/41cb65246134308dd553b532dfb314b45b38b65c/src/components/common/Balance.js

import { utils } from "nearlib";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const Balance = ({ amount }) => {
  if (!amount) {
    throw new Error("amount property should not be null");
  }
  let amountShow = convertToShow(amount);
  return (
    <OverlayTrigger
      placement={"top"}
      overlay={<Tooltip>{amount} yokto Ⓝ</Tooltip>}
    >
      <Tooltip>{amountShow} Ⓝ</Tooltip>
    </OverlayTrigger>
  );
};

const convertToShow = amount => {
  if (amount === "0") {
    return "0";
  }
  return formatNEAR(amount);
};

export const formatNEAR = amount => {
  let ret = utils.format.formatNearAmount(amount, 5);
  if (ret === "0" && amount > 0) {
    return "<0.00001";
  }
  return ret;
};

export default Balance;
