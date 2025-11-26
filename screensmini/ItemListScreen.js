// screens/ItemListScreen.js
import React, { useEffect, useState,useCallback } from 'react';
import {
  View, Text, FlatList, Image,
  TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { getAllProducts } from '../services/ProductService';
import { API_URL } from '../constants/config';
import { useFocusEffect } from '@react-navigation/native';
const FILE_BASE_URL = API_URL.replace('/api/v1', ''); 
// VD: API_URL = 'http://192.168.1.5:3000/api/v1'
// => FILE_BASE_URL = 'http://192.168.1.5:3000'

export default function ItemListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const list = await getAllProducts();   // 🔥 gọi service
      setItems(list);
    } catch (e) {
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

useFocusEffect(
  useCallback(() => {
     loadData()
  }, [])
);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={{ color: '#fff' }}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item, index) =>
    item?.id
      ? String(item.id)
      : item?._id
      ? String(item._id)
      : String(index) // fallback cuối cùng
  }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Chi tiết mặt hàng', { item })}
          >
            <Image
              style={styles.image}
              source={{
                uri: item.images?.length
                  ? `${FILE_BASE_URL}${item.images[0]}`   // VD: /uploads/xx.jpg
                  : 'https://via.placeholder.com/60',
              }}
            />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{item.price} đ</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Thêm mặt hàng')}
      >
        <Text style={styles.addText}>+ Thêm mặt hàng</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  image: { width: 60, height: 60, borderRadius: 8 },
  info: { marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 14, color: '#007AFF' },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addText: { color: '#fff', fontSize: 16 },
  retryBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
});
