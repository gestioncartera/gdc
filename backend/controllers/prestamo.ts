import prestamo from "../models/prestamo";
import cliente from "../models/cliente";
import cobro from "../models/cobro";
import Tipoprestamo from "../models/TipoPrestamo";
import { Request, Response } from "express";

// Crear un nuevo préstamo
export const createPrestamo = async (req: Request, res: Response): Promise<Response> => {
  try {
    //validar los datos de entrada aquí si es necesario
    if (!req.body.cliente_id || !req.body.periodo_id || !req.body.monto_prestamo || !req.body.tipo_prestamo_id || !req.body.valor_intereses) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para crear el préstamo' });
    }

    //validar que el tipo de préstamo exista
    const tipoPrestamo = await Tipoprestamo.getTipoPrestamoById(req.body.tipo_prestamo_id);
    if (!tipoPrestamo || tipoPrestamo.length === 0) {
      return res.status(400).send({ error: 'El tipo de préstamo especificado no existe' });
    }

    req.body.valor_intereses = req.body.monto_prestamo * (tipoPrestamo[0].porcentaje / 100);
    req.body.saldo_pendiente = req.body.monto_prestamo + req.body.valor_intereses;
    req.body.valor_cuota = (req.body.monto_prestamo + req.body.valor_intereses) / tipoPrestamo[0].cantidad_cuotas;

    // Obtener fecha actual en Colombia para evitar desfase de zona horaria
    const fechaActualStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const fechaInicio = new Date(fechaActualStr); // Crea fecha a las 00:00 UTC del día correcto
    
    // Calcular fecha fin usando la función sumarDiasHabiles
    const fechaFin: Date = sumarDiasHabiles(fechaInicio, tipoPrestamo[0].cantidad_cuotas);
    req.body.fecha_fin_prestamo = fechaFin.toISOString().split('T')[0];

    const newPrestamo = await prestamo.createPrestamo(req.body);
    return (!newPrestamo) 
    ? res.status(400).send({ error: 'No se pudo crear el préstamo' }) 
    :  res.status(201).send({message:"Préstamo creado exitosamente"});
  } catch (error) {
   //console.error(error);
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
    const id = parseInt(req.params.id);
    const updatedPrestamo = await prestamo.updatePrestamo(id, req.body);
    if (!updatedPrestamo) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    return res.status(200).json(updatedPrestamo);
    } catch (error) {
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