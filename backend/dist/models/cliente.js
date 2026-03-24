"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCliente = createCliente;
exports.getClientes = getClientes;
exports.getClienteById = getClienteById;
exports.getClientesBySucursal = getClientesBySucursal;
exports.getClientesConPrestamosActivos = getClientesConPrestamosActivos;
exports.getClientesByRuta = getClientesByRuta;
exports.getClientesByRutaPrestamo = getClientesByRutaPrestamo;
exports.getClientesByUser = getClientesByUser;
exports.getClientesRutaUser = getClientesRutaUser;
exports.updateCliente = updateCliente;
exports.deleteCliente = deleteCliente;
exports.actualizarOrdenClientes = actualizarOrdenClientes;
const db_1 = __importDefault(require("../db/db"));
// Crear un nuevo cliente
async function createCliente(cliente) {
    const newCliente = await db_1.default.query(`INSERT INTO clientes (sucursal_id, nombres, apellidos, numero_identificacion, telefono, direccion, fecha_registro, estado, created_at, id_ruta)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING * `, [
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
    ]);
    return newCliente.rows[0] || null;
}
// Obtener todos los clientes por sucursal ID
async function getClientes(idSucursal) {
    const result = await db_1.default.query(`SELECT clientes.* ,
      rutas.nombre_ruta AS nombre_ruta
    FROM clientes 
    inner join rutas on clientes.id_ruta = rutas.ruta_id
    WHERE clientes.sucursal_id = $1 order by cliente_id asc`, [idSucursal]);
    return result.rows;
}
// Buscar un cliente por ID
async function getClienteById(id) {
    const result = await db_1.default.query('SELECT * FROM clientes WHERE cliente_id = $1', [
        id
    ]);
    return result.rows[0] || null;
}
// Buscar clientes por sucursal ID
async function getClientesBySucursal(sucursal_id) {
    const result = await db_1.default.query('SELECT * FROM clientes WHERE sucursal_id = $1', [
        sucursal_id
    ]);
    return result.rows;
}
//obtener clientes que tienen prestamos activos
async function getClientesConPrestamosActivos(sucursal_id) {
    const result = await db_1.default.query(`SELECT distinct clientes.cliente_id,
     clientes.Nombres ||' '||  clientes.Apellidos AS Nombres,
     clientes.numero_identificacion AS numero_identificacion,
    clientes.direccion AS direccion,
    clientes.telefono AS telefono,
    clientes.fecha_registro AS fecha_registro,
      clientes.estado AS estado,
      clientes.id_ruta AS id_ruta,
      clientes.sucursal_id AS sucursal_id,
      clientes.orden_ruta AS orden_ruta,
      rutas.nombre_ruta AS nombre_ruta
    FROM clientes
    inner join prestamos on clientes.cliente_id = prestamos.cliente_id 
    and prestamos.estado_prestamo='en curso'
    inner join rutas on clientes.id_ruta = rutas.ruta_id
    WHERE clientes.sucursal_id = $1`, [sucursal_id]);
    return result.rows;
}
async function getClientesByRuta(id_ruta) {
    const result = await db_1.default.query('SELECT * FROM clientes WHERE id_ruta = $1 order by orden_ruta asc', [id_ruta]);
    return result.rows;
}
async function getClientesByRutaPrestamo(id_ruta) {
    const result = await db_1.default.query(`SELECT c.* 
    FROM clientes c
    inner join prestamos on c.cliente_id = prestamos.cliente_id and prestamos.estado_prestamo='en curso'
    WHERE c.id_ruta = $1 
    group by c.cliente_id, c.nombres, c.apellidos, c.numero_identificacion, c.telefono, c.direccion, c.fecha_registro, c.estado, c.id_ruta, c.sucursal_id, c.orden_ruta
    order by c.orden_ruta asc`, [id_ruta]);
    return result.rows;
}
//
//     case when prestamos.prestamo_id is null then 'Cliente no tiene prestamos activos' else lpad(cast(prestamos.prestamo_id as text), 8, '0' ) end AS idPrestamo, 
//listar clientes por ruta con idUsuario
async function getClientesByUser(id_usuario) {
    const result = await db_1.default.query(`SELECT distinct clientes.cliente_id,
     clientes.Nombres ||' '||  clientes.Apellidos AS nombreCliente,
    clientes.direccion AS direccionCliente,
    clientes.telefono AS telefonoCliente
    FROM asignaciones_rutas ar
    inner JOIN rutas ON ar.ruta_id = rutas.ruta_id
    inner JOIN clientes  ON rutas.ruta_id = clientes.id_ruta
    inner join prestamos on clientes.cliente_id = prestamos.cliente_id and prestamos.estado_prestamo='en curso'
    WHERE ar.usuario_id = $1 and ar.estado = 'activo' `, [id_usuario]);
    return result.rows || null;
}
async function getClientesRutaUser(id_usuario) {
    const result = await db_1.default.query(`SELECT distinct clientes.cliente_id,
     clientes.Nombres ||' '||  clientes.Apellidos AS nombres,
    clientes.direccion AS direccionCliente,
    clientes.telefono AS telefonoCliente
    FROM asignaciones_rutas ar
    inner JOIN rutas ON ar.ruta_id = rutas.ruta_id
    inner JOIN clientes  ON rutas.ruta_id = clientes.id_ruta
    WHERE ar.usuario_id = $1 and ar.estado = 'activo' `, [id_usuario]);
    console.log(result.rows);
    return result.rows || null;
}
// Actualizar un cliente
async function updateCliente(cliente) {
    const updatedCliente = await db_1.default.query(`UPDATE clientes 
    SET nombres=$1, 
    apellidos=$2, 
    numero_identificacion=$3, 
    telefono=$4, 
    direccion=$5, 
    estado=$6, 
    id_ruta=$7,
    sucursal_id=$8
    WHERE cliente_id=$9 RETURNING *`, [
        cliente.nombres,
        cliente.apellidos,
        cliente.numero_identificacion,
        cliente.telefono,
        cliente.direccion,
        cliente.estado,
        cliente.id_ruta,
        cliente.sucursal_id,
        cliente.cliente_id,
    ]);
    return updatedCliente.rows[0] || null;
}
// Eliminar un cliente
async function deleteCliente(id) {
    const clienteEliminado = await db_1.default.query('DELETE FROM clientes WHERE cliente_id = $1 RETURNING *', [id]);
    return clienteEliminado.rows[0] || null;
}
//Actualizar el orden de los clientes en la ruta
async function actualizarOrdenClientes(id_ruta, clientesOrdenados) {
    const clientIds = clientesOrdenados.map(c => c.cliente_id);
    const ordenCases = clientesOrdenados.map(c => `WHEN cliente_id = ${c.cliente_id} THEN ${c.nuevo_orden}`).join(' ');
    const result = await db_1.default.query(`UPDATE clientes SET orden_ruta = CASE ${ordenCases} END, id_ruta = $1
     WHERE cliente_id IN (${clientIds.join(',')}) returning *`, [id_ruta]);
    return result.rows || null;
}
exports.default = {
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
