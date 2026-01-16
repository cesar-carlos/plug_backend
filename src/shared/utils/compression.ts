import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export const compress = async (data: object): Promise<Buffer> => {
  try {
    const json = JSON.stringify(data);
    return await gzipAsync(json);
  } catch (err) {
    throw new Error(
      err instanceof Error ? `Compression error: ${err.message}` : 'Failed to compress data'
    );
  }
};

export const decompress = async (data: Buffer | Uint8Array): Promise<unknown> => {
  try {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const decompressed = await gunzipAsync(buffer);
    const jsonString = decompressed.toString('utf-8');
    return JSON.parse(jsonString);
  } catch (err) {
    throw new Error(
      err instanceof Error ? `Decompression error: ${err.message}` : 'Failed to decompress data'
    );
  }
};
