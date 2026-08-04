/**
 * Avatar upload helper — uploads a picked image to the Supabase
 * 'avatars' storage bucket and returns the public-ish path.
 * In Expo Go (no native storage policies), we fall back to using
 * the local URI directly if the upload fails.
 */
import * as ImagePicker from 'expo-image-picker';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;

  const localUri = result.assets[0].uri;

  // If Supabase isn't configured (demo/offline mode), use local URI.
  if (!supabaseConfigured) return localUri;

  try {
    // Read file as blob for upload
    const response = await fetch(localUri);
    const blob = await response.blob();

    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.log('[Avatar] Upload error:', uploadError.message);
      // Fall back to local URI so the UI can still show something
      return localUri;
    }

    // Get the URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // The bucket is private, but getPublicUrl returns the URL path.
    // We'll store the path and use createSignedUrl when displaying.
    return fileName;
  } catch (e) {
    console.log('[Avatar] Upload failed:', e);
    return localUri;
  }
}

/**
 * Resolve an avatar_url into a displayable URI.
 * If it's a storage path (no scheme), generate a signed URL.
 * If it's already a full URL or local URI, return as-is.
 */
export async function resolveAvatarUrl(avatarUrl: string | null | undefined): Promise<string | null> {
  if (!avatarUrl) return null;

  // Already a full URL (https://, exp://, file://, etc.) or a preset ID
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('file://') || avatarUrl.startsWith('exp://')) {
    return avatarUrl;
  }

  // Storage path — generate a signed URL
  if (supabaseConfigured) {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(avatarUrl, 3600);

      if (error || !data?.signedUrl) {
        console.log('[Avatar] Signed URL error:', error?.message);
        return null;
      }

      return data.signedUrl;
    } catch (e) {
      console.log('[Avatar] Signed URL failed:', e);
      return null;
    }
  }

  return null;
}
