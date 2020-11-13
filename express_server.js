const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

const urlDatabase = {};
const users = {};

function findUserByEmail(email, usersdb) {
  console.log('usersdb', usersdb, email);
  for (const u in usersdb) {
    if (email === usersdb[u].email) {
      return usersdb[u];
    }
  }
  return false;
};

function generateRandomString() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += chars[Math.floor(Math.random() * chars.length)];
  }
  return randomString;
};

function urlsForUser(id) {
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
app.use(cookieParser());


app.get("/", (req, res) => {
  res.send('Hello!');
});

app.get("/urls", (req, res) => {
  console.log('urldatabase: ', urlDatabase);
  //console.log(users);
  const templateVars = { urls: urlDatabase, user: users[req.cookies["userID"]]};
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["userID"]]};
  res.render("urls_register", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["userID"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  
  if (!req.cookies['userID']) {
    res.redirect('/login');
  } else {
    const shortURL = req.params.shortURL;
    const longURL = urlDatabase[shortURL]['longURL'];
    const matchingURLs = urlsForUser(req.cookies["userID"]);
    let sameID = false;
    
    for (const url of matchingURLs) {
      if (url === shortURL) {
        sameID = true;
        templateVars = { shortURL, longURL, user: users[req.cookies["userID"]], sameID};
      }
      return res.render("urls_show", templateVars);

    };

  }
  
  res.status(403).send('This url does not belong to you');

  //redirect if user isnt logged in

});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["userID"]]}
  res.render('urls_login', templateVars);
});

app.post("/urls", (req, res) => {
  let shortURLkey = generateRandomString();
  urlDatabase[shortURLkey] = { 'longURL': req.body.longURL, 'userID': req.cookies["userID"]};
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const user = findUserByEmail(req.body.email, users);
  //send 403 code if email doesnt exist
  if (!user) {
    res.sendStatus(403);
    console.log('userdoesntexist', user)
  }
  //send 403 code if passwords dont match
  else if (user.password !== req.body.password) {
    res.sendStatus(403);
    console.log('password', user.password);
  }
  else {
    console.log('userid', user.id);
    console.log('user', user);
    res.cookie('userID', user.id);
    res.redirect('/urls');
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  //send 400 code if email or password fields are left empty
  if (!req.body.email || !req.body.password) {
    res.sendStatus(400);
  }
  //send 400 code if email already exists
  else if (findUserByEmail(req.body.email, users)) {
    console.log("findbyemailifstatement");
    res.sendStatus(400);
  }
  else {
    let user = generateRandomString();
  
    users[user] = { 
      'id': user,
      'email': req.body.email,
      'password': req.body.password 
    };
    res.cookie('userID', user);
    //console.log(users);
    res.redirect('/urls');
  };
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});