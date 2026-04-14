import { Restaurant, Order } from '../models/models.js'
import { Op } from 'sequelize'

const checkRestaurantOwnership = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId)
    if (req.user.id === restaurant.userId) {
      return next()
    }
    return res.status(403).send('Not enough privileges. This entity does not belong to you')
  } catch (err) {
    return res.status(500).send(err)
  }
}
const restaurantHasNoOrders = async (req, res, next) => {
  try {
    const numberOfRestaurantOrders = await Order.count({
      where: { restaurantId: req.params.restaurantId }
    })
    if (numberOfRestaurantOrders === 0) {
      return next()
    }
    return res.status(409).send('Some orders belong to this restaurant.')
  } catch (err) {
    return res.status(500).send(err.message)
  }
}

const checkUnlimitedLimit = async (req, res, next) => {
  try {
    if (req.body.isUnlimited === true) { // si ejecutas el middleware antes de la validación habría que agregar esta cláusula || req.body.isUnlimited === 'true') {
      const unlimitedCount = await Restaurant.count({
        where: {
          userId: req.user.id,
          isUnlimited: true,
          id: { [Op.ne]: req.params.restaurantId ? req.params.restaurantId : -1 }
        }
      })
      if (unlimitedCount >= 3) {
        return res.status(409).send('Un propietario no puede tener más de 3 restaurantes ilimitados.')
      }
    }
    next()
  } catch (err) {
    return res.status(500).send(err)
  }
}

const checkToggleUnlimitedLimit = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId)
    req.body.isUnlimited = !restaurant.isUnlimited
    checkUnlimitedLimit(req, res, next)
  } catch (err) {
    return res.status(500).send(err)
  }
}

export { checkRestaurantOwnership, restaurantHasNoOrders, checkUnlimitedLimit, checkToggleUnlimitedLimit }
