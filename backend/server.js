require("dotenv").config();

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
const quizRoute = require("./routes/quiz");
const catalogRoute = require("./routes/catalog");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
app.use("/api/quiz", quizRoute);
app.use("/api/catalog", catalogRoute);

app.use((err, req, res, next) => {
    if (err?.type === "entity.too.large") {
        return res.status(413).json({ message: "Payload trop volumineux" });
    }
    console.error("Unhandled express error:", err);
    return next(err);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
});

let server;

function startServer(port) {
    server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    server.on("error", (err) => {
        if (err?.code === "EADDRINUSE") {
            console.error(`Port ${port} déjà utilisé. Nouvelle tentative dans 2s...`);
            setTimeout(() => startServer(port), 2000);
            return;
        }

        console.error("Server listen error:", err);
        process.exitCode = 1;
    });
}

process.on("SIGINT", () => {
    if (!server) {
        process.exit(0);
        return;
    }

    server.close(() => {
        console.log("Server stopped");
        process.exit(0);
    });
});

startServer(PORT);
