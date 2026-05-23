const { MongoClient } = require('mongodb');

// Use your connection string
const uri = "mongodb+srv://mauminoreen_db_user:cordi-cart@cordi-cart.6lljsfv.mongodb.net/?retryWrites=true&w=majority";

async function test() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Connected successfully!");
    await client.close();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
}

test();