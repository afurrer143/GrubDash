const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: orders });
}

// in middle ware when I export, just call this function with each prop of dishes (so: deliverTo, mobileNumber, status, and dishes (Note, dishes has a new proper called quantity now) ((ID will be made using the nextId functio)))
// note only checks if it exist, not if it has anything in it or is valid, so need seperate function for that
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

//   Call this function with the text props, so deliverTo, and mobileNumber
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

// I will need dish validation, this is a plain copy and paste of a dish. And done on purpose, so it will have a quanity just pasted in it, not generated
function dishIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const needParams = [
    "id",
    "name",
    "description",
    "image_url",
    "price",
    "quantity",
  ];
  //   if dish is array with length less than 0, error out
  if (!Array.isArray(dishes) || dishes.length <= 0) {
    return next({
      status: 400,
      message: `Must include at least one dish`,
    });
  }

  //   loop through the dishes, and then from there loop through needParams and check the dishes has them
  for (let i = 0; i < dishes.length; i++) {
    let currentDish = dishes[i];
    for (let j = 0; j < needParams.length; j++) {
      let currentParam = needParams[j];
      if (currentDish[currentParam] === undefined) {
        next({
          status: 400,
          message: `Dish array index ${i} must contain a ${currentParam}`,
        });
      }
    }
  }
  return next();
}

function dishQuantityIsValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    for (let i = 0; i < dishes.length; i ++) {
        let quantity = dishes[i].quantity
        if (Number.isInteger(quantity) === false || quantity <= 0) {
            return next({
                status: 400,
                message: `Dish array index ${i} quantity must be number above 0`
            })
        }
    }
    return next()
}

function create(req, res, next) {
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
    const { orderId } = req.params
    const foundOrder = orders.find((currentOrder, index) => {
        if (currentOrder.id === orderId) {
            res.locals.index = index
            return currentOrder
        }
    })
    if (foundOrder) {
        res.locals.order = foundOrder
        return next()
    }
    return next({
        status: 404,
        message: `Order Id not found ${orderId}`
    })
}

function read(req, res, next) {
    res.json({ data: res.locals.order})
}

function statusIsValid(req, res, next) {
    const { data: {status} = {}} = req.body
    const validStatus = [
        "pending", "preparing", "out-for-delivery", "delivered"
    ]
    if (validStatus.includes(status)) {
        return next()
    }
    next({
        status:400,
        message: `Value of status must be one of ${validStatus}. Recieve ${status}`
    })
}

function IDisValid(req, res, next) {
    const { data: { id } = {} } = req.body; //From the Request
    const { orderId } = req.params; //from URL
    const foundOrder = res.locals.order; //the found order from earlier (idk if i need this one)
    //If ID is null return next
    // console.log(id);
    // console.log(dishesId);
    if (!id) {
      return next();
      // If the id matches the url id, return next
    } else if (id === orderId) {
      return next();
    } else {
      return next({
        status: 400,
        message: `id must stay the same. Current id is ${orderId}. You have ${id}`,
      });
    }
  }

function update (req, res) {
    const foundOrder = res.locals.order
    const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;

    foundOrder.deliverTo = deliverTo
    foundOrder.mobileNumber = mobileNumber
    foundOrder.status = status
    foundOrder.dishes = dishes

    res.json({ data: foundOrder})
}

function isPendingStatus (req, res, next) {
    const foundOrder = res.locals.order
    let status = foundOrder.status
    if (status !== "pending") {
        next ({
            status: 400,
            message: `An order cannot be deleted unless it has a status of pending. Current status is ${status}`
        })
    }
    return next()
}

function destroy (req, res) {
    const deletedOrder = orders.splice(res.locals.index, 1)
    res.sendStatus(204)
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    textPropIsNotEmpty("deliverTo"),
    textPropIsNotEmpty("mobileNumber"),
    dishIsValid,
    dishQuantityIsValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    IDisValid,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    textPropIsNotEmpty("deliverTo"),
    textPropIsNotEmpty("mobileNumber"),
    statusIsValid,
    dishIsValid,
    dishQuantityIsValid,
    update,
  ],
  delete: [orderExists, isPendingStatus,  destroy]
};
