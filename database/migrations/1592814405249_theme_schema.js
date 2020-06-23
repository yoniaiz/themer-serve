'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThemeSchema extends Schema {
  up () {
    this.create('themes', (table) => {
      table.increments()
      table.string('themeName').notNullable().unique()
      table.string('mainColor').notNullable()
      table.string('secondaryColor').notNullable()
      table.string('backgroundColor').notNullable()
      table.string('username', 80).notNullable()
      table.float('rate').defaultTo(0)
      table.integer('rateCount').defaultTo(0)
      table.string('fontColor').notNullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('themes')
  }
}

module.exports = ThemeSchema
