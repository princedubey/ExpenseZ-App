import { Transaction } from '../store/types';

// Helper to escape CSV cell content
const escapeCSVCell = (val: any): string => {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  // If the string contains quotes, commas, or newlines, escape it
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Convert Transaction array to CSV string
export const transactionsToCSV = (transactions: Transaction[]): string => {
  const headers = [
    '_id',
    'amount',
    'type',
    'source',
    'category',
    'title',
    'transactionDate',
    'note',
    'createdAt',
    'updatedAt'
  ];

  const csvRows = [headers.join(',')];

  for (const t of transactions) {
    const values = [
      t._id || t.id || '',
      t.amount || 0,
      t.type || 'cash_out',
      t.source || 'balance',
      t.category || '',
      t.title || '',
      t.transactionDate || '',
      t.note || '',
      t.createdAt || '',
      t.updatedAt || ''
    ];
    csvRows.push(values.map(escapeCSVCell).join(','));
  }

  return csvRows.join('\r\n');
};

// Parse a single CSV row, respecting quoted values
const parseCSVRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

// Parse CSV string to Transaction array
export const csvToTransactions = (csvString: string, defaultUserId: string = 'guest'): Transaction[] => {
  if (!csvString || !csvString.trim()) {
    return [];
  }

  // Split by newline, handling both \r\n and \n
  const lines = csvString.split(/\r?\n/);
  if (lines.length === 0) {
    return [];
  }

  const headers = parseCSVRow(lines[0]);
  
  // Find column indices
  const idIdx = headers.indexOf('_id');
  const amountIdx = headers.indexOf('amount');
  const typeIdx = headers.indexOf('type');
  const sourceIdx = headers.indexOf('source');
  const categoryIdx = headers.indexOf('category');
  const titleIdx = headers.indexOf('title');
  const dateIdx = headers.indexOf('transactionDate');
  const noteIdx = headers.indexOf('note');
  const createdIdx = headers.indexOf('createdAt');
  const updatedIdx = headers.indexOf('updatedAt');

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // skip empty lines

    const values = parseCSVRow(lines[i]);
    if (values.length < Math.max(typeIdx, amountIdx, titleIdx)) continue; // skip malformed lines

    const type = (values[typeIdx] || 'cash_out') as 'cash_in' | 'cash_out' | 'investment' | 'loan';
    const amount = parseFloat(values[amountIdx]) || 0;
    const title = values[titleIdx] || 'Imported Transaction';

    const transaction: Transaction = {
      _id: values[idIdx] || `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user: defaultUserId,
      amount,
      type,
      source: (values[sourceIdx] || 'balance') as 'balance' | 'existing',
      category: values[categoryIdx] || 'Uncategorized',
      title,
      transactionDate: values[dateIdx] || new Date().toISOString(),
      note: values[noteIdx] || '',
      createdAt: values[createdIdx] || new Date().toISOString(),
      updatedAt: values[updatedIdx] || new Date().toISOString()
    };

    transactions.push(transaction);
  }

  return transactions;
};
