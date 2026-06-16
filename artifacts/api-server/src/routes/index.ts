import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assetsRouter from "./assets";
import transactionsRouter from "./transactions";
import documentsRouter from "./documents";
import entitiesRouter from "./entities";
import dashboardRouter from "./dashboard";
import systemRouter from "./system";
import aiRouter from "./ai";
import snapshotsRouter from "./snapshots";
import businessRouter from "./business";
import researchRouter from "./research";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assetsRouter);
router.use(transactionsRouter);
router.use(documentsRouter);
router.use(entitiesRouter);
router.use(dashboardRouter);
router.use(systemRouter);
router.use(aiRouter);
router.use(snapshotsRouter);
router.use(businessRouter);
router.use(researchRouter);

export default router;
