import { DATA_SOURCE_TYPE } from "../consts";

import { ExplorerApi } from ".";
import ContractsApi from "./contracts";

export interface AccountBasicInfo {
  accountId: string;
  createdByTransactionHash: string | null;
  createdAtBlockTimestamp: number | null;
  deletedByTransactionHash: string | null;
  deletedAtBlockTimestamp: number | null;
}

interface AccountStats {
  inTransactionsCount: number;
  outTransactionsCount: number;
}

interface AccountInfo {
  stakedBalance: string;
  nonStakedBalance: string;
  storageUsage?: string;
  lockupAccountId?: string;
}

export type Account = AccountBasicInfo & AccountStats & AccountInfo;

export interface AccountPagination {
  endTimestamp?: number;
  accountIndex: number;
}

type PaginatedAccountBasicInfo = AccountBasicInfo & AccountPagination;

export interface AccountAccessKeysInfo {
  publicKey: string;
  accessKeyInfo: AccessKeyInfo;
  isDeleted: boolean;
}

interface AccessKeyInfo {
  nonce?: number;
  permission: any;
}

export default class AccountsApi extends ExplorerApi {
  static indexerCompatibilityAccessKeyPermissionKinds = new Map([
    ["FullAccess", "FULL_ACCESS"],
  ]);
  async getAccountInfo(accountId: string): Promise<Account> {
    const queryBasicInfo = async () => {
      let accountsBasicInfo;
      if (this.dataSource === DATA_SOURCE_TYPE.LEGACY_SYNC_BACKEND) {
        accountsBasicInfo = await this.call<any>("select", [
          `SELECT account_id AS account_id, created_at_block_timestamp AS created_at_block_timestamp, created_by_transaction_hash AS created_by_transaction_hash
            FROM accounts
            WHERE account_id = :accountId
          `,
          {
            accountId,
          },
        ]);
      } else if (this.dataSource === DATA_SOURCE_TYPE.INDEXER_BACKEND) {
        accountsBasicInfo = await this.call<any>("select:INDEXER_BACKEND", [
          `SELECT
              inneraccounts.account_id,
              DIV(creation_receipt.included_in_block_timestamp, 1000*1000) AS created_at_block_timestamp,
              creation_receipt.originated_from_transaction_hash AS created_by_transaction_hash,
              DIV(deletion_receipt.included_in_block_timestamp, 1000*1000) AS deleted_at_block_timestamp,
              deletion_receipt.originated_from_transaction_hash AS deleted_by_transaction_hash
            FROM (
              SELECT account_id, created_by_receipt_id, deleted_by_receipt_id
                  FROM accounts
                  WHERE account_id = :account_id
            ) AS inneraccounts
            LEFT JOIN receipts AS creation_receipt ON creation_receipt.receipt_id = inneraccounts.created_by_receipt_id
            LEFT JOIN receipts AS deletion_receipt ON deletion_receipt.receipt_id = inneraccounts.deleted_by_receipt_id`,
          {
            account_id: accountId,
          },
        ]);
      } else {
        throw Error(`unsupported data source ${this.dataSource}`);
      }

      if (accountsBasicInfo.length === 0) {
        return {
          accountId,
        } as AccountBasicInfo;
      }
      const accountBasicInfo = accountsBasicInfo[0];
      return {
        accountId: accountBasicInfo.account_id,
        createdByTransactionHash: accountBasicInfo.created_by_transaction_hash,
        createdAtBlockTimestamp: parseInt(
          accountBasicInfo.created_at_block_timestamp
        ),
        deletedByTransactionHash:
          accountBasicInfo.deleted_by_transaction_hash || null,
        deletedAtBlockTimestamp: accountBasicInfo.deleted_at_block_timestamp
          ? parseInt(accountBasicInfo.deleted_at_block_timestamp)
          : null,
      };
    };

    const queryTransactionCount = async () => {
      if (this.dataSource === DATA_SOURCE_TYPE.LEGACY_SYNC_BACKEND) {
        return await this.call<AccountStats[]>("select", [
          `SELECT outTransactionsCount.outTransactionsCount, inTransactionsCount.inTransactionsCount FROM
            (SELECT COUNT(transactions.hash) as outTransactionsCount FROM transactions
              WHERE signer_id = :accountId) as outTransactionsCount,
            (SELECT COUNT(transactions.hash) as inTransactionsCount FROM transactions
              WHERE receiver_id = :accountId) as inTransactionsCount`,
          {
            accountId,
          },
        ]).then((accounts) => accounts[0]);
      } else if (this.dataSource === DATA_SOURCE_TYPE.INDEXER_BACKEND) {
        return await this.call<any>("select:INDEXER_BACKEND", [
          `SELECT out_transactions_count.out_transactions_count, in_transactions_count.in_transactions_count FROM
            (SELECT
                COUNT(transactions.transaction_hash) AS out_transactions_count
              FROM transactions
              WHERE signer_account_id = :account_id
            ) AS out_transactions_count,
            (SELECT
                COUNT(DISTINCT transactions.transaction_hash) AS in_transactions_count
              FROM transactions
              LEFT JOIN receipts ON receipts.originated_from_transaction_hash = transactions.transaction_hash
              WHERE
                receipts.receiver_account_id = :account_id
                AND
                transactions.signer_account_id != :account_id
            ) AS in_transactions_count`,
          {
            account_id: accountId,
          },
        ]).then((accounts) => {
          return {
            inTransactionsCount: accounts[0].in_transactions_count,
            outTransactionsCount: accounts[0].out_transactions_count,
          };
        });
      } else {
        throw Error(`unsupported data source ${this.dataSource}`);
      }
    };

    const [accountInfo, accountBasic, accountStats] = await Promise.all([
      this.queryAccount(accountId),
      queryBasicInfo(),
      queryTransactionCount(),
    ]);
    return {
      ...accountInfo,
      ...accountBasic,
      ...accountStats,
    };
  }

