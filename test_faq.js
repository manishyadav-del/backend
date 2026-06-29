async function test() {
  const url = 'http://localhost:3000/api/faqs/public?apiKey=gbl_api_key_main_2024_v2';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What treatments do you offer for cardiac issues?' })
    });
    console.log('Post Status:', res.status);
    const data = await res.json();
    console.log('Post Response:', data);

    // Verify it is created but not in public GET list (since it is unanswered/invisible)
    const getRes = await fetch(url);
    const getData = await getRes.json();
    console.log('GET Active FAQs length:', getData.faqs?.length);
    console.log('Does GET contain pending question?', JSON.stringify(getData).includes('cardiac issues'));
  } catch (e) {
    console.error(e);
  }
}
test();
