import { Request, Response, NextFunction } from 'express';
import usuarioModel from '../models/usuario';
import db from '../db/db'; // Importar db para consultar el nombre del rol si es necesario

export const esAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // req.uid viene del middleware validar-jwt
    if (!req.uid) {
        return res.status(500).json({
            msg: 'Se quiere verificar el role sin validar el token primero'
        });
    }

    try {
        const usuario = await usuarioModel.getUsuarioById(req.uid);

        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }

        // Obtener el nombre del rol para ser más precisos (opcional pero recomendado)
        // O simplemente comparar IDs si sabes que 1 es Admin
        const roleQuery = await db.query('SELECT nombre_tipo_usuario FROM tipo_usuario WHERE id_tipo_usuario = $1', [usuario.tipo_usuario]);
        
        if (roleQuery.rows.length === 0) {
             return res.status(401).json({
                msg: 'Rol de usuario no válido'
            });
        }

        const nombreRole = roleQuery.rows[0].nombre_tipo_usuario.toUpperCase();

        // Verifica si el rol es Administrador (ajusta el string según tu DB: 'ADMIN', 'ADMINISTRADOR', etc.)
        if (nombreRole !== 'ADMINISTRADOR' && nombreRole !== 'ADMIN') {
            return res.status(401).json({
                msg: `${usuario.nombres} no es administrador - No puede hacer esto`
            });
        }

        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Error al verificar rol de administrador'
        });
    }
};
