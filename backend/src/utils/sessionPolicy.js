import config from "../config.js";

const sessionPolicy = {
  getSessionConfig() {
    return {
      name: config.cookie.name,
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.cookie.secure,
        httpOnly: true,
        sameSite: config.cookie.secure ? "strict" : "lax",
        maxAge: config.cookie.maxAgeMs,
      },
    };
  },
};

export default sessionPolicy;
