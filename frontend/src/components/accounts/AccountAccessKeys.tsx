import React from "react";

import AccountsApi, {
  AccountAccessKeysInfo,
} from "../..//libraries/explorer-wamp/accounts";

import AddKey from "../../../public/static/images/icon-t-key-new.svg";
import DeleteKey from "../../../public/static/images/icon-t-key-delete.svg";

import ActionRowBlock from "../../components/transactions/ActionRowBlock";
import AccountLink from "../../components/utils/AccountLink";
import Placeholder from "../utils/Placeholder";
import PaginationSpinner from "../utils/PaginationSpinner";

interface Props {
  accountId: string;
}
interface State {
  accessKeys: AccountAccessKeysInfo[];
  loading: boolean;
}

const AccessKeysMessage = ({
  publicKey,
  accessKeyInfo,
  isDeleted,
}: AccountAccessKeysInfo) => {
  let {
    permission: { FunctionCall },
  } = accessKeyInfo || { permission: {} };
  if (isDeleted) {
    return (
      <>
        Key <span title={publicKey}>{publicKey.substring(0, 15)}...</span>{" "}
        {FunctionCall?.receiver_id ? (
          <>
            for contract <AccountLink accountId={FunctionCall.receiver_id} />{" "}
          </>
        ) : null}
        with permission{" "}
        {FunctionCall
          ? "FUNCTION_CALL"
          : accessKeyInfo.permission.toUpperCase()}{" "}
        was deleted{" "}
      </>
    );
  }

  return (
    <>
      New key <span title={publicKey}>{publicKey.substring(0, 15)}...</span> was
      added{" "}
      {FunctionCall?.receiver_id ? (
        <>
          for contract <AccountLink accountId={FunctionCall.receiver_id} />{" "}
        </>
      ) : null}
      with permission{" "}
      {FunctionCall ? "FUNCTION_CALL" : accessKeyInfo.permission.toUpperCase()}{" "}
      to call{" "}
      {FunctionCall?.method_names.length > 0 ? (
        <span
          style={{
            color: "#72727a",
            backgroundColor: "#f0f0f1",
            fontFamily: "Roboto Mono, monospace",
          }}
        >
          ({FunctionCall.method_names.join(", ")})
        </span>
      ) : (
        "any"
      )}{" "}
      methods
      {typeof accessKeyInfo.nonce !== undefined &&
        ` and nonce ${accessKeyInfo.nonce}`}
    </>
  );
};

class AccountAccessKeys extends React.Component<Props, State> {
  state: State = {
    accessKeys: [],
    loading: true,
  };

  collectAccessKeys = async () => {
    new AccountsApi()
      .queryAccountAccessKeys(this.props.accountId)
      .then((accessKeys) => {
        if (accessKeys) {
          this.setState({ accessKeys });
        }
        this.setState({ loading: false });
        return;
      })
      .catch((err) => console.error(err));
  };

  componentDidMount() {
    this.collectAccessKeys();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.accountId !== prevProps.accountId) {
      this.collectAccessKeys();
    }
  }

  render() {
    const { accessKeys, loading } = this.state;
    return (
      <>
        {loading ? (
          <PaginationSpinner hidden={false} />
        ) : accessKeys.length > 0 ? (
          accessKeys?.map((accessKey: AccountAccessKeysInfo) => (
            <ActionRowBlock
              key={accessKey.publicKey}
              detalizationMode="minimal"
              viewMode="sparse"
              title={<AccessKeysMessage {...accessKey} />}
              icon={accessKey.isDeleted ? <DeleteKey /> : <AddKey />}
              fullwidth
            />
          ))
        ) : (
          <Placeholder>There are no access keys</Placeholder>
        )}
      </>
    );
  }
}

export default AccountAccessKeys;
