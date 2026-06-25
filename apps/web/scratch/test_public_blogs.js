async function run() {
  const url = 'http://localhost:3000/api/blogs/public?apiKey=gbl_api_key_main_2024_v2';
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

run();
