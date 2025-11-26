import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
// import { getRevenueByRange } from '../api/db.js';

export default function OverviewScreen() {
  const [showPicker, setShowPicker] = useState(null); // 'start' | 'end'
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [revenueData, setRevenueData] = useState(null);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);
   // 👉 Hàm chọn hôm nay
const handleToday = () => {
  const today = new Date();
  setStartDate(today);
  setEndDate(today);
};


  // 👉 Hàm chọn năm nay
const handleThisYear = () => {
  const year = new Date().getFullYear();
  const first = new Date(year, 0, 1); // 01/01
  const last = new Date(year, 11, 31); // 31/12
  setStartDate(first);
  setEndDate(last);
};


  // useEffect(() => {
  //   const data = getRevenueByRange(formattedStart, formattedEnd);
  //   setRevenueData(data);
  // }, [formattedStart, formattedEnd]);

const setRangeToWeek = () => {
  const today = new Date();
  const day = today.getDay(); // 0: Chủ nhật, 1: Thứ 2, ..., 6: Thứ 7
  // Tính thứ 2 của tuần hiện tại
  const diffToMonday = day === 0 ? -6 : 1 - day; 
  const first = new Date(today);
  first.setDate(today.getDate() + diffToMonday);

  const last = new Date(first);
  last.setDate(first.getDate() + 6); // Chủ nhật

  setStartDate(first);
  setEndDate(last);
};


  const setRangeToMonth = () => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(first);
    setEndDate(last);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tổng quan doanh thu</Text>

      {/* Bộ lọc thời gian */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowPicker('start')}>
          <Ionicons name="calendar-outline" size={18} color="#007AFF" />
          <Text style={styles.dateText}>Từ: {formattedStart}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowPicker('end')}>
          <Ionicons name="calendar-outline" size={18} color="#007AFF" />
          <Text style={styles.dateText}>Đến: {formattedEnd}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickButtons}>
        <TouchableOpacity style={styles.quickBtn} onPress={handleToday}>
          <Text style={styles.quickBtnText}>Hôm nay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={setRangeToWeek}>
          <Text style={styles.quickBtnText}>Tuần này</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={setRangeToMonth}>
          <Text style={styles.quickBtnText}>Tháng này</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={handleThisYear}>
          <Text style={styles.quickBtnText}>Năm nay</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPicker(null);
            if (date) {
              if (showPicker === 'start') setStartDate(date);
              else setEndDate(date);
            }
          }}
        />
      )}

      {/* Bảng doanh thu */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.cellHeader}>Khoảng thời gian</Text>
          <Text style={styles.cellHeader}>Tổng doanh thu</Text>
          <Text style={styles.cellHeader}>Hóa đơn</Text>
          <Text style={styles.cellHeader}>Mặt hàng</Text>
        </View>

        {revenueData ? (
          <View style={styles.tableRow}>
            <Text style={styles.cell}>{formattedStart} - {formattedEnd}</Text>
            <Text style={styles.cell}>{revenueData.totalRevenue}</Text>
            <Text style={styles.cell}>{revenueData.invoiceCount}</Text>
            <Text style={styles.cell}>{revenueData.itemCount}</Text>
          </View>
        ) : (
          <Text style={styles.noData}>Không có dữ liệu cho khoảng thời gian này</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dateSelector: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f2f2f2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  dateText: { marginLeft: 6, color: '#007AFF', fontSize: 14 },
  quickButtons: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
  quickBtn: {
    backgroundColor: '#007AFF', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14, marginHorizontal: 5,
  },
  quickBtnText: { color: '#fff', fontWeight: '600' },
  table: { marginTop: 20 },
  tableHeader: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 6,
  },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10,
  },
  cellHeader: { flex: 1, fontWeight: '600', color: '#555', fontSize: 13 },
  cell: { flex: 1, color: '#333', fontSize: 13 },
  noData: { marginTop: 20, textAlign: 'center', color: '#999' },
});
