import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import userRouter from "./user";
import reviewsRouter from "./reviews";
import aiRouter from "./ai";
import businessRouter from "./business";
import requestsRouter from "./requests";
import settingsRouter from "./settings";
import publicRouter from "./public";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/reviews", reviewsRouter);
router.use("/ai", aiRouter);
router.use("/business", businessRouter);
router.use("/business", requestsRouter);
router.use("/settings", settingsRouter);
router.use("/public", publicRouter);

export default router;
