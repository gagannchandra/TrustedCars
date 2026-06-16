import { Router } from "express";
import authRoutes from "./auth.routes.js";
import carRoutes from "./cars.routes.js";
import cityRoutes from "./cities.routes.js";
import inspectionRoutes from "./inspections.routes.js";
import checkoutRoutes from "./checkout.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import adminRoutes from "./admin.routes.js";
import supportRoutes from "./support.routes.js";
import chatRoutes from "./chat.routes.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      name: "TrustedCars API",
      version: "1.0.0",
      modules: ["auth", "cities", "cars", "inspections", "checkout", "dashboard", "admin", "support", "chat"],
    },
  });
});

router.use("/auth", authRoutes);
router.use("/cities", cityRoutes);
router.use("/cars", carRoutes);
router.use("/inspections", inspectionRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);
router.use("/support", supportRoutes);
router.use("/chat", chatRoutes);

export default router;