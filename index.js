const express = require("express");
const fileUpload = require("express-fileupload");
const SftpClient = require("ssh2-sftp-client");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Middleware pour gérer les fichiers uploadés
app.use(fileUpload());

// Route pour recevoir et envoyer le fichier vers SFTP
app.post("/upload", async (req, res) => {
  // Vérification qu'un fichier a bien été envoyé
  if (!req.files || !req.files.file) {
    return res.status(400).send("Aucun fichier reçu");
  }

  const file = req.files.file;  // Le fichier reçu
  const tmpPath = `./${file.name}`;  // Emplacement temporaire pour le fichier

  // Sauvegarder le fichier sur le serveur local temporairement
  await file.mv(tmpPath);

  const sftp = new SftpClient();
  try {
    // Connexion au serveur SFTP
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: Number(process.env.SFTP_PORT),
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASS,
    });

    // Envoi du fichier vers le SFTP
    await sftp.put(tmpPath, process.env.SFTP_DEST_PATH + file.name);

    // Déconnexion du serveur SFTP
    await sftp.end();

    // Supprimer le fichier temporaire localement
    fs.unlinkSync(tmpPath);

    // Répondre à l'utilisateur que l'upload est réussi
    res.send("Fichier uploadé sur le SFTP !");
  } catch (err) {
    console.error("Erreur SFTP : ", err.message);
    res.status(500).send("Erreur SFTP : " + err.message);
  }
});

// Lancer le serveur
app.listen(process.env.PORT || 3000, () => {
  console.log("Serveur démarré sur le port ", process.env.PORT || 3000);
});