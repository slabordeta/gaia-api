import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Contar tareas por función
    const stats = await sql`
      SELECT 
        f.id,
        f.name,
        f.icon,
        f.color,
        f.mission,
        COUNT(n.id) FILTER (WHERE n.is_task = true) as total_tasks,
        COUNT(n.id) FILTER (WHERE n.is_task = true AND n.completed = true) as completed_tasks,
        COUNT(n.id) FILTER (WHERE n.is_task = true AND n.completed = false) as pending_tasks
      FROM functions f
      LEFT JOIN nodes n ON f.id = n.function_id
      GROUP BY f.id, f.name, f.icon, f.color, f.mission, f.position
      ORDER BY f.position
    `;
    
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
