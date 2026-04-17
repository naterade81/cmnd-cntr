const SPREADSHEET_ID = '1GGpjVxYG2mOrOfbAG81OD32p2N9NclBL5NkMQkc_huE';

function sheetUrl(tabName: string): string {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
}

async function fetchSheetCSV(tabName: string): Promise<string[][]> {
  const res = await fetch(sheetUrl(tabName), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch sheet "${tabName}": ${res.status}`);
  const text = await res.text();
  return text.split('\n').filter(l => l.trim()).map(parseCSVLine);
}

function parseAmount(raw: string): number {
  return parseFloat((raw || '0').replace(/[$,]/g, ''));
}

export interface BudgetCategory {
  section: string;
  category: string;
  subcategory: string;
  budgeted: number;
  frequency: string;
  dueDate: string;
  autoPay: boolean;
  notes: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  bankCategory: string;
  budgetCategory: string;
  method: string;
  balance: number;
}

export interface DebtItem {
  name: string;
  details: string;
  balance: number;
  monthlyPayment: number;
  extraPayment: number;
  projectedPayoff: string;
  priority: string;
}

export interface SavingsGoal {
  name: string;
  description: string;
  target: number;
  current: number;
  monthlyContribution: number;
  targetDate: string;
  phase: string;
}

// Map bank "Transaction Category" column to budget categories
const BANK_CATEGORY_MAP: Record<string, string> = {
  'Groceries': 'Groceries',
  'Restaurants & Dining': 'Dining Out',
  'Shopping': 'Shopping',
  'Home Supplies': 'Home/Auto',
  'Insurance': 'Insurance',
  'Credit Card Payments': 'Debt',
  'Utilities': 'Electric',
  'Entertainment': 'Subscriptions',
  'Paychecks/Salary': 'Income',
  'Deposits': 'Income',
  'Healthcare & Pharmacy': 'Healthcare',
  'Mortgages': 'Mortgage',
  'Charitable Giving': 'Giving',
  'Transfers': 'Transfers',
  'Checks': 'Miscellaneous',
  'Travel & Commute': 'Transportation',
  'Dues and Subscriptions': 'Subscriptions',
  'Electronics & Equipment': 'Subscriptions',
  'Service Charges & Fees': 'Subscriptions',
  'Online Services': 'Miscellaneous',
  'Other Expenses': 'Miscellaneous',
};

// Description-based overrides — these take priority over bank categories
// Matched case-insensitively against the Description and Extended Description fields
const DESCRIPTION_RULES: [RegExp, string][] = [
  // Income
  [/gusto payroll/i, 'Income'],
  [/childrens home/i, 'Income'],
  [/mobile check deposit/i, 'Income'],
  [/venmo.*cashout/i, 'Income'],

  // Groceries
  [/publix/i, 'Groceries'],
  [/aldi/i, 'Groceries'],
  [/food city/i, 'Groceries'],
  [/hughes farmers market/i, 'Groceries'],
  [/walmart.*\d{4}/i, 'Groceries'], // in-store Walmart (has store number in desc)
  [/wal-mart #\d/i, 'Groceries'],

  // Gas/Fuel — Circle K with fuel MCC codes (5541/5542) or explicit gas
  [/circle k.*5542/i, 'Gas/Fuel'],
  [/circle k.*5541/i, 'Gas/Fuel'],
  [/circle k/i, 'Gas/Fuel'],
  [/shell/i, 'Gas/Fuel'],
  [/love's.*5542/i, 'Gas/Fuel'],
  [/love's.*5541/i, 'Gas/Fuel'],
  [/love's.*outside/i, 'Gas/Fuel'],

  // Convenience store (Love's inside)
  [/love's.*inside/i, 'Groceries'],

  // Dining Out
  [/biba italian/i, 'Dining Out'],
  [/culver/i, 'Dining Out'],
  [/chick-fil-a/i, 'Dining Out'],
  [/lickin good donuts/i, 'Dining Out'],
  [/mimis deli/i, 'Dining Out'],
  [/restaurant/i, 'Dining Out'],

  // Shopping — online orders
  [/amazon\.com/i, 'Shopping'],
  [/amazon(?!.*prime video)/i, 'Shopping'],
  [/walmart\.com/i, 'Shopping'],
  [/ebay/i, 'Shopping'],
  [/dollar\s*tree/i, 'Shopping'],

  // Home/Auto
  [/home depot/i, 'Home/Auto'],
  [/ace.*hardware/i, 'Home/Auto'],
  [/elders ace/i, 'Home/Auto'],
  [/autozone/i, 'Home/Auto'],
  [/o'reilly/i, 'Home/Auto'],

  // Kids — Daycare
  [/little seekers/i, 'Daycare'],

  // Kids — Homeschool
  [/csthea/i, 'Homeschool'],

  // Healthcare
  [/covenant/i, 'Healthcare'],
  [/stjoseph.*health/i, 'Healthcare'],
  [/pharmacy/i, 'Healthcare'],

  // Mortgage
  [/rocket mortgage/i, 'Mortgage'],

  // Utilities
  [/epb electric/i, 'Electric'],
  [/epb fiber/i, 'Internet'],
  [/chattanooga gas/i, 'Gas (Utility)'],
  [/hixson utility/i, 'Water'],
  [/kk waste/i, 'Trash'],

  // Insurance
  [/travelers/i, 'Insurance'],
  [/bcbs/i, 'Health Insurance'],

  // Debt payments
  [/trust federal/i, 'Debt'],
  [/capital one/i, 'Debt'],
  [/wells fargo card/i, 'Debt'],
  [/citi card/i, 'Debt'],

  // Giving
  [/compassion intern/i, 'Giving'],
  [/bibleintheschool/i, 'Giving'],
  [/vision sporting/i, 'Giving'],

  // Subscriptions
  [/spotify/i, 'Subscriptions'],
  [/apple\.com\/bill/i, 'Subscriptions'],
  [/apple com bill/i, 'Subscriptions'],
  [/prime video/i, 'Subscriptions'],
  [/clearplay/i, 'Subscriptions'],
  [/patreon/i, 'Subscriptions'],
  [/world watch/i, 'Subscriptions'],
  [/wng\.org/i, 'Subscriptions'],
  [/vidangel/i, 'Subscriptions'],
  [/google.*cloud/i, 'Subscriptions'],
  [/google.*one/i, 'Subscriptions'],

  // Savings
  [/transfer.*to.*share/i, 'Savings'],

  // Venmo transfers (outgoing)
  [/venmo/i, 'Transfers'],

  // Parking/Transport
  [/parkmobile/i, 'Transportation'],
  [/carta/i, 'Transportation'],
];

function categorizeTransaction(description: string, extendedDescription: string, bankCategory: string): string {
  const combined = `${description} ${extendedDescription}`;
  for (const [regex, category] of DESCRIPTION_RULES) {
    if (regex.test(combined)) return category;
  }
  return BANK_CATEGORY_MAP[bankCategory] || 'Miscellaneous';
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export async function loadBudgetPlan(): Promise<BudgetCategory[]> {
  const rows = await fetchSheetCSV('Budget Plan');
  const categories: BudgetCategory[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols[0] || cols[0].startsWith(',')) continue;
    const budgeted = parseAmount(cols[3]);
    if (isNaN(budgeted) || budgeted === 0) continue;

    categories.push({
      section: cols[0],
      category: cols[1],
      subcategory: cols[2],
      budgeted,
      frequency: cols[4] || '',
      dueDate: cols[5] || '',
      autoPay: cols[6] === 'Yes',
      notes: cols[7] || '',
    });
  }

  return categories;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export function getCurrentMonthName(): string {
  return MONTH_NAMES[new Date().getMonth()];
}

export async function loadDailyLogTransactions(): Promise<Transaction[]> {
  const rows = await fetchSheetCSV('Daily Log');
  const transactions: Transaction[] = [];

  // Columns: [0] Date, [1] Description, [2] Type, [3] Category, [4] Amount, [5] Method, [6] Notes
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < 5 || !cols[0] || cols[0].startsWith('---')) continue;

    const amount = parseAmount(cols[4]);
    if (isNaN(amount) || amount === 0) continue;

    const isIncome = (cols[2] || '').toLowerCase() === 'income';
    const dailyCategory = cols[3] || '';

    // Use explicit category from sheet, fall back to description rules
    const budgetCategory = dailyCategory === 'Income' ? 'Income' :
      dailyCategory ? (BANK_CATEGORY_MAP[dailyCategory] || dailyCategory) :
      categorizeTransaction(cols[1] || '', '', '') || 'Miscellaneous';

    transactions.push({
      id: `daily-${i}`,
      date: cols[0],
      description: cols[1] || '',
      amount: Math.abs(amount),
      type: isIncome ? 'credit' : 'debit',
      bankCategory: dailyCategory,
      budgetCategory,
      method: cols[5] || '',
      balance: 0,
    });
  }

  return transactions;
}

async function loadTransactions(): Promise<Transaction[]> {
  const txns = await loadDailyLogTransactions();
  txns.sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return db - da;
  });
  return txns;
}

export async function loadDebtItems(): Promise<DebtItem[]> {
  const rows = await fetchSheetCSV('Goals');
  const items: DebtItem[] = [];

  const debtNames = ['Wells Fargo Credit Card', 'Citi Card', 'Trust Federal - Truck', 'Trust Federal - HELOC', 'Rocket Mortgage'];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols[1] || !debtNames.includes(cols[1])) continue;

    const balance = parseAmount(cols[4]);
    const payment = parseAmount(cols[5]);
    const extra = parseAmount(cols[6]);
    if (isNaN(balance)) continue;

    items.push({
      name: cols[1],
      details: cols[2] || '',
      balance,
      monthlyPayment: payment,
      extraPayment: extra,
      projectedPayoff: cols[7] || '',
      priority: cols[8] || '',
    });
  }

  return items;
}

export async function loadSavingsGoals(): Promise<SavingsGoal[]> {
  const rows = await fetchSheetCSV('Goals');
  const goals: SavingsGoal[] = [];

  const savingsNames = [
    'Emergency Fund', 'Yearly Vacation', 'Rachel Car Upgrade',
    'Braces - Child 1', 'Braces - Child 2', 'Braces - Child 3',
    'Kids College Fund',
  ];

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols[1] || !savingsNames.includes(cols[1])) continue;

    const target = parseAmount(cols[3]);
    if (isNaN(target) || target === 0) continue;

    goals.push({
      name: cols[1],
      description: cols[2] || '',
      target,
      current: parseAmount(cols[4]),
      monthlyContribution: parseAmount(cols[5]),
      targetDate: cols[7] || '',
      phase: cols[8] || '',
    });
  }

  return goals;
}

export interface BudgetSummary {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalBudgetedExpenses: number;
  categorySpending: { category: string; budgeted: number; actual: number }[];
  recentTransactions: Transaction[];
  debts: DebtItem[];
  totalDebt: number;
  savingsGoals: SavingsGoal[];
  transactionCount: number;
  hasSpreadsheet: boolean;
}

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const [plan, transactions, debts, savingsGoals] = await Promise.all([
    loadBudgetPlan(),
    loadTransactions(),
    loadDebtItems(),
    loadSavingsGoals(),
  ]);

  const income = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  // Map budget plan items to the same category names used by transaction categorizer
  const BUDGET_TO_SPENDING: Record<string, string> = {
    'Mortgage (Rocket Mortgage)': 'Mortgage',
    'EPB Electric': 'Electric',
    'EPB Fiber (Internet)': 'Internet',
    'Chattanooga Gas': 'Gas (Utility)',
    'KK Waste Disposal': 'Trash',
    'Hixson Utility (Water)': 'Water',
    'Travelers Insurance': 'Insurance',
    'BCBS TN Health Insurance': 'Health Insurance',
    'Trust Federal CU Payment 1': 'Debt',
    'Trust Federal CU Payment 2': 'Debt',
    'Capital One Payment': 'Debt',
    'Wells Fargo Card Payment': 'Debt',
    'Citi Card Payment': 'Debt',
    'Compassion International': 'Giving',
    'Apple Subscriptions': 'Subscriptions',
    'Spotify': 'Subscriptions',
    'Amazon Prime Video': 'Subscriptions',
    'Google Cloud/One': 'Subscriptions',
    'ClearPlay': 'Subscriptions',
    'Patreon': 'Subscriptions',
    'WNG World Watch': 'Subscriptions',
    'VidAngel': 'Subscriptions',
    'MassMutual Life Insurance': 'Insurance',
    'Bulwark Pest Control': 'Home/Auto',
    'Nancy Carter (Venmo)': 'Transfers',
    'Groceries': 'Groceries',
    'Dining Out': 'Dining Out',
    'Gas/Fuel': 'Gas/Fuel',
    'Shopping (Online + In-Store)': 'Shopping',
    'Daycare (Little Seekers)': 'Daycare',
    'Homeschool Activities': 'Homeschool',
    'Healthcare': 'Healthcare',
    'Home & Auto Maintenance': 'Home/Auto',
  };

  // Build budget vs actual by category
  const budgetByCategory = new Map<string, number>();
  for (const item of plan) {
    if (item.section === 'INCOME') continue;
    const key = BUDGET_TO_SPENDING[item.subcategory] || BUDGET_TO_SPENDING[item.category] || item.category;
    budgetByCategory.set(key, (budgetByCategory.get(key) || 0) + item.budgeted);
  }

  const actualByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type === 'credit') continue;
    if (t.budgetCategory === 'Transfers' || t.budgetCategory === 'Income') continue;
    const key = t.budgetCategory;
    actualByCategory.set(key, (actualByCategory.get(key) || 0) + t.amount);
  }

  const allCategories = new Set([...budgetByCategory.keys(), ...actualByCategory.keys()]);
  const categorySpending = Array.from(allCategories)
    .map((cat) => ({
      category: cat,
      budgeted: budgetByCategory.get(cat) || 0,
      actual: Math.round((actualByCategory.get(cat) || 0) * 100) / 100,
    }))
    .sort((a, b) => b.actual - a.actual);

  const totalBudgetedExpenses = plan
    .filter((p) => p.section !== 'INCOME')
    .reduce((s, p) => s + p.budgeted, 0);

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);

  const now = new Date();
  const monthName = getCurrentMonthName();
  const year = now.getFullYear();

  return {
    month: monthName,
    year,
    totalIncome: Math.round(income * 100) / 100,
    totalExpenses: Math.round(expenses * 100) / 100,
    totalBudgetedExpenses,
    categorySpending,
    recentTransactions: transactions,
    debts,
    totalDebt,
    savingsGoals,
    transactionCount: transactions.length,
    hasSpreadsheet: true,
  };
}
