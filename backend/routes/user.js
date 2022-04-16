// On importe express et on crée le routeur
const express = require('express');
const router = express.Router();

// On importe user (controllers)
const userCtrl = require('../controllers/user');

// On importe les routes avec les fonctions signup et login
router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);

// On exporte le routeur
module.exports = router;