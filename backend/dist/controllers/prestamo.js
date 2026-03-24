"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePrestamo = exports.PrestamosPendientes = exports.rechazarPrestamo = exports.confirmarPrestamo = exports.updatePrestamo = exports.getTotalCarteraSucursal = exports.getPrestamosInfo = exports.getPrestamoAndCobrosInfo = exports.getPrestamosByClienteId = exports.getPrestamoInfoById = exports.getPrestamoById = exports.getAllPrestamos = exports.createPrestamo = void 0;
const prestamo_1 = __importDefault(require("../models/prestamo"));
const cliente_1 = __importDefault(require("../models/cliente"));
const cobro_1 = __importDefault(require("../models/cobro"));
const TipoPrestamo_1 = __importDefault(require("../models/TipoPrestamo"));
const usuario_1 = __importDefault(require("../models/usuario"));
// Crear un nuevo préstamo
const createPrestamo = async (req, res) => {
    try {
        // 1. Validar solo lo necesario (quitamos valor_intereses porque lo calculamos nosotros)
        if (!req.body.cliente_id || !req.body.sucursal_id || !req.body.monto_prestamo || !req.body.tipo_prestamo_id || !req.body.id_usuario_creacion) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para crear el préstamo' });
        }
        // 2. Validar que el cliente exista 
        const existeCliente = await cliente_1.default.getClienteById(req.body.cliente_id);
        if (!existeCliente) {
            return res.status(404).json({ error: 'El cliente especificado no existe' });
        }
        //validar si el usuario creador es admin o cobrador
        const admin = await usuario_1.default.esAdmin(req.body.id_usuario_creacion);
        if (admin === true) {
            req.body.estado_prestamo = 'en curso';
        }
        // 3. Validar tipo de préstamo
        const tipoPrestamo = await TipoPrestamo_1.default.getTipoPrestamoById(req.body.tipo_prestamo_id);
        if (!tipoPrestamo || tipoPrestamo.length === 0) {
            return res.status(400).send({ error: 'El tipo de préstamo especificado no existe' });
        }
        const tPrestamo = tipoPrestamo[0]; // Alias para simplificar lectura
        // 4. Cálculos Financieros y Fechas (Usando Helper)
        const calculos = calcularDetallesPrestamo(req.body.monto_prestamo, tPrestamo);
        // Fusionar cálculos en el body
        req.body = { ...req.body, ...calculos };
        let newPrestamo = null;
        // 6. Insertar
        if (admin === true) {
            newPrestamo = await prestamo_1.default.createPrestamoAdmin(req.body);
        }
        else {
            newPrestamo = await prestamo_1.default.createPrestamo(req.body);
        }
        //const newPrestamo = await prestamo.createPrestamo(req.body);
        if (!newPrestamo) {
            return res.status(400).send({ error: 'No se pudo crear el préstamo' });
        }
        return res.status(201).send({ message: "Préstamo creado exitosamente" });
    }
    catch (error) {
        //console.error(error);
        // Errores de negocio/validación del modelo (caja diaria cerrada, saldo insuficiente, etc.)
        const erroresNegocio = [
            'caja diaria abierta',
            'Saldo insuficiente',
            'No se pudo crear'
        ];
        const esErrorNegocio = erroresNegocio.some(msg => error.message?.includes(msg));
        if (esErrorNegocio) {
            return res.status(400).json({ error: error.message });
        }
        // Errores inesperados del servidor
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.createPrestamo = createPrestamo;
// Obtener todos los préstamos
const getAllPrestamos = async (req, res) => {
    try {
        const prestamos = await prestamo_1.default.getAllPrestamos();
        return (!prestamos)
            ? res.status(404).send({ error: 'No existen préstamos creados' })
            : res.status(200).json(prestamos);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener los préstamos' });
    }
};
exports.getAllPrestamos = getAllPrestamos;
// Obtener un préstamo por ID
const getPrestamoById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const prestamoById = await prestamo_1.default.getPrestamoById(id);
        if (!prestamoById) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        return res.status(200).json(prestamoById);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener el préstamo' });
    }
};
exports.getPrestamoById = getPrestamoById;
//Obtener toda informacion de prestamo por id
const getPrestamoInfoById = async (req, res) => {
    try {
        const id = parseInt(req.params.prestamo_id);
        const prestamoInfo = await prestamo_1.default.getPrestamoInfoById(id);
        if (!prestamoInfo) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        return res.status(200).json(prestamoInfo);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener el préstamo' });
    }
};
exports.getPrestamoInfoById = getPrestamoInfoById;
//obtener prestamos por cliente
const getPrestamosByClienteId = async (req, res) => {
    try {
        const cliente_id = parseInt(req.params.cliente_id);
        //validar cliente 
        const existeCliente = await cliente_1.default.getClienteById(cliente_id);
        if (!existeCliente) {
            return res.status(404).json({ error: 'Cliente no existe' });
        }
        const prestamosByCliente = await prestamo_1.default.getPrestamosByClienteId(cliente_id);
        if (!prestamosByCliente || prestamosByCliente.length === 0) {
            return res.status(404).json({ error: 'No se encontraron préstamos para el cliente especificado' });
        }
        return res.status(200).json(prestamosByCliente);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los préstamos del cliente' });
    }
};
exports.getPrestamosByClienteId = getPrestamosByClienteId;
//obtener informacion de prestamos y cobros
const getPrestamoAndCobrosInfo = async (req, res) => {
    try {
        const idPrestamo = parseInt(req.params.prestamo_id);
        const prestamoInfo = await prestamo_1.default.getPrestamoById(idPrestamo);
        if (!prestamoInfo) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        const prestamosCobrosInfo = {
            id_prestamo: prestamoInfo.prestamo_id,
            nombre_cliente: prestamoInfo.cliente,
            saldo_pendiente: prestamoInfo.saldo_pendiente,
            valor_cuota: prestamoInfo.valor_cuota,
            fecha_fin_prestamo: prestamoInfo.fecha_fin_prestamo,
            nombre_ruta: prestamoInfo.nombre_ruta,
            data: []
        };
        const cobros = await cobro_1.default.getCobrosByPrestamoId(idPrestamo);
        if (cobros && cobros.length > 0) {
            prestamosCobrosInfo.data = cobros;
        }
        return res.status(200).json(prestamosCobrosInfo);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener la información del préstamo y cobros' });
    }
};
exports.getPrestamoAndCobrosInfo = getPrestamoAndCobrosInfo;
//obtener prestamos con informacion de cliente
const getPrestamosInfo = async (req, res) => {
    try {
        const prestamosInfo = await prestamo_1.default.getPrestamosInfo();
        return (!prestamosInfo)
            ? res.status(404).send({ error: 'No existen préstamos creados' })
            : res.status(200).json(prestamosInfo);
    }
    catch (error) {
        //console.error(error);
        return res.status(500).json({ error: 'Error al obtener los préstamos' });
    }
};
exports.getPrestamosInfo = getPrestamosInfo;
//Obtener total carte de una sucursal
const getTotalCarteraSucursal = async (req, res) => {
    try {
        const sucursal_id = parseInt(req.params.sucursal_id);
        const totalCartera = await prestamo_1.default.getTotalCarteraSucursal(sucursal_id);
        return res.status(200).json({ total_cartera: totalCartera });
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener el total de la cartera de la sucursal' });
    }
};
exports.getTotalCarteraSucursal = getTotalCarteraSucursal;
// Actualizar un préstamo   
const updatePrestamo = async (req, res) => {
    try {
        //validar que el préstamo exista
        const idPrestamo = parseInt(req.params.id);
        const prestamoById = await prestamo_1.default.getPrestamoById(idPrestamo);
        if (!prestamoById) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        // Validar tipo de préstamo
        const tipoPrestamo = await TipoPrestamo_1.default.getTipoPrestamoById(req.body.tipo_prestamo_id);
        if (!tipoPrestamo || tipoPrestamo.length === 0) {
            return res.status(400).send({ error: 'El tipo de préstamo especificado no existe' });
        }
        const tPrestamo = tipoPrestamo[0]; // Alias para simplificar lectura
        const calculos = calcularDetallesPrestamo(req.body.monto_prestamo, tPrestamo);
        // Fusionar cálculos en el body
        req.body = { ...req.body, ...calculos };
        const updatedPrestamo = await prestamo_1.default.updatePrestamo(idPrestamo, req.body);
        if (!updatedPrestamo) {
            return res.status(404).json({ error: 'Préstamo no Actualizado' });
        }
        return res.status(200).json(updatedPrestamo);
    }
    catch (error) {
        // console.error(error);
        return res.status(500).json({ error: 'Error al actualizar el préstamo' });
    }
};
exports.updatePrestamo = updatePrestamo;
// Confirmar un préstamo 
const confirmarPrestamo = async (req, res) => {
    try {
        const idPrestamo = parseInt(req.params.prestamo_id);
        const prestamoById = await prestamo_1.default.getPrestamoById(idPrestamo);
        if (!prestamoById) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        const updatedPrestamo = await prestamo_1.default.confirmarPrestamo(idPrestamo);
        if (!updatedPrestamo) {
            return res.status(404).json({ error: 'Préstamo no Actualizado' });
        }
        return res.status(200).json(updatedPrestamo);
    }
    catch (error) {
        // console.error(error);
        return res.status(500).json({ error: 'Error al actualizar el préstamo' });
    }
};
exports.confirmarPrestamo = confirmarPrestamo;
// Rechazar un préstamo
const rechazarPrestamo = async (req, res) => {
    try {
        const idPrestamo = parseInt(req.params.prestamo_id);
        const prestamoById = await prestamo_1.default.getPrestamoById(idPrestamo);
        if (!prestamoById) {
            return res.status(404).send({ error: 'Préstamo no encontrado' });
        }
        const updatedPrestamo = await prestamo_1.default.rechazarPrestamo(idPrestamo);
        if (!updatedPrestamo) {
            return res.status(404).send({ error: 'Préstamo no Actualizado' });
        }
        return res.status(200).json(updatedPrestamo);
    }
    catch (error) {
        // console.error(error);
        return res.status(500).send({ error: 'Error al actualizar el préstamo' });
    }
};
exports.rechazarPrestamo = rechazarPrestamo;
// Obtener préstamos pendientes
const PrestamosPendientes = async (req, res) => {
    try {
        const sucursal_id = parseInt(req.params.sucursal_id);
        if (!sucursal_id) {
            return res.status(400).send({ error: 'Faltan parámetros requeridos' });
        }
        const prestamosPendientes = await prestamo_1.default.PrestamosPendientes(sucursal_id);
        if (!prestamosPendientes || prestamosPendientes.length === 0) {
            return res.status(404).send({ error: 'No hay préstamos pendientes para esta sucursal' });
        }
        return res.status(200).json(prestamosPendientes);
    }
    catch (error) {
        //console.error(error);
        return res.status(500).send({ error: 'Error al obtener los préstamos pendientes' });
    }
};
exports.PrestamosPendientes = PrestamosPendientes;
// Eliminar un préstamo
const deletePrestamo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deletedPrestamo = await prestamo_1.default.deletePrestamo(id);
        if (!deletedPrestamo) {
            return res.status(404).send({ error: 'Préstamo no encontrado' });
        }
        return res.status(200).json(deletedPrestamo);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al eliminar el préstamo' });
    }
};
exports.deletePrestamo = deletePrestamo;
// Función para sumar días hábiles a una fecha de prestamo
function sumarDiasHabiles(fechaInicio, diasParaSumar) {
    const fecha = new Date(fechaInicio);
    let diasSumados = 0;
    while (diasSumados < (diasParaSumar + 1)) { // +1 para incluir el día de inicio
        // Avanzar un día
        fecha.setDate(fecha.getDate() + 1);
        // 0 = Domingo. Si NO es domingo, contamos el día.
        if (fecha.getDay() !== 0) {
            diasSumados++;
        }
    }
    return fecha;
}
// realizar calculos de prestamo
const calcularDetallesPrestamo = (monto, tPrestamo) => {
    // 1. Cálculos Financieros
    const valorIntereses = monto * (tPrestamo.porcentaje / 100);
    // const valorIntereses = Math.round(interesesRaw); // Redondeo seguro
    const saldoTotal = monto + valorIntereses;
    const valorCuota = saldoTotal / tPrestamo.cantidad_cuotas;
    // 2. Cálculo de Fechas
    // Obtener fecha actual para evitar desfase de zona horaria
    const fechaActualStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const fechaInicio = new Date(fechaActualStr);
    const fechaFin = sumarDiasHabiles(fechaInicio, tPrestamo.cantidad_cuotas);
    const fechaFinStr = fechaFin.toISOString().split('T')[0];
    return {
        valor_intereses: valorIntereses,
        saldo_pendiente: saldoTotal,
        valor_cuota: valorCuota,
        fecha_desembolso: fechaActualStr,
        fecha_fin_prestamo: fechaFinStr
    };
};
exports.default = {
    createPrestamo: exports.createPrestamo,
    getAllPrestamos: exports.getAllPrestamos,
    getPrestamoById: exports.getPrestamoById,
    getPrestamosByClienteId: exports.getPrestamosByClienteId,
    getPrestamosInfo: exports.getPrestamosInfo,
    getPrestamoInfoById: exports.getPrestamoInfoById,
    getTotalCarteraSucursal: exports.getTotalCarteraSucursal,
    updatePrestamo: exports.updatePrestamo,
    deletePrestamo: exports.deletePrestamo,
    getPrestamoAndCobrosInfo: exports.getPrestamoAndCobrosInfo,
    confirmarPrestamo: exports.confirmarPrestamo,
    rechazarPrestamo: exports.rechazarPrestamo,
    PrestamosPendientes: exports.PrestamosPendientes
};
