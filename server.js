require('dotenv').config();
const Sequelize = require('sequelize');
const legoData = require("./modules/legoSets");
const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

// Set up Sequelize
const sequelize = new Sequelize('SenecaDB', 'kpajang', 'txHFDy4abMY3', {
    host: 'ep-old-night-56301761-pooler.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false },
    },
});

sequelize.authenticate()
    .then(() => console.log('Connection has been established successfully.'))
    .catch(err => console.error('Unable to connect to the database:', err));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.render("home"));

app.get('/about', (req, res) => res.render("about"));

app.get('/lego/sets', async (req, res) => {
  try {
      let sets;
      if (req.query.theme) {
          console.log(`Querying sets for theme: ${req.query.theme}`);
          sets = await legoData.getSetsByTheme(req.query.theme);
      } else {
          sets = await legoData.getAllSets();
      }
      res.render("sets", { sets });
  } catch (err) {
      console.error(`Error fetching sets: ${err.message}`);
      res.status(500).render("500", { message: err.message });
  }
});

app.get('/lego/sets/:num', async (req, res) => {
    try {
        const set = await legoData.getSetByNum(req.params.num);
        if (!set) throw new Error(`No set found with the number '${req.params.num}'.`);
        res.render("set", { set });
    } catch (err) {
        res.status(404).render("404", { message: err.message });
    }
});

app.get('/lego/addSet', async (req, res) => {
    try {
        const themes = await legoData.getAllThemes();
        res.render("addSet", { themes });
    } catch (err) {
        res.status(500).render("500", { message: `Server error: ${err.message}` });
    }
});

app.post('/lego/addSet', async (req, res) => {
    try {
        await legoData.addSet(req.body);
        res.redirect('/lego/sets');
    } catch (err) {
        res.status(500).render("500", { message: `Server error: ${err.message}` });
    }
});

// New routes for editing sets
app.get("/lego/editSet/:num", async (req, res) => {
    try {
        const set = await legoData.getSetByNum(req.params.num);
        const themes = await legoData.getAllThemes();
        if (!set) throw new Error("Set not found");
        res.render("editSet", { set, themes });
    } catch (err) {
        res.status(404).render("404", { message: err.message });
    }
});

app.post("/lego/editSet", async (req, res) => {
    try {
        await legoData.editSet(req.body.set_num, req.body);
        res.redirect("/lego/sets");
    } catch (err) {
        res.status(500).render("500", { message: err.message });
    }
});

// New route for deleting sets
app.get("/lego/deleteSet/:num", async (req, res) => {
  try {
      await legoData.deleteSet(req.params.num);
      res.redirect("/lego/sets");
  } catch (err) {
      res.status(500).render("500", { message: err.message });
  }
});

app.use((req, res) => res.status(404).render("404", { message: "The page you are looking for does not exist." }));

legoData.initialize().then(() => app.listen(HTTP_PORT, () => console.log(`Server listening on: ${HTTP_PORT}`)));


//psql 'postgresql://kpajang:txHFDy4abMY3@ep-old-night-56301761-pooler.us-east-2.aws.neon.tech/SenecaDB?sslmode=require'
