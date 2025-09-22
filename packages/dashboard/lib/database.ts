import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || "techsurf-dashboard";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface CachedConnection {
  client: MongoClient;
  db: Db;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoConnection: CachedConnection | undefined;
}

export async function connectToDatabase(): Promise<CachedConnection> {
  if (global._mongoConnection) {
    return global._mongoConnection;
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(MONGODB_DB);

    const connection = { client, db };
    global._mongoConnection = connection;

    console.log("Connected to MongoDB");
    return connection;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}
