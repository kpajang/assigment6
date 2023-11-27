require('dotenv').config();
const Sequelize = require('sequelize');
const sequelize = new Sequelize('SenecaDB', 'kpajang', 'txHFDy4abMY3', {
  host: 'ep-old-night-56301761-pooler.us-east-2.aws.neon.tech',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false },
  },
});

const Theme = sequelize.define('Theme', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: Sequelize.STRING
}, { timestamps: false });

const Set = sequelize.define('Set', {
    set_num: { type: Sequelize.STRING, primaryKey: true },
    name: Sequelize.STRING,
    year: Sequelize.INTEGER,
    num_parts: Sequelize.INTEGER,
    theme_id: Sequelize.INTEGER,
    img_url: Sequelize.STRING
}, { timestamps: false });

Set.belongsTo(Theme, { foreignKey: 'theme_id' });

function initialize() {
    return sequelize.sync();
}

function getAllSets() {
    return Set.findAll({ include: [Theme] });
}

function getSetByNum(setNum) {
    return Set.findOne({ where: { set_num: setNum }, include: [Theme] });
}
function getSetsByTheme(theme) {
  console.log(`Filtering sets by theme: ${theme}`);
  return Set.findAll({
      include: [{ 
          model: Theme, 
          where: { name: { [Sequelize.Op.iLike]: `%${theme}%` } } 
      }]
  }).then(sets => {
      console.log(`Found ${sets.length} sets for theme ${theme}`);
      return sets;
  });
}


function getAllThemes() {
    return Theme.findAll();
}

function addSet(setData) {
    return Set.create(setData);
}

function editSet(setNum, setData) {
  return Set.update(setData, { where: { set_num: setNum } })
      .then(([rowsUpdated]) => {
          if (rowsUpdated === 0) {
              throw new Error('No set found with the specified number, or no change was made.');
          }
      })
      .catch(err => {
          throw new Error(err.errors[0].message || 'Error updating set.');
      });
}
function deleteSet(set_num) {
    return Set.destroy({ where: { set_num: set_num } })
        .then(() => {
            return Promise.resolve();
        })
        .catch((error) => {
            return Promise.reject(error.errors[0].message);
        });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, getAllThemes, addSet, editSet, deleteSet };



// If this script is run directly (not required as a module), execute initialize
if (require.main === module) {
  initialize().then(() => process.exit());
}
