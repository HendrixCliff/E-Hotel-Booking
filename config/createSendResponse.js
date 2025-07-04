require("dotenv").config({path: "./config.env"})

function getMaxAge() {
  const maxAge = parseInt(process.env.LOGIN_EXPIRES, 10);
  if (isNaN(maxAge)) {
    console.warn(
      "LOGIN_EXPIRES environment variable is not a valid number. Defaulting to 1 hour."
    );
    return 3600000; // 1 hour in milliseconds
  }
  return maxAge * 1000; // Convert seconds to milliseconds
}

const createSendResponse = (user, statusCode, req, res) => {
  try {
    const maxAge = getMaxAge();

    // Remove sensitive data before sending user info
    const userResponse = user.toObject ? user.toObject() : { ...user };
    delete userResponse.password;

    // Send the response
    res.status(statusCode).json({
      status: "success",
      data: {
        user: userResponse,
        sessionID: req.sessionID, // Include session ID for debugging if needed
      },
    });

  } catch (err) {
    console.error("❌ Error during response creation:", err.message);
    res.status(500).json({
      status: "error",
      message: "Internal server error during session creation",
    });
  }
};

module.exports = { createSendResponse };
