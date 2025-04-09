const express = require('express');
const multer = require('multer');
const Client = require('ssh2-sftp-client');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors()); // Permet les requêtes cross-origin

const upload = multer({ dest: 'uploads/' });

// Configuration SFTP
const sftpConfig = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT || 22,
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD
};

app.post('/upload', upload.array('schematics'), async (req, res) => {
    const sftp = new Client();
    
    try {
        await sftp.connect(sftpConfig);
        
        for(let file of req.files) {
            const remotePath = `/schematics/${file.originalname}`;
            await sftp.put(file.path, remotePath);
        }
        
        await sftp.end();
        res.json({ message: 'Schématiques uploadées avec succès!' });
    } catch (error) {
        console.error('Erreur SFTP:', error);
        res.status(500).json({ message: 'Erreur lors du transfert SFTP' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});