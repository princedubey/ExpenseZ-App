import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Platform, Modal, Pressable, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useColors } from '@/constants/Colors';
import { Metrics } from '@/constants/Metrics';
import { Typography } from '@/constants/Typography';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import type { StoreState, Transaction } from '@/store/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCategoryColor } from '@/constants/Categories';
import { Input } from '@/components/ui/Input';
import DateTimePicker from '@react-native-community/datetimepicker';

type FilterType = 'all' | 'cash_in' | 'cash_out' | 'investment' | 'loan' | 'today' | 'this_week' | 'this_month' | 'custom_date';
type ExportFormat = 'csv' | 'pdf';
type DateRange = { startDate: Date | null; endDate: Date | null };

const filterOptions: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Cash In', value: 'cash_in' },
  { label: 'Cash Out', value: 'cash_out' },
  { label: 'Investments', value: 'investment' },
  { label: 'Loans', value: 'loan' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
];

const formatShortDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatRangeLabel = (range: DateRange) => {
  if (!range.startDate && !range.endDate) return 'Select date range';
  if (range.startDate && !range.endDate) return formatShortDate(range.startDate);
  if (!range.startDate && range.endDate) return formatShortDate(range.endDate);
  return `${formatShortDate(range.startDate as Date)} - ${formatShortDate(range.endDate as Date)}`;
};

const getTodayRange = () => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

const getThisWeekRange = () => {
  const now = new Date();
  const startDate = new Date(now);
  const dayIndex = now.getDay();
  const diffToMonday = (dayIndex + 6) % 7;
  startDate.setDate(now.getDate() - diffToMonday);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

const getThisMonthRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};

const getResolvedDateRange = (filter: FilterType, range: DateRange) => {
  if (filter === 'today') return getTodayRange();
  if (filter === 'this_week') return getThisWeekRange();
  if (filter === 'this_month') return getThisMonthRange();
  if (filter === 'custom_date') return range;
  return { startDate: null, endDate: null };
};

const getFilterQuery = (filter: FilterType, range: DateRange) => {
  const query: {
    type?: 'cash_in' | 'cash_out' | 'investment' | 'loan';
    startDate?: string;
    endDate?: string;
  } = {};

  if (filter === 'cash_in' || filter === 'cash_out' || filter === 'investment' || filter === 'loan') {
    query.type = filter;
  }

  const resolvedRange = getResolvedDateRange(filter, range);
  if (resolvedRange.startDate) query.startDate = resolvedRange.startDate.toISOString();
  if (resolvedRange.endDate) query.endDate = resolvedRange.endDate.toISOString();

  return query;
};

