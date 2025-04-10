const express = require('express');
const multer = require('multer');
const Client = require('ssh2-sftp-client');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors()); // Permet les requêtes cross-origin

const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // limite à 10MB par exemple
    }
}).array('schematics', 10); // 10 fichiers maximum

// Configuration SFTP
const sftpConfig = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT || 22,
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD
};

app.post('/upload', (req, res) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            console.error('Erreur Multer:', err);
            return res.status(400).json({ message: `Erreur d'upload: ${err.message}` });
        } else if (err) {
            console.error('Erreur inconnue:', err);
            return res.status(500).json({ message: `Erreur serveur: ${err.message}` });
        }
        
        // Si pas d'erreur, continuer avec le traitement SFTP
        const sftp = new Client();
        sftp.connect(sftpConfig)
            .then(() => {
                const uploadPromises = req.files.map(file => {
                    const remotePath = `${process.env.SFTP_DEST_PATH}/${file.originalname}`;
                    return sftp.put(file.path, remotePath);
                });
                
                return Promise.all(uploadPromises);
            })
            .then(() => {
                return sftp.end();
            })
            .then(() => {
                res.json({ message: 'Schématiques uploadées avec succès!' });
            })
            .catch(error => {
                console.error('Erreur SFTP:', error);
                res.status(500).json({ message: 'Erreur lors du transfert SFTP: ' + error.message });
            });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
