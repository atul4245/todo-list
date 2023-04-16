const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
const schema = mongoose.Schema;

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});
const itemSchema = new schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
  name:"to-do list"
});
const item2 = new Item({
  name:"hit the + button"
});
const item3 = new Item({
  name:"-- hit this to delete an item"
});
const defaultItems = [item1, item2, item3];

const listSchema = new schema({
  name: String,
  items: [itemSchema]
})
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
  //to get the date in date string format.
  var today = new Date();
  var options = {
    weekday : "long",
    day : "numeric",
    year : "numeric",
    month : "long"
  };
  var day = today.toLocaleDateString("en-US", options);
  //to insert deafultitems in model item
  Item.find({})
    .then(docs=>{
      if (docs.length === 0 ){
        Item.insertMany(defaultItems)
          .then(docs=>{
            console.log("saved successfully documents =", docs.length);
          })
          .catch(err=>{
            console.log(err);
          })
          res.redirect("/");
      }else{
        res.render("list", {listTitle:day, newitems:docs});
      }
    })
});
app.get("/:customList", function(req, res){
  const customListName = _.capitalize(req.params.customList);
  List.findOne({name:customListName})
    .then(docs=>{
      //console.log(docs);
      if(!docs){
        const list = new List({
          name:customListName,
          items:defaultItems
        })
        list.save();
        res.redirect("/"+customListName);
      }else{
        res.render("list", {listTitle:docs.name, newitems:docs.items});
      }
    })
    .catch(err=>{
      console.log(err);
    })

});

app.post("/", function(req, res){
  var today = new Date();
  var options = {
    weekday : "long",
    day : "numeric",
    year : "numeric",
    month : "long"
  };
  var day = today.toLocaleDateString("en-US", options);
  console.log(req.body);
  var item = req.body.newitem;
  var listname = req.body.list;

  const newitem = new Item({name:item});

  if(listname === day){
    newitem.save();
    res.redirect("/");
  }else{
    List.findOne({name:listname})
    .then(result=>{
      result.items.push(newitem);
      result.save();
      res.redirect("/"+listname);
    })
  }

});
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  List.updateOne({name:listName},{$pull:{items:{_id:checkedItemId}}})
    .then(result=>{console.log(result);});
  res.redirect("/" + listName);
});

app.listen(3000, function(){
  console.log("Server started on port 3000.")
});
