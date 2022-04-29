// On importe express
const express = require('express');

// Création application express
const app = express();

// On importe path de node pour connaitre le chemin du sytème de fichiers
const path = require('path');

// On importe les routeurs sauce + user
const sauceRoutes = require('./routes/sauce');
const userRoutes = require('./routes/user');

// Importation de mongoose + connection à la bdd mongodb
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_DB_CONN, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB Atlas réussie !'))
    .catch(() => console.log('Connexion à MongoDB Atlas échouée !'));

// Middleware qui intercepte toutes les requêtes qui ont un content-type json
app.use(express.json());

// Middleware pour autoriser la communication entre les serveurs frontend et backend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-with, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// On indique la destination du dossier images avec les fonctions static d'express et join de path
app.use('/images', express.static(path.join(__dirname, 'images'))); // 

// On enregistre les routes dans l'application (celles attendues par le front-end)
app.use('/api/sauces', sauceRoutes);
app.use('/api/auth', userRoutes);

// On exporte l'application
module.exports = app;