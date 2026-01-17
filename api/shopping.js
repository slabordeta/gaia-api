import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Crear tabla si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS shopping_items (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        function_id TEXT NOT NULL,
        description TEXT NOT NULL,
        units INTEGER DEFAULT 1,
        unit_price DECIMAL(10,2),
        store TEXT,
        link TEXT,
        purchased BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // GET - obtener artículos
    if (req.method === 'GET') {
      const { node_id, function_id, include_children } = req.query;
      
      if (include_children === 'true' && node_id) {
        // Obtener artículos de la carpeta actual y todas las subcarpetas
        const items = await sql`
          WITH RECURSIVE descendants AS (
            SELECT id FROM nodes WHERE id = ${node_id}
            UNION ALL
            SELECT n.id FROM nodes n
            INNER JOIN descendants d ON n.parent_id = d.id
          )
          SELECT s.* FROM shopping_items s
          WHERE s.node_id IN (SELECT id FROM descendants)
          ORDER BY s.purchased, s.created_at DESC
        `;
        return res.status(200).json(items);
      } else if (function_id && !node_id) {
        // Obtener todos los artículos de una función (raíz)
        const items = await sql`
          SELECT * FROM shopping_items 
          WHERE function_id = ${function_id}
          ORDER BY purchased, created_at DESC
        `;
        return res.status(200).json(items);
      } else if (node_id) {
        // Solo artículos de esta carpeta específica
        const items = await sql`
          SELECT * FROM shopping_items 
          WHERE node_id = ${node_id}
          ORDER BY purchased, created_at DESC
        `;
        return res.status(200).json(items);
      } else {
        // Todos los artículos
        const items = await sql`SELECT * FROM shopping_items ORDER BY purchased, created_at DESC`;
        return res.status(200).json(items);
      }
    }

    // POST - crear artículo
    if (req.method === 'POST') {
      const { node_id, function_id, description, units, unit_price, store, link } = req.body;
      const itemId = `shop_${Date.now()}`;
      
      await sql`
        INSERT INTO shopping_items (id, node_id, function_id, description, units, unit_price, store, link)
        VALUES (${itemId}, ${node_id}, ${function_id}, ${description}, ${units || 1}, ${unit_price || null}, ${store || null}, ${link || null})
      `;
      
      return res.status(201).json({ id: itemId, success: true });
    }

    // PUT - actualizar artículo
    if (req.method === 'PUT') {
      const { id, description, units, unit_price, store, link, purchased } = req.body;
      
      if (purchased !== undefined) {
        await sql`UPDATE shopping_items SET purchased = ${purchased} WHERE id = ${id}`;
      }
      if (description !== undefined) {
        await sql`UPDATE shopping_items SET description = ${description} WHERE id = ${id}`;
      }
      if (units !== undefined) {
        await sql`UPDATE shopping_items SET units = ${units} WHERE id = ${id}`;
      }
      if (unit_price !== undefined) {
        await sql`UPDATE shopping_items SET unit_price = ${unit_price} WHERE id = ${id}`;
      }
      if (store !== undefined) {
        await sql`UPDATE shopping_items SET store = ${store} WHERE id = ${id}`;
      }
      if (link !== undefined) {
        await sql`UPDATE shopping_items SET link = ${link} WHERE id = ${id}`;
      }
      
      return res.status(200).json({ success: true });
    }

    // DELETE - eliminar artículo
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM shopping_items WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
