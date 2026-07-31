async function test() {
  try {
    const signupRes = await fetch('https://ailifeagent.vercel.app/api/auth?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `test_sync_${Date.now()}@example.com`, password: 'password123' })
    });
    const data = await signupRes.json();
    const token = data.token;
    if (!token) return console.log("Failed signup", data);

    const syncRes = await fetch('https://ailifeagent.vercel.app/api/sync', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Sync GET Status:", syncRes.status);
    if (!syncRes.ok) {
       console.log("Error body:", await syncRes.text());
    } else {
       console.log("Sync Success!");
    }
  } catch(e) { console.error("Test Error:", e); }
}
test();
