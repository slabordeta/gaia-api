# GAIA API

API para el sistema GAIA. Conecta con Neon PostgreSQL.

## Deploy en Vercel

1. Sube esta carpeta a un repositorio de GitHub
2. Importa el repositorio en Vercel
3. Añade la variable de entorno:
   - `DATABASE_URL`: tu connection string de Neon

## Endpoints

- `GET /api/functions` - Lista todas las funciones
- `GET /api/nodes?function_id=X` - Lista nodos de una función
- `POST /api/nodes` - Crea un nodo
- `PUT /api/nodes` - Actualiza un nodo
- `DELETE /api/nodes?id=X` - Elimina un nodo
- `GET /api/stats` - Estadísticas por función
