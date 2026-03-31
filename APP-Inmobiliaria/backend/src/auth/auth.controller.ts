
import { NextFunction, Request, Response } from "express";
import { EntityManager } from "@mikro-orm/mysql";
import jwt from "jsonwebtoken";
import { Cliente } from "../cliente/cliente.entity.js";
import { AgenteInmobiliario } from "../agenteinmobiliario/agenteinmobiliario.entity.js";
import { orm } from "../shared/db/orm.js"; 
import { HttpError } from "../shared/errors/http.error.js";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body; // password es nro_doc en este caso
  const em = orm.em as EntityManager;

  try {

    let role: "cliente" | "agente" | null = null;
    let user:
      | (Cliente & { password: string; email: string; id: number })
      | (AgenteInmobiliario & { password: string; email: string; id: number })
      | null = null;

    const cliente = await em.findOne(Cliente, { email });
    if (cliente) {
      role = "cliente";
      user = cliente as any;
    } else {
      const agente = await em.findOne(AgenteInmobiliario, { email });
      if (agente) {
        role = "agente";
        user = agente as any;
      }
    }

    if (!user || !role) {
      return next(new HttpError(401, "Credenciales inválidas", [{ path: "general", message: "Credenciales inválidas" }], "AUTH_ERROR"));
    }


    if (String(user.password) !== String(password)) {
      return next(new HttpError(401, "Credenciales inválidas", [{ path: "general", message: "Credenciales inválidas" }], "AUTH_ERROR"));
    }
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    return res.json({ accessToken, role });
  } catch (error) {
    return next(error);
  }
};
