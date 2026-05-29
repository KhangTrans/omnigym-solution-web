import JSEncrypt from 'jsencrypt';
import { authApi } from '../api/auth';

/**
 * Tiện ích hỗ trợ mã hóa RSA cho phía Frontend
 */
export const rsaService = {
  /**
   * Đảm bảo chuỗi PEM cực kỳ sạch sẽ cho JSEncrypt
   */
  formatPEM: (key: string): string => {
    if (!key) return '';
    
    // 1. Loại bỏ tất cả khoảng trắng dư thừa, bao gồm cả \r (Windows line endings)
    let cleanKey = key.trim().replace(/\r/g, '');
    
    // 2. Tách phần body base64 ra khỏi header/footer (để format lại cho chuẩn)
    const isPkcs1 = cleanKey.includes("RSA PUBLIC KEY");
    const header = isPkcs1 ? "-----BEGIN RSA PUBLIC KEY-----" : "-----BEGIN PUBLIC KEY-----";
    const footer = isPkcs1 ? "-----END RSA PUBLIC KEY-----" : "-----END PUBLIC KEY-----";
    
    let body = cleanKey
      .replace(header, "")
      .replace(footer, "")
      .replace(/\s/g, ""); // Xóa toàn bộ space/newline trong body
      
    // 3. Xây dựng lại PEM với đúng 64 ký tự mỗi dòng và \n duy nhất
    const lines = body.match(/.{1,64}/g) || [];
    return `${header}\n${lines.join("\n")}\n${footer}`;
  },

  /**
   * Mã hóa dữ liệu bằng RSA Public Key
   */
  encrypt: async (text: string): Promise<string> => {
    try {
      console.log('--- RSA Encryption Started ---');
      
      const response = await authApi.getPublicKey();
      const rawKey = response.data.publicKey;
      
      // Format lại một cách cực kỳ cẩn thận
      const formattedKey = rsaService.formatPEM(rawKey);
      
      const encryptor = new JSEncrypt();

      // Thử dùng setKey thay vì setPublicKey (một số bản jsencrypt ổn định hơn với nó)
      encryptor.setKey(formattedKey);
      
      // Kiểm tra bằng cách thử mã hóa một test string nhỏ
      const testEncrypt = encryptor.encrypt("test");
      
      if (!testEncrypt) {
        console.error("❌ Lỗi: JSEncrypt không thể sử dụng Key này.");
        console.log("Key sau khi format:\n", formattedKey);
        return text; 
      }

      console.log("✅ RSA Key Ready");
      const encrypted = encryptor.encrypt(text);
      
      if (!encrypted) return text;
      
      console.log("✅ RSA Encrypted Success");
      return encrypted;
    } catch (error) {
      console.error("❌ RSA Service Error:", error);
      return text;
    }
  }
};
