"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class Theme extends Model {
  user() {
    return this.belongsTo("App/Models/User", "username", "username");
  }
}

module.exports = Theme;
