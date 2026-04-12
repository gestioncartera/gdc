import { Pool } from 'pg';
import dotenv from 'dotenv';

// Configuración de la conexión a la base de datos PostgreSQL local
/*
const db = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'dbgdc',
  user: 'postgres',
  password: '12345'
});
*/

///*
// Configuración de la conexión a la base de datos PostgreSQL en Neon
const db = new Pool({
 // host: 'ep-wandering-dust-a41qklky-pooler.us-east-1.aws.neon.tech', //GDC
  host: 'ep-purple-leaf-aikqmml0-pooler.c-4.us-east-1.aws.neon.tech', //GDCWEB
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  //password: 'npg_P50xTshGipNq', //GDC
  password: 'npg_6MaBubGgs2UA', //GDCWEB
  ssl:true
});
//*/


 /*
//conexion vps
const db = new Pool({
 user: process.env.PGUSER || 'appuser',
 host: process.env.PGHOST || '127.0.0.1',
 database: process.env.PGDATABASE || 'appdb',
 password: process.env.PGPASSWORD, // ponla en variables de entorno (no en el código)
 port: Number(process.env.PGPORT || 5432),
});
// */


export default db;