  async getAccounts(
    limit: number = 15,
    paginationIndexer?: AccountPagination
  ): Promise<PaginatedAccountBasicInfo[]> {
    try {
      let accounts;
      if (this.dataSource === DATA_SOURCE_TYPE.LEGACY_SYNC_BACKEND) {
        accounts = await this.call<any>("select", [
          `SELECT account_id as account_id, created_at_block_timestamp, account_index
            FROM accounts
            ${
              paginationIndexer
                ? `WHERE created_at_block_timestamp < :endTimestamp OR (created_at_block_timestamp = :endTimestamp AND account_index < :accountIndex)`
                : ""
            }
            ORDER BY created_at_block_timestamp DESC, account_index DESC
            LIMIT :limit`,
          {
            limit,
            ...paginationIndexer,
          },
        ]);
      } else if (this.dataSource === DATA_SOURCE_TYPE.INDEXER_BACKEND) {
        accounts = await this.call<any>("select:INDEXER_BACKEND", [
          `SELECT account_id AS account_id, id AS account_index, DIV(receipts.included_in_block_timestamp, 1000*1000) AS created_at_block_timestamp
            FROM accounts
            LEFT JOIN receipts ON receipts.receipt_id = accounts.created_by_receipt_id
            ${paginationIndexer ? `WHERE id < :account_index` : ""}
            ORDER BY account_index DESC
            LIMIT :limit`,
          {
            limit,
            account_index: paginationIndexer?.accountIndex,
          },
        ]);
      } else {
        throw Error(`unsupported data source ${this.dataSource}`);
      }

      accounts = accounts.map((account: any) => {
        return {
          accountId: account.account_id,
          createdAtBlockTimestamp: parseInt(account.created_at_block_timestamp),
          accountIndex: account.account_index,
        };
      });
      return accounts as PaginatedAccountBasicInfo[];
    } catch (error) {
      console.error("AccountsApi.getAccounts failed to fetch data due to:");
      console.error(error);
      throw error;
    }
  }

  async isAccountIndexed(accountId: string): Promise<boolean> {
    try {
      return await this.call<any>("select:INDEXER_BACKEND", [
        `SELECT
            account_id
          FROM accounts
          WHERE account_id = :accountId`,
        {
          accountId,
        },
      ]).then((it) => Boolean(it[0]?.account_id));
    } catch (error) {
      console.error(
        "AccountsApi.isAccountIndexed failed to fetch data due to:"
      );
      console.error(error);
      throw error;
    }
  }

  async queryAccount(accountId: string): Promise<any> {
    return await this.call<any>("get-account-details", [accountId]);
  }

  async queryAccountAccessKeys(accountId: string): Promise<any> {
    const rpcAccessKeys = new Map();
    let accessKeys;

    try {
      const indexedAccessKeys = await this.call<any>("select:INDEXER_BACKEND", [
        `SELECT
          public_key, deleted_by_receipt_id, permission_kind
        FROM access_keys
        WHERE account_id = :accountId`,
        {
          accountId,
        },
      ]);

      await new ContractsApi()
        .queryAccessKey(accountId)
        .then((it) =>
          it?.keys.forEach((i: any) => rpcAccessKeys.set(i.public_key, i))
        );

      accessKeys = indexedAccessKeys?.map((accessKey: any) => {
        const indexedAccessKey = rpcAccessKeys.get(accessKey.public_key);
        if (indexedAccessKey) {
          return {
            publicKey: indexedAccessKey.public_key,
            accessKeyInfo: {
              ...indexedAccessKey.access_key,
              permission:
                typeof indexedAccessKey.access_key.permission === "string"
                  ? AccountsApi.indexerCompatibilityAccessKeyPermissionKinds.get(
                      indexedAccessKey.access_key.permission
                    )
                  : indexedAccessKey.access_key.permission,
            },
            isDeleted: Boolean(accessKey.deleted_by_receipt_id),
          };
        }
        return {
          publicKey: accessKey.public_key,
          accessKeyInfo: {
            permission: accessKey.permission_kind,
          },
          isDeleted: Boolean(accessKey.deleted_by_receipt_id),
        };
      });
      return accessKeys as AccountAccessKeysInfo;
    } catch (error) {
      console.error(
        "AccountsApi.queryAccountAccessKeys failed to fetch data due to:"
      );
      console.error(error);
      throw error;
    }
  }
}
