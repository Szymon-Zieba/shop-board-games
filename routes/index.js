var express = require('express');
var db = require('../db');
var router = express.Router();
var jwt = require('jwt-simple');
const { createConnection } = require('mysql');
var secret = '%#$@*(%#@*)%&#@*%&_)(@*#&^)(_';


function auth(req, res, next) {
  if(req.cookies.token){
    const decode = jwt.decode(req.cookies.token, secret);
    if(decode){
      req.user = decode;
    }
  }
  next();
}

function onlyFor(role){
  return function(req, res, next){
    if(req.user?.role === role){
      next();
    }
    else{
      res.status(401).send("Brak autoryzacji");
    }
  }
};

/* GET home page. */

router.get('/', auth, async (req, res, next) => {
    res.render('index', {logged:!!req.user});
  });

  router.get('/about', auth, async (req, res, next) => {
    res.render('about', {logged:!!req.user});
  });
  
  router.get('/planszowe', auth, async (req, res, next) => {
    const [getPlanszowe] = await db.getPlanszowe();
    res.render('planszowe', {getPlanszowe, logged:!!req.user});
  });

  router.get('/karciane', auth, async (req, res, next) => {
    const [getKarciane] = await db.getKarciane();
    res.render('karciane', {getKarciane, logged:!!req.user});
  });

  router.get('/figurkowe', auth, async (req, res, next) => {
    const [getFigurkowe] = await db.getFigurkowe();
    res.render('figurkowe', {getFigurkowe, logged:!!req.user});
  });

  router.get('/gra/:id', auth, async (req, res, next) => {
    const { id } = req.params;
    const [products] = await db.getGame(id);
    const product = products ? products[0] : {};
    res.render('product', {product, logged:!!req.user});
  });


  router.get('/register', auth, function(req, res, next) {
    res.render('register', {error:""});
});

router.get('/login', auth, function(req, res, next) {
  res.render('login', {});
});

router.post('/login', auth, async (req, res, next) => {
  const {email,password} = req.body;
  const [result] = await db.loginClient(email, password);
  if(result.length){
    const user = result[0];
    const token = jwt.encode({email:user.email, role:'user', id: user.id_clients}, secret);
    res.cookie('token', token, {httpOnly:true, secure:true});
    res.redirect('/');
  }
  else{
    res.render('login', {error:"Zły login lub hasło"});
  }
});

router.post('/register', async(req, res, next)  =>{
  const {name, lastName, email, password, phone_number, adress} = req.body;
  try{
    await db.registerClients(name, lastName, email, password, phone_number, adress);
  }
  catch(error){
   if(error.code = 'ER_DUP_ENTRY'){
     res.render('register', {error: "Ten Email jest zajęty!"})
   }
   else{
    res.render('register', {error: "Błąd serwera!"})
   }
   return;
  }
  res.redirect('/login');
});

router.post('/logout', auth, function(req, res, next){
  res.clearCookie("token");
  res.send({});
});

router.get('/koszyk', auth, onlyFor('user'), async(req, res, next)  =>{
  const [products] = await db.getCard(req.user.id);
  const result = [];
  for(let i=0; i<products.length; i++ ) {
    let product = products[i];
    const duplicateIndex = result.findIndex(el=> el.id_clients === product.id_clients && el.id_games === product.id_games)
    if(duplicateIndex >= 0){
      result[duplicateIndex].count++;
    }
    else{
      product.count = 1;
      result.push(product);
    }
  }
  const allPrice = result.reduce((a, b) => {
    const getPrice = (obj) => obj.price;
    const getAllPrice = (obj) => getPrice(obj)*obj.count;
    return a + getAllPrice(b);
  }, 0)
  res.render('card', {logged:!!req.user, products: result || [], allPrice: allPrice.toFixed([2]) || 0});
});

router.post('/addToCard/:id', auth, async (req, res, next) => {
  if (!req.user) return res.redirect('/login');

  const {id} = req.params;
  try{
  await db.addGametoCard(req.user.id, id);
  }
  catch(error){
    debugger;
  }
  res.redirect('/koszyk');
});

router.post('/remove-card/:id', async (req, res, next)  =>{
  const {id} = req.params;
  await db.removeCard(id);
  res.redirect('/koszyk');
});



module.exports = router;
