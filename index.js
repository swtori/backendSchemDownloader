const express = require("express");
const fileUpload = require("express-fileupload");
const SftpClient = require("ssh2-sftp-client");
const fs = require("fs");

console.log("STARTING!");

const app = express();

console.log("1");

// Middleware pour gérer le téléchargement de fichiers
app.use(fileUpload());

console.log("2!");

// Route pour recevoir le fichier
app.post("/upload", async (req, res) => {
  console.log("Request received at /upload");

  // Vérification si un fichier est bien envoyé
  if (!req.files || !req.files.file) {
    console.log("est passé dans le if");
    return res.status(400).send("Aucun fichier reçu");
  }

  const file = req.files.file;
  console.log("3! Fichier reçu : ", file.name);

  const tmpPath = `./${file.name}`;
  console.log("4! Sauvegarde du fichier temporaire : ", tmpPath);

  // Déplacer le fichier dans le dossier temporaire
  await file.mv(tmpPath);
  console.log("5! Fichier déplacé avec succès");

  const sftp = new SftpClient();
  try {
    console.log("6! Connexion au SFTP...");

    // Connexion au serveur SFTP
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: Number(process.env.SFTP_PORT),
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASS,
    });
    console.log("7! Connexion réussie");

    // Téléversement du fichier sur le SFTP
    await sftp.put(tmpPath, process.env.SFTP_DEST_PATH + file.name);
    console.log("8! Fichier uploadé sur SFTP");

    // Terminer la connexion SFTP
    await sftp.end();
    console.log("9! Connexion SFTP terminée");

    // Supprimer le fichier temporaire
    fs.unlinkSync(tmpPath);
    console.log("10! Fichier temporaire supprimé");

    // Réponse de succès
    res.send("Fichier uploadé sur le SFTP !");
  } catch (err) {
    console.error("Erreur : ", err.message);
    res.status(500).send("Erreur : " + err.message);
  }
});

// Lancer le serveur
app.listen(process.env.PORT || 3000, () => {
  console.log("Serveur démarré sur le port ", process.env.PORT || 3000);
});
