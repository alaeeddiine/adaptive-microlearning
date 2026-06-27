const express = require("express");
const cors = require("cors");

const db = require("./database/database");

const usersRoute = require("./routes/users");
const adminRoute = require("./routes/admin");
const coursesRoute = require("./routes/courses");
const progressRoute = require("./routes/progress");
const notificationsRoute = require("./routes/notifications");
const recommendationsRoute = require("./routes/recommendations");
const sessionRoute = require("./routes/session");
const activityRoute = require("./routes/activity");
const analyticsRoute = require("./routes/analytics");
const arcsRoute = require("./routes/arcs");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", usersRoute);
app.use("/api/admin", adminRoute);
app.use("/api/courses", coursesRoute);
app.use("/api/progress", progressRoute);
app.use("/api/notifications", notificationsRoute);
app.use("/api/recommendations", recommendationsRoute);
app.use("/api/session", sessionRoute);
app.use("/api/activity", activityRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/arcs", arcsRoute);

app.listen(5000, () => {
    console.log("Server running");
});