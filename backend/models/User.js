// On importe mongoose
const mongoose = require('mongoose');

// On importe le plugin unique validateur de mongoose
const uniqueValidator = require('mongoose-unique-validator');

// // Création du schéma de données
const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// On applique le validateur au schéma avec la méthode plugin, avant d'en faire un modèle
userSchema.plugin(uniqueValidator);

// On exporte le schéma en tant que modèle mongoose appelé "User"
module.exports = mongoose.model('User', userSchema);