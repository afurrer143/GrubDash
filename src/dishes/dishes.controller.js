const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: dishes });
}

// in middle ware when I export, just call this function with each prop of dishes (so: name, description, price, and image_url ((ID will be made using the nextId functio)))
// note only checks if it exist, not if it has anything in it or is valid, so need seperate function for that
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    //   i theoretically could add something to the if to check the text props are not empty, but I feel like a very basic, almost impossible to break function that just checks if the props are there is for the best. Especially when I get into databases
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

//   Call this function with the text props, so name, description, image_url
function textPropIsNotEmpty(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && data[propertyName].trim().length !== 0) {
      return next();
    } else {
      return next({
        status: 400,
        message: `Must include a ${propertyName}`,
      });
    }
  };
}

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (typeof price !== "number" || price <= 0) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  return next();
}

function IDisValid(req, res, next) {
  const { data: { id } = {} } = req.body; //From the Request
  const { dishesId } = req.params; //from URL
  const foundDish = res.locals.dish; //the found dish from earlier (idk if i need this one)
  //If ID is null return next
  // console.log(id);
  // console.log(dishesId);
  if (!id) {
    return next();
    // If the id matches the url id, return next
  } else if (id === dishesId) {
    return next();
  } else {
    return next({
      status: 400,
      message: `id must stay the same. Current id is ${dishesId}. You have ${id}`,
    });
  }
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExist(req, res, next) {
  const { dishesId } = req.params;
  const foundDish = dishes.find((currentDish, index) => {
    if (currentDish.id === dishesId) {
      // saving index, can use for delete function
      res.locals.index = index;
      return currentDish;
    }
  });
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  return next({
    status: 404,
    message: `Dish Id not found: ${dishesId}`,
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const foundDish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  res.json({ data: foundDish });
}



module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    textPropIsNotEmpty("name"),
    textPropIsNotEmpty("description"),
    textPropIsNotEmpty("image_url"),
    priceIsValid,
    create,
  ],
  read: [dishExist, read],
  update: [
    dishExist,
    IDisValid,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    textPropIsNotEmpty("name"),
    textPropIsNotEmpty("description"),
    textPropIsNotEmpty("image_url"),
    priceIsValid,
    update,
  ],
};
