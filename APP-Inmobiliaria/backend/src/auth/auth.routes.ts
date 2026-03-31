import { Router } from "express";
import { login } from "./auth.controller.js";
import { validateBody } from "../shared/middlewares/validation.middleware.js";
import { authLoginSchema } from "../shared/validation/schemas.js";

const router = Router();

router.post("/login", validateBody(authLoginSchema, { source: 'body' }), login);

export default router;
