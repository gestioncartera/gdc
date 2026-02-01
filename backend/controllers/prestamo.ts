import prestamo from "../models/prestamo";
import cliente from "../models/cliente";
import cobro from "../models/cobro";
import Tipoprestamo from "../models/TipoPrestamo";
import { Request, Response } from "express";

// Crear un nuevo préstamo
export const createPrestamo = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Validar solo lo necesario (quitamos valor_intereses porque lo calculamos nosotros)
    if (!req.body.cliente_id || !req.body.periodo_id || !req.body.monto_prestamo || !req.body.tipo_prestamo_id) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para crear el préstamo' });
    }

    // 2. Validar que el cliente exista (Buenas prácticas)
    const existeCliente = await cliente.getClienteById(req.body.cliente_id);
    if (!existeCliente) {
      return res.status(404).json({ error: 'El cliente especificado no existe' });
    }

    // 3. Validar tipo de préstamo
    const tipoPrestamo = await Tipoprestamo.getTipoPrestamoById(req.body.tipo_prestamo_id);
    if (!tipoPrestamo || tipoPrestamo.length === 0) {
      return res.status(400).send({ error: 'El tipo de préstamo especificado no existe' });
    }

    const tPrestamo = tipoPrestamo[0]; // Alias para simplificar lectura

    // 4. Cálculos Financieros y Fechas (Usando Helper)
    const calculos = calcularDetallesPrestamo(req.body.monto_prestamo, tPrestamo);
    
    // Fusionar cálculos en el body
    req.body = { ...req.body, ...calculos };

    // 6. Insertar
    const newPrestamo = await prestamo.createPrestamo(req.body);
    return (!newPrestamo) 
    ? res.status(400).send({ error: 'No se pudo crear el préstamo' }) 
    : res.status(201).send({message:"Préstamo creado exitosamente"});

  } catch (error) {
    return res.status(500).send({ error: 'Error al crear el préstamo' });
  }
};

// Obtener todos los préstamos
export const getAllPrestamos = async (req: Request, res: Response): Promise<Response> => {
  try {
    const prestamos = await prestamo.getAllPrestamos();
    return (!prestamos ) 
    ? res.status(404).send({ error: 'No existen préstamos creados' }) 
    : res.status(200).json(prestamos);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener los préstamos' });
  }
};

// Obtener un préstamo por ID
export const getPrestamoById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id);
    const prestamoById = await prestamo.getPrestamoById(id);
    if (!prestamoById) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    return res.status(200).json(prestamoById);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener el préstamo' });
  }
};

//Obtener toda informacion de prestamo por id
export const getPrestamoInfoById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.prestamo_id);
    const prestamoInfo = await prestamo.getPrestamoInfoById(id);
    if (!prestamoInfo) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    return res.status(200).json(prestamoInfo);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener el préstamo' });
  }
};

//obtener prestamos por cliente
export const getPrestamosByClienteId = async (req: Request, res: Response): Promise<Response> => {
  try {
    const cliente_id = parseInt(req.params.cliente_id);
//validar cliente 
const existeCliente= await cliente.getClienteById(cliente_id);
if (!existeCliente){
  return  res.status(404).json({ error: 'Cliente no existe' });
}

    const prestamosByCliente = await prestamo.getPrestamosByClienteId(cliente_id);
    if (!prestamosByCliente || prestamosByCliente.length === 0) {
      return res.status(404).json({ error: 'No se encontraron préstamos para el cliente especificado' });
    }
    return res.status(200).json(prestamosByCliente);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener los préstamos del cliente' });
  }
};

//obtener informacion de prestamos y cobros
export const getPrestamoAndCobrosInfo = async (req: Request, res: Response): Promise<Response> => {
  try {
    

    const idPrestamo = parseInt(req.params.prestamo_id);
    const prestamoInfo = await prestamo.getPrestamoById(idPrestamo);
    if (!prestamoInfo) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    const prestamosCobrosInfo={
      id_prestamo: prestamoInfo.prestamo_id,
      nombre_cliente:prestamoInfo.cliente,
      saldo_pendiente:prestamoInfo.saldo_pendiente,
      valor_cuota:prestamoInfo.valor_cuota,
      fecha_fin_prestamo:prestamoInfo.fecha_fin_prestamo,
      data:[]
    };

    const cobros = await cobro.getCobrosByPrestamoId(idPrestamo);
    if (cobros && cobros.length > 0) {
      prestamosCobrosInfo.data = cobros;
    }

    return res.status(200).json(prestamosCobrosInfo);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener la información del préstamo y cobros' });
  }
};

//obtener prestamos con informacion de cliente
export const getPrestamosInfo = async (req: Request, res: Response): Promise<Response> => {
  try {
    const prestamosInfo = await prestamo.getPrestamosInfo();
    return (!prestamosInfo ) 
    ? res.status(404).send({ error: 'No existen préstamos creados' }) 
    : res.status(200).json(prestamosInfo);
  } catch (error) {
    //console.error(error);
    return res.status(500).json({ error: 'Error al obtener los préstamos' });
  }
};

// Actualizar un préstamo   
export const updatePrestamo = async (req: Request, res: Response): Promise<Response> => {
  try {
    //validar que el préstamo exista
     const idPrestamo = parseInt(req.params.id);
    const prestamoById = await prestamo.getPrestamoById(idPrestamo);
    if (!prestamoById) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    // Validar tipo de préstamo
    const tipoPrestamo = await Tipoprestamo.getTipoPrestamoById(req.body.tipo_prestamo_id);
    if (!tipoPrestamo || tipoPrestamo.length === 0) {
      return res.status(400).send({ error: 'El tipo de préstamo especificado no existe' });
    }

    const tPrestamo = tipoPrestamo[0]; // Alias para simplificar lectura

    const calculos = calcularDetallesPrestamo(req.body.monto_prestamo, tPrestamo);
    
    // Fusionar cálculos en el body
    req.body = { ...req.body, ...calculos };


    const updatedPrestamo = await prestamo.updatePrestamo(idPrestamo,req.body);
    if (!updatedPrestamo) {
      return res.status(404).json({ error: 'Préstamo no Actualizado' });
    }
    return res.status(200).json(updatedPrestamo);
    } catch (error) {
     // console.error(error);
    return res.status(500).json({ error: 'Error al actualizar el préstamo' });
    }
};

// Eliminar un préstamo
export const deletePrestamo = async (req: Request, res: Response): Promise<Response> => {
    try {   
        const id = parseInt(req.params.id);
        const deletedPrestamo = await prestamo.deletePrestamo(id);
        if (!deletedPrestamo) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        return res.status(200).json(deletedPrestamo);
    } catch (error) {       
        return res.status(500).json({ error: 'Error al eliminar el préstamo' });
    }
};


// Función para sumar días hábiles a una fecha de prestamo
function sumarDiasHabiles(fechaInicio: Date, diasParaSumar: number): Date {
  const fecha = new Date(fechaInicio);
  let diasSumados = 0;

  while (diasSumados < (diasParaSumar+1)) { // +1 para incluir el día de inicio
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
const calcularDetallesPrestamo = (monto: number, tPrestamo: any): any => {
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

export default {
  createPrestamo,
  getAllPrestamos,
  getPrestamoById,
  getPrestamosByClienteId,
  getPrestamosInfo,
  getPrestamoInfoById,
  updatePrestamo,
  deletePrestamo,
  getPrestamoAndCobrosInfo,
};