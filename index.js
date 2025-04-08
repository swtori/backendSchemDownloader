const express = require("express");
const fileUpload = require("express-fileupload");
const SftpClient = require("ssh2-sftp-client");
const fs = require("fs");

const app = express();
app.use(fileUpload());

app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("Aucun fichier reçu");
  }

  const file = req.files.file;
  const tmpPath = `./${file.name}`;
  await file.mv(tmpPath);

  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host: "sftp.monserveur.com",
      port: 22,
      username: "utilisateur",
      password: "motdepasse",
    });

    await sftp.put(tmpPath, `/chemin/distant/${file.name}`);
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