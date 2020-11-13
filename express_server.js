const { findUserByEmail } = require('./helpers');
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

const urlDatabase = {};
const users = {};


const generateRandomString = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += chars[Math.floor(Math.random() * chars.length)];
  }
  return randomString;
};

const urlsForUser = (id) => {
  const matchingURLs = [];
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      matchingURLs.push(url);
    }
  }
  return matchingURLs;
};


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieSession({
  name: 'session',
  keys: ['niko'],
}));

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.session.user_id]};
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id]};
  res.render("urls_register", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  //redirect if not logged in
  if (!templateVars.user) {
    res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  //check if logged in first
  if (!req.session.user_id) {
    res.status(403).send('Error 403 Forbidden - Please login first!');
  }
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]['longURL'];
  const matchingURLs = urlsForUser(req.session.user_id);
  //render page if url belongs to user
  for (const url of matchingURLs) {
    if (url === shortURL) {
      const templateVars = { shortURL, longURL, user: users[req.session.user_id] };
      return res.render("urls_show", templateVars);
    }
  }
  //otherwise send 403 code
  res.status(403).send('Error 403 Forbidden - This url does not belong to you');
});

app.get("/u/:shortURL", (req, res) => {
  //send the user to the longurl site
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render('urls_login', templateVars);
});

app.post("/urls", (req, res) => {
  //add urls to the database
  let shortURLkey = generateRandomString();
  urlDatabase[shortURLkey] = { 'longURL': req.body.longURL, 'userID': req.session.user_id};
  res.redirect(`/urls/${shortURLkey}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL", (req, res) => {
  //edit the corresponding longURL
  urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const user = findUserByEmail(req.body.email, users);

  //send 403 code if email doesnt exist
  if (!user) {
    res.status(403).send('Error: 403 Forbidden - Invalid credentials');
  }
  //send 403 code if passwords dont match
  else if (!bcrypt.compareSync(req.body.password, user.password)) {
    res.status(403).send('Error: 403 Forbidden - Invalid credentials');
  }
  //otherwise set cookie and redirect to main page
  else {
    req.session.user_id = user.id;
    res.redirect('/urls');
  }
});

app.post("/logout", (req, res) => {
  //wipe cookie value and redirect
  req.session.user_id = null;
  res.redirect('/urls');
});

app.post("/register", (req, res) => {

  //send 400 code if email or password fields are left empty
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Error: 400 Bad Request - One or more fields left blank');
  }
  //send 400 code if email already exists
  else if (findUserByEmail(req.body.email, users)) {
    res.status(400).send('Error: 400 Bad Request - Email already in use');
  }
  //otherwise add user to database, set cookie, and redirect
  else {
    let user = generateRandomString();
    const hashedPW = bcrypt.hashSync(req.body.password, 10);
    users[user] = {
      'id': user,
      'email': req.body.email,
      'password': hashedPW
    };
    req.session.user_id = user;
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});