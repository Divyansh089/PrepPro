import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env file');
}

const uri: string = process.env.MONGODB_URI;
const isSrv = uri.startsWith('mongodb+srv://');
const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');

const options: any = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
};

if (!isLocal && !isSrv) {
  options.tls = true;
  options.tlsAllowInvalidCertificates = true;
  options.tlsAllowInvalidHostnames = true;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the client
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Helper function to get database
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('preppro');
}

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    await client.db().command({ ping: 1 });
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
}

