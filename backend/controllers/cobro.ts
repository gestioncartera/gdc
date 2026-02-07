import cobro from "../models/cobro";
import prestamo from "../models/prestamo";
import usuario from "../models/usuario";
import ruta from "../models/ruta";
import { Request, Response } from "express";


// Crear un nuevo cobro
export const createCobro = async (req: Request, res: Response): Promise<Response> => {
  try {
    //validar si el prestamo existe
    const prestamoExistente = await prestamo.getPrestamoById(req.body.prestamo_id);
    if (!prestamoExistente) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    //validar que el cobrador exista
    const cobradorExistente = await usuario.getUsuarioById(req.body.usuario_id);
    if (!cobradorExistente) {
      return res.status(404).json({ error: 'Cobrador no encontrado' });
    }

    //Validar que el cobrador sea el asignado a la ruta del cliente del prestamo
    const cobradorPrestamo= await prestamo.getCobradorByPrestamoId(req.body.prestamo_id);
    //console.log('Cobrador asignado al préstamo:', cobradorPrestamo,req.body.usuario_id);
if(cobradorPrestamo.usuario_id!==req.body.usuario_id){
  return res.status(400).json({ error: 'El usuario no es el cobrador asignado para este préstamo' });
}

    const newCobro = await cobro.createCobro(req.body);
    return (!newCobro) 
    ? res.status(400).send({ error: 'No se pudo crear el cobro' }) 
    : res.status(201).json(newCobro);
  } catch (error) {
  
    return res.status(500).json({ error: 'Error al crear el cobro' });
  }
};

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
export const getAllCobros = async (req: Request, res: Response): Promise<Response> => {
  try { 
    const cobros = await cobro.getAllCobros();
    return (!cobros ) 
    ? res.status(404).send({ error: 'No existen cobros creados' }) 
    : res.status(200).json(cobros);
  } catch (error) {
   
    return res.status(500).json({ error: 'Error al obtener los cobros' });
  }
};
//obtener la informacion del cobro por ID
export const getCobroInfoById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.cobro_id);
    const cobroInfo = await cobro.getCobroInfoById(id);
    if (!cobroInfo) {
      return res.status(404).json({ error: 'Cobro no encontrado' });
    }
    return res.status(200).json(cobroInfo);
  } catch (error) {
    
    return res.status(500).json({ error: 'Error al obtener la información del cobro' });
  }
};


// Obtener un cobro por ID
export const getCobroById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.cobro_id);
    const cobroById = await cobro.getCobroById(id);
    if (!cobroById) {
      return res.status(404).json({ error: 'Cobro no encontrado' });
    }
    return res.status(200).json(cobroById);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener el cobro' });
  } 
};

//Obtener cobros por ruta ID
export const getCobrosByRutaId = async (req: Request, res: Response): Promise<Response> => {
  try {
    const ruta_id = parseInt(req.params.ruta_id);
    //validar si existe la ruta
    const existeRuta = await ruta.getRutaById(ruta_id);
    if (!existeRuta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    
    const cobrosByRutaId = await cobro.getCobrosByRutaId(ruta_id);
    if (!cobrosByRutaId) {
      return res.status(404).json({ error: 'No se encontraron cobros para la ruta especificada' });
    }
    return res.status(200).json(cobrosByRutaId);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener los cobros por ruta' });
  }
};

//Obtener el historial de cobros de un préstamo
export const getPrestamoCobrosHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const idPrestamo = parseInt(req.params.prestamo_id);
    const cobrosHistory = await cobro.getCobrosByPrestamoId(idPrestamo);

    
    if (cobrosHistory.length===0) {
    return res.status(404).send({ error: 'No existen cobros para este préstamo' }) 
    }

   
   const planPagos=calcularPlanDePagos(cobrosHistory[0].fecha_desembolso, cobrosHistory[0].fecha_fin_prestamo,cobrosHistory);
    //console.log('Plan de pagos calculado:', planPagos);

   return  res.status(200).json(planPagos);
  } catch (error) {
   
    return res.status(500).json({ error: 'Error al obtener el historial de cobros del préstamo' });
  }
};

// Actualizar un cobro
export const updateCobro = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.cobro_id);
    const updatedCobro = await cobro.updateCobro(id, req.body);
    if (!updatedCobro) {
      return res.status(404).json({ error: 'Cobro no encontrado' });
    }
    return res.status(200).json(updatedCobro);
    } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el cobro' });
    }   
};

// Eliminar un cobro
export const deleteCobro = async (req: Request, res: Response): Promise<Response> => {
    try {   
        const id = parseInt(req.params.cobro_id); 
        const deletedCobro = await cobro.deleteCobro(id);
        if (!deletedCobro) {
          return res.status(404).json({ error: 'Cobro no encontrado' });
        }
        return res.status(200).json(deletedCobro);
    } catch (error) {       
        return res.status(500).json({ error: 'Error al eliminar el cobro' });
    }
};


// Validar múltiples cobros a la vez (Batch Processing)
export const validarMultiplesCobros = async (req: Request, res: Response): Promise<Response> => {
  try {
    //console.log('Request body recibido en validarMultiplesCobros:', req.body.cobroIds);

    const ids: number[] = req.body.cobroIds.map(Number);
    const  cobroIds : any[] = await cobro.getCobrosByIds(ids ) ;// Espera un JSON { "cobroIds": [1, 2, 3] }

    if (!Array.isArray(cobroIds) || cobroIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de "cobroIds" no vacío.' });
    }
//console.log(req.body);
    const resultado = await cobro.validarMultiplesCobros(cobroIds);

    // Respuesta con resumen de lo que pasó
    return res.status(200).json({
      message: 'Proceso de validación finalizado',
      resumen: {
        total_recibidos: cobroIds.length,
        total_procesados: resultado.procesados.length,
        total_errores: resultado.errores.length
      },
      detalles: resultado
    });

  } catch (error) {
    
    return res.status(500).json({ error: 'Error interno al procesar los cobros' });
  }
};

// Función para sumar días hábiles a una fecha de prestamo
function calcularPlanDePagos(fechaInicio: Date, fechaFin: Date,cobrosHistory:any[]):any[] {

 const mapaCobros = new Map();
  cobrosHistory.forEach(cobro => {
    // Asegurarse de tener solo la parte de la fecha YYYY-MM-DD
    const fechaKey = new Date(cobro.fecha_cobro).toISOString().split('T')[0]; 
    mapaCobros.set(fechaKey, cobro);
  });

let calendario :any []=[];

  const fecha = new Date(fechaInicio);
 
  

  while (fecha <=fechaFin) { 
 
//console.log(fecha);
    // 0 = Domingo. Si NO es domingo, contamos el día.
    if (fecha.getDay() !== 0) {
       const fechaStr = fecha.toISOString().split('T')[0];

        // Buscar si hubo pago ese día
       const cobroRealizado = mapaCobros.get(fechaStr);
     
     calendario.push({
         fecha: fechaStr,
         estado: cobroRealizado ? cobroRealizado.estado :'No Pagado',
         monto: cobroRealizado ? cobroRealizado.monto_cobrado : 0
       });
    }
    fecha.setDate(fecha.getDate() + 1);
  }

  return calendario;
}

export default {
  createCobro,
  getAllCobros,
  getCobroById,
  getCobrosByRutaId,
  getCobroInfoById,
  updateCobro,
  deleteCobro,
  validarMultiplesCobros,
  getPrestamoCobrosHistory
};