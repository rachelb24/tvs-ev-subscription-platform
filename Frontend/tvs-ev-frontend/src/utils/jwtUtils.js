// src/utils/jwtUtils.js
export function decodeToken(token) {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded; // e.g. { sub: "email", roles: [...], iat: ..., exp: ... }
    } catch (err) {
      console.error("Failed to decode token:", err);
      return null;
    }
  }
  