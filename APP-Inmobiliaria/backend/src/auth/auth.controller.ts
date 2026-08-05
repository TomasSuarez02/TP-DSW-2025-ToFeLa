
import { NextFunction, Request, Response } from "express";
import { EntityManager } from "@mikro-orm/mysql";
import jwt from "jsonwebtoken";
import { Cliente } from "../cliente/cliente.entity.js";
import { AgenteInmobiliario } from "../agenteinmobiliario/agenteinmobiliario.entity.js";
import { orm } from "../shared/db/orm.js";
import { HttpError } from "../shared/errors/http.error.js";
import { JWT_SECRET } from "../shared/config.js";
import { verificarPassword } from "../shared/utils/password.js";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { mail, contrasenia } = req.body;
  const em = orm.em as EntityManager;

  try {
    let role: "cliente" | "agente" | null = null;
    let user: Cliente | AgenteInmobiliario | null = null;

    // Cliente y AgenteInmobiliario comparten la tabla `usuario`; el discriminador
    // `rol` hace que cada búsqueda traiga solo las filas de ese tipo.
    const cliente = await em.findOne(Cliente, { mail });
    if (cliente) {
      role = "cliente";
      user = cliente;
    } else {
      const agente = await em.findOne(AgenteInmobiliario, { mail });
      if (agente) {
        role = "agente";
        user = agente;
      }
    }

    if (!user || !role) {
      return next(new HttpError(401, "Credenciales inválidas", [{ path: "general", message: "Credenciales inválidas" }], "AUTH_ERROR"));
    }

    if (!(await verificarPassword(String(contrasenia), user.contrasenia))) {
      return next(new HttpError(401, "Credenciales inválidas", [{ path: "general", message: "Credenciales inválidas" }], "AUTH_ERROR"));
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.mail, role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ accessToken, role });
  } catch (error) {
    return next(error);
  }
};
