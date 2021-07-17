import BN from "bn.js";
import { ExplorerApi } from ".";

export interface TransactionsByDate {
  date: string;
  transactionsCount: number;
}

export interface TeragasUsedByDate {
  date: string;
  teragasUsed: number;
}

export interface AccountsByDate {
  date: string;
  accountsCount: number;
}

export interface ContractsByDate {
  date: string;
  contractsCount: number;
}

export interface Account {
  account: string;
  transactionsCount: string;
}

export interface Contract {
  contract: string;
  receiptsCount: string;
}

export interface TotalDepositAmount {
  date: string;
  depositAmount: string;
}

export interface PartnerUniqueUserAmount {
  account: string;
  userAmount: number;
}

export interface GenesisProtocolConfig {
  header: GenesisProtocolConfigHeader;
}

interface GenesisProtocolConfigHeader {
  total_supply: BN;
  latest_protocol_version: number;
}

export default class StatsApi extends ExplorerApi {
  // transactions related
  async transactionsCountAggregatedByDate(): Promise<TransactionsByDate[]> {
    return await this.call<TransactionsByDate[]>(
      "transactions-count-aggregated-by-date"
    );
  }

  async teragasUsedAggregatedByDate(): Promise<TeragasUsedByDate[]> {
    return await this.call<TeragasUsedByDate[]>(
      "teragas-used-aggregated-by-date"
    );
  }

  async depositAggregatedByDate(): Promise<TotalDepositAmount[]> {
    return await this.call<TotalDepositAmount[]>(
      "deposit-amount-aggregated-by-date"
    );
  }

  // accounts
  async newAccountsCountAggregatedByDate(): Promise<AccountsByDate[]> {
    return await this.call<AccountsByDate[]>(
      "new-accounts-count-aggregated-by-date"
    );
  }

  async liveAccountsCountAggregatedByDate(): Promise<AccountsByDate[]> {
    return await this.call<AccountsByDate[]>(
      "live-accounts-count-aggregated-by-date"
    );
  }

  async activeAccountsCountAggregatedByDate(): Promise<AccountsByDate[]> {
    return await this.call<AccountsByDate[]>(
      "active-accounts-count-aggregated-by-date"
    );
  }

  async activeAccountsCountAggregatedByWeek(): Promise<AccountsByDate[]> {
    return await this.call<AccountsByDate[]>(
      "active-accounts-count-aggregated-by-week"
    );
  }

  async activeAccountsList(): Promise<Account[]> {
    return await this.call<Account[]>("active-accounts-list");
  }

  // contracts
  async newContractsCountAggregatedByDate(): Promise<ContractsByDate[]> {
    return await this.call<ContractsByDate[]>(
      "new-contracts-count-aggregated-by-date"
    );
  }

  async uniqueDeployedContractsCountAggregatedByDate(): Promise<
    ContractsByDate[]
  > {
    return await this.call<ContractsByDate[]>(
      "unique-deployed-contracts-count-aggregate-by-date"
    );
  }

  async activeContractsCountAggregatedByDate(): Promise<ContractsByDate[]> {
    return await this.call<ContractsByDate[]>(
      "active-contracts-count-aggregated-by-date"
    );
  }

  async activeContractsList(): Promise<Contract[]> {
    return await this.call<Contract[]>("active-contracts-list");
  }

  // partner
  async partnerTotalTransactionsCount(): Promise<Account[]> {
    return await this.call<Account[]>("partner-total-transactions-count");
  }

  async partnerFirst3MonthTransactionsCount(): Promise<Account[]> {
    return await this.call<Account[]>(
      "partner-first-3-month-transactions-count"
    );
  }

  async partnerUniqueUserAmount(): Promise<PartnerUniqueUserAmount[]> {
    return await this.call<PartnerUniqueUserAmount[]>(
      "partner-unique-user-amount"
    );
  }

  // network genesis configuration
  async networkGenesisProtocolConfig(blockId: number) {
    return await this.call<GenesisProtocolConfig>(
      "nearcore-genesis-protocol-configuration",
      [blockId]
    );
  }

  async genesisAccountsCount(): Promise<number> {
    return await this.call<number>("nearcore-genesis-accounts-count");
  }

  async getTotalFee(daysCount: number): Promise<number> {
    return await this.call<any>("nearcore-total-fee-count", [daysCount]);
  }

  async getTotalFeePerDays(daysCount: number): Promise<number> {
    return await this.call<any>("nearcore-total-fee-count-per-days", [
      daysCount,
    ]);
  }
}
