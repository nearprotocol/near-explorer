import { call } from ".";

export interface TransactionInfo {
  hash: string;
  signerId: string;
  receiverId: string;
  blockHash: string;
  blockTimestamp: number;
  status: string;
}

export interface CreateAccount {}

export interface DeleteAccount {}

export interface DeployContract {}

export interface FunctionCall {
  args: string;
  deposit: string;
  gas: number;
  method_name: string;
}

export interface Transfer {
  deposit: string;
}

export interface Stake {
  stake: string;
  public_key: string;
}

export interface AddKey {
  access_key: any;
  public_key: string;
}

export interface DeleteKey {
  public_key: string;
}

export interface Action {
  CreateAccount: CreateAccount;
  DeleteAccount: DeleteAccount;
  DeployContract: DeployContract;
  FunctionCall: FunctionCall;
  Transfer: Transfer;
  Stake: Stake;
  AddKey: AddKey;
  DeleteKey: DeleteKey;
}

interface StringActions {
  actions: string;
}

export interface Actions {
  actions: (Action | keyof Action)[];
}

export type Transaction = TransactionInfo & Actions;

export interface FilterArgs {
  signerId?: string;
  receiverId?: string;
  transactionHash?: string;
  blockHash?: string;
  reversed?: boolean;
  limit: number;
}

export async function getTransactions(
  filters: FilterArgs
): Promise<Transaction[]> {
  const { signerId, receiverId, transactionHash, blockHash } = filters;
  const whereClause = [];
  if (signerId) {
    whereClause.push(`transactions.signer_id = :signerId`);
  }
  if (receiverId) {
    whereClause.push(`transactions.receiver_id = :receiverId`);
  }
  if (transactionHash) {
    whereClause.push(`transactions.hash = :transactionHash`);
  }
  if (blockHash) {
    whereClause.push(`transactions.block_hash = :blockHash`);
  }
  try {
    const transactions = await call<
      (TransactionInfo & (StringActions | Actions))[]
    >(".select", [
      `SELECT transactions.hash, transactions.signer_id as signerId, transactions.receiver_id as receiverId, transactions.actions, transactions.block_hash as blockHash, blocks.timestamp as blockTimestamp
        FROM transactions
        LEFT JOIN blocks ON blocks.hash = transactions.block_hash
        ${whereClause.length > 0 ? `WHERE ${whereClause.join(" OR ")}` : ""}
        ORDER BY blocks.height ${filters.reversed ? "DESC" : ""}
        LIMIT :limit`,
      filters
    ]);
    transactions.forEach(transaction => {
      transaction.status = "Completed";
      try {
        transaction.actions = JSON.parse(transaction.actions as string);
      } catch {}
    });
    return transactions as Transaction[];
  } catch (error) {
    console.error(
      "Transactions.getTransactionsInfo failed to fetch data due to:"
    );
    console.error(error);
    throw error;
  }
}

export async function getLatestTransactionsInfo(): Promise<Transaction[]> {
  return getTransactions({ reversed: true, limit: 10 });
}

export async function getTransactionInfo(
  transactionHash: string
): Promise<Transaction | null> {
  return (await getTransactions({ transactionHash, limit: 1 }))[0] || null;
}