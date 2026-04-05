const { ApiError } = require("../utils/apiError");
const { signToken } = require("../utils/jwt");
const { hashPassword, comparePassword } = require("../utils/password");
const {
  findUserByEmail,
  createUser,
  countUsers,
  findUserById,
  findUserWithPasswordById,
  updateUserPassword
} = require("../models/user.model");

async function register(req, res, next) {
  try {
    const userExists = await findUserByEmail(req.body.email);
    if (userExists) {
      throw new ApiError(409, "Email already registered");
    }

    const totalUsers = await countUsers();
    const isFirstUser = totalUsers === 0;
    if (!isFirstUser) {
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can create new users");
      }
    }

    const password_hash = await hashPassword(req.body.password);
    const user = await createUser({
      name: req.body.name,
      email: req.body.email,
      password_hash,
      role: isFirstUser ? "admin" : req.body.role || "viewer",
      is_active: req.body.is_active ?? true,
      is_primary_admin: isFirstUser
    });

    res.status(201).json({
      success: true,
      message: isFirstUser
        ? "First user created as admin"
        : "User created successfully",
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const user = await findUserByEmail(req.body.email);
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }
    if (!user.is_active) {
      throw new ApiError(403, "User is inactive");
    }

    const passwordMatch = await comparePassword(req.body.password, user.password_hash);
    if (!passwordMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_primary_admin: user.is_primary_admin
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

// Any signed-in user can change their own password (viewer, analyst, admin). 
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const row = await findUserWithPasswordById(req.user.id);
    if (!row) throw new ApiError(404, "User not found");

    const ok = await comparePassword(currentPassword, row.password_hash);
    if (!ok) throw new ApiError(403, "Current password is incorrect.");

    const password_hash = await hashPassword(newPassword);
    await updateUserPassword(row.id, password_hash);
    res.json({ success: true, message: "Your password has been updated." });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, me, changePassword };
