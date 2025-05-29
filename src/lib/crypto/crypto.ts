/**
 * Модуль для утилит E2E-шифрования с использованием Web Crypto API.
 * Содержит функции для генерации ключей, шифрования и дешифрования сообщений.
 */

const AES_KEY_ALGORITHM = 'AES-GCM';
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // Для AES-GCM рекомендуется 12 байт (96 бит)

/**
 * Генерирует новый симметричный ключ AES-GCM.
 * @returns {Promise<CryptoKey>} Сгенерированный ключ.
 */
export async function generateAesKey(): Promise<CryptoKey> {
  try {
    return await crypto.subtle.generateKey(
      {
        name: AES_KEY_ALGORITHM,
        length: AES_KEY_LENGTH,
      },
      true, // Ключ можно экспортировать (например, для обмена)
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Ошибка генерации AES ключа:', error);
    throw new Error('Не удалось сгенерировать AES ключ');
  }
}

/**
 * Шифрует данные с использованием AES-GCM.
 * @param {CryptoKey} key - Ключ шифрования.
 * @param {ArrayBuffer} data - Данные для шифрования (например, текст, преобразованный в ArrayBuffer).
 * @returns {Promise<{ciphertext: ArrayBuffer, iv: Uint8Array}>} Объект с зашифрованными данными и вектором инициализации.
 */
export async function encryptData(key: CryptoKey, data: ArrayBuffer): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: AES_KEY_ALGORITHM,
        iv: iv,
      },
      key,
      data
    );
    return { ciphertext, iv };
  } catch (error) {
    console.error('Ошибка шифрования данных:', error);
    throw new Error('Не удалось зашифровать данные');
  }
}

/**
 * Дешифрует данные с использованием AES-GCM.
 * @param {CryptoKey} key - Ключ дешифрования.
 * @param {ArrayBuffer} ciphertext - Зашифрованные данные.
 * @param {Uint8Array} iv - Вектор инициализации, использованный при шифровании.
 * @returns {Promise<ArrayBuffer>} Расшифрованные данные.
 */
export async function decryptData(key: CryptoKey, ciphertext: ArrayBuffer, iv: Uint8Array): Promise<ArrayBuffer> {
  try {
    return await crypto.subtle.decrypt(
      {
        name: AES_KEY_ALGORITHM,
        iv: iv,
      },
      key,
      ciphertext
    );
  } catch (error) {
    console.error('Ошибка дешифрования данных:', error);
    // Часто ошибка здесь означает неверный ключ или поврежденные данные
    throw new Error('Не удалось дешифровать данные. Возможно, неверный ключ или данные повреждены.');
  }
}

/**
 * Преобразует строку в ArrayBuffer (UTF-8).
 * @param {string} str - Входная строка.
 * @returns {ArrayBuffer} Строка в виде ArrayBuffer.
 */
export function stringToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

/**
 * Преобразует ArrayBuffer в строку (UTF-8).
 * @param {ArrayBuffer} buffer - Входной ArrayBuffer.
 * @returns {string} Строка.
 */
export function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

/**
 * Экспортирует CryptoKey в формат JWK (JSON Web Key) для хранения или передачи.
 * @param {CryptoKey} key - Ключ для экспорта.
 * @returns {Promise<JsonWebKey>} Ключ в формате JWK.
 */
export async function exportKeyToJwk(key: CryptoKey): Promise<JsonWebKey> {
  try {
    return await crypto.subtle.exportKey('jwk', key);
  } catch (error) {
    console.error('Ошибка экспорта ключа в JWK:', error);
    throw new Error('Не удалось экспортировать ключ');
  }
}

/**
 * Импортирует CryptoKey из формата JWK.
 * @param {JsonWebKey} jwk - Ключ в формате JWK.
 * @param {boolean} extractable - Должен ли импортированный ключ быть извлекаемым.
 * @param {KeyUsage[]} keyUsages - Разрешенные операции для ключа (например, ['encrypt', 'decrypt']).
 * @returns {Promise<CryptoKey>} Импортированный ключ.
 */
export async function importKeyFromJwk(jwk: JsonWebKey, extractable: boolean = true, keyUsages: KeyUsage[] = ['encrypt', 'decrypt']): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: AES_KEY_ALGORITHM,
      },
      extractable,
      keyUsages
    );
  } catch (error) {
    console.error('Ошибка импорта ключа из JWK:', error);
    throw new Error('Не удалось импортировать ключ');
  }
}

// TODO: Добавить функции для работы с асимметричным шифрованием (RSA или EC), если это требуется для обмена ключами.
// Например, generateKeyPair, wrapKey, unwrapKey. 