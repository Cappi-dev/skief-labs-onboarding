const { searchByState } = require('./src/services/client');

async function testConnection() {
    console.log("📡 Testing Arkansas API Connection...");
    const data = await searchByState("AR");
    
    if (data && data.data) {
        console.log(`✅ Success! Found ${data.data.length} records for Arkansas.`);
        console.log("First Record Sample:", data.data[0]);
    } else {
        console.log("❌ Connection failed. Check if your cookie in client.js is correct.");
    }
}

testConnection();