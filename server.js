/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: ___kamelin pajang___________________ Student ID: ________186252219______ Date: ___2023/12/12___________
*
*  Published URL: ___________________________________________________________
*
********************************************************************************/

const clientSessions = require('client-sessions');
require('dotenv').config();
const Sequelize = require('sequelize');
const legoData = require("./modules/legoSets");
const authService = require('./modules/auth-service');
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
    .then(() => console.log('Database connection established successfully.'))
    .catch(err => console.error('Unable to connect to the database:', err));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(clientSessions({
    cookieName: 'session',
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr',
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
}
  // Routes
app.get('/', (req, res) => res.render("home"));
app.get('/about', (req, res) => res.render("about"));

app.get('/lego/sets', async (req, res) => {
    try {
        const sets = await legoData.getAllSets();
        res.render("sets", { sets });
    } catch (err) {
        res.status(500).render("500", { message: err.message });
    }
});

app.get('/lego/sets/:num', async (req, res) => {
    try {
        const set = await legoData.getSetByNum(req.params.num);
        res.render("set", { set });
    } catch (err) {
        res.status(404).render("404", { message: err.message });
    }
});

app.get('/lego/addSet', ensureLogin, async (req, res) => {
    try {
        const themes = await legoData.getAllThemes();
        res.render("addSet", { themes });
    } catch (err) {
        res.status(500).render("500", { message: err.message });
    }
});

app.post('/lego/addSet', ensureLogin, async (req, res) => {
    try {
        await legoData.addSet(req.body);
        res.redirect('/lego/sets');
    } catch (err) {
        res.status(500).render("500", { message: err.message });
    }
});

// ... (routes for edit and delete)
app.get('/lego/editSet/:num', ensureLogin, async (req, res) => {
    try {
        const setNum = req.params.num;
        const set = await legoData.getSetByNum(setNum);
        const themes = await legoData.getAllThemes();

        if (!set) {
            throw new Error(`No set found with number ${setNum}`);
        }

        res.render("editSet", { set, themes });
    } catch (err) {
        res.status(404).render("404", { message: err.message });
    }
});
app.post('/lego/editSet', ensureLogin, async (req, res) => {
    try {
        const updatedSetData = req.body; // Assuming the form data is in req.body
        await legoData.editSet(updatedSetData.set_num, updatedSetData);

        res.redirect('/lego/sets');
    } catch (err) {
        res.status(500).render("500", { message: err.message });
    }
});
app.get('/lego/deleteSet/:num', ensureLogin, async (req, res) => {
    try {
        const setNum = req.params.num;
        await legoData.deleteSet(setNum);

        res.redirect('/lego/sets');
    } catch (err) {
        res.status(500).render("500", { message: err.message });
    }
});


app.get('/login', (req, res) => res.render('login', { message: '' }));

app.get('/register', (req, res) => res.render('register', { successMessage: '', errorMessage: '' }));

app.post('/register', (req, res) => {
    authService.registerUser(req.body)
      .then(() => res.render('register', { successMessage: "User created", errorMessage: '' }))
      .catch(err => res.render('register', { errorMessage: err, userName: req.body.userName }));
});

app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authService.checkUser(req.body)
      .then(user => {
        req.session.user = { userName: user.userName, email: user.email, loginHistory: user.loginHistory };
        res.redirect('/lego/sets');
      })
      .catch(err => res.render('login', { errorMessage: err, userName: req.body.userName }));
});

app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory', { user: req.session.user });
});

// Error Handling
app.use((req, res) => {
    res.status(404).render("404", { message: "The page you are looking for does not exist." });
});

// Initialize and start server
legoData.initialize()
  .then(() => authService.initialize())
  .then(() => app.listen(HTTP_PORT, () => console.log(`Server listening on: ${HTTP_PORT}`)))
  .catch(err => console.error('Server initialization failed:', err));


//psql 'postgresql://kpajang:txHFDy4abMY3@ep-old-night-56301761-pooler.us-east-2.aws.neon.tech/SenecaDB?sslmode=require'
//https://asiigmnet5-new.onrender.com
