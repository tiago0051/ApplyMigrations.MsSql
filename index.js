const fs = require("fs");
var Connection = require("tedious").Connection;
var Request = require("tedious").Request;
const { exit } = require("process");

function applyMigrations(files, fileIndex) {
  const fileName = files[fileIndex];

  if (conf.executed.some((executed) => executed === fileName)) {
    isFully(files, fileIndex);

    return;
  }

  const fileContent = fs
    .readFileSync(`${migrationFolder}/${fileName}`)
    .toString();

  const request = new Request(fileContent.trim(), (err) => {
    if (err) console.error(err);
  });

  request.on("done", () => {
    console.log(
      `${fileName} aplicado com sucesso ${fileIndex + 1}/${files.length}`
    );

    conf.executed.push(fileName);
  });

  request.on("requestCompleted", () => {
    isFully(files, fileIndex);
  });

  connection.execSqlBatch(request);
}

function isFully(files, fileIndex) {
  if (fileIndex + 1 < files.length) {
    applyMigrations(files, fileIndex + 1);
  } else {
    fs.writeFileSync("config.json", JSON.stringify(conf), "utf8");
    connection.close();

    console.log("Finalizado");

    exit();
  }
}

async function main() {
  const files = fs.readdirSync(migrationFolder);

  applyMigrations(files, 0);
}

const migrationFolder = "migrations";

let conf = { executed: [] };

const existsConf = fs.existsSync("config.json");

if (existsConf) conf = JSON.parse(fs.readFileSync("config.json"));

const connection = new Connection({
  server: "localhost",
  authentication: {
    type: "default",
    options: {
      userName: "",
      password: "",
    },
  },
  options: {
    database: "",
    trustServerCertificate: true,
  },
});

connection.on("connect", (err) => {
  if (err) {
    console.log(err);
  } else {
    main();
    console.log("Conectado");
  }
});

connection.connect();
