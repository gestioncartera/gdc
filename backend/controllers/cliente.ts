import  cliente  from "../models/cliente";
import ruta from "../models/ruta";
import usuario from "../models/usuario";
import { Request, Response } from "express";


//crear un nuevo cliente
const createCliente =async (req: Request, res: Response) => {
    try {
      if (!req.body.nombres || !req.body.apellidos || !req.body.direccion ||  !req.body.sucursal_id) {
         return res.status(400).send({ error: 'Faltan datos obligatorios' });         
      }
      //validar que la ruta exista
        const rutaCliente = await ruta.getRutaById(req.body.id_ruta);
        if (!rutaCliente) {
            return res.status(400).send({ error: 'La ruta especificada no existe' });
        }

        const nuevoCliente = await cliente.createCliente(req.body);
        if (!nuevoCliente) {
            
             return res.status(400).send({ error: 'No se pudo crear el cliente' });
        }
       return res.status(201).send({ message: 'Cliente creado exitosamente' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error al crear el cliente' });
    }
};

//obtener todos los clientes
const getClientes = async (req: Request, res: Response) => {
    try {
        const sucursal_id = parseInt(req.params.sucursal_id);
      const clientes = await cliente.getClientes(sucursal_id);    
        return  clientes.length === 0
        ? res.status(404).send({ message: 'No se encontraron clientes' })
        : res.status(200).json(clientes);
     
    } catch (error) {
        return res.status(500).send({ error: 'Error al obtener los clientes' });
    }   
};

//buscar un cliente por ID
const getClienteById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const clienteEncontrado = await cliente.getClienteById(id);  
          return clienteEncontrado===null
          ? res.status(404).send({ message: 'Cliente no encontrado' }) 
          : res.status(200).json(clienteEncontrado);
    } catch (error) {
        return res.status(500).send({ error: 'Error al obtener el cliente' });
    }   
};

//Obtener clientes por sucursal
const getClientesBySucursal = async (req: Request, res: Response) => {
    try { 
        const sucursal_id = parseInt(req.params.sucursal_id);   
        const clientesEncontrado = await cliente.getClientesBySucursal(sucursal_id);
          return clientesEncontrado.length===0
          ? res.status(404).send({ message: 'Cliente no encontrado para la sucursal' }) 
          : res.status(200).json(clientesEncontrado);
    }
        catch (error) {
        return res.status(500).send({ error: 'Error al obtener el cliente' });
    }   
};

//listar clientes por ruta
const getClientesByRuta = async (req: Request, res: Response) => {
    try { 


        const existeRuta = await ruta.getRutaById(parseInt(req.params.id_ruta));
        if (!existeRuta) {
            return res.status(400).send({ error: 'La ruta especificada no existe' });
        }

        const id_ruta = parseInt(req.params.id_ruta);
        const clientesEncontrado = await cliente.getClientesByRuta(id_ruta);
          return clientesEncontrado.length===0
          ? res.status(404).send({ message: 'Cliente no encontrado para la ruta' }) 
          : res.status(200).json(clientesEncontrado);
    }
        catch (error) {
        return res.status(500).send({ error: 'Error al obtener el cliente' });
    }
};

//listar clientes por ruta con prestamo activos
const getClientesByRutaPrestamo = async (req: Request, res: Response) => {
    try { 


        const existeRuta = await ruta.getRutaById(parseInt(req.params.id_ruta));
        if (!existeRuta) {
            return res.status(400).send({ error: 'La ruta especificada no existe' });
        }

        const id_ruta = parseInt(req.params.id_ruta);
        const clientesEncontrado = await cliente.getClientesByRutaPrestamo(id_ruta);
          return clientesEncontrado.length===0
          ? res.status(404).send({ message: 'Cliente no encontrado para la ruta' }) 
          : res.status(200).json(clientesEncontrado);
    }
        catch (error) {
           // console.log(error)
        return res.status(500).send({ error: 'Error al obtener el cliente' });
    }
};

