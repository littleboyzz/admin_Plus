import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { createProduct, getMenuCategories,uploadProductImage } from '../services/ProductService';

export default function AddItemScreen({ navigation }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [imageUri, setImageUri] = useState(null); // ảnh local để preview

  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load categories khi mở màn hình
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const list = await getMenuCategories();
        console.log('📂 Categories:', list);
        setCategories(list);
        if (list.length > 0) {
          setSelectedCategoryId(list[0].id); // chọn cái đầu tiên
        }
      } catch (err) {
        console.log('❌ loadCategories error:', err?.response?.data || err);
        Alert.alert('Lỗi', 'Không tải được danh mục. Vui lòng thử lại.');
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);
const handlePickImage = async () => {
  // xin quyền
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
    setImageUri(uri);
  }
};
const handleSave = async () => {
  if (!name.trim()) {
    Alert.alert('Lỗi', 'Vui lòng nhập tên mặt hàng');
    return;
  }
  if (!price.trim()) {
    Alert.alert('Lỗi', 'Vui lòng nhập giá bán');
    return;
  }
  if (!selectedCategoryId) {
    Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
    return;
  }

  try {
    setLoading(true);

    let imagePath = null;
    if (imageUri) {
      // 1) Upload ảnh, lấy đường dẫn trên server
      imagePath = await uploadProductImage(imageUri);
      console.log('📷 Uploaded path:', imagePath);
    }

    // 2) Tạo product với imagePath
    await createProduct({
      name: name.trim(),
      price: price.trim(),
      note: note.trim(),
      categoryId: selectedCategoryId,
      imagePath,
    });

    Alert.alert('Thành công', 'Đã thêm mặt hàng mới.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  } catch (err) {
    console.log('❌ createProduct error:', err?.response?.data || err);
    Alert.alert(
      'Lỗi',
      err?.response?.data?.message || 'Không thể thêm mặt hàng. Vui lòng thử lại.'
    );
  } finally {
    setLoading(false);
  }
};


  if (loadingCategories) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Đang tải danh mục...</Text>
      </View>
    );
  }

  return (
    
    <View style={styles.container}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
  <TouchableOpacity onPress={handlePickImage}>
    {imageUri ? (
      <Image
        source={{ uri: imageUri }}
        style={{ width: 120, height: 120, borderRadius: 10 }}
      />
    ) : (
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#ccc',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>Chọn ảnh</Text>
      </View>
    )}
  </TouchableOpacity>
  <Text style={{ marginTop: 6, color: '#666' }}>Nhấn để chọn ảnh</Text>
</View>

      {/* Chọn danh mục */}
      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedCategoryId}
          onValueChange={(value) => setSelectedCategoryId(value)}
        >
          {categories.map((cat) => (
            <Picker.Item
              key={cat.id || cat._id}
              label={cat.name}
              value={cat.id || cat._id}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Tên mặt hàng</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="VD: Bánh mì"
      />

      <Text style={styles.label}>Giá bán</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="VD: 20000"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Ghi chú</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={note}
        onChangeText={setNote}
        placeholder="VD: Hàng mới 330ml"
        multiline
      />

      <TouchableOpacity
        style={[styles.saveButton, loading && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveText}>
          {loading ? 'Đang lưu...' : '💾 Lưu'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 16, marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: { color: '#fff', fontSize: 16 },
});