const getFilterLabel = (filter: FilterType, range: DateRange) => {
  if (filter === 'custom_date') return formatRangeLabel(range);
  return filterOptions.find((item) => item.value === filter)?.label || 'All';
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

const escapeCsv = (value: string | number | null | undefined) => {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const buildCsv = (items: Transaction[]) => {
  const cashIn = items.filter((item) => item.type === 'cash_in').reduce((sum, item) => sum + item.amount, 0);
  const cashOut = items.filter((item) => item.type === 'cash_out').reduce((sum, item) => sum + item.amount, 0);
  const investments = items.filter((item) => item.type === 'investment').reduce((sum, item) => sum + item.amount, 0);
  const loans = items.filter((item) => item.type === 'loan').reduce((sum, item) => sum + item.amount, 0);
  const netFlow = cashIn - cashOut - investments - loans;

  const rows = [
    [
      'Date',
      'Title',
      'Category',
      'Type',
      'Source',
      'Amount (INR)',
      'Cash Impact (INR)',
      'Note',
    ],
    ...items.map((item) => {
      const signedAmount =
        item.type === 'cash_out' || item.type === 'investment' || item.type === 'loan'
          ? -Math.abs(item.amount)
          : Math.abs(item.amount);

      const titleVal = (item.title && item.title !== item.note) ? item.title : (item.category || 'Transaction');

      return [
        formatDate(item.transactionDate || item.date || item.createdAt),
        titleVal,
        item.category || 'Uncategorized',
        item.type.replace('_', ' ').toUpperCase(),
        item.source || 'balance',
        item.amount,
        signedAmount,
        item.note || '',
      ].map(escapeCsv);
    }),
    [],
    ['Summary'].map(escapeCsv),
    ['Total Cash In', cashIn].map(escapeCsv),
    ['Total Cash Out', cashOut].map(escapeCsv),
    ['Total Investments', investments].map(escapeCsv),
    ['Total Loans & EMIs', loans].map(escapeCsv),
    ['Net Cash Flow', netFlow].map(escapeCsv),
  ];

  return rows.map((row) => row.join(',')).join('\n');
};

const buildPdfHtml = (items: Transaction[], activeFilterLabel: string) => {
  const cashIn = items.filter((item) => item.type === 'cash_in').reduce((sum, item) => sum + item.amount, 0);
  const cashOut = items.filter((item) => item.type === 'cash_out').reduce((sum, item) => sum + item.amount, 0);
  const investments = items.filter((item) => item.type === 'investment').reduce((sum, item) => sum + item.amount, 0);
  const loans = items.filter((item) => item.type === 'loan').reduce((sum, item) => sum + item.amount, 0);
  const netFlow = cashIn - cashOut - investments - loans;

  const rows = items
    .map((item) => {
      const impact =
        item.type === 'cash_out' || item.type === 'investment' || item.type === 'loan'
          ? -Math.abs(item.amount)
          : Math.abs(item.amount);
      const catColor = getCategoryColor(item.category);

      let badgeClass = 'badge-cash-out';
      let typeLabel = 'CASH OUT';
      if (item.type === 'cash_in') {
        badgeClass = 'badge-cash-in';
        typeLabel = 'CASH IN';
      } else if (item.type === 'investment') {
        badgeClass = 'badge-investment';
        typeLabel = 'INVESTMENT';
      } else if (item.type === 'loan') {
        badgeClass = 'badge-loan';
        typeLabel = 'LOAN / EMI';
      }

      return `
        <tr>
          <td style="font-weight: 500;">${formatDate(item.transactionDate || item.date || item.createdAt)}</td>
          <td style="font-weight: 600;">${item.title || item.note || item.category || 'Transaction'}</td>
          <td>
            <div class="category-cell">
              <span class="category-dot" style="background-color: ${catColor};"></span>
              <span>${item.category || 'Uncategorized'}</span>
            </div>
          </td>
          <td><span class="badge ${badgeClass}">${typeLabel}</span></td>
          <td style="text-transform: uppercase; font-size: 11px; font-weight: 600; color: #64748b;">${item.source || 'balance'}</td>
          <td class="amount-text" style="font-size: 13px;">Rs. ${item.amount.toLocaleString('en-IN')}</td>
          <td class="amount-text ${impact < 0 ? 'amount-negative' : 'amount-positive'}">${impact < 0 ? '-' : '+'}Rs. ${Math.abs(impact).toLocaleString('en-IN')}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            padding: 40px;
            margin: 0;
            background-color: #f8fafc;
          }
          .header-card {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            border-radius: 24px;
            padding: 32px 40px;
            margin-bottom: 32px;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
            position: relative;
          }
          .eyebrow {
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 11px;
            font-weight: 700;
            color: #a5b4fc;
            margin: 0 0 8px 0;
          }
          h1 {
            margin: 0;
            font-size: 30px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .meta-info {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 8px;
            font-weight: 500;
          }
          .metrics-container {
            display: flex;
            gap: 12px;
            margin-bottom: 32px;
            flex-wrap: wrap;
          }
          .metric-card {
            flex: 1;
            min-width: 140px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 16px 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
          }
          .metric-label {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin-bottom: 6px;
          }
          .metric-value {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #0f172a;
          }
          .metric-positive {
            color: #10b981;
          }
          .metric-negative {
            color: #ef4444;
          }
          .table-container {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #f8fafc;
            padding: 18px 24px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #475569;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
          }
          td {
            padding: 16px 24px;
            font-size: 13px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge-cash-in {
            background-color: #ecfdf5;
            color: #059669;
          }
          .badge-cash-out {
            background-color: #fef2f2;
            color: #dc2626;
          }
          .badge-investment {
            background-color: #eff6ff;
            color: #2563eb;
          }
          .badge-loan {
            background-color: #fffbeb;
            color: #d97706;
          }
          .amount-text {
            font-weight: 700;
          }
          .amount-positive {
            color: #10b981;
          }
          .amount-negative {
            color: #ef4444;
          }
          .category-cell {
            display: flex;
            align-items: center;
          }
          .category-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
          }
          .empty-state {
            text-align: center;
            padding: 64px 32px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header-card">
          <p class="eyebrow">ExpenseZ export</p>
          <h1>${activeFilterLabel} transactions</h1>
          <div class="meta-info">Exported on ${new Date().toLocaleString('en-US')}</div>
        </div>

        <div class="metrics-container">
          <div class="metric-card">
            <div class="metric-label">Transactions</div>
            <div class="metric-value">${items.length}</div>
          </div>
          <div class="metric-card" style="background-color: #fef9c3; border-color: #fde047;">
            <div class="metric-label">Cash In</div>
            <div class="metric-value" style="color: #10b981;">Rs. ${cashIn.toLocaleString('en-IN')}</div>
          </div>
          <div class="metric-card" style="background-color: #fef9c3; border-color: #fde047;">
            <div class="metric-label">Cash Out</div>
            <div class="metric-value" style="color: #ef4444;">Rs. ${cashOut.toLocaleString('en-IN')}</div>
          </div>
          <div class="metric-card" style="background-color: #fef9c3; border-color: #fde047;">
            <div class="metric-label">Investments</div>
            <div class="metric-value" style="color: #2563eb;">Rs. ${investments.toLocaleString('en-IN')}</div>
          </div>
          <div class="metric-card" style="background-color: #fef9c3; border-color: #fde047;">
            <div class="metric-label">Loans & EMIs</div>
            <div class="metric-value" style="color: #d97706;">Rs. ${loans.toLocaleString('en-IN')}</div>
          </div>
          <div class="metric-card" style="background-color: ${netFlow < 0 ? '#fef2f2' : '#f0fdf4'}; border-color: ${netFlow < 0 ? '#fee2e2' : '#dcfce7'};">
            <div class="metric-label" style="color: ${netFlow < 0 ? '#991b1b' : '#166534'};">Net Cash Flow</div>
            <div class="metric-value ${netFlow < 0 ? 'metric-negative' : 'metric-positive'}">
              ${netFlow < 0 ? '-' : '+'}Rs. ${Math.abs(netFlow).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        ${items.length === 0 ? `
          <div class="table-container">
            <div class="empty-state">No transactions available for the selected filter.</div>
          </div>
        ` : `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Cash Impact</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `}
      </body>
    </html>
  `;
};

const shareCsv = async (csv: string, activeFilterLabel: string) => {
  const fileName = `expensez-${activeFilterLabel.toLowerCase().replace(/\s+/g, '-')}-transactions-${Date.now()}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = globalThis.document?.createElement('a');
    if (!link) return;
    link.href = url;
    link.download = fileName;
    globalThis.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export transactions as CSV',
    });
  }
};

const sharePdf = async (items: Transaction[], html: string, activeFilterLabel: string) => {
  const cashIn = items.filter((item) => item.type === 'cash_in').reduce((sum, item) => sum + item.amount, 0);
  const cashOut = items.filter((item) => item.type === 'cash_out').reduce((sum, item) => sum + item.amount, 0);
  const investments = items.filter((item) => item.type === 'investment').reduce((sum, item) => sum + item.amount, 0);
  const loans = items.filter((item) => item.type === 'loan').reduce((sum, item) => sum + item.amount, 0);
  const netFlow = cashIn - cashOut - investments - loans;

  if (Platform.OS === 'web') {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 120, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('ExpenseZ export', 40, 36);
    doc.setFontSize(22);
    doc.text(`${activeFilterLabel} transactions`, 40, 62);
    doc.setFontSize(11);
    doc.text(`Exported on ${new Date().toLocaleString('en-US')}`, 40, 84);

    const summaryRows = [
      ['Transactions', String(items.length)],
      ['Cash In', `Rs. ${cashIn.toLocaleString('en-IN')}`],
      ['Cash Out', `Rs. ${cashOut.toLocaleString('en-IN')}`],
      ['Investments', `Rs. ${investments.toLocaleString('en-IN')}`],
      ['Loans & EMIs', `Rs. ${loans.toLocaleString('en-IN')}`],
      ['Net Cash Flow', `${netFlow < 0 ? '-' : '+'}Rs. ${Math.abs(netFlow).toLocaleString('en-IN')}`],
    ];

    autoTable(doc, {
      startY: 140,
      head: [['Metric', 'Value']],
      body: summaryRows,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 8,
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [239, 246, 255],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 180 },
        1: { cellWidth: 180 },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.row.index >= 1 && data.row.index <= 4) {
          data.cell.styles.fillColor = [254, 249, 195]; // light yellow
        }
      },
    });

    const rows = items.map((item) => {
      const impact =
        item.type === 'cash_out' || item.type === 'investment' || item.type === 'loan'
          ? -Math.abs(item.amount)
          : Math.abs(item.amount);
      return [
        formatDate(item.transactionDate || item.date || item.createdAt),
        item.title || item.note || item.category || 'Transaction',
        item.category || '—',
        item.type.replace('_', ' ').toUpperCase(),
        item.source || 'balance',
        `Rs. ${item.amount.toLocaleString('en-IN')}`,
        `${impact < 0 ? '-' : '+'}Rs. ${Math.abs(impact).toLocaleString('en-IN')}`,
      ];
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 24 : 220,
      head: [['Date', 'Title', 'Category', 'Type', 'Source', 'Amount', 'Cash Impact']],
      body: rows,
      theme: 'striped',
      styles: {
        fontSize: 8.5,
        cellPadding: 6,
        overflow: 'linebreak',
        valign: 'top',
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 6) {
          const text = String(data.cell.raw || '');
          const isNegative = text.startsWith('-');
          data.cell.styles.textColor = isNegative ? [217, 45, 32] : [18, 183, 106];
        }
      },
    });

    doc.save(`expensez-${activeFilterLabel.toLowerCase().replace(/\s+/g, '-')}-transactions.pdf`);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export transactions as PDF',
    });
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'Food & Dining':
      return 'fast-food-outline';
    case 'Transport':
      return 'car-outline';
    case 'Shopping':
      return 'cart-outline';
    case 'Entertainment':
      return 'film-outline';
    case 'Bills & Utilities':
      return 'receipt-outline';
    case 'EMI & Loans':
      return 'wallet-outline';
    case 'Health & Medical':
      return 'medical-outline';
    case 'Education':
      return 'book-outline';
    case 'Travel':
      return 'airplane-outline';
    case 'Groceries':
      return 'basket-outline';
    case 'Rent':
      return 'home-outline';
    case 'Salary':
      return 'cash-outline';
    case 'Business':
      return 'briefcase-outline';
    case 'Investment':
      return 'trending-up-outline';
    case 'Rental Income':
      return 'home-outline';
    case 'Freelance':
      return 'laptop-outline';
    case 'Stock':
      return 'analytics-outline';
    case 'Mutual Fund':
      return 'pie-chart-outline';
    case 'Crypto':
      return 'logo-bitcoin';
    default:
      return 'options-outline';
  }
};

export default function TransactionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useColors();
  
  const initialFilter = (params.filter as FilterType) || 'all';
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);

  useEffect(() => {
    if (params.filter && typeof params.filter === 'string') {
      setActiveFilter(params.filter as FilterType);
    }
  }, [params.filter]);
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [isExportMenuVisible, setIsExportMenuVisible] = useState(false);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [customDateActive, setCustomDateActive] = useState(false);
  const [pickingDateType, setPickingDateType] = useState<'start' | 'end' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  const handleCustomDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && pickingDateType) {
      setCustomDateRange((prev) => ({
        ...prev,
        [pickingDateType === 'start' ? 'startDate' : 'endDate']: selectedDate,
      }));
    }
  }, [pickingDateType]);

  // Get store selectors
  const transactions = useStore((state: StoreState) => state.transactions);
  const loading = useStore((state: StoreState) => state.loading);
  const error = useStore((state: StoreState) => state.error);
  const pagination = useStore((state: StoreState) => state.pagination);
  const fetchTransactions = useStore((state: StoreState) => state.fetchTransactions);
  const setTransactions = useStore((state: StoreState) => state.setTransactions);
  const stats = useStore((state: StoreState) => state.stats);
  const getUserStats = useStore((state: StoreState) => state.getUserStats);

  const activeFilterLabel = getFilterLabel(activeFilter, customDateRange);

  const fetchAllTransactionsForExport = useCallback(async () => {
    const stored = await AsyncStorage.getItem('@expensez_transactions');
    let allTx: Transaction[] = stored ? JSON.parse(stored) : [];
    
    allTx = allTx.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    if (activeFilter !== 'all') {
      allTx = allTx.filter((t) => t.type === activeFilter);
    }
    return allTx;
  }, [activeFilter]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      setIsExportMenuVisible(false);
      setExportingFormat(format);
      const items = await fetchAllTransactionsForExport();

      if (format === 'csv') {
        await shareCsv(buildCsv(items), activeFilterLabel);
      } else {
        await sharePdf(items, buildPdfHtml(items, activeFilterLabel), activeFilterLabel);
      }

      showToast(`${format.toUpperCase()} export ready`, 'success');
    } catch (error: any) {
      showToast(error?.message || `Failed to export ${format.toUpperCase()}`, 'error');
    } finally {
      setExportingFormat(null);
    }
  }, [fetchAllTransactionsForExport, activeFilterLabel, showToast]);

  const openExportMenu = () => setIsExportMenuVisible(true);
  const closeExportMenu = () => setIsExportMenuVisible(false);

  // Load transactions with current filter
  const loadTransactions = useCallback(async (page = 1) => {
    try {
      // Reset transactions when changing filters or refreshing
      if (page === 1) {
        setTransactions([]);
      }

      const filterQuery = getFilterQuery(activeFilter, customDateRange);
      const params = {
        page,
        limit: 10,
        ...filterQuery,
      };

      await fetchTransactions(params);
    } catch (error: any) {
      showToast(error?.message || 'Failed to load transactions', 'error');
    }
  }, [activeFilter, customDateRange, fetchTransactions, showToast, setTransactions]);

  // Initial load
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Load stats
  useEffect(() => {
    getUserStats().catch((error) => {
      showToast(error?.message || 'Failed to load stats', 'error');
    });
  }, [getUserStats, showToast]);

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // Refresh transactions when filter changes
  useEffect(() => {
    loadTransactions(1);
  }, [activeFilter, loadTransactions]);

  // Handle refresh
  const handleRefresh = () => {
    loadTransactions(1);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages) {
      loadTransactions(pagination.currentPage + 1);
    }
  };

  // Handle transaction selection
  const handleTransactionSelect = (transaction: Transaction) => {
    const transactionId = transaction.id || transaction._id;
    console.log('[transactions.tsx] Selected transaction for edit:', transactionId);
    router.push(`/(modals)/transactions/add?id=${transactionId}`);
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions(1);
      getUserStats().catch((error) => {
        showToast(error?.message || 'Failed to load stats', 'error');
      });
    }, [loadTransactions, getUserStats, showToast])
  );

  // Filter transactions locally by search query
  const displayedTransactions = transactions.filter((item) => {
    if (!searchQuery) return true;
    const titleMatch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const noteMatch = (item.note || '').toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || noteMatch || categoryMatch;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.title, { color: colors.light.text }]}>Transactions</Text>
          <Text style={[styles.subtitle, { color: colors.gray[500] }]}>Manage your cash flows & balances</Text>
        </View>
        <TouchableOpacity
          style={[styles.exportIconButton, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}
          onPress={openExportMenu}
          activeOpacity={0.85}
        >
          <Ionicons name="download-outline" size={20} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Summary Banner */}
      <View style={[styles.summaryBanner, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
        {/* Row 1: Balance, Inflow, Outflow */}
        <View style={styles.bannerRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.gray[500] }]}>BALANCE</Text>
            <Text style={[styles.summaryAmount, { color: colors.light.text }]} numberOfLines={1}>
              {formatCurrency(stats?.savings || 0)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.light.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.gray[500] }]}>CASH IN</Text>
            <Text style={[styles.summaryAmount, { color: colors.success[600] }]} numberOfLines={1}>
              {formatCurrency(stats?.cashIn || 0)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.light.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.gray[500] }]}>CASH OUT</Text>
            <Text style={[styles.summaryAmount, { color: colors.error[600] }]} numberOfLines={1}>
              {formatCurrency(stats?.cashOut || 0)}
            </Text>
          </View>
        </View>

        {/* Horizontal Divider */}
        <View style={[styles.bannerHorizontalDivider, { backgroundColor: colors.light.border }]} />

        {/* Row 2: Investments and Loans */}
        <View style={styles.bannerRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.gray[500] }]}>INVESTMENTS</Text>
            <Text style={[styles.summaryAmount, { color: colors.warning[600] }]} numberOfLines={1}>
              {formatCurrency(stats?.investments || 0)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.light.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.gray[500] }]}>LOANS & EMI</Text>
            <Text style={[styles.summaryAmount, { color: colors.accent[600] }]} numberOfLines={1}>
              {formatCurrency(stats?.loans || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Input Row */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Input
              placeholder="Search transactions..."
              placeholderTextColor={colors.gray[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Ionicons name="search-outline" size={18} color={colors.gray[400]} />}
              rightIcon={
                searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
                  </TouchableOpacity>
                ) : undefined
              }
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
          {(() => {
            const isDateActive = ['today', 'this_week', 'this_month', 'custom_date'].includes(activeFilter);
            return (
              <TouchableOpacity
                style={[
                  styles.dateFilterIconButton,
                  {
                    backgroundColor: isDateActive ? colors.primary[600] : colors.light.card,
                    borderColor: isDateActive ? colors.primary[600] : colors.light.border,
                  },
                  isDateActive && {
                    shadowColor: colors.primary[600],
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: 2,
                  }
                ]}
                onPress={() => setIsDateModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={isDateActive ? '#ffffff' : colors.primary[600]}
                />
              </TouchableOpacity>
            );
          })()}
        </View>
      </View>

      {/* Modern Filter Switcher Dashboard */}
      <View style={styles.filterDashboardContainer}>
        {/* Primary Segmented Tab Switcher */}
        <View style={[styles.segmentedContainer, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
          {[
            { label: 'All', value: 'all' as FilterType, activeColor: colors.primary[600] },
            { label: 'Cash In', value: 'cash_in' as FilterType, activeColor: colors.success[600] },
            { label: 'Cash Out', value: 'cash_out' as FilterType, activeColor: colors.error[600] },
          ].map((tab) => {
            const isActive = activeFilter === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[
                  styles.segmentTab,
                  isActive && {
                    backgroundColor: tab.activeColor,
                    shadowColor: tab.activeColor,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.24,
                    shadowRadius: 8,
                    elevation: 3,
                  },
                ]}
                onPress={() => handleFilterChange(tab.value)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: isActive ? '#ffffff' : colors.gray[500],
                      fontFamily: isActive ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Toggles ScrollView */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFiltersContainer}
        >
          {/* Investments Toggle */}
          <TouchableOpacity
            style={[
              styles.quickFilterChip,
              {
                backgroundColor: activeFilter === 'investment' ? colors.warning[600] : colors.light.card,
                borderColor: activeFilter === 'investment' ? colors.warning[600] : colors.light.border,
              },
              activeFilter === 'investment' && {
                shadowColor: colors.warning[600],
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 2,
              }
            ]}
            onPress={() => handleFilterChange(activeFilter === 'investment' ? 'all' : 'investment')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="trending-up-outline"
              size={14}
              color={activeFilter === 'investment' ? '#ffffff' : colors.warning[600]}
              style={styles.quickFilterIcon}
            />
            <Text
              style={[
                styles.quickFilterText,
                {
                  color: activeFilter === 'investment' ? '#ffffff' : colors.gray[500],
                  fontFamily: activeFilter === 'investment' ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
                },
              ]}
            >
              Investments
            </Text>
          </TouchableOpacity>

          {/* Loans Toggle */}
          <TouchableOpacity
            style={[
              styles.quickFilterChip,
              {
                backgroundColor: activeFilter === 'loan' ? colors.accent[600] : colors.light.card,
                borderColor: activeFilter === 'loan' ? colors.accent[600] : colors.light.border,
              },
              activeFilter === 'loan' && {
                shadowColor: colors.accent[600],
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 2,
              }
            ]}
            onPress={() => handleFilterChange(activeFilter === 'loan' ? 'all' : 'loan')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="wallet-outline"
              size={14}
              color={activeFilter === 'loan' ? '#ffffff' : colors.accent[600]}
              style={styles.quickFilterIcon}
            />
            <Text
              style={[
                styles.quickFilterText,
                {
                  color: activeFilter === 'loan' ? '#ffffff' : colors.gray[500],
                  fontFamily: activeFilter === 'loan' ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
                },
              ]}
            >
              Loans & Liabilities
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Active Date Filter Readout Badge */}
      {(() => {
        const isDateActive = ['today', 'this_week', 'this_month', 'custom_date'].includes(activeFilter);
        if (!isDateActive) return null;
        return (
          <View style={styles.activeFilterRow}>
            <View style={[styles.activeFilterBadge, { backgroundColor: colors.primary[50] + '18', borderColor: colors.primary[600] + '20' }]}>
              <Ionicons name="calendar-outline" size={13} color={colors.primary[600]} style={{ marginRight: 6 }} />
              <Text style={[styles.activeFilterText, { color: colors.primary[700] || colors.primary[600] }]}>
                Active Date: {activeFilter === 'today' ? 'Today' : activeFilter === 'this_week' ? 'This Week' : activeFilter === 'this_month' ? 'This Month' : formatRangeLabel(customDateRange)}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCustomDateRange({ startDate: null, endDate: null });
                  handleFilterChange('all');
                }}
                style={styles.clearActiveFilterButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={15} color={colors.primary[600]} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}


      {/* Export Modal */}
      <Modal transparent visible={isExportMenuVisible} animationType="fade" onRequestClose={closeExportMenu}>
        <Pressable style={styles.menuOverlay} onPress={closeExportMenu}>
          <Pressable style={[styles.exportMenu, { backgroundColor: colors.light.card, borderColor: colors.light.border }]} onPress={() => {}}>
            <Text style={[styles.exportMenuTitle, { color: colors.light.text }]}>Export format</Text>
            <Text style={[styles.exportMenuSubtitle, { color: colors.gray[500] }]}>Choose a format for the selected transactions.</Text>

            <TouchableOpacity
              style={[styles.exportMenuItem, { borderColor: colors.primary[600] + '22' }]}
              onPress={() => handleExport('csv')}
              activeOpacity={0.85}
            >
              {exportingFormat === 'csv' ? (
                <ActivityIndicator size="small" color={colors.primary[600]} />
              ) : (
                <Ionicons name="document-text-outline" size={18} color={colors.primary[600]} />
              )}
              <View style={styles.exportMenuItemText}>
                <Text style={[styles.exportMenuItemTitle, { color: colors.light.text }]}>CSV</Text>
                <Text style={[styles.exportMenuItemSubtitle, { color: colors.gray[500] }]}>Spreadsheet and analytics format.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportMenuItem, { borderColor: colors.primary[600] + '22' }]}
              onPress={() => handleExport('pdf')}
              disabled={exportingFormat !== null}
              activeOpacity={0.85}
            >
              {exportingFormat === 'pdf' ? (
                <ActivityIndicator size="small" color={colors.primary[600]} />
              ) : (
                <Ionicons name="download-outline" size={18} color={colors.primary[600]} />
              )}
              <View style={styles.exportMenuItemText}>
                <Text style={[styles.exportMenuItemTitle, { color: colors.light.text }]}>PDF</Text>
                <Text style={[styles.exportMenuItemSubtitle, { color: colors.gray[500] }]}>Sleek, printable report document.</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Filter Modal */}
      <Modal transparent visible={isDateModalVisible} animationType="fade" onRequestClose={() => setIsDateModalVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setIsDateModalVisible(false)}>
          <Pressable style={[styles.exportMenu, { backgroundColor: colors.light.card, borderColor: colors.light.border }]} onPress={() => {}}>
            <View style={styles.modalHeaderRow}>
              {customDateActive && (
                <TouchableOpacity onPress={() => setCustomDateActive(false)} style={styles.modalBackButton}>
                  <Ionicons name="arrow-back-outline" size={20} color={colors.light.text} />
                </TouchableOpacity>
              )}
              <Text style={[styles.exportMenuTitle, { color: colors.light.text, marginLeft: customDateActive ? 8 : 0 }]}>
                {customDateActive ? 'Select Custom Range' : 'Filter by Date'}
              </Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setIsDateModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close-outline" size={22} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.exportMenuSubtitle, { color: colors.gray[500], marginBottom: Metrics.md }]}>
              {customDateActive 
                ? 'Select a start date and end date for the transaction feed.'
                : 'Choose a standard date range or set a custom interval.'
              }
            </Text>

            {!customDateActive ? (
              <View style={styles.dateOptionsContainer}>
                {[
                  { label: 'All Time', value: 'all' as FilterType, icon: 'infinite-outline' },
                  { label: 'Today', value: 'today' as FilterType, icon: 'today-outline' },
                  { label: 'This Week', value: 'this_week' as FilterType, icon: 'calendar-outline' },
                  { label: 'This Month', value: 'this_month' as FilterType, icon: 'time-outline' },
                ].map((option) => {
                  const isOptionActive = activeFilter === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dateOptionRow, 
                        { borderColor: colors.light.border },
                        isOptionActive && { backgroundColor: colors.primary[50] + '12', borderColor: colors.primary[500] }
                      ]}
                      onPress={() => {
                        handleFilterChange(option.value);
                        setIsDateModalVisible(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.dateOptionIconContainer, { backgroundColor: colors.primary[50] + '15' }]}>
                        <Ionicons name={option.icon as any} size={18} color={colors.primary[600]} />
                      </View>
                      <Text style={[styles.dateOptionLabel, { color: colors.light.text, fontFamily: isOptionActive ? Typography.fontFamily.semiBold : Typography.fontFamily.medium }]}>
                        {option.label}
                      </Text>
                      {isOptionActive && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary[600]} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Custom Range button row */}
                <TouchableOpacity
                  style={[
                    styles.dateOptionRow, 
                    { borderColor: colors.light.border },
                    activeFilter === 'custom_date' && { backgroundColor: colors.primary[50] + '12', borderColor: colors.primary[500] }
                  ]}
                  onPress={() => {
                    setCustomDateActive(true);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.dateOptionIconContainer, { backgroundColor: colors.primary[50] + '15' }]}>
                    <Ionicons name="calendar-number-outline" size={18} color={colors.primary[600]} />
                  </View>
                  <Text style={[styles.dateOptionLabel, { color: colors.light.text }]}>
                    Custom Range...
                  </Text>
                  {activeFilter === 'custom_date' && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary[600]} />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.customDateContainer}>
                <View style={styles.datePickerButtonsRow}>
                  {/* Start Date Button */}
                  <View style={{ flex: 1, marginRight: Metrics.xs }}>
                    <Text style={[styles.datePickerFieldLabel, { color: colors.gray[500] }]}>START DATE</Text>
                    <TouchableOpacity
                      style={[styles.datePickerTriggerButton, { backgroundColor: colors.light.background, borderColor: colors.light.border }]}
                      onPress={() => {
                        setPickingDateType('start');
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary[600]} style={{ marginRight: 6 }} />
                      <Text style={[styles.datePickerTriggerText, { color: customDateRange.startDate ? colors.light.text : colors.gray[400] }]}>
                        {customDateRange.startDate ? formatShortDate(customDateRange.startDate) : 'Select start'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* End Date Button */}
                  <View style={{ flex: 1, marginLeft: Metrics.xs }}>
                    <Text style={[styles.datePickerFieldLabel, { color: colors.gray[500] }]}>END DATE</Text>
                    <TouchableOpacity
                      style={[styles.datePickerTriggerButton, { backgroundColor: colors.light.background, borderColor: colors.light.border }]}
                      onPress={() => {
                        setPickingDateType('end');
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary[600]} style={{ marginRight: 6 }} />
                      <Text style={[styles.datePickerTriggerText, { color: customDateRange.endDate ? colors.light.text : colors.gray[400] }]}>
                        {customDateRange.endDate ? formatShortDate(customDateRange.endDate) : 'Select end'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Apply Button */}
                <TouchableOpacity
                  style={[
                    styles.applyDateButton,
                    { backgroundColor: colors.primary[600] },
                    (!customDateRange.startDate || !customDateRange.endDate) && { opacity: 0.5 }
                  ]}
                  disabled={!customDateRange.startDate || !customDateRange.endDate}
                  onPress={() => {
                    handleFilterChange('custom_date');
                    setIsDateModalVisible(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.applyDateButtonText}>Apply Custom Range</Text>
                </TouchableOpacity>

                {/* Clear Range Button */}
                <TouchableOpacity
                  style={[styles.clearDateButton]}
                  onPress={() => {
                    setCustomDateRange({ startDate: null, endDate: null });
                    handleFilterChange('all');
                    setIsDateModalVisible(false);
                    setCustomDateActive(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.clearDateButtonText, { color: colors.error[600] }]}>Clear & Reset Filter</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={
            pickingDateType === 'start'
              ? (customDateRange.startDate || new Date())
              : (customDateRange.endDate || new Date())
          }
          mode="date"
          display="default"
          onChange={handleCustomDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Transactions List */}
      <FlatList
        data={displayedTransactions}
        keyExtractor={(item) => item.id || item._id}
        renderItem={({ item }) => {
          const catColor = getCategoryColor(item.category);
          const itemId = item.id || item._id;
          const isNegative = item.type === 'cash_out' || item.type === 'loan' || (item.type === 'investment' && item.source !== 'existing');
          return (
            <TouchableOpacity
              key={itemId}
              style={[styles.transactionCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}
              onPress={() => handleTransactionSelect(item)}
              activeOpacity={0.9}
            >
              <View style={styles.transactionContent}>
                {/* Category Icon Circle */}
                <View style={[styles.iconCircle, { backgroundColor: catColor + '12' }]}>
                  <Ionicons name={getCategoryIcon(item.category) as any} size={20} color={catColor} />
                </View>

                {/* Mid Section */}
                <View style={styles.midBlock}>
                  <Text style={[styles.transactionTitle, { color: colors.light.text, marginRight: Metrics.sm }]} numberOfLines={2}>
                    {item.title || item.note || item.category || 'No description'}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.transactionDate, { color: colors.gray[400] }]}>
                      {new Date(item.transactionDate || item.date || item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    {item.source && item.source.toLowerCase() !== 'balance' && (
                      <View style={[styles.sourceBadge, { backgroundColor: colors.primary[600] + '10' }]}>
                        <Text style={[styles.sourceBadgeText, { color: colors.primary[600] }]}>
                          {item.source.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Amount Section */}
                <View style={styles.amountBlock}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color: item.type === 'investment'
                          ? colors.warning[600]
                          : item.type === 'loan'
                          ? colors.accent[600]
                          : item.type === 'cash_out'
                          ? colors.error[600]
                          : colors.success[600],
                      },
                    ]}
                  >
                    {isNegative ? '-' : '+'}
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} colors={[colors.primary[600]]} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image
              source={require('@/assets/images/track-expanse.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={[styles.emptyText, { color: colors.light.text }]}>
              {error || (searchQuery ? 'No matching transactions' : 'No transactions found')}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.gray[500] }]}>
              {searchQuery 
                ? 'Try adjusting your search terms or filters.'
                : 'Start adding your cash flows, investments, and liabilities to keep track here.'
              }
            </Text>
            {(searchQuery || activeFilter !== 'all') && (
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: colors.primary[600] }]}
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
              >
                <Text style={styles.clearButtonText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary[600] }]}
        onPress={() => router.push('/(modals)/transactions/add')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Metrics.lg,
    paddingTop: Metrics.lg,
    paddingBottom: Metrics.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Metrics.sm,
  },
  headerTextBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xl,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
  },
  exportIconButton: {
    width: 40,
    height: 40,
    borderRadius: Metrics.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  summaryBanner: {
    marginHorizontal: Metrics.lg,
    paddingVertical: Metrics.sm,
    borderRadius: Metrics.borderRadius.xl,
    borderWidth: 1,
    marginBottom: Metrics.md,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Metrics.xs,
  },
  bannerHorizontalDivider: {
    height: 1,
    marginVertical: Metrics.xs,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Metrics.xs,
  },
  summaryDivider: {
    width: 1,
    height: 24,
  },
  summaryLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.sm,
  },
  searchBarContainer: {
    paddingHorizontal: Metrics.lg,
    marginBottom: Metrics.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Metrics.sm,
  },
  searchInputContainer: {
    flex: 1,
  },
  dateFilterIconButton: {
    width: 48,
    height: 48,
    borderRadius: Metrics.borderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDashboardContainer: {
    paddingHorizontal: Metrics.lg,
    marginBottom: Metrics.sm,
    gap: Metrics.sm,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: Metrics.borderRadius.full,
    borderWidth: 1,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: Metrics.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Metrics.borderRadius.full,
  },
  segmentText: {
    fontSize: Metrics.fontSizes.xs + 1,
  },
  quickFiltersContainer: {
    gap: Metrics.xs,
    paddingBottom: 4,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.sm - 2,
    borderRadius: Metrics.borderRadius.full,
    borderWidth: 1,
    marginRight: Metrics.xs,
  },
  quickFilterIcon: {
    marginRight: 6,
  },
  quickFilterText: {
    fontSize: Metrics.fontSizes.xs,
  },
  activeFilterRow: {
    paddingHorizontal: Metrics.lg,
    marginBottom: Metrics.sm,
    flexDirection: 'row',
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.sm - 2,
    borderRadius: Metrics.borderRadius.full,
    borderWidth: 1,
  },
  activeFilterText: {
    fontSize: Metrics.fontSizes.xs,
    fontFamily: Typography.fontFamily.semiBold,
  },
  clearActiveFilterButton: {
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Metrics.sm,
  },
  modalBackButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateOptionsContainer: {
    gap: Metrics.sm,
  },
  dateOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.lg,
    paddingVertical: Metrics.md - 2,
    paddingHorizontal: Metrics.md,
    marginBottom: Metrics.xs,
  },
  dateOptionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Metrics.md,
  },
  dateOptionLabel: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  customDateContainer: {
    gap: Metrics.md,
  },
  datePickerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Metrics.sm,
  },
  datePickerFieldLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 6,
  },
  datePickerTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.lg,
    paddingVertical: Metrics.sm,
    paddingHorizontal: Metrics.md,
    height: 44,
  },
  datePickerTriggerText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.xs + 1,
  },
  applyDateButton: {
    height: 48,
    borderRadius: Metrics.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Metrics.xs,
  },
  applyDateButtonText: {
    color: '#ffffff',
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
  },
  clearDateButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearDateButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  exportMenu: {
    borderTopLeftRadius: Metrics.borderRadius.xl,
    borderTopRightRadius: Metrics.borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Metrics.lg,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  exportMenuTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.lg,
  },
  exportMenuSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    marginTop: 4,
    marginBottom: Metrics.md,
    lineHeight: 18,
  },
  exportMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Metrics.sm,
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.xl,
    paddingVertical: Metrics.md,
    paddingHorizontal: Metrics.md,
    marginTop: Metrics.sm,
  },
  exportMenuItemText: {
    flex: 1,
  },
  exportMenuItemTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
  },
  exportMenuItemSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: Metrics.lg,
    paddingBottom: Metrics.xxl,
  },
  transactionCard: {
    borderRadius: Metrics.borderRadius.xl,
    borderWidth: 1,
    padding: Metrics.md,
    marginBottom: Metrics.sm,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Metrics.md,
  },
  midBlock: {
    flex: 1,
    gap: 4,
  },
  transactionTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm + 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Metrics.sm,
  },
  transactionDate: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
  },
  sourceBadge: {
    paddingHorizontal: Metrics.xs + 2,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sourceBadgeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.md - 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Metrics.xxl,
  },
  emptyImage: {
    width: 140,
    height: 140,
    marginBottom: Metrics.md,
    opacity: 0.85,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.md,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Metrics.lg,
  },
  clearButton: {
    marginTop: Metrics.md,
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.sm,
    borderRadius: Metrics.borderRadius.lg,
  },
  clearButtonText: {
    color: '#ffffff',
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
  },
  fab: {
    position: 'absolute',
    right: Metrics.lg,
    bottom: Metrics.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});