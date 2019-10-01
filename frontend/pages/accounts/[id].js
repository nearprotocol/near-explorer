import Head from "next/head";

import { Row, Col } from "react-bootstrap";

import AccountApi from "../../components/api/Accounts";

import Account from "../../components/Account";
import Content from "../../components/Content";
import Transactions from "../../components/transactions/Transactions";

import "bootstrap/dist/css/bootstrap.min.css";

const AccountPage = props => (
  <>
    <Head>
      <title>Near Explorer | Account</title>
    </Head>
    <Content title={`Account: @${props.id}`} border={false}>
      {props.err ? (
        `Information is not available at the moment. Please, check if the account name is correct or try later.`
      ) : (
        <Account account={props} />
      )}
    </Content>
    <Content
      size="medium"
      icon={
        <img
          src="/static/images/icon-t-transactions.svg"
          style={{ width: "22px", marginTop: "5px" }}
        />
      }
      title={`Transactions`}
    >
      <Transactions account={props.id} />
    </Content>
    <style jsx global>{`
      .account-transactions-title {
        font-size: 0.5em;
      }
    `}</style>
  </>
);

AccountPage.getInitialProps = async ({ query: { id } }) => {
  try {
    return await AccountApi.getAccountInfo(id);
  } catch (err) {
    return { id, err };
  }
};

export default AccountPage;
