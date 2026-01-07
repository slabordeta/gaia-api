import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // GET - obtener nodos
    if (req.method === 'GET') {
      const { function_id } = req.query;
      
      if (function_id) {
        const nodes = await sql`
          SELECT * FROM nodes 
          WHERE function_id = ${function_id} 
          ORDER BY position, created_at
        `;
        return res.status(200).json(nodes);
      } else {
        const nodes = await sql`SELECT * FROM nodes ORDER BY position, created_at`;
        return res.status(200).json(nodes);
      }
    }

    // POST - crear nodo
    if (req.method === 'POST') {
      const { id, function_id, parent_id, name, is_task } = req.body;
      const nodeId = id || `node_${Date.now()}`;
      
      await sql`
        INSERT INTO nodes (id, function_id, parent_id, name, is_task, completed)
        VALUES (${nodeId}, ${function_id}, ${parent_id || null}, ${name}, ${is_task || false}, false)
      `;
      
      return res.status(201).json({ id: nodeId, success: true });
    }

    // PUT - actualizar nodo
    if (req.method === 'PUT') {
      const { id, name, completed } = req.body;
      
      if (completed !== undefined) {
        await sql`UPDATE nodes SET completed = ${completed} WHERE id = ${id}`;
      }
      if (name !== undefined) {
        await sql`UPDATE nodes SET name = ${name} WHERE id = ${id}`;
      }
      
      return res.status(200).json({ success: true });
    }

    // DELETE - eliminar nodo
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      // Eliminar nodo y todos sus hijos recursivamente
      await sql`
        WITH RECURSIVE descendants AS (
          SELECT id FROM nodes WHERE id = ${id}
          UNION ALL
          SELECT n.id FROM nodes n
          INNER JOIN descendants d ON n.parent_id = d.id
        )
        DELETE FROM nodes WHERE id IN (SELECT id FROM descendants)
      `;
      
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
