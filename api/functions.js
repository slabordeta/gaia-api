import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const functions = await sql`SELECT * FROM functions ORDER BY position`;
    res.status(200).json(functions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
