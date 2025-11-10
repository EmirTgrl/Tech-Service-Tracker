const prisma = require("../db");

const getAllCustomers = async (req, res) => {
  const { search, page = 1, limit = 10, includeInactive } = req.query;

  const where = {
    isActive: includeInactive === "true" ? undefined : true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;

  try {
    const [customers, totalCount] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { devices: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      data: customers,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / take),
        currentPage: pageNum,
        itemsPerPage: take,
      },
    });
  } catch (error) {
    console.error("Customer listing error:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const createCustomer = async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone) {
    return res
      .status(400)
      .json({ error: "Customer name and phone is required." });
  }
  try {
    const newCustomer = await prisma.customer.create({
      data: { name, phone, email },
      include: {
        _count: {
          select: { devices: true },
        },
      },
    });
    res.status(201).json(newCustomer);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "This telephone number or email address is already registered.",
      });
    }
    res.status(500).json({ error: "The customer could not be created." });
  }
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, isActive } = req.body;
  try {
    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { name, phone, email, isActive },
      include: {
        _count: {
          select: { devices: true },
        },
      },
    });
    res.json(updatedCustomer);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Customer not found." });
    }
    if (error.code === "P2002") {
      return res.status(409).json({
        error:
          "This telephone number/email address already belongs to another customer.",
      });
    }
    res.status(500).json({ error: "The customer could not be updated." });
  }
};

const getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        devices: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { devices: true },
        },
      },
    });
    if (!customer)
      return res.status(404).json({ error: "Customer not found." });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
};

const deactivateCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });
    res
      .status(200)
      .json({ message: "The customer has been successfully deactivated." });
  } catch (error) {
    res.status(500).json({ error: "The customer could not be deactivated." });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
};
