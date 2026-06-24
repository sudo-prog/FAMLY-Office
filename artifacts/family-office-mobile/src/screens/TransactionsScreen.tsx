import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const mockTransactions = [
  { id: 1, description: "Salary Payment", amount: 18500, type: "income", category: "Salary", date: "2026-06-15" },
  { id: 2, description: "Mortgage Payment", amount: -3200, type: "expense", category: "Housing", date: "2026-06-14" },
  { id: 3, description: "Dividend - ASX", amount: 2400, type: "income", category: "Investment", date: "2026-06-12" },
  { id: 4, description: "Groceries", amount: -340, type: "expense", category: "Living", date: "2026-06-11" },
  { id: 5, description: "Electricity Bill", amount: -180, type: "expense", category: "Utilities", date: "2026-06-10" },
  { id: 6, description: "Freelance Project", amount: 5500, type: "income", category: "Business", date: "2026-06-08" },
  { id: 7, description: "Insurance Premium", amount: -420, type: "expense", category: "Insurance", date: "2026-06-05" },
  { id: 8, description: "Transfer to Savings", amount: -2000, type: "transfer", category: "Savings", date: "2026-06-04" },
  { id: 9, description: "Interest Income", amount: 120, type: "income", category: "Interest", date: "2026-06-03" },
  { id: 10, description: "Property Management", amount: -450, type: "expense", category: "Property", date: "2026-06-01" },
];

function formatCurrency(value: number) {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);
  return value < 0 ? `-${formatted}` : formatted;
}

const typeColors: Record<string, string> = {
  income: "#22c55e",
  expense: "#ef4444",
  transfer: "#3b82f6",
};

export default function TransactionsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Transactions</Text>

      {mockTransactions.map((tx) => (
        <View key={tx.id} style={styles.txCard}>
          <View style={styles.txHeader}>
            <View style={styles.txLeft}>
              <Text style={styles.txDescription}>{tx.description}</Text>
              <Text style={styles.txMeta}>
                {tx.category} &middot; {tx.date}
              </Text>
            </View>
            <Text style={[styles.txAmount, { color: typeColors[tx.type] || "#e2e8f0" }]}>
              {formatCurrency(tx.amount)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  txCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txLeft: {
    flex: 1,
    marginRight: 12,
  },
  txDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#e2e8f0",
  },
  txMeta: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
});
