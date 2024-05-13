const express = require("express");
const { ServerConfig, Logger } = require("./config");
const apiRoutes = require("./routes");
const CRON = require("./utils/common/cron-jobs");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRoutes);

app.listen(ServerConfig.PORT, () => {
  console.log(`Server started successfully on PORT ${ServerConfig.PORT}`);
  CRON();

  //below line will print logs
  Logger.info("Successfully started the server", {});
});
