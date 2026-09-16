import { Router, type IRouter } from "express";
import healthRouter from "./health";
import havenRouter from "./haven";

const router: IRouter = Router();

router.use(healthRouter);
router.use(havenRouter);

export default router;
