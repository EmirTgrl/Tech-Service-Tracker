const { v4: uuidv4 } = require("uuid");

const generateTrackingCode = () => {
  const baseCode = uuidv4().replace(/-/g, "").substring(0, 10).toUpperCase();

  const part1 = baseCode.substring(0, 5);
  const part2 = baseCode.substring(5, 10);

  return `SRV-${part1}-${part2}`;
};

module.exports = { generateTrackingCode };
