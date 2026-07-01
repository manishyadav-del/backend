import db from "../../../lib/db";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.name || !data.value) {
      return new Response(
        JSON.stringify({ error: 'Name and value are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const query = `
      INSERT INTO cookies (name, value, domain, expires)
      VALUES (?, ?, ?, ?)
    `;

    const expiresDate = data.expires
      ? new Date(data.expires).toISOString().slice(0, 19).replace('T', ' ')
      : null;

    const [result] = await db.execute(query, [
      data.name,
      data.value,
      data.domain || null,
    //   data.path || null,
      expiresDate,
    //   data.httpOnly ? 1 : 0,
    //   data.secure ? 1 : 0,
    ]);

    // Build cookie string for Set-Cookie header
    let cookieStr = `${data.name}=${data.value};`;
    if (data.domain) cookieStr += ` Domain=${data.domain};`;
    if (expiresDate) cookieStr += ` Expires=${new Date(expiresDate).toUTCString()};`;

    return new Response(
      JSON.stringify({ success: true, insertedId: result.constructor }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieStr,
        },
      }
    );
  } catch (error) {
    console.error('DB Error:', error);
    return new Response(
      JSON.stringify({ error: 'Database error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}