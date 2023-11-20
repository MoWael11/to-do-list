//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
mongoose.connect(process.env.DATABASE_URL);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = new mongoose.mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your to do list"
});
const item2 = new Item ({
  name: "Put some itmes in the to do list"
});
const item3 = new Item ({
  name: "Delete items by clicking the square"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.mongoose.model("List", listSchema);

const day = date.getDate();
app.get("/", function(req, res) {
  Item.find({}, function(err, items){
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfuly saved default items to DB");
        }
      });
      res.redirect("/")
    } else {
      res.render("list", {listTitle: day, newListItems: items});
    }
  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName,
  })

  if (listName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, results){
      results.items.push(item);
      results.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === day) {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("successfuly");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, results){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, results){
    if (!err) {
      if (!results) {
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName)
      } else {
        res.render("list", {listTitle: customListName, newListItems: results.items})
      }
    }
  })


})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
