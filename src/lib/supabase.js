import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_KEY sont requis.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload un fichier dans Supabase Storage
 * @param {Buffer} buffer - contenu du fichier
 * @param {string} filename - nom du fichier (ex: avatar-123.jpg)
 * @param {string} mimetype - type MIME (ex: image/jpeg)
 * @param {string} folder - dossier dans le bucket (ex: avatars, events, gallery)
 * @returns {string} URL publique du fichier
 */
export async function uploadToStorage(buffer, filename, mimetype, folder = 'misc') {
  const path = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(path, buffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) throw new Error(`Upload Supabase échoué: ${error.message}`);

  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Supprimer un fichier depuis son URL publique
 * @param {string} publicUrl - URL publique retournée par uploadToStorage
 */
export async function deleteFromStorage(publicUrl) {
  try {
    // Extraire le path depuis l'URL publique
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/storage/v1/object/public/uploads/');
    if (pathParts.length < 2) return;
    const filePath = pathParts[1];

    await supabase.storage.from('uploads').remove([filePath]);
  } catch (err) {
    console.error('Erreur suppression Supabase Storage:', err.message);
  }
}