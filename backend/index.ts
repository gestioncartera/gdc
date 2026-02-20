import  express  from 'express';
import  cors  from 'cors';
import  dotenv, { config }  from 'dotenv';
import  db  from './db/db';

import  sucursal  from './routes/sucursal'; 
import  ruta  from './routes/ruta';
import  cliente from './routes/cliente';
import usuario from './routes/usuario';
import  tipousuario from './routes/TipoUsuario';
import TipoPrestamo from './routes/TipoPrestamo';
import AsignacionRuta from './routes/AsignacionRuta';
import prestamo from './routes/prestamo';
import cobro from './routes/cobro';
import EgresoOperacion from './routes/EgresoOperacion';
import CajaSucursal from './routes/CajaSucursal';
import movtoCajaSucursal from './routes/movimiento_caja_sucursal';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/sucursal', sucursal);
app.use('/api/ruta', ruta);
app.use('/api/cliente', cliente);
app.use('/api/usuario', usuario);
app.use('/api/tipousuario', tipousuario);
app.use('/api/tipoprestamo', TipoPrestamo);
app.use('/api/asignacionruta', AsignacionRuta);
app.use('/api/prestamo', prestamo);
app.use('/api/cobro', cobro);
app.use('/api/egresooperacion', EgresoOperacion);
app.use('/api/cajasucursal', CajaSucursal);
app.use('/api/movimientocajasucursal', movtoCajaSucursal);

app.listen(process.env.PORT,()=>console.log(`Server running on port ${process.env.PORT}`));



 db.connect()
  .then(() => {
    console.log('Conexión exitosa a la base de datos');
  })
  .catch((err:any) => {
    console.error('Error al conectar a la base de datos:', err.message);
  });
 