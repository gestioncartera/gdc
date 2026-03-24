"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cerrarCajaDiaria = exports.updateCajaDiaria = exports.updateBase = exports.getCajasDiariasByRuta = exports.getCajaDiariaAbiertaByUsuario = exports.getCajasDiariasByUsuario = exports.getCajaDiariaById = exports.getAllCajasDiarias = void 0;
const CajaDiaria_1 = __importDefault(require("../models/CajaDiaria"));
const AsignacionRuta_1 = __importDefault(require("../models/AsignacionRuta"));
const cobro_1 = __importDefault(require("../models/cobro"));
const EgresoOperacion_1 = __importDefault(require("../models/EgresoOperacion"));
const abrirCajaDiaria = async (req, res) => {
    try {
        //obtener la ruta asignada al usuario para asociarla a la caja diaria
        const usuario_id = req.body.usuario_id;
        const sucursal_id = parseInt(req.params.sucursal_id);
        const rutaAsignada = await AsignacionRuta_1.default.getRutaAsignadaUsuario(usuario_id);
        if (!rutaAsignada) {
            return res.status(400).send({ error: 'El usuario no tiene una ruta asignada' });
        }
        //validar si ya existe una caja diaria abierta para el usuario 
        const cajasAbiertas = await CajaDiaria_1.default.getCajaDiariaAbiertaByUsuario(usuario_id, rutaAsignada.ruta_id);
        if (cajasAbiertas) {
            return res.status(400).send({ error: 'El usuario ya tiene una caja diaria abierta' });
        }
        //validar si existe la cantidad de dinero en la caja principal
        const existenFondos = await CajaDiaria_1.default.validarFondosCajaPrincipal(sucursal_id, req.body.monto_base_inicial);
        if (!existenFondos) {
            return res.status(400).send({ error: 'No hay suficientes fondos en la caja principal' });
        }
        req.body.ruta_id = rutaAsignada.ruta_id;
        const newCajaDiaria = await CajaDiaria_1.default.abrirCajaDiaria(req.body, sucursal_id);
        return (!newCajaDiaria)
            ? res.status(400).send({ error: 'No se pudo crear la caja diaria' })
            : res.status(201).json(newCajaDiaria);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al crear la caja diaria' });
    }
};
// Obtener todas las cajas diarias
const getAllCajasDiarias = async (req, res) => {
    try {
        const cajasDiarias = await CajaDiaria_1.default.getAllCajasDiarias();
        return (!cajasDiarias)
            ? res.status(404).send({ error: 'No existen cajas diarias creadas' })
            : res.status(200).json(cajasDiarias);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener las cajas diarias' });
    }
};
exports.getAllCajasDiarias = getAllCajasDiarias;
// Obtener una caja diaria por ID
const getCajaDiariaById = async (req, res) => {
    try {
        const id = parseInt(req.params.caja_diaria_id);
        const cajaDiaria = await CajaDiaria_1.default.getCajaDiariaById(id);
        if (!cajaDiaria) {
            return res.status(404).json({ error: 'Caja diaria no encontrada' });
        }
        return res.status(200).json(cajaDiaria);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener la caja diaria' });
    }
};
exports.getCajaDiariaById = getCajaDiariaById;
// Obtener cajas diarias por usuario
const getCajasDiariasByUsuario = async (req, res) => {
    try {
        const usuario_id = parseInt(req.params.usuario_id);
        const cajasDiarias = await CajaDiaria_1.default.getCajasDiariasByUsuario(usuario_id);
        if (!cajasDiarias) {
            return res.status(404).send({ error: 'No se encontraron cajas diarias para el usuario especificado' });
        }
        return res.status(200).json(cajasDiarias);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al obtener las cajas diarias por usuario' });
    }
};
exports.getCajasDiariasByUsuario = getCajasDiariasByUsuario;
const getCajaDiariaAbiertaByUsuario = async (req, res) => {
    try {
        const usuario_id = parseInt(req.params.usuario_id);
        const rutaAsignada = await AsignacionRuta_1.default.getRutaAsignadaUsuario(usuario_id);
        if (!rutaAsignada) {
            return res.status(404).send({ error: 'No se encontro ruta asignada para el usuario especificado' });
        }
        const cajaDiariaAbierta = await CajaDiaria_1.default.getCajaDiariaAbiertaByUsuario(usuario_id, rutaAsignada.ruta_id);
        if (!cajaDiariaAbierta || !cajaDiariaAbierta.fecha_apertura) {
            return res.status(404).send({ error: 'No se encontró una caja diaria abierta para el usuario especificado' });
        }
        //obtener los egresos
        const egresos = await EgresoOperacion_1.default.getSumEgresosOperacionConfirmados(usuario_id, rutaAsignada.ruta_id, cajaDiariaAbierta.fecha_apertura);
        //obtener los cobros pendientes
        const cobrosPendientes = await cobro_1.default.getCobrosPendientesByUsuarioId(usuario_id);
        //Obtener los egresos pendientes
        const egresosPendientes = await EgresoOperacion_1.default.getEgresosPendientesByUsuarioId(usuario_id);
        return res.status(200).json({ ...cajaDiariaAbierta,
            ...{ 'valor_egresos_confirmados': egresos,
                'cobrosPendientes': cobrosPendientes.length,
                'egresosPendientes': egresosPendientes.length
            } });
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al obtener la caja diaria abierta por usuario' });
    }
};
exports.getCajaDiariaAbiertaByUsuario = getCajaDiariaAbiertaByUsuario;
// Obtener cajas diarias por ruta
const getCajasDiariasByRuta = async (req, res) => {
    try {
        const ruta_id = parseInt(req.params.ruta_id);
        const cajasDiarias = await CajaDiaria_1.default.getCajasDiariasByRuta(ruta_id);
        if (!cajasDiarias) {
            return res.status(404).json({ error: 'No se encontraron cajas diarias para la ruta especificada' });
        }
        return res.status(200).json(cajasDiarias);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener las cajas diarias por ruta' });
    }
};
exports.getCajasDiariasByRuta = getCajasDiariasByRuta;
//actualizar la base de la caja diaria
const updateBase = async (req, res) => {
    try {
        const caja_diaria_id = parseInt(req.params.caja_diaria_id);
        const nuevoMontoBase = req.body.nuevaBase;
        const updatedCajaDiaria = await CajaDiaria_1.default.updateBase(caja_diaria_id, nuevoMontoBase);
        if (!updatedCajaDiaria) {
            return res.status(404).send({ error: 'Caja diaria no encontrada' });
        }
        return res.status(200).json(updatedCajaDiaria);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al actualizar la caja diaria' });
    }
};
exports.updateBase = updateBase;
// Actualizar caja diaria
const updateCajaDiaria = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const caja = req.body;
        const updatedCajaDiaria = await CajaDiaria_1.default.updateCajaDiaria(id, caja);
        if (!updatedCajaDiaria) {
            return res.status(404).json({ error: 'Caja diaria no encontrada' });
        }
        return res.status(200).json(updatedCajaDiaria);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al actualizar la caja diaria' });
    }
};
exports.updateCajaDiaria = updateCajaDiaria;
//cerrar caja diaria
const cerrarCajaDiaria = async (req, res) => {
    try {
        const caja_diaria_id = parseInt(req.params.caja_diaria_id);
        const cajaDiaria = await CajaDiaria_1.default.getCajaDiariaById(caja_diaria_id);
        if (!cajaDiaria || !cajaDiaria.fecha_apertura) {
            return res.status(404).json({ error: 'Caja diaria no encontrada' });
        }
        if (cajaDiaria.estado === 'cerrada') {
            return res.status(400).json({ error: 'La caja diaria ya está cerrada' });
        }
        //validar que no existan cobros pendientes para el usuario asociado a la caja diaria
        const cobrosPendientes = await cobro_1.default.getCobrosPendientesByUsuarioId(cajaDiaria.usuario_id);
        if (cobrosPendientes.length > 0) {
            return res.status(400).json({ error: 'No se puede cerrar la caja diaria porque hay cobros pendientes' });
        }
        //validar que no existan Egresos pendientes para el usuario asociado a la caja diaria
        const egresosPendientes = await EgresoOperacion_1.default.getEgresosPendientesByUsuarioId(cajaDiaria.usuario_id);
        if (egresosPendientes.length > 0) {
            return res.status(400).json({ error: 'No se puede cerrar la caja diaria porque hay egresos de operación pendientes' });
        }
        const egresosCaja = await EgresoOperacion_1.default.getSumEgresosOperacionConfirmados(cajaDiaria.usuario_id, cajaDiaria.ruta_id, cajaDiaria.fecha_apertura);
        const CajaDiariaCerrada = await CajaDiaria_1.default.cerrarCajaDiaria(caja_diaria_id, req.body.monto_final_real, egresosCaja);
        if (!CajaDiariaCerrada) {
            return res.status(404).json({ error: 'Caja diaria no cerrada' });
        }
        return res.status(200).json(CajaDiariaCerrada);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al cerrar la caja diaria' });
    }
};
exports.cerrarCajaDiaria = cerrarCajaDiaria;
exports.default = {
    abrirCajaDiaria,
    getAllCajasDiarias: exports.getAllCajasDiarias,
    getCajaDiariaById: exports.getCajaDiariaById,
    getCajasDiariasByUsuario: exports.getCajasDiariasByUsuario,
    getCajasDiariasByRuta: exports.getCajasDiariasByRuta,
    getCajaDiariaAbiertaByUsuario: exports.getCajaDiariaAbiertaByUsuario,
    updateCajaDiaria: exports.updateCajaDiaria,
    updateBase: exports.updateBase,
    cerrarCajaDiaria: exports.cerrarCajaDiaria
};
