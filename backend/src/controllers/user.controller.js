const { ApiError } = require("../utils/apiError");
const {
  createUser,
  listUsers,
  findUserByEmail,
  findUserById,
  updateUser,
  updateUserPassword,
  deactivateUser,
  softRemoveUser,
  findUserWithPasswordById,
  emailTakenByOther
} = require("../models/user.model");
const { hashPassword, comparePassword } = require("../utils/password");

async function verifyActorPassword(actorId, plainPassword) {
  const actor = await findUserWithPasswordById(actorId);
  if (!actor) throw new ApiError(401, "Session invalid. Please sign in again.");
  const ok = await comparePassword(plainPassword, actor.password_hash);
  if (!ok) throw new ApiError(403, "Password is incorrect. Try again or check caps lock.");
}

async function getUsers(req, res, next) {
  try {
    const users = await listUsers(req.query);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await findUserById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

async function createUserByAdmin(req, res, next) {
  try {
    const existing = await findUserByEmail(req.body.email);
    if (existing) {
      throw new ApiError(409, "That email is already registered. Use a different email.");
    }
    const password_hash = await hashPassword(req.body.password);
    const user = await createUser({
      name: req.body.name,
      email: req.body.email,
      password_hash,
      role: req.body.role,
      is_active: req.body.is_active ?? true,
      is_primary_admin: false
    });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

async function patchUser(req, res, next) {
  try {
    const id = req.params.id;
    const { currentPassword, name, email, role, is_active } = req.body;

    const target = await findUserById(id);
    if (!target) throw new ApiError(404, "User not found");

    const actor = await findUserById(req.user.id);
    if (!actor) throw new ApiError(401, "Session invalid. Please sign in again.");

    await verifyActorPassword(req.user.id, currentPassword);

    // Primary admin is a protected account: only another primary admin may change its email.
    if (target.is_primary_admin && !actor.is_primary_admin) {
      if (email !== undefined) {
        const nextEmail = String(email).trim().toLowerCase();
        const curEmail = String(target.email).trim().toLowerCase();
        if (nextEmail !== curEmail) {
          throw new ApiError(403, "Only the primary administrator can change the primary admin's email.");
        }
      }
    }

    if (target.is_primary_admin) {
      if (role !== undefined && role !== "admin") {
        throw new ApiError(
          403,
          "The primary administrator must keep the admin role. You cannot demote this account."
        );
      }
      if (is_active === false) {
        throw new ApiError(403, "The primary administrator account cannot be deactivated.");
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) {
      if (await emailTakenByOther(email, id)) {
        throw new ApiError(409, "That email is already used by another user.");
      }
      updates.email = email;
    }
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    const updated = await updateUser(id, updates);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

// Sets is_active = false (user can be re-activated later). 
async function deleteUser(req, res, next) {
  try {
    const id = req.params.id;
    const { currentPassword } = req.body;

    const target = await findUserById(id);
    if (!target) throw new ApiError(404, "User not found");

    await verifyActorPassword(req.user.id, currentPassword);

    if (target.is_primary_admin) {
      throw new ApiError(403, "The primary administrator cannot be deactivated.");
    }
    if (id === String(req.user.id)) {
      throw new ApiError(400, "You cannot deactivate your own account from the team panel. Ask another admin.");
    }

    const ok = await deactivateUser(id);
    if (!ok) throw new ApiError(404, "User not found");
    res.json({ success: true, message: "User has been deactivated. They can no longer sign in." });
  } catch (error) {
    next(error);
  }
}

// Soft-delete: user is removed from the org and cannot sign in (data kept for audit).
async function removeUser(req, res, next) {
  try {
    const id = req.params.id;
    const { currentPassword } = req.body;

    const target = await findUserById(id);
    if (!target) throw new ApiError(404, "User not found");

    await verifyActorPassword(req.user.id, currentPassword);

    if (target.is_primary_admin) {
      throw new ApiError(403, "The primary administrator cannot be removed.");
    }

    // Non-primary admins may remove their own account; the client should sign them out afterward.

    const ok = await softRemoveUser(id);
    if (!ok) throw new ApiError(404, "User not found or already removed.");
    res.json({
      success: true,
      message: "User removed from the organization. Their login no longer works."
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin sets a new password for viewers/analysts. Another admin's password cannot be changed here
 * (they use PATCH /api/auth/password). Admins may use this route for their own user id as well,
 * but the account screen uses /api/auth/password for self-service.
 */
async function changeUserPassword(req, res, next) {
  try {
    const id = req.params.id;
    const { currentPassword, newPassword } = req.body;

    const target = await findUserById(id);
    if (!target) throw new ApiError(404, "User not found");

    const targetIsAdmin = target.role === "admin";
    const sameAccount = String(target.id) === String(req.user.id);
    if (targetIsAdmin && !sameAccount) {
      throw new ApiError(
        403,
        "You cannot change another administrator's password. They can update it under Account → Change password."
      );
    }

    await verifyActorPassword(req.user.id, currentPassword);

    const password_hash = await hashPassword(newPassword);
    await updateUserPassword(id, password_hash);
    res.json({ success: true, message: "Password updated for this user." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUserByAdmin,
  patchUser,
  deleteUser,
  removeUser,
  changeUserPassword
};
