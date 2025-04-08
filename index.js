const express = require("express");
const fileUpload = require("express-fileupload");
const SftpClient = require("ssh2-sftp-client");
const fs = require("fs");
console.log("STARTING!");

const app = express();
app.use(fileUpload());

app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("Aucun fichier reçu");
  }

  const file = req.files.file;
  const tmpPath = `./${file.name}`;
  await file.mv(tmpPath);
  console.log("Debug 1");

  const sftp = new SftpClient();
  try {
    await sftp.connect({
        host: process.env.SFTP_HOST,
        port: process.env.SFTP_PORT,
        username: process.env.SFTP_USER,
        password: process.env.SFTP_PASS,
      });
      console.log("Debug 2");
      await sftp.put(tmpPath, process.env.SFTP_DEST_PATH + file.name);
      console.log("Debug 3");
      
    await sftp.end();

    fs.unlinkSync(tmpPath);
    res.send("Fichier uploadé sur le SFTP !");
  } catch (err) {
    res.status(500).send("Erreur : " + err.message);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Serveur démarré");
});