//listar clientes por ruta con idUsuario desde params
const getClientesByUser = async (req: Request, res: Response) => {
    try { 
       
        const id_usuario = parseInt(req.params.id_usuario);
        const existeUsuario = await usuario.getUsuarioById(id_usuario);
        if (!existeUsuario) {
            return res.status(400).send({ error: 'El cobrador especificado no existe' });
        }

        const clientesEncontrado = await cliente.getClientesByUser(id_usuario);
          return clientesEncontrado.length===0
            ? res.status(404).send({ message: 'Cobrador no tiene asignada ruta o la Ruta no tiene clientes' })
            : res.status(200).json(clientesEncontrado);
    }
        catch (error) {
        return res.status(500).send({ error: 'Error al obtener el cliente' });
    }
};

//getClientesRutaUser

const getClientesRutaUser = async (req: Request, res: Response) => {
    try { 
       
        const id_usuario = parseInt(req.params.id_usuario);
        const existeUsuario = await usuario.getUsuarioById(id_usuario);
        if (!existeUsuario) {
            return res.status(400).send({ error: 'El cobrador especificado no existe' });
        }

        const clientesEncontrado = await cliente.getClientesRutaUser(id_usuario);
          return clientesEncontrado.length===0
            ? res.status(404).send({ message: 'Cobrador no tiene asignada ruta o la Ruta no tiene clientes' })
            : res.status(200).json(clientesEncontrado);
    }
        catch (error) {
        return res.status(500).send({ error: 'Error al obtener el cliente' });
    }
};

//listar clientes con prestamos activos
const getClientesConPrestamosActivos = async (req: Request, res: Response) => {
    try {
        const sucursal_id = parseInt(req.params.sucursal_id);
        const clientesEncontrado = await cliente.getClientesConPrestamosActivos(sucursal_id);
        return clientesEncontrado.length===0
        ? res.status(404).send({ message: 'No hay clientes con prestamos activos' })
        : res.status(200).json(clientesEncontrado);
    }
        catch (error) {
        return res.status(500).send({ error: 'Error al obtener el cliente' });
    }
};

//actualizar un cliente
const updateCliente = async (req: Request, res: Response) => {
    try {
        //validar que la ruta exista
        const rutaCliente = await ruta.getRutaById(req.body.id_ruta);
        if (!rutaCliente) {
            return res.status(400).send({ error: 'La ruta especificada no existe' });
        }

    
        const clienteActualizado = await cliente.updateCliente( req.body);
        return clienteActualizado===null
        ? res.status(404).send({ message: 'Cliente no encontrado o no se pudo actualizar' }) 
        : res.status(200).send({message:'Cliente actualizado exitosamente'});
    } catch (error) {
        return res.status(500).send({ error: 'Error al actualizar el cliente' });
    }   
};

//eliminar un cliente
const deleteCliente = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const clienteEliminado = await cliente.deleteCliente(id);
        return clienteEliminado===null
        ? res.status(404).send({ message: 'Cliente no encontrado o no se pudo eliminar' }) 
        : res.status(200).json(clienteEliminado);
    } catch (error) {
        return res.status(500).send({ error: 'Error al eliminar el cliente' });
    }
};

//Actualizar el orden de los clientes en la ruta- resibiendo un array de objetos con cliente_id y nuevo orden, TAMBIEN  el id ruta para actualizar esta en la tabla clientes.
    
 const actualizarOrdenClientes = async (req: Request, res: Response) => {
  try {   
    
    const clientesOrdenados = req.body; // [{ cliente_id: 1, nuevo_orden: 1 }, { cliente_id: 2, nuevo_orden: 2 }, ...]
   
     if (!Array.isArray(clientesOrdenados) || clientesOrdenados.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de clientes con su nuevo orden' });
        }
    const id_ruta=parseInt(req.params.id_ruta);
    const resultado = await cliente.actualizarOrdenClientes(id_ruta, clientesOrdenados);
    if (!resultado || resultado.length === 0) {
      return res.status(400).json({ error:'Error al actualizar el orden de los clientes' });
    }
    return res.status(200).json({ message: 'Ruta actualizada exitosamente' });
    } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el orden de los clientes' });
    }
}; 


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
}