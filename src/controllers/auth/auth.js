import "dotenv/config";
import jwt from "jsonwebtoken";
import User from "../../models/user.js";

const generateTokens = (user) => {
  console.log(user);
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("Missing token secrets in environment variables.");
  }

  const accessToken = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      ...(user.role === "SALEOFFICER" && {
        assignedRegion: user.assignedRegion,
      }),
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "30d" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "30d" }
  );
  console.log(accessToken, refreshToken);
  return { accessToken, refreshToken }; // Return both tokens as an object
};

export const login = async (req, reply) => {
  console.log("Request body:", req.body);

  const { email, password } = req.body;

  // ✅ Validate required fields
  if (!email || !password) {
    return reply.status(400).send({
      message: "Email and Password are required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return reply.status(401).send({
        message: "Invalid credentials. User not found.",
      });
    }

    // ✅ Plain text password comparison
    if (user.password !== password) {
      return reply.status(401).send({
        message: "Invalid credentials. Incorrect password.",
      });
    }

    // ✅ Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // ✅ Send success response
    return reply.status(200).send({
      message: `${user.role} login successful`,
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    console.error("Error during login:", err);
    return reply.status(500).send({
      message: "An error occurred",
      error: err.message,
    });
  }
};

export const createUser = async (request, reply) => {
  const { role, name, email, password } = request.body;

  // ✅ Validate required fields
  if (!role || !name || !email || !password) {
    return reply.status(400).send({
      message: "All fields (role, name, email, password) are required",
    });
  }

  try {
    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.status(409).send({
        message: "User with this email already exists",
      });
    }

    // ✅ Create user
    const user = new User({
      role,
      name,
      email,
      password, // plain text (not secure)
    });

    await user.save();

    return reply.status(201).send({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return reply.status(500).send({
      message: "An error occurred",
      error: error.message,
    });
  }
};

export const changePassword = async (req, reply) => {
  try {
    const { userId, role } = req.user; // decoded from token
    const { employeeId, newPassword } = req.body;

    // Only admins are allowed
    if (role !== "ADMIN") {
      return reply.code(403).send({ message: "Access denied. Admins only." });
    }

    if (!employeeId || !newPassword || newPassword.length < 6) {
      return reply.code(400).send({
        message: "Employee ID and a valid password (min 6 characters) are required.",
      });
    }

    // Find employee
    const employee = await User.findOne({ _id: employeeId, role: "EMPLOYEE" });
    if (!employee) {
      return reply.code(404).send({ message: "Employee not found." });
    }

    // Update password
    employee.password = newPassword; // hash it if using bcrypt (see below)
    employee.updatedAt = new Date();
    await employee.save();

    return reply.code(200).send({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    return reply.code(500).send({ message: "Server error changing password." });
  }
};

export const fetchEmployee = async (req, reply) => {
  const { userId, role } = req.user;

  if (role !== "ADMIN") {
    return reply.code(403).send({ message: "Access denied. Admins only." });
  }

  try {
    const { name } = req.query;

    const filter = {
      role: "EMPLOYEE",
      ...(name && {
        name: { $regex: name, $options: "i" }, // case-insensitive match
      }),
    };

    const employees = await User.find(filter);
    return reply.send({
      message: "Employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return reply
      .code(500)
      .send({ message: "Server error while fetching employees." });
  }
};

export const refreshToken = async (req, reply) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return reply.status(401).send({ message: "Refresh token Required" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    let user;
    if (decoded.role === "ADMIN") {
      user = await User.findById(decoded.userId);
    } else if (decoded.role === "EMPLOYEE") {
      user = await User.findById(decoded.userId);
    } else {
      return reply.status(403).send({ message: "Invalid Role" });
    }
    if (!user) {
      return reply.status(403).send({ message: "Invalid refresh token" });
    }
    const accessToken = generateTokens(user);
    // const newRefreshToken = newRefreshToken(user);
    return reply.send({
      message: "Token Refreshed",
      accessToken,
      // refreshToken: newRefreshToken,
    });
  } catch (error) {
    return reply
      .status(403)
      .send({ message: "Invalid refresh token or other error", error });
  }
};

export const fetchUser = async (req, reply) => {
  const { userId, role } = req.user;
  console.log("fetchUser", userId, role);
  try {
    console.log(req.user);
    const { userId, role } = req.user; // Destructure userId and role from req.user
    let user;
    if (role === "ADMIN") {
      user = await User.findById(userId);
    } else if (role === "EMPLOYEE") {
      user = await User.findById(userId);
    } else {
      return reply.status(403).send({ message: "Invalid Role" });
    }
    if (!user) {
      return reply.status(404).send({ message: "User not found" });
    }
    return reply.send({ message: "User fetched successfully", user });
  } catch (error) {
    return reply.status(500).send({ message: "An error occurred", error });
  }
};
