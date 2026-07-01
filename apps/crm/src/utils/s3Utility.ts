    import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const endpoint = 'https://s3-eu-central-2.ionoscloud.com';
    s3Client = new S3Client({
      endpoint,
      credentials: {
        accessKeyId: process.env.ACCESSKEY || '',
        secretAccessKey: process.env.SECRETKEY || '',
      },
      region: process.env.REGION || 'eu-central-2',
    });
  }
  return s3Client;
}

interface FileUpload {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

async function uploadToS3(keyPrefix: string, file: FileUpload): Promise<string> {
  console.log('Uploading to bucket:', process.env.BUCKET);

  try {
    const s3Object = {
      Bucket: process.env.BUCKET || '',
      Key: `${keyPrefix}/${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read', // Uncomment if needed
    };

    await getS3Client().send(new PutObjectCommand(s3Object));
    const imageUrl = await getObjectUrl(s3Object.Key);

    return imageUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Error uploading to S3');
  }
}

async function getObjectUrl(key: string): Promise<string> {
  const bucket = process.env.BUCKET || '';
  const bucketUrl = `https://${bucket}.s3-eu-central-2.ionoscloud.com/`;
  const formattedKey = key.replace(/ /g, '+');
  const imageUrl = `${bucketUrl}${formattedKey}`;
  return imageUrl;
}

export { uploadToS3, getObjectUrl };
