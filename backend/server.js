const express = require("express");
const cors = require("cors");

const db = require("./database/database");

const usersRoute = require("./routes/users");
const adminRoute = require("./routes/admin");
const coursesRoute = require("./routes/courses");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", usersRoute);
app.use("/api/admin", adminRoute);
app.use("/api/courses", coursesRoute);

app.listen(5000, () => {
    console.log("Server running");
});