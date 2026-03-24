"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarMultiplesCobros = exports.deleteCobro = exports.updateMontoCobroConCaja = exports.updateCobro = exports.getCantCobrosHoy = exports.getTotalCobradoHoy = exports.getPrestamoCobrosHistory = exports.getCobrosByRutaId = exports.getCobroById = exports.getCobroInfoById = exports.getAllCobros = exports.createCobro = void 0;
const cobro_1 = __importDefault(require("../models/cobro"));
const prestamo_1 = __importDefault(require("../models/prestamo"));
const usuario_1 = __importDefault(require("../models/usuario"));
const ruta_1 = __importDefault(require("../models/ruta"));
const EgresoOperacion_1 = __importDefault(require("../models/EgresoOperacion"));
const sucursal_1 = __importDefault(require("../models/sucursal"));
const CajaDiaria_1 = __importDefault(require("../models/CajaDiaria"));
// Crear un nuevo cobro
const createCobro = async (req, res) => {
    try {
        //validar si el prestamo existe
        const prestamoExistente = await prestamo_1.default.getPrestamoById(req.body.prestamo_id);
        if (!prestamoExistente) {
            return res.status(404).send({ error: 'Préstamo no encontrado' });
        }
        if (prestamoExistente.estado_prestamo !== 'en curso') {
            return res.status(400).send({ error: 'No se pueden agregar cobros, prestamo no vigente' });
        }
        //validar que el cobrador exista
        const cobradorExistente = await usuario_1.default.getUsuarioById(req.body.usuario_id);
        if (!cobradorExistente) {
            return res.status(404).send({ error: 'Cobrador no encontrado' });
        }
        //validar que  el prestamo no tenga cobros pendientes anteriores
        const cobrosPendientes = await cobro_1.default.getCobrosPendientesByPrestamoId(req.body.prestamo_id);
        if (cobrosPendientes && cobrosPendientes.length > 0) {
            return res.status(400).send({ error: 'El préstamo tiene cobros pendientes anteriores' });
        }
        //Validar que el cobrador sea el asignado a la ruta del cliente del prestamo
        const cobradorPrestamo = await prestamo_1.default.getCobradorByPrestamoId(req.body.prestamo_id);
        //console.log('Cobrador asignado al préstamo:', cobradorPrestamo,req.body.usuario_id);
        if (cobradorPrestamo.usuario_id !== req.body.usuario_id) {
            return res.status(400).json({ error: 'El usuario no es el cobrador asignado para este préstamo' });
        }
        //validar que el monto del cobro no sea mayor al monto del prestamo
        if (req.body.monto_cobrado > prestamoExistente.saldo_pendiente) {
            return res.status(400).send({ error: 'El monto del cobro no puede ser mayor al saldo pendiente del préstamo' });
        }
        const newCobro = await cobro_1.default.createCobro(req.body);
        return (!newCobro)
            ? res.status(400).send({ error: 'No se pudo crear el cobro' })
            : res.status(201).json(newCobro);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al crear el cobro' });
    }
};
exports.createCobro = createCobro;
/* //Validar cobros, cambiar estado de cobro y afectar saldo del prestamo
export const validarCobro = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.cobro_id);
    
   
    const resultado = await cobro.validarMultiplesCobros([id]);

    if (resultado.errores.length > 0) {
       return res.status(400).json({ error: resultado.errores[0].motivo });
    }

    if (resultado.procesados.length === 0) {
       return res.status(404).json({ error: 'Cobro no encontrado o no procesable' });
    }
    
    // Retornamos el cobro actualizado para mantener compatibilidad con el frontend
    const cobroActualizado = await cobro.getCobroById(id);
    return res.status(200).json(cobroActualizado);

  } catch (error) {
    return res.status(500).json({ error: 'Error interno al validar el cobro' });
  }
}; */
// Obtener todos los cobros
const getAllCobros = async (req, res) => {
    try {
        const cobros = await cobro_1.default.getAllCobros();
        return (!cobros)
            ? res.status(404).send({ error: 'No existen cobros creados' })
            : res.status(200).json(cobros);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener los cobros' });
    }
};
exports.getAllCobros = getAllCobros;
//obtener la informacion del cobro por ID
const getCobroInfoById = async (req, res) => {
    try {
        const id = parseInt(req.params.cobro_id);
        const cobroInfo = await cobro_1.default.getCobroInfoById(id);
        if (!cobroInfo) {
            return res.status(404).json({ error: 'Cobro no encontrado' });
        }
        return res.status(200).json(cobroInfo);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener la información del cobro' });
    }
};
exports.getCobroInfoById = getCobroInfoById;
// Obtener un cobro por ID
const getCobroById = async (req, res) => {
    try {
        const id = parseInt(req.params.cobro_id);
        const cobroById = await cobro_1.default.getCobroById(id);
        if (!cobroById) {
            return res.status(404).json({ error: 'Cobro no encontrado' });
        }
        return res.status(200).json(cobroById);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al obtener el cobro' });
    }
};
exports.getCobroById = getCobroById;
//Obtener cobros por ruta ID
const getCobrosByRutaId = async (req, res) => {
    try {
        const ruta_id = parseInt(req.params.ruta_id);
        //validar si existe la ruta
        const existeRuta = await ruta_1.default.getRutaById(ruta_id);
        if (!existeRuta) {
            return res.status(404).send({ error: 'Ruta no encontrada' });
        }
        const cobrosByRutaId = await cobro_1.default.getCobrosByRutaId(ruta_id);
        if (!cobrosByRutaId) {
            return res.status(404).send({ error: 'No se encontraron cobros para la ruta especificada' });
        }
        const cajaDiaria = await CajaDiaria_1.default.getCajasDiariasByRuta(ruta_id);
        if (!cajaDiaria || !cajaDiaria[0].fecha_apertura) {
            return res.status(404).send({ error: 'No se encontraron cajas diarias para la ruta especificada' });
        }
        const usuario_id = cajaDiaria[0].usuario_id;
        const egresos = await EgresoOperacion_1.default.getSumEgresosOperacion(usuario_id, ruta_id, cajaDiaria[0].fecha_apertura);
        return res.status(200).json({ "cobros": cobrosByRutaId,
            "Base_Inicial": cajaDiaria[0].monto_base_inicial,
            "recaudado": cajaDiaria[0].monto_recaudo || 0,
            "egresos": egresos,
            "total": cajaDiaria[0].monto_final_esperado
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error al obtener los cobros por ruta' });
    }
};
exports.getCobrosByRutaId = getCobrosByRutaId;
//Obtener el historial de cobros de un préstamo
const getPrestamoCobrosHistory = async (req, res) => {
    try {
        const idPrestamo = parseInt(req.params.prestamo_id);
        const cobrosHistory = await cobro_1.default.getCobrosByPrestamoId(idPrestamo);
        if (cobrosHistory.length === 0) {
            return res.status(404).send({ error: 'No existen cobros para este préstamo' });
        }
        const planPagos = calcularPlanDePagos(cobrosHistory[0].fecha_desembolso, cobrosHistory[0].fecha_fin_prestamo, cobrosHistory);
        //console.log('Plan de pagos calculado:', planPagos);
        return res.status(200).json(planPagos);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener el historial de cobros del préstamo' });
    }
};
exports.getPrestamoCobrosHistory = getPrestamoCobrosHistory;
// Obtener el total cobrado hoy
const getTotalCobradoHoy = async (req, res) => {
    try {
        const sucursal_id = parseInt(req.params.sucursal_id);
        const totalCobradoHoy = await cobro_1.default.getTotalCobradoHoy(sucursal_id, new Date().toISOString().split('T')[0]);
        if (!totalCobradoHoy) {
            return res.status(404).send({ error: 'No se encontraron cobros para hoy' });
        }
        return res.status(200).json({ 'total_cobro_hoy': totalCobradoHoy });
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al obtener el total cobrado hoy' });
    }
};
exports.getTotalCobradoHoy = getTotalCobradoHoy;
// Obtener la cantidad de cobros realizados hoy
const getCantCobrosHoy = async (req, res) => {
    try {
        const sucursal_id = parseInt(req.params.sucursal_id);
        const cantCobrosHoy = await cobro_1.default.getCantCobrosHoy(sucursal_id, new Date().toISOString().split('T')[0]);
        if (!cantCobrosHoy) {
            return res.status(404).send({ error: 'No se encontraron cobros para hoy' });
        }
        const cantPrestamosEnCurso = await prestamo_1.default.getPrestamosEnCursoSucursal(sucursal_id);
        return res.status(200).json({
            'cant_cobros_hoy': cantCobrosHoy,
            'cant_cobros_pendientes': cantPrestamosEnCurso - cantCobrosHoy
        });
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al obtener la cantidad de cobros realizados hoy' });
    }
};
exports.getCantCobrosHoy = getCantCobrosHoy;
// Actualizar un cobro
const updateCobro = async (req, res) => {
    try {
        const id = parseInt(req.params.cobro_id);
        const updatedCobro = await cobro_1.default.updateCobro(id, req.body);
        if (!updatedCobro) {
            return res.status(404).json({ error: 'Cobro no encontrado' });
        }
        return res.status(200).json(updatedCobro);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al actualizar el cobro' });
    }
};
exports.updateCobro = updateCobro;
//actualizar el monto de un cobro
const updateMontoCobroConCaja = async (req, res) => {
    try {
        const id = parseInt(req.params.cobro_id);
        const monto_cobrado = req.body.monto_cobrado;
        if (!monto_cobrado) {
            return res.status(400).send({ error: 'El monto cobrado es requerido' });
        }
        const updatedCobro = await cobro_1.default.updateMontoCobroConCaja(id, monto_cobrado);
        if (!updatedCobro) {
            return res.status(404).send({ error: 'Cobro no encontrado' });
        }
        return res.status(200).json(updatedCobro);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al actualizar el monto del cobro' });
    }
};
exports.updateMontoCobroConCaja = updateMontoCobroConCaja;
// Eliminar un cobro
const deleteCobro = async (req, res) => {
    try {
        const id = parseInt(req.params.cobro_id);
        const deletedCobro = await cobro_1.default.deleteCobro(id);
        if (!deletedCobro) {
            return res.status(404).json({ error: 'Cobro no encontrado' });
        }
        return res.status(200).json(deletedCobro);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al eliminar el cobro' });
    }
};
exports.deleteCobro = deleteCobro;
// Validar múltiples cobros a la vez (Batch Processing)
const validarMultiplesCobros = async (req, res) => {
    try {
        //console.log('Request body recibido en validarMultiplesCobros:', req.body.cobroIds);
        const ids = req.body.cobroIds.map(Number);
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No esta enviando cobros para validar .' });
        }
        const resultado = await cobro_1.default.validarMultiplesCobros(ids);
        // Respuesta con resumen de lo que pasó
        return res.status(200).json({
            message: 'Proceso de validación finalizado',
            resumen: {
                total_recibidos: ids.length,
                total_procesados: resultado.procesados.length,
                total_errores: resultado.errores.length
            },
            detalles: resultado
        });
    }
    catch (error) {
        return res.status(500).send({ error: 'Error interno al procesar los cobros' });
    }
};
exports.validarMultiplesCobros = validarMultiplesCobros;
const resumenCobrosCoradorRuta = async (req, res) => {
    try {
        const sucursal_id = parseInt(req.params.sucursal_id);
        const existeSucursal = await sucursal_1.default.getSucursalById(sucursal_id);
        if (!existeSucursal || existeSucursal === null) {
            return res.status(404).send({ error: 'No se encontraron rutas para la sucursal especificada' });
        }
        const resultado = await cobro_1.default.resumenCobrosCoradorRuta(sucursal_id, new Date().toISOString().split('T')[0]);
        if (!resultado || resultado.length === 0) {
            return res.status(404).send({ error: 'No se encontraron cobros para la sucursal especificada' });
        }
        return res.status(200).json(resultado);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al obtener el resumen de cobros por corador y ruta' });
    }
};
// Función para sumar días hábiles a una fecha de prestamo
function calcularPlanDePagos(fechaInicio, fechaFin, cobrosHistory) {
    const mapaCobros = new Map();
    cobrosHistory.forEach(cobro => {
        // Asegurarse de tener solo la parte de la fecha YYYY-MM-DD
        const fechaKey = new Date(cobro.fecha_cobro).toISOString().split('T')[0];
        mapaCobros.set(fechaKey, cobro);
    });
    let calendario = [];
    const fecha = new Date(fechaInicio);
    while (fecha <= fechaFin) {
        //console.log(fecha);
        // 0 = Domingo. Si NO es domingo, contamos el día.
        if (fecha.getDay() !== 0) {
            const fechaStr = fecha.toISOString().split('T')[0];
            // Buscar si hubo pago ese día
            const cobroRealizado = mapaCobros.get(fechaStr);
            calendario.push({
                fecha: fechaStr,
                estado: cobroRealizado ? cobroRealizado.estado : 'No Pagado',
                monto: cobroRealizado ? cobroRealizado.monto_cobrado : 0
            });
        }
        fecha.setDate(fecha.getDate() + 1);
    }
    return calendario;
}
exports.default = {
    createCobro: exports.createCobro,
    getAllCobros: exports.getAllCobros,
    getCobroById: exports.getCobroById,
    getCobrosByRutaId: exports.getCobrosByRutaId,
    getCobroInfoById: exports.getCobroInfoById,
    getTotalCobradoHoy: exports.getTotalCobradoHoy,
    getCantCobrosHoy: exports.getCantCobrosHoy,
    updateCobro: exports.updateCobro,
    updateMontoCobroConCaja: exports.updateMontoCobroConCaja,
    deleteCobro: exports.deleteCobro,
    validarMultiplesCobros: exports.validarMultiplesCobros,
    getPrestamoCobrosHistory: exports.getPrestamoCobrosHistory,
    resumenCobrosCoradorRuta
};
