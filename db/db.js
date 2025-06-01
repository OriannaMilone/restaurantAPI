const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDB() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");
    return client.db(process.env.MONGODB_DB);
  } catch (e) {
    console.error("Error al conectar:", e);
  }
}

module.exports = { connectToDB, client };

