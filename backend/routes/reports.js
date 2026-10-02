import { Router } from "express";
import upload from "../middleware/upload.js";
import { auth, adminOnly } from "../middleware/auth.js";
import {
  createReport,
  listReports,
  listHotspots,
  planRoute,
  updateReport,
} from "../controllers/reportController.js";
const r = Router();
r.get("/", listReports);
r.get("/hotspots", auth, adminOnly, listHotspots);
r.get("/route", auth, planRoute);
r.post("/", upload.single("image"), createReport);
r.patch("/:id", auth, adminOnly, updateReport);
export default r;
