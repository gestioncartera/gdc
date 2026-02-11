import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface IPayload {
    uid: number;
    email: string;
    iat: number;
    exp: number;
}

// Extend Express Request interface to include uid and name
declare global {
    namespace Express {
        interface Request {
            uid?: number;
            email?: string;
        }
    }
}

export const validarJWT = (req: Request, res: Response, next: NextFunction) => {
    // x-token headers
    const token = req.header('Authorization');
    const actualToken = token?.split(' ')[1] || null; // Extraer el token del formato "Bearer <token>"

    if (!actualToken) {
        return res.status(401).json({
            ok: false,
            msg: 'No hay token en la petición'
        });
    }

    try {
        const { uid, email } = jwt.verify(
            actualToken,
            process.env.SK_JWT || ''
        ) as IPayload;

        req.uid = uid;
        req.email = email;

    } catch (error) {
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }

    next();
}

export default  validarJWT
;
