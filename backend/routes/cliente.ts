import cliente from "../controllers/cliente";
import express from "express";
import auth from "../middlewares/auth";

const router = express.Router();

router.post('/createCliente', auth, cliente.createCliente);
router.get('/getClientes/:sucursal_id', auth, cliente.getClientes);
router.get('/getClienteById/:id', auth, cliente.getClienteById);
router.get('/getClientesBySucursal/:sucursal_id', auth, cliente.getClientesBySucursal);
router.get('/getClientesByRuta/:id_ruta', auth, cliente.getClientesByRuta);
router.get('/getClientesByRutaPrestamo/:id_ruta', auth, cliente.getClientesByRutaPrestamo);
router.get('/getClientesConPrestamosActivos/:sucursal_id', auth, cliente.getClientesConPrestamosActivos);
router.put('/updateCliente', auth, cliente.updateCliente);
router.get('/getClientesByUser/:id_usuario', auth, cliente.getClientesByUser);
router.get('/getClientesRutaUser/:id_usuario', auth, cliente.getClientesRutaUser);
router.patch('/actualizarOrdenClientes/:id_ruta', auth, cliente.actualizarOrdenClientes);
router.delete('/deleteCliente/:id', auth, cliente.deleteCliente);


export default router;
