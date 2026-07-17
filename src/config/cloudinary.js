import { httpsCallable } from 'firebase/functions';
import { functions, isFirebaseMock } from './firebase';

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
};

export const isCloudinaryMock = isFirebaseMock || !CLOUDINARY_CONFIG.cloudName;

/**
 * Compresses an image file client-side to ensure small Base64 output sizes
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} quality
 * @returns {Promise<string>}
 */
export function compressImage(file, maxWidth = 500, maxHeight = 500, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Keep aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } else {
          resolve(event.target.result); // Fallback to raw if canvas context is null
        }
      };
      img.onerror = () => reject(new Error("Failed to load image object"));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file to Cloudinary (or returns a compressed base64 URI if mock)
 */
export async function uploadToCloudinary(file, folder = 'products') {
  if (isCloudinaryMock) {
    console.log("Cloudinary is in Mock mode. Compressing to Base64...");
    if (typeof file === 'string') return file;
    
    try {
      return await compressImage(file);
    } catch (err) {
      console.warn("Client-side compression failed, loading raw file:", err);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to convert image."));
        reader.readAsDataURL(file);
      });
    }
  }

  // Live Cloudinary Upload using server-side signatures
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const generateSig = httpsCallable(functions, 'generateCloudinarySignature');
    const { data } = await generateSig({ folder, timestamp });
    const { signature, apiKey, cloudName } = data;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const resData = await response.json();
    return resData.secure_url;
  } catch (error) {
    console.warn("Live Cloudinary upload failed. Falling back to local Base64 compression...", error);
    if (typeof file === 'string') return file;
    try {
      return await compressImage(file);
    } catch (err) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to convert image during fallback."));
        reader.readAsDataURL(file);
      });
    }
  }
}
