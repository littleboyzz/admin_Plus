// EmployeeDetailScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function EmployeeDetailScreen({ route }) {
  const { employee } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chi tiết nhân viên</Text>

      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {employee.avatar ? (
          <Image source={{ uri: employee.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {employee.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
      </View>

      {/* Thông tin cơ bản */}
      <Text style={styles.label}>Họ tên:</Text>
      <Text style={styles.value}>{employee.name}</Text>

      <Text style={styles.label}>Tên đăng nhập:</Text>
      <Text style={styles.value}>{employee.username}</Text>

      <Text style={styles.label}>Vai trò:</Text>
      <Text style={styles.value}>{employee.role}</Text>

      <Text style={styles.label}>Trạng thái hoạt động:</Text>
      <Text style={[styles.value, { color: employee.active ? "green" : "red" }]}>
        {employee.active ? "Đang hoạt động" : "Tạm khóa"}
      </Text>

      <Text style={styles.label}>Chi nhánh:</Text>
      <Text style={styles.value}>{employee.branchId || "Không có"}</Text>

      <Text style={styles.label}>Ngày tạo:</Text>
      <Text style={styles.value}>
        {new Date(employee.createdAt).toLocaleString("vi-VN")}
      </Text>

      <Text style={styles.label}>Cập nhật gần nhất:</Text>
      <Text style={styles.value}>
        {new Date(employee.updatedAt).toLocaleString("vi-VN")}
      </Text>

      <Text style={styles.label}>Lần đăng nhập cuối:</Text>
      <Text style={styles.value}>
        {employee.lastLoginAt
          ? new Date(employee.lastLoginAt).toLocaleString("vi-VN")
          : "Chưa đăng nhập lần nào"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },

  label: { fontSize: 15, color: '#777', marginTop: 10 },
  value: { fontSize: 16, fontWeight: '500', marginTop: 2, color: '#333' },

  avatarWrapper: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 40, fontWeight: "bold", color: "#555" },
});
