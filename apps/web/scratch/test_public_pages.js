async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/pages/public?apiKey=gbl_api_key_main_2024_v2&status=all');
    const data = await res.json();
    console.log('API Response Success:', data.success);
    console.log('Total pages returned:', data.pages?.length);
    data.pages?.forEach(p => {
      console.log(`Page: ${p.title} (${p.slug}) - Status: ${p.status}`);
    });
  } catch (err) {
    console.error('Error querying public API:', err);
  }
}

run();
