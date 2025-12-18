import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { getBills } from "../services/billService";
import { Ionicons } from "@expo/vector-icons";

const tabs = [
  { label: "Tất cả", value: "all", icon: "list" },
  { label: "Đã thanh toán", value: "paid", icon: "checkmark-circle" },
  { label: "Chưa thanh toán", value: "unpaid", icon: "time" },
];

const QLHoaDonScreen = ({ navigation }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const data = await getBills();
      console.log("📌 API trả về:", data);

      if (Array.isArray(data)) {
        setBills(data);
      } else {
        setBills([]);
      }
    } catch (error) {
      console.log("❌ Lỗi tải hóa đơn:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBills();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Không rõ";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} • ${hours}:${minutes}`;
  };

  const renderItem = ({ item }) => {
    const id = item.id || item._id;
    const tableName = item.table?.name || item.tableName || "Không rõ";
    const paymentMethod = item.paymentMethod || "không rõ";
    
    // Icon cho payment method
    const getPaymentIcon = () => {
      if (paymentMethod.toLowerCase() === 'cash') return 'cash';
      if (paymentMethod.toLowerCase() === 'momo') return 'card';
      return 'wallet';
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("InvoiceDetail", { billId: id })}
        activeOpacity={0.7}
      >
        {/* Header Card */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.codeContainer}>
              <Ionicons name="receipt" size={16} color="#007AFF" />
              <Text style={styles.codeText}>{item.code || id}</Text>
            </View>
            <View style={styles.tableContainer}>
              <Ionicons name="square-outline" size={14} color="#666" />
              <Text style={styles.tableText}>{tableName}</Text>
            </View>
          </View>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, item.paid ? styles.statusPaid : styles.statusUnpaid]}>
            <Ionicons 
              name={item.paid ? "checkmark-circle" : "time"} 
              size={14} 
              color="#fff" 
            />
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color="#999" />
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentMethod}>
            <Ionicons name={getPaymentIcon()} size={16} color="#666" />
            <Text style={styles.paymentMethodText}>
              {String(paymentMethod).toUpperCase()}
            </Text>
          </View>
          
          {item.paid && item.paidAt && (
            <Text style={styles.paidTime}>
              {formatDate(item.paidAt)}
            </Text>
          )}
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Total Amount */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalValue}>
            {item.total ? item.total.toLocaleString('vi-VN') : 0}đ
          </Text>
        </View>

        {/* Chevron */}
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  // Lọc theo tab và search query
  const filteredBills = bills.filter((bill) => {
    // Lọc theo tab
    let passTab = true;
    if (activeTab === "paid") passTab = bill.paid === true;
    if (activeTab === "unpaid") passTab = bill.paid === false;
    
    // Lọc theo search query
    let passSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const code = (bill.code || bill.id || bill._id || '').toString().toLowerCase();
      const tableName = (bill.table?.name || bill.tableName || '').toLowerCase();
      const paymentMethod = (bill.paymentMethod || '').toLowerCase();
      const total = (bill.total || 0).toString();
      
      passSearch = code.includes(query) || 
                   tableName.includes(query) || 
                   paymentMethod.includes(query) ||
                   total.includes(query);
    }
    
    return passTab && passSearch;
  });

  // Thống kê nhanh (dựa trên dữ liệu gốc, không dựa trên filtered)
  const stats = {
    total: bills.length,
    paid: bills.filter(b => b.paid).length,
    unpaid: bills.filter(b => !b.paid).length,
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Tổng số</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#28a745' }]}>{stats.paid}</Text>
          <Text style={styles.statLabel}>Đã thanh toán</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ff3b30' }]}>{stats.unpaid}</Text>
          <Text style={styles.statLabel}>Chưa thanh toán</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchBox,
          isSearchFocused && styles.searchBoxFocused
        ]}>
          <Ionicons name="search" size={20} color={isSearchFocused ? "#007AFF" : "#999"} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo mã, bàn, phương thức..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Filter */}
      <View style={styles.tabContainer}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[
              styles.tab,
              activeTab === t.value && styles.activeTab,
            ]}
            onPress={() => setActiveTab(t.value)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={t.icon} 
              size={16} 
              color={activeTab === t.value ? '#fff' : '#666'} 
            />
            <Text
              style={[
                styles.tabText,
                activeTab === t.value && styles.activeTabText,
              ]}
              numberOfLines={1}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {filteredBills.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons 
            name={searchQuery ? "search-outline" : "receipt-outline"} 
            size={64} 
            color="#ccc" 
          />
          <Text style={styles.emptyText}>
            {searchQuery ? "Không tìm thấy kết quả" : "Không có hóa đơn nào"}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery 
              ? `Không tìm thấy hóa đơn với từ khóa "${searchQuery}"`
              : activeTab === 'paid' 
                ? 'Chưa có hóa đơn đã thanh toán'
                : activeTab === 'unpaid'
                  ? 'Chưa có hóa đơn chưa thanh toán'
                  : 'Danh sách hóa đơn trống'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBills}
          keyExtractor={(item) => String(item.id || item._id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#007AFF']}
            />
          }
        />
      )}
    </View>
  );
};

export default QLHoaDonScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },

  // STATS SUMMARY
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e5e5',
    marginHorizontal: 8,
  },

  // SEARCH BAR
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBoxFocused: {
    borderColor: '#007AFF',
    shadowOpacity: 0.1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },

  // TAB CONTAINER
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    gap: 4,
    minHeight: 38,
  },
  activeTab: {
    backgroundColor: "#007AFF",
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'center',
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  tableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPaid: {
    backgroundColor: '#28a745',
  },
  statusUnpaid: {
    backgroundColor: '#ff3b30',
  },

  // DATE & PAYMENT
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#999',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  paidTime: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '500',
  },

  // DIVIDER
  cardDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },

  // TOTAL
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },

  // CHEVRON
  chevronContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
  },

  // EMPTY STATE
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
});