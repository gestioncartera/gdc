import db from "../db/db";

export interface Cliente {
  cliente_id?: number;
  sucursal_id: number;
  nombres: string;
  apellidos: string;
  numero_identificacion?: string;
  telefono?: string;
  direccion: string;
  fecha_registro?: Date;
  estado?: string;
  created_at?: Date;
  id_ruta: number;
  orden_ruta?: number;
}

// Crear un nuevo cliente
export async function createCliente(cliente: Cliente): Promise<Cliente|null> {
  const newCliente = await db.query(
    `INSERT INTO clientes (sucursal_id, nombres, apellidos, numero_identificacion, telefono, direccion, fecha_registro, estado, created_at, id_ruta)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING * `,
    [
      cliente.sucursal_id,
      cliente.nombres,
      cliente.apellidos,
      cliente.numero_identificacion || null,
      cliente.telefono || null,
      cliente.direccion,
      cliente.fecha_registro || new Date().toISOString(),
      cliente.estado || 'activo',
      cliente.created_at || new Date().toISOString(),
      cliente.id_ruta 
    ]
  );
  return newCliente.rows[0]||null;
}   

// Obtener todos los clientes por sucursal ID
export async function getClientes(idSucursal: number): Promise<Cliente[]> {
  const result = await db.query('SELECT * FROM clientes WHERE sucursal_id = $1 order by cliente_id asc', 
    [idSucursal]);
  return result.rows;
}

// Buscar un cliente por ID
export async function getClienteById(id: number): Promise<Cliente | null> {
  const result = await db.query('SELECT * FROM clientes WHERE cliente_id = $1',
    [
      id
    ]);
  return result.rows[0] || null;
}
// Buscar clientes por sucursal ID
export async function getClientesBySucursal(sucursal_id: number): Promise<Cliente[]> {
  const result = await db.query('SELECT * FROM clientes WHERE sucursal_id = $1',
    [
      sucursal_id
    ]);
  return result.rows;
}

//obtener clientes que tienen prestamos activos
export async function getClientesConPrestamosActivos(sucursal_id: number): Promise<Cliente[]> {
  const result = await db.query(`SELECT distinct clientes.cliente_id,
     clientes.Nombres ||' '||  clientes.Apellidos AS Nombres,
     clientes.numero_identificacion AS numero_identificacion,
    clientes.direccion AS direccion,
    clientes.telefono AS telefono,
    clientes.fecha_registro AS fecha_registro,
      clientes.estado AS estado,
      clientes.id_ruta AS id_ruta,
      clientes.sucursal_id AS sucursal_id,
      clientes.orden_ruta AS orden_ruta
    FROM clientes
    inner join prestamos on clientes.cliente_id = prestamos.cliente_id 
    and prestamos.estado_prestamo='en curso'
    WHERE clientes.sucursal_id = $1`,
    [sucursal_id]);
  return result.rows;
}

export async function getClientesByRuta(id_ruta: number): Promise<Cliente[]> {
  const result = await db.query('SELECT * FROM clientes WHERE id_ruta = $1 order by orden_ruta asc',
    [id_ruta]);
  return result.rows;
}

export async function getClientesByRutaPrestamo(id_ruta: number): Promise<Cliente[]> {
  const result = await db.query(`SELECT c.* 
    FROM clientes c
    inner join prestamos on c.cliente_id = prestamos.cliente_id and prestamos.estado_prestamo='en curso'
    WHERE c.id_ruta = $1 order by c.orden_ruta asc`,
    [id_ruta]);
  return result.rows;
}

//
//     case when prestamos.prestamo_id is null then 'Cliente no tiene prestamos activos' else lpad(cast(prestamos.prestamo_id as text), 8, '0' ) end AS idPrestamo, 
//listar clientes por ruta con idUsuario
export async function getClientesByUser(id_usuario: number): Promise<Cliente[]|any[]> {
  const result = await db.query(`SELECT distinct clientes.cliente_id,
     clientes.Nombres ||' '||  clientes.Apellidos AS nombreCliente,
    clientes.direccion AS direccionCliente,
    clientes.telefono AS telefonoCliente
    FROM asignaciones_rutas ar
    inner JOIN rutas ON ar.ruta_id = rutas.ruta_id
    inner JOIN clientes  ON rutas.ruta_id = clientes.id_ruta
    inner join prestamos on clientes.cliente_id = prestamos.cliente_id and prestamos.estado_prestamo='en curso'
    WHERE ar.usuario_id = $1 and ar.estado = 'activo' `,
    [id_usuario]);
 console.log(result.rows);
  return result.rows || null;
}

export async function getClientesRutaUser(id_usuario: number): Promise<Cliente[]|any[]> {
  const result = await db.query(`SELECT distinct clientes.cliente_id,
     clientes.Nombres ||' '||  clientes.Apellidos AS nombreCliente,
    clientes.direccion AS direccionCliente,
    clientes.telefono AS telefonoCliente
    FROM asignaciones_rutas ar
    inner JOIN rutas ON ar.ruta_id = rutas.ruta_id
    inner JOIN clientes  ON rutas.ruta_id = clientes.id_ruta
    WHERE ar.usuario_id = $1 and ar.estado = 'activo' `,
    [id_usuario]);
 console.log(result.rows);
  return result.rows || null;
}

// Actualizar un cliente
export async function updateCliente( cliente: Cliente): Promise<Cliente|null> {
  const updatedCliente = await db.query(
    `UPDATE clientes 
    SET nombres=$1, 
    apellidos=$2, 
    numero_identificacion=$3, 
    telefono=$4, 
    direccion=$5, 
    estado=$6, 
    id_ruta=$7,
    sucursal_id=$8
    WHERE cliente_id=$9 RETURNING *`,
    [
      cliente.nombres,  
      cliente.apellidos,
      cliente.numero_identificacion,
      cliente.telefono,
      cliente.direccion,
      cliente.estado,
      cliente.id_ruta,
      cliente.sucursal_id,
      cliente.cliente_id,

    ]
  );
  return updatedCliente.rows[0]||null;
}

// Eliminar un cliente
export async function deleteCliente(id: number): Promise<Cliente|null > {
  const clienteEliminado = await db.query('DELETE FROM clientes WHERE cliente_id = $1 RETURNING *',
     [id]
    );
  return clienteEliminado.rows[0] ||null;
}

//Actualizar el orden de los clientes en la ruta
export async function actualizarOrdenClientes(id_ruta:number,clientesOrdenados: { cliente_id: number; nuevo_orden: number }[]): Promise<any[]|null> {
  const clientIds = clientesOrdenados.map(c => c.cliente_id);
  const ordenCases = clientesOrdenados.map(c => `WHEN cliente_id = ${c.cliente_id} THEN ${c.nuevo_orden}`).join(' ');
  
  const result = await db.query(
    `UPDATE clientes SET orden_ruta = CASE ${ordenCases} END, id_ruta = $1
     WHERE cliente_id IN (${clientIds.join(',')}) returning *`,
     [id_ruta]
  );
  return result.rows || null;
}

export default{
  createCliente,
  getClientes,
  getClienteById,
  getClientesBySucursal,
  getClientesByRuta,
  getClientesByRutaPrestamo,
  getClientesByUser,
  getClientesRutaUser,
  getClientesConPrestamosActivos,
  updateCliente,
  deleteCliente,
  actualizarOrdenClientes
};




