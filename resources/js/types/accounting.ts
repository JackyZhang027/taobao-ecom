export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NormalBalance = 'debit' | 'credit';
export type JournalStatus = 'draft' | 'posted' | 'voided';

export type Account = {
    id: number;
    code: string;
    name: string;
    type: AccountType;
    normal_balance: NormalBalance;
    parent_id: number | null;
    parent?: Account;
    description: string | null;
    is_active: boolean;
};

export type JournalLine = {
    id: number;
    journal_entry_id: number;
    account_id: number;
    account?: Account;
    description: string | null;
    debit: number;
    credit: number;
};

export type JournalEntry = {
    id: number;
    date: string;
    reference_number: string;
    description: string;
    status: JournalStatus;
    created_by: number;
    creator?: { id: number; name: string };
    lines?: JournalLine[];
};

export type TrialBalanceRow = {
    id: number;
    code: string;
    name: string;
    type: AccountType;
    normal_balance: NormalBalance;
    total_debit: number;
    total_credit: number;
    balance: number;
};

export type LedgerLine = {
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    running_balance: number;
};

export type LedgerData = {
    account: Account;
    start_date: string | null;
    end_date: string | null;
    opening_balance: number;
    lines: LedgerLine[];
    final_balance: number;
};

export type BalanceSheetData = {
    as_of_date: string;
    assets: TrialBalanceRow[];
    total_assets: number;
    liabilities: TrialBalanceRow[];
    total_liabilities: number;
    equity: TrialBalanceRow[];
    total_equity: number;
    net_income: number;
    total_liab_equity: number;
};

export type IncomeStatementData = {
    start_date: string | null;
    end_date: string | null;
    revenues: TrialBalanceRow[];
    total_revenue: number;
    expenses: TrialBalanceRow[];
    total_expenses: number;
    net_income: number;
};
