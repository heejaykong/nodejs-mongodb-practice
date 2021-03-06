const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');

// Get All
router.get('/getAll', async (req, res) => {
  try {
    const contacts = await Contact.find();
    // res.json(contacts);
    console.log("get all 요청했음")
    console.log(`sent ${contacts}`)
    
    res.send(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
});

// Get One by id
router.get('/get/:id', getContact, (req, res) => {
  console.log(`get one by id\n ${res.contact}`);
  res.send(res.contact);
});

// Post one contact(with image field too)
var multer, storage, path, crypto;
multer = require('multer')
path = require('path');
crypto = require('crypto');

var form =
"<!DOCTYPE HTML><html><body>" +
  "<form method='post' action='/upload' enctype='multipart/form-data'>" +
    "<input type='file' name='upload'/>" +
  "</form>" +
"</body></html>";

router.get('/', function (req, res){
  try {
    res.writeHead(200, {'Content-Type': 'text/html' });
    res.end(form);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    return crypto.pseudoRandomBytes(16, function(err, raw) {
      if (err) {
        return cb(err);
      }
      return cb(null, "" + (raw.toString('hex')) + (path.extname(file.originalname))+".JPEG");
    });
  }
});

router.post("/post/:name/:phoneNum",
  multer({
    storage: storage
  }).single('upload'), async function(req, res) {
    try {
      const reqFile = JSON.stringify(req.file);
      const reqBody = JSON.stringify(req.body);
      
      console.log(`req.file: ${reqFile}`);
      console.log(`req.body: ${reqBody}`);

      console.log(req.file.filename);
      
      console.log(`name is ${req.params.name}`);
      console.log(`phoneNum is ${req.params.phoneNum}`);
      console.log(`url is ${req.file.path}`);
      
      // 여기부턴 contacts
      const contact = new Contact({
        name: req.params.name,
        phoneNum: req.params.phoneNum,
        url: (typeof req.file.path == undefined)? "" : `http://192.249.18.208:3000/images/${req.file.path}`
      })
      console.log(`after save, name is ${contact.name}`);
      console.log(`after save, phonenum is ${contact.phoneNum}`);
      console.log(`after save, url is ${contact.url}`);
  
      console.log("포스트 성공!!!!!");
      const newContact = await contact.save();
      console.log("after save");
      return res.status(201).json(newContact);

    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

// Put by id
router.put('/put/:id/:name/:phoneNum/:url',
  multer({
    storage: storage
  }).single('upload'), getContact, async function(req, res) {
  if (req.params.name != null) {
    res.contact.name = req.params.name;
  }
  if (req.params.phoneNum != null) {
    res.contact.phoneNum = req.params.phoneNum;
  }
  if (req.params.url != null) {
    const uptatedImageUrl = `http://192.249.18.208:3000/images/${req.file.path}`;

    res.contact.url = uptatedImageUrl;
  }
  // url: (typeof req.file.path == undefined)? "" : `http://192.249.18.208:3000/images/${req.file.path}`
  try {
    const updatedContact = await res.contact.save();
    console.log("update contact:");
    console.log(updatedContact);
    console.log(`after save, name is ${updatedContact.name}`);
    console.log(`after save, phonenum is ${updatedContact.phoneNum}`);
    console.log(`after save, url is ${updatedContact.url}\n\n`);

    res.send(updatedContact);

  } catch (err) {
    res.status(400).json({message: err.message});
  }
});

// Delete by id
const fs = require('fs');
router.delete('/delete/:id', getContact, async (req, res) => {
  try {
    const fileUrl = res.contact.url;
    console.log(fileUrl);
    // fs.unlinkSync(__dirname + "/../uploads" + file); //처리하고 싶다... 비동기...
    console.log(`deleted contact ㅎㅎ\n ${res.contact}`);
    await res.contact.remove();
    res.json({ message: "Deleted image" });
  
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});

// Delete All(only contact in DB, 파일시스템에 있는 프로필 이미지는 처리 못하는 중)
router.delete('/deleteAll', async (req, res) => {
  try {
    const contacts = await Contact.remove();
    res.json(contacts);
    res.json({message: "deleted all~~~"});
    const pathToDelete = `http://192.249.18.208:3000/images/uploads/.`;
    fs.unlinkSync(pathToDelete);
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
});

async function getContact(req, res, next){
  let contact;
  try {
    contact = await Contact.findById(req.params.id);
    if (contact == null) {
      return res.status(404).json({ message: 'Cannot find Contact' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.contact = contact;
  next();
}

module.exports = router;