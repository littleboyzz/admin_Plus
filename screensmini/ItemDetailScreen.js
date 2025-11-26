import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { API_URL } from '../constants/config';
import { updateProduct, deleteProduct, uploadProductImage, } from '../services/ProductService';
import * as ImagePicker from 'expo-image-picker';
const FILE_BASE_URL = API_URL.replace('/api/v1', ''); 
// VD: API_URL = 'http://192.168.0.10:3000/api/v1'
// => FILE_BASE_URL = 'http://192.168.0.10:3000'

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const productId = item.id || item._id;   // phòng trường hợp backend gửi _id

  console.log('🧾 [ItemDetail] item = ', item);

  const [name, setName] = useState(item.name ?? '');
  const [price, setPrice] = useState(
    typeof item.price === 'number' ? String(item.price) : item.price ?? ''
  );
  const [note, setNote] = useState(
    typeof item.note === 'string' ? item.note : ''
  );
  const [loading, setLoading] = useState(false);
  
  const categoryName = item.category?.name || 'Không có danh mục';


// URL ảnh đang hiển thị
  const initialImageUri =
    item.image
      ? item.image
      : Array.isArray(item.images) && item.images.length > 0
      ? `${FILE_BASE_URL}${item.images[0]}`
      : null;

  const [imageUri, setImageUri] = useState(initialImageUri); // để render
  const [newLocalImage, setNewLocalImage] = useState(null); // ảnh mới chọn (local)
  //Hàm chọn ảnh khi bấm vào avatar
    const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);        // hiển thị luôn ảnh mới
      setNewLocalImage(uri);   // đánh dấu: có ảnh mới cần upload
    }
  };

  // ====== SỬA (UPDATE) ====== 
   const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên mặt hàng');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá bán');
      return;
    }

    try {
      setLoading(true);

      let imagesPayload;
      // Nếu user đã chọn ảnh mới → upload trước
      if (newLocalImage) {
        const uploadedPath = await uploadProductImage(newLocalImage);
        console.log('📷 [ItemDetail] uploaded path:', uploadedPath);
        imagesPayload = [uploadedPath];
      }

      await updateProduct(productId, {
        name: name.trim(),
        price: price.trim(),
        note: note.trim(),
        images: imagesPayload, // chỉ gửi nếu có ảnh mới
      });

      Alert.alert('Thành công', 'Mặt hàng đã được cập nhật.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.log('❌ [ItemDetail] update error:', err?.response?.data || err);
      Alert.alert(
        'Lỗi',
        err?.response?.data?.message || 'Không thể cập nhật mặt hàng.'
      );
    } finally {
      setLoading(false);
    }
  };


  // ====== XOÁ (DELETE) ======
  const handleDelete = () => {
    Alert.alert(
      'Xóa mặt hàng',
      `Bạn có chắc muốn xóa "${name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteProduct(productId);
              Alert.alert('Đã xóa', 'Mặt hàng đã được xóa.', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (err) {
              console.log('❌ [ItemDetail] delete error:', err?.response?.data || err);
              Alert.alert(
                'Lỗi',
                err?.response?.data?.message || 'Không thể xóa mặt hàng.'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
       <TouchableOpacity onPress={handlePickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text>Chạm để chọn ảnh</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyText}>{categoryName}</Text>
      </View>
      <Text style={styles.label}>Tên mặt hàng</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Giá bán</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Ghi chú</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={note}
        onChangeText={setNote}
        multiline
      />

      <TouchableOpacity
        style={[styles.saveButton, loading && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveText}>
          {loading ? 'Đang xử lý...' : '💾 Lưu'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteButton, loading && { opacity: 0.7 }]}
        onPress={handleDelete}
        disabled={loading}
      >
        <Text style={styles.deleteText}>🗑️ Xóa mặt hàng</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  image: {
    width: 120,
    height: 120,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  imagePlaceholder: {
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontSize: 16, marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveText: { color: '#fff', fontSize: 16 },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontSize: 16 },
    readOnlyBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
  },

});
