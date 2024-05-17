const { BookingService } = require("../services");
const { StatusCodes } = require("http-status-codes");
const { ErrorResponse, SuccessResponse } = require("../utils/common");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/server-config");

const inMemDb = {};

async function createBooking(req, res) {
  try {
    const response = await BookingService.createBooking({
      flightId: req.body.flightId,
      userId: req.body.userId,
      noOfSeats: req.body.noOfSeats,
    });
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}

async function makePayment(req, res) {
  try {
    const idempotencyKey = req.headers["x-idempotency-key"];
    if (!idempotencyKey) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "idempotency key missing" });
    }
    if (inMemDb[idempotencyKey]) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Cannot retry on a successful payment" });
    }
    const token = req.headers["x-access-token"];
    if (!token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "You must be logged in to make the payment" });
    }

    let tokenUserEmail, tokenUserId;
    try {
      const decodedToken = jwt.verify(token, JWT_SECRET);
      tokenUserEmail = decodedToken.email;
      tokenUserId = decodedToken.id;
      if (!tokenUserEmail) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Invalid token" });
      }
    } catch (error) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid token" });
    }

    if (tokenUserId != req.body.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message:
          "You must be logged with the correct account. Use same account used for booking",
      });
    }

    const response = await BookingService.makePayment({
      totalCost: req.body.totalCost,
      userId: req.body.userId,
      bookingId: req.body.bookingId,
      userEmail: tokenUserEmail,
    });
    inMemDb[idempotencyKey] = idempotencyKey;
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}

module.exports = {
  createBooking,
  makePayment,
};
