//init code
require('dotenv').config()
const express = require('express');
const mongodb = require('mongodb');
const port = 5000
const cors = require('cors');
const bodyParser = require('body-parser');
const ObjectId = require('mongodb').ObjectId;
const fileUpload = require('express-fileupload')

//middleware setup
const app = express()
app.use(express.static('reviews'))
app.use(fileUpload());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




app.get('/', (req, res) => {
  res.send(`<h1> Agency Website Server Side</h1>`)
})


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4tdw4.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {

  console.log('mongo error check: ', err);


  const servicesCollection = client.db("ServicesList").collection("service");
  const ordersCollection = client.db("ServicesList").collection("userOrders");
  const adminCollection = client.db("ServicesList").collection("admin");

  // allServices collection

  app.get('/allServices', (req, res) => {
    servicesCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/allServices/:id', (req, res) => {
    servicesCollection.find({ _id: ObjectId(req.params.id) })
      .toArray((err, documents) => {
        res.send(documents[0]);
      })
  })



  app.delete('/allServices/:id', (req, res) => {
    servicesCollection.deleteOne({ _id: ObjectId(req.params.id) })
      .then(result => {
        res.send(result.deletedCount > 0);
        console.log(result, 'Admin data deleted');

      })
  })


  //Add services by Admin

  app.post('/addServices', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const details = req.body.details;
    const price = req.body.number;
    const newImg = req.files.file.data;
    const encImg = newImg.toString('base64');
    var image = {
      contentType: req.files.file.mimetype,
      size: req.files.file.size,
      img: Buffer.from(encImg, 'base64')
    }
    servicesCollection.insertOne({ name, details, image, price })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })


  app.post('/placeOrder', (req, res) => {

    const status = req.body.status;
    const name = req.body.name;
    const email = req.body.email;
    const details = req.body.details;
    const service = req.body.service;
    const serviceImg = req.body.serviceImg;
    const serviceData = req.body.serviceData;
    const paymentId = req.body.paymentId;
    const billing_details = req.body.billing_details;

    ordersCollection.insertOne({ name, email, service, serviceImg, status, serviceData, paymentId, details, billing_details })

      .then(result => {
        console.log(result);
        res.send(result.insertedCount > 0)
      })
  })

  // Add order By Service Id 

  app.get('/order/:id', (req, res) => {
    servicesCollection.find({ _id: ObjectId(req.params.id) })
      .toArray((err, documents) => {
        res.send(documents[0])
      })
  })

  // Find all Orders Only Admin

  app.get('/orders', (req, res) => {
    ordersCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })

  // Find Specific user Orders by Email

  app.get('/specificOrder', (req, res) => {
    ordersCollection.find({ email: req.query.email })
      .toArray((err, documents) => {
        res.send(documents)
      })
  })

  // Admin's login

  app.get('/admin', (req, res) => {
    const email = req.query.email;
    const pass = req.query.password;
    adminCollection.find({ email, pass })
      .toArray((err, collection) => {
        res.send(collection.length > 0)
      })
  })

  // Make an admin 
  app.post('/makeAdmin', (req, res) => {
    adminCollection.insertOne(req.body)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  // Update A Status By Admin

  app.patch('/update/:id', (req, res) => {
    ordersCollection.updateOne({ _id: ObjectId(req.params.id) },
      {
        $set: { status: req.body.status }
      })
      .then(result => {
        res.send(result.modifiedCount > 0);
      })
  })

});

app.listen(process.env.PORT || port)
