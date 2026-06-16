import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assetsRouter from "./assets";
import transactionsRouter from "./transactions";
import documentsRouter from "./documents";
import entitiesRouter from "./entities";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assetsRouter);
router.use(transactionsRouter);
router.use(documentsRouter);
router.use(entitiesRouter);
router.use(dashboardRouter);

export default router;
