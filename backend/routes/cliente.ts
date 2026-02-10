import cliente from "../controllers/cliente";
import express from "express";

const router = express.Router();

router.post('/createCliente', cliente.createCliente);
router.get('/getClientes/:sucursal_id', cliente.getClientes);
router.get('/getClienteById/:id', cliente.getClienteById);
router.get('/getClientesBySucursal/:sucursal_id', cliente.getClientesBySucursal);
router.get('/getClientesByRuta/:id_ruta', cliente.getClientesByRuta);
router.put('/updateCliente', cliente.updateCliente);
router.get('/getClientesByUser/:id_usuario', cliente.getClientesByUser);
router.delete('/deleteCliente/:id', cliente.deleteCliente);


export default router;
