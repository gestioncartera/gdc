"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./db/db"));
const sucursal_1 = __importDefault(require("./routes/sucursal"));
const ruta_1 = __importDefault(require("./routes/ruta"));
const cliente_1 = __importDefault(require("./routes/cliente"));
const usuario_1 = __importDefault(require("./routes/usuario"));
const TipoUsuario_1 = __importDefault(require("./routes/TipoUsuario"));
const TipoPrestamo_1 = __importDefault(require("./routes/TipoPrestamo"));
const AsignacionRuta_1 = __importDefault(require("./routes/AsignacionRuta"));
const prestamo_1 = __importDefault(require("./routes/prestamo"));
const cobro_1 = __importDefault(require("./routes/cobro"));
const EgresoOperacion_1 = __importDefault(require("./routes/EgresoOperacion"));
const CajaSucursal_1 = __importDefault(require("./routes/CajaSucursal"));
const movimiento_caja_sucursal_1 = __importDefault(require("./routes/movimiento_caja_sucursal"));
const CajaDiaria_1 = __importDefault(require("./routes/CajaDiaria"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use('/api/sucursal', sucursal_1.default);
app.use('/api/ruta', ruta_1.default);
app.use('/api/cliente', cliente_1.default);
app.use('/api/usuario', usuario_1.default);
app.use('/api/tipousuario', TipoUsuario_1.default);
app.use('/api/tipoprestamo', TipoPrestamo_1.default);
app.use('/api/asignacionruta', AsignacionRuta_1.default);
app.use('/api/prestamo', prestamo_1.default);
app.use('/api/cobro', cobro_1.default);
app.use('/api/egresooperacion', EgresoOperacion_1.default);
app.use('/api/cajasucursal', CajaSucursal_1.default);
app.use('/api/movimientocajasucursal', movimiento_caja_sucursal_1.default);
app.use('/api/cajadiaria', CajaDiaria_1.default);
app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
db_1.default.connect()
    .then(() => {
    console.log('Conexión exitosa a la base de datos');
})
    .catch((err) => {
    console.error('Error al conectar a la base de datos:', err.message);
});
