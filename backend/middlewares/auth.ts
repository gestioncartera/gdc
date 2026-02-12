import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
    let token = req.header("Authorization");
    
    if (!token) {
        return res.status(400).send({ message: "Authorization denied: No token" });
    }

    // El token suele venir como "Bearer <token>"
    token = token.split(" ")[1];
    
    if (!token) {
        return res.status(400).send({ message: "Authorization denied: No token" });
    }

    try {
        // Verificar el token usando la clave secreta de entorno
        req.user = jwt.verify(token, process.env.SK_JWT || '');
        next();
    } catch (e) {
        return res.status(400).send({ message: "Authorization denied: Invalid token" });
    }
};

export default auth;
