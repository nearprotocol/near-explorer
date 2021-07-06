import Head from "next/head";

import React from "react";
import { Container } from "react-bootstrap";

import Mixpanel from "../../libraries/mixpanel";
import AccountsApi from "../../libraries/explorer-wamp/accounts";
import ContractsApi from "../../libraries/explorer-wamp/contracts";

import AccountDetails from "../../components/accounts/AccountDetails";
import ContractDetails from "../../components/contracts/ContractDetails";
import Transactions from "../../components/transactions/Transactions";
import AccountAccessKeys from "../../components/accounts/AccountAccessKeys";
import Content from "../../components/utils/Content";

import TransactionIcon from "../../../public/static/images/icon-t-transactions.svg";
import KeysIcon from "../../../public/static/images/icon-t-key-swap.svg";

class AccountDetail extends React.Component {
  static async getInitialProps({ req, query: { id }, res }) {
    if (/[A-Z]/.test(id)) {
      res.writeHead(301, { Location: `/accounts/${id.toLowerCase()}` });
      res.end();
    }

    try {
      const account = await new AccountsApi(req).getAccountInfo(id);
      return { account };
    } catch (accountFetchingError) {
      return {
        account: { accountId: id },
        accountFetchingError,
      };
    }
  }

  componentDidMount() {
    Mixpanel.track("Explorer View Individual Account", {
      accountId: this.props.account.accountId,
    });
  }

  render() {
    const { account, accountFetchingError, currentNearNetwork } = this.props;
    return (
      <>
        <Head>
          <title>NEAR Explorer | Account</title>
        </Head>
        <Content
          title={<h1>{`Account: @${account.accountId}`}</h1>}
          border={false}
        >
          {accountFetchingError ? (
            `Information is not available at the moment. Please, check if the account name is correct or try later.`
          ) : (
            <AccountDetails
              account={account}
              currentNearNetwork={currentNearNetwork}
            />
          )}
        </Content>
        {accountFetchingError ? null : (
          <>
            <Container>
              <ContractDetails accountId={account.accountId} />
            </Container>

            <Content
              size="medium"
              icon={<KeysIcon style={{ width: "22px" }} />}
              title={<h2>Access Keys</h2>}
            >
              <AccountAccessKeys accountId={account.accountId} />
            </Content>

            <Content
              size="medium"
              icon={<TransactionIcon style={{ width: "22px" }} />}
              title={<h2>Transactions</h2>}
            >
              <Transactions accountId={account.accountId} count={10} />
            </Content>
          </>
        )}
      </>
    );
  }
}

export default AccountDetail;
