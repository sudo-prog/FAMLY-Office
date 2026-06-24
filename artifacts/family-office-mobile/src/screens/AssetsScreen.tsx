import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

const mockAssets = [
  { id: 1, name: "Primary Residence", category: "Property", value: 850000, currency: "AUD" },
  { id: 2, name: "Investment Property", category: "Property", value: 350000, currency: "AUD" },
  { id: 3, name: "ASX Portfolio", category: "Equities", value: 450000, currency: "AUD" },
  { id: 4, name: "US Stocks", category: "Equities", value: 300000, currency: "AUD" },
  { id: 5, name: "Savings Account", category: "Cash", value: 180000, currency: "AUD" },
  { id: 6, name: "Term Deposit", category: "Cash", value: 140000, currency: "AUD" },
  { id: 7, name: "Bitcoin", category: "Crypto", value: 120000, currency: "AUD" },
  { id: 8, name: "Ethereum", category: "Crypto", value: 60000, currency: "AUD" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const categoryColors: Record<string, string> = {
  Property: "#22c55e",
  Equities: "#3b82f6",
  Cash: "#eab308",
  Crypto: "#f97316",
};

export default function AssetsScreen() {
  const totalValue = mockAssets.reduce((sum, a) => sum + a.value, 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Assets</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Value</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalValue)}</Text>
      </View>

      {mockAssets.map((asset) => (
        <TouchableOpacity key={asset.id} style={styles.assetCard}>
          <View style={styles.assetHeader}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColors[asset.category] || "#64748b" }]} />
            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>{asset.name}</Text>
              <Text style={styles.assetCategory}>{asset.category}</Text>
            </View>
            <Text style={styles.assetValue}>{formatCurrency(asset.value)}</Text>
          </View>
        </TouchableOpacity>
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
  totalCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#22c55e",
    marginTop: 4,
  },
  assetCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  assetHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#e2e8f0",
  },
  assetCategory: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  assetValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e2e8f0",
  },
});
