import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const mockData = {
  totalNetWorth: 2450000,
  totalAssets: 2450000,
  totalLiabilities: 0,
  totalIncome: 385000,
  totalExpenses: 142000,
  assetCount: 24,
  topCategories: [
    { category: "Property", total: 1200000, count: 3 },
    { category: "Equities", total: 750000, count: 12 },
    { category: "Cash", total: 320000, count: 5 },
    { category: "Crypto", total: 180000, count: 4 },
  ],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Family Office</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Net Worth</Text>
        <Text style={styles.netWorth}>{formatCurrency(mockData.totalNetWorth)}</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Assets</Text>
          <Text style={styles.cardValue}>{formatCurrency(mockData.totalAssets)}</Text>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Income (YTD)</Text>
          <Text style={styles.cardValue}>{formatCurrency(mockData.totalIncome)}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Expenses</Text>
          <Text style={styles.cardValue}>{formatCurrency(mockData.totalExpenses)}</Text>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Holdings</Text>
          <Text style={styles.cardValue}>{mockData.assetCount}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Asset Allocation</Text>
      {mockData.topCategories.map((cat) => (
        <View key={cat.category} style={styles.listItem}>
          <View style={styles.listItemLeft}>
            <Text style={styles.listItemTitle}>{cat.category}</Text>
            <Text style={styles.listItemSub}>{cat.count} holdings</Text>
          </View>
          <Text style={styles.listItemValue}>{formatCurrency(cat.total)}</Text>
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
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  netWorth: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#60a5fa",
    marginTop: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#e2e8f0",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e2e8f0",
    marginTop: 16,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#e2e8f0",
  },
  listItemSub: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  listItemValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#60a5fa",
  },
});
